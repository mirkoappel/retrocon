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
      <button id="rc-scan-btn">SCAN</button>
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
        position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%); z-index: 3;
        width: 84px; height: 84px; border-radius: 50%;
        background: #fff; border: 4px solid rgba(255,255,255,0.4);
        box-shadow: 0 0 0 3px #000;
        font-family: 'Courier New', monospace;
        font-size: 0.75rem; letter-spacing: 0.1rem; font-weight: bold;
        color: #000; cursor: pointer; touch-action: none;
      }
      #rc-scan-btn:active { transform: translateX(-50%) scale(0.94); }
      #rc-scan-btn.busy { background: #888; color: #222; }
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

  function pickValid(values) {
    for (const v of values) {
      try {
        const url = new URL(v);
        if (url.searchParams.has('code') || url.searchParams.has('peer')) return v;
      } catch {}
    }
    return null;
  }

  async function detectOnce() {
    if (video.readyState !== 4) return null;
    if (detector) {
      try {
        const codes = await detector.detect(video);
        return pickValid(codes.map(c => c.rawValue));
      } catch {}
    }
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const qr = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
    return qr?.data ? pickValid([qr.data]) : null;
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
