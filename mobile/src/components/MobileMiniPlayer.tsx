import React, { useRef, useEffect, useState } from 'react';
import { Track } from '../types/music';
import { SFPlayFill, SFPauseFill, SFHeartFill, SFHeart, SFMusicNote } from './common/AppleIcons';
import { animatePress, animateCoverPop } from '../utils/animations';
import { upgradeThumbnailUrl } from '../utils/imageUtils';

interface MobileMiniPlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  onTogglePlay: () => void;
  onNext: () => void;
  onOpenNowPlaying: () => void;
}

export const MobileMiniPlayer: React.FC<MobileMiniPlayerProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  onTogglePlay,
  onOpenNowPlaying,
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const progressFillRef = useRef<HTMLDivElement | null>(null);
  const coverRef = useRef<HTMLDivElement | null>(null);
  const playBtnRef = useRef<HTMLButtonElement | null>(null);
  const likeBtnRef = useRef<HTMLButtonElement | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const lastSyncTimeRef = useRef<number>(currentTime);
  const lastSyncTimestampRef = useRef<number>(performance.now());

  const progressPercent = duration > 0 ? Math.min(100, Math.max(0, (currentTime / duration) * 100)) : 0;

  useEffect(() => {
    if (coverRef.current) {
      animateCoverPop(coverRef.current);
    }
    if (progressFillRef.current) {
      progressFillRef.current.style.transform = 'scaleX(0)';
    }
    lastSyncTimeRef.current = 0;
    lastSyncTimestampRef.current = performance.now();
  }, [currentTrack?.id]);

  useEffect(() => {
    lastSyncTimeRef.current = currentTime;
    lastSyncTimestampRef.current = performance.now();
    if (!isPlaying && progressFillRef.current) {
      const ratio = duration > 0 ? Math.min(1, Math.max(0, currentTime / duration)) : 0;
      progressFillRef.current.style.transform = `scaleX(${ratio})`;
    }
  }, [currentTime, isPlaying, duration]);

  useEffect(() => {
    if (!isPlaying || duration <= 0) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const updateFrame = () => {
      const elapsed = (performance.now() - lastSyncTimestampRef.current) / 1000;
      const estimatedTime = Math.min(duration, Math.max(0, lastSyncTimeRef.current + elapsed));
      const ratio = duration > 0 ? Math.min(1, Math.max(0, estimatedTime / duration)) : 0;

      if (progressFillRef.current) {
        progressFillRef.current.style.transform = `scaleX(${ratio})`;
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
  }, [isPlaying, duration]);

  if (!currentTrack) return null;

  const handlePlayToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {}
    if (playBtnRef.current) animatePress(playBtnRef.current);
    onTogglePlay();
  };

  const handleLikeToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {}
    if (likeBtnRef.current) animatePress(likeBtnRef.current);
    setIsLiked(!isLiked);
  };

  return (
    <div
      className="fixed bottom-[74px] left-0 right-0 z-40 flex justify-center pointer-events-none select-none"
      style={{ paddingBottom: 'calc(var(--sab) + 2px)' }}
    >
      {/* 346x54px Floating Card with Liquid Glass (Matching Figma Big Player) */}
      <div
        onClick={onOpenNowPlaying}
        className="w-[346px] max-w-[92vw] h-[54px] liquid-glass rounded-[16px] px-3 flex items-center justify-between relative overflow-hidden pointer-events-auto cursor-pointer active:scale-[0.985] transition-all duration-150"
      >
        {/* Subtle Top Progress Bar */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-white/[0.08] overflow-hidden">
          <div
            ref={progressFillRef}
            className="w-full h-full bg-white origin-left will-change-transform shadow-[0_0_8px_rgba(255,255,255,0.8)]"
            style={{ transform: `scaleX(${progressPercent / 100})` }}
          />
        </div>

        {/* Artwork & Info (Matching Figma Wrapper / Frame 7) */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-2">
          <div
            ref={coverRef}
            className="w-[34px] h-[34px] rounded-[6px] overflow-hidden bg-neutral-900 shadow-sm flex-shrink-0 flex items-center justify-center border border-white/10 will-change-transform"
          >
            {currentTrack.thumbnailUrl ? (
              <img
                src={upgradeThumbnailUrl(currentTrack.thumbnailUrl, currentTrack.id)}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                loading="eager"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (currentTrack.id && !target.src.includes('hqdefault')) {
                    target.src = `https://i.ytimg.com/vi/${currentTrack.id}/hqdefault.jpg`;
                  } else {
                    target.style.display = 'none';
                  }
                }}
              />
            ) : (
              <SFMusicNote size={16} fill="#8E8E93" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-medium text-white truncate leading-tight tracking-tight">
              {currentTrack.title}
            </p>
            <p className="text-[13px] text-white/55 truncate leading-tight mt-0.5 tracking-tight">
              {currentTrack.artist}
            </p>
          </div>
        </div>

        {/* Controls: Heart & Play Glyph (Matching Figma Frame 34) */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <button
            ref={likeBtnRef}
            onClick={handleLikeToggle}
            className="w-7 h-7 flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label="Favorite"
          >
            {isLiked ? (
              <SFHeartFill size={18} fill="#FA2D48" />
            ) : (
              <SFHeart size={18} fill="#FFFFFF" />
            )}
          </button>

          <button
            ref={playBtnRef}
            onClick={handlePlayToggle}
            className="w-8 h-8 flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <SFPauseFill size={22} fill="#FFFFFF" />
            ) : (
              <SFPlayFill size={22} fill="#FFFFFF" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
