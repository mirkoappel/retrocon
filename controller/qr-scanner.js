// QR-Scanner für den Controller
// Live-Videofeed, Erkennung wird per SCAN-Button ausgelöst (wie Kamera-Auslöser).
// Nativer BarcodeDetector mit jsQR-Fallback.
//
// API:
//   QRScanner.show()   Kamera starten + Overlay zeigen
//   QRScanner.hide()   Overlay schließen + Kamera freigeben

(function () {
  let stream = null;
  let overlay, video, canvas, ctx, scanBtn, hint;
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
      <div id="rc-scan-hint">QR-CODE ANVISIEREN — DANN SCAN DRÜCKEN</div>
      <button id="rc-scan-btn" aria-label="Scannen">
        <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
      </button>
      <button id="rc-scan-close">SCHLIESSEN</button>
    `;
    document.body.appendChild(overlay);

    const style = document.createElement('style');
    style.textContent = `
      #rc-scan-overlay { display: none; position: fixed; inset: 0; z-index: 200; background: #000; }
      #rc-scan-overlay.active { display: block; }
      #rc-scan-video { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
      #rc-scan-hint {
        position: absolute; top: 20px; left: 50%; transform: translateX(-50%); z-index: 3;
        font-family: 'Courier New', monospace;
        font-size: 0.7rem; letter-spacing: 0.1rem;
        color: rgba(255,255,255,0.75);
        background: rgba(0,0,0,0.5); padding: 6px 14px; border-radius: 20px;
        white-space: nowrap;
      }
      #rc-scan-btn {
        position: absolute; bottom: 24px; right: 24px; z-index: 3;
        width: 72px; height: 72px; border-radius: 50%;
        background: #e53935; border: 3px solid rgba(255,255,255,0.5);
        box-shadow: 0 0 0 2px rgba(0,0,0,0.6), 0 4px 12px rgba(0,0,0,0.4);
        display: flex; align-items: center; justify-content: center;
        cursor: pointer; touch-action: none; padding: 0;
      }
      #rc-scan-btn:active { transform: scale(0.94); }
      #rc-scan-btn.busy { background: #7a1e1b; }
      #rc-scan-close {
        position: absolute; top: 16px; right: 16px; z-index: 3;
        background: rgba(0,0,0,0.6); border: 1px solid #333; color: #aaa;
        font-family: 'Courier New', monospace;
        font-size: 0.6rem; letter-spacing: 0.1rem;
        padding: 6px 14px; border-radius: 20px;
        cursor: pointer; touch-action: none;
      }
      #rc-scan-canvas { display: none; }
    `;
    document.head.appendChild(style);

    video   = document.getElementById('rc-scan-video');
    canvas  = document.getElementById('rc-scan-canvas');
    ctx     = canvas.getContext('2d', { willReadFrequently: true });
    scanBtn = document.getElementById('rc-scan-btn');
    hint    = document.getElementById('rc-scan-hint');

    document.getElementById('rc-scan-close').addEventListener('pointerdown', e => {
      e.preventDefault(); hide();
    });
    scanBtn.addEventListener('pointerdown', e => {
      e.preventDefault(); runScan();
    });
  }

  function show() {
    ensureDom();
    navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      audio: false
    })
      .then(s => { stream = s; video.srcObject = s; return video.play(); })
      .then(() => {
        overlay.classList.add('active');
        hint.textContent = 'QR-CODE ANVISIEREN — DANN SCAN DRÜCKEN';
      })
      .catch(err => alert('Kamera nicht verfügbar: ' + err.message));
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.remove('active');
    stream?.getTracks().forEach(t => t.stop());
    stream = null;
    scanBtn?.classList.remove('busy');
  }

  function isValid(v) {
    try {
      const url = new URL(v);
      return url.searchParams.has('code') || url.searchParams.has('peer');
    } catch { return false; }
  }

  function centroid(points) {
    let cx = 0, cy = 0;
    for (const p of points) { cx += p.x; cy += p.y; }
    return { x: cx / points.length, y: cy / points.length };
  }

  function pickClosestToCenter(candidates, frameW, frameH) {
    const fx = frameW / 2, fy = frameH / 2;
    let best = null, bestDist = Infinity;
    for (const c of candidates) {
      if (!isValid(c.value)) continue;
      const d = Math.hypot(c.center.x - fx, c.center.y - fy);
      if (d < bestDist) { bestDist = d; best = c.value; }
    }
    return best;
  }

  async function detectOnce() {
    if (video.readyState !== 4) return null;
    const vw = video.videoWidth, vh = video.videoHeight;
    if (detector) {
      try {
        const codes = await detector.detect(video);
        const cands = codes.map(c => ({
          value: c.rawValue,
          center: centroid(c.cornerPoints)
        }));
        return pickClosestToCenter(cands, vw, vh);
      } catch {}
    }
    canvas.width  = vw;
    canvas.height = vh;
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, vw, vh);
    const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    if (!qr?.data) return null;
    const L = qr.location;
    const center = centroid([L.topLeftCorner, L.topRightCorner, L.bottomLeftCorner, L.bottomRightCorner]);
    return pickClosestToCenter([{ value: qr.data, center }], vw, vh);
  }

  async function runScan() {
    if (!stream || scanBtn.classList.contains('busy')) return;
    scanBtn.classList.add('busy');
    hint.textContent = 'SCANNE...';
    const hit = await detectOnce();
    if (hit) { hide(); location.href = hit; return; }
    scanBtn.classList.remove('busy');
    hint.textContent = 'NICHT ERKANNT — NÄHER RAN UND NOCHMAL';
  }

  window.QRScanner = { show, hide };
})();
