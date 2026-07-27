// Ein Kaefigplatz hat keinen Strafraum. Vorgabe sind deshalb schlichte
// Linien; den kompletten Platz gibt es auf Wunsch. Geprueft wird das
// Gezeichnete: Wie viele Linienzuege liegen auf dem Feld, und stehen die
// Tore in beiden Fassungen noch da?
const { session } = require('../harness');

const TOR_FARBE = 'rgba(10,14,20,0.85)';

function bild(art) {
  const s = session('soccer', {
    conns: new Map([[1, 'keyboard']]),
    setting: k => (k === 'lines' ? art : undefined), w: 1600, h: 900
  });
  for (let i = 0; i < 4; i++) s.tap();
  s.step();
  const { kaesten, pfade } = s.bild();
  return {
    // Ein Kasten aus vier Ecken in Linienfarbe: Aussenlinie, Strafraum,
    // Torraum. Die Torpfosten sind auch vier Punkte, aber weiss.
    kaesten4: pfade.filter(z => z.punkte.length === 4 && z.farbe === '#5c7a6a').length,
    tore: kaesten.filter(k => k.farbe === TOR_FARBE).length,
    zuege: pfade.length
  };
}

module.exports = {
  name: 'Fussball · Markierungen einstellbar, Vorgabe schlicht',
  run() {
    const fehler = [];
    const strasse = bild(undefined);            // ohne Einstellung: Vorgabe
    const gesetzt = bild('strasse');
    const voll = bild('komplett');

    // Strasse: nur die Aussenlinie ist ein Viereck. Komplett bringt je Seite
    // Strafraum und Torraum dazu — also vier weitere.
    if (strasse.kaesten4 !== 1) fehler.push(`Vorgabe zeichnet ${strasse.kaesten4} Vierecke, erwartet nur die Aussenlinie`);
    if (gesetzt.kaesten4 !== 1) fehler.push(`STREET SOCCER zeichnet ${gesetzt.kaesten4} Vierecke`);
    if (voll.kaesten4 !== 5) fehler.push(`KOMPLETT zeichnet ${voll.kaesten4} Vierecke, erwartet 5`);
    if (voll.zuege <= strasse.zuege) fehler.push('KOMPLETT zeichnet nicht mehr als STREET SOCCER');

    // Der frueher hier stehende vorzeitige Abbruch verschluckte die Tore.
    for (const [was, b] of [['STREET SOCCER', strasse], ['KOMPLETT', voll]]) {
      if (b.tore !== 2) fehler.push(`${was}: ${b.tore} Tore gezeichnet, erwartet 2`);
    }

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `Vorgabe nur Aussenlinie, Mittellinie, Kreis und zwei Boegen (${strasse.zuege} Zuege); KOMPLETT ${voll.zuege}; beide mit zwei Toren`
    };
  }
};
