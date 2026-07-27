// Wiederkehrende Falle: Ein `const` wird unterhalb der öffentlichen
// Schnittstelle (`return { ... }`) deklariert, aber weiter oben schon benutzt.
// Die Zeile läuft dann nie, und beim ersten Aufruf steht „Cannot access X
// before initialization" — bei `uni`, `ELAST_N`, `GOAL_ITEMS`, `resultItems`
// und `MITSCHNITT_FELDER` ist mir genau das passiert.
//
// Der Fall prüft das statisch, weil er sonst nur auffällt, wenn die betroffene
// Stelle im Test auch wirklich durchlaufen wird.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

module.exports = {
  name: 'Spiele · keine Konstante unterhalb der Schnittstelle',
  run() {
    const fehler = [];
    let geprueft = 0;
    for (const spiel of fs.readdirSync(path.join(ROOT, 'games'))) {
      const datei = path.join(ROOT, 'games', spiel, spiel + '.js');
      if (!fs.existsSync(datei)) continue;
      const src = fs.readFileSync(datei, 'utf8');
      const schnitt = src.lastIndexOf('\n    return {\n');
      if (schnitt < 0) continue;
      geprueft++;
      const oben = src.slice(0, schnitt);
      const unten = src.slice(schnitt);
      for (const m of unten.matchAll(/^\s{4}(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/gm)) {
        const name = m[1];
        // Wird der Name oberhalb der Schnittstelle benutzt? Dann ist er dort
        // noch nicht initialisiert.
        const benutzt = new RegExp(`\\b${name}\\b`).test(oben);
        if (benutzt) fehler.push(`${spiel}: ${name} steht unter dem return, wird aber darüber benutzt`);
      }
    }
    if (!geprueft) fehler.push('keine Spieldatei mit Schnittstelle gefunden');
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ') : `${geprueft} Spiele geprueft, keine Konstante am falschen Ort`
    };
  }
};
