import React from 'react';
import { Track } from '../types/music';
import {
  SFXmark,
  SFPlus,
  SFArrowDown,
  SFMusicNote,
  SFStar,
  SFStarFill,
  SFPlayFill,
  SFListBullet,
} from './common/AppleIcons';
import { useAnimatedSheet } from '../utils/animations';

interface MobileSongActionMenuProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
  isFavorite?: boolean;
  onToggleFavorite?: (track: Track) => void;
  onAddToPlaylist?: (track: Track) => void;
  onPlayNext?: (track: Track) => void;
  onDownload?: (track: Track) => void;
  onOpenSongInfo?: (track: Track) => void;
}

export const MobileSongActionMenu: React.FC<MobileSongActionMenuProps> = ({
  isOpen,
  onClose,
  track,
  isFavorite = false,
  onToggleFavorite,
  onAddToPlaylist,
  onPlayNext,
  onDownload,
  onOpenSongInfo,
}) => {
  const { sheetRef, backdropRef, handleDismiss } = useAnimatedSheet(isOpen && !!track, onClose);

  if (!isOpen || !track) return null;

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-end select-none"
      onClick={handleDismiss}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-md mx-auto bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] sm:mb-8 border-t sm:border border-white/10 p-5 space-y-4 shadow-2xl text-white font-sans will-change-transform"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(var(--sab) + 20px)' }}
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-white/25 mx-auto" />

        {/* Track Header Card */}
        <div className="flex items-center gap-3.5 pb-3 border-b border-white/[0.08]">
          <div className="w-13 h-13 rounded-xl overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0">
            {track.thumbnailUrl ? (
              <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <SFMusicNote size={20} fill="#8E8E93" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-[16px] font-bold text-white truncate tracking-tight">{track.title}</h3>
            <p className="text-[13px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:text-white"
            aria-label="Tutup"
          >
            <SFXmark size={16} fill="currentColor" />
          </button>
        </div>

        {/* Action Buttons List */}
        <div className="space-y-1">
          {/* 1. Tambahkan ke Playlist */}
          <button
            onClick={() => {
              triggerHaptic(8);
              handleDismiss();
              if (onAddToPlaylist) onAddToPlaylist(track);
            }}
            className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors text-left"
          >
            <SFPlus size={19} fill="#FFFFFF" />
            <span className="text-[14.5px] font-medium text-white">Tambahkan ke Playlist</span>
          </button>

          {/* 2. Putar Berikutnya */}
          {onPlayNext && (
            <button
              onClick={() => {
                triggerHaptic(8);
                handleDismiss();
                onPlayNext(track);
              }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors text-left"
            >
              <SFPlayFill size={18} fill="#FFFFFF" />
              <span className="text-[14.5px] font-medium text-white">Putar Berikutnya</span>
            </button>
          )}

          {/* 3. Favoritkan */}
          {onToggleFavorite && (
            <button
              onClick={() => {
                triggerHaptic(10);
                onToggleFavorite(track);
                handleDismiss();
              }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors text-left"
            >
              {isFavorite ? (
                <>
                  <SFStarFill size={19} fill="#FFFFFF" />
                  <span className="text-[14.5px] font-medium text-white">Hapus dari Favorit</span>
                </>
              ) : (
                <>
                  <SFStar size={19} fill="#FFFFFF" />
                  <span className="text-[14.5px] font-medium text-white">Favoritkan Lagu</span>
                </>
              )}
            </button>
          )}

          {/* 4. Unduh Offline */}
          {onDownload && (
            <button
              onClick={() => {
                triggerHaptic(8);
                handleDismiss();
                onDownload(track);
              }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors text-left"
            >
              <SFArrowDown size={19} fill="#FFFFFF" />
              <span className="text-[14.5px] font-medium text-white">Unduh Offline</span>
            </button>
          )}

          {/* 5. Info Lagu & Kredit */}
          {onOpenSongInfo && (
            <button
              onClick={() => {
                triggerHaptic(8);
                handleDismiss();
                onOpenSongInfo(track);
              }}
              className="w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl hover:bg-white/[0.08] active:bg-white/[0.12] transition-colors text-left"
            >
              <SFMusicNote size={18} fill="#FFFFFF" />
              <span className="text-[14.5px] font-medium text-white">Info Lagu & Kredit</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
