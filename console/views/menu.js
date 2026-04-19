// Hauptmenü: 2D-Navigation (Karussell horizontal, Rows vertikal).
import { startGame, exitGame, getCurrentGame } from './game.js';

const ROWS = ['RETROCON', 'CONTROLLER', 'SPIELE', 'EINSTELLUNGEN', 'CREDITS'];
const SPIELE_ROW = 2;

let track, carousel, rowsEl, rowsTrack, labelUp, labelDown, arrowUp, arrowDown;
let gameIds = [];
let carouselIdx = 0;
let rowIdx = 0;

export function initMenu() {
  gameIds = Object.keys(window.RetroGames || {});
  track      = document.getElementById('carousel-track');
  carousel   = document.getElementById('carousel');
  rowsEl    = document.getElementById('menu-rows');
  rowsTrack = document.getElementById('menu-rows-track');
  labelUp   = document.getElementById('row-label-up');
  labelDown = document.getElementById('row-label-down');
  arrowUp   = document.getElementById('row-arrow-up');
  arrowDown = document.getElementById('row-arrow-down');

  gameIds.forEach(id => {
    const g = window.RetroGames[id];
    const card = document.createElement('div');
    card.className = 'game-card';
    card.dataset.game = id;
    card.innerHTML = `
      <div class="art">${g.artSvg || ''}</div>
      <div class="meta">
        <div class="title">${g.name}</div>
        <div class="tagline">${g.tagline || ''}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      if (rowIdx !== SPIELE_ROW) return;
      if (carouselIdx === gameIds.indexOf(id)) startGame(id);
      else { carouselIdx = gameIds.indexOf(id); refresh(); }
    });
    track.appendChild(card);
  });

  const rowTop    = document.getElementById('row-top');
  const rowBottom = document.getElementById('row-bottom');

  rowTop.addEventListener('click', () => {
    if (rowIdx > 0) { rowIdx--; refresh(); }
  });
  rowBottom.addEventListener('click', () => {
    if (rowIdx < ROWS.length - 1) { rowIdx++; refresh(); }
  });

  let wheelCooldown = false;
  window.addEventListener('wheel', e => {
    if (getCurrentGame()) return;
    if (document.querySelector('.screen.active')?.id !== 'main-menu') return;
    if (wheelCooldown) return;
    if (Math.abs(e.deltaY) < 20) return;
    wheelCooldown = true;
    setTimeout(() => wheelCooldown = false, 700);
    if (e.deltaY > 0 && rowIdx < ROWS.length - 1) { rowIdx++; refresh(); }
    else if (e.deltaY < 0 && rowIdx > 0)           { rowIdx--; refresh(); }
  }, { passive: true });

  document.querySelector('.carousel-arrow.left') .addEventListener('click', () => {
    if (carouselIdx > 0) { carouselIdx--; refresh(); }
  });
  document.querySelector('.carousel-arrow.right').addEventListener('click', () => {
    if (carouselIdx < gameIds.length - 1) { carouselIdx++; refresh(); }
  });

  refresh();
  window.addEventListener('resize', refresh);

  window.addEventListener('keydown', e => {
    if (getCurrentGame()) return;
    const active = document.querySelector('.screen.active')?.id;
    if (active !== 'main-menu') return;

    switch (e.key) {
      case 'ArrowUp': case 'w': case 'W':
        if (rowIdx > 0) { rowIdx--; refresh(); }
        e.preventDefault(); break;
      case 'ArrowDown': case 's': case 'S':
        if (rowIdx < ROWS.length - 1) { rowIdx++; refresh(); }
        e.preventDefault(); break;
      case 'ArrowRight': case 'd': case 'D':
        if (rowIdx === SPIELE_ROW && carouselIdx < gameIds.length - 1) { carouselIdx++; refresh(); }
        e.preventDefault(); break;
      case 'ArrowLeft': case 'a': case 'A':
        if (rowIdx === SPIELE_ROW && carouselIdx > 0) { carouselIdx--; refresh(); }
        e.preventDefault(); break;
      case 'Enter': case ' ':
        if (rowIdx === SPIELE_ROW) startGame(gameIds[carouselIdx]);
        e.preventDefault(); break;
    }
  });
}

function refresh() {
  const rowH = rowsEl.clientHeight;
  document.querySelectorAll('.menu-row').forEach(r => r.style.height = rowH + 'px');
  rowsTrack.style.transform = `translateY(${-rowIdx * rowH}px)`;

  const canUp = rowIdx > 0;
  arrowUp.classList.toggle('visible', canUp);
  labelUp.classList.toggle('visible', canUp);
  labelUp.textContent = canUp ? ROWS[rowIdx - 1] : '';

  const canDown = rowIdx < ROWS.length - 1;
  arrowDown.classList.toggle('visible', canDown);
  labelDown.classList.toggle('visible', canDown);
  labelDown.textContent = canDown ? (rowIdx === 0 ? 'WEITER' : ROWS[rowIdx + 1]) : '';

  // Carousel highlight (only relevant on SPIELE row)
  const cards = [...track.children];
  cards.forEach((el, i) => el.classList.toggle('selected', i === carouselIdx));
  const selected = cards[carouselIdx];
  if (selected) {
    const offset = selected.offsetLeft + selected.offsetWidth / 2 - carousel.clientWidth / 2;
    track.style.transform = `translateX(${-offset}px)`;
  }
  carousel.classList.toggle('has-prev', carouselIdx > 0);
  carousel.classList.toggle('has-next', carouselIdx < cards.length - 1);
}

export function resetMenu() {
  carouselIdx = 0;
  rowIdx = 0;
  refresh();
}

export function goToRow(idx) {
  rowIdx = Math.max(0, Math.min(ROWS.length - 1, idx));
  refresh();
}

export function goToGame(id) {
  rowIdx = SPIELE_ROW;
  const i = gameIds.indexOf(id);
  carouselIdx = i >= 0 ? i : 0;
  refresh();
}

export function handleMenuInput(activeScreen, gp, prev) {
  if (activeScreen !== 'main-menu') return;

  if (gp.dpad.up   && !prev?.dpad?.up   && rowIdx > 0)              { rowIdx--; refresh(); return; }
  if (gp.dpad.down && !prev?.dpad?.down && rowIdx < ROWS.length - 1) { rowIdx++; refresh(); return; }

  if (rowIdx === SPIELE_ROW) {
    if (gp.a && !prev?.a) { startGame(gameIds[carouselIdx]); return; }
    if (gp.dpad.right && !prev?.dpad?.right && carouselIdx < gameIds.length - 1) { carouselIdx++; refresh(); }
    if (gp.dpad.left  && !prev?.dpad?.left  && carouselIdx > 0)                  { carouselIdx--; refresh(); }
  }
}
