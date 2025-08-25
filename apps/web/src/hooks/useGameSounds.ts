import { useRef, useCallback } from 'react';

interface GameSounds {
  playWin: () => void;
  playLose: () => void;
  playTick: () => void;
  setEnabled: (enabled: boolean) => void;
}

export const useGameSounds = (): GameSounds => {
  const audioContext = useRef<AudioContext | null>(null);
  const soundEnabled = useRef(true);

  const initAudioContext = useCallback(() => {
    if (!audioContext.current) {
      audioContext.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContext.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, type: OscillatorType = 'sine') => {
    if (!soundEnabled.current) return;

    const ctx = initAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
    oscillator.type = type;

    // Softer volume for tick sounds
    const volume = type === 'sine' && frequency > 800 ? 0.15 : 0.3;
    gainNode.gain.setValueAtTime(volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }, [initAudioContext]);

  const playWin = useCallback(() => {
    // Major arpeggio (C-E-G-C)
    const notes = [261.63, 329.63, 392.00, 523.25];
    notes.forEach((freq, index) => {
      setTimeout(() => playTone(freq, 0.2), index * 100);
    });
  }, [playTone]);

  const playLose = useCallback(() => {
    // Descending minor notes
    const notes = [392.00, 349.23, 293.66, 261.63];
    notes.forEach((freq, index) => {
      setTimeout(() => playTone(freq, 0.3, 'sawtooth'), index * 150);
    });
  }, [playTone]);

  const playTick = useCallback(() => {
    // Modern UI notification sound - quick digital blip
    const ctx = initAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const filterNode = ctx.createBiquadFilter();

    oscillator.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Quick frequency sweep from high to low
    oscillator.frequency.setValueAtTime(1200, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.05);
    oscillator.type = 'square';

    // Low-pass filter for smoother sound
    filterNode.type = 'lowpass';
    filterNode.frequency.setValueAtTime(2000, ctx.currentTime);
    filterNode.frequency.exponentialRampToValueAtTime(1000, ctx.currentTime + 0.05);

    // Quick envelope
    gainNode.gain.setValueAtTime(0.2, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.08);
  }, [playTone, initAudioContext]);

  const setEnabled = useCallback((enabled: boolean) => {
    soundEnabled.current = enabled;
  }, []);

  return {
    playWin,
    playLose,
    playTick,
    setEnabled,
  };
};
