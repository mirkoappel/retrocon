// STREET SOCCER — Kleinfeld-Fußball aus der Vogelperspektive
// Besonderheit gegenüber den anderen Spielen: P1 und P2 sind hier keine Gegner,
// sondern spielen gemeinsam in einer Mannschaft. Der Gegner ist immer KI.
window.RetroGames = window.RetroGames || {};

window.RetroGames.soccer = {
  name: 'STREET SOCCER',
  tagline: '1–2 SPIELER · WORLD CUP',
  minPlayers: 1,
  maxPlayers: 2,

  artSvg: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">
      <rect width="320" height="200" fill="#0a0e14"/>
      <rect x="98" y="6" width="124" height="188" fill="#10231a" stroke="#2f5c42" stroke-width="1.5"/>
      <line x1="98" y1="100" x2="222" y2="100" stroke="#ffffff" stroke-width="1.2" opacity="0.3"/>
      <circle cx="160" cy="100" r="20" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.3"/>
      <rect x="128" y="6"   width="64" height="20" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.25"/>
      <rect x="128" y="174" width="64" height="20" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.25"/>
      <rect x="142" y="2"   width="36" height="5" fill="#ffffff" opacity="0.75"/>
      <rect x="142" y="193" width="36" height="5" fill="#ffffff" opacity="0.75"/>
      <circle cx="139" cy="46"  r="5" fill="#f48fb1"/>
      <circle cx="178" cy="62"  r="5" fill="#f48fb1"/>
      <circle cx="160" cy="30"  r="5" fill="#f48fb1"/>
      <circle cx="128" cy="128" r="5" fill="#4fc3f7"/>
      <circle cx="192" cy="140" r="5" fill="#4fc3f7"/>
      <circle cx="160" cy="112" r="6" fill="#4fc3f7"/>
      <circle cx="160" cy="112" r="9" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.9"/>
      <circle cx="163" cy="99" r="4" fill="#ffffff"/>
      <text x="49" y="96"  font-family="'Press Start 2P','Courier New',monospace" font-size="13" fill="#4fc3f7" text-anchor="middle">1</text>
      <text x="271" y="96" font-family="'Press Start 2P','Courier New',monospace" font-size="13" fill="#f48fb1" text-anchor="middle">0</text>
      <text x="49" y="118" font-family="'Press Start 2P','Courier New',monospace" font-size="6" fill="#666" text-anchor="middle">DEU</text>
      <text x="271" y="118" font-family="'Press Start 2P','Courier New',monospace" font-size="6" fill="#666" text-anchor="middle">BRA</text>
    </svg>
  `,

  create(ctx, W, H, numPlayers, api) {
    // ── Konstanten ───────────────────────────────────────
    // Koordinaten in Feldeinheiten: Feldlänge = 1.0, Breite = FIELD_W.
    // Beide Achsen im selben Maßstab, dadurch ist Bewegung richtungsunabhängig
    // und resize() muss nichts umrechnen.
    const FIELD_W   = 0.66;
    const GOAL_W    = 0.215;
    const BOX_W     = 0.38, BOX_D = 0.13;   // Strafraum
    const PLAYER_R  = 0.021;
    const BALL_R    = 0.0105;

    const SPEED      = 0.30;    // Feldeinheiten/s
    const SPEED_HUM  = 0.325;
    const SPEED_GK   = 0.28;    // Torwart darf auf der Linie schneller sein als Feldspieler
    const GK_REACH   = 1.15;     // Fangradius muss klar unter der halben Torbreite bleiben
    const KEEPER_SPACE = 0.17;  // Abstand, den Gegner zum ballhaltenden Torwart wahren
    const GK_REACT   = 0.28;    // Reaktionszeit, bevor der Torwart dem Schuss folgt
    const FRICTION   = 1.25;
    const PASS_SPEED = 0.88;
    const SHOT_SPEED = 1.20;

    const HALF_TIME = 180;      // Sekunden je Halbzeit
    const HALVES    = 2;
    const ROUNDS    = ['ACHTELFINALE', 'VIERTELFINALE', 'HALBFINALE', 'FINALE'];

    const P_COL = ['#4fc3f7', '#f48fb1'];   // Markierung P1 / P2
    const LINE  = 'rgba(255,255,255,0.28)';
    const TURF  = '#10231a', TURF_ALT = '#0d1d15';

    // Aufstellung für die nach +y angreifende Mannschaft.
    // x als Anteil der Feldbreite, y als Anteil der Feldlänge.
    // 3 gegen 3: Torwart + zwei Feldspieler. x wird für die zweite Mannschaft
    // mitgespiegelt, damit beide Seiten wirklich gleich aufgestellt sind.
    const FORMATION = [
      { role: 'GK',  x: 0.50, y: 0.05 },
      { role: 'DEF', x: 0.36, y: 0.30 },
      { role: 'FWD', x: 0.64, y: 0.60 }
    ];

    const TEAMS = [
      { n: 'DEUTSCHLAND', c: '#eceff1', a: '#212121' },
      { n: 'BRASILIEN',   c: '#ffd54f', a: '#2e7d32' },
      { n: 'ARGENTINIEN', c: '#81d4fa', a: '#0277bd' },
      { n: 'FRANKREICH',  c: '#3949ab', a: '#e53935' },
      { n: 'ITALIEN',     c: '#1e88e5', a: '#0d47a1' },
      { n: 'ENGLAND',     c: '#fafafa', a: '#d32f2f' },
      { n: 'SPANIEN',     c: '#c62828', a: '#ffca28' },
      { n: 'NIEDERLANDE', c: '#f57c00', a: '#ffffff' },
      { n: 'PORTUGAL',    c: '#b71c1c', a: '#2e7d32' },
      { n: 'BELGIEN',     c: '#d84315', a: '#fdd835' },
      { n: 'KROATIEN',    c: '#e53935', a: '#ffffff' },
      { n: 'URUGUAY',     c: '#4fc3f7', a: '#263238' },
      { n: 'MEXIKO',      c: '#2e7d32', a: '#ffffff' },
      { n: 'JAPAN',       c: '#1a237e', a: '#e53935' },
      { n: 'NIGERIA',     c: '#43a047', a: '#ffffff' },
      { n: 'USA',         c: '#f5f5f5', a: '#1a237e' }
    ];

    let w = W, h = H;

    // ── Zustand ──────────────────────────────────────────
    const state = {
      phase: 'mode',        // mode|side|team|foe|intro|play|half|result|champion|out
      teamMode: 'coop',     // coop = beide Menschen in einer Mannschaft, versus = gegeneinander
      menuSel: 0,
      mode: 'cup',
      myTeam: 0, foeTeam: 1,
      round: 0,
      players: [], ball: null,
      score: [0, 0],
      half: 1, clock: HALF_TIME,
      golden: false, goldenT: 0,
      msg: '', msgTimer: 0,
      kickoffFor: 0, kickoffLock: 0,
      shake: 0, t: 0,
      lastResult: ''
    };

    // ── Audio ────────────────────────────────────────────
    const audioCtx = api.audioCtx;
    const timers = [];
    function ensureAudio() {
      if (!audioCtx) return false;
      if (audioCtx.state === 'suspended') audioCtx.resume();
      return true;
    }
    function blip(freq, dur, type = 'square', vol = 0.14) {
      if (!ensureAudio()) return;
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
      osc.type = type; osc.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + dur);
    }
    function sweep(f0, f1, dur, type = 'square', vol = 0.14) {
      if (!ensureAudio()) return;
      const t = audioCtx.currentTime;
      const osc = audioCtx.createOscillator(), g = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(f0, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g).connect(audioCtx.destination);
      osc.start(t); osc.stop(t + dur);
    }
    const later = (fn, ms) => timers.push(setTimeout(fn, ms));
    const sndKick   = () => blip(180, 0.05, 'square', 0.16);
    const sndShot   = () => { blip(140, 0.07, 'square', 0.2); blip(300, 0.04, 'square', 0.1); };
    const sndPass   = () => blip(420, 0.04, 'square', 0.1);
    const sndSteal  = () => blip(90, 0.08, 'sawtooth', 0.14);
    const sndPost   = () => blip(900, 0.06, 'square', 0.16);
    const sndSave   = () => blip(260, 0.09, 'square', 0.14);
    const sndWhistle= () => { sweep(2100, 2600, 0.12, 'square', 0.1); later(() => sweep(2100, 2600, 0.12, 'square', 0.1), 150); };
    const sndGoal   = () => [523, 659, 784, 1046].forEach((f, i) => later(() => blip(f, 0.22, 'square', 0.18), i * 130));
    const sndWin    = () => [523, 659, 784, 1046, 1319, 1568].forEach((f, i) => later(() => blip(f, 0.24, 'square', 0.18), i * 150));
    const sndLose   = () => [392, 330, 262].forEach((f, i) => later(() => blip(f, 0.35, 'square', 0.16), i * 200));
    const sndMenu   = () => blip(560, 0.03, 'square', 0.08);

    // ── Hilfen ───────────────────────────────────────────
    const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
    const dist  = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    const goalY = team => (team === 0 ? 1 : 0);       // Tor, auf das team spielt
    const skill = () => (state.mode === 'cup' ? 1 + state.round * 0.11 : 1);

    // Trikotfarbe; bei zu ähnlichen Farben weicht der Gegner auf sein Zweitset aus
    function kit(team) {
      const me = TEAMS[state.myTeam], foe = TEAMS[state.foeTeam];
      if (team === 0) return me.c;
      return colorClash(me.c, foe.c) ? foe.a : foe.c;
    }
    function colorClash(c1, c2) {
      const p = c => [1, 3, 5].map(i => parseInt(c.substr(i, 2), 16));
      const [r1, g1, b1] = p(c1), [r2, g2, b2] = p(c2);
      return Math.hypot(r1 - r2, g1 - g2, b1 - b2) < 110;
    }

    // In der Verlängerung lassen beide Torhüter gleichmäßig nach, damit die
    // Partie sicher endet statt endlos zu laufen
    function gkFatigue() {
      return state.golden ? Math.max(0.35, 1 - state.goldenT / 90) : 1;
    }

    function homePos(team, i) {
      const f = FORMATION[i];
      return {
        x: (team === 0 ? f.x : 1 - f.x) * FIELD_W,
        y: team === 0 ? f.y : 1 - f.y
      };
    }

    // ── Aufstellung ──────────────────────────────────────
    function buildTeams() {
      state.players = [];
      for (let team = 0; team < 2; team++) {
        FORMATION.forEach((f, i) => {
          const hp = homePos(team, i);
          state.players.push({
            team, i, role: f.role,
            x: hp.x, y: hp.y, vx: 0, vy: 0,
            fx: 0, fy: team === 0 ? 1 : -1,   // Blickrichtung
            ctrl: 0, steal: 0, lockout: 0, tackle: 0, gkHold: 0
          });
        });
      }
      state.ball = { x: FIELD_W / 2, y: 0.5, vx: 0, vy: 0, owner: null };
    }

    function kickoff(forTeam) {
      for (const p of state.players) {
        const hp = homePos(p.team, p.i);
        p.x = hp.x; p.y = hp.y; p.vx = 0; p.vy = 0;
        p.steal = 0; p.lockout = 0; p.tackle = 0; p.gkHold = 0;
      }
      // Anstoßende Mannschaft stellt den Stürmer an den Ball
      const fwd = state.players.find(p => p.team === forTeam && p.role === 'FWD');
      if (fwd) { fwd.x = FIELD_W / 2; fwd.y = 0.5 + (forTeam === 0 ? -0.03 : 0.03); }
      const b = state.ball;
      b.x = FIELD_W / 2; b.y = 0.5; b.vx = 0; b.vy = 0; b.owner = fwd || null;
      state.kickoffLock = 0.6;
      assignControl(true);
    }

    function startMatch() {
      state.score = [0, 0];
      state.half = 1;
      state.clock = HALF_TIME;
      state.golden = false; state.goldenT = 0;
      state.msg = ''; state.msgTimer = 0;
      buildTeams();
      state.kickoffFor = 0;
      kickoff(0);
      state.phase = 'play';
      sndWhistle();
    }

    // ── Steuerung zuweisen ───────────────────────────────
    // Jeder Mensch bekommt einen eigenen Feldspieler. Hat die eigene
    // Mannschaft den Ball, übernimmt man den Ballführenden, sonst den
    // ballnächsten. Der Torwart bleibt immer KI.
    let ctrlCooldown = 0;
    function humanSlots() {
      const conns = api.getConns();
      return [1, 2].filter(p => conns.has(p));
    }
    // Welche Mannschaft steuert ein Spieler-Slot? Im Modus „gegeneinander"
    // übernimmt Spieler 2 die gegnerische Mannschaft, sonst spielen beide zusammen.
    function teamOfSlot(slot) {
      return (state.teamMode === 'versus' && slot === 2) ? 1 : 0;
    }
    function assignControl(force = false) {
      if (!force && ctrlCooldown > 0) return;
      ctrlCooldown = 0.25;
      const slots = humanSlots();
      const outfield = state.players.filter(p => p.role !== 'GK');

      const prevOf = new Map();
      for (const c of outfield) if (c.ctrl) prevOf.set(c.ctrl, c);
      outfield.forEach(c => c.ctrl = 0);
      if (!slots.length) return;

      const b = state.ball;
      const taken = new Set();

      for (const team of [0, 1]) {
        const mine = slots.filter(s => teamOfSlot(s) === team);
        if (!mine.length) continue;
        const cands = outfield.filter(p => p.team === team);
        const owner = (b.owner && b.owner.team === team && b.owner.role !== 'GK') ? b.owner : null;

        // Wer den Ball hat, wird übernommen — möglichst von dem Slot, der ihn schon steuerte
        if (owner) {
          const slot = mine.find(s => prevOf.get(s) === owner) ?? mine[0];
          owner.ctrl = slot;
          taken.add(owner);
        }
        for (const slot of mine) {
          if (owner && owner.ctrl === slot) continue;
          let best = null, bd = Infinity;
          for (const c of cands) {
            if (taken.has(c)) continue;
            const d = dist(c, b);
            if (d < bd) { bd = d; best = c; }
          }
          // Hysterese: den bisherigen Spieler behalten, solange er nicht deutlich
          // weiter weg ist — sonst springt die Steuerung im Getümmel hin und her
          const prev = prevOf.get(slot);
          if (prev && prev.team === team && !taken.has(prev) && dist(prev, b) < bd * 1.35) best = prev;
          if (best) { best.ctrl = slot; taken.add(best); }
        }
      }
    }

    // ── Ballaktionen ─────────────────────────────────────
    function giveBall(p) {
      const prev = state.ball.owner;
      if (prev && prev !== p) prev.lockout = 0.45;
      state.ball.owner = p;
      state.ball.vx = 0; state.ball.vy = 0;
      // Jeder Zweikampf beginnt bei null, damit keine alten Druckwerte
      // aus einer früheren Situation sofort einen Ballwechsel auslösen
      for (const q of state.players) q.steal = 0;
    }

    // Ballaktionen werden nur vorgemerkt und erst nach dem Entscheidungs-
    // durchgang ausgeführt. Sonst sähe eine später verarbeitete Mannschaft den
    // freigegebenen Ball noch im selben Frame und reagierte einen Tick früher.
    let pending = null;
    function shoot(p) { if (state.ball.owner === p) pending = { kind: 'shoot', p }; }
    function pass(p)  { if (state.ball.owner === p) pending = { kind: 'pass',  p }; }
    function applyPending() {
      if (!pending) return;
      const { kind, p } = pending;
      pending = null;
      if (kind === 'shoot') doShoot(p); else doPass(p);
    }

    function doShoot(p) {
      const b = state.ball;
      if (b.owner !== p) return;
      const gy = goalY(p.team);
      // Zielpunkt im Tor leicht streuen; Genauigkeit sinkt mit der Distanz
      const d = Math.abs(gy - p.y);
      const spread = GOAL_W * (0.55 + d * 1.7) * (p.ctrl ? 0.7 : 1 / skill());
      const corner = (Math.random() < 0.5 ? -1 : 1) * GOAL_W * 0.36;
      const tx = FIELD_W / 2 + corner + (Math.random() - 0.5) * spread;
      const dx = tx - p.x, dy = gy - p.y;
      const len = Math.hypot(dx, dy) || 1;
      const sp = SHOT_SPEED * (0.82 + Math.min(0.35, d * 0.5));
      b.owner = null;
      b.vx = dx / len * sp; b.vy = dy / len * sp;
      p.lockout = 0.25;
      sndShot();
    }

    function bestPassTarget(p) {
      const gy = goalY(p.team);
      let best = null, bestScore = -Infinity;
      for (const q of state.players) {
        if (q.team !== p.team || q === p || q.role === 'GK') continue;
        const d = dist(p, q);
        if (d > 0.78) continue;
        // Fortschritt Richtung Tor belohnen, weite und gedeckte Bälle abwerten
        const progress = (gy === 1 ? q.y - p.y : p.y - q.y);
        const cover = state.players.reduce((s, o) =>
          o.team !== p.team && dist(o, q) < 0.09 ? s + 1 : s, 0);
        const sc = progress * 2.2 - d * 0.8 - cover * 0.9;
        if (sc > bestScore) { bestScore = sc; best = q; }
      }
      return best;
    }

    function doPass(p) {
      const b = state.ball;
      if (b.owner !== p) return;
      const t = bestPassTarget(p);
      if (!t) {
        if (p.role === 'GK') doShoot(p);   // Abschlag nach vorn
        return;                            // Feldspieler dribbeln weiter
      }
      // Auf den laufenden Mitspieler vorlegen
      const lx = t.x + t.vx * 0.18, ly = t.y + t.vy * 0.18;
      const dx = lx - p.x, dy = ly - p.y;
      const len = Math.hypot(dx, dy) || 1;
      b.owner = null;
      b.vx = dx / len * PASS_SPEED; b.vy = dy / len * PASS_SPEED;
      p.lockout = 0.2;
      sndPass();
    }

    // ── Eingabe ──────────────────────────────────────────
    const edge = (gp, prev, k) => !!gp[k] && !prev?.[k];
    const dEdge = (gp, prev, k) => !!gp.dpad?.[k] && !prev?.dpad?.[k];

    function menuMove(gp, prev) {
      let dx = 0, dy = 0;
      if (dEdge(gp, prev, 'left'))  dx = -1;
      if (dEdge(gp, prev, 'right')) dx = 1;
      if (dEdge(gp, prev, 'up'))    dy = -1;
      if (dEdge(gp, prev, 'down'))  dy = 1;
      return { dx, dy, a: edge(gp, prev, 'a'), b: edge(gp, prev, 'b'), start: edge(gp, prev, 'start') };
    }

    function moveVector(gp) {
      if (gp.type === 'keyboard') {
        // Die Console meldet bei Tastatur joystick.active mit y = ±1 —
        // deshalb hier ausschließlich das Dpad auswerten.
        const x = (gp.dpad?.right ? 1 : 0) - (gp.dpad?.left ? 1 : 0);
        const y = (gp.dpad?.down ? 1 : 0) - (gp.dpad?.up ? 1 : 0);
        return { x, y };
      }
      if (gp.joystick?.active) return { x: gp.joystick.x, y: gp.joystick.y };
      const x = (gp.dpad?.right ? 1 : 0) - (gp.dpad?.left ? 1 : 0);
      const y = (gp.dpad?.down ? 1 : 0) - (gp.dpad?.up ? 1 : 0);
      return { x, y };
    }

    const inputs = new Map();   // Spieler-Slot → letzter Bewegungsvektor

    // ── KI ───────────────────────────────────────────────
    function nearestOfTeam(team, to, exclude) {
      let best = null, bd = Infinity;
      for (const p of state.players) {
        if (p.team !== team || p.role === 'GK' || p === exclude) continue;
        const d = dist(p, to);
        if (d < bd) { bd = d; best = p; }
      }
      return best;
    }

    function moveToward(p, tx, ty, speed, dt) {
      const dx = tx - p.x, dy = ty - p.y;
      const len = Math.hypot(dx, dy);
      if (len < 1e-4) { p.vx = 0; p.vy = 0; return; }
      const s = Math.min(speed, len / dt);
      p.vx = dx / len * s; p.vy = dy / len * s;
    }

    function aiGoalkeeper(p, dt) {
      const b = state.ball;
      const gy = p.team === 0 ? 0 : 1;
      const line = gy === 0 ? 0.035 : 0.965;
      // Auf der Linie mit dem Ball mitgehen, im Strafraum aktiv herauslaufen
      const inBox = Math.abs(b.y - gy) < BOX_D && Math.abs(b.x - FIELD_W / 2) < BOX_W / 2;
      let tx = FIELD_W / 2 + (b.x - FIELD_W / 2) * 0.55, ty = line;

      // Fliegt der Ball aufs Tor, den Kreuzungspunkt vorausberechnen statt
      // dem Ball hinterherzulaufen — sonst kommt der Torwart nie rechtzeitig an
      const toward = !b.owner && ((gy === 0 && b.vy < -0.02) || (gy === 1 && b.vy > 0.02));
      if (toward) {
        p.react = (p.react || 0) + dt;
        if (p.react >= GK_REACT) {
          const tt = (line - b.y) / b.vy;
          if (tt > 0 && tt < 1.5) tx = b.x + b.vx * tt;
        }
      } else {
        p.react = 0;
      }
      tx = clamp(tx, FIELD_W / 2 - GOAL_W / 2 - 0.03, FIELD_W / 2 + GOAL_W / 2 + 0.03);

      if (!b.owner && !toward && Math.abs(b.y - gy) < 0.07 && Math.abs(b.x - FIELD_W / 2) < BOX_W / 2) { tx = b.x; ty = b.y; }
      else if (inBox && b.owner && b.owner.team !== p.team) {
        ty = gy === 0 ? Math.min(0.10, b.y - 0.03) : Math.max(0.90, b.y + 0.03);
      }
      moveToward(p, tx, ty, SPEED_GK * skill(), dt);

      // Ball halten und nach kurzer Pause herausspielen
      if (state.ball.owner === p) {
        p.vx = 0; p.vy = 0;
        p.gkHold -= dt;
        if (p.gkHold <= 0) pass(p);   // Abschlag, ebenfalls verzögert ausgeführt
      }
    }

    function aiWithBall(p, dt) {
      const gy = goalY(p.team);
      const gdist = Math.hypot(FIELD_W / 2 - p.x, gy - p.y);
      // Druck durch den nächsten Gegner
      let press = Infinity;
      for (const o of state.players) {
        if (o.team === p.team) continue;
        press = Math.min(press, dist(p, o));
      }
      let blocked = false;
      for (const o of state.players) {
        if (o.team === p.team) continue;
        if (dist(p, o) > 0.10) continue;
        if ((o.y - p.y) * (gy - p.y) > 0) { blocked = true; break; }   // steht im Weg zum Tor
      }
      if (!blocked && gdist < 0.21 + 0.04 * skill() && Math.random() < dt * 1.6 * skill()) { shoot(p); return; }
      if (press < 0.075 && Math.random() < dt * 2.0) { pass(p); return; }
      if (gdist > 0.55 && press < 0.11 && Math.random() < dt * 0.9) { pass(p); return; }
      // Dribbeln Richtung Tor, dabei etwas ausweichen
      const dx = FIELD_W / 2 - p.x, dy = gy - p.y;
      const len = Math.hypot(dx, dy) || 1;
      let tx = p.x + dx / len * 0.3, ty = p.y + dy / len * 0.3;
      for (const o of state.players) {
        if (o.team === p.team) continue;
        const d = dist(p, o);
        if (d < 0.12) { tx += (p.x - o.x) * 0.8; ty += (p.y - o.y) * 0.3; }
      }
      moveToward(p, tx, ty, SPEED * (0.94 + 0.06 * skill()), dt);
    }

    function aiOutfield(p, dt) {
      const b = state.ball;
      const hp = homePos(p.team, p.i);
      const gy = goalY(p.team);
      const owner = b.owner;

      if (owner === p) { aiWithBall(p, dt); return; }

      // Hat der gegnerische Torwart den Ball in der Hand, Abstand halten.
      // Sonst steht man ihm im Abschlag und fängt den Ball sofort wieder ab.
      if (owner && owner.role === 'GK' && owner.team !== p.team) {
        const ax = p.x - owner.x, ay = p.y - owner.y;
        const len = Math.hypot(ax, ay);
        if (len < KEEPER_SPACE) {
          const nx = len < 1e-4 ? 0 : ax / len;
          const ny = len < 1e-4 ? (owner.team === 0 ? 1 : -1) : ay / len;
          moveToward(p, owner.x + nx * KEEPER_SPACE, owner.y + ny * KEEPER_SPACE, SPEED, dt);
          return;
        }
      }

      const chaser = nearestOfTeam(p.team, b);
      let tx = hp.x, ty = hp.y;

      if (!owner) {
        if (chaser === p) { tx = b.x; ty = b.y; }
        else { tx = hp.x * 0.6 + b.x * 0.4; ty = hp.y * 0.7 + b.y * 0.3; }
      } else if (owner.team === p.team) {
        // Anbieten: Position Richtung gegnerisches Tor verschieben
        const push = gy === 1 ? 0.16 : -0.16;
        tx = hp.x * 0.65 + b.x * 0.35;
        ty = hp.y + push + (b.y - 0.5) * 0.25;
      } else {
        // Verteidigen: einer presst, der Rest deckt den Raum zum eigenen Tor
        if (chaser === p) { tx = owner.x; ty = owner.y; }
        else {
          tx = hp.x * 0.6 + b.x * 0.4;
          ty = hp.y * 0.65 + (b.y + (gy === 1 ? -0.12 : 0.12)) * 0.35;
        }
      }
      tx = clamp(tx, PLAYER_R, FIELD_W - PLAYER_R);
      ty = clamp(ty, PLAYER_R, 1 - PLAYER_R);
      moveToward(p, tx, ty, SPEED * (0.9 + 0.1 * skill()), dt);
    }

    // ── Match-Update ─────────────────────────────────────
    function updateMatch(dt) {
      const b = state.ball;
      state.kickoffLock = Math.max(0, state.kickoffLock - dt);
      ctrlCooldown = Math.max(0, ctrlCooldown - dt);
      assignControl();

      // Zwei Durchgänge: erst entscheiden alle aus demselben Weltzustand,
      // dann bewegen sich alle. Würde beides in einer Schleife passieren,
      // sähe die zweite Mannschaft bereits die neuen Positionen der ersten
      // und hätte einen Frame weniger Reaktionsverzug.
      for (const p of state.players) {
        p.lockout = Math.max(0, p.lockout - dt);
        p.tackle  = Math.max(0, p.tackle - dt);

        if (p.role === 'GK') { aiGoalkeeper(p, dt); }
        else if (p.ctrl) {
          const mv = inputs.get(p.ctrl) || { x: 0, y: 0 };
          const len = Math.hypot(mv.x, mv.y);
          const sp = SPEED_HUM * (p.tackle > 0 ? 1.35 : 1);
          if (len > 0.15) { p.vx = mv.x / len * sp; p.vy = -mv.y / len * sp; }
          else { p.vx = 0; p.vy = 0; }
        } else {
          aiOutfield(p, dt);
        }
      }
      for (const p of state.players) {
        p.x = clamp(p.x + p.vx * dt, PLAYER_R, FIELD_W - PLAYER_R);
        p.y = clamp(p.y + p.vy * dt, PLAYER_R, 1 - PLAYER_R);
        const l = Math.hypot(p.vx, p.vy);
        if (l > 1e-3) { p.fx = p.vx / l; p.fy = p.vy / l; }
      }

      applyPending();

      // Spieler drücken sich gegenseitig weg. Die Verschiebungen werden erst
      // gesammelt und dann angewandt — sonst hinge das Ergebnis davon ab,
      // welcher Spieler im Array zuerst kommt.
      const n = state.players.length;
      const dx = new Array(n).fill(0), dy = new Array(n).fill(0);
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const a = state.players[i], c = state.players[j];
          const d = dist(a, c), min = PLAYER_R * 2;
          if (d > 0 && d < min) {
            const push = (min - d) / 2;
            const nx = (a.x - c.x) / d, ny = (a.y - c.y) / d;
            dx[i] += nx * push; dy[i] += ny * push;
            dx[j] -= nx * push; dy[j] -= ny * push;
          }
        }
      }
      for (let i = 0; i < n; i++) {
        const p = state.players[i];
        p.x = clamp(p.x + dx[i], PLAYER_R, FIELD_W - PLAYER_R);
        p.y = clamp(p.y + dy[i], PLAYER_R, 1 - PLAYER_R);
      }

      // Ball
      if (b.owner) {
        const o = b.owner;
        const off = PLAYER_R + BALL_R + 0.004;
        // Auf dem Feld halten: sonst schöbe ein Angreifer den Ball allein durchs
        // Vorwärtslaufen über die Torlinie
        b.x = clamp(o.x + o.fx * off, BALL_R, FIELD_W - BALL_R);
        b.y = clamp(o.y + o.fy * off, BALL_R, 1 - BALL_R);
        b.vx = 0; b.vy = 0;
      } else {
        b.x += b.vx * dt; b.y += b.vy * dt;
        const damp = Math.exp(-FRICTION * dt);
        b.vx *= damp; b.vy *= damp;
        if (Math.hypot(b.vx, b.vy) < 0.01) { b.vx = 0; b.vy = 0; }

        // Seitenlinien: der Ball prallt ab, kein Einwurf
        if (b.x < BALL_R)            { b.x = BALL_R;            b.vx = Math.abs(b.vx) * 0.8; }
        if (b.x > FIELD_W - BALL_R)  { b.x = FIELD_W - BALL_R;  b.vx = -Math.abs(b.vx) * 0.8; }

        const inGoalMouth = Math.abs(b.x - FIELD_W / 2) < GOAL_W / 2;
        if (b.y < BALL_R && !inGoalMouth)       { b.y = BALL_R;       b.vy = Math.abs(b.vy) * 0.8; sndPost(); }
        if (b.y > 1 - BALL_R && !inGoalMouth)   { b.y = 1 - BALL_R;   b.vy = -Math.abs(b.vy) * 0.8; sndPost(); }

        // Tor VOR der Ballaufnahme prüfen. Der Fangradius des Torwarts reicht
        // tiefer als das Tor — sonst fischt er Bälle heraus, die die Linie
        // längst überquert haben, und es fällt überhaupt kein Tor mehr.
        if (inGoalMouth && b.y > 1) { scoreGoal(0); return; }
        if (inGoalMouth && b.y < 0) { scoreGoal(1); return; }

        // Aufnehmen: der am nächsten stehende Spieler bekommt den Ball.
        // (Nicht der erste passende — das bevorzugte sonst systematisch die
        // Mannschaft, die im Array vorne steht.)
        if (state.kickoffLock <= 0) {
          let take = null, td = Infinity;
          for (const p of state.players) {
            if (p.lockout > 0) continue;
            const reach = (p.role === 'GK' ? PLAYER_R * GK_REACH * gkFatigue() : PLAYER_R) + BALL_R + 0.006;
            const d = dist(p, b);
            if (d < reach && d < td) { td = d; take = p; }
          }
          if (take) {
            if (take.role === 'GK') { take.gkHold = 0.9; sndSave(); }
            giveBall(take);
          }
        }
      }

      // Zweikampf: Gegner am Ballführenden erhöhen den Druck.
      // Der Ballführende wird einmal zu Beginn festgehalten und der Ballwechsel
      // erst nach der Schleife ausgeführt — sonst könnte eine Mannschaft im
      // selben Frame zurückerobern, nur weil sie im Array weiter hinten steht.
      const carrier = b.owner;
      if (carrier && carrier.role !== 'GK') {
        let stealer = null, sd = Infinity;
        for (const q of state.players) {
          if (q.team === carrier.team || q.lockout > 0) continue;
          const d = dist(q, carrier);
          if (d < PLAYER_R * 2.9) {
            const rate = (q.tackle > 0 ? 3.4 : 1.5) * (q.ctrl ? 1.15 : skill());
            q.steal += dt * rate;
            if (q.steal >= 1 && d < sd) { sd = d; stealer = q; }
          } else {
            q.steal = Math.max(0, q.steal - dt * 1.5);
          }
        }
        if (stealer) { giveBall(stealer); sndSteal(); state.shake = 0.2; }
      }

      // Die Torprüfung selbst steht oben im Zweig für den freien Ball — dort
      // vor der Ballaufnahme. Ein geführter Ball zählt bewusst nie als Tor,
      // sonst würde bloßes Vorwärtslaufen zum sicheren Treffer.

      // Uhr
      state.clock -= dt;
      if (state.msgTimer > 0) state.msgTimer -= dt;

      if (state.golden) { state.goldenT += dt; return; }   // Verlängerung läuft ohne Uhr
      if (state.clock <= 0) {
        state.clock = 0;
        if (state.half < HALVES) { state.phase = 'half'; sndWhistle(); }
        else finishMatch();
      }
    }

    function scoreGoal(team) {
      state.score[team]++;
      state.msg = 'TOR!';
      state.msgTimer = 2.0;
      state.shake = 0.7;
      sndGoal();
      if (state.golden) { finishMatch(); return; }
      state.kickoffFor = 1 - team;
      kickoff(1 - team);
    }

    function finishMatch() {
      sndWhistle();
      const [a, b] = state.score;
      if (state.mode === 'cup' && a === b) {
        // Im Turnier muss ein Sieger her
        state.golden = true; state.goldenT = 0;
        state.msg = 'VERLÄNGERUNG · GOLDEN GOAL';
        state.msgTimer = 3;
        state.half = HALVES;
        state.clock = 0;
        kickoff(0);
        return;
      }
      state.phase = 'result';
      if (state.mode === 'friendly') {
        state.lastResult = a > b ? 'SIEG' : a < b ? 'NIEDERLAGE' : 'UNENTSCHIEDEN';
        (a > b ? sndWin : a < b ? sndLose : sndWhistle)();
      } else if (a > b) {
        state.lastResult = 'WEITER';
        sndWin();
      } else {
        state.lastResult = 'AUS';
        sndLose();
      }
    }

    function nextCupRound() {
      state.round++;
      if (state.round >= ROUNDS.length) { state.phase = 'champion'; sndWin(); return; }
      drawFoe();
      state.phase = 'intro';
    }

    function drawFoe() {
      let i;
      do { i = Math.floor(Math.random() * TEAMS.length); } while (i === state.myTeam);
      state.foeTeam = i;
    }

    // ── Öffentliche Schnittstelle ────────────────────────
    return {
      resize(nw, nh) { w = nw; h = nh; },      // Positionen sind normalisiert

      input(player, gp, prev) {
        if (gp.select && !prev?.select) { api.exit(); return; }
        const m = menuMove(gp, prev);

        switch (state.phase) {
          case 'mode':
            if (m.dy) { state.menuSel = (state.menuSel + m.dy + 2) % 2; sndMenu(); }
            if (m.a || m.start) {
              state.mode = state.menuSel === 0 ? 'cup' : 'friendly';
              state.round = 0;
              state.menuSel = state.teamMode === 'coop' ? 0 : 1;
              state.phase = 'side'; sndMenu();
            }
            return;

          case 'side':
            if (m.dy) { state.menuSel = (state.menuSel + m.dy + 2) % 2; sndMenu(); }
            if (m.b) { state.phase = 'mode'; state.menuSel = state.mode === 'cup' ? 0 : 1; sndMenu(); return; }
            if (m.a || m.start) {
              state.teamMode = state.menuSel === 0 ? 'coop' : 'versus';
              state.menuSel = state.myTeam;
              state.phase = 'team'; sndMenu();
            }
            return;

          case 'team':
          case 'foe': {
            const cols = 4;
            let s = state.menuSel;
            if (m.dx) s = clamp(s + m.dx, 0, TEAMS.length - 1);
            if (m.dy) s = clamp(s + m.dy * cols, 0, TEAMS.length - 1);
            if (s !== state.menuSel) { state.menuSel = s; sndMenu(); }
            if (m.b) { state.phase = state.phase === 'team' ? 'side' : 'team'; state.menuSel = 0; sndMenu(); return; }
            if (m.a || m.start) {
              if (state.phase === 'team') {
                state.myTeam = state.menuSel;
                if (state.mode === 'friendly') {
                  state.menuSel = (state.myTeam + 1) % TEAMS.length;
                  state.phase = 'foe';
                } else { drawFoe(); state.phase = 'intro'; }
              } else {
                if (state.menuSel === state.myTeam) return;   // nicht gegen sich selbst
                state.foeTeam = state.menuSel;
                state.phase = 'intro';
              }
              sndMenu();
            }
            return;
          }

          case 'intro':
            if (m.a || m.start) startMatch();
            return;

          case 'half':
            if (m.a || m.start) {
              state.half++;
              state.clock = HALF_TIME;
              state.kickoffFor = 1;
              kickoff(1);
              state.phase = 'play';
              sndWhistle();
            }
            return;

          case 'result':
            if (m.a || m.start) {
              if (state.mode === 'friendly') { state.phase = 'mode'; state.menuSel = 0; }
              else if (state.lastResult === 'WEITER') nextCupRound();
              else state.phase = 'out';
            }
            return;

          case 'champion':
          case 'out':
            if (m.a || m.start) { state.round = 0; state.phase = 'mode'; state.menuSel = 0; }
            return;

          case 'play': {
            const mv = moveVector(gp);
            inputs.set(player, mv);
            const me = state.players.find(p => p.ctrl === player);
            if (!me) return;
            if (edge(gp, prev, 'a')) {
              if (state.ball.owner === me) shoot(me);
              else { me.tackle = 0.28; sndKick(); }
            }
            if (edge(gp, prev, 'b')) {
              if (state.ball.owner === me) pass(me);
              else { ctrlCooldown = 0; assignControl(true); sndMenu(); }
            }
            return;
          }
        }
      },

      onDisconnect(player) {
        inputs.delete(player);
        const p = state.players.find(q => q.ctrl === player);
        if (p) p.ctrl = 0;
        assignControl(true);
      },

      update(dt) {
        state.t += dt;
        state.shake = Math.max(0, state.shake - dt * 1.8);
        if (state.phase === 'play') updateMatch(dt);
      },

      draw() {
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';

        switch (state.phase) {
          case 'mode':     drawModeMenu(); break;
          case 'side':     drawSideMenu(); break;
          case 'team':
          case 'foe':      drawTeamMenu(); break;
          case 'intro':    drawIntro(); break;
          case 'play':     drawMatch(); break;
          case 'half':     drawMatch(); drawHalf(); break;
          case 'result':   drawMatch(); drawResult(); break;
          case 'champion': drawChampion(); break;
          case 'out':      drawOut(); break;
        }
      },

      destroy() { timers.forEach(clearTimeout); timers.length = 0; }
    };

    // ── Rendering ────────────────────────────────────────
    // Schriftmaß: auf breiten Schirmen die Höhe, im Hochformat die Breite —
    // sonst laufen die Menütexte seitlich aus dem Bild.
    // Bewusst eine Funktionsdeklaration: dieser Abschnitt steht hinter dem
    // return, und nur Deklarationen werden hochgezogen, const nicht.
    function uni() { return Math.min(h, w * 0.6); }
    function font(px) { return `${Math.floor(px)}px "Press Start 2P", Courier New`; }

    function pitchRect() {
      const top = h * 0.11;
      const ph = h - top - h * 0.03;
      const pw = ph * FIELD_W;
      return { x: (w - pw) / 2, y: top, w: pw, h: ph, s: ph };
    }
    // Feldeinheiten → Pixel. y = 0 liegt unten (eigenes Tor).
    function px(r, x, y) { return { X: r.x + x * r.s, Y: r.y + (1 - y) * r.s }; }

    function drawPitch(r) {
      ctx.fillStyle = TURF;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // Streifen für die Rasenoptik
      ctx.fillStyle = TURF_ALT;
      const bands = 8;
      for (let i = 0; i < bands; i += 2) ctx.fillRect(r.x, r.y + i * r.h / bands, r.w, r.h / bands);

      ctx.strokeStyle = LINE;
      ctx.lineWidth = Math.max(1.5, r.s * 0.004);
      ctx.strokeRect(r.x, r.y, r.w, r.h);
      // Mittellinie + Kreis
      ctx.beginPath();
      ctx.moveTo(r.x, r.y + r.h / 2); ctx.lineTo(r.x + r.w, r.y + r.h / 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(r.x + r.w / 2, r.y + r.h / 2, r.s * 0.10, 0, Math.PI * 2);
      ctx.stroke();
      // Strafräume: jeweils an der Torlinie ansetzen und ins Feld reichen
      const boxX = px(r, FIELD_W / 2 - BOX_W / 2, 0).X;
      ctx.strokeRect(boxX, px(r, 0, BOX_D).Y, BOX_W * r.s, BOX_D * r.s);   // unten
      ctx.strokeRect(boxX, r.y,               BOX_W * r.s, BOX_D * r.s);   // oben
      // Tore
      for (const gy of [0, 1]) {
        const g = px(r, FIELD_W / 2 - GOAL_W / 2, gy);
        const d = r.s * 0.022;
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillRect(g.X, gy === 0 ? g.Y : g.Y - d, GOAL_W * r.s, d);
      }
    }

    function drawPlayers(r) {
      const b = state.ball;
      for (const p of state.players) {
        const q = px(r, p.x, p.y);
        const rad = PLAYER_R * r.s;
        // Markierung für die menschlich gesteuerten Spieler
        if (p.ctrl) {
          ctx.strokeStyle = P_COL[p.ctrl - 1];
          ctx.lineWidth = Math.max(2, r.s * 0.005);
          ctx.beginPath(); ctx.arc(q.X, q.Y, rad * 1.55, 0, Math.PI * 2); ctx.stroke();
        }
        ctx.fillStyle = kit(p.team);
        ctx.beginPath(); ctx.arc(q.X, q.Y, rad, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = Math.max(1, r.s * 0.002);
        ctx.stroke();
        if (p.role === 'GK') {
          ctx.fillStyle = 'rgba(0,0,0,0.55)';
          ctx.beginPath(); ctx.arc(q.X, q.Y, rad * 0.45, 0, Math.PI * 2); ctx.fill();
        }
      }
      const bq = px(r, b.x, b.y);
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#fff'; ctx.shadowBlur = r.s * 0.02;
      ctx.beginPath(); ctx.arc(bq.X, bq.Y, BALL_R * r.s, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    }

    function drawHud() {
      const me = TEAMS[state.myTeam], foe = TEAMS[state.foeTeam];
      const y = h * 0.055;
      ctx.font = font(uni() * 0.032);

      ctx.fillStyle = kit(0);
      ctx.textAlign = 'right';
      ctx.fillText(me.n, w * 0.36, y);
      ctx.fillStyle = kit(1);
      ctx.textAlign = 'left';
      ctx.fillText(foe.n, w * 0.64, y);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.font = font(uni() * 0.044);
      ctx.fillText(`${state.score[0]} : ${state.score[1]}`, w / 2, y + h * 0.008);

      const t = Math.max(0, Math.ceil(state.clock));
      ctx.font = font(uni() * 0.026);
      ctx.fillStyle = state.golden ? '#ffb300' : '#8a9bb0';
      ctx.fillText(state.golden ? 'GOLDEN GOAL'
        : `${state.half}. HALBZEIT  ${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`,
        w / 2, h * 0.092);
    }

    function drawMatch() {
      ctx.save();
      if (state.shake > 0) {
        const m = state.shake * h * 0.014;
        ctx.translate((Math.random() * 2 - 1) * m, (Math.random() * 2 - 1) * m);
      }
      const r = pitchRect();
      drawPitch(r);
      drawPlayers(r);
      ctx.restore();
      drawHud();

      if (state.msgTimer > 0 && state.msg) {
        ctx.fillStyle = '#ffb300';
        ctx.shadowColor = '#ffb300'; ctx.shadowBlur = w * 0.02;
        ctx.font = font(uni() * 0.085);
        ctx.textAlign = 'center';
        ctx.fillText(state.msg, w / 2, h * 0.5);
        ctx.shadowBlur = 0;
      }
    }

    function panel(title, sub) {
      ctx.fillStyle = 'rgba(0,0,0,0.86)';
      ctx.fillRect(0, 0, w, h);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.shadowColor = '#4fc3f7'; ctx.shadowBlur = w * 0.02;
      ctx.font = font(uni() * 0.07);
      ctx.fillText(title, w / 2, h * 0.3);
      ctx.shadowBlur = 0;
      if (sub) {
        ctx.fillStyle = '#8a9bb0';
        ctx.font = font(uni() * 0.03);
        ctx.fillText(sub, w / 2, h * 0.42);
      }
    }

    function hint(text) {
      ctx.fillStyle = '#555';
      ctx.font = font(uni() * 0.026);
      ctx.textAlign = 'center';
      ctx.fillText(text, w / 2, h * 0.9);
    }

    function drawModeMenu() {
      ctx.fillStyle = '#fff';
      ctx.font = font(uni() * 0.075);
      ctx.fillText('STREET SOCCER', w / 2, h * 0.24);

      const items = ['WORLD CUP', 'FREUNDSCHAFTSSPIEL'];
      const subs  = [`${ROUNDS.length} SIEGE ZUM TITEL · EINE NIEDERLAGE UND AUS`, 'EIN SPIEL, FREIE GEGNERWAHL'];
      items.forEach((it, i) => {
        const sel = i === state.menuSel;
        const y = h * (0.45 + i * 0.14);
        ctx.fillStyle = sel ? '#4fc3f7' : '#555';
        ctx.font = font(uni() * 0.045);
        ctx.fillText(sel ? `> ${it} <` : it, w / 2, y);
        ctx.fillStyle = sel ? '#8a9bb0' : '#333';
        ctx.font = font(uni() * 0.021);
        ctx.fillText(subs[i], w / 2, y + h * 0.045);
      });
      hint('A · AUSWÄHLEN');
    }

    function drawSideMenu() {
      ctx.fillStyle = '#fff';
      ctx.font = font(uni() * 0.045);
      ctx.fillText('ZU ZWEIT SPIELEN', w / 2, h * 0.16);

      const items = ['MITEINANDER', 'GEGENEINANDER'];
      const subs  = ['BEIDE IN EINER MANNSCHAFT GEGEN DIE KI',
                     'SPIELER 2 STEUERT DIE GEGNERISCHE MANNSCHAFT'];
      items.forEach((it, i) => {
        const sel = i === state.menuSel;
        const y = h * (0.4 + i * 0.14);
        ctx.fillStyle = sel ? '#4fc3f7' : '#555';
        ctx.font = font(uni() * 0.042);
        ctx.fillText(sel ? `> ${it} <` : it, w / 2, y);
        ctx.fillStyle = sel ? '#8a9bb0' : '#333';
        ctx.font = font(uni() * 0.019);
        ctx.fillText(subs[i], w / 2, y + h * 0.042);
      });
      ctx.fillStyle = '#555';
      ctx.font = font(uni() * 0.019);
      ctx.fillText('MIT NUR EINEM SPIELER OHNE WIRKUNG', w / 2, h * 0.72);
      hint('A · WEITER   B · ZURÜCK');
    }

    function drawTeamMenu() {
      const pick = state.phase === 'team';
      ctx.fillStyle = '#fff';
      ctx.font = font(uni() * 0.045);
      ctx.fillText(pick ? 'DEINE MANNSCHAFT' : 'GEGNER WÄHLEN', w / 2, h * 0.13);

      const cols = 4, rows = 4;
      const cw = w * 0.17, ch = h * 0.13;
      const x0 = w / 2 - (cols * cw) / 2, y0 = h * 0.2;
      TEAMS.forEach((t, i) => {
        const cx = x0 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch;
        const sel = i === state.menuSel;
        const own = !pick && i === state.myTeam;

        ctx.fillStyle = t.c;
        ctx.globalAlpha = own ? 0.18 : sel ? 1 : 0.55;
        ctx.fillRect(cx + cw * 0.1, cy + ch * 0.12, cw * 0.8, ch * 0.42);
        ctx.globalAlpha = 1;
        if (sel) {
          ctx.strokeStyle = '#4fc3f7';
          ctx.lineWidth = Math.max(2, w * 0.0022);
          ctx.strokeRect(cx + cw * 0.06, cy + ch * 0.06, cw * 0.88, ch * 0.78);
        }
        ctx.fillStyle = own ? '#333' : sel ? '#fff' : '#777';
        ctx.font = font(uni() * 0.017);
        ctx.fillText(t.n, cx + cw / 2, cy + ch * 0.72);
      });
      hint(pick ? 'A · WÄHLEN   B · ZURÜCK' : 'A · ANPFIFF   B · ZURÜCK');
    }

    function drawIntro() {
      const title = state.mode === 'cup' ? ROUNDS[state.round] : 'FREUNDSCHAFTSSPIEL';
      panel(title, '');
      ctx.font = font(uni() * 0.042);
      ctx.fillStyle = kit(0);
      ctx.fillText(TEAMS[state.myTeam].n, w / 2, h * 0.46);
      ctx.fillStyle = '#555';
      ctx.font = font(uni() * 0.03);
      ctx.fillText('GEGEN', w / 2, h * 0.54);
      ctx.fillStyle = kit(1);
      ctx.font = font(uni() * 0.042);
      ctx.fillText(TEAMS[state.foeTeam].n, w / 2, h * 0.62);
      hint('A · ANPFIFF');
    }

    function drawHalf() {
      panel('HALBZEIT', `${TEAMS[state.myTeam].n} ${state.score[0]} : ${state.score[1]} ${TEAMS[state.foeTeam].n}`);
      hint('A · WEITER');
    }

    function drawResult() {
      const [a, b] = state.score;
      const title = state.mode === 'friendly'
        ? state.lastResult
        : (state.lastResult === 'WEITER' ? 'WEITER!' : 'AUSGESCHIEDEN');
      panel(title, `${TEAMS[state.myTeam].n} ${a} : ${b} ${TEAMS[state.foeTeam].n}`);
      if (state.mode === 'cup' && state.lastResult === 'WEITER' && state.round + 1 < ROUNDS.length) {
        ctx.fillStyle = '#4fc3f7';
        ctx.font = font(uni() * 0.028);
        ctx.fillText(`NÄCHSTE RUNDE: ${ROUNDS[state.round + 1]}`, w / 2, h * 0.54);
      }
      hint('A · WEITER');
    }

    function drawChampion() {
      panel('WELTMEISTER!', TEAMS[state.myTeam].n);
      ctx.fillStyle = '#ffb300';
      ctx.font = font(uni() * 0.03);
      ctx.fillText(`${ROUNDS.length} SPIELE, ${ROUNDS.length} SIEGE`, w / 2, h * 0.54);
      hint('A · NEUES TURNIER');
    }

    function drawOut() {
      panel('AUSGESCHIEDEN', `${ROUNDS[state.round]} · ${TEAMS[state.myTeam].n}`);
      hint('A · NEUES TURNIER');
    }
  }
};
