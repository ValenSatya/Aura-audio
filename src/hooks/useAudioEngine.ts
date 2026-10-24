import { useRef, useState, useEffect, useCallback } from 'react';
import { EQBandConfig, EQPreset, CrossfadeSettings } from '../types/music';

export const DEFAULT_BANDS: EQBandConfig[] = [
  { frequency: 60, gain: 0, type: 'lowshelf', label: '60Hz', description: 'Sub-bass' },
  { frequency: 170, gain: 0, type: 'peaking', label: '170Hz', description: 'Bass' },
  { frequency: 310, gain: 0, type: 'peaking', label: '310Hz', description: 'Low-mid' },
  { frequency: 600, gain: 0, type: 'peaking', label: '600Hz', description: 'Mid' },
  { frequency: 1000, gain: 0, type: 'peaking', label: '1kHz', description: 'Mid-high' },
  { frequency: 3000, gain: 0, type: 'peaking', label: '3kHz', description: 'Presence' },
  { frequency: 6000, gain: 0, type: 'peaking', label: '6000Hz', description: 'Brilliance' },
  { frequency: 14000, gain: 0, type: 'highshelf', label: '14kHz', description: 'Air / Treble' },
];

export const EQ_PRESETS: EQPreset[] = [
  { id: 'flat', name: 'Flat (Default)', gains: [0, 0, 0, 0, 0, 0, 0, 0] },
  { id: 'bass_boost', name: 'Bass Boost', gains: [7, 6, 4, 1, 0, 0, 0, 0] },
  { id: 'rock', name: 'Rock', gains: [5, 3, -1, -2, 1, 3, 5, 6] },
  { id: 'pop', name: 'Pop', gains: [-1, 2, 4, 5, 3, 0, -1, -2] },
  { id: 'vocal', name: 'Vocal Clarity', gains: [-3, -1, 1, 4, 5, 4, 2, 0] },
  { id: 'jazz', name: 'Jazz & Acoustic', gains: [3, 2, 1, 2, -1, -1, 2, 3] },
  { id: 'electronic', name: 'Electronic / EDM', gains: [6, 5, 1, 0, -2, 2, 4, 5] },
  { id: 'classical', name: 'Classical', gains: [4, 3, 2, 1, -1, 2, 3, 4] },
];

export const DEFAULT_CROSSFADE_SETTINGS: CrossfadeSettings = {
  enabled: true,
  duration: 4,
};

const CROSSFADE_STORAGE_KEY = 'aura_crossfade_settings';

function loadSavedCrossfade(): CrossfadeSettings {
  try {
    const raw = localStorage.getItem(CROSSFADE_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        enabled: typeof parsed.enabled === 'boolean' ? parsed.enabled : true,
        duration: typeof parsed.duration === 'number' ? Math.max(0, Math.min(12, parsed.duration)) : 4,
      };
    }
  } catch {}
  return DEFAULT_CROSSFADE_SETTINGS;
}

export function useAudioEngine(options?: {
  onTrackEnded?: () => void;
  onPlaybackProgress?: (currentTime: number, duration: number) => void;
  onPlaybackError?: (errorMessage: string) => void;
}) {
  const onTrackEnded = options?.onTrackEnded;
  const onPlaybackProgress = options?.onPlaybackProgress;
  const onPlaybackError = options?.onPlaybackError;

  const onTrackEndedRef = useRef(onTrackEnded);
  const onPlaybackProgressRef = useRef(onPlaybackProgress);
  const onPlaybackErrorRef = useRef(onPlaybackError);
  useEffect(() => {
    onTrackEndedRef.current = onTrackEnded;
    onPlaybackProgressRef.current = onPlaybackProgress;
    onPlaybackErrorRef.current = onPlaybackError;
  });

  // Track completion watchdog ref to prevent duplicate ended events or missing stream ends
  const hasTriggeredEndedRef = useRef<boolean>(false);


  // Dual-Deck HTMLAudioElement refs
  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);

  // Active Deck: 'A' or 'B'
  const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A');
  const activeDeckRef = useRef<'A' | 'B'>('A');
  useEffect(() => {
    activeDeckRef.current = activeDeck;
  }, [activeDeck]);

  // Web Audio graph refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeARef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceNodeBRef = useRef<MediaElementAudioSourceNode | null>(null);
  const deckGainARef = useRef<GainNode | null>(null);
  const deckGainBRef = useRef<GainNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  // Crossfade timer cleanup ref
  const crossfadeCleanupTimerRef = useRef<number | null>(null);
  const isCrossfadingRef = useRef<boolean>(false);

  // Playback state
  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const [isBuffering, setIsBuffering] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [bufferedTime, setBufferedTime] = useState(0);
  const [volume, setVolumeState] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [bands, setBands] = useState<EQBandConfig[]>(DEFAULT_BANDS);
  const [currentPreset, setCurrentPreset] = useState<string>('flat');
  const [isAudioReady, setIsAudioReady] = useState(false);

  // Crossfade settings state with persistent localStorage
  const [crossfadeSettings, setCrossfadeSettingsState] = useState<CrossfadeSettings>(loadSavedCrossfade);

  const updateCrossfadeSettings = useCallback((updates: Partial<CrossfadeSettings>) => {
    setCrossfadeSettingsState((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem(CROSSFADE_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Initialize Web Audio graph
  const initAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;

      // Create Filters if not created
      if (filtersRef.current.length === 0) {
        filtersRef.current = bands.map((band) => {
          const filter = ctx.createBiquadFilter();
          filter.type = band.type;
          filter.frequency.value = band.frequency;
          filter.gain.value = band.gain;
          filter.Q.value = 1.4;
          return filter;
        });
      }

      // Create AnalyserNode if not created
      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
      }

      // Create Master GainNode if not created
      if (!masterGainRef.current) {
        const masterGain = ctx.createGain();
        masterGain.gain.value = isMuted ? 0 : volume;
        masterGainRef.current = masterGain;

        // Chain filters -> Analyser -> Master Gain -> Destination
        let lastNode: AudioNode = filtersRef.current[0];
        for (let i = 1; i < filtersRef.current.length; i++) {
          lastNode.connect(filtersRef.current[i]);
          lastNode = filtersRef.current[i];
        }
        lastNode.connect(analyserRef.current);
        analyserRef.current.connect(masterGain);
        masterGain.connect(ctx.destination);
      }

      const firstFilter = filtersRef.current[0];

      // Connect Deck A
      if (audioRefA.current && !sourceNodeARef.current) {
        const sourceA = ctx.createMediaElementSource(audioRefA.current);
        sourceNodeARef.current = sourceA;
        const gainA = ctx.createGain();
        gainA.gain.value = activeDeckRef.current === 'A' ? 1 : 0;
        deckGainARef.current = gainA;
        sourceA.connect(gainA);
        gainA.connect(firstFilter);
      }

      // Connect Deck B
      if (audioRefB.current && !sourceNodeBRef.current) {
        const sourceB = ctx.createMediaElementSource(audioRefB.current);
        sourceNodeBRef.current = sourceB;
        const gainB = ctx.createGain();
        gainB.gain.value = activeDeckRef.current === 'B' ? 1 : 0;
        deckGainBRef.current = gainB;
        sourceB.connect(gainB);
        gainB.connect(firstFilter);
      }

      setIsAudioReady(true);
    } catch (e) {
      console.warn('AudioContext initialization notice:', e);
    }
  }, [bands, isMuted, volume]);

  // Helper to get active & standby audio elements
  const getActiveAudio = useCallback(() => {
    return activeDeckRef.current === 'A' ? audioRefA.current : audioRefB.current;
  }, []);

  const getStandbyAudio = useCallback(() => {
    return activeDeckRef.current === 'A' ? audioRefB.current : audioRefA.current;
  }, []);

  // Play active deck
  const play = useCallback(async () => {
    const activeAudio = getActiveAudio();
    if (!activeAudio) return;

    initAudioContext();
    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch {}
    }

    // Ensure active deck gain is at 1 if not mid-crossfade
    const ctx = audioContextRef.current;
    const activeGain = activeDeckRef.current === 'A' ? deckGainARef.current : deckGainBRef.current;
    if (activeGain && ctx && !isCrossfadingRef.current) {
      activeGain.gain.cancelScheduledValues(ctx.currentTime);
      activeGain.gain.setValueAtTime(1, ctx.currentTime);
    }

    try {
      setPlaybackError(null);
      await activeAudio.play();
      setIsPlaying(true);
      setIsBuffering(false);
    } catch (err: any) {
      console.warn('Playback error:', err);
      if (err.name !== 'AbortError') {
        setPlaybackError(err.message || 'Gagal memulai pemutaran lagu');
      }
      setIsPlaying(false);
      setIsBuffering(false);
    }
  }, [getActiveAudio, initAudioContext]);

  // Pause both decks
  const pause = useCallback(() => {
    if (audioRefA.current) audioRefA.current.pause();
    if (audioRefB.current) audioRefB.current.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  const seek = useCallback((time: number) => {
    const activeAudio = activeDeckRef.current === 'A' ? audioRefA.current : audioRefB.current;
    if (!activeAudio) return;
    try {
      if (isFinite(time)) {
        activeAudio.currentTime = time;
        setCurrentTime(time);
        hasTriggeredEndedRef.current = false;
      }
    } catch (e) {
      console.warn('Seek error:', e);
    }
  }, []);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    setVolumeState(clamped);
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = isMuted ? 0 : clamped;
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (masterGainRef.current) {
        masterGainRef.current.gain.value = next ? 0 : volume;
      }
      return next;
    });
  }, [volume]);

  // Set gain for a specific EQ band
  const setBandGain = useCallback((index: number, gainDb: number) => {
    const clampedGain = Math.max(-12, Math.min(12, gainDb));
    setBands((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], gain: clampedGain };
      return updated;
    });

    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = clampedGain;
    }
    setCurrentPreset('custom');
  }, []);

  // Apply a preset
  const applyPreset = useCallback((presetId: string) => {
    const preset = EQ_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    setBands((prev) =>
      prev.map((band, idx) => {
        const gain = preset.gains[idx] ?? 0;
        if (filtersRef.current[idx]) {
          filtersRef.current[idx].gain.value = gain;
        }
        return { ...band, gain };
      })
    );
    setCurrentPreset(presetId);
  }, []);

  // Reset EQ
  const resetEQ = useCallback(() => {
    applyPreset('flat');
  }, [applyPreset]);

  // Load new audio source directly to active deck (instant playback without crossfade)
  const loadSource = useCallback((src: string) => {
    const activeAudio = getActiveAudio();
    const standbyAudio = getStandbyAudio();

    if (standbyAudio) {
      standbyAudio.pause();
      standbyAudio.currentTime = 0;
    }

    if (!activeAudio) return;
    hasTriggeredEndedRef.current = false;
    setPlaybackError(null);
    setIsBuffering(true);
    setCurrentTime(0);
    setBufferedTime(0);

    const activeGain = activeDeckRef.current === 'A' ? deckGainARef.current : deckGainBRef.current;
    const standbyGain = activeDeckRef.current === 'A' ? deckGainBRef.current : deckGainARef.current;
    if (audioContextRef.current) {
      const now = audioContextRef.current.currentTime;
      if (activeGain) {
        activeGain.gain.cancelScheduledValues(now);
        activeGain.gain.setValueAtTime(1, now);
      }
      if (standbyGain) {
        standbyGain.gain.cancelScheduledValues(now);
        standbyGain.gain.setValueAtTime(0, now);
      }
    }

    if (activeAudio.src !== src) {
      activeAudio.src = src;
      activeAudio.load();
    }
  }, [getActiveAudio, getStandbyAudio]);

  // Pre-buffer next track in the silent standby deck for instantaneous switching
  const preloadStandbySource = useCallback(
    (src: string) => {
      const standbyAudio = getStandbyAudio();
      if (!standbyAudio || !src) return;
      if (standbyAudio.src !== src) {
        standbyAudio.src = src;
        standbyAudio.preload = 'auto';
        standbyAudio.load();
      }
    },
    [getStandbyAudio]
  );

  // Dual-deck Crossfade to next source
  const crossfadeTo = useCallback(
    async (nextSrc: string, customDuration?: number) => {
      initAudioContext();
      const ctx = audioContextRef.current;
      if (ctx && ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {}
      }

      const currentDeck = activeDeckRef.current;
      const nextDeck = currentDeck === 'A' ? 'B' : 'A';
      const currentAudio = currentDeck === 'A' ? audioRefA.current : audioRefB.current;
      const nextAudio = nextDeck === 'A' ? audioRefA.current : audioRefB.current;
      const currentGain = currentDeck === 'A' ? deckGainARef.current : deckGainBRef.current;
      const nextGain = nextDeck === 'A' ? deckGainARef.current : deckGainBRef.current;

      if (!nextAudio) return;

      const requestedDuration =
        typeof customDuration === 'number'
          ? customDuration
          : crossfadeSettings.enabled
          ? crossfadeSettings.duration
          : 0;

      const fadeDuration = Math.max(0, Math.min(12, requestedDuration));

      // If fade duration is 0 or Web Audio nodes aren't available, perform instant switch
      if (fadeDuration <= 0 || !ctx || !currentGain || !nextGain || !isPlayingRef.current) {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        if (currentGain) currentGain.gain.value = 0;
        if (nextGain) nextGain.gain.value = 1;

        nextAudio.src = nextSrc;
        nextAudio.currentTime = 0;
        activeDeckRef.current = nextDeck;
        setActiveDeck(nextDeck);

        try {
          setPlaybackError(null);
          await nextAudio.play();
          setIsPlaying(true);
        } catch (e: any) {
          console.warn('Direct switch play error:', e);
        }
        return;
      }

      // Prepare next audio element silently
      hasTriggeredEndedRef.current = false;
      isCrossfadingRef.current = true;
      nextAudio.src = nextSrc;
      nextAudio.currentTime = 0;

      // Keep next deck completely silent while buffering
      const preNow = ctx.currentTime;
      nextGain.gain.cancelScheduledValues(preNow);
      nextGain.gain.setValueAtTime(0, preNow);

      // 1. Start next audio and wait until it is actually buffering/playing
      try {
        setPlaybackError(null);
        await nextAudio.play();
      } catch (err: any) {
        console.warn('Next audio play failed in crossfade, current deck continues unaffected:', err);
        isCrossfadingRef.current = false;
        throw err;
      }

      // 2. ONLY start volume ramp once next audio is confirmed playing!
      const startFadeTime = ctx.currentTime;

      // Ramp down current deck from current gain to 0
      currentGain.gain.cancelScheduledValues(startFadeTime);
      currentGain.gain.setValueAtTime(currentGain.gain.value, startFadeTime);
      currentGain.gain.linearRampToValueAtTime(0, startFadeTime + fadeDuration);

      // Ramp up next deck from 0 to 1
      nextGain.gain.cancelScheduledValues(startFadeTime);
      nextGain.gain.setValueAtTime(0, startFadeTime);
      nextGain.gain.linearRampToValueAtTime(1, startFadeTime + fadeDuration);

      // 3. Swap active deck state immediately so UI tracks the new song progress
      activeDeckRef.current = nextDeck;
      setActiveDeck(nextDeck);
      setIsPlaying(true);

      // 5. Cleanup timer for previous deck after crossfade completes
      if (crossfadeCleanupTimerRef.current) {
        clearTimeout(crossfadeCleanupTimerRef.current);
      }
      crossfadeCleanupTimerRef.current = window.setTimeout(() => {
        if (currentAudio) {
          currentAudio.pause();
          currentAudio.currentTime = 0;
        }
        if (currentGain && ctx) {
          currentGain.gain.cancelScheduledValues(ctx.currentTime);
          currentGain.gain.setValueAtTime(0, ctx.currentTime);
        }
        isCrossfadingRef.current = false;
      }, (fadeDuration + 0.1) * 1000);
    },
    [crossfadeSettings, initAudioContext]
  );

  // Bind audio listeners for Deck A and Deck B
  useEffect(() => {
    const audios: { el: HTMLAudioElement | null; deck: 'A' | 'B' }[] = [
      { el: audioRefA.current, deck: 'A' },
      { el: audioRefB.current, deck: 'B' },
    ];

    const cleanups: (() => void)[] = [];

    audios.forEach(({ el, deck }) => {
      if (!el) return;

      let stallTimer: number | null = null;
      const clearStallTimer = () => {
        if (stallTimer !== null) {
          clearTimeout(stallTimer);
          stallTimer = null;
        }
      };

      const handleEnded = () => {
        clearStallTimer();
        // ONLY active deck triggering ended should advance the playlist
        if (activeDeckRef.current === deck && !hasTriggeredEndedRef.current) {
          hasTriggeredEndedRef.current = true;
          setIsPlaying(false);
          setIsBuffering(false);
          if (onTrackEndedRef.current) onTrackEndedRef.current();
        }
      };

      const handleTimeUpdate = () => {
        if (activeDeckRef.current === deck && el.currentTime && isFinite(el.currentTime)) {
          setCurrentTime(el.currentTime);
          if (onPlaybackProgressRef.current && el.duration && isFinite(el.duration)) {
            onPlaybackProgressRef.current(el.currentTime, el.duration);
          }

          // Near-end watchdog: stream EOF often stops slightly before duration without DOM ended event
          if (
            !hasTriggeredEndedRef.current &&
            el.duration &&
            isFinite(el.duration) &&
            el.duration > 3 &&
            el.currentTime >= el.duration - 0.35 &&
            !el.seeking
          ) {
            handleEnded();
          }
        }
      };

      const handleDurationChange = () => {
        if (activeDeckRef.current === deck && el.duration && isFinite(el.duration) && el.duration > 0) {
          setDuration(el.duration);
        }
      };

      const handleProgress = () => {
        if (activeDeckRef.current === deck && el.buffered && el.buffered.length > 0) {
          try {
            const end = el.buffered.end(el.buffered.length - 1);
            if (isFinite(end)) {
              setBufferedTime(end);
            }
          } catch {}
        }
      };

      const handlePlay = () => {
        if (activeDeckRef.current === deck) {
          setIsPlaying(true);
          setPlaybackError(null);
        }
      };

      const handlePause = () => {
        clearStallTimer();
        if (activeDeckRef.current === deck && !isCrossfadingRef.current) {
          setIsPlaying(false);
          setIsBuffering(false);
        }
      };

      const handleWaitingOrStalled = () => {
        if (activeDeckRef.current === deck) {
          setIsBuffering(true);

          // If stream stalls near the end of the track (within 1.8s of duration), trigger completion
          if (
            !hasTriggeredEndedRef.current &&
            el.duration &&
            isFinite(el.duration) &&
            el.duration > 3 &&
            el.duration - el.currentTime <= 1.8
          ) {
            clearStallTimer();
            stallTimer = window.setTimeout(() => {
              if (
                activeDeckRef.current === deck &&
                !hasTriggeredEndedRef.current &&
                el.duration &&
                el.duration - el.currentTime <= 2.0
              ) {
                console.info(`[AudioEngine] Stream stall near EOF (${el.currentTime.toFixed(1)}s / ${el.duration.toFixed(1)}s), triggering track ended`);
                handleEnded();
              }
            }, 1200);
          }
        }
      };

      const handlePlaying = () => {
        clearStallTimer();
        if (activeDeckRef.current === deck) {
          setIsPlaying(true);
          setIsBuffering(false);
          setPlaybackError(null);
        }
      };

      const handleCanPlay = () => {
        if (activeDeckRef.current === deck) {
          setIsBuffering(false);
        }
      };

      const handleSeeking = () => {
        clearStallTimer();
        if (activeDeckRef.current === deck) {
          setIsBuffering(true);
        }
      };

      const handleSeeked = () => {
        if (activeDeckRef.current === deck) {
          setIsBuffering(false);
        }
      };

      const handleError = () => {
        clearStallTimer();
        if (activeDeckRef.current === deck) {
          const err = el.error;
          let msg = 'Format audio tidak didukung atau kendala jaringan';
          if (err) {
            if (err.code === 1) msg = 'Pemutaran dibatalkan';
            else if (err.code === 2) msg = 'Koneksi jaringan terputus saat memuat audio';
            else if (err.code === 3) msg = 'Format audio korup atau gagal didekode';
            else if (err.code === 4) msg = 'Format audio tidak didukung atau link stream kedaluwarsa';
          }
          console.warn(`Audio Deck ${deck} error detected:`, msg, err);
          setPlaybackError(msg);
          setIsBuffering(false);
          setIsPlaying(false);
          if (onPlaybackErrorRef.current) {
            onPlaybackErrorRef.current(msg);
          }
        }
      };

      el.addEventListener('timeupdate', handleTimeUpdate);
      el.addEventListener('durationchange', handleDurationChange);
      el.addEventListener('progress', handleProgress);
      el.addEventListener('ended', handleEnded);
      el.addEventListener('play', handlePlay);
      el.addEventListener('pause', handlePause);
      el.addEventListener('waiting', handleWaitingOrStalled);
      el.addEventListener('stalled', handleWaitingOrStalled);
      el.addEventListener('playing', handlePlaying);
      el.addEventListener('canplay', handleCanPlay);
      el.addEventListener('seeking', handleSeeking);
      el.addEventListener('seeked', handleSeeked);
      el.addEventListener('error', handleError);

      cleanups.push(() => {
        clearStallTimer();
        el.removeEventListener('timeupdate', handleTimeUpdate);
        el.removeEventListener('durationchange', handleDurationChange);
        el.removeEventListener('progress', handleProgress);
        el.removeEventListener('ended', handleEnded);
        el.removeEventListener('play', handlePlay);
        el.removeEventListener('pause', handlePause);
        el.removeEventListener('waiting', handleWaitingOrStalled);
        el.removeEventListener('stalled', handleWaitingOrStalled);
        el.removeEventListener('playing', handlePlaying);
        el.removeEventListener('canplay', handleCanPlay);
        el.removeEventListener('seeking', handleSeeking);
        el.removeEventListener('seeked', handleSeeked);
        el.removeEventListener('error', handleError);
      });
    });

    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return {
    audioRefA,
    audioRefB,
    // Alias for single-ref compatibility
    audioRef: activeDeck === 'A' ? audioRefA : audioRefB,
    activeDeck,
    crossfadeSettings,
    updateCrossfadeSettings,
    crossfadeTo,
    analyserRef,
    isPlaying,
    isBuffering,
    setIsBuffering,
    playbackError,
    clearPlaybackError: () => setPlaybackError(null),
    currentTime,
    duration,
    bufferedTime,
    volume,
    isMuted,
    bands,
    currentPreset,
    isAudioReady,
    play,
    pause,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    setBandGain,
    applyPreset,
    resetEQ,
    loadSource,
    preloadStandbySource,
    initAudioContext,
  };
}
