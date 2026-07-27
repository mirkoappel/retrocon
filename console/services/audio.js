// Globaler AudioContext. Muss innerhalb einer User-Gesture erstellt werden,
// damit Browser das Playback nicht blockieren. Spiele bekommen ihn via api.audioCtx
// und vermeiden so, selbst einen stummen Context zu erzeugen.
//
// Für die Lautstärkeregelung hängt ein Master-Gain vor dem Ausgang. Die Spiele
// verbinden ihre Klänge auf `audioCtx.destination` — sie bekommen deshalb nicht
// den Context selbst, sondern eine Hülle, deren `destination` der Master-Gain
// ist. So bleibt jedes Spiel unverändert und der Regler wirkt trotzdem überall.

let ctx = null;
let master = null;
let huelle = null;

function baueHuelle() {
  return new Proxy(ctx, {
    get(ziel, name) {
      if (name === 'destination') return master;
      const v = Reflect.get(ziel, name);
      return typeof v === 'function' ? v.bind(ziel) : v;
    }
  });
}

export function createAudioContext() {
  if (ctx) return huelle;
  try {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createGain();
    master.gain.value = 1;
    master.connect(ctx.destination);
    huelle = baueHuelle();
  } catch {}
  return huelle;
}

export function getAudioContext() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return huelle;
}

// 0–100 aus dem Menü. Quadratisch, weil sich linear geregelte Lautstärke
// in der oberen Hälfte kaum noch ändert.
export function setMasterVolume(prozent) {
  if (!master) return;
  const v = Math.max(0, Math.min(100, prozent)) / 100;
  master.gain.value = v * v;
}
