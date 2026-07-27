// Der Rasen ist der Hintergrund des ganzen Schirms, und sein Muster laesst
// sich einstellen. Vorgabe ist einfarbig — ohne Bahnen.
const { session } = require('../harness');

const TURF = '#10231a', TURF_ALT = '#0d1d15';

function bild(art, w = 1600, h = 900) {
  const s = session('soccer', {
    conns: new Map([[1, 'keyboard']]),
    setting: k => (k === 'turf' ? art : undefined), w, h
  });
  for (let i = 0; i < 4; i++) s.tap();
  s.step();
  const k = s.kaesten();
  return {
    rasen: k.find(q => q.farbe === TURF && q.w > w * 0.5),
    bahnen: k.filter(q => q.farbe === TURF_ALT)
  };
}

module.exports = {
  name: 'Fussball · Rasen deckt den Schirm, Muster einstellbar',
  run() {
    const fehler = [];
    const W = 1600, H = 900;

    // Vorgabe: einfarbig. Ohne `setting` faellt das Spiel darauf zurueck.
    const ohne = bild(undefined);
    if (ohne.bahnen.length) fehler.push(`Vorgabe zeichnet ${ohne.bahnen.length} Bahnen, erwartet keine`);

    const ein = bild('einfarbig');
    if (ein.bahnen.length) fehler.push(`EINFARBIG zeichnet ${ein.bahnen.length} Bahnen`);
    if (!ein.rasen) fehler.push('kein Rasen gezeichnet');
    else if (ein.rasen.x > 0 || ein.rasen.y > 0 || ein.rasen.w < W || ein.rasen.h < H) {
      fehler.push(`Rasen deckt nur ${ein.rasen.w}x${ein.rasen.h} ab ${ein.rasen.x},${ein.rasen.y}`);
    }

    // Jedes Muster zeichnet Bahnen, und sie reichen ueber den ganzen Schirm
    for (const art of ['quer', 'laengs', 'schach']) {
      const b = bild(art);
      if (!b.bahnen.length) { fehler.push(`${art} zeichnet keine Bahnen`); continue; }
      const x0 = Math.min(...b.bahnen.map(q => q.x));
      const x1 = Math.max(...b.bahnen.map(q => q.x + q.w));
      const y0 = Math.min(...b.bahnen.map(q => q.y));
      const y1 = Math.max(...b.bahnen.map(q => q.y + q.h));
      if (x0 > 0 || x1 < W || y0 > 0 || y1 < H) {
        fehler.push(`${art}: Bahnen decken nur ${x0.toFixed(0)}–${x1.toFixed(0)} / ${y0.toFixed(0)}–${y1.toFixed(0)} ab`);
      }
    }

    // Quer und laengs muessen sich unterscheiden — sonst liegt die Achse falsch
    const q = bild('quer').bahnen[0], l = bild('laengs').bahnen[0];
    if (q && l && Math.abs(q.w - l.w) < 1 && Math.abs(q.h - l.h) < 1) {
      fehler.push('QUER und LAENGS zeichnen dieselben Bahnen');
    }
    if (q && q.h < H - 1) fehler.push('QUERSTREIFEN laufen nicht ueber die volle Hoehe');
    if (l && l.w < W - 1) fehler.push('LAENGSSTREIFEN laufen nicht ueber die volle Breite');

    // Schachbrett ist in beide Richtungen begrenzt
    const sch = bild('schach').bahnen[0];
    if (sch && (sch.w > W / 2 || sch.h > H / 2)) fehler.push('SCHACHBRETT zeichnet ganze Bahnen statt Felder');

    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : `Vorgabe ohne Bahnen, Rasen ueber den ganzen Schirm, drei Muster (${bild('schach').bahnen.length} Felder im Schachbrett)`
    };
  }
};
