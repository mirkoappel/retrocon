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
    // Mannschaften, Runden, Aufstellung und Flaggen liegen in soccer.data.js
    const { ROUNDS, FORMATION, TEAMS } = window.RetroSoccer;
    const drawFlagIcon = (x, y, fw, fh, fl) => window.RetroSoccer.drawFlagIcon(ctx, x, y, fw, fh, fl);

    // ── Konstanten ───────────────────────────────────────
    // Koordinaten in Feldeinheiten: Feldlänge = 1.0, Breite = FIELD_W.
    // Beide Achsen im selben Maßstab, dadurch ist Bewegung richtungsunabhängig
    // und resize() muss nichts umrechnen.
    const FIELD_W   = 0.58;   // zwischen Futsal (0,50) und Grossfeld (0,648)
    const GOAL_W    = 0.189;
    // Strafraum. Das Seitenverhaeltnis zaehlt mehr als die absolute Groesse:
    // Breite zu Tiefe liegt jetzt bei 2,45 : 1 wie auf einem echten Platz
    // (40,32 m zu 16,5 m). Vorher war es 2,57 : 1 bei nur 0,13 Tiefe — der
    // Kasten wirkte dadurch in die Laenge gezogen.
    const BOX_W     = 0.38, BOX_D = 0.155;   // Strafraum
    const PLAYER_R  = 0.021;
    const BALL_R    = 0.0105;

    const SPEED      = 0.155;    // Feldeinheiten/s
    const SPEED_HUM  = 0.20;    // Sprint; die Auslenkung regelt herunter
    const SPEED_GK   = 0.155;    // Torwart darf auf der Linie schneller sein als Feldspieler
    const GK_REACH   = 0.65;     // Fangradius muss klar unter der halben Torbreite bleiben
    const KEEPER_SPACE = 0.17;  // Abstand, den Gegner zum ballhaltenden Torwart wahren
    const IDLE_TAKEOVER = 8;    // Sekunden ohne Eingabe, dann übernimmt die KI
    const GK_REACT   = 0.28;    // Reaktionszeit, bevor der Torwart dem Schuss folgt
    const GK_OUT     = 0.05;    // so weit geht er bei Gefahr im Strafraum heraus
    const GK_OUT_FAR = 0.07;    // …und so weit, wenn der Ball am anderen Ende ist
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
    const GK_DIVE_GAP  = 0.028; // ab dieser Lücke zum Schuss hechtet der Torwart
    const GK_DIVE_TIME = 0.55;  // seine Flugzeit — länger als beim Feldspieler
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
    const HIST_LEN     = 130;   // Frames im Speicher für die Wiederholung (2,2 s)
    const REPLAY_SPEED = 0.45;  // Zeitlupe — 2,5 s Szene werden so zu 5,6 s
    const GOAL_WAIT    = 12;    // so lange bleibt die Toranzeige stehen, wenn niemand drückt
    const AUTO_REPLAY  = 5;     // drückt bis dahin niemand, läuft die Wiederholung von selbst
    // So lange nimmt die Toranzeige gar keine Eingabe an und zeigt auch noch
    // keine Menüpunkte. Wer im Spielfieber weiterdrückt, klickt sie sonst weg,
    // bevor er sie überhaupt gelesen hat.
    const GOAL_LOCK    = 1.2;
    const HL_MAX       = 8;     // so viele Tore werden für die Höhepunkte aufbewahrt
    const GOAL_TAIL    = 26;    // Frames, die nach dem Torschuss angehängt werden
    const GOAL_DEPTH   = 0.038; // Tiefe des Tors hinter der Linie
    const NETZ_TIEFE   = GOAL_DEPTH * 0.62;  // so weit rollt der Ball ins Netz
    const REPLAY_HALT  = 0.7;   // so lange steht das Bild am Ende der Wiederholung
    // Was ein Mitschnitt je Spieler festhält
    const MITSCHNITT_FELDER = ['x', 'y', 'fx', 'fy', 'dive', 'down', 'downMax',
                               'tackle', 'poke', 'dx', 'dy', 'ctrl'];
    // Ein Spiel soll von Anfang bis Ende ohne einen einzigen Tastendruck
    // durchlaufen — man soll der KI zusehen können wie im Fernsehen. Jede
    // Tafel geht deshalb von selbst weiter; wer drückt, überspringt nur die
    // Wartezeit.
    const AUTO_HALF    = 7;     // Halbzeitpause
    const AUTO_RESULT  = 9;     // Ergebnistafel
    const AUTO_INTRO   = 6;     // Anpfiff-Tafel
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
    // Der vorgewählte Punkt steht oben, und das ist WEITER: Der schnelle
    // Druck soll anpfeifen, nicht zurückspulen.
    const goalItems = () => REPLAY_ON ? ['WEITER', 'WIEDERHOLUNG'] : ['WEITER'];
    const goalWeiterIdx = () => goalItems().indexOf('WEITER');
    // Grundstärke der KI-Gegner; der Turnieraufschlag je Runde kommt dazu
    const SKILL_BASE = SCHWIERIG === 'leicht' ? 0.90 : SCHWIERIG === 'schwer' ? 1.12 : 1;
    const HALVES    = 2;

    const P_COL = ['#4fc3f7', '#f48fb1'];   // Markierung P1 / P2
    // Eine Farbe für alle Markierungen, deckend. Halbdurchsichtige Linien
    // sahen dort doppelt so kräftig aus, wo zwei aufeinanderlagen.
    const LINE  = '#5c7a6a';
    // Maße der Markierungen, abgeleitet aus dem Strafraum: Der entspricht
    // 16,5 m Tiefe und 40,3 m Breite, daraus ergibt sich der Rest.
    // Der Torraum MUSS breiter sein als das Tor — mit BOX_W * 0,454 war er
    // schmaler. Die echten Verhältnisse (Strafraum 5,5 × Torbreite) passen
    // hier nicht: Sie ergäben einen Strafraum breiter als das ganze Feld, weil
    // unser Tor im Verhältnis viel größer ist als auf einem echten Platz.
    // Der Torraum richtet sich deshalb am TOR aus, nicht am Strafraum.
    const GOAL_AREA_W  = 0.25;            // 1,32 x Tor
    const GOAL_AREA_D  = 0.065;           // Verhaeltnis 3,8 : 1
    const ELFMETER     = BOX_D * 0.667;   // 11 m vor der Linie
    const TEILKREIS_R  = BOX_D * 0.555;   // 9,15 m Radius
    const MITTE_R      = BOX_D * 0.555;   // derselbe Radius für den Anstoßkreis
    // Eckviertel. Maßstabsgetreu wären es 0,008 — auf dem Bildschirm ein
    // Kringel von zwei Pixeln. Bewusst größer, wie auf einem Tipp-Kick-Feld.
    const ECK_R        = 0.028;
    const TURF  = '#10231a', TURF_ALT = '#0d1d15';

    // Aufstellung für die nach +y angreifende Mannschaft.
    // x als Anteil der Feldbreite, y als Anteil der Feldlänge.
    // 3 gegen 3: Torwart + zwei Feldspieler. x wird für die zweite Mannschaft
    // mitgespiegelt, damit beide Seiten wirklich gleich aufgestellt sind.


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
      tafel: 0,                      // Restzeit, bis eine Tafel von selbst weitergeht
      hist: [], replay: null,        // Mitschnitt und laufende Wiederholung
      highlights: [], hl: null,      // aufbewahrte Torszenen und laufende Schau
      passTo: null, passToT: 0,      // wer gerade angespielt wurde und wie lange er hinläuft
      goalWait: 0, goalTeam: 0, autoReplay: -1, goalLock: 0,   // Toranzeige: Restzeit, Torschütze, Countdown zur Wiederholung
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
    // Der Torwart dagegen fängt ihn — dafür hechtet er ja.
    function headerHit(p) {
      const b = state.ball;
      if (p.role === 'GK') {
        p.dive = 0; p.down = 0;
        p.gkHold = 0.9;
        giveBall(p);
        state.shake = 0.2;
        sndSave();
        return;
      }
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
      // Passgewicht nach Weite. Vorher flog jeder Pass mit PASS_SPEED: der
      // kurze wurde gedroschen, der lange war 0,8 s unterwegs und viel zu kurz
      // vorgelegt. Gemessen kamen nur 51 % der Pässe zwischen 0,10 und 0,20 an
      // und 15 % der langen.
      const roh = dist(p, t);
      const sp = clamp(PASS_SPEED * (0.5 + roh * 1.5), 0.26, 0.8);
      // Vorlage nach Flugzeit statt pauschal 0,18 s
      const flug = roh / sp;
      const lx = t.x + t.vx * flug, ly = t.y + t.vy * flug;
      const dx = lx - p.x, dy = ly - p.y;
      const len = Math.hypot(dx, dy) || 1;
      b.owner = null;
      b.vx = dx / len * sp; b.vy = dy / len * sp;
      p.lockout = 0.2;
      // Der Angespielte löst sich und geht dem Ball entgegen. Ohne das läuft er
      // seine taktische Linie weiter, während der Ball dorthin rollt, wo er
      // gerade war — das war der Hauptgrund für die halbe Fehlpassquote.
      state.passTo = t;
      state.passToT = Math.min(1.6, flug + 0.5);
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
      // Seitlich decken beide exakt gleich. Das ist der empfindlichste Wert im
      // Spiel: Jede Abschwächung — trägeres Nachziehen, eigener Versatz,
      // kleinerer Faktor — kostete in der Messung drei bis vier Tore pro Spiel.
      // Unterschieden wird deshalb über die TIEFE.
      const zuMir = Math.abs(b.y - gy);
      let tx = FIELD_W / 2 + (b.x - FIELD_W / 2) * 0.55;
      let ty = line;

      // Fliegt der Ball aufs Tor, den Kreuzungspunkt vorausberechnen statt
      // dem Ball hinterherzulaufen — sonst kommt der Torwart nie rechtzeitig an
      const toward = !b.owner && ((gy === 0 && b.vy < -0.02) || (gy === 1 && b.vy > 0.02));
      if (toward) {
        p.react = (p.react || 0) + dt;
        if (p.react >= GK_REACT) {
          const tt = (line - b.y) / b.vy;
          if (tt > 0 && tt < 1.5) {
            tx = b.x + b.vx * tt;
            // Zu Fuß nicht mehr zu schaffen? Dann hechten. Ohne das stand der
            // Torwart nur da und sah dem Ball nach, wenn er nicht rechtzeitig
            // hinkam — ein Torwart wirft sich in so einem Fall.
            const luecke = Math.abs(tx - p.x);
            if (p.dive <= 0 && p.down <= 0 && luecke > GK_DIVE_GAP
                && luecke > SPEED_GK * tt * 0.9 && tt < 0.9) {
              p.dive = GK_DIVE_TIME;
              const dx = tx - p.x, dy = (gy === 0 ? line : line) - p.y;
              const len = Math.hypot(dx, dy) || 1;
              p.dx = dx / len; p.dy = dy / len;
              p.fx = p.dx; p.fy = p.dy;
              sndSave();
            }
          }
        }
      } else {
        p.react = 0;
      }
      tx = clamp(tx, FIELD_W / 2 - GOAL_W / 2 - 0.03, FIELD_W / 2 + GOAL_W / 2 + 0.03);

      if (!b.owner && !toward && zuMir < 0.07 && Math.abs(b.x - FIELD_W / 2) < BOX_W / 2) {
        tx = b.x; ty = b.y;                        // freien Ball selbst holen
      } else if (!toward) {
        // Ist der Ball weit weg, steht der Torwart weit vor seinem Tor und
        // spielt mit; kommt er näher, zieht er sich auf die Linie zurück. Das
        // unterscheidet die beiden Torhüter sichtbar, ohne einen von beiden
        // schlechter zu machen — und es ist das Herauskommen, das vorher
        // praktisch nie zu sehen war (0,4 % der Spielzeit vor der Linie).
        const weit = clamp((zuMir - 0.38) / 0.25, 0, 1);
        let vor = GK_OUT_FAR * weit;
        if (inBox && b.owner && b.owner.team !== p.team) vor = Math.max(vor, GK_OUT);
        ty = gy === 0 ? line + vor : line - vor;
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
      // Ganz nah am Tor wird abgeschlossen, auch wenn die Bahn eng ist — sonst
      // dribbelt die KI weiter und läuft dem Torwart in die Arme. Bewusst
      // zurückhaltend dosiert: mit Rate 1,8 kostete allein diese Regel 1,7 Tore
      // mehr pro Spiel.
      if (lane.len < 0.10) {
        if (Math.random() < dt * 0.6) { shoot(p, lane.tx); return; }
      } else if (lane.len < SHOT_RANGE + 0.06 * skill(p.team) && lane.clear > LANE_MIN) {
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
        const reichweite = o.role === 'GK' ? 0.17 : 0.12;
        const kraft = o.role === 'GK' ? 1.5 : 0.8;
        if (d < reichweite) { tx += (p.x - o.x) * kraft; ty += (p.y - o.y) * (o.role === 'GK' ? 0.9 : 0.3); }
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

      // Angespielt: dem Ball entgegengehen, statt die eigene Linie weiterzulaufen
      if (state.passTo === p && !owner && state.passToT > 0) {
        moveToward(p, b.x + b.vx * 0.12, b.y + b.vy * 0.12, SPEED, dt);
        return;
      }

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

    function updateResult(dt) {
      if (state.hl) {
        const szene = state.highlights[state.hl.clip];
        if (state.hl.halt > 0) {                  // Standbild am Ende jeder Szene
          state.hl.halt -= dt;
          if (state.hl.halt > 0) return;
          if (state.hl.clip + 1 < state.highlights.length) {
            state.hl.clip++; state.hl.i = 0; state.hl.halt = 0;
          } else { state.hl = null; state.menuSel = resultItems().length - 1; }
          return;
        }
        state.hl.i += REPLAY_SPEED;
        if (state.hl.i >= szene.frames.length - 1) state.hl.halt = REPLAY_HALT;
        return;
      }
      if (state.tafel > 0) {
        state.tafel -= dt;
        if (state.tafel <= 0) { state.tafel = 0; activate(true); }
      }
    }

    function updateGoal(dt) {
      if (state.replay) {
        if (state.replay.halt > 0) {              // Standbild am Ende
          state.replay.halt -= dt;
          if (state.replay.halt > 0) return;
        } else if (state.replay.i < state.hist.length - 1) {
          state.replay.i += REPLAY_SPEED;
          if (state.replay.i >= state.hist.length - 1) { state.replay.halt = REPLAY_HALT; return; }
          return;
        }
        {
          const war = state.replay;
          state.replay = null;
          // Nach der automatischen Wiederholung geht es direkt weiter. Nach der
          // selbst gewählten zurück in die Anzeige, und dort steht die Auswahl
          // wieder auf WEITER — sonst startet der nächste Druck noch eine.
          if (war.auto) { weiterNachTor(); return; }
          // Gesehen ist gesehen — danach steht WEITER bereit
          state.menuSel = goalWeiterIdx();
        }
        return;
      }
      state.goalLock = Math.max(0, state.goalLock - dt);
      // Drückt niemand, läuft die Wiederholung von selbst an
      if (state.autoReplay > 0) {
        state.autoReplay -= dt;
        if (state.autoReplay <= 0) { state.autoReplay = -1; startReplay(true); return; }
      }
      state.goalWait -= dt;
      if (state.goalWait <= 0) weiterNachTor();
    }

    // ── Match-Update ─────────────────────────────────────
    // Ein Frame in acht Schritten. Die Reihenfolge ist nicht beliebig: Erst
    // entscheiden alle aus demselben Weltzustand, dann bewegen sich alle, und
    // die Torprüfung steht vor der Ballaufnahme. Wo das eine Rolle spielt,
    // steht es am jeweiligen Schritt.
    //
    // Schritte, die den Frame beenden, liefern `true` zurück.
    function updateMatch(dt) {
      state.kickoffLock = Math.max(0, state.kickoffLock - dt);
      ctrlCooldown = Math.max(0, ctrlCooldown - dt);
      assignControl();

      if (laufenPausen(dt)) return;
      schreibeMitschnitt();
      lassEntscheiden(dt);
      lassBewegen(dt);
      trenneSpieler();
      if (fuehreBall(dt)) return;
      fuehreZweikampf(dt);
      laufeUhr(dt);
    }

    // Anstoß- und Passpause. Solange der Anstoß läuft, steht alles still —
    // auch die Uhr.
    function laufenPausen(dt) {
      const b = state.ball;
      // Anstoß-Pause: Spieler und Ball stehen still, damit man den Neubeginn
      // überhaupt mitbekommt. Die Uhr läuft solange ebenfalls nicht.
      if (state.kickoffToT > 0) {
        state.kickoffToT -= dt;
        if (state.kickoffToT <= 0) state.kickoffTo = null;
      }
      if (state.passToT > 0) {
        state.passToT -= dt;
        if (state.passToT <= 0 || b.owner) { state.passTo = null; state.passToT = 0; }
      }

      if (state.restart > 0) {
        state.restart -= dt;
        if (state.msgTimer > 0) state.msgTimer -= dt;
        if (state.restart <= 0) kickoffPass();
        return true;
      }

      return false;
    }

    function schreibeMitschnitt() {
      const b = state.ball;
      // Mitschnitt für die Wiederholung. Neben den Positionen auch alles, was
      // die Figur verformt: Ohne die Zeitgeber blieb ein Spieler, der beim Tor
      // gerade grätschte, die ganze Zeitlupe über ein Oval — die Verformung kam
      // aus dem laufenden Spiel, und das steht während der Torpause still.
      state.hist.push({
        bx: b.x, by: b.y,
        p: state.players.map(p => [p.x, p.y, p.fx, p.fy,
                                   p.dive, p.down, p.downMax, p.tackle, p.poke,
                                   p.dx, p.dy, p.ctrl])
      });
      if (state.hist.length > HIST_LEN) state.hist.shift();

    }

    function lassEntscheiden(dt) {
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
          // Der Torwart hechtet flacher, aber weiter — er wirft sich in die Ecke
          const tempo = p.role === 'GK' ? DIVE_SPEED * 0.85 : DIVE_SPEED;
          const reich = p.role === 'GK' ? DIVE_REACH * 1.25 : DIVE_REACH;
          p.vx = p.dx * tempo; p.vy = p.dy * tempo;
          if (dist(p, state.ball) < reich && !state.ball.owner) headerHit(p);
          else if (p.dive <= 0) {
            p.down = p.role === 'GK' ? DIVE_DOWN * 0.6 : DIVE_DOWN;
            p.downMax = p.down;
          }
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
    }

    function lassBewegen(dt) {
      for (const p of state.players) {
        p.x = clamp(p.x + p.vx * dt, PLAYER_R, FIELD_W - PLAYER_R);
        p.y = clamp(p.y + p.vy * dt, PLAYER_R, 1 - PLAYER_R);
        const l = Math.hypot(p.vx, p.vy);
        if (l > 1e-3) { p.fx = p.vx / l; p.fy = p.vy / l; }
      }

      applyPending(dt);

    }

    function trenneSpieler() {
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

    }

    // Ball führen, dribbeln, Tore prüfen und aufnehmen
    function fuehreBall(dt) {
      const b = state.ball;
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
        if (inGoalMouth && b.y > 1) { scoreGoal(0); return true; }
        if (inGoalMouth && b.y < 0) { scoreGoal(1); return true; }

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

      return false;
    }

    function fuehreZweikampf(dt) {
      const b = state.ball;
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

    }

    function laufeUhr(dt) {
      // Die Torprüfung selbst steht oben im Zweig für den freien Ball — dort
      // vor der Ballaufnahme. Ein geführter Ball zählt bewusst nie als Tor,
      // sonst würde bloßes Vorwärtslaufen zum sicheren Treffer.

      // Uhr
      state.clock -= dt;
      if (state.msgTimer > 0) state.msgTimer -= dt;

      if (state.golden) { state.goldenT += dt; return; }   // Verlängerung läuft ohne Uhr
      if (state.clock <= 0) {
        state.clock = 0;
        if (state.half < HALVES) { state.phase = 'half'; state.tafel = AUTO_HALF; state.menuSel = 0; sndWhistle(); }
        else finishMatch();
      }
    }

    function scoreGoal(team) {
      // Der Ball bleibt im Netz liegen. Ohne das flog er waehrend der ganzen
      // Torpause weiter aus dem Bild heraus, als gaebe es kein Tor.
      const b = state.ball;
      b.vx = 0; b.vy = 0;
      b.x = clamp(b.x, FIELD_W / 2 - GOAL_W / 2 + BALL_R, FIELD_W / 2 + GOAL_W / 2 - BALL_R);
      // Bewusst hineinlegen, nicht nur begrenzen: Auf der Linie liegend sah es
      // aus, als sei der Ball am Tor vorbeigeflogen.
      b.y = b.y < 0.5 ? -NETZ_TIEFE * 0.75 : 1 + NETZ_TIEFE * 0.75;

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
      state.menuSel = goalWeiterIdx();          // oben, also WEITER
      state.goalLock = GOAL_LOCK;
      // Die Szene für die Höhepunkte aufbewahren, bevor der Mitschnitt beim
      // Anstoß gelöscht wird
      if (state.hist.length > 30) {
        verlaengereMitschnitt();
        state.highlights.push({ frames: state.hist.slice(), team, stand: [...state.score] });
        if (state.highlights.length > HL_MAX) state.highlights.shift();
      }
      state.autoReplay = REPLAY_ON ? AUTO_REPLAY : -1;
      state.msg = ''; state.msgTimer = 0;
    }

    // Der Mitschnitt endet genau auf der Torlinie — im Spiel wird in diesem
    // Moment abgepfiffen. Für die Wiederholung wird der Ball noch ein Stück
    // weiter ins Netz geschrieben, damit man ihn wirklich drin liegen sieht.
    function verlaengereMitschnitt() {
      const letzte = state.hist[state.hist.length - 1];
      if (!letzte) return;
      const b = state.ball;
      let bx = letzte.bx, by = letzte.by;
      const ziel = by < 0.5 ? -NETZ_TIEFE : 1 + NETZ_TIEFE;
      for (let i = 0; i < GOAL_TAIL; i++) {
        bx += b.vx / 60;
        by += b.vy / 60;
        by = by < 0.5 ? Math.max(ziel, by) : Math.min(ziel, by);
        bx = clamp(bx, FIELD_W / 2 - GOAL_W / 2 + BALL_R, FIELD_W / 2 + GOAL_W / 2 - BALL_R);
        state.hist.push({ bx, by, p: letzte.p });
      }
    }

    // Wiederholung in Zeitlupe aus dem Mitschnitt
    // `auto` unterscheidet die beiden Fälle: Von selbst gestartet, geht es
    // danach gleich weiter — wer nichts drückt, will offensichtlich nur zusehen.
    // Selbst ausgewählt, kehrt sie in die Anzeige zurück.
    function startReplay(auto = false) {
      if (state.phase !== 'goal' || state.hist.length < 30) return;
      // Wer sie selbst aufruft, hat entschieden — danach kommt keine
      // automatische mehr hinterher.
      if (!auto) state.autoReplay = -1;
      state.replay = { i: 0, auto, halt: 0 };
      sndMenu();
    }

    function weiterNachTor() {
      // Der Anstoß beginnt erst hier — nie während einer Wiederholung.
      state.replay = null;
      state.autoReplay = -1;
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
      state.phase = 'result'; state.tafel = AUTO_RESULT;
      state.menuSel = 0; state.hl = null;
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

    // Nächstes Freundschaftsspiel mit neuem Gegner. Wird nur aufgerufen, wenn
    // die Ergebnistafel von selbst weitergeht — also wenn niemand drückt.
    // Zusehen ist deshalb kein Modus, den man wählt, sondern das, was übrig
    // bleibt, wenn man die Finger stillhält.
    function naechstesSpiel() {
      state.round = 0;
      do { state.foeTeam = Math.floor(Math.random() * TEAMS.length); }
      while (state.foeTeam === state.myTeam);
      state.score = [0, 0];
      state.half = 1;
      state.highlights = [];
      state.phase = 'intro';
      state.tafel = 3.5;                        // auch der Anpfiff wartet nicht auf uns
    }

    function nextCupRound() {
      state.round++;
      if (state.round >= ROUNDS.length) { state.phase = 'champion'; state.tafel = AUTO_RESULT; state.menuSel = 0; sndWin(); return; }
      drawFoe();
      state.phase = 'intro'; state.tafel = AUTO_INTRO;
    }

    function drawFoe() {
      let i;
      do { i = Math.floor(Math.random() * TEAMS.length); } while (i === state.myTeam);
      state.foeTeam = i;
    }

    // ── Menü-Aktionen ────────────────────────────────────
    // Als eigene Funktionen, damit Tastatur, Controller und Mausklick
    // denselben Weg nehmen.
    // `vonSelbst` = die Tafel ist abgelaufen, niemand hat gedrückt.
    function activate(vonSelbst = false) {
      state.tafel = 0;
      switch (state.phase) {
        case 'goal':
          // Über den Namen, nicht über den Index: Ist die Wiederholung
          // abgeschaltet, steht WEITER an erster Stelle.
          if (goalItems()[state.menuSel] === 'WIEDERHOLUNG') startReplay(false);
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
          } else { drawFoe(); state.phase = 'intro'; state.tafel = AUTO_INTRO; }
          sndMenu(); return;

        case 'foe':
          if (state.menuSel === state.myTeam) return;   // nicht gegen sich selbst
          state.foeTeam = state.menuSel;
          state.phase = 'intro'; state.tafel = AUTO_INTRO; sndMenu(); return;

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
          if (!vonSelbst && resultItems()[state.menuSel] === 'HÖHEPUNKTE') {
            state.hl = { clip: 0, i: 0, halt: 0 };
            state.tafel = 0;
            sndMenu();
            return;
          }
          // Drückt niemand, geht es einfach weiter mit dem nächsten Gegner —
          // wer zusehen will, muss dafür nichts tun. Wer drückt, kommt ins Menü.
          if (vonSelbst && state.mode === 'friendly') { naechstesSpiel(); return; }
          if (state.mode === 'friendly') { state.phase = 'mode'; state.menuSel = 0; }
          else if (state.lastResult === 'WEITER') nextCupRound();
          else { state.phase = 'out'; state.tafel = AUTO_RESULT; state.menuSel = 0; }
          return;

        case 'champion':
        case 'out':
          // Wer nichts drückt, sieht dem nächsten Turnier zu — von vorn, mit
          // neuem Gegner und zurückgesetzter Runde.
          if (vonSelbst) { state.round = 0; state.score = [0, 0]; state.highlights = []; naechstesSpiel(); return; }
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

    // ── Rendering ────────────────────────────────────────
    // Liegt in soccer.render.js. Der Kontext wird einmal hereingereicht; die
    // Maße führt resize() nach.
    const R = window.RetroSoccer.render(ctx, {
      state, clamp, kit, hotspot, goalItems, drawFlagIcon, GOAL_DEPTH,
      MITTE_R, GOAL_AREA_W, GOAL_AREA_D, ELFMETER, TEILKREIS_R, ECK_R,
      AUTO_REPLAY, AUTO_HALF, AUTO_RESULT, AUTO_INTRO,
      FIELD_W, GOAL_W, BOX_W, BOX_D, PLAYER_R, BALL_R,
      TURF, TURF_ALT, LINE, P_COL, ROUNDS, TEAMS,
      DIVE_TIME, DIVE_DOWN, GK_DIVE_TIME, TACKLE_TIME, POKE_TIME,
      GOAL_WAIT, GOAL_LOCK, MITSCHNITT_FELDER,
      w, h,
    });
    const { isLandscape, drawMatch, drawGoal, drawHalf, drawResult, drawChampion,
            drawOut, drawIntro, drawModeMenu, drawCountMenu, drawSideMenu,
            drawTeamMenu, resultItems } = R;

    // ── Öffentliche Schnittstelle ────────────────────────
    return {
      resize(nw, nh) { w = nw; h = nh; R.resize(nw, nh); },   // Positionen sind normalisiert

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
          case 'result':
            if (state.hl) { if (m.a || m.b || m.start) state.hl = null; return; }
            if (m.dy) { state.menuSel = (state.menuSel + m.dy + resultItems().length) % resultItems().length; sndMenu(); }
            if (m.a || m.start) activate();
            return;

          case 'half':
          case 'champion':
          case 'out':
            if (m.a || m.start) activate();
            return;

          case 'goal':
            if (state.replay) {                    // laufende Wiederholung abbrechen
              if (m.a || m.b || m.start) state.replay = null;
              return;
            }
            if (state.goalLock > 0) return;        // erst lesen, dann drücken
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
        else if (state.phase === 'result') updateResult(dt);
        else if (state.tafel > 0) {
          // Tafeln laufen von selbst weiter, damit ein Spiel ohne Zutun endet
          state.tafel -= dt;
          if (state.tafel <= 0) { state.tafel = 0; activate(true); }
        }
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
          case 'champion': drawMatch(); drawChampion(); break;
          case 'out':      drawMatch(); drawOut(); break;
        }
      },

      destroy() {
        timers.forEach(clearTimeout); timers.length = 0;
        if (canvasEl) canvasEl.removeEventListener('click', onCanvasClick);
      }
    };


  }
};
