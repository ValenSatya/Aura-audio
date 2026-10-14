import React, { useState, useEffect } from 'react';
import { CustomPlaylist } from '../types/music';
import { FolderPlus, ListMusic, X, Plus, Check } from 'lucide-react';

interface PlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  playlists: CustomPlaylist[];
  onCreatePlaylist: (name: string, description?: string, trackIds?: string[]) => void;
  onAddToPlaylist: (playlistId: string, trackIds: string[]) => void;
  selectedTrackIds?: string[];
  initialMode?: 'create' | 'add_to';
}

export const PlaylistModal: React.FC<PlaylistModalProps> = ({
  isOpen,
  onClose,
  playlists,
  onCreatePlaylist,
  onAddToPlaylist,
  selectedTrackIds = [],
  initialMode = 'create',
}) => {
  const [mode, setMode] = useState<'create' | 'add_to'>(initialMode);
  const [playlistName, setPlaylistName] = useState('');
  const [playlistDescription, setPlaylistDescription] = useState('');
  const [addedPlaylistId, setAddedPlaylistId] = useState<string | null>(null);

  // Sync mode whenever modal opens or initialMode changes
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setAddedPlaylistId(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playlistName.trim()) return;

    onCreatePlaylist(
      playlistName.trim(),
      playlistDescription.trim() || undefined,
      selectedTrackIds
    );
    setPlaylistName('');
    setPlaylistDescription('');
    onClose();
  };

  const handleSelectPlaylist = (plId: string) => {
    onAddToPlaylist(plId, selectedTrackIds);
    setAddedPlaylistId(plId);
    setTimeout(() => {
      setAddedPlaylistId(null);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 font-['Sora'] select-none">
      <div className="w-full max-w-md bg-[#17171A] rounded-[10px] shadow-2xl p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[8px] bg-[#1F1F23] flex items-center justify-center text-[#F4F4F0]">
              {mode === 'create' ? <FolderPlus size={18} /> : <ListMusic size={18} />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#F4F4F0]">
                {mode === 'create'
                  ? 'Buat Playlist Baru'
                  : 'Masukkan ke Playlist'}
              </h3>
              <p className="text-xs text-[#8D8D93] mt-0.5">
                {mode === 'create'
                  ? 'Simpan koleksi lagu kustom Anda sendiri'
                  : selectedTrackIds.length > 0
                  ? `Pilih playlist tujuan untuk ${selectedTrackIds.length} lagu`
                  : 'Pilih playlist tujuan'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-[8px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Mode: Add To Playlist */}
        {mode === 'add_to' && (
          <div className="space-y-3">
            {/* Quick button to create new playlist */}
            <button
              onClick={() => setMode('create')}
              className="w-full h-10 px-4 bg-[#1F1F23] hover:bg-[#34343A] rounded-[8px] text-xs font-medium text-[#F4F4F0] flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus size={14} className="text-[#8D8D93]" />
              <span>+ Buat Playlist Baru</span>
            </button>

            {/* List of existing playlists */}
            <div className="max-h-60 overflow-y-auto space-y-1.5 pt-2">
              {playlists.length === 0 ? (
                <div className="text-center py-6 text-xs text-[#8D8D93] space-y-2">
                  <p>Belum ada playlist kustom.</p>
                  <p className="text-[11px] text-[#8D8D93]/70">Klik tombol di atas untuk membuat playlist baru bagi lagu ini.</p>
                </div>
              ) : (
                playlists.map((pl) => {
                  const isDone = addedPlaylistId === pl.id;
                  return (
                    <button
                      key={pl.id}
                      onClick={() => handleSelectPlaylist(pl.id)}
                      disabled={isDone}
                      className="w-full flex items-center justify-between p-3 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] transition-all text-left cursor-pointer group"
                    >
                      <div className="min-w-0 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-[6px] bg-[#34343A] flex items-center justify-center text-[#8D8D93] group-hover:text-[#F4F4F0]">
                          <ListMusic size={15} />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-medium text-[#F4F4F0] truncate">{pl.name}</h4>
                          <p className="text-[10px] text-[#8D8D93] font-['JetBrains_Mono']">
                            {pl.tracks ? pl.tracks.length : pl.trackIds.length} lagu
                          </p>
                        </div>
                      </div>

                      {isDone ? (
                        <div className="flex items-center gap-1 text-[#F4F4F0] text-xs font-medium">
                          <Check size={14} />
                          <span>Dimasukkan</span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#8D8D93] group-hover:text-[#F4F4F0] font-medium transition-colors">
                          Pilih
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Mode: Create Playlist */}
        {mode === 'create' && (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#F4F4F0] mb-1.5">
                Nama Playlist <span className="text-[#8D8D93]">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="Contoh: Lagu Favoritku, Chill Night..."
                value={playlistName}
                onChange={(e) => setPlaylistName(e.target.value)}
                className="w-full h-10 px-3.5 bg-[#1F1F23] rounded-[8px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#F4F4F0] mb-1.5">
                Deskripsi <span className="text-[#8D8D93]">(Opsional)</span>
              </label>
              <textarea
                rows={2}
                placeholder="Deskripsi singkat playlist..."
                value={playlistDescription}
                onChange={(e) => setPlaylistDescription(e.target.value)}
                className="w-full p-3 bg-[#1F1F23] rounded-[8px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none resize-none"
              />
            </div>

            {selectedTrackIds.length > 0 && (
              <p className="text-[11px] text-[#8D8D93] bg-[#1F1F23] p-3 rounded-[8px]">
                ✨ <strong className="text-[#F4F4F0]">{selectedTrackIds.length} lagu</strong> yang sedang dipilih akan otomatis dimasukkan ke playlist baru ini.
              </p>
            )}

            <div className="flex items-center justify-end gap-2.5 pt-2">
              {initialMode === 'add_to' && (
                <button
                  type="button"
                  onClick={() => setMode('add_to')}
                  className="px-4 h-10 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-[#8D8D93] text-xs font-medium transition-colors cursor-pointer"
                >
                  Kembali
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="px-4 h-10 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-[#8D8D93] hover:text-[#F4F4F0] text-xs font-medium transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!playlistName.trim()}
                className="px-5 h-10 rounded-[8px] bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer"
              >
                Buat Playlist
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
