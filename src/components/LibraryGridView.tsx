import React, { useState, useMemo } from 'react';
import { Track, CustomPlaylist } from '../types/music';
import {
  Plus,
  Play,
  Pause,
  Music,
  ListMusic,
  HardDrive,
  FileSpreadsheet,
  Trash2,
  FolderPlus,
} from 'lucide-react';

interface LibraryGridViewProps {
  tracks: Track[];
  customPlaylists: CustomPlaylist[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectPlaylist: (playlistId: string | 'all' | 'offline') => void;
  onPlayPlaylist: (tracks: Track[]) => void;
  onOpenCreatePlaylist: () => void;
  onOpenImportModal: (tab?: 'youtube' | 'playlist' | 'local' | 'spotify') => void;
  onDeleteCustomPlaylist?: (playlistId: string) => void;
  searchQuery?: string;
}

export const LibraryGridView: React.FC<LibraryGridViewProps> = ({
  tracks,
  customPlaylists,
  currentTrack,
  isPlaying,
  onSelectPlaylist,
  onPlayPlaylist,
  onOpenCreatePlaylist,
  onOpenImportModal,
  onDeleteCustomPlaylist,
  searchQuery = '',
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'custom' | 'offline'>('all');

  // Helper to resolve tracks for a custom playlist
  const getPlaylistTracks = (pl: CustomPlaylist): Track[] => {
    if (pl.tracks && pl.tracks.length > 0) return pl.tracks;
    const map = new Map(tracks.map((t) => [t.id, t]));
    const result: Track[] = [];
    for (const id of pl.trackIds) {
      const found = map.get(id);
      if (found) result.push(found);
    }
    return result;
  };

  const offlineTracks = useMemo(() => {
    return tracks.filter((t) => t.isOffline || t.sourceType === 'local');
  }, [tracks]);

  // Filter custom playlists by search query
  const filteredCustomPlaylists = useMemo(() => {
    let list = customPlaylists;
    if (filterTab === 'offline') return [];
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [customPlaylists, filterTab, searchQuery]);

  const showAllCard = (filterTab === 'all' || filterTab === 'custom') &&
    (!searchQuery.trim() || 'semua lagu'.includes(searchQuery.toLowerCase()));

  const showOfflineCard = (filterTab === 'all' || filterTab === 'offline') &&
    (!searchQuery.trim() || 'tersimpan offline unduhan'.includes(searchQuery.toLowerCase()));

  // Collage thumbnail renderer for 4 images or 1 single cover
  const renderCoverCollage = (trackList: Track[], fallbackIcon: React.ReactNode) => {
    const validThumbs = trackList
      .map((t) => t.thumbnailUrl)
      .filter((url): url is string => Boolean(url));

    if (validThumbs.length >= 4) {
      return (
        <div className="w-full h-full grid grid-cols-2 grid-rows-2">
          {validThumbs.slice(0, 4).map((url, i) => (
            <img
              key={i}
              src={url}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ))}
        </div>
      );
    }

    if (validThumbs.length > 0) {
      return (
        <img
          src={validThumbs[0]}
          alt=""
          className="w-full h-full object-cover"
          loading="lazy"
        />
      );
    }

    return (
      <div className="w-full h-full flex items-center justify-center bg-[#17171A] text-[#8E8E93]">
        {fallbackIcon}
      </div>
    );
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto select-none p-8 font-['Sora']">
      {/* 1. Header Pustaka */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8 flex-shrink-0">
        <div>
          <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase block mb-1">
            Koleksi Pribadi
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-bold text-white tracking-tight leading-none">
            Pustaka
          </h1>
          <p className="text-xs sm:text-[13px] text-zinc-400 mt-2 leading-relaxed">
            Kelola seluruh playlist kustom, lagu favorit, dan koleksi offline Anda.
          </p>
        </div>

        {/* Action Buttons: Buat Playlist & Impor */}
        <div className="flex items-center gap-2.5 flex-shrink-0">
          <button
            onClick={() => onOpenImportModal('playlist')}
            className="h-9 px-4 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/[0.08] transition-colors cursor-pointer"
            title="Impor file playlist M3U atau CSV"
          >
            <FileSpreadsheet size={14} className="text-zinc-400" />
            <span>Impor M3U / CSV</span>
          </button>

          <button
            onClick={onOpenCreatePlaylist}
            className="h-9 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus size={15} strokeWidth={2.5} />
            <span>Buat Playlist</span>
          </button>
        </div>
      </div>

      {/* 2. Filter Tabs */}
      <div className="flex items-center gap-2 mb-6 flex-shrink-0">
        <button
          onClick={() => setFilterTab('all')}
          className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer ${
            filterTab === 'all'
              ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
              : 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Semua ({1 + (offlineTracks.length > 0 ? 1 : 0) + customPlaylists.length})
        </button>

        <button
          onClick={() => setFilterTab('custom')}
          className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer ${
            filterTab === 'custom'
              ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
              : 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Playlist Kustom ({customPlaylists.length})
        </button>

        <button
          onClick={() => setFilterTab('offline')}
          className={`h-8 px-3.5 rounded-full text-xs transition-all cursor-pointer ${
            filterTab === 'offline'
              ? 'bg-white/10 text-white font-semibold border border-white/10 shadow-sm'
              : 'bg-transparent text-zinc-400 hover:text-white hover:bg-white/5'
          }`}
        >
          Tersimpan Offline ({offlineTracks.length})
        </button>
      </div>

      {/* 3. Grid Playlist Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 pb-16">
        {/* CARD 1: Semua Lagu */}
        {showAllCard && (
          <div
            onClick={() => onSelectPlaylist('all')}
            className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer flex flex-col relative shadow-sm hover:shadow-lg"
          >
            {/* Artwork Cover */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] shadow-md mb-3 flex items-center justify-center">
              {renderCoverCollage(tracks, <Music size={36} className="text-zinc-500" />)}

              {/* Hover Quick Play Button */}
              {tracks.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPlaylist(tracks);
                  }}
                  className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Putar Semua Lagu"
                >
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                </button>
              )}
            </div>

            {/* Title & Info */}
            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <h3 className="text-xs font-semibold text-white truncate group-hover:text-zinc-100">
                Semua Lagu
              </h3>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                {tracks.length} lagu
              </p>
            </div>
          </div>
        )}

        {/* CARD 2: Tersimpan Offline */}
        {showOfflineCard && (
          <div
            onClick={() => onSelectPlaylist('offline')}
            className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer flex flex-col relative shadow-sm hover:shadow-lg"
          >
            {/* Artwork Cover */}
            <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] shadow-md mb-3 flex items-center justify-center">
              {offlineTracks.length > 0 ? (
                renderCoverCollage(offlineTracks, <HardDrive size={36} className="text-zinc-500" />)
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white/[0.02] text-zinc-500 gap-2">
                  <HardDrive size={32} />
                  <span className="text-[10px] text-zinc-500">Belum ada</span>
                </div>
              )}

              {/* Tag Offline */}
              <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-md text-[9px] font-mono text-zinc-400 flex items-center gap-1 border border-white/5">
                <HardDrive size={10} />
                <span>OFFLINE</span>
              </div>

              {/* Hover Quick Play Button */}
              {offlineTracks.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onPlayPlaylist(offlineTracks);
                  }}
                  className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="Putar Koleksi Offline"
                >
                  <Play size={16} fill="currentColor" className="ml-0.5" />
                </button>
              )}
            </div>

            {/* Title & Info */}
            <div className="min-w-0 flex-1 flex flex-col justify-between">
              <h3 className="text-xs font-semibold text-white truncate group-hover:text-zinc-100">
                Tersimpan Offline
              </h3>
              <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                {offlineTracks.length} lagu
              </p>
            </div>
          </div>
        )}

        {/* CARD LIST: Custom Playlists */}
        {filteredCustomPlaylists.map((pl) => {
          const plTracks = getPlaylistTracks(pl);
          const isCurrentActive = Boolean(
            currentTrack && plTracks.some((t) => t.id === currentTrack.id)
          );

          return (
            <div
              key={pl.id}
              onClick={() => onSelectPlaylist(pl.id)}
              className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] hover:border-white/[0.1] transition-all cursor-pointer flex flex-col relative shadow-sm hover:shadow-lg"
            >
              {/* Artwork Cover */}
              <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-white/[0.03] border border-white/[0.06] shadow-md mb-3 flex items-center justify-center">
                {renderCoverCollage(plTracks, <ListMusic size={36} className="text-zinc-500" />)}

                {/* Delete Button (visible on hover) */}
                {onDeleteCustomPlaylist && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteCustomPlaylist(pl.id);
                    }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-black/70 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-white/10"
                    title="Hapus playlist ini"
                  >
                    <Trash2 size={13} />
                  </button>
                )}

                {/* Hover Quick Play Button */}
                {plTracks.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlayPlaylist(plTracks);
                    }}
                    className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg opacity-0 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all cursor-pointer hover:scale-105 active:scale-95"
                    title={`Putar ${pl.name}`}
                  >
                    {isCurrentActive && isPlaying ? (
                      <Pause size={16} fill="currentColor" />
                    ) : (
                      <Play size={16} fill="currentColor" className="ml-0.5" />
                    )}
                  </button>
                )}
              </div>

              {/* Title & Info */}
              <div className="min-w-0 flex-1 flex flex-col justify-between">
                <h3 className="text-xs font-semibold text-white truncate group-hover:text-zinc-100">
                  {pl.name}
                </h3>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5 font-mono">
                  {plTracks.length > 0 ? `${plTracks.length} lagu` : `${pl.trackIds.length} lagu`}
                </p>
              </div>
            </div>
          );
        })}

        {/* CARD: + Buat Playlist Baru */}
        <div
          onClick={onOpenCreatePlaylist}
          className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.05] border border-dashed border-white/10 hover:border-white/20 transition-all cursor-pointer flex flex-col items-center justify-center text-center aspect-square group min-h-[190px]"
        >
          <div className="w-12 h-12 rounded-xl bg-white/[0.05] group-hover:bg-white/[0.1] text-zinc-400 group-hover:text-white flex items-center justify-center mb-3 transition-colors border border-white/[0.06]">
            <FolderPlus size={22} />
          </div>
          <span className="text-xs font-semibold text-white">Buat Playlist Baru</span>
          <span className="text-[11px] text-zinc-400 mt-0.5">Koleksi kustom Anda</span>
        </div>
      </div>
    </div>
  );
};
