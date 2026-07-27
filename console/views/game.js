// Game-View: Canvas, Loop, Start/Exit, In-Game-Overlay (Slide-Menü).
import { conns, lastInput, code, localPlayers, addLocalPlayer } from '../services/connection.js';
import { getAudioContext } from '../services/audio.js';
import { getGameSetting, cycleGameSetting, gameOptions } from '../services/settings.js';
import { resetMenu, goToGame } from './menu.js';

// Kein Import von app.js — DOM direkt manipulieren bricht die zirkuläre Abhängigkeit
function showMainMenu() {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('main-menu').classList.add('active');
}

let currentGame = null;
let currentGameId = null;
let rafId = null;
let paused = false;
let canvas, ctx, gameView, toast, igOverlay, igSlidesEl, igTrack, igSlides, igNavTop, igNavArrow, igNavLabel, igItems;
let igSetCarousel, igSetTrack, igSetTitle;
let toastTimer = null;
let igSlideIdx = 0;   // 0 = Pause-Menü, 1 = Einstellungen, 2 = Hilfe
let igSetIdx = 0;     // ausgewählter Regler auf der Einstellungs-Seite
// Wurde der Screen aus dem Startmenü des Spiels heraus geöffnet, führt Zurück
// dorthin und nicht ins Pausenmenü — sonst landet man in einem Menü, das man
// nie aufgerufen hat.
let igSetDirekt = false;
let igMenuIdx  = 0;   // ausgewählter Eintrag im Pause-Menü

// P1: Pfeiltasten + Enter, P2: WASD + Leertaste
const keys = new Set();
const prevKbGp = {};

const KB = {
  1: { up:'ArrowUp', down:'ArrowDown', left:'ArrowLeft', right:'ArrowRight',
       a:['Enter','NumpadEnter'], b:['ShiftRight','ShiftLeft'] },
  2: { up:'KeyW', down:'KeyS', left:'KeyA', right:'KeyD', a:['Space'], b:['KeyQ'] },
};

const IG_ITEMS = ['WEITER', 'SPIEL BEENDEN', 'EINSTELLUNGEN', 'HILFE'];

// Ein Platz gehört der KI, bis ihn jemand übernimmt. P1 ist per addLocalPlayer(1)
// dauerhaft vergeben; P2 beansprucht, wer im Spiel WASD drückt.
// Bewusst nur Richtungstasten: die Leertaste ist P2s Aktionstaste, und ein
// Reflex darauf würde sonst stillschweigend den KI-Gegner abschalten.
function claimByKey(code) {
  for (const p of [1, 2]) {
    const m = KB[p];
    if (!localPlayers.has(p) && [m.up, m.down, m.left, m.right].includes(code)) {
      addLocalPlayer(p);
    }
  }
}

function makeKbGamepad(player) {
  const m = KB[player] || KB[1];
  const up    = keys.has(m.up);
  const down  = keys.has(m.down);
  const left  = keys.has(m.left);
  const right = keys.has(m.right);
  const x = right ? 1 : left ? -1 : 0;
  const y = down  ? 1 : up   ? -1 : 0;
  return {
    type: 'keyboard',
    joystick: { x, y, active: up || down || left || right },
    dpad:     { up, down, left, right },
    a:      m.a.some(k => keys.has(k)),
    b:      m.b.some(k => keys.has(k)),
    select: false,
    start:  false,
  };
}

export function initGame() {
  canvas      = document.getElementById('game-canvas');
  ctx         = canvas.getContext('2d');
  gameView    = document.getElementById('game-view');
  toast       = document.getElementById('game-toast');
  igOverlay   = document.getElementById('ingame-overlay');
  igSlidesEl  = document.getElementById('ig-slides');
  igTrack     = document.getElementById('ig-slides-track');
  igSlides    = igOverlay.querySelectorAll('.ig-slide');
  igNavTop    = document.getElementById('ig-nav-top');
  igNavArrow  = document.getElementById('ig-nav-arrow');
  igNavLabel  = document.getElementById('ig-nav-label');
  igItems     = igOverlay.querySelectorAll('.ig-item');
  igSetCarousel = document.getElementById('ig-settings-carousel');
  igSetTrack    = document.getElementById('ig-settings-track');
  igSetTitle    = document.getElementById('ig-settings-title');

  igSetCarousel.querySelector('.carousel-arrow.left') .addEventListener('click', () => igSettingsStep(-1));
  igSetCarousel.querySelector('.carousel-arrow.right').addEventListener('click', () => igSettingsStep(1));

  igItems.forEach((el, i) => el.addEventListener('click', () => {
    if (igSlideIdx !== 0) return;
    igMenuIdx = i;
    selectIgMenuItem();
  }));

  igNavTop.addEventListener('click', () => {
    if (igSlideIdx > 0) { igSlideIdx--; refreshIg(); }
  });

  window.addEventListener('resize', () => {
    resizeCanvas();
    refreshIg();
    currentGame?.resize?.(canvas.width, canvas.height);
  });

  window.addEventListener('keydown', e => {
    if (!currentGame) return;
    if (e.code === 'Escape') { e.preventDefault(); handleEsc(); return; }
    if (paused) { handleIgKey(e); return; }
    keys.add(e.code);
    claimByKey(e.code);
    if (['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))
      e.preventDefault();
  });
  window.addEventListener('keyup', e => keys.delete(e.code));
}

function handleEsc() {
  if (!paused) { openIgOverlay(); return; }
  if (igSlideIdx > 0) { igSlideIdx = 0; refreshIg(); return; }
  resumeGame();
}

function handleIgKey(e) {
  if (igSlideIdx === 1) {                       // Einstellungen des Spiels
    if (e.code === 'ArrowLeft'  || e.code === 'KeyA') { igSettingsStep(-1); e.preventDefault(); return; }
    if (e.code === 'ArrowRight' || e.code === 'KeyD') { igSettingsStep(1);  e.preventDefault(); return; }
    if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
      igCycleCurrent(); e.preventDefault(); e.stopImmediatePropagation(); return;
    }
    // Hoch/Runter verlässt den Screen — dieselbe Achse wie im Konsolenmenü
    if (e.code === 'Escape' || e.code === 'KeyB' || e.code === 'Backspace' ||
        e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'ArrowDown' || e.code === 'KeyS') {
      igSettingsBack(); e.preventDefault();
    }
    return;
  }
  if (igSlideIdx === 2) {
    if (e.code === 'Escape' || e.code === 'KeyB' || e.code === 'Backspace' ||
        e.code === 'ArrowUp' || e.code === 'KeyW') {
      igSlideIdx = 0; refreshIg(); e.preventDefault();
    }
    return;
  }
  // Slide 0: Menü-Navigation
  if (e.code === 'ArrowUp' || e.code === 'KeyW') {
    igMenuIdx = (igMenuIdx - 1 + IG_ITEMS.length) % IG_ITEMS.length;
    refreshIgItems(); e.preventDefault();
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    igMenuIdx = (igMenuIdx + 1) % IG_ITEMS.length;
    refreshIgItems(); e.preventDefault();
  } else if (e.code === 'Enter' || e.code === 'NumpadEnter' || e.code === 'Space') {
    e.preventDefault(); e.stopImmediatePropagation(); selectIgMenuItem();
  }
}

function selectIgMenuItem() {
  if (igMenuIdx === 0) { resumeGame(); }
  else if (igMenuIdx === 1) { closeIgOverlay(); exitGame(); }
  else if (igMenuIdx === 2) { igSlideIdx = 1; buildIgSettings(); refreshIg(); }
  else if (igMenuIdx === 3) { igSlideIdx = 2; refreshIg(); }
}

// Die Regler des laufenden Spiels — als dasselbe Karussell wie im
// Konsolenmenü: gleiche Karten, gleiche Achse, gleiche Tasten. Was hier steht,
// deklariert das Spiel selbst; die Konsole zeigt es nur an und speichert es
// unter dem Spielnamen.
function buildIgSettings() {
  const opts = gameOptions(currentGameId);
  igSetTitle.textContent = 'INGAME EINSTELLUNGEN';
  igSetTrack.innerHTML = '';
  igSetIdx = Math.min(igSetIdx, Math.max(0, opts.length - 1));
  opts.forEach((o, i) => {
    const el = document.createElement('div');
    el.className = 'setting';
    el.innerHTML = `<span class="name">${o.label}</span><span class="wert"></span>`;
    el.addEventListener('click', () => {
      if (igSetIdx === i) cycleGameSetting(currentGameId, o.key);
      else igSetIdx = i;
      refreshIgSettings();
    });
    igSetTrack.appendChild(el);
  });
  refreshIgSettings();
}

function refreshIgSettings() {
  const opts = gameOptions(currentGameId);
  const karten = [...igSetTrack.children];
  karten.forEach((el, i) => {
    el.classList.toggle('selected', i === igSetIdx);
    el.querySelector('.wert').textContent = opts[i].zeige(getGameSetting(currentGameId, opts[i].key));
  });
  const aktiv = karten[igSetIdx];
  if (aktiv) {
    const offset = aktiv.offsetLeft + aktiv.offsetWidth / 2 - igSetCarousel.clientWidth / 2;
    igSetTrack.style.transform = `translateX(${-offset}px)`;
  }
  igSetCarousel.classList.toggle('has-prev', igSetIdx > 0);
  igSetCarousel.classList.toggle('has-next', igSetIdx < karten.length - 1);

  // Ehrlich bleiben: Dauer und Stärke liest ein Spiel beim Start
  const hint = document.getElementById('ig-settings-hint');
  if (hint) hint.textContent = opts.length
    ? '← → BLÄTTERN · A / ENTER ÄNDERN · GILT AB DEM NÄCHSTEN SPIEL'
    : 'DIESES SPIEL HAT KEINE EIGENEN EINSTELLUNGEN';
}

// Blättern endet an den Rändern, genau wie im Konsolenmenü
function igSettingsStep(step) {
  const n = gameOptions(currentGameId).length;
  const neu = igSetIdx + step;
  if (neu < 0 || neu >= n) return;
  igSetIdx = neu;
  refreshIgSettings();
}

function igSettingsBack() {
  if (igSetDirekt) { igSetDirekt = false; resumeGame(); return; }
  igSlideIdx = 0; refreshIg();
}

function igCycleCurrent() {
  const opts = gameOptions(currentGameId);
  if (!opts[igSetIdx]) return;
  cycleGameSetting(currentGameId, opts[igSetIdx].key);
  refreshIgSettings();
}

function refreshIg() {
  const h = igSlidesEl.clientHeight;
  igSlides.forEach(s => s.style.height = h + 'px');
  igTrack.style.transform = `translateY(${-igSlideIdx * h}px)`;

  const canBack = igSlideIdx > 0;
  igNavArrow.classList.toggle('visible', canBack);
  igNavLabel.classList.toggle('visible', canBack);
  igNavLabel.textContent = canBack ? 'ZURÜCK' : '';
}

function refreshIgItems() {
  igItems.forEach((el, i) => el.classList.toggle('selected', i === igMenuIdx));
}

export function openIgMenu() { openIgOverlay(); }

function openIgOverlay() {
  paused = true;
  igSetDirekt = false;
  igSlideIdx = 0;
  igMenuIdx  = 0;
  keys.clear();
  igOverlay.classList.add('visible');
  refreshIgItems();
  refreshIg();
}

function closeIgOverlay() {
  igOverlay.classList.remove('visible');
}

function resumeGame() {
  closeIgOverlay();
  paused = false;
}

export const getCurrentGame    = () => currentGame;
export const isIngameMenuOpen  = () => paused;

export function handleIngameMenuInput(gp, prev) {
  if (igSlideIdx === 1) {                       // Einstellungen des Spiels
    if (gp.dpad?.left  && !prev?.dpad?.left)  igSettingsStep(-1);
    if (gp.dpad?.right && !prev?.dpad?.right) igSettingsStep(1);
    if (gp.a && !prev?.a) igCycleCurrent();
    if ((gp.b && !prev?.b) || (gp.select && !prev?.select) ||
        (gp.dpad?.up && !prev?.dpad?.up)) igSettingsBack();
    return;
  }
  if (igSlideIdx === 2) {
    if ((gp.b && !prev?.b) || (gp.select && !prev?.select) ||
        (gp.dpad?.up && !prev?.dpad?.up)) {
      igSlideIdx = 0; refreshIg();
    }
    return;
  }
  if (gp.dpad?.up   && !prev?.dpad?.up)   { igMenuIdx = (igMenuIdx - 1 + IG_ITEMS.length) % IG_ITEMS.length; refreshIgItems(); }
  if (gp.dpad?.down && !prev?.dpad?.down) { igMenuIdx = (igMenuIdx + 1) % IG_ITEMS.length; refreshIgItems(); }
  if (gp.a     && !prev?.a)               selectIgMenuItem();
  if (gp.b     && !prev?.b)               resumeGame();
  if (gp.start && !prev?.start)           resumeGame();
}

function resizeCanvas() {
  canvas.width  = canvas.clientWidth  * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
}

export function startGame(name) {
  const mod = window.RetroGames?.[name];
  if (!mod) return;
  currentGameId = name;
  paused = false;
  gameView.style.display = 'block';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  resizeCanvas();
  keys.clear();
  for (const k in prevKbGp) delete prevKbGp[k];
  const totalPlayers = new Set([...conns.keys(), ...localPlayers]).size;
  currentGame = mod.create(ctx, canvas.width, canvas.height, Math.max(1, totalPlayers), {
    exit: exitGame,
    getConns: () => {
      const m = new Map(conns);
      for (const p of localPlayers) if (!m.has(p)) m.set(p, 'keyboard');
      return m;
    },
    audioCtx: getAudioContext(),
    // Spielspezifische Regler: das Spiel fragt seine eigenen ab, unter seinem
    // eigenen Namen. Globale Einstellungen wirken ohne Zutun der Spiele.
    setting: key => getGameSetting(name, key),
    // Spiele dürfen ihren Einstellungs-Screen selbst aufrufen — etwa aus dem
    // eigenen Startmenü, damit man nicht erst ein Spiel beginnen muss
    openSettings: () => { openIgOverlay(); igMenuIdx = 2; selectIgMenuItem(); igSetDirekt = true; },
    code
  });
  for (const [p, gp] of lastInput) currentGame.input?.(p, gp, null);
  showToast('ESC · MENÜ', 3000);
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(50, now - last) / 1000; last = now;
    if (!paused) {
      // Tastatur bleibt immer bedienbar, auch wenn für den Platz ein Controller
      // verbunden ist. Bei verbundenem Controller wird sie aber nur
      // durchgereicht, solange wirklich eine Taste liegt — ein leeres
      // Tastatur-Gamepad würde sonst jeden Frame die Controller-Eingabe
      // überschreiben. Der Loslass-Frame geht mit durch, damit Flanken
      // (Taste loslassen = schießen) nicht verlorengehen.
      for (const p of localPlayers) {
        const kbGp = makeKbGamepad(p);
        const prevGp = prevKbGp[p] || null;
        const busy = kbGp.joystick.active || kbGp.a || kbGp.b;
        const wasBusy = prevGp && (prevGp.joystick.active || prevGp.a || prevGp.b);
        if (!conns.has(p) || busy || wasBusy) {
          currentGame.input?.(p, kbGp, prevGp);
          prevKbGp[p] = kbGp;
        }
      }
      currentGame.update?.(dt);
    }
    currentGame.draw?.();
    rafId = requestAnimationFrame(loop);
  })(performance.now());
}

function showToast(text, duration) {
  if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
  toast.textContent = text;
  toast.classList.add('visible');
  toastTimer = setTimeout(() => { toast.classList.remove('visible'); toastTimer = null; }, duration);
}

export function exitGame() {
  cancelAnimationFrame(rafId);
  currentGame?.destroy?.();
  const lastId = currentGameId;
  currentGame = null;
  currentGameId = null;
  paused = false;
  closeIgOverlay();
  gameView.style.display = 'none';
  showMainMenu();
  goToGame(lastId);
}
