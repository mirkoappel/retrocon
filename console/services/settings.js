// Einstellungen der Konsole.
//
// Zwei getrennte Ebenen, die nicht vermischt werden:
//
//   GLOBAL      gehört der Konsole: Lautstärke, Bildröhre, Vollbild.
//               Betrifft jedes Spiel gleichermaßen, liegt unter `retrocon.settings`.
//
//   SPIELWEIT   gehört dem Spiel. Jedes Spiel deklariert seine eigenen Regler
//               über `window.RetroGames[id].settings` — Spieldauer, Schwierigkeit
//               und was sonst nur dort Sinn ergibt. Die Konsole zeigt und
//               speichert sie bloß, unter `retrocon.game.<id>`.
//
// Die Konsole kennt also keine Spielbegriffe, und ein Spiel muss für einen
// eigenen Regler nichts am Menü ändern.

const KEY_GLOBAL = 'retrocon.settings';
const KEY_GAME = id => `retrocon.game.${id}`;

export const GLOBAL_OPTIONS = {
  // Vollbild zuerst, weil es das ist, was man beim Hinsetzen einstellt.
  // `live` heißt: der Wert kommt nicht aus dem Speicher, sondern aus dem
  // tatsächlichen Zustand des Fensters — sonst zeigte das Menü AN, während der
  // Browser längst wieder im Fenster läuft (ESC verlässt Vollbild jederzeit).
  fullscreen: { label: 'VOLLBILD',   werte: [false, true],                                vorgabe: false, live: true,
                zeige: v => v ? 'AN' : 'AUS' },
  volume:     { label: 'LAUTSTÄRKE', werte: [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100], vorgabe: 70,    zeige: v => v + ' %' },
  scanlines:  { label: 'BILDRÖHRE',  werte: [true, false],                                vorgabe: true,  zeige: v => v ? 'AN' : 'AUS' },
};

// Zustände, die das Fenster selbst kennt. Sie werden weder geladen noch
// gespeichert — abgefragt wird immer die Wirklichkeit.
const LIVE = {
  fullscreen: () => !!document.fullscreenElement,
};

let global = {};
let proSpiel = {};
const hoerer = [];

function lies(key) {
  try { return JSON.parse(localStorage.getItem(key) || '{}'); } catch { return {}; }
}
function schreib(key, wert) {
  try { localStorage.setItem(key, JSON.stringify(wert)); } catch {}
}

export function loadSettings() {
  const roh = lies(KEY_GLOBAL);
  for (const [k, o] of Object.entries(GLOBAL_OPTIONS)) {
    if (o.live) { global[k] = LIVE[k](); continue; }
    // Nur übernehmen, was auch als Option existiert — sonst schleppt ein alter
    // Stand Werte mit, die es nicht mehr gibt
    global[k] = o.werte.includes(roh[k]) ? roh[k] : o.vorgabe;
  }
  return global;
}

export const getGlobal = k => (GLOBAL_OPTIONS[k].live ? LIVE[k]() : global[k]);

export function setGlobal(k, v) {
  global[k] = v;
  if (!GLOBAL_OPTIONS[k].live) {
    // Live-Werte gehören dem Fenster, nicht dem Speicher
    const ablage = {};
    for (const key of Object.keys(GLOBAL_OPTIONS)) if (!GLOBAL_OPTIONS[key].live) ablage[key] = global[key];
    schreib(KEY_GLOBAL, ablage);
  }
  hoerer.forEach(fn => fn(k, v));
}

export function cycleGlobal(k) {
  const o = GLOBAL_OPTIONS[k];
  const jetzt = getGlobal(k);
  setGlobal(k, o.werte[(o.werte.indexOf(jetzt) + 1) % o.werte.length]);
  return getGlobal(k);
}

export function onGlobalChange(fn) { hoerer.push(fn); }

// ── Spielspezifisch ───────────────────────────────────────
// Was ein Spiel anbietet, steht im Spiel — die Konsole liest es nur aus.
export function gameOptions(id) {
  return (window.RetroGames?.[id]?.settings) || [];
}

export function getGameSetting(id, key) {
  if (!proSpiel[id]) {
    const roh = lies(KEY_GAME(id));
    proSpiel[id] = {};
    for (const o of gameOptions(id)) {
      proSpiel[id][o.key] = o.werte.includes(roh[o.key]) ? roh[o.key] : o.vorgabe;
    }
  }
  return proSpiel[id][key];
}

export function cycleGameSetting(id, key) {
  const o = gameOptions(id).find(x => x.key === key);
  if (!o) return;
  getGameSetting(id, key);                       // sicherstellen, dass geladen ist
  proSpiel[id][key] = o.werte[(o.werte.indexOf(proSpiel[id][key]) + 1) % o.werte.length];
  schreib(KEY_GAME(id), proSpiel[id]);
  return proSpiel[id][key];
}
