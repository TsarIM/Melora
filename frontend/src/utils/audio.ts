const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

export const playNote = (key: string) => {
  const oscillator = audioCtx.createOscillator();
  const gainNode = audioCtx.createGain();

  const noteMap: Record<string, number> = {
    z: 261.63, // C4
    x: 293.66, // D4
    c: 329.63, // E4
    v: 349.23, // F4
    b: 392.00, // G4
    n: 440.00, // A4
    m: 493.88, // B4
    s: 277.18, // C#4
    d: 311.13, // D#4
    g: 369.99, // F#4
    h: 415.30, // G#4
    j: 466.16  // A#4
  };

  const duration = 1.2; // seconds
  const now = audioCtx.currentTime;

  oscillator.frequency.value = noteMap[key] || 440;
  oscillator.type = 'sine';

  oscillator.connect(gainNode);
  gainNode.connect(audioCtx.destination);

  // Fade out
  gainNode.gain.setValueAtTime(1, now);
  gainNode.gain.exponentialRampToValueAtTime(0.001, now + duration);

  oscillator.start(now);
  oscillator.stop(now + duration);
};
