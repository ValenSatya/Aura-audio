import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Maximize2, X, Music } from 'lucide-react';
import { Track } from '../types/music';

interface MiniPlayerState {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
}

export const MiniPlayerWidget: React.FC = () => {
  const [playerState, setPlayerState] = useState<MiniPlayerState>({
    currentTrack: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
  });

  useEffect(() => {
    if (!window.electronAPI?.onMiniState) return;
    const unsubscribe = window.electronAPI.onMiniState((state) => {
      setPlayerState(state);
    });
    return () => {
      unsubscribe();
    };
  }, []);

  const { currentTrack, isPlaying, currentTime, duration } = playerState;

  const handleAction = (action: string, payload?: any) => {
    if (window.electronAPI?.sendMiniAction) {
      window.electronAPI.sendMiniAction(action, payload);
    }
  };

  const handleClose = () => {
    if (window.electronAPI?.closeMiniPlayer) {
      window.electronAPI.closeMiniPlayer();
    }
  };

  const progressPercent =
    duration > 0 && isFinite(duration)
      ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
      : 0;

  const handleSeekClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (duration <= 0 || !isFinite(duration)) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    handleAction('seek', ratio * duration);
  };

  return (
    <div
      className="w-full h-full bg-[#17171A] rounded-[10px] flex flex-col justify-between p-3 select-none overflow-hidden shadow-2xl relative font-['Sora']"
      style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}
    >
      {/* Top Bar: Info + Window Controls */}
      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {/* Thumbnail */}
          <div className="w-12 h-12 rounded-[6px] bg-[#0B0B0C] overflow-hidden flex-shrink-0 flex items-center justify-center">
            {currentTrack?.thumbnailUrl ? (
              <img
                src={currentTrack.thumbnailUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Music size={18} className="text-[#8E8E93]" />
            )}
          </div>

          {/* Title & Artist */}
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-semibold text-[#F4F4F0] truncate leading-tight">
              {currentTrack?.title || 'Tidak Ada Lagu'}
            </h4>
            <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">
              {currentTrack?.artist || 'AuraAudio'}
            </p>
          </div>
        </div>

        {/* Action icons (expand & close) */}
        <div
          className="flex items-center gap-1 flex-shrink-0"
          style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
        >
          <button
            onClick={handleClose}
            className="p-1.5 text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] rounded-[6px] transition-colors cursor-pointer"
            title="Perbesar ke Aplikasi Utama"
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] rounded-[6px] transition-colors cursor-pointer"
            title="Tutup Mini Player"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Bottom Bar: Progress Bar & Playback Buttons */}
      <div
        className="flex items-center gap-3 mt-1.5"
        style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
      >
        {/* Seekbar */}
        <div
          onClick={handleSeekClick}
          className="flex-1 h-2 flex items-center cursor-pointer group relative py-1"
        >
          <div className="w-full h-1 bg-[#34343A] group-hover:h-1.5 rounded-[2px] overflow-hidden transition-all">
            <div
              className="h-full bg-[#3B82F6] transition-all rounded-[2px]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => handleAction('prev')}
            className="p-1.5 text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] rounded-[6px] transition-colors cursor-pointer"
            title="Sebelumnya"
          >
            <SkipBack size={14} />
          </button>

          <button
            onClick={() => handleAction(isPlaying ? 'pause' : 'play')}
            className="p-2 bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] rounded-full transition-colors shadow-sm cursor-pointer"
            title={isPlaying ? 'Jeda' : 'Putar'}
          >
            {isPlaying ? (
              <Pause size={13} className="fill-[#0B0B0C]" />
            ) : (
              <Play size={13} className="fill-[#0B0B0C] ml-0.5" />
            )}
          </button>

          <button
            onClick={() => handleAction('next')}
            className="p-1.5 text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] rounded-[6px] transition-colors cursor-pointer"
            title="Berikutnya"
          >
            <SkipForward size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
