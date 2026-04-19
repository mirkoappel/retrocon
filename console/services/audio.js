// Globaler AudioContext. Muss innerhalb einer User-Gesture erstellt werden,
// damit Browser das Playback nicht blockieren. Spiele bekommen ihn via api.audioCtx
// und vermeiden so, selbst einen stummen Context zu erzeugen.

let ctx = null;

export function createAudioContext() {
  if (ctx) return ctx;
  try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch {}
  return ctx;
}

export function getAudioContext() {
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}
