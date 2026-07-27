// Der Rasen ist der Hintergrund des ganzen Schirms. Belag und Muster sind
// getrennt einstellbar — Vorgabe ist dunkelgruen und ohne Bahnen.
const { session } = require('../harness');

const BELAEGE = {
  hellgruen: ['#1d4229', '#183820', '#7da58c'],
  blau:      ['#173a52', '#123045', '#7a97ad'],
  rot:       ['#4a2020', '#3e1a1a', '#ad8585'],
};

function bild(belag, muster, w = 1600, h = 900) {
  const s = session('soccer', {
    conns: new Map([[1, 'keyboard']]),
    setting: k => (k === 'turf' ? belag : k === 'mow' ? muster : undefined), w, h
  });
  for (let i = 0; i < 4; i++) s.tap();
  // Der Gegner wird ausgelost, und seine Flagge in der Anzeigezeile besteht
  // aus Rechtecken. Ohne festen Gegner schwankt die Zahl der Rechtecke von
  // Lauf zu Lauf, und der Vergleich mit und ohne Bahnen geht nicht auf.
  s.state.myTeam = 0; s.state.foeTeam = 1;
  s.step();
  const k = s.kaesten();
  // Das erste bildschirmfuellende Rechteck ist das Loeschen der Leinwand, das
  // zweite der Belag. Die Bahnen kommen direkt danach.
  const voll = k.filter(q => q.w >= w && q.h >= h);
  const flaeche = voll[voll.length - 1];
  return { flaeche, ab: k.indexOf(flaeche) + 1, k };
}

module.exports = {
  name: 'Fussball · Belag und Muster einstellbar',
  run() {
    const fehler = [];
    const W = 1600, H = 900;

    // Vorgabe: hellgruen, keine Bahnen. Ohne `setting` faellt das Spiel
    // darauf zurueck, ebenso bei einem alten gespeicherten Wert.
    // Wie viele Rechtecke ein Bild ohne Bahnen hat, sagt der Vergleichslauf.
    // Alles darueber sind die Bahnen — das kommt ohne Annahme ueber ihre
    // Farbe aus, die ja gerade geprueft werden soll.
    const ohneBahnen = bild('hellgruen', 'keins').k.length;
    for (const [was, b] of [['ohne Einstellung', bild(undefined, undefined)],
                            ['alter Wert', bild('dunkelgruen', 'laengs')]]) {
      if (!b.flaeche) { fehler.push(`${was}: der Belag deckt den Schirm nicht`); continue; }
      if (b.flaeche.farbe !== BELAEGE.hellgruen[0]) fehler.push(`${was}: Farbe ${b.flaeche.farbe}`);
      if (b.k.length !== ohneBahnen) fehler.push(`${was}: ${b.k.length - ohneBahnen} Bahnen statt keiner`);
    }

    // Jeder Belag faerbt die ganze Flaeche, und zwar verschieden
    const gesehen = new Set();
    for (const [name, [flaeche]] of Object.entries(BELAEGE)) {
      const b = bild(name, 'keins');
      if (!b.flaeche) { fehler.push(`${name}: deckt den Schirm nicht`); continue; }
      if (b.flaeche.x > 0 || b.flaeche.y > 0) fehler.push(`${name}: beginnt bei ${b.flaeche.x},${b.flaeche.y}`);
      if (b.flaeche.farbe !== flaeche) fehler.push(`${name}: zeichnet ${b.flaeche.farbe} statt ${flaeche}`);
      gesehen.add(b.flaeche.farbe);
    }
    if (gesehen.size !== 3) fehler.push(`nur ${gesehen.size} verschiedene Belaege`);

    // STREIFEN: Bahnen in der Bahnenfarbe des Belags, ueber den ganzen Schirm
    for (const [name, [, bahn]] of Object.entries(BELAEGE)) {
      const ohne = bild(name, 'keins'), mit = bild(name, 'streifen');
      const bahnen = mit.k.slice(mit.ab, mit.ab + (mit.k.length - ohne.k.length));
      if (!bahnen.length) { fehler.push(`${name}: STREIFEN zeichnet keine Bahnen`); continue; }
      if (bahnen.some(q => q.farbe !== bahn)) fehler.push(`${name}: Bahnen in der falschen Farbe`);
      const x0 = Math.min(...bahnen.map(q => q.x)), x1 = Math.max(...bahnen.map(q => q.x + q.w));
      if (x0 > 0 || x1 < W) fehler.push(`${name}: Bahnen decken nur ${x0.toFixed(0)}–${x1.toFixed(0)} ab`);
      if (bahnen.some(q => q.h < H - 1)) fehler.push(`${name}: Bahnen laufen nicht ueber die volle Hoehe`);
    }

    // Die Linien tragen die Farbe des Belags, nicht immer die gruene
    for (const [name, [, , linie]] of Object.entries(BELAEGE)) {
      const s = session('soccer', {
        conns: new Map([[1, 'keyboard']]),
        setting: k => (k === 'turf' ? name : undefined), w: W, h: H
      });
      for (let i = 0; i < 4; i++) s.tap();
      s.step();
      const rahmen = s.bild().pfade.find(z => z.punkte.length === 4);
      if (!rahmen) fehler.push(`${name}: keine Aussenlinie`);
      else if (rahmen.farbe !== linie) fehler.push(`${name}: Linien in ${rahmen.farbe} statt ${linie}`);
    }

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : 'drei Belaege ueber den ganzen Schirm, Vorgabe Rasen ohne Bahnen, STREIFEN quer zur Spielrichtung'
    };
  }
};
