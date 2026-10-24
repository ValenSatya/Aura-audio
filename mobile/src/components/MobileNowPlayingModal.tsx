import React, { useState, useEffect, useRef } from 'react';
import { Track, RepeatMode } from '../types/music';
import {
  SFChevronDown,
  SFEllipsis,
  SFHeart,
  SFHeartFill,
  SFShuffle,
  SFBackwardFill,
  SFForwardFill,
  SFPlayFill,
  SFPauseFill,
  SFAirplayAudio,
  SFListBullet,
  SFSliderHorizontal3,
  SFMusicNote,
  SFLaptopcomputer,
  SFIphone,
  SFCheckmark,
  SFArrowDownCircle,
  SFPlus,
} from './common/AppleIcons';
import { AuraSyncService } from '../services/auraSyncService';
import { MobileDownloadService } from '../services/mobileDownloadService';
import { MobileSongInfoModal } from './MobileSongInfoModal';
import { MobileAddToPlaylistModal } from './MobileAddToPlaylistModal';
import { upgradeThumbnailUrl, FALLBACK_COVER } from '../utils/imageUtils';
import {
  animate,
  AppleSprings,
  animateSheetEntrance,
  animateSheetExit,
  animatePress,
  animateCoverPop,
} from '../utils/animations';

interface MobileNowPlayingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  queue?: Track[];
  onTogglePlay: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (time: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onOpenEQ: () => void;
  onPlayTrack?: (track: Track) => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0 || !isFinite(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? `0${secs}` : secs}`;
}

function formatNegativeTime(current: number, total: number): string {
  if (isNaN(total) || total <= 0 || !isFinite(total)) return '-0:00';
  const remaining = Math.max(0, total - current);
  return `-${formatTime(remaining)}`;
}

export const MobileNowPlayingModal: React.FC<MobileNowPlayingModalProps> = ({
  isOpen,
  onClose,
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  isShuffle,
  queue = [],
  onTogglePlay,
  onNext,
  onPrev,
  onSeek,
  onToggleShuffle,
  onOpenEQ,
  onPlayTrack,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [scrubValue, setScrubValue] = useState(0);
  const [showQueue, setShowQueue] = useState(false);
  const [showOptionsMenu, setShowOptionsMenu] = useState(false);
  const [showAirplayModal, setShowAirplayModal] = useState(false);
  const [isSongInfoOpen, setIsSongInfoOpen] = useState(false);
  const [isAddToPlaylistOpen, setIsAddToPlaylistOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<'phone' | 'laptop'>('phone');
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ isConnected: boolean; user: any | null }>({
    isConnected: false,
    user: null,
  });

  const modalRef = useRef<HTMLDivElement>(null);
  const artRef = useRef<HTMLDivElement>(null);
  const playBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      animateSheetEntrance(modalRef.current);
    }
  }, [isOpen]);

  useEffect(() => {
    if (artRef.current) {
      animate(artRef.current, {
        scale: isPlaying ? 1 : 0.88,
        ease: AppleSprings.gentle,
      });
    }
  }, [isPlaying]);

  useEffect(() => {
    if (artRef.current) {
      animateCoverPop(artRef.current);
    }
  }, [currentTrack?.id]);

  const handleDismiss = () => {
    if (modalRef.current) {
      animateSheetExit(modalRef.current, onClose);
    } else {
      onClose();
    }
  };

  useEffect(() => {
    const unsubscribe = AuraSyncService.subscribe((data) => {
      setSyncStatus({ isConnected: data.isConnected, user: data.user });
    });
    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    setIsScrubbing(false);
    setScrubValue(0);
    setShowQueue(false);
    setShowOptionsMenu(false);
    if (currentTrack) {
      MobileDownloadService.isDownloaded(currentTrack.id).then(setIsDownloaded);
      setIsDownloading(MobileDownloadService.isDownloading(currentTrack.id));
    }
  }, [currentTrack?.id]);

  useEffect(() => {
    const unsub = MobileDownloadService.subscribe(() => {
      if (currentTrack) {
        MobileDownloadService.isDownloaded(currentTrack.id).then(setIsDownloaded);
        setIsDownloading(MobileDownloadService.isDownloading(currentTrack.id));
      }
    });
    return () => {
      unsub();
    };
  }, [currentTrack?.id]);

  if (!isOpen || !currentTrack) return null;

  const coverArtUrl = upgradeThumbnailUrl(currentTrack.thumbnailUrl, currentTrack.id);
  const effectiveDuration = (duration > 0 && isFinite(duration))
    ? duration
    : (currentTrack.duration > 0 ? currentTrack.duration : 180);
  const displayTime = isScrubbing ? scrubValue : currentTime;
  const progressPercent = effectiveDuration > 0
    ? Math.min(100, Math.max(0, (displayTime / effectiveDuration) * 100))
    : 0;

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  const handleSeekInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsScrubbing(true);
    setScrubValue(parseFloat(e.target.value));
  };

  const handlePointerDown = () => {
    setIsScrubbing(true);
    setScrubValue(currentTime);
  };

  const handlePointerUp = () => {
    setIsScrubbing(false);
    onSeek(scrubValue);
    triggerHaptic(6);
  };

  const handleDownloadToggle = async () => {
    triggerHaptic(12);
    if (isDownloaded) {
      await MobileDownloadService.removeDownload(currentTrack.id);
      setIsDownloaded(false);
    } else {
      setIsDownloading(true);
      await MobileDownloadService.downloadTrack(currentTrack);
      setIsDownloaded(true);
      setIsDownloading(false);
    }
  };

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 z-50 max-w-[430px] mx-auto sm:border-x sm:border-white/10 flex flex-col justify-between overflow-hidden select-none bg-black text-white will-change-transform"
      style={{
        paddingTop: 'calc(var(--sat) + 8px)',
        paddingBottom: 'calc(var(--sab) + 14px)',
      }}
    >
      {/* 1. Immersive Artwork Background (Matching Figma 642x600 Cover Art with linear gradient fade) */}
      <div className="absolute top-0 left-0 right-0 h-[58%] overflow-hidden pointer-events-none z-0">
        {coverArtUrl ? (
          <img
            src={coverArtUrl}
            alt=""
            className="w-full h-full object-cover scale-105 filter blur-md opacity-35"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black" />
      </div>

      {/* Top Header & Drag Handle (Higher Z-Index Stacking Context) */}
      <div className="relative z-40 px-6 pt-1 flex flex-col items-center flex-shrink-0">
        <div
          onClick={() => {
            triggerHaptic(5);
            handleDismiss();
          }}
          className="w-10 h-1 rounded-full bg-white/25 cursor-pointer active:bg-white/60 transition-colors mb-2.5"
          title="Tutup"
        />

        <div className="w-full flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic(6);
              handleDismiss();
            }}
            className="w-9 h-9 rounded-full liquid-glass-pill flex items-center justify-center text-white/80 active:text-white active:scale-95 transition-all"
            aria-label="Tutup"
          >
            <SFChevronDown size={20} fill="currentColor" />
          </button>

          <div className="text-center px-4 max-w-[210px]">
            <span className="text-[10px] uppercase font-bold tracking-widest text-white/45 block truncate">
              {currentTrack.album || 'Apple Music'}
            </span>
            <p className="text-[12px] font-semibold text-white/90 truncate mt-0.5">
              {showQueue ? 'Playing Next' : 'Now Playing'}
            </p>
          </div>

          <div className="relative">
            <button
              onClick={() => {
                triggerHaptic(6);
                setShowOptionsMenu(!showOptionsMenu);
              }}
              className="w-9 h-9 rounded-full liquid-glass-pill flex items-center justify-center text-white/80 active:text-white active:scale-95 transition-all"
              aria-label="Options"
            >
              <SFEllipsis size={20} fill="currentColor" />
            </button>

            {/* Apple Options Dropdown Sheet with High Elevation and True Z-Index */}
            {showOptionsMenu && (
              <>
                {/* Backdrop dismiss overlay */}
                <div
                  className="fixed inset-0 z-40 bg-transparent"
                  onClick={() => setShowOptionsMenu(false)}
                />
                <div
                  className="absolute right-0 top-11 w-64 bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-[0_24px_50px_rgba(0,0,0,0.95)] z-50 text-xs animate-in fade-in zoom-in-95 duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* 1. Tambahkan ke Playlist */}
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setIsAddToPlaylistOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    <SFPlus size={18} fill="#FFFFFF" />
                    <span>Tambahkan ke Playlist</span>
                  </button>

                  <div className="h-[1px] bg-white/[0.08] my-1" />

                  {/* 2. Unduh Offline */}
                  <button
                    onClick={async () => {
                      setShowOptionsMenu(false);
                      await handleDownloadToggle();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    {isDownloaded ? (
                      <SFCheckmark size={18} fill="#34d399" />
                    ) : (
                      <SFArrowDownCircle size={18} fill="#FFFFFF" />
                    )}
                    <span>{isDownloaded ? 'Hapus Unduhan' : 'Unduh Offline (0ms)'}</span>
                  </button>

                  <div className="h-[1px] bg-white/[0.08] my-1" />

                  {/* 3. Equalizer Studio */}
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      onOpenEQ();
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    <SFSliderHorizontal3 size={18} fill="#FFFFFF" />
                    <span>Equalizer Studio 8-Band</span>
                  </button>

                  <div className="h-[1px] bg-white/[0.08] my-1" />

                  {/* 4. Song Info */}
                  <button
                    onClick={() => {
                      setShowOptionsMenu(false);
                      setIsSongInfoOpen(true);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/10 text-white font-medium transition-colors"
                  >
                    <SFMusicNote size={18} fill="#FFFFFF" />
                    <span>Song Info & Credits</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Center Area: Large Artwork OR Queue List */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-7 min-h-0 py-2">
        {!showQueue ? (
          /* Large Square Cover Art (Matching Figma 642x600 in-the-zone cover) */
          <div
            ref={artRef}
            className="w-full max-w-[320px] aspect-square rounded-[22px] overflow-hidden shadow-[0_24px_60px_rgba(0,0,0,0.9)] border border-white/15 relative bg-neutral-900 flex items-center justify-center will-change-transform"
          >
            {coverArtUrl ? (
              <img
                src={coverArtUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover transition-transform duration-300"
                loading="eager"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (currentTrack.id && /^[a-zA-Z0-9_-]{11}$/.test(currentTrack.id) && !target.src.includes('hqdefault')) {
                    target.src = `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`;
                  } else {
                    target.src = FALLBACK_COVER;
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-3 text-white/30">
                <SFMusicNote size={64} fill="currentColor" />
                <span className="text-xs font-semibold tracking-wider uppercase text-white/40">
                  Apple Music
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Queue Drawer (Matching Figma mobile - player queue 3226:4431) */
          <div className="w-full max-w-[360px] h-full flex flex-col liquid-glass rounded-[24px] p-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <div>
                <h3 className="text-sm font-bold text-white">Playing Next</h3>
                <p className="text-[11px] text-white/50">{queue.length} Tracks in queue</p>
              </div>
              <button
                onClick={() => setShowQueue(false)}
                className="text-xs font-semibold text-[#FA2D48] px-3 py-1 rounded-full bg-white/5"
              >
                Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.06] pt-2 space-y-1">
              {queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  onClick={() => onPlayTrack && onPlayTrack(track)}
                  className={`flex items-center justify-between py-2.5 px-2 rounded-xl cursor-pointer active:bg-white/10 transition-colors ${
                    track.id === currentTrack.id ? 'bg-white/[0.08]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-9 h-9 rounded-[6px] overflow-hidden bg-neutral-800 flex-shrink-0">
                      {track.thumbnailUrl ? (
                        <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <SFMusicNote size={14} fill="#8E8E93" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-semibold text-white truncate">{track.title}</p>
                      <p className="text-[11px] text-white/50 truncate mt-0.5">{track.artist}</p>
                    </div>
                  </div>

                  {track.id === currentTrack.id && (
                    <span className="text-[10px] font-bold text-[#FA2D48] bg-[#FA2D48]/15 px-2 py-0.5 rounded-full">
                      Playing
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Control Section (Matching Figma Player 402x346) */}
      <div className="relative z-10 px-7 pb-2 space-y-3.5 flex-shrink-0">
        {/* Track Title & Artist (Matching Figma Frame 4: 20px SF Pro bold, 18px SF Pro medium) */}
        <div className="text-left">
          <h2 className="text-[20px] font-bold text-white tracking-tight leading-snug line-clamp-1">
            {currentTrack.title}
          </h2>
          <p className="text-[18px] text-white/70 font-medium tracking-tight line-clamp-1 mt-0.5">
            {currentTrack.artist}
          </p>
        </div>

        {/* The Signature Figma 3-Pill Action Row (Matching Figma Frame 196: 50x50, 158x50, 50x50 with Liquid Glass) */}
        <div className="flex items-center justify-between gap-3 pt-0.5">
          {/* Left Pill (50x50): AirPlay / Download Status (Figma Symbol 􀌮) */}
          <button
            onClick={() => {
              triggerHaptic(8);
              handleDownloadToggle();
            }}
            className={`w-[50px] h-[50px] rounded-full liquid-glass-pill flex items-center justify-center active:scale-95 transition-all ${
              isDownloaded ? 'text-emerald-400 border-emerald-500/40' : 'text-white/80 hover:text-white'
            }`}
            aria-label="Download Offline"
            title={isDownloaded ? 'Downloaded Offline (0ms)' : 'Download Offline'}
          >
            {isDownloading ? (
              <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : isDownloaded ? (
              <SFCheckmark size={20} fill="#34d399" />
            ) : (
              <SFArrowDownCircle size={22} fill="currentColor" />
            )}
          </button>

          {/* Center Pill (158x50): Heart (􀋂), Shuffle (􀑪), More Options (􀍠) */}
          <div className="flex-1 max-w-[190px] h-[50px] rounded-full liquid-glass-pill px-3 flex items-center justify-around">
            {/* 1. Favorite Heart */}
            <button
              onClick={() => {
                triggerHaptic(10);
                setIsLiked(!isLiked);
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform"
              aria-label="Favorite"
            >
              {isLiked ? (
                <SFHeartFill size={20} fill="#FA2D48" />
              ) : (
                <SFHeart size={20} fill="#FFFFFF" />
              )}
            </button>

            {/* 2. Shuffle Toggle */}
            <button
              onClick={() => {
                triggerHaptic(8);
                onToggleShuffle();
              }}
              className={`w-10 h-10 rounded-full flex items-center justify-center active:scale-90 transition-transform ${
                isShuffle ? 'text-[#FA2D48]' : 'text-white/70 hover:text-white'
              }`}
              aria-label="Shuffle"
            >
              <SFShuffle size={19} fill="currentColor" />
            </button>

            {/* 3. More / Equalizer */}
            <button
              onClick={() => {
                triggerHaptic(8);
                onOpenEQ();
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center text-white/70 hover:text-white active:scale-90 transition-transform"
              aria-label="Equalizer"
            >
              <SFSliderHorizontal3 size={19} fill="currentColor" />
            </button>
          </div>

          {/* Right Pill (50x50): Queue Drawer Toggle (Figma Symbol 􀋲) */}
          <button
            onClick={() => {
              triggerHaptic(8);
              setShowQueue(!showQueue);
            }}
            className={`w-[50px] h-[50px] rounded-full liquid-glass-pill flex items-center justify-center active:scale-95 transition-all ${
              showQueue ? 'bg-white/20 text-white' : 'text-white/80 hover:text-white'
            }`}
            aria-label="Queue"
            title="Queue"
          >
            <SFListBullet size={20} fill="currentColor" />
          </button>
        </div>

        {/* Scrubber Progress Bar & Exact Dolby Atmos Badge (Matching Figma Frame 482 / Frame 193 / Frame 357) */}
        <div className="space-y-2 pt-1">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={effectiveDuration}
              value={displayTime}
              onChange={handleSeekInput}
              onPointerDown={handlePointerDown}
              onPointerUp={handlePointerUp}
              onTouchStart={handlePointerDown}
              onTouchEnd={handlePointerUp}
              onMouseDown={handlePointerDown}
              onMouseUp={handlePointerUp}
              style={{
                background: `linear-gradient(to right, #FFFFFF 0%, #FFFFFF ${progressPercent}%, rgba(255, 255, 255, 0.22) ${progressPercent}%, rgba(255, 255, 255, 0.22) 100%)`,
              }}
              className="scrubber-slider w-full cursor-pointer"
              aria-label="Audio duration scrubber"
            />
          </div>
          <div className="flex justify-between items-center text-[12px] font-medium tabular-nums text-white/60 px-0.5">
            <span>{formatTime(displayTime)}</span>
            {/* Exact Dolby Atmos Badge Image from Figma */}
            <img
              src="/assets/badge_dolby_atmos.png"
              alt="Dolby Atmos"
              className="h-[14px] w-auto opacity-80"
            />
            <span>{formatNegativeTime(displayTime, effectiveDuration)}</span>
          </div>
        </div>

        {/* Primary 5-Control Transport Row (Matching Figma Frame 32 / Frame 5: Star, Prev, Play Glyph, Next, Audio) */}
        <div className="flex items-center justify-between px-2 pt-1 pb-1">
          {/* Star / Favorite Indicator (􀑢) */}
          <button
            onClick={() => {
              triggerHaptic(8);
              setIsLiked(!isLiked);
            }}
            className="w-9 h-9 flex items-center justify-center text-white/60 active:scale-90 transition-transform"
            aria-label="Favorite"
          >
            {isLiked ? (
              <SFHeartFill size={20} fill="#FA2D48" />
            ) : (
              <SFHeart size={20} fill="rgba(255,255,255,0.7)" />
            )}
          </button>

          {/* Previous Track (􀊊 20px) */}
          <button
            onClick={() => {
              triggerHaptic(8);
              onPrev();
            }}
            className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label="Previous Track"
          >
            <SFBackwardFill size={22} fill="#FFFFFF" />
          </button>

          {/* Play / Pause Glyph Button (Matching Figma 􀊄 32px raw glyph icon) */}
          <button
            ref={playBtnRef}
            onClick={() => {
              triggerHaptic(12);
              if (playBtnRef.current) animatePress(playBtnRef.current);
              onTogglePlay();
            }}
            className="w-12 h-12 flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <SFPauseFill size={34} fill="#FFFFFF" />
            ) : (
              <SFPlayFill size={34} fill="#FFFFFF" className="translate-x-0.5" />
            )}
          </button>

          {/* Next Track (􀊌 20px) */}
          <button
            onClick={() => {
              triggerHaptic(8);
              onNext();
            }}
            className="w-10 h-10 flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label="Next Track"
          >
            <SFForwardFill size={22} fill="#FFFFFF" />
          </button>

          {/* AirPlay / Audio Output (Play Options Icons) */}
          <button
            onClick={() => {
              triggerHaptic(8);
              setShowAirplayModal(true);
            }}
            className={`w-9 h-9 flex items-center justify-center transition-all active:scale-90 ${
              selectedDevice === 'laptop' ? 'text-emerald-400' : 'text-white/60 hover:text-white'
            }`}
            aria-label="Audio Output"
          >
            <SFAirplayAudio size={20} fill="currentColor" />
          </button>
        </div>
      </div>

      {/* AirPlay / Output Device Sheet */}
      {showAirplayModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-end justify-center animate-in fade-in duration-150"
          onClick={() => setShowAirplayModal(false)}
        >
          <div
            className="w-full bg-[#1C1C1E] rounded-t-[28px] border-t border-white/10 p-6 space-y-4 max-w-lg"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: 'calc(var(--sab) + 20px)' }}
          >
            <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-2" />
            <h3 className="text-base font-bold text-white text-center">Audio Output</h3>

            <div className="space-y-2 pt-2">
              <button
                onClick={() => {
                  setSelectedDevice('phone');
                  setShowAirplayModal(false);
                }}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  selectedDevice === 'phone'
                    ? 'bg-white/10 border-white/25 text-white'
                    : 'bg-white/[0.04] border-white/5 text-white/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <SFIphone size={22} fill="currentColor" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">This iPhone / Device</p>
                    <p className="text-xs text-white/50">Internal Speaker • Hi-Res Audio</p>
                  </div>
                </div>
                {selectedDevice === 'phone' && <SFCheckmark size={18} fill="#34d399" />}
              </button>

              <button
                onClick={() => {
                  if (syncStatus.isConnected) {
                    setSelectedDevice('laptop');
                    setShowAirplayModal(false);
                  }
                }}
                disabled={!syncStatus.isConnected}
                className={`w-full flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                  selectedDevice === 'laptop'
                    ? 'bg-white/10 border-white/25 text-white'
                    : syncStatus.isConnected
                    ? 'bg-white/[0.04] border-white/5 text-white/70'
                    : 'bg-white/[0.02] border-white/5 text-white/30 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center gap-3">
                  <SFLaptopcomputer size={22} fill="currentColor" />
                  <div className="text-left">
                    <p className="text-sm font-semibold">Laptop / Studio (AuraSync)</p>
                    <p className="text-xs text-white/50">
                      {syncStatus.isConnected
                        ? 'Connected • Lossless 24-bit/96kHz'
                        : 'Searching on local Wi-Fi...'}
                    </p>
                  </div>
                </div>
                {selectedDevice === 'laptop' && <SFCheckmark size={18} fill="#34d399" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Song Info & Credits Sheet */}
      <MobileSongInfoModal
        isOpen={isSongInfoOpen}
        onClose={() => setIsSongInfoOpen(false)}
        track={currentTrack}
      />

      {/* Add To Playlist Sheet */}
      <MobileAddToPlaylistModal
        isOpen={isAddToPlaylistOpen}
        onClose={() => setIsAddToPlaylistOpen(false)}
        track={currentTrack}
      />
    </div>
  );
};
