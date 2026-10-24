import { useRef, useState, useEffect, useCallback } from 'react';
import { EQBandConfig, EQPreset, CrossfadeSettings, Track } from '../types/music';

export const DEFAULT_BANDS: EQBandConfig[] = [
  { frequency: 60, gain: 0, type: 'lowshelf', label: '60Hz', description: 'Sub-bass' },
  { frequency: 170, gain: 0, type: 'peaking', label: '170Hz', description: 'Bass' },
  { frequency: 310, gain: 0, type: 'peaking', label: '310Hz', description: 'Low-mid' },
  { frequency: 600, gain: 0, type: 'peaking', label: '600Hz', description: 'Mid' },
  { frequency: 1000, gain: 0, type: 'peaking', label: '1kHz', description: 'Mid-high' },
  { frequency: 3000, gain: 0, type: 'peaking', label: '3kHz', description: 'Presence' },
  { frequency: 6000, gain: 0, type: 'peaking', label: '6kHz', description: 'Brilliance' },
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

export function useMobileAudioEngine(options?: {
  currentTrack?: Track | null;
  onTrackEnded?: () => void;
  onPlaybackProgress?: (curTime: number, dur: number) => void;
  onPlaybackError?: (errorMsg: string) => void;
  onNext?: () => void;
  onPrev?: () => void;
}) {
  const currentTrack = options?.currentTrack;
  const onTrackEndedRef = useRef(options?.onTrackEnded);
  const onPlaybackProgressRef = useRef(options?.onPlaybackProgress);
  const onPlaybackErrorRef = useRef(options?.onPlaybackError);
  const onNextRef = useRef(options?.onNext);
  const onPrevRef = useRef(options?.onPrev);

  useEffect(() => {
    onTrackEndedRef.current = options?.onTrackEnded;
    onPlaybackProgressRef.current = options?.onPlaybackProgress;
    onPlaybackErrorRef.current = options?.onPlaybackError;
    onNextRef.current = options?.onNext;
    onPrevRef.current = options?.onPrev;
  });

  const hasTriggeredEndedRef = useRef<boolean>(false);
  const isLoadingSourceRef = useRef<boolean>(false);

  const audioRefA = useRef<HTMLAudioElement | null>(null);
  const audioRefB = useRef<HTMLAudioElement | null>(null);
  const [activeDeck, setActiveDeck] = useState<'A' | 'B'>('A');
  const activeDeckRef = useRef<'A' | 'B'>('A');
  useEffect(() => {
    activeDeckRef.current = activeDeck;
  }, [activeDeck]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeARef = useRef<MediaElementAudioSourceNode | null>(null);
  const sourceNodeBRef = useRef<MediaElementAudioSourceNode | null>(null);
  const deckGainARef = useRef<GainNode | null>(null);
  const deckGainBRef = useRef<GainNode | null>(null);
  const filtersRef = useRef<BiquadFilterNode[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const isPlayingRef = useRef(false);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [bands, setBands] = useState<EQBandConfig[]>(DEFAULT_BANDS);
  const [currentPreset, setCurrentPreset] = useState<string>('flat');

  const [crossfadeSettings, setCrossfadeSettings] = useState<CrossfadeSettings>({
    enabled: true,
    duration: 3,
  });

  const initAudioContext = useCallback(() => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;

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

      if (!analyserRef.current) {
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        analyser.smoothingTimeConstant = 0.8;
        analyserRef.current = analyser;
      }

      if (!masterGainRef.current) {
        const masterGain = ctx.createGain();
        masterGain.gain.value = isMuted ? 0 : volume;
        masterGainRef.current = masterGain;

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

      if (audioRefA.current && !sourceNodeARef.current) {
        const sourceA = ctx.createMediaElementSource(audioRefA.current);
        sourceNodeARef.current = sourceA;
        const gainA = ctx.createGain();
        gainA.gain.value = activeDeckRef.current === 'A' ? 1 : 0;
        deckGainARef.current = gainA;
        sourceA.connect(gainA);
        gainA.connect(firstFilter);
      }

      if (audioRefB.current && !sourceNodeBRef.current) {
        const sourceB = ctx.createMediaElementSource(audioRefB.current);
        sourceNodeBRef.current = sourceB;
        const gainB = ctx.createGain();
        gainB.gain.value = activeDeckRef.current === 'B' ? 1 : 0;
        deckGainBRef.current = gainB;
        sourceB.connect(gainB);
        gainB.connect(firstFilter);
      }
    } catch (e) {
      console.warn('AudioContext init notice:', e);
    }
  }, [bands, isMuted, volume]);

  const getActiveAudio = useCallback(() => {
    return activeDeckRef.current === 'A' ? audioRefA.current : audioRefB.current;
  }, []);

  const play = useCallback(async () => {
    const el = getActiveAudio();
    if (!el) return;
    initAudioContext();

    if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
      try {
        await audioContextRef.current.resume();
      } catch {}
    }

    try {
      await el.play();
      setIsPlaying(true);
      setIsBuffering(false);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.warn('Mobile play error:', err);
      }
      setIsPlaying(false);
      setIsBuffering(false);
    }
  }, [getActiveAudio, initAudioContext]);

  const pause = useCallback(() => {
    if (audioRefA.current) audioRefA.current.pause();
    if (audioRefB.current) audioRefB.current.pause();
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    if (isPlaying) pause();
    else play();
  }, [isPlaying, pause, play]);

  const seek = useCallback((time: number) => {
    const el = activeDeckRef.current === 'A' ? audioRefA.current : audioRefB.current;
    if (el && isFinite(time)) {
      el.currentTime = time;
      setCurrentTime(time);
      hasTriggeredEndedRef.current = false;
    }
  }, []);

  const prepareTrackChange = useCallback((track?: Track | null) => {
    // 1. Instantly pause active deck so previous song never continues playing
    const activeEl = activeDeckRef.current === 'A' ? audioRefA.current : audioRefB.current;
    if (activeEl) {
      activeEl.pause();
    }

    // 2. Mark loading to drop stray timeupdate events from old audio buffer
    hasTriggeredEndedRef.current = false;
    isLoadingSourceRef.current = true;

    // 3. Immediately reset UI timeline states (time = 0, duration = new song duration)
    setCurrentTime(0);
    const initialDuration = track?.duration && track.duration > 0 ? track.duration : 0;
    setDuration(initialDuration);
    setIsBuffering(true);
    setIsPlaying(false);
  }, []);

  const preloadStandbySource = useCallback((src: string) => {
    if (!src) return;
    initAudioContext();
    const standbyAudio = activeDeckRef.current === 'A' ? audioRefB.current : audioRefA.current;
    if (!standbyAudio) return;

    if (standbyAudio.src !== src && standbyAudio.currentSrc !== src) {
      standbyAudio.src = src;
      standbyAudio.preload = 'auto';
      standbyAudio.load();
    }
  }, [initAudioContext]);

  const loadSource = useCallback((src: string) => {
    initAudioContext();
    const currentActiveDeck = activeDeckRef.current;
    const activeAudio = currentActiveDeck === 'A' ? audioRefA.current : audioRefB.current;
    const standbyAudio = currentActiveDeck === 'A' ? audioRefB.current : audioRefA.current;
    const standbyDeckId: 'A' | 'B' = currentActiveDeck === 'A' ? 'B' : 'A';

    hasTriggeredEndedRef.current = false;
    isLoadingSourceRef.current = true;
    setIsBuffering(true);
    setCurrentTime(0);

    // If standby deck ALREADY preloaded this URL, instant 0ms deck swap!
    if (standbyAudio && (standbyAudio.src === src || standbyAudio.currentSrc === src)) {
      if (activeAudio) {
        activeAudio.pause();
        activeAudio.currentTime = 0;
      }
      activeDeckRef.current = standbyDeckId;
      setActiveDeck(standbyDeckId);
      if (deckGainARef.current) deckGainARef.current.gain.value = standbyDeckId === 'A' ? 1 : 0;
      if (deckGainBRef.current) deckGainBRef.current.gain.value = standbyDeckId === 'B' ? 1 : 0;
      return;
    }

    // Otherwise load on active deck
    if (activeAudio) {
      if (activeAudio.src !== src) {
        activeAudio.src = src;
        activeAudio.load();
      }
    }
  }, [initAudioContext]);

  const setBandGain = useCallback((index: number, gainDb: number) => {
    const clamped = Math.max(-12, Math.min(12, gainDb));
    setBands((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], gain: clamped };
      return copy;
    });
    if (filtersRef.current[index]) {
      filtersRef.current[index].gain.value = clamped;
    }
    setCurrentPreset('custom');
  }, []);

  const applyPreset = useCallback((presetId: string) => {
    const p = EQ_PRESETS.find((x) => x.id === presetId);
    if (!p) return;
    setBands((prev) =>
      prev.map((band, idx) => {
        const gain = p.gains[idx] ?? 0;
        if (filtersRef.current[idx]) {
          filtersRef.current[idx].gain.value = gain;
        }
        return { ...band, gain };
      })
    );
    setCurrentPreset(presetId);
  }, []);

  const resetEQ = useCallback(() => {
    applyPreset('flat');
  }, [applyPreset]);

  // Audio Listeners
  useEffect(() => {
    const audios = [
      { el: audioRefA.current, deck: 'A' as const },
      { el: audioRefB.current, deck: 'B' as const },
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
        if (activeDeckRef.current === deck && !hasTriggeredEndedRef.current) {
          hasTriggeredEndedRef.current = true;
          setIsPlaying(false);
          setIsBuffering(false);
          onTrackEndedRef.current?.();
        }
      };

      const handleTime = () => {
        if (isLoadingSourceRef.current) return;
        if (activeDeckRef.current === deck && el.currentTime && isFinite(el.currentTime)) {
          setCurrentTime(el.currentTime);
          onPlaybackProgressRef.current?.(el.currentTime, el.duration);

          // Near-end watchdog
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

      const handleDur = () => {
        if (isLoadingSourceRef.current && (!el.duration || !isFinite(el.duration) || el.duration <= 0)) return;
        if (activeDeckRef.current === deck && el.duration && isFinite(el.duration) && el.duration > 0) {
          setDuration(el.duration);
        }
      };

      const handleWait = () => {
        if (activeDeckRef.current === deck) {
          setIsBuffering(true);

          // Only trigger watchdog if track has actively played (> 5s) and is within 1.5s of end
          if (
            !hasTriggeredEndedRef.current &&
            el.duration &&
            isFinite(el.duration) &&
            el.duration > 10 &&
            el.currentTime > 5 &&
            el.duration - el.currentTime <= 1.5
          ) {
            clearStallTimer();
            stallTimer = window.setTimeout(() => {
              if (
                activeDeckRef.current === deck &&
                !hasTriggeredEndedRef.current &&
                el.duration &&
                el.currentTime > 5 &&
                el.duration - el.currentTime <= 1.5
              ) {
                console.info(`[MobileAudio] EOF stall near end (${el.currentTime.toFixed(1)}s / ${el.duration.toFixed(1)}s), triggering track ended`);
                handleEnded();
              }
            }, 1500);
          }
        }
      };

      const handlePlaying = () => {
        clearStallTimer();
        isLoadingSourceRef.current = false;
        if (activeDeckRef.current === deck) {
          setIsBuffering(false);
          setIsPlaying(true);
        }
      };

      const handleCanPlay = () => {
        isLoadingSourceRef.current = false;
        if (activeDeckRef.current === deck) {
          setIsBuffering(false);
        }
      };

      const handlePause = () => {
        clearStallTimer();
        if (activeDeckRef.current === deck) {
          setIsPlaying(false);
        }
      };

      const handleError = () => {
        clearStallTimer();
        if (activeDeckRef.current === deck) {
          const err = el.error;
          // Ignore transient/aborted errors during source transitions
          if (!el.src || el.src === window.location.href || !err || err.code === 1 || isLoadingSourceRef.current) {
            return;
          }
          const msg = `Error code ${err.code}`;
          console.warn('[MobileAudio] Error detected:', msg);
          setIsBuffering(false);
          setIsPlaying(false);
          onPlaybackErrorRef.current?.(msg);
        }
      };

      el.addEventListener('timeupdate', handleTime);
      el.addEventListener('durationchange', handleDur);
      el.addEventListener('ended', handleEnded);
      el.addEventListener('waiting', handleWait);
      el.addEventListener('stalled', handleWait);
      el.addEventListener('playing', handlePlaying);
      el.addEventListener('canplay', handleCanPlay);
      el.addEventListener('pause', handlePause);
      el.addEventListener('error', handleError);

      cleanups.push(() => {
        clearStallTimer();
        el.removeEventListener('timeupdate', handleTime);
        el.removeEventListener('durationchange', handleDur);
        el.removeEventListener('ended', handleEnded);
        el.removeEventListener('waiting', handleWait);
        el.removeEventListener('stalled', handleWait);
        el.removeEventListener('playing', handlePlaying);
        el.removeEventListener('canplay', handleCanPlay);
        el.removeEventListener('pause', handlePause);
        el.removeEventListener('error', handleError);
      });
    });

    return () => cleanups.forEach((f) => f());
  }, []);

  // Android Lock Screen Controls via MediaSession API + Position State
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'AuraAudio',
        artwork: currentTrack.thumbnailUrl
          ? [
              { src: currentTrack.thumbnailUrl, sizes: '96x96', type: 'image/png' },
              { src: currentTrack.thumbnailUrl, sizes: '128x128', type: 'image/png' },
              { src: currentTrack.thumbnailUrl, sizes: '192x192', type: 'image/png' },
              { src: currentTrack.thumbnailUrl, sizes: '512x512', type: 'image/png' },
            ]
          : [],
      });
    }

    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';

    if (duration > 0 && 'setPositionState' in navigator.mediaSession) {
      try {
        navigator.mediaSession.setPositionState({
          duration: Math.max(0, duration),
          playbackRate: 1,
          position: Math.min(Math.max(0, currentTime), duration),
        });
      } catch {}
    }

    navigator.mediaSession.setActionHandler('play', () => play());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('nexttrack', () => onNextRef.current?.());
    navigator.mediaSession.setActionHandler('previoustrack', () => onPrevRef.current?.());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      if (details.seekTime !== undefined && details.seekTime !== null) {
        seek(details.seekTime);
      }
    });

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch {}
    };
  }, [currentTrack, isPlaying, currentTime, duration, play, pause, seek]);

  return {
    audioRefA,
    audioRefB,
    activeDeck,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    bands,
    currentPreset,
    crossfadeSettings,
    analyserRef,
    play,
    pause,
    togglePlay,
    seek,
    prepareTrackChange,
    loadSource,
    preloadStandbySource,
    setBandGain,
    applyPreset,
    resetEQ,
    setCrossfadeSettings,
  };
}
