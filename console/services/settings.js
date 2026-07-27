// Einstellungen der Konsole. Sie liegen in localStorage — ohne das wäre ein
// Einstellungsmenü sinnlos, weil jeder Neustart alles zurücksetzte.
//
// Spiele lesen die Werte über `api.settings` und müssen damit rechnen, dass es
// das Feld nicht gibt (Prüfstand, Einbettung): immer mit Vorgabewert abfragen.

const KEY = 'retrocon.settings';

export const OPTIONS = {
  volume:     { label: 'LAUTSTÄRKE',   werte: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], zeige: v => v + ' %' },
  duration:   { label: 'SPIELDAUER',   werte: [50, 75, 100, 150, 200],                      zeige: v => v + ' %' },
  difficulty: { label: 'SCHWIERIGKEIT', werte: ['leicht', 'normal', 'schwer'],              zeige: v => v.toUpperCase() },
  scanlines:  { label: 'BILDRÖHRE',    werte: [true, false],                                zeige: v => v ? 'AN' : 'AUS' },
  fullscreen: { label: 'VOLLBILD',     werte: [false, true],                                zeige: v => v ? 'AN' : 'AUS' },
};

const DEFAULTS = { volume: 70, duration: 100, difficulty: 'normal', scanlines: true, fullscreen: false };

let werte = { ...DEFAULTS };
const hoerer = [];

export function loadSettings() {
  try {
    const roh = JSON.parse(localStorage.getItem(KEY) || '{}');
    for (const k of Object.keys(DEFAULTS)) {
      // Nur übernehmen, was auch als Option existiert — sonst schleppt ein
      // alter Stand Werte mit, die es nicht mehr gibt
      if (OPTIONS[k].werte.includes(roh[k])) werte[k] = roh[k];
    }
  } catch {}
  return werte;
}

export function getSetting(k) { return werte[k]; }
export function allSettings() { return { ...werte }; }

export function setSetting(k, v) {
  werte[k] = v;
  try { localStorage.setItem(KEY, JSON.stringify(werte)); } catch {}
  hoerer.forEach(fn => fn(k, v));
}

// Nächsten Wert der Liste wählen, am Ende wieder von vorn
export function cycleSetting(k) {
  const o = OPTIONS[k];
  const i = o.werte.indexOf(werte[k]);
  setSetting(k, o.werte[(i + 1) % o.werte.length]);
  return werte[k];
}

export function onSettingChange(fn) { hoerer.push(fn); }

// ── Für die Spiele aufbereitet ────────────────────────────
// Faktoren statt Rohwerte, damit ein Spiel nicht wissen muss, wie das Menü
// die Stufen benennt.
export function gameSettings() {
  return {
    durationFactor: werte.duration / 100,
    // Grundstärke der KI-Gegner. Der Turnieraufschlag je Runde kommt im Spiel dazu.
    skillBase: werte.difficulty === 'leicht' ? 0.90 : werte.difficulty === 'schwer' ? 1.12 : 1,
  };
}
