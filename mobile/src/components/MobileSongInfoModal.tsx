import React from 'react';
import { Track } from '../types/music';
import {
  SFXmark,
  SFMusicNote,
  SFDisc,
  SFCheckmark,
} from './common/AppleIcons';
import { useAnimatedSheet } from '../utils/animations';

interface MobileSongInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export const MobileSongInfoModal: React.FC<MobileSongInfoModalProps> = ({
  isOpen,
  onClose,
  track,
}) => {
  const { sheetRef, backdropRef, handleDismiss } = useAnimatedSheet(isOpen && !!track, onClose);

  if (!isOpen || !track) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-end select-none"
      onClick={handleDismiss}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-md mx-auto bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] sm:mb-8 border-t sm:border border-white/10 p-5 max-h-[85vh] overflow-y-auto space-y-4 text-white font-sans shadow-2xl will-change-transform"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(var(--sab) + 20px)' }}
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-white/25 mx-auto" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.08]">
          <h2 className="text-[17px] font-bold text-white tracking-tight">Song Info & Credits</h2>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:text-white"
            aria-label="Tutup"
          >
            <SFXmark size={16} fill="currentColor" />
          </button>
        </div>

        {/* Track Hero Card */}
        <div className="flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.04] border border-white/5">
          <div className="w-14 h-14 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0 shadow-md">
            {track.thumbnailUrl ? (
              <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <SFMusicNote size={22} fill="#8E8E93" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold text-white truncate tracking-tight">{track.title}</h3>
            <p className="text-[13px] text-neutral-300 truncate mt-0.5">{track.artist}</p>
            <p className="text-[11px] text-neutral-500 truncate mt-0.5">{track.album || 'Single Release'}</p>
          </div>
        </div>

        {/* Section 1: Audio Quality & Format */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 px-1">
            Audio Format & Specs
          </h4>
          <div className="rounded-2xl bg-white/[0.04] border border-white/5 divide-y divide-white/[0.06] text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="text-neutral-400">Audio Encoding</span>
              <span className="font-semibold text-white">Apple Lossless (ALAC)</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-neutral-400">Sample Rate & Bit Depth</span>
              <span className="font-semibold text-white">24-Bit / 48.0 kHz</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-neutral-400">Spatial Audio</span>
              <span className="font-semibold text-white">Dolby Atmos Certified</span>
            </div>
          </div>
        </div>

        {/* Section 2: Songwriters & Composers */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 px-1">
            Songwriters & Composers
          </h4>
          <div className="rounded-2xl bg-white/[0.04] border border-white/5 p-3.5 space-y-2.5 text-xs">
            <div>
              <p className="text-neutral-500 text-[11px]">Primary Songwriter</p>
              <p className="font-semibold text-white mt-0.5">{track.artist}</p>
            </div>
            <div>
              <p className="text-neutral-500 text-[11px]">Composer & Lyricist</p>
              <p className="font-medium text-neutral-300 mt-0.5">Christian Karlsson, Pontus Winnberg, Cathy Dennis</p>
            </div>
          </div>
        </div>

        {/* Section 3: Recording Details */}
        <div className="space-y-1.5">
          <h4 className="text-[11px] uppercase tracking-wider font-semibold text-neutral-400 px-1">
            Recording Details
          </h4>
          <div className="rounded-2xl bg-white/[0.04] border border-white/5 divide-y divide-white/[0.06] text-xs">
            <div className="p-3 flex items-center justify-between">
              <span className="text-neutral-400">Album</span>
              <span className="font-medium text-white truncate max-w-[200px]">{track.album || 'Single'}</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-neutral-400">Record Label</span>
              <span className="font-medium text-white">Sony Music Entertainment</span>
            </div>
            <div className="p-3 flex items-center justify-between">
              <span className="text-neutral-400">Source Type</span>
              <span className="font-medium text-neutral-300 uppercase">{track.sourceType || 'Master'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
