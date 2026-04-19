// Setup-Row: QR-Codes + Player-Status.
import { addLocalPlayer } from '../services/connection.js';

// P1 ist immer Mensch — Tastatur läuft automatisch, KI wird unterdrückt
addLocalPlayer(1);

export function renderQRs({ url1, url2 }) {
  const qrOpts = { width: 260, height: 260, correctLevel: QRCode.CorrectLevel.M };
  new QRCode(document.getElementById('qr-1'), { ...qrOpts, text: url1 });
  new QRCode(document.getElementById('qr-2'), { ...qrOpts, text: url2 });
}

export function setPlayerConnected(player, on) {
  const card = document.getElementById(`player-card-${player}`);
  const dot  = document.getElementById(`dot-${player}`);
  if (card) card.classList.toggle('connected', on);
  if (dot)  {
    dot.classList.toggle('connected', on);
    dot.textContent = on ? 'VERBUNDEN' : 'WARTE AUF VERBINDUNG';
  }
}
