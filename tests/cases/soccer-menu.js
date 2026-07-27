// Menuefluss: Reihenfolge der Auswahlbildschirme und Zurueck-Navigation.
const { session, pad } = require('../harness');

module.exports = {
  name: 'Fussball · Menuefluss',
  run() {
    const fehler = [];
    // Allein: Modus -> Anzahl -> Mannschaft -> Anpfiff (kein Seitenwechsel)
    {
      const s = session('soccer');
      const S = s.state;
      s.tap();                                   // Modus
      if (S.phase !== 'count') fehler.push(`nach Modus ${S.phase}, erwartet count`);
      s.tap();                                   // ein Spieler
      if (S.phase !== 'team') fehler.push(`nach Anzahl ${S.phase}, erwartet team`);
      if (S.twoPlayers) fehler.push('twoPlayers darf allein nicht gesetzt sein');
      // Zurueck muss zur Anzahl fuehren, nicht zur Seitenwahl
      s.send(pad({ b: true })); s.send(pad());
      if (S.phase !== 'count') fehler.push(`Zurueck aus team fuehrt nach ${S.phase}, erwartet count`);
    }
    // Zu zweit gegeneinander: eigene Mannschaftswahl je Spieler
    {
      const s = session('soccer');
      const S = s.state;
      s.tap();                                   // Modus (Freundschaftsspiel steht auf 0)
      s.send(pad({ dpad: { down: true } })); s.send(pad());
      s.tap();                                   // zwei Spieler
      if (S.phase !== 'side') fehler.push(`zu zweit: nach Anzahl ${S.phase}, erwartet side`);
      if (!S.twoPlayers) fehler.push('twoPlayers nicht gesetzt');
    }
    return { ok: fehler.length === 0, info: fehler.length ? fehler.join(' · ') : 'Reihenfolge und Zurueck-Navigation stimmen' };
  }
};
