// Hauptmenü: Karussell + Legende + Navigation.
import { startGame, exitGame, getCurrentGame } from './game.js';
import { showScreen } from '../app.js';

let track, carousel;
let gameIds = [];
let carouselIdx = 0;
let legendIdx = 0;
let menuSection = 'carousel'; // 'carousel' | 'legend'

const legendItems = () => [...document.querySelectorAll('#menu-legend .legend-item')];

export function initMenu() {
  gameIds = Object.keys(window.RetroGames || {});
  track = document.getElementById('carousel-track');
  carousel = document.getElementById('carousel');

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
      if (carouselIdx === gameIds.indexOf(id)) startGame(id);
      else { carouselIdx = gameIds.indexOf(id); menuSection = 'carousel'; highlight(); }
    });
    track.appendChild(card);
  });

  legendItems().forEach(el => {
    el.addEventListener('click', () => activateLegend(el.dataset.action));
  });

  highlight();
  window.addEventListener('resize', highlight);

  window.addEventListener('keydown', e => {
    if (getCurrentGame()) {
      if (e.key === 'Escape') { exitGame(); e.preventDefault(); }
      return;
    }
    const active = document.querySelector('.screen.active')?.id;

    if (active === 'main-menu') {
      switch (e.key) {
        case 'ArrowRight':
          if (carouselIdx < gameIds.length - 1) { carouselIdx++; highlight(); }
          e.preventDefault(); break;
        case 'ArrowLeft':
          if (carouselIdx > 0) { carouselIdx--; highlight(); }
          e.preventDefault(); break;
        case 'ArrowDown':
          if (menuSection === 'carousel') { menuSection = 'legend'; legendIdx = 0; highlight(); }
          else if (legendIdx < legendItems().length - 1) { legendIdx++; highlight(); }
          e.preventDefault(); break;
        case 'ArrowUp':
          if (menuSection === 'legend') {
            if (legendIdx > 0) { legendIdx--; highlight(); }
            else { menuSection = 'carousel'; highlight(); }
          }
          e.preventDefault(); break;
        case 'Enter': case ' ':
          if (menuSection === 'legend') activateLegend(legendItems()[legendIdx]?.dataset.action);
          else startGame(gameIds[carouselIdx]);
          e.preventDefault(); break;
        case 'b': case 'B':
          showScreen('setup'); e.preventDefault(); break;
      }
    } else if (active === 'setup') {
      // Enter/A navigieren zurück — außer ein Mode-Button ist fokussiert (dann native Click)
      if (e.key === 'Escape' ||
          ((e.key === 'Enter' || e.key === 'a' || e.key === 'A') &&
           !document.activeElement?.classList.contains('mode-btn'))) {
        showScreen('main-menu'); resetMenu(); e.preventDefault();
      }
      // 1/2 für Modus-Wechsel: in setup.js
    }
  });
}

function highlight() {
  const cards = [...track.children];
  cards.forEach((el, i) => el.classList.toggle('selected', i === carouselIdx && menuSection === 'carousel'));

  const selected = cards[carouselIdx];
  if (selected) {
    const offset = selected.offsetLeft + selected.offsetWidth / 2 - carousel.clientWidth / 2;
    track.style.transform = `translateX(${-offset}px)`;
  }

  carousel.classList.toggle('has-prev', carouselIdx > 0);
  carousel.classList.toggle('has-next', carouselIdx < cards.length - 1);

  legendItems().forEach((el, i) => el.classList.toggle('selected', menuSection === 'legend' && i === legendIdx));
}

function activateLegend(action) {
  if (action === 'game')     startGame(gameIds[carouselIdx]);
  if (action === 'settings') showScreen('setup');
}

export function resetMenu() {
  menuSection = 'carousel';
  carouselIdx = 0;
  highlight();
}

export function handleMenuInput(activeScreen, gp, prev) {
  if (activeScreen === 'setup') {
    if (gp.a && !prev?.a) { showScreen('main-menu'); resetMenu(); }
    return;
  }
  if (activeScreen !== 'main-menu') return;

  if (gp.a && !prev?.a) {
    if (menuSection === 'legend') activateLegend(legendItems()[legendIdx]?.dataset.action);
    else startGame(gameIds[carouselIdx]);
    return;
  }
  if (gp.b && !prev?.b) { showScreen('setup'); return; }

  if (menuSection === 'carousel') {
    if (gp.dpad.right && !prev?.dpad?.right && carouselIdx < gameIds.length - 1) { carouselIdx++; highlight(); }
    if (gp.dpad.left  && !prev?.dpad?.left  && carouselIdx > 0)                  { carouselIdx--; highlight(); }
    if (gp.dpad.down  && !prev?.dpad?.down) { menuSection = 'legend'; legendIdx = 0; highlight(); }
  } else {
    const items = legendItems();
    if (gp.dpad.down && !prev?.dpad?.down && legendIdx < items.length - 1) { legendIdx++; highlight(); }
    if (gp.dpad.up   && !prev?.dpad?.up) {
      if (legendIdx > 0) { legendIdx--; highlight(); }
      else { menuSection = 'carousel'; highlight(); }
    }
  }
}
