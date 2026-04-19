// QR-Scanner für den Controller
// Kontinuierliche Erkennung mit nativem BarcodeDetector (Fallback: jsQR).
// Jeder erkannte QR-Code bekommt einen Rahmen, der sich mitbewegt und
// antippbar ist — so wählt man direkt Spieler 1 oder Spieler 2.
//
// API:
//   QRScanner.show()   Kamera starten + Overlay zeigen
//   QRScanner.hide()   Overlay schließen + Kamera freigeben

(function () {
  let stream = null, raf = null;
  let overlay, video, canvas, ctx, framesLayer;
  let detector = null;

  if ('BarcodeDetector' in window) {
    try { detector = new window.BarcodeDetector({ formats: ['qr_code'] }); }
    catch { detector = null; }
  }

  function ensureDom() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.id = 'rc-scan-overlay';
    overlay.innerHTML = `
      <video id="rc-scan-video" playsinline muted></video>
      <canvas id="rc-scan-canvas"></canvas>
      <div id="rc-scan-frames"></div>
      <div id="rc-scan-hint">QR-CODE ANTIPPEN UM ALS SPIELER ZU VERBINDEN</div>
      <button id="rc-scan-close">ABBRECHEN</button>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
      #rc-scan-overlay { display: none; position: fixed; inset: 0; z-index: 200; background: #000; }
      #rc-scan-overlay.active { display: block; }
      #rc-scan-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #rc-scan-frames { position: absolute; inset: 0; pointer-events: none; }
      .rc-qr-frame {
        position: absolute;
        border: 3px solid #4fc3f7;
        border-radius: 10px;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.5), 0 0 20px rgba(79,195,247,0.6);
        background: rgba(79,195,247,0.08);
        pointer-events: auto;
        cursor: pointer;
        touch-action: none;
        transition: border-color 0.1s, background 0.1s;
      }
      .rc-qr-frame:active { background: rgba(79,195,247,0.25); }
      .rc-qr-frame .rc-qr-label {
        position: absolute; left: 50%; top: -28px; transform: translateX(-50%);
        font-family: 'Courier New', monospace;
        font-size: 0.75rem; letter-spacing: 0.1rem; color: #4fc3f7;
        background: rgba(0,0,0,0.7); padding: 3px 10px; border-radius: 12px;
        white-space: nowrap;
      }
      #rc-scan-hint {
        position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 3;
        font-family: 'Courier New', monospace;
        font-size: 0.7rem; letter-spacing: 0.1rem;
        color: rgba(255,255,255,0.8);
        background: rgba(0,0,0,0.55); padding: 8px 16px; border-radius: 20px;
        max-width: 90vw; text-align: center;
      }
      #rc-scan-close {
        position: absolute; bottom: 24px; left: 50%; transform: translateX(-50%); z-index: 3;
        background: #e53935; border: 3px solid rgba(255,255,255,0.5); color: #fff;
        font-family: 'Courier New', monospace; font-weight: bold;
        font-size: 0.85rem; letter-spacing: 0.15rem;
        padding: 14px 32px; border-radius: 30px;
        box-shadow: 0 0 0 2px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4);
        cursor: pointer; touch-action: none;
      }
      #rc-scan-close:active { transform: translateX(-50%) scale(0.96); }
      #rc-scan-canvas { display: none; }
    `;
    document.head.appendChild(style);

    video        = document.getElementById('rc-scan-video');
    canvas       = document.getElementById('rc-scan-canvas');
    ctx          = canvas.getContext('2d', { willReadFrequently: true });
    framesLayer  = document.getElementById('rc-scan-frames');

    document.getElementById('rc-scan-close').addEventListener('pointerdown', e => {
      e.preventDefault(); hide();
    });
  }

  function show() {
    ensureDom();
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })
      .then(s => { stream = s; video.srcObject = s; return video.play(); })
      .then(() => { overlay.classList.add('active'); loop(); })
      .catch(err => alert('Kamera nicht verfügbar: ' + err.message));
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.remove('active');
    cancelAnimationFrame(raf);
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    framesLayer.innerHTML = '';
  }

  function parseRoom(data) {
    try {
      const url = new URL(data);
      if (!url.searchParams.has('code') && !url.searchParams.has('peer')) return null;
      const player = url.searchParams.get('player');
      return { url: data, player };
    } catch { return null; }
  }

  function videoToScreen(vw, vh) {
    const sw = window.innerWidth, sh = window.innerHeight;
    const scale = Math.max(sw / vw, sh / vh);
    const offX = (sw - vw * scale) / 2;
    const offY = (sh - vh * scale) / 2;
    return { scale, offX, offY };
  }

  function drawFrames(codes, vw, vh) {
    const { scale, offX, offY } = videoToScreen(vw, vh);
    const seen = new Set();
    for (const c of codes) {
      const info = parseRoom(c.value);
      if (!info) continue;
      const xs = c.corners.map(p => p.x);
      const ys = c.corners.map(p => p.y);
      const x0 = Math.min(...xs), y0 = Math.min(...ys);
      const x1 = Math.max(...xs), y1 = Math.max(...ys);
      const sx = offX + x0 * scale;
      const sy = offY + y0 * scale;
      const sW = (x1 - x0) * scale;
      const sH = (y1 - y0) * scale;
      const id = 'f-' + info.url;
      seen.add(id);
      let el = framesLayer.querySelector(`[data-id="${CSS.escape(id)}"]`);
      if (!el) {
        el = document.createElement('div');
        el.className = 'rc-qr-frame';
        el.dataset.id = id;
        const label = document.createElement('div');
        label.className = 'rc-qr-label';
        label.textContent = info.player ? `SPIELER ${info.player}` : 'VERBINDEN';
        el.appendChild(label);
        el.addEventListener('pointerdown', e => {
          e.preventDefault();
          hide();
          location.href = info.url;
        });
        framesLayer.appendChild(el);
      }
      el.style.left   = sx + 'px';
      el.style.top    = sy + 'px';
      el.style.width  = sW + 'px';
      el.style.height = sH + 'px';
    }
    // Remove stale frames
    framesLayer.querySelectorAll('.rc-qr-frame').forEach(el => {
      if (!seen.has(el.dataset.id)) el.remove();
    });
  }

  async function detect() {
    if (video.readyState !== 4) return [];
    if (detector) {
      try {
        const codes = await detector.detect(video);
        return codes.map(c => ({ value: c.rawValue, corners: c.cornerPoints }));
      } catch { return []; }
    }
    const vw = video.videoWidth, vh = video.videoHeight;
    canvas.width = vw; canvas.height = vh;
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, vw, vh);
    const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (!qr?.data) return [];
    const L = qr.location;
    return [{
      value: qr.data,
      corners: [L.topLeftCorner, L.topRightCorner, L.bottomRightCorner, L.bottomLeftCorner]
    }];
  }

  async function loop() {
    if (!stream) return;
    const codes = await detect();
    if (video.videoWidth && video.videoHeight) {
      drawFrames(codes, video.videoWidth, video.videoHeight);
    }
    raf = requestAnimationFrame(loop);
  }

  window.QRScanner = { show, hide };
})();
