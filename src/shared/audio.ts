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
    
    // 1. Setup main gain at 100% maximum volume
    const mainGain = ctx.createGain();
    mainGain.gain.setValueAtTime(1.0, playTime); 
    mainGain.connect(ctx.destination);
    
    // 2. High-speed frequency sweep oscillator using a punchy triangle wave
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(2000, playTime);
    osc.frequency.exponentialRampToValueAtTime(150, playTime + 0.012);
    
    // 3. Tight exponential gain decay for a clean, sharp tactile click
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(1.0, playTime); 
    gain.gain.exponentialRampToValueAtTime(0.001, playTime + 0.014);
    
    // Direct connections to avoid filter attenuation
    osc.connect(gain);
    gain.connect(mainGain);
    
    // Playback scheduling
    osc.start(playTime);
    osc.stop(playTime + 0.02);
  } catch (err) {
    console.warn('Tactile tick audio failed to play:', err);
  }
}
