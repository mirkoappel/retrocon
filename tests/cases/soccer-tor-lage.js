// Das Tor steht HINTER der Torlinie. Im Hochformat stand es zeitweise in
// beiden Haelften IM Feld, weil dort die Feldlaenge nach oben zeigt (y = 0
// unten) und die Rechnung aus dem Querformat unbesehen uebernommen war.
// Geprueft wird das Gezeichnete, nicht der Quelltext.
const { session } = require('../harness');

// Der Torkasten ist das dunkle Rechteck, das ueber dem Rasen liegt.
const TOR_FARBE = 'rgba(10,14,20,0.85)';

// Der erste gezeichnete Linienzug ist die Aussenlinie — der Rasen davor wird
// gefuellt, nicht gestrichelt.
function feldRahmen(pfade) {
  const p = pfade.find(z => z.punkte.length === 4);
  if (!p) return null;
  const xs = p.punkte.map(q => q[0]), ys = p.punkte.map(q => q[1]);
  return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
}

function pruefe(was, w, h, fehler) {
  const s = session('soccer', { conns: new Map([[1, 'keyboard']]), w, h });
  for (let i = 0; i < 4; i++) s.tap();
  s.step();

  const { kaesten, pfade } = s.bild();
  const feld = feldRahmen(pfade);
  const tore = kaesten.filter(k => k.farbe === TOR_FARBE);
  if (!feld) { fehler.push(`${was}: keine Aussenlinie gefunden`); return; }
  if (tore.length !== 2) { fehler.push(`${was}: ${tore.length} Torkaesten, erwartet 2`); return; }

  const quer = w / h > 1.15;                       // Feldlaenge waagerecht?
  const a0 = quer ? feld.x0 : feld.y0;             // die beiden Torlinien
  const a1 = quer ? feld.x1 : feld.y1;
  const seiten = new Set();
  for (const t of tore) {
    const von = quer ? t.x : t.y, bis = quer ? t.x + t.w : t.y + t.h;
    const drunter = bis <= a0 + 0.5;               // vor der einen Torlinie
    const drueber = von >= a1 - 0.5;               // hinter der anderen
    if (!drunter && !drueber) {
      fehler.push(`${was}: ein Tor liegt im Feld (${von.toFixed(0)}–${bis.toFixed(0)}, Feld ${a0.toFixed(0)}–${a1.toFixed(0)})`);
    } else seiten.add(drunter ? 'A' : 'B');
  }
  if (fehler.length === 0 && seiten.size !== 2) fehler.push(`${was}: beide Tore liegen auf derselben Seite`);
}

module.exports = {
  name: 'Fussball · Tore stehen hinter der Torlinie',
  run() {
    const fehler = [];
    pruefe('Querformat', 1600, 900, fehler);
    pruefe('Hochformat', 540, 960, fehler);
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : 'Quer- und Hochformat: beide Tore liegen ausserhalb des Feldes, je eines pro Seite'
    };
  }
};
