// Jede eigene Datei in index.html muss die aktuelle Version im Namen tragen.
//
// GitHub Pages liefert `cache-control: max-age=600`. Ohne Versionsanhang kann
// der Browser bis zu zehn Minuten lang ein altes soccer.js zu einer neuen
// index.html mischen — genau so sah eine längst behobene Doppel-Wiederholung
// wieder aus, als wäre sie zurück.
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..');

module.exports = {
  name: 'Konsole · eigene Dateien tragen die Version im Namen',
  run() {
    const html = fs.readFileSync(path.join(ROOT, 'console/index.html'), 'utf8');
    const version = (html.match(/id="footer">v([\d.]+)</) || [])[1];
    if (!version) return { ok: false, info: 'keine Version in der Fusszeile gefunden' };

    const fehler = [];
    let geprueft = 0;
    for (const m of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css)[^"]*)"/g)) {
      const url = m[1];
      if (url.startsWith('http')) continue;      // fremde CDNs gehen uns nichts an
      geprueft++;
      if (!url.includes(`?v=${version}`)) fehler.push(`${url} ohne ?v=${version}`);
    }
    if (!geprueft) fehler.push('keine eigenen Dateien gefunden');

    // Die Dateien muessen es auch wirklich geben
    for (const m of html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))\?v=/g)) {
      const p = path.join(ROOT, 'console', m[1]);
      if (!fs.existsSync(p)) fehler.push(`${m[1]} existiert nicht`);
    }

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `${geprueft} eigene Dateien, alle mit ?v=${version}`
    };
  }
};
