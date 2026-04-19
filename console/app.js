// SPA-Orchestrator: Screen-Routing + Verdrahtung von Services und Views.
import { setupPeer, onReady, onConnect, onDisconnect, onData } from './services/connection.js';
import { renderQRs, setPlayerConnected } from './views/setup.js';
import { initMenu, handleMenuInput } from './views/menu.js';
import { initGame, startGame, exitGame, getCurrentGame } from './views/game.js';

let activeScreen = 'setup';

export function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(name)?.classList.add('active');
  activeScreen = name;
}

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
  if (cg) cg.input?.(player, gp, prev);
  else handleMenuInput(activeScreen, gp, prev);
});

setupPeer();
