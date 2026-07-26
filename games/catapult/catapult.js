// CATAPULT — Burgen-Duell als Retro-Console-Spielmodul
window.RetroGames = window.RetroGames || {};

window.RetroGames.catapult = {
  name: 'CATAPULT',
  tagline: '1–2 SPIELER · BURGEN-DUELL',
  minPlayers: 1,
  maxPlayers: 2,

  // Preview-Grafik für die Menü-Karte (inline SVG)
  artSvg: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">
      <rect width="320" height="200" fill="#0a0e14"/>
      <circle cx="42"  cy="26" r="1.5" fill="#fffde7" opacity="0.7"/>
      <circle cx="118" cy="18" r="1.5" fill="#fffde7" opacity="0.5"/>
      <circle cx="204" cy="30" r="1.5" fill="#fffde7" opacity="0.6"/>
      <circle cx="286" cy="20" r="1.5" fill="#fffde7" opacity="0.5"/>
      <text x="160" y="20" font-family="'Press Start 2P','Courier New',monospace" font-size="8" fill="#ffb300" text-anchor="middle" opacity="0.85">&#8592; WIND</text>
      <path d="M78 148 Q160 34 274 118" stroke="#ffb300" stroke-width="1.6" fill="none" stroke-dasharray="4 5" opacity="0.55"/>
      <circle cx="150" cy="52" r="5" fill="#ffb300"/>
      <polygon points="160,88 128,170 192,170" fill="#1b2430" stroke="#2c3a4c" stroke-width="1.5"/>
      <rect x="22"  y="146" width="34" height="24" fill="#4fc3f7" opacity="0.9"/>
      <rect x="22"  y="122" width="34" height="24" fill="#4fc3f7" opacity="0.72"/>
      <rect x="30"  y="98"  width="18" height="24" fill="#4fc3f7" opacity="0.72"/>
      <rect x="30"  y="80"  width="18" height="18" fill="#4fc3f7" opacity="0.55"/>
      <rect x="273" y="146" width="34" height="24" fill="#f48fb1" opacity="0.9"/>
      <rect x="273" y="122" width="34" height="24" fill="#f48fb1" opacity="0.72"/>
      <rect x="281" y="98"  width="18" height="24" fill="#f48fb1" opacity="0.72"/>
      <polygon points="70,170 88,170 84,152 74,152" fill="#4fc3f7" opacity="0.85"/>
      <line x1="79" y1="156" x2="94" y2="140" stroke="#4fc3f7" stroke-width="2.5" stroke-linecap="round"/>
      <polygon points="232,170 250,170 246,152 236,152" fill="#f48fb1" opacity="0.85"/>
      <line x1="241" y1="156" x2="226" y2="140" stroke="#f48fb1" stroke-width="2.5" stroke-linecap="round"/>
      <rect x="0" y="170" width="320" height="30" fill="#161d26"/>
      <line x1="0" y1="170" x2="320" y2="170" stroke="#2c3a4c" stroke-width="2"/>
    </svg>
  `,

  create(ctx, W, H, numPlayers, api) {
    const COL = ['#4fc3f7', '#f48fb1'];   // P1 Cyan, P2 Pink
    const AMBER = '#ffb300';
    const SKY_TOP = '#0a0e14', SKY_BOT = '#141b24';
    const ROCK = '#1b2430', ROCK_EDGE = '#2c3a4c';

    const MATCH_TIME = 300;     // Sekunden bis Zeitablauf
    const RELOAD     = 2.0;     // Nachladezeit nach dem Schuss
    const CHARGE_T   = 1.1;     // Sekunden von 0 auf volle Kraft
    const ANGLE_MIN  = 15, ANGLE_MAX = 75;
    const ANGLE_RATE = 48;      // Grad/s bei Dpad-/Tastatur-Steuerung
    const WIND_EVERY = 7;       // Sekunden bis ein neuer Zielwind gewürfelt wird
    const AI_ANGLE_ERR = 7;     // Grad Streuung auf den KI-Zielwinkel
    const AI_POWER_ERR = 0.11;  // relative Streuung auf die KI-Kraft
    // Denkpause vor jedem KI-Schuss. Wirksamster Hebel für die Spiellänge:
    // eine bedächtige KI lässt dem Menschen Zeit, ohne schlecht zu zielen.
    const AI_THINK_MIN = 1.4, AI_THINK_VAR = 1.8;

    // Burg-Aufbau von unten nach oben. Jedes Segment fliegt beim ersten
    // Treffer weg; erst wenn alle vier abgeräumt sind, ist die Burg gefallen.
    const SEG_DEF = [
      { key: 'KERN',  wide: true,  hp: 1, hf: 1.0 },
      { key: 'MAUER', wide: true,  hp: 1, hf: 1.0 },
      { key: 'TURM',  wide: false, hp: 1, hf: 1.0 },
      { key: 'ZINNE', wide: false, hp: 1, hf: 0.8 }
    ];

    let w = W, h = H;

    // Sterne als Bruchteile der Canvas-Größe — überleben jedes resize()
    const stars = Array.from({ length: 46 }, () => ({
      fx: Math.random(),
      fy: Math.random() * 0.55,
      r: Math.random() < 0.8 ? 1 : 1.6,
      a: 0.25 + Math.random() * 0.5
    }));

    // ── Maße proportional zur Canvas-Größe ───────────────
    function dims() {
      const groundY = h * 0.86;
      const grav = h * 1.25;
      return {
        groundY,
        grav,
        segH: h * 0.072,
        wideW: w * 0.085,
        narrowW: w * 0.05,
        castleX: [w * 0.105, w * 0.895],
        catX: [w * 0.235, w * 0.765],
        catY: groundY - h * 0.028,
        mtnX: w * 0.5,
        mtnHalf: w * 0.075,
        mtnH: h * 0.30,
        ballR: Math.max(4, h * 0.014),
        // Maximale Mündungsgeschwindigkeit: Reichweite 1,25×Bildbreite bei 45°
        maxV: Math.sqrt(w * 1.25 * grav)
      };
    }
    const minV = () => dims().maxV * 0.3;

    // ── Zustand ──────────────────────────────────────────
    const state = {
      phase: 'play',
      timeLeft: MATCH_TIME,
      wind: 0, windTarget: 0, windTimer: WIND_EVERY,
      players: [], castles: [], shots: [], bits: [],
      winner: 0,          // 0 = offen, 1/2 = Spieler, -1 = unentschieden
      shake: 0,
      t: 0                // Laufzeit, treibt die Flaggen-Animation
    };

    function init() {
      state.phase = 'play';
      state.timeLeft = MATCH_TIME;
      state.wind = 0;
      state.windTarget = (Math.random() * 2 - 1) * 0.8;
      state.windTimer = WIND_EVERY;
      state.shots = [];
      state.bits = [];
      state.winner = 0;
      state.shake = 0;
      state.t = 0;
      state.players = [0, 1].map(() => ({
        angle: 45, power: 0, charging: false, reload: 0,
        angleDir: 0, arm: 0, damage: 0,
        tick: 0,                 // Timer für den Lade-Ratschen-Sound
        aiPower: 0, aiWait: 0
      }));
      state.castles = [0, 1].map(() =>
        SEG_DEF.map(d => ({ def: d, hp: d.hp }))
      );
    }
    init();

    // ── Audio ────────────────────────────────────────────
    // Globaler AudioContext aus der Console (im Boot-Gesture erstellt).
    const audioCtx = api.audioCtx;
    let noiseBuf = null;
    function ensureAudio() {
      if (!audioCtx) return false;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      if (!noiseBuf) {
        noiseBuf = audioCtx.createBuffer(1, audioCtx.sampleRate * 0.4, audioCtx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      }
      return true;
    }
    function blip(freq, dur, type = 'square', vol = 0.15) {
      if (!ensureAudio()) return;
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type; osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + dur);
    }
    function sweep(f0, f1, dur, type = 'square', vol = 0.15) {
      if (!ensureAudio()) return;
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + dur);
    }
    // Gefiltertes Rauschen — gibt Einschlägen ihren Wumms
    function thump(dur, vol, cutoff) {
      if (!ensureAudio()) return;
      const t = audioCtx.currentTime;
      const src = audioCtx.createBufferSource();
      const lp = audioCtx.createBiquadFilter();
      const g = audioCtx.createGain();
      src.buffer = noiseBuf;
      lp.type = 'lowpass'; lp.frequency.value = cutoff;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(lp).connect(g).connect(audioCtx.destination);
      src.start(t); src.stop(t + dur);
    }
    const sndTick   = p => blip(170 + p * 430, 0.025, 'square', 0.05);
    const sndFire   = () => { sweep(220, 60, 0.2, 'sawtooth', 0.18); thump(0.14, 0.22, 900); };
    const sndGround = () => thump(0.2, 0.2, 220);
    const sndHit    = () => { blip(330, 0.07, 'square', 0.16); thump(0.14, 0.24, 1400); };
    const sndBreak  = () => { sweep(250, 70, 0.45, 'square', 0.2); thump(0.4, 0.28, 600); };
    const sndWin    = () => [523, 659, 784, 1046, 1319]
      .forEach((f, i) => setTimeout(() => blip(f, 0.2, 'square', 0.18), i * 140));
    const sndTie    = () => { blip(392, 0.6, 'square', 0.12); blip(523, 0.6, 'square', 0.12); };

    // ── Geometrie ────────────────────────────────────────
    // Rechteck eines Burg-Segments. Der Index ist die Stapel-Position:
    // stirbt ein Segment, rutschen die darüber automatisch nach.
    function segRect(pi, slot) {
      const d = dims();
      const segs = state.castles[pi];
      const seg = segs[slot];
      if (!seg) return null;
      const sw = seg.def.wide ? d.wideW : d.narrowW;
      const sh = d.segH * seg.def.hf;
      let base = d.groundY;
      for (let k = 0; k < slot; k++) base -= d.segH * segs[k].def.hf;
      return { x: d.castleX[pi] - sw / 2, y: base - sh, w: sw, h: sh };
    }

    // Oberkante des Berges an Position x (Infinity = kein Berg an dieser Stelle)
    function mountainTop(x) {
      const d = dims();
      const dx = Math.abs(x - d.mtnX);
      if (dx > d.mtnHalf) return Infinity;
      return d.groundY - d.mtnH * (1 - dx / d.mtnHalf);
    }

    function circleHitsRect(cx, cy, r, rc) {
      const nx = Math.max(rc.x, Math.min(cx, rc.x + rc.w));
      const ny = Math.max(rc.y, Math.min(cy, rc.y + rc.h));
      return (cx - nx) ** 2 + (cy - ny) ** 2 <= r * r;
    }

    // Was trifft eine Kugel an dieser Position? null = freie Bahn.
    function collide(x, y, r) {
      const d = dims();
      if (y + r >= d.groundY) return { what: 'ground' };
      if (y + r >= mountainTop(x)) return { what: 'mountain' };
      for (let pi = 0; pi < 2; pi++) {
        const segs = state.castles[pi];
        for (let s = 0; s < segs.length; s++) {
          const rc = segRect(pi, s);
          if (rc && circleHitsRect(x, y, r, rc)) return { what: 'castle', pi, slot: s };
        }
      }
      return null;
    }

    // ── Schuss ───────────────────────────────────────────
    const dirOf = pi => (pi === 0 ? 1 : -1);   // P1 schießt nach rechts, P2 nach links

    function launchVec(pi, angleDeg, power) {
      const d = dims();
      const v = minV() + (d.maxV - minV()) * power;
      const a = angleDeg * Math.PI / 180;
      return { vx: Math.cos(a) * v * dirOf(pi), vy: -Math.sin(a) * v };
    }

    function startCharge(pi) {
      const p = state.players[pi];
      if (p.reload > 0 || p.charging || state.phase !== 'play') return;
      p.charging = true;
      p.power = 0;
      p.tick = 0;
    }

    function fire(pi) {
      const p = state.players[pi];
      if (!p.charging) return;
      const d = dims();
      const { vx, vy } = launchVec(pi, p.angle, p.power);
      state.shots.push({
        x: d.catX[pi], y: d.catY, vx, vy, owner: pi, trail: []
      });
      p.charging = false;
      p.reload = RELOAD;
      p.arm = 1;
      sndFire();
    }

    // Ein Physik-Schritt für eine Kugel (auch von der KI-Simulation genutzt)
    function stepShot(s, dt) {
      const d = dims();
      s.vx += state.wind * d.grav * 0.18 * dt;
      s.vy += d.grav * dt;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
    }

    function spawnBits(x, y, color, n, force) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = force * (0.3 + Math.random() * 0.7);
        state.bits.push({
          x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - force * 0.4,
          life: 0.5 + Math.random() * 0.6, age: 0, color,
          r: Math.max(1.5, h * 0.005) * (0.6 + Math.random())
        });
      }
    }

    function damageSegment(hit, shooter) {
      const segs = state.castles[hit.pi];
      const seg = segs[hit.slot];
      if (!seg) return;
      const rc = segRect(hit.pi, hit.slot);
      seg.hp--;
      // Eigenbeschuss zählt nicht als Schaden auf dem eigenen Konto
      if (shooter !== hit.pi) state.players[shooter].damage++;

      if (seg.hp <= 0) {
        segs.splice(hit.slot, 1);            // darüberliegende Segmente rutschen nach
        spawnBits(rc.x + rc.w / 2, rc.y + rc.h / 2, COL[hit.pi], 26, h * 0.62);
        state.shake = Math.max(state.shake, 0.6);
        sndBreak();
        // Erst die komplett abgeräumte Burg entscheidet das Spiel
        if (segs.length === 0) endMatch(hit.pi === 0 ? 2 : 1);
      } else {
        spawnBits(rc.x + rc.w / 2, rc.y + rc.h / 2, COL[hit.pi], 7, h * 0.3);
        state.shake = Math.max(state.shake, 0.22);
        sndHit();
      }
    }

    function endMatch(winner) {
      if (state.phase === 'gameover') return;
      state.phase = 'gameover';
      state.winner = winner;
      if (winner === -1) sndTie(); else sndWin();
    }

    // ── KI ───────────────────────────────────────────────
    // Zustandsautomat: AIM (Lösung suchen) → CHARGE (laden) → FIRE.
    // Die Lösung entsteht durch Vorwärts-Simulation, damit Wind und Berg
    // automatisch berücksichtigt werden.
    function simulateShot(pi, angleDeg, power) {
      const d = dims();
      const { vx, vy } = launchVec(pi, angleDeg, power);
      const s = { x: d.catX[pi], y: d.catY, vx, vy };
      const dt = 1 / 60;
      for (let i = 0; i < 480; i++) {
        stepShot(s, dt);
        if (s.x < -w * 0.2 || s.x > w * 1.2) return { x: s.x, y: s.y, what: 'out' };
        const c = collide(s.x, s.y, d.ballR);
        if (c) return { x: s.x, y: s.y, what: c.what, pi: c.pi, slot: c.slot };
      }
      return { x: s.x, y: s.y, what: 'timeout' };
    }

    function aimSolution(pi) {
      const ei = 1 - pi;
      const segs = state.castles[ei];
      if (!segs.length) return null;
      // Von oben kommende Bögen treffen das oberste Segment am leichtesten
      const rc = segRect(ei, segs.length - 1);
      if (!rc) return null;
      const tx = rc.x + rc.w / 2;
      const d = dims();
      const dir = dirOf(pi);
      const sx = d.catX[pi];
      const targetProg = (tx - sx) * dir;

      let best = null;
      for (const angle of [45, 52, 58, 64, 70]) {
        let lo = 0, hi = 1;
        for (let it = 0; it < 12; it++) {
          const mid = (lo + hi) / 2;
          const r = simulateShot(pi, angle, mid);
          if ((r.x - sx) * dir < targetProg) lo = mid; else hi = mid;
        }
        const power = (lo + hi) / 2;
        const r = simulateShot(pi, angle, power);
        // Volltreffer auf die gegnerische Burg schlagen jede Näherung
        const err = r.what === 'castle' && r.pi === ei
          ? 0
          : Math.abs((r.x - sx) * dir - targetProg);
        if (!best || err < best.err) best = { angle, power, err };
      }
      if (!best) return null;

      // Unschärfe, damit die KI schlagbar bleibt. Weil jedes Segment schon
      // beim ersten Treffer wegfliegt, entscheidet dieser Wert die Spiellänge.
      return {
        angle: Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, best.angle + (Math.random() * 2 - 1) * AI_ANGLE_ERR)),
        power: Math.max(0.05, Math.min(1, best.power * (1 + (Math.random() * 2 - 1) * AI_POWER_ERR)))
      };
    }

    function runAI(pi, dt) {
      const p = state.players[pi];
      if (p.reload > 0) return;
      if (p.charging) {
        if (p.power >= p.aiPower) fire(pi);
        return;
      }
      p.aiWait -= dt;
      if (p.aiWait > 0) return;
      const sol = aimSolution(pi);
      if (!sol) { p.aiWait = 0.6; return; }
      p.angle = sol.angle;
      p.aiPower = sol.power;
      p.aiWait = AI_THINK_MIN + Math.random() * AI_THINK_VAR;
      startCharge(pi);
    }

    // ── Öffentliche Spielschnittstelle ───────────────────
    return {
      resize(nw, nh) {
        const sx = nw / w, sy = nh / h;
        w = nw; h = nh;
        for (const s of state.shots) {
          s.x *= sx; s.y *= sy; s.vx *= sx; s.vy *= sy;
          s.trail = s.trail.map(t => ({ x: t.x * sx, y: t.y * sy }));
        }
        for (const b of state.bits) { b.x *= sx; b.y *= sy; b.vx *= sx; b.vy *= sy; }
      },

      input(player, gp, prev) {
        if (gp.select && !prev?.select) { api.exit(); return; }

        if (state.phase === 'gameover') {
          if ((gp.a && !prev?.a) || (gp.start && !prev?.start)) init();
          return;
        }

        const pi = player - 1;
        const p = state.players[pi];
        if (!p) return;

        // Winkel: Joystick absolut, Dpad/Tastatur mit Rate
        if (gp.joystick?.active) {
          p.angleDir = 0;
          p.angle = Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, 45 - gp.joystick.y * 30));
        } else {
          p.angleDir = gp.dpad?.up ? 1 : gp.dpad?.down ? -1 : 0;
        }

        // A halten = laden, loslassen = feuern
        if (gp.a && !prev?.a) startCharge(pi);
        if (!gp.a && prev?.a) fire(pi);
      },

      onDisconnect(player) {
        // Laufenden Ladevorgang abbrechen — die KI übernimmt ab dem nächsten Frame
        const p = state.players[player - 1];
        if (p) { p.charging = false; p.angleDir = 0; }
      },

      update(dt) {
        state.t += dt;

        // Partikel und Screenshake laufen auch im Sieger-Screen weiter
        for (let i = state.bits.length - 1; i >= 0; i--) {
          const b = state.bits[i];
          b.age += dt;
          b.vy += dims().grav * 0.55 * dt;
          b.x += b.vx * dt; b.y += b.vy * dt;
          if (b.age >= b.life) state.bits.splice(i, 1);
        }
        state.shake = Math.max(0, state.shake - dt * 1.8);

        if (state.phase === 'gameover') return;

        // Wind driftet weich auf einen neuen Zielwert zu
        state.windTimer -= dt;
        if (state.windTimer <= 0) {
          state.windTarget = (Math.random() * 2 - 1) * 0.9;
          state.windTimer = WIND_EVERY;
        }
        state.wind += (state.windTarget - state.wind) * Math.min(1, dt * 0.9);

        const conns = api.getConns();
        for (let pi = 0; pi < 2; pi++) {
          const p = state.players[pi];

          if (!conns.has(pi + 1)) runAI(pi, dt);

          if (p.angleDir) {
            p.angle = Math.max(ANGLE_MIN, Math.min(ANGLE_MAX, p.angle + p.angleDir * ANGLE_RATE * dt));
          }
          if (p.reload > 0) p.reload = Math.max(0, p.reload - dt);
          if (p.charging) {
            p.power = Math.min(1, p.power + dt / CHARGE_T);
            p.tick -= dt;
            if (p.tick <= 0) { sndTick(p.power); p.tick = 0.1; }
          }
          if (p.arm > 0) p.arm = Math.max(0, p.arm - dt * 3.5);
        }

        // Kugeln in Teilschritten bewegen, damit nichts durch dünne Wände tunnelt
        const d = dims();
        const SUB = 4, sdt = dt / SUB;
        for (let i = state.shots.length - 1; i >= 0; i--) {
          const s = state.shots[i];
          let done = false;
          for (let k = 0; k < SUB && !done; k++) {
            stepShot(s, sdt);
            s.trail.push({ x: s.x, y: s.y });
            if (s.trail.length > 14) s.trail.shift();

            if (s.x < -w * 0.15 || s.x > w * 1.15 || s.y > h * 1.3) { done = true; break; }

            const c = collide(s.x, s.y, d.ballR);
            if (!c) continue;
            done = true;
            if (c.what === 'castle') {
              damageSegment(c, s.owner);
            } else {
              spawnBits(s.x, Math.min(s.y, d.groundY), c.what === 'mountain' ? ROCK_EDGE : '#3a4756', 8, h * 0.28);
              state.shake = Math.max(state.shake, 0.12);
              sndGround();
            }
          }
          if (done) state.shots.splice(i, 1);
        }

        // Zeitablauf → mehr Schaden gewinnt
        state.timeLeft = Math.max(0, state.timeLeft - dt);
        if (state.timeLeft <= 0) {
          const d1 = state.players[0].damage, d2 = state.players[1].damage;
          endMatch(d1 === d2 ? -1 : d1 > d2 ? 1 : 2);
        }
      },

      draw() {
        const d = dims();
        ctx.save();
        if (state.shake > 0) {
          const m = state.shake * h * 0.02;
          ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m);
        }

        // Himmel
        const grad = ctx.createLinearGradient(0, 0, 0, d.groundY);
        grad.addColorStop(0, SKY_TOP);
        grad.addColorStop(1, SKY_BOT);
        ctx.fillStyle = grad;
        ctx.fillRect(-w * 0.05, -h * 0.05, w * 1.1, h * 1.1);

        ctx.fillStyle = '#fffde7';
        for (const s of stars) {
          ctx.globalAlpha = s.a;
          ctx.fillRect(s.fx * w, s.fy * h, s.r, s.r);
        }
        ctx.globalAlpha = 1;

        // Berg
        ctx.fillStyle = ROCK;
        ctx.strokeStyle = ROCK_EDGE;
        ctx.lineWidth = Math.max(2, w * 0.002);
        ctx.beginPath();
        ctx.moveTo(d.mtnX - d.mtnHalf, d.groundY);
        ctx.lineTo(d.mtnX, d.groundY - d.mtnH);
        ctx.lineTo(d.mtnX + d.mtnHalf, d.groundY);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        drawFlag();

        // Boden
        ctx.fillStyle = '#161d26';
        ctx.fillRect(-w * 0.05, d.groundY, w * 1.1, h - d.groundY + h * 0.05);
        ctx.strokeStyle = ROCK_EDGE;
        ctx.beginPath();
        ctx.moveTo(-w * 0.05, d.groundY);
        ctx.lineTo(w * 1.05, d.groundY);
        ctx.stroke();

        for (let pi = 0; pi < 2; pi++) { drawCastle(pi); drawCatapult(pi); }

        // Kugeln mit ausblendender Flugspur
        for (const s of state.shots) {
          for (let i = 0; i < s.trail.length; i++) {
            const t = s.trail[i];
            ctx.globalAlpha = (i / s.trail.length) * 0.4;
            ctx.fillStyle = AMBER;
            ctx.beginPath();
            ctx.arc(t.x, t.y, d.ballR * 0.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
          ctx.fillStyle = AMBER;
          ctx.shadowColor = AMBER;
          ctx.shadowBlur = w * 0.012;
          ctx.beginPath();
          ctx.arc(s.x, s.y, d.ballR, 0, Math.PI * 2);
          ctx.fill();
          ctx.shadowBlur = 0;
        }

        // Trümmer
        for (const b of state.bits) {
          ctx.globalAlpha = Math.max(0, 1 - b.age / b.life);
          ctx.fillStyle = b.color;
          ctx.fillRect(b.x - b.r / 2, b.y - b.r / 2, b.r, b.r);
        }
        ctx.globalAlpha = 1;

        drawHud();
        ctx.restore();

        if (state.phase === 'gameover') drawGameOver();
      },

      destroy() { /* AudioContext gehört der Console, nicht schließen */ }
    };

    // ── Rendering-Helfer ─────────────────────────────────
    // Flagge auf der Bergspitze: zeigt Windrichtung und -stärke dort an,
    // wo die Flugbahnen vorbeikommen. Bei Flaute hängt sie schlaff herunter.
    function drawFlag() {
      const d = dims();
      const px = d.mtnX, py = d.groundY - d.mtnH;
      const poleH = h * 0.1;
      const top = py - poleH;

      ctx.strokeStyle = '#5a6b80';
      ctx.lineWidth = Math.max(2, w * 0.0025);
      ctx.lineCap = 'butt';
      ctx.beginPath();
      ctx.moveTo(px, py);
      ctx.lineTo(px, top);
      ctx.stroke();

      const mag = Math.min(1, Math.abs(state.wind));
      const dir = state.wind >= 0 ? 1 : -1;
      const len = h * 0.022 + mag * h * 0.085;   // Tuch streckt sich mit dem Wind
      const droop = (1 - mag) * h * 0.06;        // …und sackt bei Flaute durch
      const cloth = h * 0.032;
      const amp = mag * h * 0.014;
      const phase = state.t * (3 + mag * 7);

      const edge = (off) => {
        const pts = [];
        for (let i = 0; i <= 10; i++) {
          const t = i / 10;
          pts.push({
            x: px + dir * len * t,
            y: top + off + droop * t * t + Math.sin(t * 4 - phase) * amp * t
          });
        }
        return pts;
      };
      const upper = edge(0), lower = edge(cloth).reverse();

      ctx.beginPath();
      ctx.moveTo(upper[0].x, upper[0].y);
      upper.forEach(p => ctx.lineTo(p.x, p.y));
      lower.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = AMBER;
      ctx.globalAlpha = 0.55 + mag * 0.4;
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    function drawCastle(pi) {
      const segs = state.castles[pi];
      for (let s = 0; s < segs.length; s++) {
        const seg = segs[s];
        const rc = segRect(pi, s);
        if (!rc) continue;
        const wear = seg.hp / seg.def.hp;    // 1 = unversehrt

        ctx.fillStyle = COL[pi];
        ctx.globalAlpha = 0.35 + wear * 0.55;
        ctx.fillRect(rc.x, rc.y, rc.w, rc.h);
        ctx.globalAlpha = 1;

        ctx.strokeStyle = COL[pi];
        ctx.lineWidth = Math.max(1.5, w * 0.0015);
        ctx.strokeRect(rc.x, rc.y, rc.w, rc.h);

        // Risse als Schadensanzeige
        const cracks = seg.def.hp - seg.hp;
        if (cracks > 0) {
          ctx.strokeStyle = '#0a0e14';
          ctx.globalAlpha = 0.75;
          ctx.lineWidth = Math.max(1.5, w * 0.0022);
          for (let c = 0; c < cracks; c++) {
            const fy = rc.y + rc.h * (0.25 + c * 0.25);
            ctx.beginPath();
            ctx.moveTo(rc.x + rc.w * 0.12, fy);
            ctx.lineTo(rc.x + rc.w * 0.45, fy + rc.h * 0.12);
            ctx.lineTo(rc.x + rc.w * 0.7, fy - rc.h * 0.06);
            ctx.stroke();
          }
          ctx.globalAlpha = 1;
        }

        // Zinnenkranz auf dem obersten Segment
        if (s === segs.length - 1) {
          ctx.fillStyle = COL[pi];
          const bw = rc.w / 5;
          for (let i = 0; i < 3; i++) {
            ctx.fillRect(rc.x + bw * (i * 2), rc.y - bw * 0.5, bw, bw * 0.5);
          }
        }
      }
    }

    function drawCatapult(pi) {
      const d = dims();
      const p = state.players[pi];
      const x = d.catX[pi], y = d.catY;
      const dir = pi === 0 ? 1 : -1;
      const base = h * 0.03;

      // Sockel
      ctx.fillStyle = COL[pi];
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.moveTo(x - base * 0.7, d.groundY);
      ctx.lineTo(x + base * 0.7, d.groundY);
      ctx.lineTo(x + base * 0.45, y);
      ctx.lineTo(x - base * 0.45, y);
      ctx.closePath();
      ctx.fill();
      ctx.globalAlpha = 1;

      // Wurfarm: zeigt den Zielwinkel, schnellt beim Schuss nach vorn
      const shown = p.angle + p.arm * 35;
      const a = shown * Math.PI / 180;
      const armLen = h * 0.075 * (1 + p.power * 0.15);
      ctx.strokeStyle = COL[pi];
      ctx.lineWidth = Math.max(2.5, w * 0.0035);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + Math.cos(a) * armLen * dir, y - Math.sin(a) * armLen);
      ctx.stroke();

      // Zielhilfe: gepunktete Linie, Länge = Kraft
      if (p.charging || p.power > 0) {
        ctx.strokeStyle = AMBER;
        ctx.globalAlpha = 0.55;
        ctx.lineWidth = Math.max(1.5, w * 0.002);
        ctx.setLineDash([w * 0.006, w * 0.008]);
        ctx.beginPath();
        ctx.moveTo(x, y);
        const aimLen = h * 0.09 + p.power * h * 0.16;
        ctx.lineTo(x + Math.cos(a) * aimLen * dir, y - Math.sin(a) * aimLen);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.globalAlpha = 1;
      }

      // Kraft- bzw. Nachlade-Balken über dem Katapult
      const bw = w * 0.055, bh = h * 0.014;
      const bx = x - bw / 2, by = y - h * 0.135;
      ctx.fillStyle = '#222';
      ctx.fillRect(bx, by, bw, bh);
      if (p.reload > 0) {
        ctx.fillStyle = '#555';
        ctx.fillRect(bx, by, bw * (1 - p.reload / RELOAD), bh);
      } else {
        ctx.fillStyle = p.power >= 1 ? '#fff' : AMBER;
        ctx.fillRect(bx, by, bw * p.power, bh);
      }
      ctx.strokeStyle = COL[pi];
      ctx.lineWidth = Math.max(1, w * 0.0012);
      ctx.strokeRect(bx, by, bw, bh);

      ctx.fillStyle = COL[pi];
      ctx.globalAlpha = 0.8;
      ctx.font = `${Math.floor(h * 0.026)}px "Press Start 2P", Courier New`;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.round(p.angle)}°`, x, by - h * 0.012);
      ctx.globalAlpha = 1;
    }

    function drawHud() {
      const d = dims();
      const barW = w * 0.19, barH = h * 0.022, top = h * 0.045;

      for (let pi = 0; pi < 2; pi++) {
        const segs = state.castles[pi];
        const cur = segs.reduce((s, x) => s + x.hp, 0);
        const max = SEG_DEF.reduce((s, x) => s + x.hp, 0);
        const bx = pi === 0 ? w * 0.05 : w * 0.95 - barW;

        ctx.fillStyle = '#222';
        ctx.fillRect(bx, top, barW, barH);
        ctx.fillStyle = COL[pi];
        const fw = barW * (cur / max);
        ctx.fillRect(pi === 0 ? bx : bx + barW - fw, top, fw, barH);
        ctx.strokeStyle = COL[pi];
        ctx.lineWidth = Math.max(1, w * 0.0012);
        ctx.strokeRect(bx, top, barW, barH);

        ctx.fillStyle = COL[pi];
        ctx.font = `${Math.floor(h * 0.028)}px "Press Start 2P", Courier New`;
        ctx.textAlign = pi === 0 ? 'left' : 'right';
        ctx.fillText(`P${pi + 1}`, pi === 0 ? bx : bx + barW, top - h * 0.012);

        // Zugefügter Schaden — entscheidet bei Zeitablauf
        ctx.globalAlpha = 0.6;
        ctx.font = `${Math.floor(h * 0.022)}px "Press Start 2P", Courier New`;
        ctx.fillText(`${state.players[pi].damage} TREFFER`,
          pi === 0 ? bx : bx + barW, top + barH + h * 0.035);
        ctx.globalAlpha = 1;
      }

      // Timer
      const t = Math.ceil(state.timeLeft);
      const crit = t <= 10 && Math.floor(state.timeLeft * 3) % 2 === 0;
      ctx.fillStyle = crit ? '#ff5252' : '#fff';
      ctx.font = `${Math.floor(h * 0.042)}px "Press Start 2P", Courier New`;
      ctx.textAlign = 'center';
      ctx.fillText(`${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`, w / 2, top + barH);

    }

    function drawGameOver() {
      ctx.fillStyle = 'rgba(0,0,0,0.82)';
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center';

      const tie = state.winner === -1;
      const col = tie ? '#fff' : COL[state.winner - 1];
      ctx.fillStyle = col;
      ctx.shadowColor = col;
      ctx.shadowBlur = Math.round(w * 0.03);
      ctx.font = `${Math.floor(h * 0.09)}px "Press Start 2P", Courier New`;
      ctx.fillText(tie ? 'UNENTSCHIEDEN' : `SPIELER ${state.winner}`, w / 2, h * 0.42);

      if (!tie) {
        ctx.font = `${Math.floor(h * 0.055)}px "Press Start 2P", Courier New`;
        ctx.fillText('GEWINNT', w / 2, h * 0.54);
      }
      ctx.shadowBlur = 0;

      ctx.fillStyle = '#888';
      ctx.font = `${Math.floor(h * 0.03)}px "Press Start 2P", Courier New`;
      ctx.fillText(`${state.players[0].damage}  ·  ${state.players[1].damage}  TREFFER`, w / 2, h * 0.63);

      ctx.fillStyle = '#555';
      ctx.font = `${Math.floor(h * 0.028)}px "Press Start 2P", Courier New`;
      ctx.fillText('A · NEUSTART', w / 2, h * 0.75);
    }
  }
};
