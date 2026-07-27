// Der Vollbild-Knopf gilt überall — im Menü wie im Spiel — und darf trotzdem
// nicht stören: Solange die Maus stillsteht, ist er unsichtbar UND nicht
// anklickbar, sonst fängt er Klicks ab, die dem Spiel gelten.
const fs = require('fs');
const path = require('path');

const wurzel = path.join(__dirname, '../..');
const lies = p => fs.readFileSync(path.join(wurzel, p), 'utf8');

// Den Regelblock eines Selektors aus der CSS-Datei holen
function block(css, selektor) {
  const i = css.indexOf(selektor + ' {');
  if (i < 0) return null;
  return css.slice(i, css.indexOf('}', i));
}

module.exports = {
  name: 'Konsole · Vollbild-Knopf stoert nicht',
  run() {
    const fehler = [];
    const html = lies('console/index.html');
    const css  = lies('console/style.css');
    const app  = lies('console/app.js');

    if (!/id="vollbild-knopf"/.test(html)) fehler.push('der Knopf steht nicht in index.html');
    if (!/aria-label=/.test(html.slice(html.indexOf('vollbild-knopf'), html.indexOf('vollbild-knopf') + 200))) {
      fehler.push('der Knopf hat keine Beschriftung fuer Hilfsmittel');
    }

    const ruhe = block(css, '#vollbild-knopf');
    const aktiv = block(css, '#vollbild-knopf.sichtbar');
    if (!ruhe) fehler.push('keine Regel fuer #vollbild-knopf');
    else {
      if (!/opacity:\s*0\s*;/.test(ruhe)) fehler.push('der Knopf ist im Ruhezustand nicht unsichtbar');
      if (!/pointer-events:\s*none/.test(ruhe)) fehler.push('der Knopf faengt im Ruhezustand Klicks ab');
      const unten = (ruhe.match(/bottom:\s*(\d+)px/) || [])[1];
      const rechts = (ruhe.match(/right:\s*(\d+)px/) || [])[1];
      if (!/position:\s*fixed/.test(ruhe) || unten === undefined || rechts === undefined) {
        fehler.push('der Knopf sitzt nicht fest unten rechts');
      } else if (+unten > 16 || +rechts > 16) {
        fehler.push(`der Knopf sitzt nicht in der Ecke (${rechts} px von rechts, ${unten} px von unten)`);
      }
    }
    if (!aktiv) fehler.push('keine Regel fuer den sichtbaren Zustand');
    else {
      const o = (aktiv.match(/opacity:\s*([\d.]+)/) || [])[1];
      if (!(parseFloat(o) > 0)) fehler.push(`sichtbar heisst opacity ${o}`);
      if (!/pointer-events:\s*auto/.test(aktiv)) fehler.push('sichtbar, aber nicht anklickbar');
    }

    // Die Verdrahtung: nur im Spiel, nur bei Mausbewegung, blendet von selbst aus
    if (!/addEventListener\('mousemove'/.test(app)) fehler.push('keine Reaktion auf Mausbewegung');
    if (/addEventListener\('pointermove'/.test(app)) fehler.push('pointermove holt ihn auch bei Beruehrung hervor');
    if (/getCurrentGame\(\)[\s\S]{0,120}remove\('sichtbar'\)/.test(app)) {
      fehler.push('der Knopf ist auf das laufende Spiel beschraenkt, er soll ueberall gelten');
    }
    if (!/setTimeout\([\s\S]{0,80}remove\('sichtbar'\)[\s\S]{0,20},\s*AUSBLENDEN\)/.test(app)) {
      fehler.push('er blendet sich nicht von selbst wieder aus');
    }
    if (!/setGlobal\('fullscreen'/.test(app)) fehler.push('der Klick geht nicht ueber die Einstellung');

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : 'unsichtbar und klickdicht in Ruhe, sitzt in der Ecke, gilt ueberall, '
          + 'blendet nach AUSBLENDEN von selbst aus, schaltet ueber dieselbe Einstellung wie das Menue'
    };
  }
};
