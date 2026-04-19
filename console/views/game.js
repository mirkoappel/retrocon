// Game-View: Canvas, Loop, Start/Exit.
import { conns, lastInput, code } from '../services/connection.js';
import { showScreen } from '../app.js';
import { resetMenu } from './menu.js';

let currentGame = null;
let rafId = null;
let canvas, ctx, gameView;

export function initGame() {
  canvas   = document.getElementById('game-canvas');
  ctx      = canvas.getContext('2d');
  gameView = document.getElementById('game-view');
  window.addEventListener('resize', () => {
    resizeCanvas();
    currentGame?.resize?.(canvas.width, canvas.height);
  });
}

export const getCurrentGame = () => currentGame;

function resizeCanvas() {
  canvas.width  = canvas.clientWidth  * devicePixelRatio;
  canvas.height = canvas.clientHeight * devicePixelRatio;
}

export function startGame(name) {
  const mod = window.RetroGames?.[name];
  if (!mod) return;
  gameView.style.display = 'block';
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  resizeCanvas();
  currentGame = mod.create(ctx, canvas.width, canvas.height, Math.max(1, conns.size), {
    exit: exitGame,
    getConns: () => conns,
    code
  });
  for (const [p, gp] of lastInput) currentGame.input?.(p, gp, null);
  let last = performance.now();
  (function loop(now) {
    const dt = Math.min(50, now - last) / 1000; last = now;
    currentGame.update?.(dt);
    currentGame.draw?.();
    rafId = requestAnimationFrame(loop);
  })(performance.now());
}

export function exitGame() {
  cancelAnimationFrame(rafId);
  currentGame?.destroy?.();
  currentGame = null;
  gameView.style.display = 'none';
  showScreen('main-menu');
  resetMenu();
}
