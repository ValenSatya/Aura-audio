import React, { useState, useEffect } from 'react';
import { Track } from '../types/music';
import {
  SFXmark,
  SFPlus,
  SFCheckmark,
  SFListBullet,
  SFMusicNote,
} from './common/AppleIcons';
import { MobilePlaylistStorage, CustomPlaylist } from '../services/mobilePlaylistStorage';
import { useAnimatedSheet } from '../utils/animations';

interface MobileAddToPlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  track: Track | null;
}

export const MobileAddToPlaylistModal: React.FC<MobileAddToPlaylistModalProps> = ({
  isOpen,
  onClose,
  track,
}) => {
  const { sheetRef, backdropRef, handleDismiss } = useAnimatedSheet(isOpen && !!track, onClose);
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>([]);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPlaylists(MobilePlaylistStorage.getPlaylists());
      setIsCreatingNew(false);
      setNewPlaylistName('');
      setAddedPlaylistId(null);
    }
    const unsub = MobilePlaylistStorage.subscribe((updated) => setPlaylists(updated));
    return unsub;
  }, [isOpen]);

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  if (!isOpen || !track) return null;

  const handleAddToPlaylist = (playlistId: string) => {
    triggerHaptic(12);
    MobilePlaylistStorage.addTrackToPlaylist(playlistId, track);
    setAddedPlaylistId(playlistId);
    setTimeout(() => {
      handleDismiss();
    }, 450);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;
    triggerHaptic(14);
    const created = MobilePlaylistStorage.createPlaylist(newPlaylistName.trim(), [track]);
    setAddedPlaylistId(created.id);
    setTimeout(() => {
      handleDismiss();
    }, 450);
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex flex-col justify-end select-none"
      onClick={handleDismiss}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-md mx-auto bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] sm:mb-8 border-t sm:border border-white/10 p-5 max-h-[85vh] flex flex-col shadow-2xl text-white font-sans will-change-transform"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(var(--sab) + 20px)' }}
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-3" />

        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <h2 className="text-[17px] font-bold text-white tracking-tight">Tambahkan ke Playlist</h2>
          <button
            onClick={handleDismiss}
            className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:text-white"
            aria-label="Tutup"
          >
            <SFXmark size={16} fill="currentColor" />
          </button>
        </div>

        {/* Selected Track Preview */}
        <div className="flex items-center gap-3 py-3 px-1 border-b border-white/[0.06]">
          <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-900 border border-white/10 flex-shrink-0">
            {track.thumbnailUrl ? (
              <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <SFMusicNote size={18} fill="#8E8E93" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-[14px] font-semibold text-white truncate tracking-tight">{track.title}</h4>
            <p className="text-[12px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
          </div>
        </div>

        {/* Playlists List Container */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2">
          {/* Create New Playlist Button / Form */}
          {!isCreatingNew ? (
            <button
              onClick={() => {
                triggerHaptic(8);
                setIsCreatingNew(true);
              }}
              className="w-full flex items-center gap-3.5 p-3 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] active:scale-[0.99] border border-white/5 transition-all text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <SFPlus size={20} fill="#FFFFFF" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-semibold text-white">Daftar Putar Baru...</p>
                <p className="text-[12px] text-neutral-400">Buat playlist baru untuk lagu ini</p>
              </div>
            </button>
          ) : (
            <form onSubmit={handleCreateAndAdd} className="p-3 rounded-2xl bg-white/[0.08] border border-white/10 space-y-2.5">
              <label className="text-xs font-semibold text-neutral-300 block">Nama Daftar Putar Baru</label>
              <input
                type="text"
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                placeholder="cth. Lagu Santai Malam"
                autoFocus
                className="w-full px-3.5 py-2.5 rounded-xl bg-black/50 border border-white/15 text-white text-sm focus:outline-none focus:border-white/40"
              />
              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsCreatingNew(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-neutral-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-white text-black disabled:opacity-40"
                >
                  Buat & Tambahkan
                </button>
              </div>
            </form>
          )}

          {/* Existing Playlists */}
          <div className="space-y-1 pt-1">
            {playlists.map((pl) => {
              const alreadyInPlaylist = pl.tracks.some((t) => t.id === track.id);
              const isJustAdded = addedPlaylistId === pl.id;

              return (
                <button
                  key={pl.id}
                  onClick={() => handleAddToPlaylist(pl.id)}
                  className="w-full flex items-center justify-between p-2.5 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.1] transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-lg overflow-hidden bg-neutral-800 border border-white/5 flex items-center justify-center flex-shrink-0">
                      {pl.coverUrl ? (
                        <img src={pl.coverUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <SFListBullet size={20} fill="#8E8E93" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[14.5px] font-semibold text-white truncate">{pl.name}</p>
                      <p className="text-[12px] text-neutral-400 truncate mt-0.5">
                        {pl.tracks.length} lagu {alreadyInPlaylist ? '• Sudah ada' : ''}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center w-7 h-7 flex-shrink-0">
                    {isJustAdded || alreadyInPlaylist ? (
                      <div className="w-6 h-6 rounded-full bg-white text-black flex items-center justify-center">
                        <SFCheckmark size={14} fill="#000000" />
                      </div>
                    ) : (
                      <SFPlus size={18} fill="rgba(255,255,255,0.4)" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
