// STREET SOCCER — Kleinfeld-Fußball aus der Vogelperspektive
// Besonderheit gegenüber den anderen Spielen: P1 und P2 sind hier keine Gegner,
// sondern spielen gemeinsam in einer Mannschaft. Der Gegner ist immer KI.
window.RetroGames = window.RetroGames || {};

window.RetroGames.soccer = {
  name: 'STREET SOCCER',
  tagline: '1–2 SPIELER · WORLD CUP',
  minPlayers: 1,
  maxPlayers: 2,

  // Was A und B hier bedeuten, weiß nur dieses Spiel — die Konsole hängt es
  // an ihre allgemeine Hilfe an.
  help: [
    { t1: 'A', t2: 'MIT BALL',  was: 'Schießen' },
    { t1: 'A', t2: 'OHNE BALL', was: 'Spieler wechseln — wann das Spiel selbst wechselt, steht in den Einstellungen' },
    { t1: 'B', t2: 'MIT BALL',  was: 'Abspielen' },
    { t1: 'B', t2: 'KURZ · OHNE BALL', was: 'Angreifen — kurzer Schritt zum Ball, ohne Risiko' },
    { t1: 'B', t2: 'HALTEN · OHNE BALL', was: 'Grätschen — mehr Reichweite, danach liegt man kurz' },
    { t1: 'B', t2: 'VOR DEM TOR', was: 'Hechtsprung auf eine scharfe Hereingabe — danach liegt man kurz' },
    { t1: 'DRIBBELN', t2: '',   was: 'Mit Ball läuft man langsamer; der Ball folgt der Laufrichtung' },
    { t1: 'ANSTOSS', t2: '',    was: 'Der Anstoß wird zum Mitspieler gepasst' },
    { t1: 'NACH DEM TOR', t2: '', was: 'Die Wiederholung läuft von selbst — jede Taste bricht sie ab' },
  ],

  // Eigene Regler. Die Konsole zeigt und speichert sie, kennt aber weder
  // Halbzeitlänge noch Turnierstärke — das bleibt Sache des Spiels.
  settings: [
    { key: 'duration',   label: 'HALBZEIT',      werte: [60, 90, 120, 180, 300], vorgabe: 180,
      zeige: v => (v / 60).toFixed(0).replace('.', ',') + ' MIN' },
    { key: 'difficulty', label: 'SCHWIERIGKEIT', werte: ['leicht', 'normal', 'schwer'], vorgabe: 'normal',
      zeige: v => v.toUpperCase() },
    { key: 'replay', label: 'WIEDERHOLUNG', werte: ['an', 'aus'], vorgabe: 'an',
      zeige: v => v === 'an' ? 'AN' : 'AUS' },
    { key: 'switch', label: 'SPIELERWECHSEL', werte: ['manuell', 'ballgewinn', 'amball'], vorgabe: 'ballgewinn',
      zeige: v => v === 'manuell' ? 'NUR SELBST' : v === 'ballgewinn' ? 'BEI BALLGEWINN' : 'AM BALL' },
  ],

  artSvg: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 200" preserveAspectRatio="xMidYMid meet">
      <rect width="320" height="200" fill="#0a0e14"/>
      <rect x="106" y="6" width="109" height="188" fill="#10231a" stroke="#2f5c42" stroke-width="1.5"/>
      <line x1="106" y1="100" x2="215" y2="100" stroke="#ffffff" stroke-width="1.2" opacity="0.3"/>
      <circle cx="160" cy="100" r="20" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.3"/>
      <rect x="129" y="6"   width="63" height="20" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.25"/>
      <rect x="129" y="174" width="63" height="20" fill="none" stroke="#ffffff" stroke-width="1.2" opacity="0.25"/>
      <rect x="142" y="2"   width="36" height="5" fill="#ffffff" opacity="0.75"/>
      <rect x="142" y="193" width="36" height="5" fill="#ffffff" opacity="0.75"/>
      <circle cx="141" cy="46"  r="5" fill="#f48fb1"/>
      <circle cx="176" cy="62"  r="5" fill="#f48fb1"/>
      <circle cx="160" cy="30"  r="5" fill="#f48fb1"/>
      <circle cx="132" cy="128" r="5" fill="#4fc3f7"/>
      <circle cx="188" cy="140" r="5" fill="#4fc3f7"/>
      <circle cx="160" cy="112" r="6" fill="#4fc3f7"/>
      <circle cx="160" cy="112" r="9" fill="none" stroke="#ffffff" stroke-width="1.5" opacity="0.9"/>
      <circle cx="162" cy="99" r="4" fill="#ffffff"/>
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
    const FIELD_W   = 0.58;   // zwischen Futsal (0,50) und Grossfeld (0,648)
    const GOAL_W    = 0.189;
    const BOX_W     = 0.334, BOX_D = 0.13;   // Strafraum
    const PLAYER_R  = 0.021;
    const BALL_R    = 0.0105;

    const SPEED      = 0.155;    // Feldeinheiten/s
    const SPEED_HUM  = 0.20;    // Sprint; die Auslenkung regelt herunter
    const SPEED_GK   = 0.155;    // Torwart darf auf der Linie schneller sein als Feldspieler
    const GK_REACH   = 0.65;     // Fangradius muss klar unter der halben Torbreite bleiben
    const KEEPER_SPACE = 0.17;  // Abstand, den Gegner zum ballhaltenden Torwart wahren
    const IDLE_TAKEOVER = 8;    // Sekunden ohne Eingabe, dann übernimmt die KI
    const GK_REACT   = 0.28;    // Reaktionszeit, bevor der Torwart dem Schuss folgt
    const STICK_DEAD = 0.12;    // Totzone des Analogsticks
    const STICK_FULL = 0.95;    // ab dieser Auslenkung volles Tempo
    const STICK_MIN  = 0.22;    // Tempo bei minimaler Auslenkung (Anteil)
    // Dribbling: Der Ball wird angetippt und rollt frei weiter, der Spieler
    // läuft ihm nach. Die Stoßlänge ergibt sich dadurch von selbst aus dem
    // Tempo — langsam kurze Stöße, im Sprint lange.
    const TOUCH_K_LOW  = 1.45;   // sanfter Stoß beim langsamen Dribbeln
    const TOUCH_K_HIGH = 2.5;   // harter Stoß im Sprint
    const DRIBBLE_FRIC = 3.0;   // Reibung des gedribbelten Balls — hoch, damit
                                // die Vorlagen kurz und die Kontakte häufig sind
    const CONTROL_R    = 0.115; // darüber ist der Ball nicht mehr kontrolliert
    const CONTACT      = PLAYER_R + BALL_R;   // Spielerrand berührt Ballrand
    const TURN_PULL    = 7.0;   // wie schnell der vorgelegte Ball der Laufrichtung folgt
    const BALL_DRAG    = 0.92;  // Ballführender ist langsamer als ein freier Spieler
    const TACKLE_MAN   = PLAYER_R * 2.6;  // Grätsche erwischt auch den Mann, nicht nur den Ball
    const TACKLE_TIME  = 0.55;  // Dauer der Grätsche — für Mensch und KI dieselbe
    const TACKLE_DOWN  = 0.35;  // danach liegt man kurz — eine Grätsche kostet etwas
    // Zwei Stufen auf derselben Taste: kurz antippen greift an, gehalten grätscht.
    const LONG_PRESS   = 0.20;  // ab hier wird aus dem Angriff eine Grätsche
    const POKE_TIME    = 0.24;  // Dauer des Angriffs
    const POKE_BOOST   = 1.3;   // kurzer Schritt zum Ball
    const POKE_RATE    = 2.6;   // Zweikampfdruck dabei (Grätsche 3,4, normal 1,5)
    // Hechtsprung: das offensive Gegenstück zur Grätsche. Man macht sich lang,
    // um eine Hereingabe doch noch zu erreichen — und liegt danach kurz.
    const DIVE_TIME    = 0.45;  // Dauer des Sprungs
    const DIVE_SPEED   = 0.42;  // Tempo währenddessen, nicht steuerbar
    const DIVE_REACH   = PLAYER_R * 2.2 + BALL_R;   // gestreckte Reichweite zum Ball
    const DIVE_DOWN    = 0.7;   // so lange liegt man danach
    const DIVE_ZONE    = 0.26;  // nur so nah am gegnerischen Tor
    const DIVE_MIN_V   = 0.30;  // und nur auf eine scharf gespielte Hereingabe
    const HEADER_SPEED = 0.62;  // Wucht des abgefälschten Balls
    const SHOT_RANGE   = 0.36;  // ab hier denkt die KI überhaupt ans Abschließen
    const LANE_MIN     = 0.012; // so viel Luft braucht die Schussbahn am Gegner vorbei
    // Angriffswege, die sich die KI je Ballbesitz aussucht. Flügel doppelt
    // gewichtet — sonst läuft jeder Angriff wieder durch die Mitte.
    const ROUTES = [-1, -1, 0, 1, 1];
    const REACH_EPS    = 0.002; // winzige Toleranz gegen Rundungslücken
    const INTENT_TIME  = 1.1;   // so lange wartet eine Schuss-/Passabsicht auf Kontakt
    const FRICTION   = 0.72;
    const PASS_SPEED = 0.50;
    const SHOT_SPEED = 0.70;

    const RESTART_KICK = 1.6;   // Standbild vor dem Anstoß
    const RESTART_GOAL = 2.4;   // …und nach einem Tor, etwas länger zum Jubeln
    const HIST_LEN     = 150;   // Frames im Speicher für die Wiederholung (2,5 s)
    const REPLAY_SPEED = 0.45;  // Zeitlupe — 2,5 s Szene werden so zu 5,6 s
    const GOAL_WAIT    = 12;    // so lange bleibt die Toranzeige stehen, wenn niemand drückt
    const AUTO_REPLAY  = 1.1;   // so lange steht TOR!, dann läuft die Wiederholung von selbst
    // Die beiden eigenen Regler aus dem Einstellungsmenü. Fehlt `api.setting`
    // (Prüfstand, Einbettung), gelten die Vorgabewerte.
    const HALF_TIME  = api.setting?.('duration') ?? 180;   // Sekunden je Halbzeit
    const SCHWIERIG  = api.setting?.('difficulty') ?? 'normal';
    // Wann das Spiel die Figur von sich aus wechselt:
    //   manuell     — nie, man wechselt selbst mit A
    //   ballgewinn  — sobald ein eigener Spieler den Ball hat
    //   amball      — zusätzlich immer zum Spieler, der dem Ball am nächsten ist
    const SWITCH_MODE = api.setting?.('switch') ?? 'ballgewinn';
    const REPLAY_ON   = (api.setting?.('replay') ?? 'an') === 'an';
    // Ohne Wiederholung hat die Torpause nur einen Punkt
    const goalItems = () => REPLAY_ON ? ['WEITER', 'WIEDERHOLUNG'] : ['WEITER'];
    // Grundstärke der KI-Gegner; der Turnieraufschlag je Runde kommt dazu
    const SKILL_BASE = SCHWIERIG === 'leicht' ? 0.90 : SCHWIERIG === 'schwer' ? 1.12 : 1;
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

    // c/a = Trikotfarben, bewusst hell genug für den dunklen Rasen.
    // f = Flagge fürs Menü, in den echten Landesfarben — die sind zum Teil
    // dunkel (Schwarz, Marineblau) und taugen deshalb nicht als Trikot.
    const TEAMS = [
      { n: 'DEUTSCHLAND', c: '#f5f5f5', a: '#9e9e9e', f: { t: 'h', c: ['#000000', '#dd0000', '#ffce00'] } },
      { n: 'BRASILIEN',   c: '#ffd54f', a: '#26c6da', f: { t: 'br', c: ['#009b3a', '#fedf00', '#002776'] } },
      { n: 'ARGENTINIEN', c: '#81d4fa', a: '#f5f5f5', f: { t: 'h', c: ['#74acdf', '#ffffff', '#74acdf'] } },
      { n: 'FRANKREICH',  c: '#7986cb', a: '#ef5350', f: { t: 'v', c: ['#0055a4', '#ffffff', '#ef4135'] } },
      { n: 'ITALIEN',     c: '#42a5f5', a: '#f5f5f5', f: { t: 'v', c: ['#008c45', '#f4f5f0', '#cd212a'] } },
      { n: 'ENGLAND',     c: '#fafafa', a: '#ef5350', f: { t: 'cr', c: ['#ffffff', '#ce1124'] } },
      { n: 'SPANIEN',     c: '#ef5350', a: '#ffca28', f: { t: 'h', c: ['#aa151b', '#f1bf00', '#aa151b'], w: [1, 2, 1] } },
      { n: 'NIEDERLANDE', c: '#fb8c00', a: '#f5f5f5', f: { t: 'h', c: ['#ae1c28', '#ffffff', '#21468b'] } },
      { n: 'PORTUGAL',    c: '#e53935', a: '#66bb6a', f: { t: 'v', c: ['#046a38', '#da291c'], w: [2, 3] } },
      { n: 'BELGIEN',     c: '#ff7043', a: '#fdd835', f: { t: 'v', c: ['#000000', '#fdda24', '#ef3340'] } },
      { n: 'KROATIEN',    c: '#ec407a', a: '#f5f5f5', f: { t: 'h', c: ['#ff0000', '#ffffff', '#171796'], m: 'check' } },
      { n: 'URUGUAY',     c: '#4fc3f7', a: '#f5f5f5', f: { t: 'h', c: ['#ffffff', '#0038a8', '#ffffff', '#0038a8', '#ffffff'], m: 'sun' } },
      { n: 'MEXIKO',      c: '#66bb6a', a: '#f5f5f5', f: { t: 'v', c: ['#006847', '#ffffff', '#ce1126'], m: 'emblem' } },
      { n: 'JAPAN',       c: '#9575cd', a: '#ef5350', f: { t: 'di', c: ['#ffffff', '#bc002d'] } },
      { n: 'NIGERIA',     c: '#9ccc65', a: '#f5f5f5', f: { t: 'v', c: ['#008751', '#ffffff', '#008751'] } },
      { n: 'USA',         c: '#f5f5f5', a: '#5c6bc0', f: { t: 'us', c: [] } }
    ];

    let w = W, h = H;

    // ── Zustand ──────────────────────────────────────────
    const state = {
      route: 0,             // Angriffsweg: -1 links, 0 Mitte, 1 rechts
      phase: 'mode',        // mode|count|side|team|foe|intro|play|goal|half|result|champion|out
      twoPlayers: false,    // zu zweit gewählt? Die Seiten-Frage hat sonst keinen Sinn
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
      hist: [], replay: null,        // Mitschnitt und laufende Wiederholung
      goalWait: 0, goalTeam: 0, autoReplay: -1,   // Toranzeige: Restzeit, Torschütze, Countdown zur Wiederholung
      kickoffFor: 0, kickoffLock: 0, restart: 0,
      kickoffTo: null, kickoffToT: 0,   // Anstoßpass ist für diesen Spieler reserviert
      lastAct: new Map(),   // letzte echte Eingabe je Spieler-Slot
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
    // Eigener Ton für den Angriff — vorher lief er auf dem Menü-Blip mit und
    // war im Spiel nicht als Aktion zu erkennen
    const sndPoke   = () => blip(420, 0.035, 'square', 0.10);
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
    // Turnierstärke. Sie gilt **nur für den Gegner** (in der WM immer Team 1 —
    // Gegeneinander gibt es nur im Freundschaftsspiel). Vorher galt derselbe
    // Aufschlag für beide Seiten und machte damit auch die eigenen Mitspieler
    // und den eigenen Torwart stärker, was den Großteil der Wirkung aufhob.
    const SKILL_STEP = 0.075;
    const skill = (team = 1) =>
      (team === 1) ? SKILL_BASE + (state.mode === 'cup' ? state.round * SKILL_STEP : 0) : 1;

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
            ctrl: 0, steal: 0, lockout: 0, tackle: 0, poke: 0, bHold: -1, gkHold: 0, dive: 0, down: 0, downMax: 1, dx: 0, dy: 0
          });
        });
      }
      state.ball = { x: FIELD_W / 2, y: 0.5, vx: 0, vy: 0, owner: null };
    }

    function kickoff(forTeam, delay = RESTART_KICK) {
      for (const p of state.players) {
        const hp = homePos(p.team, p.i);
        p.x = hp.x; p.y = hp.y; p.vx = 0; p.vy = 0;
        p.steal = 0; p.lockout = 0; p.tackle = 0; p.poke = 0; p.bHold = -1; p.gkHold = 0; p.dive = 0; p.down = 0;
      }
      // Anstoßende Mannschaft stellt den Stürmer an den Ball und den
      // Mitspieler schräg dahinter — er bekommt gleich den Anstoßpass
      const fwd = state.players.find(p => p.team === forTeam && p.role === 'FWD');
      if (fwd) {
        fwd.x = FIELD_W / 2;
        fwd.y = 0.5 + (forTeam === 0 ? -0.03 : 0.03);
        fwd.fx = 0; fwd.fy = forTeam === 0 ? 1 : -1;
      }
      const mate = state.players.find(p => p.team === forTeam && p.role !== 'GK' && p !== fwd);
      if (mate) {
        const side = mate.x < FIELD_W / 2 ? -1 : 1;
        mate.x = FIELD_W / 2 + side * 0.10;
        mate.y = 0.5 + (forTeam === 0 ? -0.09 : 0.09);
      }

      // Wie im echten Fußball: die andere Mannschaft bleibt beim Anstoß in
      // der eigenen Hälfte. Sonst steht ihr Stürmer genau auf dem Abnehmer
      // und fängt den Anstoßpass sofort ab.
      for (const p of state.players) {
        if (p.team === forTeam || p.role === 'GK') continue;
        p.y = forTeam === 0 ? Math.max(p.y, 0.62) : Math.min(p.y, 0.38);
      }
      const b = state.ball;
      b.x = FIELD_W / 2; b.y = 0.5; b.vx = 0; b.vy = 0; b.owner = fwd || null;
      state.kickoffLock = 0.6;
      state.restart = delay;
      state.kickoffTo = null; state.kickoffToT = 0;
      assignControl(true);
    }

    // Anstoß: der Ball wird kurz zum Mitspieler gespielt, statt dass der
    // Schütze einfach losdribbelt
    function kickoffPass() {
      const b = state.ball;
      const taker = b.owner;
      if (!taker) return;
      const mate = state.players.find(p => p.team === taker.team && p !== taker && p.role !== 'GK');
      if (!mate) return;
      const dx = mate.x - taker.x, dy = mate.y - taker.y;
      const len = Math.hypot(dx, dy) || 1;
      b.owner = null;
      b.vx = dx / len * PASS_SPEED * 0.75;
      b.vy = dy / len * PASS_SPEED * 0.75;
      taker.lockout = 0.35;
      // Der Anstoßpass gehört dem Abnehmer. Ohne diese Reservierung ging der
      // erste Ball oft direkt verloren — abgefangen oder am Mitspieler vorbei.
      state.kickoffTo = mate;
      state.kickoffToT = 3.5;
      sndPass();
    }

    function startMatch() {
      state.score = [0, 0];
      state.half = 1;
      state.clock = HALF_TIME;
      state.golden = false; state.goldenT = 0;
      state.msg = ''; state.msgTimer = 0;
      buildTeams();
      state.lastAct = new Map([[1, state.t], [2, state.t]]);
      state.kickoffFor = 0;
      kickoff(0);
      state.msg = 'ANSTOSS'; state.msgTimer = RESTART_KICK;
      state.phase = 'play';
      sndWhistle();
    }

    // ── Steuerung zuweisen ───────────────────────────────
    // Jeder Mensch bekommt einen eigenen Feldspieler und behält ihn.
    // Gewechselt wird nur bewusst per B — oder automatisch auf den
    // Ballführenden, sobald die eigene Mannschaft den Ball hat.
    // Der Torwart bleibt immer KI.
    let ctrlCooldown = 0;
    // Ein Platz gilt nur als menschlich besetzt, solange dort auch wirklich
    // gespielt wird. Wer länger nichts drückt, gibt ihn an die KI ab — sonst
    // steht die Figur nutzlos herum.
    function humanSlots() {
      const conns = api.getConns();
      return [1, 2].filter(p => conns.has(p) && !slotIdle(p));
    }
    function slotIdle(p) {
      const last = state.lastAct.get(p);
      return last !== undefined && state.t - last >= IDLE_TAKEOVER;
    }
    // Welche Mannschaft steuert ein Spieler-Slot? Im Modus „gegeneinander"
    // übernimmt Spieler 2 die gegnerische Mannschaft, sonst spielen beide zusammen.
    function teamOfSlot(slot) {
      return (state.twoPlayers && state.teamMode === 'versus' && slot === 2) ? 1 : 0;
    }
    function assignControl(force = false) {
      if (!force && ctrlCooldown > 0) return;
      ctrlCooldown = 0.4;
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

        // Sind ohnehin alle Feldspieler von Menschen besetzt, bleibt die
        // Zuordnung fest. Ein Wechsel nach Ballnähe brächte dann nichts —
        // er würde den Spielern nur gegenseitig die Figur wegtauschen.
        if (mine.length >= cands.length) {
          for (const slot of mine) {
            const prev = prevOf.get(slot);
            const pick = (prev && prev.team === team && !taken.has(prev))
              ? prev
              : cands.find(c => !taken.has(c));
            if (pick) { pick.ctrl = slot; taken.add(pick); }
          }
          continue;
        }

        const owner = (b.owner && b.owner.team === team && b.owner.role !== 'GK') ? b.owner : null;

        // Wen das Spiel von sich aus übernimmt, hängt an der Einstellung
        // SPIELERWECHSEL. Ein Wechsel nach Ballnähe kann im Alleingang
        // verwirren, weil die Figur unter den Fingern wechselt — deshalb ist
        // er nicht die Vorgabe, aber für alle da, die ihn gewohnt sind.
        let auto = null;
        if (SWITCH_MODE !== 'manuell' && owner) auto = owner;
        else if (SWITCH_MODE === 'amball') auto = nearestOfTeam(team, b);

        if (auto && !taken.has(auto)) {
          const slot = mine.find(s => prevOf.get(s) === auto) ?? mine[0];
          auto.ctrl = slot;
          taken.add(auto);
        }
        for (const slot of mine) {
          if (auto && auto.ctrl === slot) continue;
          const prev = prevOf.get(slot);
          const pick = (prev && prev.team === team && !taken.has(prev))
            ? prev
            : cands.find(c => !taken.has(c));
          if (pick) { pick.ctrl = slot; taken.add(pick); }
        }
      }
    }

    // Bewusster Spielerwechsel per B: zum nächsten eigenen Feldspieler, der
    // nicht schon von einem anderen Menschen gesteuert wird.
    function cycleControl(slot) {
      const team = teamOfSlot(slot);
      const cands = state.players.filter(p => p.team === team && p.role !== 'GK');
      if (cands.length < 2) return;
      const cur = cands.find(p => p.ctrl === slot);
      const start = cur ? cands.indexOf(cur) : -1;
      for (let k = 1; k <= cands.length; k++) {
        const next = cands[(start + k + cands.length) % cands.length];
        if (next === cur || (next.ctrl && next.ctrl !== slot)) continue;
        if (cur) cur.ctrl = 0;
        next.ctrl = slot;
        ctrlCooldown = 0.4;      // die Zuweisung soll den Wechsel nicht sofort überschreiben
        sndMenu();
        return;
      }
    }

    // ── Ballaktionen ─────────────────────────────────────
    function giveBall(p) {
      const prev = state.ball.owner;
      if (prev && prev !== p) prev.lockout = 0.45;
      // Bei jedem Ballgewinn einen neuen Angriffsweg wählen: mal über links,
      // mal durch die Mitte, mal über rechts. Ohne das lief die KI jedes Mal
      // dieselbe Bahn schnurstracks auf den Torwart zu.
      if (!prev || prev.team !== p.team) state.route = ROUTES[(Math.random() * ROUTES.length) | 0];
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
    function shoot(p, aim) { if (state.ball.owner === p) pending = { kind: 'shoot', p, t: INTENT_TIME, aim }; }
    function pass(p)  { if (state.ball.owner === p) pending = { kind: 'pass',  p, t: INTENT_TIME }; }

    // Getreten wird erst, wenn der Spieler den Ball auch berührt. Bis dahin
    // bleibt die Absicht kurz gemerkt — sonst liefe der Schuss ins Leere,
    // während der Ball beim Dribbeln gerade vorausrollt.
    function applyPending(dt) {
      if (!pending) return;
      const { kind, p } = pending;
      const pending2 = pending;
      const b = state.ball;
      if (b.owner !== p) { pending = null; return; }
      if (Math.hypot(b.x - p.x, b.y - p.y) <= CONTACT + REACH_EPS) {
        pending = null;
        if (kind === 'shoot') doShoot(p, pending2.aim); else doPass(p);
        return;
      }
      pending.t -= dt;
      if (pending.t <= 0) pending = null;
    }

    // Hechtsprung: nur ohne Ball, nur vor dem gegnerischen Tor, nur auf einen
    // freien Ball in Bewegung — sonst wäre es die bessere Grätsche und man
    // spränge überall herum.
    function canDive(p) {
      const b = state.ball;
      if (p.role === 'GK' || p.dive > 0 || p.down > 0) return false;
      if (b.owner) return false;
      if (Math.abs(goalY(p.team) - p.y) > DIVE_ZONE) return false;
      // Nur auf eine scharfe Hereingabe, nicht auf jeden rollenden Ball
      if (Math.hypot(b.vx, b.vy) < DIVE_MIN_V) return false;
      const d = dist(p, b);
      // Und nur, wenn man ihn zu Fuß eben nicht mehr erreicht — sonst wäre der
      // Sprung immer die bessere Grätsche und man höbe dauernd ab
      return d > CONTACT + 0.035 && d < 0.13;
    }

    function startTackle(p) {
      if (p.tackle > 0 || p.down > 0 || p.dive > 0) return;
      p.poke = 0;
      p.tackle = TACKLE_TIME;
      p.poke = 0;
      sndKick();
    }

    // Angriff: der kurze Schritt zum Ball. Kein Risiko, keine Liegezeit —
    // dafür weniger Reichweite und weniger Druck als die Grätsche.
    function startPoke(p) {
      if (p.tackle > 0 || p.down > 0 || p.dive > 0 || p.poke > 0) return;
      p.poke = POKE_TIME;
      sndPoke();
    }

    function startDive(p) {
      p.dive = DIVE_TIME;
      // In Richtung Ball abspringen, nicht in Laufrichtung — man hechtet ja
      // dorthin, wo der Ball hinkommt
      const b = state.ball;
      const tx = b.x + b.vx * 0.12, ty = b.y + b.vy * 0.12;
      const dx = tx - p.x, dy = ty - p.y;
      const len = Math.hypot(dx, dy) || 1;
      p.dx = dx / len; p.dy = dy / len;
      p.fx = p.dx; p.fy = p.dy;
      sndKick();
    }

    // Berührung im Sprung: der Ball wird abgefälscht, nicht angenommen.
    function headerHit(p) {
      const b = state.ball;
      const gy = goalY(p.team);
      const tx = FIELD_W / 2 + (Math.random() - 0.5) * GOAL_W * 2.4;   // im Sprung zielt niemand genau
      const dx = tx - b.x, dy = gy - b.y;
      const len = Math.hypot(dx, dy) || 1;
      b.owner = null;
      b.vx = dx / len * HEADER_SPEED;
      b.vy = dy / len * HEADER_SPEED;
      p.dive = 0; p.down = DIVE_DOWN; p.downMax = DIVE_DOWN;
      p.lockout = DIVE_DOWN;
      state.shake = 0.25;
      sndShot();
    }

    function doShoot(p, aim) {
      const b = state.ball;
      if (b.owner !== p) return;
      const gy = goalY(p.team);
      // Zielpunkt im Tor leicht streuen; Genauigkeit sinkt mit der Distanz
      const d = Math.abs(gy - p.y);
      const spread = GOAL_W * (0.55 + d * 1.7) * (p.ctrl ? 0.7 : 1 / skill(p.team));
      // Mit Zielpunkt (KI) wird auf die freie Ecke gezielt, ohne (Mensch)
      // weiterhin auf eine zufällige Ecke
      const corner = (Math.random() < 0.5 ? -1 : 1) * GOAL_W * 0.36;
      const tx = aim !== undefined
        ? aim + (Math.random() - 0.5) * spread
        : FIELD_W / 2 + corner + (Math.random() - 0.5) * spread;
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
        return { x, y, analog: false };
      }
      // analog: true merkt sich, dass das Tempo der Auslenkung folgen soll
      if (gp.joystick?.active) return { x: gp.joystick.x, y: gp.joystick.y, analog: true };
      const x = (gp.dpad?.right ? 1 : 0) - (gp.dpad?.left ? 1 : 0);
      const y = (gp.dpad?.down ? 1 : 0) - (gp.dpad?.up ? 1 : 0);
      return { x, y, analog: false };
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

    // Grätsche: kurzer Antritt, danach rutscht man aus. Ein konstanter
    // Tempobonus über die ganze Dauer fühlte sich an wie Rennen, nicht wie
    // Rutschen — am Ende ist man langsamer als im Lauf.
    function tackleBoost(p) {
      if (p.poke > 0) return POKE_BOOST;
      if (p.tackle <= 0) return 1;
      const t = 1 - p.tackle / TACKLE_TIME;
      return 0.88 + 0.62 * Math.exp(-3.0 * t);
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
      moveToward(p, tx, ty, SPEED_GK * skill(p.team), dt);

      // Ball halten und nach kurzer Pause herausspielen
      if (state.ball.owner === p) {
        p.vx = 0; p.vy = 0;
        p.gkHold -= dt;
        if (p.gkHold <= 0) pass(p);   // Abschlag, ebenfalls verzögert ausgeführt
      }
    }

    // Bester Zielpunkt im Tor. Geprüft wird für mehrere Punkte über die
    // Torbreite, wie viel Luft die Schussbahn am nächsten Gegner lässt.
    // Der Torwart zählt mit, aber breiter — an ihm muss man vorbeizielen,
    // er darf den Abschluss nicht ganz verhindern. Vorher galt jeder Gegner
    // im Weg pauschal als Block, wodurch die KI vor dem Tor nie abschloss.
    function shotLane(p) {
      const gy = goalY(p.team);
      let best = null;
      for (let i = 0; i < 7; i++) {
        const tx = FIELD_W / 2 + (i / 6 - 0.5) * GOAL_W * 0.8;
        const dx = tx - p.x, dy = gy - p.y;
        const len = Math.hypot(dx, dy) || 1;
        let clear = Infinity;
        for (const o of state.players) {
          if (o.team === p.team) continue;
          const t = ((o.x - p.x) * dx + (o.y - p.y) * dy) / (len * len);
          if (t <= 0.05 || t > 1) continue;              // nur was wirklich davor steht
          const d = Math.hypot(o.x - (p.x + dx * t), o.y - (p.y + dy * t))
                  - PLAYER_R * (o.role === 'GK' ? 1.5 : 1);
          if (d < clear) clear = d;
        }
        if (!best || clear > best.clear) best = { tx, clear, len };
      }
      return best;
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
      // Abschluss: je näher am Tor und je freier die Bahn, desto eher.
      // Dadurch fallen sowohl Distanzschüsse bei freier Bahn als auch
      // Abschlüsse aus kurzer Distanz, wo vorher nur weitergedribbelt wurde.
      const lane = shotLane(p);
      if (lane.len < SHOT_RANGE + 0.06 * skill(p.team) && lane.clear > LANE_MIN) {
        const urge = (1 - lane.len / SHOT_RANGE) * Math.min(1, lane.clear / 0.05);
        if (Math.random() < dt * (0.3 + 1.7 * urge) * skill(p.team)) { shoot(p, lane.tx); return; }
      }
      if (press < 0.075 && Math.random() < dt * 2.0) { pass(p); return; }
      if (gdist > 0.55 && press < 0.11 && Math.random() < dt * 0.9) { pass(p); return; }

      // Laufweg nach gewähltem Angriffsweg. Über den Flügel bis auf Höhe des
      // Strafraums, dort nach innen ziehen — statt immer geradeaus aufs Tor.
      const lead = Math.abs(gy - p.y);
      const wing = FIELD_W / 2 + state.route * FIELD_W * 0.36;
      // Erst auf die Bahn ziehen, dann vorstoßen. Ein bloß schräger Kurs
      // reichte nicht — der Spieler kam vorn trotzdem in der Mitte an, weil
      // er nach vorn viel mehr Strecke macht als zur Seite.
      const nearGoal = lead < BOX_D * 1.6;
      const goalX = nearGoal ? FIELD_W / 2 + state.route * GOAL_W * 0.45 : wing;
      let tx = nearGoal ? goalX : p.x + clamp(goalX - p.x, -0.3, 0.3);
      let ty = p.y + (gy > p.y ? 1 : -1) * (nearGoal ? 0.3 : 0.22);
      for (const o of state.players) {
        if (o.team === p.team) continue;
        const d = dist(p, o);
        if (d < 0.12) { tx += (p.x - o.x) * 0.8; ty += (p.y - o.y) * 0.3; }
      }
      moveToward(p, tx, ty, SPEED * (0.94 + 0.06 * skill(p.team)) * BALL_DRAG, dt);
    }

    function aiOutfield(p, dt) {
      const b = state.ball;
      const hp = homePos(p.team, p.i);
      const gy = goalY(p.team);
      const owner = b.owner;

      if (owner === p) { aiWithBall(p, dt); return; }

      // Vor dem Tor nach einer Hereingabe langmachen — sonst sähe man den
      // Sprung nur beim Menschen
      if (canDive(p) && Math.random() < dt * 1.1 * skill(p.team)) { startDive(p); return; }

      // Anstoßpass: der vorgesehene Abnehmer geht auf jeden Fall zum Ball
      if (state.kickoffTo === p && !owner) {
        moveToward(p, b.x, b.y, SPEED, dt);
        return;
      }

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
        if (Math.abs(gy - b.y) < 0.30) {
          // Ball im letzten Drittel: auf die ballabgewandte Seite in den
          // Strafraum einlaufen. Damit gibt es überhaupt ein Ziel für Flanke
          // und Abstauber — vorher blieb der zweite Angreifer immer hinter
          // dem Ballführenden hängen.
          const side = b.x < FIELD_W / 2 ? 1 : -1;
          tx = FIELD_W / 2 + side * GOAL_W * 0.6;
          ty = gy === 1 ? 1 - BOX_D * 0.7 : BOX_D * 0.7;
        } else {
          // Anbieten: Position Richtung gegnerisches Tor verschieben
          const push = gy === 1 ? 0.16 : -0.16;
          tx = hp.x * 0.65 + b.x * 0.35;
          ty = hp.y + push + (b.y - 0.5) * 0.25;
        }
      } else {
        // Verteidigen: einer presst, der Rest deckt den Raum zum eigenen Tor
        if (chaser === p) {
          tx = owner.x; ty = owner.y;
          // Nah genug dran: auch die KI grätscht — sonst sieht man die
          // Aktion nur beim Menschen und Zweikämpfe wirken zahnlos
          // Die KI greift meist nur an und grätscht seltener — genau die
          // Abwägung, die der Mensch über die Tastendauer trifft.
          if (p.tackle <= 0 && p.poke <= 0 && dist(p, owner) < PLAYER_R * 4.5) {
            if (Math.random() < dt * 0.45 * skill(p.team)) startTackle(p);
            else if (Math.random() < dt * 1.6 * skill(p.team)) startPoke(p);
          }
        }
        else {
          const ownGoal = gy === 1 ? 0 : 1;
          if (Math.abs(owner.y - ownGoal) < 0.42) {
            // Im eigenen Drittel verdoppeln. Seitlich versetzt und einen
            // Schritt näher am eigenen Tor — stünden beide hintereinander,
            // liefe der Gegner an einem vorbei und wäre den anderen gleich mit los.
            const side = owner.x < FIELD_W / 2 ? 1 : -1;
            tx = owner.x + side * PLAYER_R * 3;
            ty = owner.y + (ownGoal === 0 ? -1 : 1) * PLAYER_R * 1.6;
            // Auch der zweite Verteidiger darf grätschen, wenn er dran ist
            if (p.tackle <= 0 && p.poke <= 0 && dist(p, owner) < PLAYER_R * 4.5) {
              if (Math.random() < dt * 0.28 * skill(p.team)) startTackle(p);
              else if (Math.random() < dt * 1.0 * skill(p.team)) startPoke(p);
            }
          } else {
            tx = hp.x * 0.6 + b.x * 0.4;
            ty = hp.y * 0.65 + (b.y + (gy === 1 ? -0.12 : 0.12)) * 0.35;
          }
        }
      }
      tx = clamp(tx, PLAYER_R, FIELD_W - PLAYER_R);
      ty = clamp(ty, PLAYER_R, 1 - PLAYER_R);
      // Auch die KI macht bei der Grätsche einen Ausfallschritt. Ohne den war
      // ihre Grätsche nur Anzeige: sie setzte das Flag, kam dem Ball aber
      // keinen Zentimeter näher.
      moveToward(p, tx, ty, SPEED * (0.9 + 0.1 * skill(p.team)) * tackleBoost(p), dt);
    }

    function updateGoal(dt) {
      if (state.replay) {
        state.replay.i += REPLAY_SPEED;
        // Nach der Wiederholung steht die Auswahl wieder auf WEITER — sonst
        // startet der nächste Druck versehentlich noch eine Wiederholung
        if (state.replay.i >= state.hist.length - 1) { state.replay = null; state.menuSel = 0; }
        return;
      }
      if (state.autoReplay > 0) {
        state.autoReplay -= dt;
        if (state.autoReplay <= 0) { state.autoReplay = -1; startReplay(); return; }
      }
      state.goalWait -= dt;
      if (state.goalWait <= 0) weiterNachTor();
    }

    // ── Match-Update ─────────────────────────────────────
    function updateMatch(dt) {
      const b = state.ball;
      state.kickoffLock = Math.max(0, state.kickoffLock - dt);
      ctrlCooldown = Math.max(0, ctrlCooldown - dt);
      assignControl();

      // Anstoß-Pause: Spieler und Ball stehen still, damit man den Neubeginn
      // überhaupt mitbekommt. Die Uhr läuft solange ebenfalls nicht.
      if (state.kickoffToT > 0) {
        state.kickoffToT -= dt;
        if (state.kickoffToT <= 0) state.kickoffTo = null;
      }

      if (state.restart > 0) {
        state.restart -= dt;
        if (state.msgTimer > 0) state.msgTimer -= dt;
        if (state.restart <= 0) kickoffPass();
        return;
      }

      // Mitschnitt für die Wiederholung. Nur Positionen — mehr braucht es
      // nicht, um die Szene noch einmal zu zeichnen.
      state.hist.push({
        bx: b.x, by: b.y,
        p: state.players.map(p => [p.x, p.y, p.fx, p.fy])
      });
      if (state.hist.length > HIST_LEN) state.hist.shift();

      // Zwei Durchgänge: erst entscheiden alle aus demselben Weltzustand,
      // dann bewegen sich alle. Würde beides in einer Schleife passieren,
      // sähe die zweite Mannschaft bereits die neuen Positionen der ersten
      // und hätte einen Frame weniger Reaktionsverzug.
      for (const p of state.players) {
        p.lockout = Math.max(0, p.lockout - dt);
        p.down    = Math.max(0, p.down - dt);
        // Nach der Grätsche liegt man kurz. Ohne das ist sie folgenlos und man
        // grätscht einfach dauernd — jetzt kostet ein Fehlversuch Zeit.
        p.poke = Math.max(0, p.poke - dt);
        // Gehaltene B-Taste: aus dem Angriff wird eine Grätsche
        if (p.bHold >= 0) {
          p.bHold += dt;
          // Aus dem laufenden Angriff wird die Grätsche, wenn die Taste liegen bleibt
          if (p.bHold >= LONG_PRESS) { p.poke = 0; startTackle(p); p.bHold = -1; }
        }
        const graetschte = p.tackle > 0;
        p.tackle = Math.max(0, p.tackle - dt);
        // Nur wer den Ball verfehlt hat, liegt danach. Eine geglückte
        // Grätsche belohnt sich selbst — sonst verlöre man den eben eroberten
        // Ball sofort wieder, weil man reglos daneben liegt.
        if (graetschte && p.tackle <= 0 && state.ball.owner !== p) {
          p.down = TACKLE_DOWN; p.downMax = TACKLE_DOWN;
          p.lockout = Math.max(p.lockout, TACKLE_DOWN);
        }

        // Im Sprung und am Boden ist nichts zu steuern
        if (p.dive > 0) {
          p.dive -= dt;
          p.vx = p.dx * DIVE_SPEED; p.vy = p.dy * DIVE_SPEED;
          if (dist(p, state.ball) < DIVE_REACH && !state.ball.owner) headerHit(p);
          else if (p.dive <= 0) { p.down = DIVE_DOWN; p.downMax = DIVE_DOWN; }
          continue;
        }
        if (p.down > 0) { p.vx = 0; p.vy = 0; continue; }

        if (p.role === 'GK') { aiGoalkeeper(p, dt); }
        else if (p.ctrl) {
          const mv = inputs.get(p.ctrl) || { x: 0, y: 0 };
          const len = Math.hypot(mv.x, mv.y);
          // Am Analogstick bestimmt die Auslenkung das Tempo — vorher wurde der
          // Vektor normalisiert und man lief immer mit Volltempo. Tastatur und
          // Dpad bleiben digital, dort gibt es nur ganz oder gar nicht.
          const push = mv.analog
            ? STICK_MIN + (1 - STICK_MIN) *
              clamp((len - STICK_DEAD) / (STICK_FULL - STICK_DEAD), 0, 1)
            : 1;
          // Mit Ball am Fuß läuft man langsamer — sonst ist ein Ballführender
          // nicht einzuholen und jeder Zweikampf entschieden, bevor er beginnt
          const sp = SPEED_HUM * tackleBoost(p) * push
                   * (state.ball.owner === p ? BALL_DRAG : 1);
          if (len > (mv.analog ? STICK_DEAD : 0.15)) {
            // Bildschirmeingabe in Feldrichtung umrechnen. Im Querformat wird
            // nach rechts angegriffen, dort entspricht rechts also +y.
            if (isLandscape()) { p.vx = mv.y / len * sp; p.vy = mv.x / len * sp; }
            else               { p.vx = mv.x / len * sp; p.vy = -mv.y / len * sp; }
          } else { p.vx = 0; p.vy = 0; }
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

      applyPending(dt);

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
        const spd = Math.hypot(o.vx, o.vy);
        const near = CONTACT;

        // Der Ball rollt auch beim Dribbeln eigenständig weiter
        b.x += b.vx * dt; b.y += b.vy * dt;
        const damp = Math.exp(-DRIBBLE_FRIC * dt);
        b.vx *= damp; b.vy *= damp;

        const dx = b.x - o.x, dy = b.y - o.y;
        const d = Math.hypot(dx, dy);

        if (spd > 0.015) {
          // Ball wieder am Fuß: nächster Stoß, Länge folgt dem Lauftempo
          if (d <= CONTACT + REACH_EPS) {
            // Je schneller gelaufen wird, desto härter der Stoß — dadurch
            // wachsen die Vorlagen überproportional mit dem Tempo
            const k = TOUCH_K_LOW +
              Math.min(1, spd / SPEED_HUM) * (TOUCH_K_HIGH - TOUCH_K_LOW);
            b.vx = o.vx * k; b.vy = o.vy * k;
          } else if (d > 1e-5) {
            // Der vorgelegte Ball schwenkt in die Laufrichtung mit, statt stur
            // geradeaus weiterzurollen. Ohne das verliert man den Ball bei
            // jeder Kurve: er liefe nach vorn, während der Spieler abbiegt,
            // und wäre nach CONTROL_R weg. Der Abstand bleibt dabei gleich —
            // die Vorlage wird also nicht kürzer, nur richtungstreu.
            const ax = o.vx / spd, ay = o.vy / spd;
            const f = Math.min(1, TURN_PULL * dt);
            b.x += (o.x + ax * d - b.x) * f;
            b.y += (o.y + ay * d - b.y) * f;
            const bs = Math.hypot(b.vx, b.vy);
            b.vx = ax * bs; b.vy = ay * bs;
          }
        } else {
          // Spieler steht: Ball beruhigen und am Fuß halten
          b.vx *= 0.82; b.vy *= 0.82;
          if (d > near) { b.x = o.x + dx / d * near; b.y = o.y + dy / d * near; }
        }

        // Zu weit vorgelegt — der Ball ist frei, wer zuerst da ist bekommt ihn
        if (d > CONTROL_R) { b.owner = null; o.lockout = 0.12; }

        // Auf dem Feld halten: ein geführter Ball zählt nie als Tor, sonst
        // liefe man ihn einfach hinein
        b.x = clamp(b.x, BALL_R, FIELD_W - BALL_R);
        b.y = clamp(b.y, BALL_R, 1 - BALL_R);
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
            if (p.lockout > 0 || p.dive > 0 || p.down > 0) continue;
            if (state.kickoffTo && p !== state.kickoffTo) continue;
            const reach = (p.role === 'GK' ? PLAYER_R * GK_REACH * gkFatigue() : PLAYER_R) + BALL_R + 0.006;
            const d = dist(p, b);
            if (d < reach && d < td) { td = d; take = p; }
          }
          if (take) {
            if (take.role === 'GK') { take.gkHold = 0.9; sndSave(); }
            if (take === state.kickoffTo) { state.kickoffTo = null; state.kickoffToT = 0; }
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
          // Am Ball zählt der Ball: wer sprintet, schiebt ihn vor sich her
          // und wird dadurch angreifbar. Die Grätsche zählt zusätzlich gegen
          // den MANN — ohne das ist eine Ballabnahme von hinten geometrisch
          // unmöglich, weil der Ball dann immer auf der abgewandten Seite
          // liegt: Körperabstand plus Vorlage übersteigt die Zweikampfgrenze.
          const db = dist(q, b), dp = dist(q, carrier);
          const atBall = db < CONTACT + 0.018;   // kurzer Ausfallschritt zum Ball
          const atMan  = q.tackle > 0 && dp < TACKLE_MAN;
          if (atBall || atMan) {
            // Wer nur danebensteht, erobert kaum etwas — sonst wäre die Taste
            // Zierde: mit 1,5 gewann bloßes Danebenstehen den Ball in 0,6 s,
            // und Angreifen oder Grätschen änderten daran messbar nichts.
            const rate = (q.tackle > 0 ? 3.4 : q.poke > 0 ? POKE_RATE : 0.7)
                       * (q.ctrl ? 1.15 : skill(q.team))
                       * (atBall ? 1 : 0.85);    // von hinten etwas zäher
            q.steal += dt * rate;
            const d = Math.min(db, dp);
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
      state.shake = 0.7;
      sndGoal();
      if (state.golden) { finishMatch(); return; }
      state.kickoffFor = 1 - team;
      // Die Anzeige bleibt stehen, bis jemand weiterdrückt — vorher war das Tor
      // nach 2,4 s vorbei, und man bekam es kaum mit. Ohne Eingabe geht es
      // nach GOAL_WAIT von selbst weiter, damit ein Spiel nie hängen bleibt.
      state.phase = 'goal';
      state.goalTeam = team;
      state.goalWait = GOAL_WAIT;
      state.replay = null;
      state.menuSel = 0;
      // Die Wiederholung startet von selbst — man soll sie nicht suchen müssen
      state.autoReplay = REPLAY_ON ? AUTO_REPLAY : -1;
      state.msg = ''; state.msgTimer = 0;
    }

    // Wiederholung in Zeitlupe aus dem Mitschnitt
    function startReplay() {
      if (state.hist.length < 30) return;
      state.replay = { i: 0 };
      sndMenu();
    }

    function weiterNachTor() {
      state.replay = null;
      state.phase = 'play';
      state.hist.length = 0;
      kickoff(state.kickoffFor, RESTART_KICK);
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

    // ── Menü-Aktionen ────────────────────────────────────
    // Als eigene Funktionen, damit Tastatur, Controller und Mausklick
    // denselben Weg nehmen.
    function activate() {
      switch (state.phase) {
        case 'goal':
          if (state.menuSel === 1) startReplay();
          else weiterNachTor();
          return;

        case 'mode':
          // Dritter Punkt: der Einstellungs-Screen der Konsole. So kommt man
          // an Halbzeitlänge und Schwierigkeit, ohne erst anpfeifen zu müssen.
          if (state.menuSel === 2) { api.openSettings?.(); sndMenu(); return; }
          state.mode = state.menuSel === 0 ? 'cup' : 'friendly';
          state.round = 0;
          state.menuSel = state.twoPlayers ? 1 : 0;
          state.phase = 'count'; sndMenu(); return;

        case 'count':
          state.twoPlayers = state.menuSel === 1;
          if (state.twoPlayers) {
            state.menuSel = state.teamMode === 'coop' ? 0 : 1;
            state.phase = 'side';
          } else {
            state.teamMode = 'coop';       // allein ist die Seiten-Frage gegenstandslos
            state.menuSel = state.myTeam;
            state.phase = 'team';
          }
          sndMenu(); return;

        case 'side':
          state.teamMode = state.menuSel === 0 ? 'coop' : 'versus';
          state.menuSel = state.myTeam;
          state.phase = 'team'; sndMenu(); return;

        case 'team':
          state.myTeam = state.menuSel;
          if (state.mode === 'friendly') {
            state.menuSel = (state.myTeam + 1) % TEAMS.length;
            state.phase = 'foe';
          } else { drawFoe(); state.phase = 'intro'; }
          sndMenu(); return;

        case 'foe':
          if (state.menuSel === state.myTeam) return;   // nicht gegen sich selbst
          state.foeTeam = state.menuSel;
          state.phase = 'intro'; sndMenu(); return;

        case 'intro': startMatch(); return;

        case 'half':
          state.half++;
          state.clock = HALF_TIME;
          state.kickoffFor = 1;
          kickoff(1);
          state.msg = 'ANSTOSS'; state.msgTimer = RESTART_KICK;
          state.phase = 'play';
          sndWhistle(); return;

        case 'result':
          if (state.mode === 'friendly') { state.phase = 'mode'; state.menuSel = 0; }
          else if (state.lastResult === 'WEITER') nextCupRound();
          else state.phase = 'out';
          return;

        case 'champion':
        case 'out':
          state.round = 0; state.phase = 'mode'; state.menuSel = 0; return;
      }
    }

    function goBack() {
      switch (state.phase) {
        case 'count': state.phase = 'mode';  state.menuSel = state.mode === 'cup' ? 0 : 1; break;
        case 'side':  state.phase = 'count'; state.menuSel = state.twoPlayers ? 1 : 0; break;
        case 'foe':   state.phase = 'team';  state.menuSel = state.myTeam; break;
        case 'team':
          if (state.twoPlayers) { state.phase = 'side'; state.menuSel = state.teamMode === 'coop' ? 0 : 1; }
          else { state.phase = 'count'; state.menuSel = 0; }
          break;
        default: return;
      }
      sndMenu();
    }

    // ── Maus ─────────────────────────────────────────────
    // Die Menüs liegen auf dem Canvas, es gibt also keine DOM-Elemente zum
    // Anklicken. Beim Zeichnen werden deshalb Klickflächen registriert.
    const canvasEl = (ctx.canvas && typeof ctx.canvas.addEventListener === 'function')
      ? ctx.canvas : null;
    let hotspots = [];
    function hotspot(x, y, hw, hh, sel) { hotspots.push({ x, y, w: hw, h: hh, sel }); }

    function onCanvasClick(e) {
      const r = canvasEl.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const cx = (e.clientX - r.left) * (canvasEl.width / r.width);
      const cy = (e.clientY - r.top)  * (canvasEl.height / r.height);
      for (const hs of hotspots) {
        if (cx < hs.x || cx > hs.x + hs.w || cy < hs.y || cy > hs.y + hs.h) continue;
        if (hs.sel !== null && hs.sel !== state.menuSel) { state.menuSel = hs.sel; sndMenu(); }
        activate();
        return;
      }
    }
    if (canvasEl) canvasEl.addEventListener('click', onCanvasClick);

    // ── Öffentliche Schnittstelle ────────────────────────
    return {
      resize(nw, nh) { w = nw; h = nh; },      // Positionen sind normalisiert

      input(player, gp, prev) {
        if (gp.select && !prev?.select) { api.exit(); return; }
        const m = menuMove(gp, prev);

        switch (state.phase) {
          case 'mode': {
            const n = 3;                        // WORLD CUP · FREUNDSCHAFTSSPIEL · EINSTELLUNGEN
            if (m.dy) { state.menuSel = (state.menuSel + m.dy + n) % n; sndMenu(); }
            if (m.b) { goBack(); return; }
            if (m.a || m.start) activate();
            return;
          }

          case 'count':
          case 'side':
            if (m.dy) { state.menuSel = (state.menuSel + m.dy + 2) % 2; sndMenu(); }
            if (m.b) { goBack(); return; }
            if (m.a || m.start) activate();
            return;

          case 'team':
          case 'foe': {
            if (state.phase === 'foe' && state.teamMode === 'versus'
                && api.getConns().has(2) && player !== 2) return;
            const cols = 4;
            let s = state.menuSel;
            if (m.dx) s = clamp(s + m.dx, 0, TEAMS.length - 1);
            if (m.dy) s = clamp(s + m.dy * cols, 0, TEAMS.length - 1);
            if (s !== state.menuSel) { state.menuSel = s; sndMenu(); }
            if (m.b) { goBack(); return; }
            if (m.a || m.start) activate();
            return;
          }

          case 'intro':
          case 'half':
          case 'result':
          case 'champion':
          case 'out':
            if (m.a || m.start) activate();
            return;

          case 'goal':
            if (state.replay) {                    // laufende Wiederholung abbrechen
              if (m.a || m.b || m.start) state.replay = null;
              return;
            }
            if (m.dy) { state.menuSel = (state.menuSel + m.dy + goalItems().length) % goalItems().length; sndMenu(); }
            if (m.a || m.start) activate();
            return;

          case 'play': {
            const mv = moveVector(gp);
            inputs.set(player, mv);

            // Nur echte Eingaben zählen. Ein Controller schickt auch im
            // Ruhezustand 30 Pakete pro Sekunde — die dürfen nicht als
            // Aktivität durchgehen.
            if (Math.hypot(mv.x, mv.y) > 0.2 || gp.a || gp.b || gp.start) {
              const wasIdle = slotIdle(player);
              state.lastAct.set(player, state.t);
              if (wasIdle) assignControl(true);   // sofort zurück ans Steuer
            }

            const me = state.players.find(p => p.ctrl === player);
            if (!me) return;
            // A: mit Ball schießen, ohne Ball den Spieler wechseln
            if (edge(gp, prev, 'a')) {
              if (state.ball.owner === me) shoot(me);
              else cycleControl(player);
            }
            // B: mit Ball abspielen. Ohne Ball vor dem gegnerischen Tor der
            // Hechtsprung, sonst kurz antippen = angreifen, gehalten = grätschen.
            // Der Angriff löst sofort beim Drücken aus — er ist die schnelle
            // Aktion und darf sich nicht träge anfühlen. Bleibt die Taste
            // liegen, wird daraus die Grätsche. Vorher entschied erst das
            // Loslassen, wodurch auf den Tastendruck sichtbar nichts geschah.
            if (edge(gp, prev, 'b')) {
              if (state.ball.owner === me) pass(me);
              else if (canDive(me)) startDive(me);
              else { startPoke(me); me.bHold = 0; }
            }
            if (!gp.b && me.bHold >= 0) me.bHold = -1;
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
        else if (state.phase === 'goal') updateGoal(dt);
      },

      draw() {
        hotspots = [];
        ctx.fillStyle = '#0a0e14';
        ctx.fillRect(0, 0, w, h);
        ctx.textAlign = 'center';

        switch (state.phase) {
          case 'mode':     drawModeMenu(); break;
          case 'count':    drawCountMenu(); break;
          case 'side':     drawSideMenu(); break;
          case 'team':
          case 'foe':      drawTeamMenu(); break;
          case 'intro':    drawIntro(); break;
          case 'play':     drawMatch(); break;
          case 'goal':     drawGoal(); break;
          case 'half':     drawMatch(); drawHalf(); break;
          case 'result':   drawMatch(); drawResult(); break;
          case 'champion': drawChampion(); break;
          case 'out':      drawOut(); break;
        }
      },

      destroy() {
        timers.forEach(clearTimeout); timers.length = 0;
        if (canvasEl) canvasEl.removeEventListener('click', onCanvasClick);
      }
    };

    // ── Rendering ────────────────────────────────────────
    // Schriftmaß: auf breiten Schirmen die Höhe, im Hochformat die Breite —
    // sonst laufen die Menütexte seitlich aus dem Bild.
    // Bewusst eine Funktionsdeklaration: dieser Abschnitt steht hinter dem
    // return, und nur Deklarationen werden hochgezogen, const nicht.
    function uni() { return Math.min(h, w * 0.6); }
    function font(px) { return `${Math.floor(px)}px "Press Start 2P", Courier New`; }

    // Im Querformat liegt die Feldlänge waagerecht — sonst bliebe links und
    // rechts viel Bildschirm ungenutzt. Angegriffen wird dann nach rechts.
    function isLandscape() { return w / h > 1.15; }

    function pitchRect() {
      const top = h * 0.11;
      const availH = h - top - h * 0.03;
      const availW = w * 0.96;
      if (isLandscape()) {
        const s = Math.min(availW, availH / FIELD_W);          // Pixel je Feldlänge
        const pw = s, ph = s * FIELD_W;
        return { x: (w - pw) / 2, y: top + (availH - ph) / 2, w: pw, h: ph, s, rot: true };
      }
      const s = Math.min(availH, availW / FIELD_W);
      const pw = s * FIELD_W, ph = s;
      return { x: (w - pw) / 2, y: top + (availH - ph) / 2, w: pw, h: ph, s, rot: false };
    }

    // Feldeinheiten → Pixel.
    // Hochformat: y = 0 unten (eigenes Tor). Querformat: y = 0 links.
    function px(r, x, y) {
      return r.rot
        ? { X: r.x + y * r.s,           Y: r.y + x * r.s }
        : { X: r.x + x * r.s,           Y: r.y + (1 - y) * r.s };
    }
    // Rechteck aus zwei Feld-Eckpunkten, unabhängig von der Ausrichtung
    function fieldRect(r, x1, y1, x2, y2) {
      const a = px(r, x1, y1), b = px(r, x2, y2);
      return { x: Math.min(a.X, b.X), y: Math.min(a.Y, b.Y),
               w: Math.abs(a.X - b.X), h: Math.abs(a.Y - b.Y) };
    }
    // Bildschirmwinkel einer Feldrichtung
    function screenAngle(r, fx, fy) {
      return r.rot ? Math.atan2(fx, fy) : Math.atan2(-fy, fx);
    }

    function drawPitch(r) {
      ctx.fillStyle = TURF;
      ctx.fillRect(r.x, r.y, r.w, r.h);
      // Streifen für die Rasenoptik, quer zur Spielrichtung
      ctx.fillStyle = TURF_ALT;
      const bands = 8;
      for (let i = 0; i < bands; i += 2) {
        const bd = fieldRect(r, 0, i / bands, FIELD_W, (i + 1) / bands);
        ctx.fillRect(bd.x, bd.y, bd.w, bd.h);
      }

      ctx.strokeStyle = LINE;
      ctx.lineWidth = Math.max(1.5, r.s * 0.004);
      ctx.strokeRect(r.x, r.y, r.w, r.h);

      // Mittellinie + Anstoßkreis
      const m1 = px(r, 0, 0.5), m2 = px(r, FIELD_W, 0.5), mc = px(r, FIELD_W / 2, 0.5);
      ctx.beginPath(); ctx.moveTo(m1.X, m1.Y); ctx.lineTo(m2.X, m2.Y); ctx.stroke();
      ctx.beginPath(); ctx.arc(mc.X, mc.Y, r.s * 0.10, 0, Math.PI * 2); ctx.stroke();

      // Strafräume, jeweils an der Torlinie
      for (const [ya, yb] of [[0, BOX_D], [1, 1 - BOX_D]]) {
        const bx = fieldRect(r, FIELD_W / 2 - BOX_W / 2, ya, FIELD_W / 2 + BOX_W / 2, yb);
        ctx.strokeRect(bx.x, bx.y, bx.w, bx.h);
      }

      // Tore, knapp hinter der Linie
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      const d = r.s * 0.022;
      for (const gy of [0, 1]) {
        const g = fieldRect(r, FIELD_W / 2 - GOAL_W / 2, gy, FIELD_W / 2 + GOAL_W / 2, gy);
        if (r.rot) ctx.fillRect(gy === 0 ? g.x - d : g.x, g.y, d, g.h);
        else       ctx.fillRect(g.x, gy === 0 ? g.y : g.y - d, g.w, d);
      }
    }

    // Spieler sind Scheiben, die sich verformen. Die Dehnung ist flächentreu —
    // längs k, quer 1/k, die Scheibe wird also gedehnt, nicht größer.
    // Gestreckt wird schnell und dann gehalten, solange die Aktion dauert;
    // gefedert wird nur beim Aufprall. Eine Schwingung während der Bewegung
    // sah aus wie Gummi statt wie ein Spieler, der sich lang macht.

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
        ctx.strokeStyle = 'rgba(0,0,0,0.55)';
        ctx.lineWidth = Math.max(1, r.s * 0.002);

        // Hechtsprung, Liegen und Grätsche: dieselbe Scheibe, nur verformt.
        // Bildschirm-y ist gespiegelt, deshalb der Winkel über screenAngle.
        let k = 1, ang = 0, alpha = 1, hoehe = 0, gross = 1, vor = 0;
        if (p.dive > 0) {
          // Ein Sprung, keine Gummiwurst: schnell strecken und gestreckt
          // bleiben, solange man fliegt. Die federnde Schwingung gehört zum
          // Aufprall, nicht in die Luft.
          const t = 1 - p.dive / DIVE_TIME;
          k = 1 + 0.85 * Math.min(1, t / 0.18);
          // In der Draufsicht liest sich „abheben" nur über Höhe: der Körper
          // löst sich vom Schatten, wird kurz größer und kommt wieder herunter.
          const bogen = Math.sin(Math.PI * t);
          hoehe = bogen;
          gross = 1 + bogen * 0.12;
          ang = screenAngle(r, p.dx, p.dy);
        } else if (p.down > 0) {
          // Aufschlag, liegen, aufstehen — in einem Zug
          const u = 1 - p.down / (p.downMax || DIVE_DOWN);
          const auf = Math.max(0, Math.min(1, (u - 0.72) / 0.28));
          const weich = auf * auf * (3 - 2 * auf);            // sanft aufstehen
          k = 1 + 0.38 * (1 - weich) + 0.35 * Math.exp(-14 * u);   // erster Klatscher
          ang = screenAngle(r, p.fx, p.fy);
          alpha = 0.82;
        } else if (p.poke > 0) {
          // Angriff: ein kurzer Stich nach vorn — schnell raus, schnell zurück.
          // Bewusst deutlicher als der erste Entwurf (0,3), sonst sieht man im
          // Spiel gar nicht, dass überhaupt etwas passiert ist.
          const t = 1 - p.poke / POKE_TIME;
          const stich = Math.sin(Math.PI * Math.pow(t, 0.7));
          k = 1 + 0.42 * stich;
          vor = stich * rad * 0.5;                 // kurzer Versatz in Blickrichtung
          ang = screenAngle(r, p.fx, p.fy);
        } else if (p.tackle > 0) {
          // Wie beim Sprung: schnell lang machen und lang bleiben, solange man
          // rutscht. Eine federnde Schwingung sah aus wie Gummi statt wie ein
          // Spieler, der sich streckt.
          k = 1 + 0.6 * Math.min(1, (1 - p.tackle / TACKLE_TIME) / 0.14);
          ang = screenAngle(r, p.fx, p.fy);
        }

        if (Math.abs(k - 1) > 0.01) {
          // Gezeichnet wird als Ellipse mit zwei Radien, NICHT als Kreis unter
          // ctx.scale: Eine ungleiche Skalierung verzerrt auch die Kontur, und
          // an den Spitzen entstand dadurch eine dicke Zunge. Mit ctx.ellipse
          // bleibt die Linienstärke überall gleich.
          const koerper = (X, Y, sk, a, lw) => {
            ctx.globalAlpha = a;
            ctx.beginPath();
            ctx.ellipse(X, Y, rad * k * sk, rad / k * sk, ang, 0, Math.PI * 2);
            ctx.fill();
            if (lw) { ctx.lineWidth = lw; ctx.stroke(); }
            ctx.globalAlpha = 1;
          };
          if (hoehe > 0.02) {
            // Schatten bleibt am Boden und wird kleiner, je höher der Sprung
            const merk = ctx.fillStyle;
            ctx.fillStyle = 'rgba(0,0,0,0.45)';
            koerper(q.X, q.Y, 1 - hoehe * 0.25, 0.5, 0);
            ctx.fillStyle = merk;
          }
          koerper(q.X + Math.cos(ang) * vor, q.Y + Math.sin(ang) * vor - hoehe * rad * 1.5,
                  gross, alpha, Math.max(1, r.s * 0.002));
        } else {
          ctx.beginPath(); ctx.arc(q.X, q.Y, rad, 0, Math.PI * 2); ctx.fill();
          ctx.stroke();
        }
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

    // Torpause: entweder das Standbild mit Anzeige oder die Wiederholung.
    // Gezeichnet wird beides mit dem normalen Spielfeld — für die Wiederholung
    // werden die Positionen kurz aus dem Mitschnitt gesetzt und danach wieder
    // zurückgeschrieben.
    // Deutlich als Wiederholung gekennzeichnet — sonst hält man die Zeitlupe
    // für das laufende Spiel und wundert sich, warum nichts reagiert.
    function drawReplayBadge() {
      // Unten mittig und in demselben Gelb wie TOR! — oben links stand sie im
      // Weg des Spielfelds und wirkte wie ein zweites Bedienelement.
      const t = 'WIEDERHOLUNG';
      ctx.font = font(uni() * 0.032);
      const tw = ctx.measureText(t).width;
      const r0 = uni() * 0.012;
      const luecke = uni() * 0.022;
      const x0 = w / 2 - (r0 * 2 + luecke + tw) / 2;
      const y = h * 0.93;

      ctx.save();
      ctx.globalAlpha = 0.5 + 0.5 * Math.abs(Math.sin(state.t * 5));
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath(); ctx.arc(x0 + r0, y - uni() * 0.011, r0, 0, Math.PI * 2); ctx.fill();
      ctx.globalAlpha = 1;
      ctx.textAlign = 'left';
      ctx.shadowColor = '#ffb300';
      ctx.shadowBlur = uni() * 0.03;
      ctx.fillStyle = '#ffd54f';
      ctx.fillText(t, x0 + r0 * 2 + luecke, y);
      ctx.shadowBlur = 0;
      ctx.textAlign = 'center';
      ctx.restore();
    }

    function drawGoal() {
      const r = pitchRect();
      if (state.replay) {
        const i = Math.min(state.hist.length - 1, Math.floor(state.replay.i));
        const f = state.hist[i];
        const sicherung = state.players.map(p => [p.x, p.y, p.fx, p.fy]);
        const ball = [state.ball.x, state.ball.y];
        state.players.forEach((p, k) => { const q = f.p[k]; p.x = q[0]; p.y = q[1]; p.fx = q[2]; p.fy = q[3]; });
        state.ball.x = f.bx; state.ball.y = f.by;
        drawPitch(r); drawPlayers(r);
        state.players.forEach((p, k) => { const q = sicherung[k]; p.x = q[0]; p.y = q[1]; p.fx = q[2]; p.fy = q[3]; });
        state.ball.x = ball[0]; state.ball.y = ball[1];
        drawHud();
        drawReplayBadge();
        return;
      }

      drawPitch(r); drawPlayers(r); drawHud();

      // Nur noch TOR! — wer getroffen hat und wie es steht, sagt die Kopfzeile
      // ohnehin schon. Dafür groß, gelb und mit Einschlag.
      const pw = Math.min(w * 0.76, uni() * 0.66);
      const ph = uni() * 0.48;
      const x0 = w / 2 - pw / 2, y0 = h / 2 - ph / 2;

      // Kein harter gelber Rahmen: Er stand in Konkurrenz zum Schriftzug und
      // klebte am Inhalt. Stattdessen eine weiche, abgerundete Fläche, die
      // sich über einen Schlagschatten vom Rasen löst, plus eine Haarlinie.
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,0.85)';
      ctx.shadowBlur = uni() * 0.05;
      ctx.fillStyle = 'rgba(6,9,14,0.96)';
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(x0, y0, pw, ph, uni() * 0.022);
      else ctx.rect(x0, y0, pw, ph);
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.10)';
      ctx.lineWidth = Math.max(1, uni() * 0.002);
      ctx.stroke();

      // Einschlag beim Tor, danach ein leises Atmen
      const seit = Math.max(0, GOAL_WAIT - state.goalWait);
      const pop = 1 + 0.5 * Math.exp(-5 * seit) * Math.cos(seit * 20);
      const puls = 1 + 0.025 * Math.sin(state.t * 4);
      ctx.save();
      ctx.translate(w / 2, y0 + ph * 0.38);
      ctx.scale(pop * puls, pop * puls);
      ctx.shadowColor = '#ffb300';
      ctx.shadowBlur = uni() * 0.06;
      ctx.fillStyle = '#ffd54f';
      ctx.font = font(uni() * 0.115);
      ctx.fillText('TOR!', 0, 0);
      ctx.shadowBlur = 0;
      ctx.restore();

      goalItems().forEach((it, i) => {
        const y = y0 + ph * (0.67 + i * 0.16);
        const sel = i === state.menuSel;
        hotspot(x0 + pw * 0.08, y - ph * 0.065, pw * 0.84, ph * 0.13, i);
        ctx.fillStyle = sel ? '#ffd54f' : '#666';
        ctx.font = font(uni() * 0.03);
        ctx.fillText(sel ? `> ${it} <` : it, w / 2, y);
      });
    }

    function drawHud() {
      const me = TEAMS[state.myTeam], foe = TEAMS[state.foeTeam];
      const y = h * 0.055;
      ctx.font = font(uni() * 0.032);

      // Flaggen neben die Namen. Breite wird gemessen, damit sie unabhängig
      // von der Namenslänge direkt anliegen.
      const fh = uni() * 0.030, fw = fh * 1.55, gap = uni() * 0.014;

      // Die Flaggen auf die optische Mitte der Buchstaben setzen, nicht auf die
      // Grundlinie — die liegt unter dem Text, dadurch sähen sie zu tief aus.
      // actualBoundingBox* liefert die echte Höhe der gesetzten Glyphen.
      const flagTop = (txt) => {
        const m = ctx.measureText(txt);
        const asc  = m.actualBoundingBoxAscent  ?? uni() * 0.032 * 0.72;
        const desc = m.actualBoundingBoxDescent ?? 0;
        return y - (asc - desc) / 2 - fh / 2;
      };

      ctx.fillStyle = kit(0);
      ctx.textAlign = 'right';
      ctx.fillText(me.n, w * 0.36, y);
      const wl = ctx.measureText(me.n).width;
      drawFlagIcon(w * 0.36 - wl - gap - fw, flagTop(me.n), fw, fh, me.f);

      ctx.fillStyle = kit(1);
      ctx.textAlign = 'left';
      ctx.fillText(foe.n, w * 0.64, y);
      const wr = ctx.measureText(foe.n).width;
      drawFlagIcon(w * 0.64 + wr + gap, flagTop(foe.n), fw, fh, foe.f);

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
      hotspot(0, 0, w, h, null);   // ganzer Bildschirm bestätigt
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

      // Ohne Unterzeilen: Die Punkte erklären sich selbst, jede weitere Zeile
      // überlädt nur den ersten Bildschirm.
      const items = ['WORLD CUP', 'FREUNDSCHAFTSSPIEL', 'EINSTELLUNGEN'];
      items.forEach((it, i) => {
        const sel = i === state.menuSel;
        const y = h * (0.46 + i * 0.12);
        hotspot(w * 0.15, y - h * 0.04, w * 0.7, h * 0.085, i);
        ctx.fillStyle = sel ? '#4fc3f7' : '#555';
        ctx.font = font(uni() * 0.045);
        ctx.fillText(sel ? `> ${it} <` : it, w / 2, y);
      });
    }

    function drawCountMenu() {
      ctx.fillStyle = '#fff';
      ctx.font = font(uni() * 0.045);
      ctx.fillText('WIE VIELE SPIELER?', w / 2, h * 0.16);

      const items = ['1 SPIELER', '2 SPIELER'];
      items.forEach((it, i) => {
        const sel = i === state.menuSel;
        const y = h * (0.42 + i * 0.12);
        hotspot(w * 0.15, y - h * 0.04, w * 0.7, h * 0.085, i);
        ctx.fillStyle = sel ? '#4fc3f7' : '#555';
        ctx.font = font(uni() * 0.042);
        ctx.fillText(sel ? `> ${it} <` : it, w / 2, y);
      });
    }

    function drawSideMenu() {
      ctx.fillStyle = '#fff';
      ctx.font = font(uni() * 0.045);
      ctx.fillText('ZU ZWEIT SPIELEN', w / 2, h * 0.16);

      const items = ['MITEINANDER', 'GEGENEINANDER'];
      items.forEach((it, i) => {
        const sel = i === state.menuSel;
        const y = h * (0.42 + i * 0.12);
        hotspot(w * 0.15, y - h * 0.04, w * 0.7, h * 0.085, i);
        ctx.fillStyle = sel ? '#4fc3f7' : '#555';
        ctx.font = font(uni() * 0.042);
        ctx.fillText(sel ? `> ${it} <` : it, w / 2, y);
      });
    }

    // Flagge zeichnen. Bewusst schlicht: Streifen, Kreuz, Scheibe, plus zwei
    // Sonderfälle. Wappen und Sterne wären in dieser Größe ohnehin Matsch.
    function drawFlagIcon(x, y, fw, fh, fl) {
      ctx.save();
      ctx.beginPath(); ctx.rect(x, y, fw, fh); ctx.clip();
      const c = fl.c;
      if (fl.t === 'h' || fl.t === 'v') {
        const wgt = fl.w || c.map(() => 1);
        const tot = wgt.reduce((a, b) => a + b, 0);
        let off = 0;
        c.forEach((col, i) => {
          const size = (fl.t === 'h' ? fh : fw) * wgt[i] / tot;
          ctx.fillStyle = col;
          if (fl.t === 'h') ctx.fillRect(x, y + off, fw, size + 1);
          else              ctx.fillRect(x + off, y, size + 1, fh);
          off += size;
        });
      } else if (fl.t === 'cr') {              // Kreuzflagge
        ctx.fillStyle = c[0]; ctx.fillRect(x, y, fw, fh);
        ctx.fillStyle = c[1];
        ctx.fillRect(x, y + fh * 0.4, fw, fh * 0.2);
        ctx.fillRect(x + fw * 0.42, y, fw * 0.16, fh);
      } else if (fl.t === 'di') {              // Scheibe
        ctx.fillStyle = c[0]; ctx.fillRect(x, y, fw, fh);
        ctx.fillStyle = c[1];
        ctx.beginPath(); ctx.arc(x + fw / 2, y + fh / 2, fh * 0.28, 0, Math.PI * 2); ctx.fill();
      } else if (fl.t === 'br') {              // Raute mit Kreis
        ctx.fillStyle = c[0]; ctx.fillRect(x, y, fw, fh);
        ctx.fillStyle = c[1];
        ctx.beginPath();
        ctx.moveTo(x + fw / 2, y + fh * 0.14); ctx.lineTo(x + fw * 0.86, y + fh / 2);
        ctx.lineTo(x + fw / 2, y + fh * 0.86); ctx.lineTo(x + fw * 0.14, y + fh / 2);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = c[2];
        ctx.beginPath(); ctx.arc(x + fw / 2, y + fh / 2, fh * 0.19, 0, Math.PI * 2); ctx.fill();
      } else if (fl.t === 'us') {
        // 13 Streifen, Gösch über sieben davon und 2/5 der Breite — vorher
        // waren es sieben Streifen und ein zu breiter blauer Block ohne
        // Sterne, der eher nach Frankreich aussah als nach den USA.
        const n = 13;
        for (let i = 0; i < n; i++) {
          ctx.fillStyle = i % 2 ? '#ffffff' : '#b22234';
          ctx.fillRect(x, y + i * fh / n, fw, fh / n + 1);
        }
        const gw = fw * 0.40, gh = fh * 7 / n;
        ctx.fillStyle = '#3c3b6e';
        ctx.fillRect(x, y, gw, gh);
        // Sterne als Punktraster. Einzelne Sterne wären in dieser Größe Matsch,
        // das Raster liest sich trotzdem als Sternenfeld.
        ctx.fillStyle = '#ffffff';
        const sr = Math.max(0.6, gh * 0.055);
        for (let row = 0; row < 5; row++) {
          for (let col = 0; col < 6; col++) {
            if ((row + col) % 2) continue;            // versetztes Raster
            ctx.beginPath();
            ctx.arc(x + gw * (col + 1) / 7, y + gh * (row + 1) / 6, sr, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      // Zusatzzeichen. Ohne sie sind Italien und Mexiko sowie Kroatien und die
      // Niederlande in dieser Größe nicht auseinanderzuhalten.
      if (fl.m === 'check') {                  // kroatisches Schachbrett
        const cw2 = fw * 0.055, n = 4;
        for (let r2 = 0; r2 < 2; r2++) for (let c2 = 0; c2 < n; c2++) {
          ctx.fillStyle = (r2 + c2) % 2 ? '#ffffff' : '#d32f2f';
          ctx.fillRect(x + fw / 2 - n * cw2 / 2 + c2 * cw2, y + fh * 0.22 + r2 * cw2, cw2 + 0.5, cw2 + 0.5);
        }
      } else if (fl.m === 'emblem') {          // Wappen in der Mitte
        ctx.fillStyle = 'rgba(70,50,20,0.85)';
        ctx.beginPath(); ctx.arc(x + fw / 2, y + fh / 2, fh * 0.15, 0, Math.PI * 2); ctx.fill();
      } else if (fl.m === 'sun') {             // Sonne in der Gösch
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, fw * 0.36, fh * 0.36);
        ctx.fillStyle = '#f6b40e';
        ctx.beginPath(); ctx.arc(x + fw * 0.18, y + fh * 0.18, fh * 0.11, 0, Math.PI * 2); ctx.fill();
      }

      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = Math.max(1, fw * 0.015);
      ctx.strokeRect(x, y, fw, fh);
    }

    function drawTeamMenu() {
      const pick = state.phase === 'team';
      ctx.fillStyle = '#fff';
      ctx.font = font(uni() * 0.045);
      const versus = state.teamMode === 'versus';
      ctx.fillText(pick ? (versus ? 'SPIELER 1 · MANNSCHAFT' : 'DEINE MANNSCHAFT')
                        : (versus ? 'SPIELER 2 · MANNSCHAFT' : 'GEGNER WÄHLEN'),
                   w / 2, h * 0.13);

      const cols = 4, rows = 4;
      const cw = w * 0.17, ch = h * 0.13;
      const x0 = w / 2 - (cols * cw) / 2, y0 = h * 0.2;
      TEAMS.forEach((t, i) => {
        const cx = x0 + (i % cols) * cw, cy = y0 + Math.floor(i / cols) * ch;
        hotspot(cx, cy, cw, ch, i);
        const sel = i === state.menuSel;
        const own = !pick && i === state.myTeam;

        ctx.globalAlpha = own ? 0.22 : sel ? 1 : 0.62;
        drawFlagIcon(cx + cw * 0.22, cy + ch * 0.12, cw * 0.56, ch * 0.42, t.f);
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
      // Kein Tastenspickzettel — A und B bedeuten überall dasselbe. Stehen
      // bleibt nur, was man nicht erraten kann: wer gerade dran ist.
      if (!pick && versus) hint('SPIELER 2 WÄHLT');
    }

    function drawIntro() {
      const title = state.mode === 'cup' ? ROUNDS[state.round] : 'FREUNDSCHAFTSSPIEL';
      panel(title, '');
      // Namen bewusst neutral — die Zuordnung macht die Flagge, nicht die Farbe
      const fw = uni() * 0.085, fh = fw * 0.62;
      ctx.font = font(uni() * 0.042);
      ctx.fillStyle = '#fff';
      ctx.fillText(TEAMS[state.myTeam].n, w / 2, h * 0.46);
      drawFlagIcon(w / 2 - fw / 2, h * 0.46 - uni() * 0.115, fw, fh, TEAMS[state.myTeam].f);
      ctx.fillStyle = '#555';
      ctx.font = font(uni() * 0.03);
      ctx.fillText('GEGEN', w / 2, h * 0.545);
      ctx.fillStyle = '#fff';
      ctx.font = font(uni() * 0.042);
      ctx.fillText(TEAMS[state.foeTeam].n, w / 2, h * 0.68);
      drawFlagIcon(w / 2 - fw / 2, h * 0.68 - uni() * 0.115, fw, fh, TEAMS[state.foeTeam].f);
      if (state.teamMode === 'versus') {
        ctx.fillStyle = P_COL[1];
        ctx.font = font(uni() * 0.021);
        ctx.fillText(state.mode === 'cup'
          ? 'SPIELER 2 STEUERT DEN AUSGELOSTEN GEGNER'
          : 'SPIELER 2 STEUERT DIESE MANNSCHAFT', w / 2, h * 0.69);
      }
    }

    function drawHalf() {
      panel('HALBZEIT', `${TEAMS[state.myTeam].n} ${state.score[0]} : ${state.score[1]} ${TEAMS[state.foeTeam].n}`);
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
    }

    function drawChampion() {
      panel('WELTMEISTER!', TEAMS[state.myTeam].n);
      ctx.fillStyle = '#ffb300';
      ctx.font = font(uni() * 0.03);
      ctx.fillText(`${ROUNDS.length} SPIELE, ${ROUNDS.length} SIEGE`, w / 2, h * 0.54);
    }

    function drawOut() {
      panel('AUSGESCHIEDEN', `${ROUNDS[state.round]} · ${TEAMS[state.myTeam].n}`);
    }
  }
};
