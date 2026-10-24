import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Track, RepeatMode } from '../types/music';
import { useTrackCover } from '../utils/coverArt';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  Volume1,
  VolumeX,
  Sliders,
  Music,
  CheckCircle2,
  Loader2,
  ListMusic,
  Moon,
  PictureInPicture2,
  Heart,
  Radio,
} from 'lucide-react';

interface PlayerBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isBuffering?: boolean;
  currentTime: number;
  duration: number;
  bufferedTime?: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  isEqualizerOpen: boolean;
  isQueueOpen?: boolean;
  sleepTimerActive?: boolean;
  sleepTimerFormatted?: string;
  onSetSleepTimer?: (mode: '15' | '30' | '45' | '60' | 'end_of_track' | null) => void;
  onCancelSleepTimer?: () => void;
  onToggleMiniPlayer?: () => void;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onVolumeChange: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleEqualizer: () => void;
  onToggleQueue?: () => void;
  isOverviewOpen?: boolean;
  onToggleOverview?: () => void;
  onStartDownload?: (track: Track) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '0:00';
  const totalSecs = Math.floor(seconds);
  const mins = Math.floor(totalSecs / 60);
  const secs = totalSecs % 60;
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  if (mins >= 60) {
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    const formattedMins = remMins < 10 ? `0${remMins}` : `${remMins}`;
    return `${hrs}:${formattedMins}:${formattedSecs}`;
  }
  return `${mins}:${formattedSecs}`;
}

export const PlayerBar: React.FC<PlayerBarProps> = ({
  currentTrack,
  isPlaying,
  isBuffering = false,
  currentTime,
  duration,
  bufferedTime = 0,
  volume,
  isMuted,
  isShuffle,
  repeatMode,
  isEqualizerOpen,
  isQueueOpen = false,
  isOverviewOpen = false,
  sleepTimerActive = false,
  sleepTimerFormatted = '',
  onSetSleepTimer,
  onCancelSleepTimer,
  onToggleMiniPlayer,
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onVolumeChange,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onToggleEqualizer,
  onToggleQueue,
  onToggleOverview,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isSleepTimerMenuOpen, setIsSleepTimerMenuOpen] = useState(false);
  const sleepMenuRef = useRef<HTMLDivElement | null>(null);

  const progressBarRef = useRef<HTMLDivElement | null>(null);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const thumbRef = useRef<HTMLDivElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(currentTime);
  const lastSyncTimestampRef = useRef<number>(performance.now());

  const [isDragging, setIsDragging] = useState(false);
  const [dragTime, setDragTime] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [hoverTime, setHoverTime] = useState(0);
  const [hoverRatio, setHoverRatio] = useState(0);

  // Close Sleep Timer menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sleepMenuRef.current && !sleepMenuRef.current.contains(event.target as Node)) {
        setIsSleepTimerMenuOpen(false);
      }
    }
    if (isSleepTimerMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isSleepTimerMenuOpen]);

  const effectiveDuration = duration > 0 ? duration : currentTrack?.duration || 0;
  const displayTime = isDragging ? dragTime : currentTime;
  const progressPercent =
    effectiveDuration > 0
      ? Math.min(100, Math.max(0, (displayTime / effectiveDuration) * 100))
      : 0;
  const bufferedPercent =
    effectiveDuration > 0
      ? Math.min(100, Math.max(0, (bufferedTime / effectiveDuration) * 100))
      : 0;

  // Track latest time and sync base timestamp
  useEffect(() => {
    lastSyncTimeRef.current = currentTime;
    lastSyncTimestampRef.current = performance.now();
    if (!isPlaying && !isDragging) {
      const ratio = effectiveDuration > 0 ? Math.min(1, Math.max(0, currentTime / effectiveDuration)) : 0;
      if (progressFillRef.current) {
        progressFillRef.current.style.transform = `scaleX(${ratio})`;
      }
      if (thumbRef.current) {
        thumbRef.current.style.left = `${(ratio * 100).toFixed(3)}%`;
      }
    }
  }, [currentTime, isPlaying, isDragging, effectiveDuration]);

  // Butter-smooth 60/120fps progress interpolation via requestAnimationFrame
  useEffect(() => {
    if (!isPlaying || isDragging || isBuffering || effectiveDuration <= 0) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const updateFrame = () => {
      const elapsed = (performance.now() - lastSyncTimestampRef.current) / 1000;
      const estimatedTime = Math.min(effectiveDuration, Math.max(0, lastSyncTimeRef.current + elapsed));
      const ratio = effectiveDuration > 0 ? Math.min(1, Math.max(0, estimatedTime / effectiveDuration)) : 0;

      if (progressFillRef.current) {
        progressFillRef.current.style.transform = `scaleX(${ratio})`;
      }
      if (thumbRef.current) {
        thumbRef.current.style.left = `${(ratio * 100).toFixed(3)}%`;
      }

      rafIdRef.current = requestAnimationFrame(updateFrame);
    };

    rafIdRef.current = requestAnimationFrame(updateFrame);
    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [isPlaying, isDragging, isBuffering, effectiveDuration]);

  const calculateTimeFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent<HTMLDivElement>): number => {
      if (!progressBarRef.current || effectiveDuration <= 0) return 0;
      const rect = progressBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(1, clickX / rect.width));
      return ratio * effectiveDuration;
    },
    [effectiveDuration]
  );

  const handleBarMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || effectiveDuration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    setHoverRatio(ratio);
    setHoverTime(ratio * effectiveDuration);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!currentTrack || effectiveDuration <= 0) return;
    setIsDragging(true);
    const newTime = calculateTimeFromEvent(e);
    setDragTime(newTime);
    const ratio = Math.min(1, Math.max(0, newTime / effectiveDuration));
    if (progressFillRef.current) {
      progressFillRef.current.style.transform = `scaleX(${ratio})`;
    }
    if (thumbRef.current) {
      thumbRef.current.style.left = `${(ratio * 100).toFixed(3)}%`;
    }
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newTime = calculateTimeFromEvent(e);
      setDragTime(newTime);
      const ratio = effectiveDuration > 0 ? Math.min(1, Math.max(0, newTime / effectiveDuration)) : 0;
      if (progressFillRef.current) {
        progressFillRef.current.style.transform = `scaleX(${ratio})`;
      }
      if (thumbRef.current) {
        thumbRef.current.style.left = `${(ratio * 100).toFixed(3)}%`;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      const finalTime = calculateTimeFromEvent(e);
      setIsDragging(false);
      onSeek(finalTime);
      lastSyncTimeRef.current = finalTime;
      lastSyncTimestampRef.current = performance.now();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateTimeFromEvent, onSeek, effectiveDuration]);

  // Volume Bar Dragging
  const volumeBarRef = useRef<HTMLDivElement | null>(null);
  const [isDraggingVol, setIsDraggingVol] = useState(false);

  const calculateVolumeFromEvent = useCallback(
    (e: MouseEvent | React.MouseEvent<HTMLDivElement>): number => {
      if (!volumeBarRef.current) return volume;
      const rect = volumeBarRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      return Math.max(0, Math.min(1, clickX / rect.width));
    },
    [volume]
  );

  const handleVolMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingVol(true);
    const newVol = calculateVolumeFromEvent(e);
    onVolumeChange(newVol);
  };

  useEffect(() => {
    if (!isDraggingVol) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newVol = calculateVolumeFromEvent(e);
      onVolumeChange(newVol);
    };

    const handleMouseUp = () => {
      setIsDraggingVol(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingVol, calculateVolumeFromEvent, onVolumeChange]);

  const officialCover = useTrackCover(
    currentTrack?.title || '',
    currentTrack?.artist || '',
    currentTrack?.thumbnailUrl
  );

  const effectiveVolume = isMuted ? 0 : volume;

  return (
    <footer
      className="w-full h-[84px] px-6 rounded-[20px] bg-[#121215]/95 backdrop-blur-2xl border border-white/[0.08] shadow-[0_16px_48px_rgba(0,0,0,0.85)] grid grid-cols-[1fr_1.5fr_1fr] items-center gap-6 z-50 select-none flex-shrink-0 relative overflow-hidden"
      aria-label="Pemutar Audio"
    >
      {/* Juxtopposed KIRI: cover 52x52 rounded-[10px], judul 13.5px font-semibold, artis 11.5px, heart button */}
      <div className="flex items-center gap-3.5 min-w-0 relative z-10">
        <div
          onClick={onToggleOverview}
          className="relative w-13 h-13 rounded-[10px] overflow-hidden flex-shrink-0 bg-zinc-800 flex items-center justify-center cursor-pointer group shadow-md border border-white/5"
          title="Buka tampilan sedang diputar"
        >
          {currentTrack && (officialCover || currentTrack.thumbnailUrl) ? (
            <img
              src={officialCover || currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <Music size={20} strokeWidth={1.8} className="text-zinc-400" />
          )}
        </div>

        <div className="min-w-0 max-w-[200px] xl:max-w-[280px]">
          <div className="flex items-center gap-2 min-w-0">
            <p
              onClick={onToggleOverview}
              className="text-[13.5px] font-semibold text-white tracking-tight truncate hover:underline transition-colors cursor-pointer leading-tight"
              title={currentTrack ? currentTrack.title : undefined}
            >
              {currentTrack ? currentTrack.title : 'Tidak ada lagu'}
            </p>
            {currentTrack?.isOffline && (
              <span title="Offline" className="inline-flex items-center flex-shrink-0 text-zinc-400">
                <CheckCircle2 size={12} strokeWidth={2.2} />
              </span>
            )}
          </div>
          <p
            onClick={onToggleOverview}
            className="text-[11.5px] font-medium text-zinc-400 truncate hover:text-zinc-200 transition-colors cursor-pointer mt-0.5 leading-tight"
            title={currentTrack ? currentTrack.artist : undefined}
          >
            {currentTrack ? currentTrack.artist : 'Pilih lagu untuk memutar'}
          </p>
        </div>

        {/* Tombol suka tepat di samping kanan teks */}
        {currentTrack && (
          <button
            onClick={() => setIsLiked((prev) => !prev)}
            aria-label={isLiked ? 'Batal Suka' : 'Suka'}
            title={isLiked ? 'Batal Suka' : 'Suka'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ml-1 active:scale-90 hover:scale-110 ${
              isLiked ? 'text-red-500' : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Heart size={18} strokeWidth={2} className={isLiked ? 'fill-current' : ''} />
          </button>
        )}
      </div>

      {/* Juxtopposed TENGAH: kontrol playback & timeline presisi */}
      <div className="flex flex-col items-center gap-1.5 w-full relative z-10">
        {/* Baris kontrol */}
        <div className="flex items-center gap-3">
          {/* Acak */}
          <button
            onClick={onToggleShuffle}
            aria-label={`Acak ${isShuffle ? 'Aktif' : 'Nonaktif'}`}
            title={`Acak: ${isShuffle ? 'Aktif' : 'Nonaktif'}`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              isShuffle
                ? 'text-white bg-white/15 border border-white/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Shuffle size={16} strokeWidth={2} />
          </button>

          {/* Sebelumnya */}
          <button
            onClick={onPrev}
            disabled={!currentTrack}
            aria-label="Lagu Sebelumnya"
            title="Sebelumnya"
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
          >
            <SkipBack size={18} strokeWidth={2} className="fill-current" />
          </button>

          {/* Putar / Jeda: lingkaran kontras tinggi putih solid dengan shadow halus, TANPA glow */}
          <button
            onClick={onTogglePlay}
            disabled={!currentTrack}
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
            title={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              currentTrack
                ? 'bg-white hover:bg-zinc-100 hover:scale-105 active:scale-95 text-black shadow-md border border-white/20'
                : 'bg-white/10 text-zinc-600 cursor-not-allowed opacity-40'
            }`}
          >
            {isBuffering ? (
              <Loader2 size={18} strokeWidth={2} className="animate-spin text-black" />
            ) : isPlaying ? (
              <Pause size={18} strokeWidth={2.2} className="fill-current" />
            ) : (
              <Play size={18} strokeWidth={2.2} className="fill-current ml-0.5" />
            )}
          </button>

          {/* Berikutnya */}
          <button
            onClick={onNext}
            disabled={!currentTrack}
            aria-label="Lagu Berikutnya"
            title="Berikutnya"
            className="w-9 h-9 rounded-full flex items-center justify-center text-zinc-300 hover:text-white hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-transparent transition-all cursor-pointer"
          >
            <SkipForward size={18} strokeWidth={2} className="fill-current" />
          </button>

          {/* Ulangi */}
          <button
            onClick={onToggleRepeat}
            aria-label={`Ulangi: ${repeatMode}`}
            title={`Ulangi: ${repeatMode === 'one' ? 'Satu Lagu' : repeatMode === 'all' ? 'Semua' : 'Nonaktif'}`}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              repeatMode !== 'off'
                ? 'text-white bg-white/15 border border-white/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 size={16} strokeWidth={2} />
            ) : (
              <Repeat size={16} strokeWidth={2} />
            )}
          </button>
        </div>

        {/* Progress Bar: waktu 11px micro, lintasan 4px tinggi, isi Electric Blue #3B82F6 */}
        <div className="flex items-center gap-3 w-full max-w-lg">
          <span className="text-[11px] font-mono text-[#8D8D93] w-10 text-right select-none">
            {formatTime(displayTime)}
          </span>

          <div
            ref={progressBarRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleBarMouseMove}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
            className={`relative flex-1 h-4 flex items-center group cursor-pointer ${
              !currentTrack ? 'pointer-events-none opacity-40' : ''
            }`}
          >
            {/* Hover preview tooltip */}
            {isHovering && !isDragging && effectiveDuration > 0 && (
              <div
                className="absolute -top-7 -translate-x-1/2 bg-[#222228] text-white text-[10px] font-mono py-0.5 px-2 rounded-[6px] border border-white/10 shadow-lg pointer-events-none z-50 whitespace-nowrap"
                style={{ left: `${Math.max(4, Math.min(96, hoverRatio * 100))}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}

            {/* Lintasan tinggi responsif ke hover */}
            <div className="w-full h-1 group-hover:h-1.5 bg-zinc-800 rounded-full overflow-hidden relative transition-all duration-150">
              {/* Buffer */}
              <div
                className="absolute top-0 left-0 h-full bg-zinc-700/60 rounded-full transition-all duration-200"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Isi: Electric Blue #3B82F6 (GPU composite layer 60/120fps) */}
              <div
                ref={progressFillRef}
                className="absolute top-0 left-0 w-full h-full bg-blue-500 group-hover:bg-blue-400 rounded-full origin-left will-change-transform transition-colors duration-150"
                style={{ transform: `scaleX(${progressPercent / 100})` }}
              />
            </div>

            {/* Thumb slider 12px bulat bersih */}
            <div
              ref={thumbRef}
              className={`absolute w-3 h-3 bg-white rounded-full shadow-md pointer-events-none -translate-x-1/2 transition-opacity duration-120 will-change-[left] ${
                isDragging || isHovering ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-zinc-400 w-10 text-left select-none tabular-nums">
            {formatTime(effectiveDuration)}
          </span>
        </div>
      </div>

      {/* Juxtopposed KANAN: ikon volume, slider, antrean, EQ, dsb. */}
      <div className="flex items-center justify-end gap-1 min-w-0 relative z-10">
        {/* Floating Mini Player */}
        {onToggleMiniPlayer && (
          <button
            onClick={onToggleMiniPlayer}
            aria-label="Mini Player"
            title="Mini Player Melayang"
            className="w-9 h-9 rounded-[10px] flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-all cursor-pointer"
          >
            <PictureInPicture2 size={18} strokeWidth={1.8} />
          </button>
        )}

        {/* Sleep Timer */}
        {onSetSleepTimer && (
          <div className="relative">
            <button
              onClick={() => setIsSleepTimerMenuOpen((prev) => !prev)}
              aria-label="Pengatur Waktu Tidur"
              title={sleepTimerActive ? `Timer Tidur Aktif (${sleepTimerFormatted})` : 'Timer Tidur'}
              className={`h-9 px-2.5 rounded-[10px] flex items-center gap-1.5 transition-all cursor-pointer ${
                sleepTimerActive
                  ? 'bg-white/15 border border-white/20 text-white font-medium'
                  : 'text-zinc-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Moon size={18} strokeWidth={1.8} className={sleepTimerActive ? 'fill-current' : ''} />
              {sleepTimerActive && (
                <span className="font-mono text-xs text-white">{sleepTimerFormatted}</span>
              )}
            </button>

            {isSleepTimerMenuOpen && (
              <div
                ref={sleepMenuRef}
                className="absolute bottom-full mb-3 right-0 w-44 bg-[#18181D] border border-white/[0.08] rounded-[16px] shadow-[0_16px_36px_rgba(0,0,0,0.8)] p-2 z-50 text-xs animate-in fade-in duration-120"
              >
                <div className="px-3 py-1.5 text-[11px] font-medium text-zinc-400 uppercase tracking-wider mb-1">
                  Waktu Tidur
                </div>
                {[
                  { label: '15 Menit', mode: '15' as const },
                  { label: '30 Menit', mode: '30' as const },
                  { label: '45 Menit', mode: '45' as const },
                  { label: '60 Menit', mode: '60' as const },
                  { label: 'Akhir Lagu Ini', mode: 'end_of_track' as const },
                ].map((item) => (
                  <button
                    key={item.mode}
                    onClick={() => {
                      onSetSleepTimer(item.mode);
                      setIsSleepTimerMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[10px] text-zinc-200 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
                {sleepTimerActive && onCancelSleepTimer && (
                  <button
                    onClick={() => {
                      onCancelSleepTimer();
                      setIsSleepTimerMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-[10px] text-red-400 hover:bg-white/10 transition-colors mt-1"
                  >
                    Matikan Timer
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Radio / Now Playing Overview */}
        {onToggleOverview && (
          <button
            onClick={onToggleOverview}
            aria-label="Panel Sedang Diputar"
            title="Panel Sedang Diputar"
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all cursor-pointer ${
              isOverviewOpen
                ? 'bg-white/15 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <Radio size={18} strokeWidth={1.8} />
          </button>
        )}

        {/* Antrean (Queue) */}
        {onToggleQueue && (
          <button
            onClick={onToggleQueue}
            aria-label="Antrean"
            title="Antrean Pemutar"
            className={`w-9 h-9 rounded-[10px] flex items-center justify-center transition-all cursor-pointer ${
              isQueueOpen
                ? 'bg-white/15 text-white'
                : 'text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            <ListMusic size={18} strokeWidth={1.8} />
          </button>
        )}

        {/* Equalizer */}
        <button
          onClick={onToggleEqualizer}
          aria-label="Equalizer"
          title="Equalizer 8-Band"
          className={`h-9 px-2.5 rounded-[10px] flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer ${
            isEqualizerOpen
              ? 'bg-white text-black font-semibold'
              : 'text-zinc-400 hover:text-white hover:bg-white/10'
          }`}
        >
          <Sliders size={16} strokeWidth={1.8} />
          <span>EQ</span>
        </button>

        {/* Volume: ikon 18px, slider 96px */}
        <div
          className="flex items-center gap-1.5 pl-2"
          onWheel={(e) => {
            e.preventDefault();
            const delta = e.deltaY < 0 ? 0.05 : -0.05;
            onVolumeChange(Math.max(0, Math.min(1, volume + delta)));
          }}
        >
          <button
            onClick={onToggleMute}
            aria-label={isMuted ? 'Bunyikan' : 'Bisukan'}
            title={isMuted ? 'Bunyikan' : 'Bisukan'}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            {effectiveVolume === 0 ? (
              <VolumeX size={18} strokeWidth={1.8} />
            ) : effectiveVolume < 0.5 ? (
              <Volume1 size={18} strokeWidth={1.8} />
            ) : (
              <Volume2 size={18} strokeWidth={1.8} />
            )}
          </button>

          <div
            ref={volumeBarRef}
            onMouseDown={handleVolMouseDown}
            className="w-[96px] h-3.5 flex items-center group cursor-pointer relative"
          >
            <div className="w-full h-1 group-hover:h-1.5 bg-zinc-800 rounded-full overflow-hidden transition-all duration-150">
              <div
                className={`h-full bg-white rounded-full ${isDraggingVol ? '' : 'transition-all duration-75'}`}
                style={{ width: `${effectiveVolume * 100}%` }}
              />
            </div>
            <div
              className={`absolute w-2.5 h-2.5 bg-white rounded-full shadow pointer-events-none -translate-x-1/2 transition-opacity duration-120 ${
                isDraggingVol ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
              style={{ left: `${effectiveVolume * 100}%` }}
            />
          </div>
        </div>
      </div>
    </footer>
  );
};
