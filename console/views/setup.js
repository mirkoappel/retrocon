// Setup-Screen: QR-Codes + Player-Status.
import { conns, addLocalPlayer } from '../services/connection.js';

// P1 ist immer Mensch — Tastatur läuft automatisch, KI wird unterdrückt
addLocalPlayer(1);

export function renderQRs({ url1, url2 }) {
  const qrOpts = { width: 180, height: 180, correctLevel: QRCode.CorrectLevel.M };
  new QRCode(document.getElementById('qr-1'), { ...qrOpts, text: url1 });
  new QRCode(document.getElementById('qr-2'), { ...qrOpts, text: url2 });

  // Hint ist von Anfang an sichtbar (P1 Tastatur immer bereit)
  const hint = document.getElementById('setup-hint');
  if (hint) { hint.classList.add('ready'); hint.textContent = 'DRÜCKE A ZUM STARTEN'; }
}

export function setPlayerConnected(player, on) {
  const wrap = document.getElementById(`qr-wrap-${player}`);
  const dot  = document.getElementById(`dot-${player}`);
  if (wrap) wrap.classList.toggle('connected', on);
  if (dot)  {
    dot.classList.toggle('connected', on);
    dot.textContent = on ? 'VERBUNDEN' : 'WARTE AUF VERBINDUNG';
  }
}
