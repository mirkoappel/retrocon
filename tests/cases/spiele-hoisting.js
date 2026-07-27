// Wiederkehrende Falle: Eine Deklaration steht unterhalb der öffentlichen
// Schnittstelle (`return { ... }`), wird aber weiter oben schon benutzt. Die
// Zeile läuft dann nie, und beim ersten Aufruf steht „Cannot access X before
// initialization" — bei `uni`, `ELAST_N`, `GOAL_ITEMS`, `resultItems`,
// `MITSCHNITT_FELDER` und zuletzt beim ausgelagerten Rendering ist mir genau
// das passiert.
//
// Der Fall prüft statisch, weil er sonst nur auffällt, wenn die betroffene
// Stelle im Test auch wirklich durchlaufen wird. Er kennt beide Formen:
// `const NAME = …` und `const { A, B } = …`.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

function namenUnterhalb(src) {
  const schnitt = src.lastIndexOf('\n    return {\n');
  if (schnitt < 0) return null;
  const oben = src.slice(0, schnitt);
  const unten = src.slice(schnitt);
  const treffer = [];
  // Genau vier Leerzeichen: Das sind die Deklarationen auf der obersten Ebene
  // von create(). Alles tiefer Eingerückte ist lokal in einer Funktion und
  // damit harmlos.
  for (const m of unten.matchAll(/^ {4}(?:const|let)\s+([A-Za-z_$][\w$]*)\s*=/gm)) {
    treffer.push(m[1]);
  }
  for (const m of unten.matchAll(/^ {4}(?:const|let)\s*\{([^}]*)\}\s*=/gm)) {
    for (const teil of m[1].split(',')) {
      const name = teil.split(':').pop().trim();
      if (/^[A-Za-z_$][\w$]*$/.test(name)) treffer.push(name);
    }
  }
  return treffer.filter(n => new RegExp(`\\b${n}\\b`).test(oben));
}

module.exports = {
  name: 'Spiele · keine Deklaration unterhalb der Schnittstelle',
  run() {
    // Selbstprüfung: Der Melder muss einen gebauten Fehler auch erkennen
    // Die Benutzung steht ueber dem return, die Deklaration darunter
    const probe = 'function nutzt() { return spaet; }\n    return {\n};\n    const { spaet } = q;';
    if (!(namenUnterhalb(probe) || []).includes('spaet')) {
      return { ok: false, info: 'der Melder erkennt nicht einmal den Testfall — er waere blind' };
    }

    const fehler = [];
    let geprueft = 0;
    for (const spiel of fs.readdirSync(path.join(ROOT, 'games'))) {
      for (const datei of fs.readdirSync(path.join(ROOT, 'games', spiel))) {
        if (!datei.endsWith('.js')) continue;
        const treffer = namenUnterhalb(fs.readFileSync(path.join(ROOT, 'games', spiel, datei), 'utf8'));
        if (treffer === null) continue;
        geprueft++;
        for (const n of treffer) fehler.push(`${datei}: ${n} steht unter dem return, wird aber darüber benutzt`);
      }
    }
    if (!geprueft) fehler.push('keine Datei mit Schnittstelle gefunden');
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `${geprueft} Dateien geprueft, Melder gegen einen gebauten Fehler geprueft`
    };
  }
};
