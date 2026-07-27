// SPA-Orchestrator: Screen-Routing + Verdrahtung von Services und Views.
import { setupPeer, onReady, onConnect, onDisconnect, onData } from './services/connection.js';
import { initBoot } from './views/boot.js';
import { renderQRs, setPlayerConnected } from './views/setup.js';
import { initMenu, handleMenuInput, resetMenu, goToRow, refreshMenu } from './views/menu.js';
import { initGame, startGame, exitGame, getCurrentGame, isIngameMenuOpen, handleIngameMenuInput, openIgMenu } from './views/game.js';
import { loadSettings, getGlobal, setGlobal, onGlobalChange } from './services/settings.js';
import { setMasterVolume } from './services/audio.js';

let activeScreen = 'boot';

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(name)?.classList.add('active');
  activeScreen = name;
}

export function notifyScreenChange(name) {
  activeScreen = name;
}

initBoot(
  () => { showScreen('main-menu'); resetMenu(); },
  () => {}
);
// Einstellungen gelten, bevor irgendetwas gezeichnet oder gehört wird
loadSettings();
applyGlobal('scanlines', getGlobal('scanlines'));
onGlobalChange(applyGlobal);

initGame();
initMenu();

onReady(urls => renderQRs(urls));
onConnect(player => setPlayerConnected(player, true));
onDisconnect(player => {
  setPlayerConnected(player, false);
  getCurrentGame()?.onDisconnect?.(player);
});
onData((player, gp, prev) => {
  const cg = getCurrentGame();
  if (cg) {
    if (isIngameMenuOpen()) { handleIngameMenuInput(gp, prev); return; }
    if (gp.select && !prev?.select) { openIgMenu(); return; }
    cg.input?.(player, gp, prev);
  } else {
    const active = document.querySelector('.screen.active')?.id || activeScreen;
    handleMenuInput(active, gp, prev);
  }
});

// Einen globalen Einstellungswert wirksam machen. Spielspezifische Regler
// gehen die Konsole nichts an — die liest jedes Spiel beim Start selbst.
function applyGlobal(key, wert) {
  if (key === 'volume')    setMasterVolume(wert);
  if (key === 'scanlines') document.body.classList.toggle('no-scanlines', !wert);
  if (key === 'fullscreen') {
    // Der Browser erlaubt das nur aus einer Geste heraus — der Klick im Menü
    // ist eine, ein Fehlschlag bleibt folgenlos.
    if (wert) document.documentElement.requestFullscreen?.().catch(() => {});
    else if (document.fullscreenElement) document.exitFullscreen?.().catch(() => {});
  }
}

// Vollbild kann jederzeit ohne unser Zutun enden (ESC). Das Menü muss das
// mitbekommen — und der Knopf sein Zeichen wechseln.
document.addEventListener('fullscreenchange', () => { refreshMenu(); zeichenSetzen(); });

// ── Vollbild-Knopf ───────────────────────────────────────────────────
// Er stört nicht: Im Menü gibt es dafür die Einstellung, also erscheint er nur
// im Spiel — und auch dort nur, solange die Maus bewegt wird. Ohne Zeigegerät
// (Touch, Gamepad) taucht er nie auf.
const knopf = document.getElementById('vollbild-knopf');
const AUSBLENDEN = 2000;                    // Millisekunden ohne Mausbewegung
let ausblendUhr = 0;

function zeichenSetzen() {
  knopf?.classList.toggle('im-vollbild', !!document.fullscreenElement);
}

function knopfZeigen() {
  if (!knopf) return;
  if (!getCurrentGame()) { knopf.classList.remove('sichtbar'); return; }
  knopf.classList.add('sichtbar');
  clearTimeout(ausblendUhr);
  ausblendUhr = setTimeout(() => knopf.classList.remove('sichtbar'), AUSBLENDEN);
}

// `mousemove` und nicht `pointermove`: Ein Fingertipp soll ihn nicht
// hervorholen, dort deckt die Einstellung im Menü den Fall ab.
window.addEventListener('mousemove', knopfZeigen, { passive: true });
knopf?.addEventListener('click', e => {
  e.preventDefault();
  // Über setGlobal, damit die Einstellung im Menü denselben Weg nimmt
  setGlobal('fullscreen', !document.fullscreenElement);
  knopfZeigen();
});
zeichenSetzen();

setupPeer();
