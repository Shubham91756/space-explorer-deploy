import { useRef, useCallback } from 'react';

export const useGameAudio = () => {
  const audioContextRef = useRef(null);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a single frequency tone
  const playTone = useCallback((frequency, duration = 100, type = 'sine', volume = 0.3) => {
    try {
      const audioContext = getAudioContext();
      const now = audioContext.currentTime;
      
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(audioContext.destination);
      
      osc.frequency.value = frequency;
      osc.type = type;
      
      const durationInSeconds = duration / 1000;
      
      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + durationInSeconds);
      
      osc.start(now);
      osc.stop(now + durationInSeconds);
    } catch (err) {
      console.log('Tone playback error:', err);
    }
  }, [getAudioContext]);

  // Play multiple sequential frequencies (for melodies)
  const playSequence = useCallback((frequencies, durationPerNote = 150, type = 'sine', volume = 0.3) => {
    try {
      const audioContext = getAudioContext();
      let startTime = audioContext.currentTime;
      
      frequencies.forEach((freq) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(audioContext.destination);
        
        osc.frequency.value = freq;
        osc.type = type;
        
        const durationInSeconds = durationPerNote / 1000;
        
        gain.gain.setValueAtTime(volume, startTime);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + durationInSeconds);
        
        osc.start(startTime);
        osc.stop(startTime + durationInSeconds);
        
        startTime += durationInSeconds;
      });
    } catch (err) {
      console.log('Sequence playback error:', err);
    }
  }, [getAudioContext]);

  // Success sound - ascending tones
  const playSuccessSound = useCallback(() => {
    playSequence([523.25, 659.25, 783.99], 150, 'sine', 0.3); // C5, E5, G5
  }, [playSequence]);

  // Fail sound - descending buzzer
  const playFailSound = useCallback(() => {
    playSequence([400, 300, 200], 150, 'square', 0.25);
  }, [playSequence]);

  // Card select sound - high beep
  const playSelectSound = useCallback(() => {
    playTone(800, 100, 'sine', 0.3);
  }, [playTone]);

  // Card swap sound
  const playSwapSound = useCallback(() => {
    playSequence([600, 700], 100, 'sine', 0.3);
  }, [playSequence]);

  // Cleanup
  const cleanup = useCallback(() => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
  }, []);

  return {
    playTone,
    playSequence,
    playSuccessSound,
    playFailSound,
    playSelectSound,
    playSwapSound,
    cleanup,
  };
};

export default useGameAudio;
