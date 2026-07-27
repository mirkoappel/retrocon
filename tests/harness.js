// Prüfstand für die Spiele. Kein Browser, kein Build, keine Abhängigkeiten:
// Die Spieldatei wird eingelesen und in einer Node-Umgebung ausgeführt, in der
// `window` und ein Canvas-Kontext nachgebildet sind.
//
// Beobachtet wird das Spiel möglichst so, wie es ein Mensch sähe — über die
// Texte, die es zeichnet. Nur wo das nicht reicht, greifen Tests über
// `__state` auf den Spielzustand zu; den blendet `load()` beim Einlesen ein,
// damit die ausgelieferte Datei davon nichts wissen muss.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Spielmodul laden. `inject` erlaubt einzelnen Tests, zusätzliche Messpunkte
// in den Quelltext zu setzen (etwa um jeden Schuss mitzuschreiben).
//
// `__state` wird an der Rückgabe der öffentlichen Schnittstelle eingeblendet.
// Jedes Spiel schließt mit `return { ... }` auf Einrückungsebene vier ab; die
// letzte solche Stelle ist die Schnittstelle. Findet sie sich nicht, bricht der
// Prüfstand ab, statt stumm ohne Zustandszugriff weiterzulaufen.
function load(game, inject) {
  const file = path.join(ROOT, 'games', game, game + '.js');
  let src = fs.readFileSync(file, 'utf8');
  const ANCHOR = '\n    return {\n';
  const at = src.lastIndexOf(ANCHOR);
  if (at < 0) {
    throw new Error(`Rückgabe der Schnittstelle in ${game}.js nicht gefunden — Prüfstand anpassen`);
  }
  src = src.slice(0, at + ANCHOR.length) + '      __state: state,\n' + src.slice(at + ANCHOR.length);
  if (inject) src = inject(src);
  const sandbox = { window: {} };
  // eslint-disable-next-line no-new-func
  new Function('window', 'global', src)(sandbox.window, global);
  const mod = sandbox.window.RetroGames && sandbox.window.RetroGames[game];
  if (!mod) throw new Error(`${game} hat sich nicht an window.RetroGames angemeldet`);
  return mod;
}

// Canvas-Attrappe. Sie merkt sich alles, was gezeichnet wird — der Text ist
// unser Fenster ins Spiel.
function makeCtx(texts) {
  return new Proxy({}, {
    get(t, p) {
      if (p in t) return t[p];
      if (p === 'createLinearGradient') return () => ({ addColorStop() {} });
      if (p === 'measureText') return () => ({ width: 10, actualBoundingBoxAscent: 8, actualBoundingBoxDescent: 0 });
      if (p === 'fillText') return s => texts.push(String(s));
      return () => {};
    },
    set(t, p, v) { t[p] = v; return true; }
  });
}

const pad = o => ({
  type: 'keyboard',
  joystick: { x: 0, y: 0, active: false },
  dpad: { up: false, down: false, left: false, right: false },
  a: false, b: false, select: false, start: false, ...o
});
const stick = (x, y) => ({ ...pad(), joystick: { x, y, active: true, analog: true } });

// Eine laufende Partie mit den Handgriffen, die jeder Test braucht.
function session(game, { conns = new Map(), inject, settings, w = 1600, h = 900 } = {}) {
  const mod = load(game, inject);
  const texts = [];
  const ctx = makeCtx(texts);
  const g = mod.create(ctx, w, h, 1, {
    exit() {}, getConns: () => conns, audioCtx: null, settings, code: 'TEST'
  });
  let prev = null;
  return {
    game: g,
    state: g.__state,
    screen() { texts.length = 0; g.draw(); return texts.join(' | '); },
    send(gp) { g.input(1, gp, prev); prev = gp; },
    tap(slot = 1) {
      let c = pad({ a: true }); g.input(slot, c, prev); prev = c;
      c = pad();               g.input(slot, c, prev); prev = c;
    },
    step(dt = 1 / 60) { g.update(dt); }
  };
}

// Menü bis zum Anpfiff durchtippen und dann bis zum Abpfiff spielen.
// `onFrame` bekommt jeden Frame und darf abbrechen, indem es `false` liefert.
function playMatch(s, onFrame, maxFrames = 60 * 900) {
  for (let i = 0; i < 4; i++) s.tap();
  for (let f = 0; f < maxFrames; f++) {
    s.step();
    if (onFrame && onFrame(f) === false) return 'abgebrochen';
    const scr = s.screen();
    if (/A · WEITER/.test(scr)) {
      if (/HALBZEIT \|/.test(scr)) { s.tap(); continue; }
      const m = scr.match(/(\d+) : (\d+)/);
      return m ? [+m[1], +m[2]] : [0, 0];
    }
  }
  return 'Zeitüberschreitung';
}

const quantile = (a, p) => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length * p)]; };
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

module.exports = { load, session, playMatch, pad, stick, quantile, mean, ROOT };
