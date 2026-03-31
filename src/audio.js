// ============================================
// SOUND ENGINE — Web Audio API
// ============================================

let audioCtx = null;
let masterGain = null;

export function initAudio() {
  if (audioCtx) return audioCtx;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  masterGain = audioCtx.createGain();
  masterGain.gain.value = 0.3;
  masterGain.connect(audioCtx.destination);
  return audioCtx;
}

export function getAudioContext() {
  return audioCtx;
}

export function setMuted(muted) {
  if (masterGain) {
    masterGain.gain.value = muted ? 0 : 0.3;
  }
}

function ensureCtx() {
  if (!audioCtx) initAudio();
  return { ctx: audioCtx, out: masterGain };
}

// Helper: create an oscillator that auto-disconnects
function osc(ctx, type, freq, startTime, endTime, dest) {
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = 0.5;
  g.gain.setValueAtTime(0.5, startTime);
  g.gain.exponentialRampToValueAtTime(0.001, endTime);
  o.connect(g);
  g.connect(dest);
  o.start(startTime);
  o.stop(endTime + 0.05);
}

// 1. Laser "pew pew" — sine sweep 800Hz→200Hz, 100ms
export function playLaserSound() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sine';
  o.frequency.setValueAtTime(800, t);
  o.frequency.exponentialRampToValueAtTime(200, t + 0.1);
  g.gain.setValueAtTime(0.4, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + 0.15);
}

// 2. Explosion — white noise burst with bandpass filter
export function playExplosion() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  const duration = 0.25;
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  const bandpass = ctx.createBiquadFilter();
  bandpass.type = 'bandpass';
  bandpass.frequency.setValueAtTime(1000, t);
  bandpass.frequency.exponentialRampToValueAtTime(100, t + duration);
  bandpass.Q.value = 1;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.6, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + duration);
  noise.connect(bandpass);
  bandpass.connect(g);
  g.connect(out);
  noise.start(t);
  noise.stop(t + duration + 0.05);
}

// 3. Power-up — ascending arpeggio C5-E5-G5-C6
export function playPowerUp() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
  notes.forEach((freq, i) => {
    osc(ctx, 'sine', freq, t + i * 0.06, t + i * 0.06 + 0.12, out);
  });
}

// 4. Error — low square wave 150Hz, 200ms
export function playError() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  osc(ctx, 'square', 150, t, t + 0.2, out);
}

// 5. Click — 1000Hz tick, 30ms
export function playClick() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  osc(ctx, 'sine', 1000, t, t + 0.03, out);
}

// 6. Countdown beep — 600Hz, 100ms
export function playCountdown() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  osc(ctx, 'sine', 600, t, t + 0.1, out);
}

// 7. Victory — major chord C4+E4+G4+C5 sustained 500ms
export function playVictory() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  [261.63, 329.63, 392.0, 523.25].forEach((freq) => {
    osc(ctx, 'sine', freq, t, t + 0.5, out);
  });
}

// 8. Simon note — 4 distinct tones (C4, E4, G4, B4), 300ms
const SIMON_FREQS = [261.63, 329.63, 392.0, 493.88];
export function playSimonNote(index) {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  osc(ctx, 'sine', SIMON_FREQS[index], t, t + 0.3, out);
}

// 9. Unlock — dramatic ascending sweep + final chord
export function playUnlock() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  // Sweep
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = 'sawtooth';
  o.frequency.setValueAtTime(200, t);
  o.frequency.exponentialRampToValueAtTime(2000, t + 0.8);
  g.gain.setValueAtTime(0.3, t);
  g.gain.setValueAtTime(0.3, t + 0.75);
  g.gain.exponentialRampToValueAtTime(0.001, t + 1.0);
  o.connect(g);
  g.connect(out);
  o.start(t);
  o.stop(t + 1.05);
  // Final chord at 0.85s
  [261.63, 329.63, 392.0, 523.25].forEach((freq) => {
    osc(ctx, 'sine', freq, t + 0.85, t + 1.6, out);
  });
}

// 10. Countdown GO beep — higher pitch
export function playCountdownGo() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  osc(ctx, 'sine', 900, t, t + 0.2, out);
}

// Miss sound — quick low buzz
export function playMiss() {
  const { ctx, out } = ensureCtx();
  const t = ctx.currentTime;
  osc(ctx, 'sawtooth', 120, t, t + 0.1, out);
}
