import { useState, useEffect, useRef, useCallback } from 'react';

export type SleepTimerMode = '15' | '30' | '45' | '60' | 'end_of_track' | null;

interface UseSleepTimerProps {
  isPlaying: boolean;
  onTimerExpired: () => void;
  currentVolume: number;
  onVolumeChange: (vol: number) => void;
}

export function useSleepTimer({
  isPlaying,
  onTimerExpired,
  currentVolume,
  onVolumeChange,
}: UseSleepTimerProps) {
  const [activeMode, setActiveMode] = useState<SleepTimerMode>(null);
  const [secondsLeft, setSecondsLeft] = useState<number>(0);
  const originalVolumeRef = useRef<number>(currentVolume);
  const isFadingRef = useRef<boolean>(false);

  // Keep track of original user volume
  useEffect(() => {
    if (!isFadingRef.current) {
      originalVolumeRef.current = currentVolume;
    }
  }, [currentVolume]);

  const startTimer = useCallback((mode: SleepTimerMode) => {
    if (!mode) {
      setActiveMode(null);
      setSecondsLeft(0);
      return;
    }

    setActiveMode(mode);
    if (mode === 'end_of_track') {
      setSecondsLeft(0);
    } else {
      const minutes = parseInt(mode, 10);
      setSecondsLeft(minutes * 60);
    }
  }, []);

  const cancelTimer = useCallback(() => {
    setActiveMode(null);
    setSecondsLeft(0);
    if (isFadingRef.current) {
      onVolumeChange(originalVolumeRef.current);
      isFadingRef.current = false;
    }
  }, [onVolumeChange]);

  // Countdown effect
  useEffect(() => {
    if (!activeMode || activeMode === 'end_of_track' || !isPlaying) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          // Trigger expiration
          onTimerExpired();
          setActiveMode(null);
          if (isFadingRef.current) {
            onVolumeChange(originalVolumeRef.current);
            isFadingRef.current = false;
          }
          return 0;
        }

        // Soft fade-out during last 10 seconds
        if (prev <= 10) {
          isFadingRef.current = true;
          const ratio = (prev - 1) / 10;
          onVolumeChange(originalVolumeRef.current * ratio);
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeMode, isPlaying, onTimerExpired, onVolumeChange]);

  // Handler for track ended (called by audio engine)
  const handleTrackEnded = useCallback(() => {
    if (activeMode === 'end_of_track') {
      onTimerExpired();
      setActiveMode(null);
    }
  }, [activeMode, onTimerExpired]);

  const formatCountdown = useCallback((): string => {
    if (!activeMode) return '';
    if (activeMode === 'end_of_track') return 'Lagu Ini';
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }, [activeMode, secondsLeft]);

  return {
    isActive: activeMode !== null,
    activeMode,
    secondsLeft,
    startTimer,
    cancelTimer,
    handleTrackEnded,
    formatCountdown,
  };
}
