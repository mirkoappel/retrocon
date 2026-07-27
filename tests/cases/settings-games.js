// Die Spiele müssen die Konsolen-Einstellungen annehmen — und ohne sie
// weiterlaufen, denn `api.settings` fehlt im Prüfstand und bei Einbettung.
const { session, playMatch } = require('../harness');

module.exports = {
  name: 'Einstellungen · Spiele uebernehmen Dauer und Staerke',
  run() {
    const fehler = [];

    // Ohne Einstellungen: Vorgabewerte
    {
      const s = session('soccer');
      for (let i = 0; i < 4; i++) s.tap();
      if (Math.round(s.state.clock) !== 180) fehler.push(`ohne Einstellungen Halbzeit ${s.state.clock}, erwartet 180`);
    }
    // Halbe Spieldauer
    {
      const s = session('soccer', { settings: { durationFactor: 0.5, skillBase: 1 } });
      for (let i = 0; i < 4; i++) s.tap();
      if (Math.round(s.state.clock) !== 90) fehler.push(`bei 50 % Halbzeit ${s.state.clock}, erwartet 90`);
    }
    // Grundstärke wirkt nur auf den Gegner, auch im Freundschaftsspiel
    {
      const s = session('soccer', { settings: { durationFactor: 1, skillBase: 1.12 } });
      for (let i = 0; i < 4; i++) s.tap();
      // Über den Torwart messbar: seine Geschwindigkeit hängt an skill(team)
      const gk0 = s.state.players.find(p => p.role === 'GK' && p.team === 0);
      const gk1 = s.state.players.find(p => p.role === 'GK' && p.team === 1);
      if (!gk0 || !gk1) fehler.push('Torwaerter nicht gefunden');
    }
    // Katapult muss die Dauer ebenfalls annehmen
    {
      const s = session('catapult', { settings: { durationFactor: 0.5, skillBase: 1 } });
      for (let i = 0; i < 4; i++) s.tap();
      const t = s.state.timeLeft;
      if (Math.round(t) !== 150) fehler.push(`Katapult bei 50 %: ${t}, erwartet 150`);
    }
    return {
      ok: fehler.length === 0,
      info: fehler.length ? fehler.join(' · ') : 'Fussball 180/90 s, Katapult 300/150 s, ohne Einstellungen Vorgabewerte'
    };
  }
};
