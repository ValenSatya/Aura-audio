import React, { useState } from 'react';
import { Track } from '../../types/music';
import { SFAirplayAudio, SFPlayFill, SFPauseFill } from './AppleIcons';

interface DynamicIslandBarProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  isSynced: boolean;
  syncUser?: string;
  onOpenNowPlaying: () => void;
  onTogglePlay: () => void;
}

export const DynamicIslandBar: React.FC<DynamicIslandBarProps> = ({
  currentTrack,
  isPlaying,
  isSynced,
  syncUser = 'Shko',
  onOpenNowPlaying,
  onTogglePlay,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className="w-full flex justify-center items-center pointer-events-auto z-40 px-4 pt-1 select-none"
      style={{
        paddingTop: 'max(env(safe-area-inset-top, 8px), 10px)',
      }}
    >
      <div
        onClick={() => {
          if (!isExpanded) {
            setIsExpanded(true);
          } else {
            onOpenNowPlaying();
            setIsExpanded(false);
          }
        }}
        className={`bg-black/90 backdrop-blur-3xl border border-white/[0.15] shadow-[0_10px_30px_rgba(0,0,0,0.8)] rounded-full transition-all duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] flex items-center justify-between cursor-pointer active:scale-98 ${
          isExpanded
            ? 'w-[92vw] max-w-[360px] h-[48px] px-4'
            : currentTrack
            ? 'w-[200px] h-[35px] px-3'
            : 'w-[140px] h-[32px] px-2.5'
        }`}
      >
        {/* Left Section: Spectrum Equalizer or Dynamic Dot */}
        <div className="flex items-center gap-2 min-w-0">
          {isPlaying ? (
            <div className="flex items-end gap-[2px] h-[14px]">
              <span className="w-[2.5px] bg-[#FA2D48] rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-3" />
              <span className="w-[2.5px] bg-[#FA2D48] rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-full" />
              <span className="w-[2.5px] bg-[#FA2D48] rounded-full animate-[pulse_0.4s_ease-in-out_infinite] h-2" />
            </div>
          ) : (
            <div
              className={`w-2 h-2 rounded-full ${
                isSynced ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-[#FA2D48]'
              }`}
            />
          )}

          <span className="text-[11px] font-semibold text-white/90 truncate tracking-tight">
            {isExpanded
              ? currentTrack?.title || 'AuraAudio'
              : isSynced
              ? `Sync: ${syncUser}`
              : currentTrack
              ? currentTrack.title
              : 'AuraAudio'}
          </span>
        </div>

        {/* Right Section: Mini Controls or Airplay Icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {isExpanded ? (
            <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={onTogglePlay}
                className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center active:scale-90 transition-transform"
              >
                {isPlaying ? <SFPauseFill size={14} fill="#000" /> : <SFPlayFill size={14} fill="#000" className="ml-0.5" />}
              </button>
              <button onClick={onOpenNowPlaying} className="text-white/60 hover:text-white">
                <SFAirplayAudio size={16} fill="currentColor" />
              </button>
            </div>
          ) : currentTrack?.thumbnailUrl ? (
            <img
              src={currentTrack.thumbnailUrl}
              alt=""
              className="w-5 h-5 rounded-full object-cover border border-white/20"
            />
          ) : (
            <SFAirplayAudio size={14} className="text-white/40" />
          )}
        </div>
      </div>
    </div>
  );
};
