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
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newTime = calculateTimeFromEvent(e);
      setDragTime(newTime);
    };

    const handleMouseUp = (e: MouseEvent) => {
      const finalTime = calculateTimeFromEvent(e);
      setIsDragging(false);
      onSeek(finalTime);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, calculateTimeFromEvent, onSeek]);

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
      className="w-full h-[88px] bg-[#121214] px-7 grid grid-cols-[1fr_1.4fr_1fr] items-center gap-6 z-50 select-none flex-shrink-0 relative"
      aria-label="Pemutar Audio"
    >
      {/* 3.7 KIRI: cover 56x56 radius 6px, judul 14px, artis 12px --text-muted, ikon suka 20px tepat di kanan teks (jarak 12px) */}
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          onClick={onToggleOverview}
          className="relative w-14 h-14 rounded-[6px] overflow-hidden flex-shrink-0 bg-gradient-to-br from-[var(--now)] to-[var(--now-dark)] flex items-center justify-center cursor-pointer group"
          title="Buka tampilan sedang diputar"
        >
          {currentTrack && (officialCover || currentTrack.thumbnailUrl) ? (
            <img
              src={officialCover || currentTrack.thumbnailUrl}
              alt={currentTrack.title}
              className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-105"
            />
          ) : (
            <Music size={22} strokeWidth={1.8} className="text-[#8D8D93]" />
          )}
        </div>

        <div className="min-w-0 max-w-[200px] xl:max-w-[280px]">
          <div className="flex items-center gap-2 min-w-0">
            <p
              onClick={onToggleOverview}
              className="text-[14px] font-normal text-[#F4F4F0] truncate hover:text-white transition-colors cursor-pointer leading-tight"
              title={currentTrack ? currentTrack.title : undefined}
            >
              {currentTrack ? currentTrack.title : 'Tidak ada lagu'}
            </p>
            {currentTrack?.isOffline && (
              <span title="Offline" className="inline-flex items-center flex-shrink-0 text-[#F4F4F0]">
                <CheckCircle2 size={12} strokeWidth={2} />
              </span>
            )}
          </div>
          <p
            onClick={onToggleOverview}
            className="text-[12px] font-normal text-[#8D8D93] truncate hover:text-[#F4F4F0] transition-colors cursor-pointer mt-0.5 leading-tight"
            title={currentTrack ? currentTrack.artist : undefined}
          >
            {currentTrack ? currentTrack.artist : 'Pilih lagu untuk memutar'}
          </p>
        </div>

        {/* Tombol suka tepat di samping kanan teks (jarak 12px) */}
        {currentTrack && (
          <button
            onClick={() => setIsLiked((prev) => !prev)}
            aria-label={isLiked ? 'Batal Suka' : 'Suka'}
            title={isLiked ? 'Batal Suka' : 'Suka'}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer ml-1 ${
              isLiked ? 'text-[#F4F4F0]' : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23]'
            }`}
          >
            <Heart size={20} strokeWidth={1.8} className={isLiked ? 'fill-current' : ''} />
          </button>
        )}
      </div>

      {/* 3.7 TENGAH: kontrol 18px jarak (Acak, Sebelumnya, Putar/Jeda, Berikutnya, Ulangi) + progress */}
      <div className="flex flex-col items-center gap-1.5 w-full">
        {/* Baris kontrol: jarak 18px */}
        <div className="flex items-center gap-[18px]">
          {/* Acak */}
          <button
            onClick={onToggleShuffle}
            aria-label={`Acak ${isShuffle ? 'Aktif' : 'Nonaktif'}`}
            title={`Acak: ${isShuffle ? 'Aktif' : 'Nonaktif'}`}
            className={`w-11 h-11 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer ${
              isShuffle
                ? 'text-[#F4F4F0] bg-[#1F1F23]'
                : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23]'
            }`}
          >
            <Shuffle size={20} strokeWidth={1.8} />
          </button>

          {/* Sebelumnya */}
          <button
            onClick={onPrev}
            disabled={!currentTrack}
            aria-label="Lagu Sebelumnya"
            title="Sebelumnya"
            className="w-11 h-11 rounded-[8px] flex items-center justify-center text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <SkipBack size={20} strokeWidth={1.8} className="fill-current" />
          </button>

          {/* Putar / Jeda: lingkaran 48px, latar --accent #F4F4F0, ikon --on-accent #0B0B0C */}
          <button
            onClick={onTogglePlay}
            disabled={!currentTrack}
            aria-label={isPlaying ? 'Jeda' : 'Putar'}
            title={isPlaying ? 'Jeda (Spasi)' : 'Putar (Spasi)'}
            className={`w-12 h-12 rounded-full flex items-center justify-center transition-all cursor-pointer ${
              currentTrack
                ? 'bg-[#F4F4F0] hover:brightness-95 active:scale-95 text-[#0B0B0C]'
                : 'bg-[#1F1F23] text-[#8D8D93] cursor-not-allowed opacity-40'
            }`}
          >
            {isBuffering ? (
              <Loader2 size={20} strokeWidth={1.8} className="animate-spin text-[#0B0B0C]" />
            ) : isPlaying ? (
              <Pause size={20} strokeWidth={1.8} className="fill-current" />
            ) : (
              <Play size={20} strokeWidth={1.8} className="fill-current ml-0.5" />
            )}
          </button>

          {/* Berikutnya */}
          <button
            onClick={onNext}
            disabled={!currentTrack}
            aria-label="Lagu Berikutnya"
            title="Berikutnya"
            className="w-11 h-11 rounded-[8px] flex items-center justify-center text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] disabled:opacity-40 disabled:hover:bg-transparent transition-colors cursor-pointer"
          >
            <SkipForward size={20} strokeWidth={1.8} className="fill-current" />
          </button>

          {/* Ulangi */}
          <button
            onClick={onToggleRepeat}
            aria-label={`Ulangi: ${repeatMode}`}
            title={`Ulangi: ${repeatMode === 'one' ? 'Satu Lagu' : repeatMode === 'all' ? 'Semua' : 'Nonaktif'}`}
            className={`w-11 h-11 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer ${
              repeatMode !== 'off'
                ? 'text-[#F4F4F0] bg-[#1F1F23]'
                : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23]'
            }`}
          >
            {repeatMode === 'one' ? (
              <Repeat1 size={20} strokeWidth={1.8} />
            ) : (
              <Repeat size={20} strokeWidth={1.8} />
            )}
          </button>
        </div>

        {/* Progress Bar: waktu 11px micro, lintasan 4px tinggi (--track #34343A, radius 2px), isi --progress #B7F161 */}
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
                className="absolute -top-7 -translate-x-1/2 bg-[#1F1F23] text-[#F4F4F0] text-[10px] font-mono py-0.5 px-2 rounded-[4px] shadow-lg pointer-events-none z-50 whitespace-nowrap"
                style={{ left: `${Math.max(4, Math.min(96, hoverRatio * 100))}%` }}
              >
                {formatTime(hoverTime)}
              </div>
            )}

            {/* Lintasan 4px tinggi, radius 2px, latar --track #34343A */}
            <div className="w-full h-1 bg-[#34343A] rounded-[2px] overflow-hidden relative">
              {/* Buffer */}
              <div
                className="absolute top-0 left-0 h-full bg-[#46464E] rounded-[2px] transition-all duration-200"
                style={{ width: `${bufferedPercent}%` }}
              />
              {/* Isi: --progress #B7F161 (Hijau neon lembut, hanya untuk progress lagu) */}
              <div
                className="absolute top-0 left-0 h-full bg-[#B7F161] rounded-[2px] transition-all duration-75"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Thumb slider 12px bulat --text #F4F4F0 (muncul saat hover atau drag) */}
            <div
              className={`absolute w-3 h-3 bg-[#F4F4F0] rounded-full shadow pointer-events-none -translate-x-1/2 transition-opacity duration-120 ${
                isDragging || isHovering ? 'opacity-100' : 'opacity-0'
              }`}
              style={{ left: `${progressPercent}%` }}
            />
          </div>

          <span className="text-[11px] font-mono text-[#8D8D93] w-10 text-left select-none">
            {formatTime(effectiveDuration)}
          </span>
        </div>
      </div>

      {/* 3.7 KANAN: ikon volume 20px, slider 110x4px (isi --text #F4F4F0), antrean, perangkat/EQ, dsb. */}
      <div className="flex items-center justify-end gap-1.5 min-w-0">
        {/* Floating Mini Player */}
        {onToggleMiniPlayer && (
          <button
            onClick={onToggleMiniPlayer}
            aria-label="Mini Player"
            title="Mini Player Melayang"
            className="w-11 h-11 rounded-[8px] flex items-center justify-center text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] transition-colors cursor-pointer"
          >
            <PictureInPicture2 size={20} strokeWidth={1.8} />
          </button>
        )}

        {/* Sleep Timer */}
        {onSetSleepTimer && (
          <div className="relative">
            <button
              onClick={() => setIsSleepTimerMenuOpen((prev) => !prev)}
              aria-label="Pengatur Waktu Tidur"
              title={sleepTimerActive ? `Timer Tidur Aktif (${sleepTimerFormatted})` : 'Timer Tidur'}
              className={`h-11 px-3 rounded-[8px] flex items-center gap-1.5 transition-colors cursor-pointer ${
                sleepTimerActive
                  ? 'bg-[#1F1F23] text-[#F4F4F0]'
                  : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23]'
              }`}
            >
              <Moon size={20} strokeWidth={1.8} className={sleepTimerActive ? 'fill-current' : ''} />
              {sleepTimerActive && (
                <span className="font-mono text-xs text-[#F4F4F0]">{sleepTimerFormatted}</span>
              )}
            </button>

            {isSleepTimerMenuOpen && (
              <div
                ref={sleepMenuRef}
                className="absolute bottom-full mb-2 right-0 w-44 bg-[#1F1F23] rounded-[8px] shadow-[0_12px_32px_rgba(0,0,0,0.5)] p-2 z-50 text-xs animate-in fade-in duration-120"
              >
                <div className="px-3 py-1.5 text-[11px] font-normal text-[#8D8D93] uppercase tracking-wider mb-1">
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
                    className="w-full text-left px-3 py-2 rounded-[6px] text-[#F4F4F0] hover:bg-[#17171A] transition-colors"
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
                    className="w-full text-left px-3 py-2 rounded-[6px] text-[#E07A7A] hover:bg-[#17171A] transition-colors mt-1"
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
            className={`w-11 h-11 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer ${
              isOverviewOpen
                ? 'bg-[#1F1F23] text-[#F4F4F0]'
                : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23]'
            }`}
          >
            <Radio size={20} strokeWidth={1.8} />
          </button>
        )}

        {/* Antrean (Queue) */}
        {onToggleQueue && (
          <button
            onClick={onToggleQueue}
            aria-label="Antrean"
            title="Antrean Pemutar"
            className={`w-11 h-11 rounded-[8px] flex items-center justify-center transition-colors cursor-pointer ${
              isQueueOpen
                ? 'bg-[#1F1F23] text-[#F4F4F0]'
                : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23]'
            }`}
          >
            <ListMusic size={20} strokeWidth={1.8} />
          </button>
        )}

        {/* Equalizer */}
        <button
          onClick={onToggleEqualizer}
          aria-label="Equalizer"
          title="Equalizer 8-Band"
          className={`h-11 px-3.5 rounded-[8px] flex items-center gap-1.5 text-xs font-normal transition-colors cursor-pointer ${
            isEqualizerOpen
              ? 'bg-[#F4F4F0] text-[#0B0B0C]'
              : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23]'
          }`}
        >
          <Sliders size={18} strokeWidth={1.8} />
          <span>EQ</span>
        </button>

        {/* Volume: ikon 20px, slider 110x4px (isi --text #F4F4F0, lintasan --track #34343A) */}
        <div
          className="flex items-center gap-2 pl-2"
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
            className="p-1 rounded-[6px] text-[#8D8D93] hover:text-[#F4F4F0] transition-colors cursor-pointer"
          >
            {effectiveVolume === 0 ? (
              <VolumeX size={20} strokeWidth={1.8} />
            ) : effectiveVolume < 0.5 ? (
              <Volume1 size={20} strokeWidth={1.8} />
            ) : (
              <Volume2 size={20} strokeWidth={1.8} />
            )}
          </button>

          <div
            ref={volumeBarRef}
            onMouseDown={handleVolMouseDown}
            className="w-[110px] h-4 flex items-center group cursor-pointer relative"
          >
            <div className="w-full h-1 bg-[#34343A] rounded-[2px] overflow-hidden">
              <div
                className="h-full bg-[#F4F4F0] rounded-[2px] transition-all duration-75"
                style={{ width: `${effectiveVolume * 100}%` }}
              />
            </div>
            <div
              className={`absolute w-3 h-3 bg-[#F4F4F0] rounded-full shadow pointer-events-none -translate-x-1/2 transition-opacity duration-120 ${
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
