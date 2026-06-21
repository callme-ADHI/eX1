let audioCtx: AudioContext | null = null;
let lastPlayTime = 0;
const MIN_TICK_GAP = 0.045; // 45ms minimum gap in seconds

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioCtx;
}

/**
 * Plays a high-fidelity synthesized mechanical tick sound.
 * Uses a scheduling algorithm to pace the ticks rhythmically when sliding
 * across items quickly, mimicking a physical rotary notch selector.
 */
export function playTactileTick() {
  try {
    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const now = ctx.currentTime;
    
    // Pace-limiting algorithm: if triggers are too close, queue them up
    // at perfect MIN_TICK_GAP intervals.
    let playTime = now;
    if (now - lastPlayTime < MIN_TICK_GAP) {
      playTime = lastPlayTime + MIN_TICK_GAP;
      // Discard ticks that queue up too far in the future to keep audio tight with interaction
      if (playTime - now > 0.15) {
        return;
      }
    }
    
    lastPlayTime = playTime;
    
    // 1. Setup gain envelope for clean decay
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(0.18, playTime); // Subtle premium volume
    mainGain.connect(ctx.destination);
    
    // 2. High-speed frequency sweep oscillator
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(3800, playTime);
    osc.frequency.exponentialRampToValueAtTime(1000, playTime + 0.007);
    
    // 3. Bandpass filter for a woody, physical casing timbre
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1800, playTime);
    filter.Q.setValueAtTime(3.5, playTime);
    
    // 4. Tight exponential gain decay
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.85, playTime);
    gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.009);
    
    // Connections
    osc.connect(filter);
    filter.connect(gain);
    gain.connect(mainGain);
    
    // Playback scheduling
    osc.start(playTime);
    osc.stop(playTime + 0.015);
  } catch (err) {
    console.warn('Tactile tick audio failed to play:', err);
  }
}
