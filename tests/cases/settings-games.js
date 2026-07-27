// Trennung der Ebenen: Spielspezifische Regler gehören dem Spiel. Es muss sie
// deklarieren, sie übernehmen — und ohne die Konsole weiterlaufen, denn
// `api.setting` fehlt im Prüfstand und bei Einbettung.
const { load, session } = require('../harness');

module.exports = {
  name: 'Einstellungen · Spiele deklarieren und uebernehmen eigene Regler',
  run() {
    const fehler = [];

    // Deklaration: Form und Vorgabewerte müssen stimmen, sonst kann die
    // Konsole sie nicht anzeigen
    for (const [spiel, keys] of [['soccer', ['duration', 'difficulty']], ['catapult', ['duration']]]) {
      const mod = load(spiel);
      const opts = mod.settings || [];
      for (const k of keys) {
        const o = opts.find(x => x.key === k);
        if (!o) { fehler.push(`${spiel} deklariert ${k} nicht`); continue; }
        if (!Array.isArray(o.werte) || !o.werte.length) fehler.push(`${spiel}/${k} ohne Werteliste`);
        if (!o.werte.includes(o.vorgabe)) fehler.push(`${spiel}/${k}: Vorgabe ${o.vorgabe} steht nicht in der Werteliste`);
        if (typeof o.zeige !== 'function') fehler.push(`${spiel}/${k} ohne Anzeigefunktion`);
        if (!o.label) fehler.push(`${spiel}/${k} ohne Beschriftung`);
      }
    }

    // Ohne Konsole: Vorgabewerte
    {
      const s = session('soccer');
      for (let i = 0; i < 4; i++) s.tap();
      if (Math.round(s.state.clock) !== 180) fehler.push(`ohne api.setting Halbzeit ${s.state.clock}, erwartet 180`);
    }
    // Mit Konsole: der gewählte Wert zählt
    {
      const s = session('soccer', { setting: k => (k === 'duration' ? 90 : 'normal') });
      for (let i = 0; i < 4; i++) s.tap();
      if (Math.round(s.state.clock) !== 90) fehler.push(`Halbzeit 90: ${s.state.clock}`);
    }
    {
      const s = session('catapult', { setting: () => 120 });
      for (let i = 0; i < 4; i++) s.tap();
      if (Math.round(s.state.timeLeft) !== 120) fehler.push(`Katapult 120: ${s.state.timeLeft}`);
    }
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ')
        : 'Fussball deklariert HALBZEIT + SCHWIERIGKEIT, Katapult SPIELZEIT; ohne Konsole gelten die Vorgabewerte'
    };
  }
};
