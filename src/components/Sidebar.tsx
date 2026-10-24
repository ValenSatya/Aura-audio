import React, { useState } from 'react';
import { PlaylistFilter, Track, UserProfile, CustomPlaylist } from '../types/music';
import {
  Library,
  Heart,
  Download,
  Plus,
  Music,
  Trash2,
  FolderPlus,
  Play,
  HardDrive,
  ListPlus,
  Disc,
} from 'lucide-react';

interface SidebarProps {
  currentFilter: PlaylistFilter;
  onFilterChange: (filter: PlaylistFilter) => void;
  tracks?: Track[];
  onOpenImportModal?: (tab?: 'youtube' | 'playlist' | 'local' | 'spotify') => void;
  userProfile?: UserProfile;
  onOpenAuthModal?: () => void;
  onOpenSettings?: () => void;
  activeView: 'ytmusic' | 'library' | 'custom_playlist' | 'stage';
  onViewChange: (view: 'ytmusic' | 'library' | 'custom_playlist' | 'stage') => void;
  ytSubTab: 'liked' | 'playlists' | 'search';
  onYtSubTabChange: (tab: 'liked' | 'playlists' | 'search') => void;
  customPlaylists?: CustomPlaylist[];
  activeCustomPlaylistId?: string | null;
  onSelectCustomPlaylist?: (id: string) => void;
  onOpenCreatePlaylist?: () => void;
  onDeleteCustomPlaylist?: (id: string) => void;
  onDownloadBatch?: (tracks: Track[]) => void;
  isQueueOpen?: boolean;
  onToggleQueue?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentFilter,
  onFilterChange,
  tracks = [],
  onOpenImportModal,
  activeView,
  onViewChange,
  ytSubTab,
  onYtSubTabChange,
  customPlaylists = [],
  activeCustomPlaylistId,
  onSelectCustomPlaylist,
  onOpenCreatePlaylist,
  onDeleteCustomPlaylist,
}) => {
  const [sidebarFilter, setSidebarFilter] = useState<'all' | 'playlists' | 'liked' | 'offline'>('all');

  const offlineTracksCount = tracks.filter((t) => t.isOffline || t.sourceType === 'local').length;

  const isLikedActive = activeView === 'ytmusic' && ytSubTab === 'liked';
  const isOfflineActive = activeView === 'library' && currentFilter === 'offline';
  const isAllTracksActive = activeView === 'library' && currentFilter === 'all';

  return (
    <aside
      className="w-64 xl:w-72 h-full rounded-[20px] bg-[#121215] border border-white/[0.08] shadow-2xl flex flex-col overflow-hidden select-none z-20 flex-shrink-0"
      aria-label="Koleksi dan Playlist"
    >
      {/* Header Koleksi Kamu */}
      <div className="p-4 pb-2 border-b border-white/[0.06] flex items-center justify-between gap-2 flex-shrink-0">
        <div
          onClick={() => {
            onViewChange('library');
            onFilterChange('all');
          }}
          className="flex items-center gap-2.5 text-white hover:text-zinc-200 transition-colors cursor-pointer group"
          title="Buka Koleksi Pustaka"
        >
          <div className="w-8 h-8 rounded-[8px] bg-white/10 border border-white/10 flex items-center justify-center text-zinc-200 group-hover:scale-105 transition-all">
            <Library size={18} strokeWidth={2} />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">Koleksi Kamu</span>
        </div>

        <div className="flex items-center gap-1">
          {onOpenCreatePlaylist && (
            <button
              onClick={onOpenCreatePlaylist}
              className="p-1.5 rounded-[8px] text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Buat Playlist Baru"
              aria-label="Buat Playlist Baru"
            >
              <Plus size={18} strokeWidth={2} />
            </button>
          )}

          {onOpenImportModal && (
            <button
              onClick={() => onOpenImportModal('playlist')}
              className="p-1.5 rounded-[8px] text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              title="Import Playlist / Musik"
              aria-label="Import Playlist"
            >
              <ListPlus size={18} strokeWidth={2} />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="px-4 py-2.5 flex items-center gap-1.5 overflow-x-auto no-scrollbar flex-shrink-0 border-b border-white/[0.06]">
        {[
          { id: 'all' as const, label: 'Semua' },
          { id: 'playlists' as const, label: 'Playlist' },
          { id: 'liked' as const, label: 'Disukai' },
          { id: 'offline' as const, label: 'Unduhan' },
        ].map((chip) => (
          <button
            key={chip.id}
            onClick={() => setSidebarFilter(chip.id)}
            className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              sidebarFilter === chip.id
                ? 'bg-white text-black shadow-sm'
                : 'bg-white/5 text-zinc-400 hover:text-white hover:bg-white/10'
            }`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Daftar Koleksi & Playlist Scrollable */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {/* Pinned: Lagu yang Disukai */}
        {(sidebarFilter === 'all' || sidebarFilter === 'liked') && (
          <div
            onClick={() => {
              onViewChange('ytmusic');
              onYtSubTabChange('liked');
            }}
            className={`flex items-center gap-3 p-2 rounded-[10px] transition-all cursor-pointer group ${
              isLikedActive
                ? 'bg-white/10 text-white font-medium'
                : 'hover:bg-white/5 text-zinc-300'
            }`}
          >
            <div className="w-11 h-11 rounded-[8px] bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-md">
              <Heart size={20} className="fill-white text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold truncate ${isLikedActive ? 'text-white' : 'text-zinc-200'}`}>
                Lagu yang Disukai
              </p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">Playlist • YouTube Music</p>
            </div>
          </div>
        )}

        {/* Pinned: Tersimpan Offline */}
        {(sidebarFilter === 'all' || sidebarFilter === 'offline') && (
          <div
            onClick={() => {
              onViewChange('library');
              onFilterChange('offline');
            }}
            className={`flex items-center gap-3 p-2 rounded-[10px] transition-all cursor-pointer group ${
              isOfflineActive
                ? 'bg-white/10 text-white font-medium'
                : 'hover:bg-white/5 text-zinc-300'
            }`}
          >
            <div className="w-11 h-11 rounded-[8px] bg-[#27272A] border border-white/10 flex items-center justify-center flex-shrink-0 shadow-md text-zinc-200">
              <Download size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold truncate ${isOfflineActive ? 'text-white' : 'text-zinc-200'}`}>
                Tersimpan Offline
              </p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{offlineTracksCount} lagu offline</p>
            </div>
          </div>
        )}

        {/* Pinned: Koleksi Pustaka Lokal */}
        {sidebarFilter === 'all' && (
          <div
            onClick={() => {
              onViewChange('library');
              onFilterChange('all');
            }}
            className={`flex items-center gap-3 p-2 rounded-[10px] transition-all cursor-pointer group ${
              isAllTracksActive
                ? 'bg-white/10 text-white font-medium'
                : 'hover:bg-white/5 text-zinc-300'
            }`}
          >
            <div className="w-11 h-11 rounded-[8px] bg-white/10 border border-white/5 flex items-center justify-center flex-shrink-0 shadow-md">
              <Music size={20} className="text-zinc-300" />
            </div>
            <div className="min-w-0 flex-1">
              <p className={`text-xs font-semibold truncate ${isAllTracksActive ? 'text-white' : 'text-zinc-200'}`}>
                Koleksi Pustaka
              </p>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5">{tracks.length} lagu lokal</p>
            </div>
          </div>
        )}

        {/* Section Divider */}
        {(sidebarFilter === 'all' || sidebarFilter === 'playlists') && (
          <div className="pt-2 pb-1 px-2 flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
            <span>Playlist Saya</span>
            <span className="text-zinc-400 font-mono text-[10px]">{customPlaylists.length}</span>
          </div>
        )}

        {/* Custom Playlists List */}
        {(sidebarFilter === 'all' || sidebarFilter === 'playlists') &&
          customPlaylists.map((pl) => {
            const isPlActive = activeView === 'custom_playlist' && activeCustomPlaylistId === pl.id;
            return (
              <div
                key={pl.id}
                onClick={() => onSelectCustomPlaylist?.(pl.id)}
                className={`group flex items-center justify-between p-2 rounded-[10px] transition-all cursor-pointer ${
                  isPlActive
                    ? 'bg-white/10 text-white font-medium'
                    : 'hover:bg-white/5 text-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                  <div className="w-11 h-11 rounded-lg bg-white/5 border border-white/5 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-md">
                    {pl.tracks && pl.tracks[0]?.thumbnailUrl ? (
                      <img src={pl.tracks[0].thumbnailUrl} alt={pl.name} className="w-full h-full object-cover" />
                    ) : (
                      <Disc size={20} className="text-zinc-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`text-xs font-semibold truncate ${isPlActive ? 'text-white' : 'text-zinc-200'}`}>
                      {pl.name}
                    </p>
                    <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                      Playlist • {pl.tracks?.length || 0} lagu
                    </p>
                  </div>
                </div>

                {onDeleteCustomPlaylist && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (window.confirm(`Hapus playlist "${pl.name}"?`)) {
                        onDeleteCustomPlaylist(pl.id);
                      }
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-zinc-400 hover:text-red-400 hover:bg-white/10 rounded-lg transition-all"
                    title="Hapus Playlist"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            );
          })}

        {/* Empty state when no playlists */}
        {(sidebarFilter === 'all' || sidebarFilter === 'playlists') && customPlaylists.length === 0 && (
          <div className="p-4 text-center rounded-xl bg-white/[0.02] border border-white/5 my-2">
            <FolderPlus size={24} className="text-zinc-400 mx-auto mb-2 opacity-60" />
            <p className="text-xs font-semibold text-zinc-300">Belum ada playlist</p>
            <p className="text-[11px] text-zinc-400 mt-1 mb-3">Buat playlist favoritmu sekarang</p>
            {onOpenCreatePlaylist && (
              <button
                onClick={onOpenCreatePlaylist}
                className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-all cursor-pointer w-full"
              >
                + Buat Playlist
              </button>
            )}
          </div>
        )}
      </div>
    </aside>
  );
};
