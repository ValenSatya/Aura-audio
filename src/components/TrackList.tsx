import React, { useState } from 'react';
import { Track, PlaylistFilter, CustomPlaylist } from '../types/music';
import {
  Play,
  Pause,
  Shuffle,
  Music,
  HardDrive,
  Cloud,
  CheckCircle2,
  Loader2,
  Trash2,
  Search,
  Download,
  Check,
  Plus,
  ListPlus,
  X,
  FileSpreadsheet,
  ListMusic,
  Clock3,
  Volume2,
  CornerDownRight,
  ArrowLeft,
} from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';
import { SpotifyIcon } from './SpotifyIcon';

interface TrackListProps {
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectTrack: (trackId: string) => void;
  onPlayPlaylist?: (tracks: Track[]) => void;
  onPlayShuffled?: (tracks: Track[]) => void;
  onPlayNext?: (track: Track) => void;
  onRemoveTrack: (trackId: string) => void;
  onRemoveTracks?: (trackIds: string[]) => void;
  onStartDownload: (track: Track) => void;
  onDownloadBatch?: (tracks: Track[]) => void;
  onAddTracksToQueue?: (tracks: Track[]) => void;
  onOpenImportModal: (tab?: 'youtube' | 'playlist' | 'local' | 'spotify') => void;
  currentFilter?: PlaylistFilter;
  customPlaylist?: CustomPlaylist | null;
  onDeleteCustomPlaylist?: (id: string) => void;
  onOpenAddToPlaylistModal?: (trackIds: string[]) => void;
  onBackToLibrary?: () => void;
  onNavigateToDiscover?: () => void;
  onNavigateToHome?: () => void;
  dynamicLighting?: {
    enabled: boolean;
    intensity: 'subtle' | 'medium' | 'vibrant';
  };
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${formattedSecs}`;
}

export const TrackList: React.FC<TrackListProps> = ({
  tracks,
  currentTrack,
  isPlaying,
  searchQuery,
  onSearchChange,
  onSelectTrack,
  onPlayPlaylist,
  onPlayShuffled,
  onPlayNext,
  onRemoveTrack,
  onRemoveTracks,
  onStartDownload,
  onDownloadBatch,
  onAddTracksToQueue,
  onOpenImportModal,
  currentFilter = 'all',
  customPlaylist,
  onDeleteCustomPlaylist,
  onOpenAddToPlaylistModal,
  onBackToLibrary,
  onNavigateToDiscover,
  onNavigateToHome,
  dynamicLighting,
}) => {
  // Multi-select state
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const toggleSelectTrack = (id: string) => {
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastSelectedId(id);
  };

  const handleToggleSelectAll = () => {
    if (selectedTrackIds.size === tracks.length) {
      setSelectedTrackIds(new Set());
    } else {
      setSelectedTrackIds(new Set(tracks.map((t) => t.id)));
    }
  };

  const clearSelection = () => {
    setSelectedTrackIds(new Set());
    setLastSelectedId(null);
  };

  const getSelectedTracks = (): Track[] => {
    return tracks.filter((t) => selectedTrackIds.has(t.id));
  };

  const handlePlaySelected = () => {
    const selected = getSelectedTracks();
    if (selected.length === 0) return;
    if (onPlayPlaylist) {
      onPlayPlaylist(selected);
    } else {
      onSelectTrack(selected[0].id);
    }
  };

  const handleQueueSelected = () => {
    const selected = getSelectedTracks();
    if (selected.length === 0) return;
    if (onAddTracksToQueue) {
      onAddTracksToQueue(selected);
    }
    clearSelection();
  };

  const handleDownloadSelected = () => {
    const selected = getSelectedTracks();
    if (selected.length === 0) return;
    if (onDownloadBatch) {
      onDownloadBatch(selected);
    } else {
      selected.forEach((t) => onStartDownload(t));
    }
    clearSelection();
  };

  const handleRemoveSelected = () => {
    if (selectedTrackIds.size === 0) return;
    if (onRemoveTracks) {
      onRemoveTracks(Array.from(selectedTrackIds));
    } else {
      selectedTrackIds.forEach((id) => onRemoveTrack(id));
    }
    clearSelection();
  };

  const totalDurationSecs = tracks.reduce((acc, t) => acc + (t.duration || 0), 0);
  const formattedTotalDuration = (() => {
    const hrs = Math.floor(totalDurationSecs / 3600);
    const mins = Math.floor((totalDurationSecs % 3600) / 60);
    if (hrs > 0) return `${hrs} jam ${mins} mnt`;
    return `${mins} menit`;
  })();
  const playlistCover = customPlaylist?.tracks?.[0]?.thumbnailUrl || tracks[0]?.thumbnailUrl;
  const isPlaylistActive = Boolean(currentTrack && tracks.some((t) => t.id === currentTrack.id));

  const isDynamicOn = dynamicLighting?.enabled ?? true;
  const intensity = dynamicLighting?.intensity ?? 'medium';
  const glowOpacity = !isDynamicOn ? 0 : intensity === 'subtle' ? 0.28 : intensity === 'vibrant' ? 0.72 : 0.48;

  const offlineTrackCount = tracks.filter((t) => t.isOffline || t.sourceType === 'local').length;
  const isAllOffline = tracks.length > 0 && offlineTrackCount === tracks.length;
  const pendingDownloadCount = tracks.length - offlineTrackCount;

  return (
    <div className="flex-1 h-full overflow-y-auto select-none relative font-['Sora'] scroll-smooth">
      {/* Top subtle ambient gradient glow */}
      <div className="absolute top-0 left-0 right-0 h-72 bg-gradient-to-b from-white/[0.04] via-white/[0.01] to-transparent pointer-events-none" />

      {/* Back button to library grid */}
      {onBackToLibrary && (
        <div className="px-8 pt-5 pb-1 relative z-10">
          <button
            onClick={onBackToLibrary}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-400 hover:text-white text-xs font-medium border border-white/[0.06] transition-all cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Pustaka</span>
          </button>
        </div>
      )}

      {/* 1. Hero Banner (Compact & Balanced, inspired by Spotify & Juxtopposed) */}
      <div className="px-8 py-4 flex flex-col sm:flex-row sm:items-end gap-6 relative z-10">
        <div className="w-36 h-36 sm:w-40 sm:h-40 md:w-44 md:h-44 rounded-2xl shadow-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] overflow-hidden flex-shrink-0 flex items-center justify-center text-zinc-400 transition-transform duration-300 hover:scale-[1.01]">
          {playlistCover ? (
            <img
              src={playlistCover}
              alt={customPlaylist ? customPlaylist.name : 'Daftar Lagu'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2">
              <ListMusic size={48} className="text-zinc-500" />
            </div>
          )}
        </div>

        <div className="min-w-0 flex-1">
          <span className="text-[11px] font-semibold tracking-wider text-zinc-400 uppercase block mb-1">
            {customPlaylist ? 'Playlist Kustom' : currentFilter === 'offline' ? 'Koleksi Offline' : 'Koleksi Pustaka'}
          </span>
          <h1 className="text-2xl sm:text-3xl md:text-[34px] font-bold text-white tracking-tight my-1 line-clamp-2 leading-tight">
            {customPlaylist
              ? customPlaylist.name
              : currentFilter === 'offline'
              ? 'Tersimpan Offline'
              : 'Semua Lagu'}
          </h1>
          <p className="text-xs sm:text-[13px] text-zinc-400 font-normal line-clamp-2 mt-1 leading-relaxed max-w-2xl">
            {customPlaylist?.description || 'Daftar putar lagu favorit pilihan Anda di AuraAudio'}
          </p>
          <div className="flex items-center gap-2 text-xs text-zinc-400 font-normal mt-2.5">
            <span className="font-semibold text-white">AuraAudio</span>
            <span>•</span>
            <span>{tracks.length} lagu</span>
            {totalDurationSecs > 0 && (
              <>
                <span>•</span>
                <span className="font-mono">{formattedTotalDuration}</span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* 2. Sticky Action Bar */}
      <div className="px-8 py-3 flex items-center justify-between gap-4 sticky top-0 bg-[#121215]/95 backdrop-blur-xl z-30 border-b border-white/[0.06] shadow-sm">
        <div className="flex items-center gap-3">
          {/* Primary Accent Play Button: Circular 44px */}
          {tracks.length > 0 && (
            <button
              onClick={() => {
                if (isPlaylistActive && isPlaying) {
                  onSelectTrack(currentTrack!.id);
                } else if (onPlayPlaylist) {
                  onPlayPlaylist(tracks);
                } else {
                  onSelectTrack(tracks[0].id);
                }
              }}
              className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-md transition-all hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
              title={isPlaylistActive && isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaylistActive && isPlaying ? (
                <Pause size={18} fill="currentColor" />
              ) : (
                <Play size={18} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          )}

          {/* Shuffle Button */}
          {onPlayShuffled && tracks.length > 0 && (
            <button
              onClick={() => onPlayShuffled(tracks)}
              className="h-9 px-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-white/[0.08] active:scale-95"
              title="Acak & Putar"
            >
              <Shuffle size={14} />
              <span>Acak</span>
            </button>
          )}

          {/* Download Playlist / Offline Status */}
          {onDownloadBatch && tracks.length > 0 && (
            isAllOffline ? (
              <div
                className="h-9 px-3.5 rounded-xl bg-white/[0.04] text-zinc-300 text-xs font-semibold flex items-center gap-2 border border-white/[0.08] cursor-default"
                title="Semua lagu dalam playlist ini sudah tersimpan secara offline"
              >
                <CheckCircle2 size={15} className="text-emerald-400" />
                <span>Tersimpan Offline ({tracks.length})</span>
              </div>
            ) : (
              <button
                onClick={() => onDownloadBatch(tracks)}
                className="h-9 px-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer border border-white/[0.08] group active:scale-95"
                title="Unduh seluruh playlist untuk diputar secara offline"
              >
                <Download size={14} className="text-white group-hover:scale-110 transition-transform" />
                <span>Unduh Playlist ({pendingDownloadCount})</span>
              </button>
            )
          )}

          {/* When playlist is empty, show prominent constructive action buttons */}
          {tracks.length === 0 && (
            <div className="flex items-center gap-2.5">
              {onNavigateToDiscover && (
                <button
                  onClick={onNavigateToDiscover}
                  className="h-9 px-4 rounded-xl bg-white hover:bg-zinc-200 text-black text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
                >
                  <Plus size={15} />
                  <span>Tambah Lagu</span>
                </button>
              )}
              <button
                onClick={() => onOpenImportModal('playlist')}
                className="h-9 px-3.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white text-xs font-medium flex items-center gap-2 transition-all cursor-pointer border border-white/[0.08]"
              >
                <FileSpreadsheet size={14} className="text-zinc-400" />
                <span>Impor File</span>
              </button>
            </div>
          )}

          {/* Delete Playlist (Styled secondary with confirmation prompt) */}
          {customPlaylist && onDeleteCustomPlaylist && (
            confirmDelete ? (
              <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 rounded-xl px-3 py-1.5 animate-in fade-in">
                <span className="text-xs text-red-300 font-medium">Hapus playlist ini?</span>
                <button
                  onClick={() => {
                    onDeleteCustomPlaylist(customPlaylist.id);
                    setConfirmDelete(false);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-all cursor-pointer active:scale-95"
                >
                  Ya, Hapus
                </button>
                <button
                  onClick={() => setConfirmDelete(false)}
                  className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/15 text-zinc-300 text-xs font-medium transition-all cursor-pointer"
                >
                  Batal
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmDelete(true)}
                className="h-9 px-3 rounded-xl bg-white/[0.04] hover:bg-red-500/10 text-zinc-400 hover:text-red-400 text-xs font-medium flex items-center gap-2 border border-white/[0.06] hover:border-red-500/20 transition-all cursor-pointer group active:scale-95"
                title="Hapus playlist ini"
              >
                <Trash2 size={14} className="group-hover:scale-105 transition-transform" />
                <span className="hidden sm:inline">Hapus Playlist</span>
              </button>
            )
          )}
        </div>

        {/* Search Within Playlist (Only show if playlist has songs OR there is an active search query) */}
        {(tracks.length > 0 || searchQuery.length > 0) && (
          <div className="relative w-52 md:w-60 h-9 rounded-full bg-white/[0.05] hover:bg-white/[0.08] focus-within:bg-white/[0.08] border border-white/[0.08] focus-within:border-white/20 px-3.5 flex items-center gap-2 text-xs text-white transition-all backdrop-blur-md">
            <Search size={14} className="text-zinc-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Cari dalam daftar..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-zinc-500 focus:outline-none w-full"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="text-zinc-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Track Table */}
      <div className="px-6 md:px-8 py-2 pb-36">
        {tracks.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16 px-6 max-w-lg mx-auto rounded-2xl bg-white/[0.02] border border-white/[0.06] my-6 shadow-sm">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-white/[0.08] to-white/[0.02] border border-white/[0.08] flex items-center justify-center text-zinc-300 mb-4 shadow-inner">
              <Music size={26} strokeWidth={1.75} />
            </div>

            <h3 className="text-base font-semibold text-white tracking-tight mb-1.5">
              {searchQuery
                ? 'Tidak Ada Lagu yang Cocok'
                : customPlaylist
                ? 'Playlist Anda Masih Kosong'
                : 'Koleksi Belum Memiliki Lagu'}
            </h3>

            <p className="text-xs text-zinc-400 max-w-sm mb-6 leading-relaxed">
              {searchQuery
                ? `Tidak ditemukan lagu dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : customPlaylist
                ? 'Playlist ini belum memiliki lagu. Temukan musik favoritmu di YouTube Music atau impor playlist untuk mulai mendengarkan.'
                : 'Mulai dengan mencari lagu di YouTube Music, mengimpor file M3U/CSV, atau menambahkan file audio lokal.'}
            </p>

            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="px-4 py-2 bg-white/[0.08] hover:bg-white/[0.14] text-white rounded-xl text-xs font-semibold border border-white/[0.1] transition-all cursor-pointer active:scale-95"
              >
                Hapus Pencarian
              </button>
            )}

            {!searchQuery && !customPlaylist && (
              <div className="flex flex-wrap items-center justify-center gap-2.5">
                {onNavigateToDiscover && (
                  <button
                    onClick={onNavigateToDiscover}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <Search size={14} />
                    <span>Cari Lagu Online</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenImportModal('youtube')}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white rounded-xl text-xs font-medium border border-white/[0.08] transition-all cursor-pointer"
                >
                  <YoutubeIcon size={14} className="text-red-400" />
                  <span>Link YouTube</span>
                </button>
                <button
                  onClick={() => onOpenImportModal('playlist')}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white rounded-xl text-xs font-medium border border-white/[0.08] transition-all cursor-pointer"
                >
                  <FileSpreadsheet size={14} className="text-emerald-400" />
                  <span>M3U / CSV</span>
                </button>
                <button
                  onClick={() => onOpenImportModal('spotify')}
                  className="flex items-center gap-2 px-3.5 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-300 hover:text-white rounded-xl text-xs font-medium border border-white/[0.08] transition-all cursor-pointer"
                >
                  <SpotifyIcon size={14} className="text-emerald-400" />
                  <span>Spotify</span>
                </button>
              </div>
            )}

            {!searchQuery && customPlaylist && (
              <div className="flex flex-wrap items-center justify-center gap-3">
                {onNavigateToDiscover && (
                  <button
                    onClick={onNavigateToDiscover}
                    className="flex items-center gap-2 px-5 py-2.5 bg-white hover:bg-zinc-200 text-black rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-md active:scale-95"
                  >
                    <Plus size={15} />
                    <span>Cari & Tambah Lagu</span>
                  </button>
                )}
                <button
                  onClick={() => onOpenImportModal('playlist')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-200 hover:text-white rounded-xl text-xs font-medium border border-white/[0.08] transition-all cursor-pointer active:scale-95"
                >
                  <FileSpreadsheet size={14} className="text-zinc-400" />
                  <span>Impor M3U / CSV</span>
                </button>
                {onNavigateToHome && (
                  <button
                    onClick={onNavigateToHome}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-zinc-200 rounded-xl text-xs font-medium border border-white/[0.08] transition-all cursor-pointer active:scale-95"
                  >
                    <span>Jelajahi Beranda</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse select-none">
            <thead className="sticky top-[53px] bg-[#121215]/95 backdrop-blur-md z-20 border-b border-white/[0.06]">
              <tr className="text-xs font-medium text-zinc-400 select-none">
                {/* Select All Checkbox Header */}
                <th className="w-12 py-2.5 pl-4 text-center">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={handleToggleSelectAll}
                      className={`w-4 h-4 rounded-md flex items-center justify-center transition-all cursor-pointer ${
                        selectedTrackIds.size > 0 && selectedTrackIds.size === tracks.length
                          ? 'bg-white text-black'
                          : selectedTrackIds.size > 0
                          ? 'bg-zinc-700 text-white'
                          : 'bg-zinc-800 text-transparent hover:bg-zinc-700'
                      }`}
                      title={
                        selectedTrackIds.size === tracks.length
                          ? 'Batalkan pilihan'
                          : 'Pilih semua lagu'
                      }
                    >
                      {selectedTrackIds.size === tracks.length ? (
                        <Check size={11} strokeWidth={3} />
                      ) : selectedTrackIds.size > 0 ? (
                        <div className="w-2 h-0.5 bg-white rounded-full" />
                      ) : null}
                    </button>
                  </div>
                </th>
                <th className="py-2.5 text-xs font-medium text-zinc-400">Judul</th>
                <th className="w-48 py-2.5 text-xs font-medium text-zinc-400 hidden md:table-cell">Album</th>
                <th className="w-24 py-2.5 text-xs font-medium text-zinc-400 hidden lg:table-cell">Sumber</th>
                <th className="w-24 py-2.5 text-right pr-6">
                  <Clock3 size={14} className="inline text-zinc-400" />
                </th>
                <th className="w-20 py-2.5 text-right pr-4"></th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track, idx) => {
                const isItemPlaying = currentTrack?.id === track.id && isPlaying;
                const isDownloading = track.downloadStatus === 'downloading';
                const isOfflineReady = track.isOffline || track.sourceType === 'local';
                const isRowChecked = selectedTrackIds.has(track.id);

                return (
                  <tr
                    key={track.id}
                    onClick={(e) => {
                      if (e.shiftKey || e.ctrlKey || e.metaKey || selectedTrackIds.size > 0) {
                        e.preventDefault();
                        toggleSelectTrack(track.id);
                      } else {
                        onSelectTrack(track.id);
                      }
                    }}
                    onDoubleClick={() => onSelectTrack(track.id)}
                    className={`group transition-colors rounded-xl cursor-pointer ${
                      isRowChecked
                        ? 'bg-white/10 text-white'
                        : currentTrack?.id === track.id
                        ? 'bg-white/[0.08] text-white'
                        : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    {/* Index or Checkbox */}
                    <td className="py-2 pl-4 text-xs font-mono text-zinc-400 text-center">
                      <div className="w-8 flex items-center justify-center gap-1.5">
                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectTrack(track.id);
                          }}
                          className={`w-4 h-4 rounded-md flex items-center justify-center transition-all ${
                            isRowChecked
                              ? 'bg-white text-black'
                              : selectedTrackIds.size > 0
                              ? 'bg-zinc-700 text-transparent opacity-70 hover:opacity-100'
                              : 'bg-zinc-800 text-transparent opacity-0 group-hover:opacity-100'
                          }`}
                          title={isRowChecked ? 'Batalkan pilihan' : 'Pilih lagu ini'}
                        >
                          {isRowChecked && <Check size={11} strokeWidth={3} />}
                        </button>

                        {/* Number or Playing pulse */}
                        {selectedTrackIds.size === 0 && (
                          <span
                            className={`${
                              isRowChecked ? 'hidden' : 'group-hover:hidden'
                            } w-4 text-center font-normal ${
                              currentTrack?.id === track.id ? 'text-white font-semibold' : 'text-zinc-400'
                            }`}
                          >
                            {isItemPlaying ? (
                              <Volume2 size={14} className="text-blue-400 inline animate-pulse" />
                            ) : (
                              idx + 1
                            )}
                          </span>
                        )}

                        {/* Play button on hover when no multi-select active */}
                        {selectedTrackIds.size === 0 && !isRowChecked && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectTrack(track.id);
                            }}
                            className="hidden group-hover:flex text-white hover:scale-110 transition-transform cursor-pointer"
                            title={isItemPlaying ? 'Jeda' : 'Putar lagu ini'}
                          >
                            {isItemPlaying ? (
                              <Pause size={14} className="fill-current" />
                            ) : (
                              <Play size={14} className="fill-current ml-0.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Title, Artist, Thumbnail */}
                    <td className="py-2.5">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-[8px] bg-zinc-800 overflow-hidden flex-shrink-0 flex items-center justify-center shadow-md border border-white/10">
                          {track.thumbnailUrl ? (
                            <img
                              src={track.thumbnailUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music size={16} className="text-zinc-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p
                              className={`text-sm font-semibold truncate ${
                                isRowChecked
                                  ? 'text-white'
                                  : currentTrack?.id === track.id
                                  ? 'text-white'
                                  : 'text-white'
                              }`}
                            >
                              {track.title}
                            </p>
                            {isOfflineReady && (
                              <span title="Tersimpan Offline">
                                <CheckCircle2 size={12} className="text-zinc-400 flex-shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-normal text-zinc-400 group-hover:text-zinc-200 truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Album */}
                    <td className="py-2.5 hidden md:table-cell">
                      <span className="text-xs font-normal text-zinc-400 truncate block">
                        {track.album || '-'}
                      </span>
                    </td>

                    {/* Source Badge */}
                    <td className="py-2.5 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono bg-white/5 border border-white/5 text-zinc-400 uppercase">
                        {track.sourceType}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-2.5 text-xs font-mono text-zinc-400 text-right pr-6 tabular-nums">
                      {formatDuration(track.duration)}
                    </td>

                    {/* Offline / Download Status */}
                    <td className="py-3">
                      {isOfflineReady ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-zinc-300 font-medium">
                          <CheckCircle2 size={12} className="text-zinc-400" />
                          <span>Offline</span>
                        </span>
                      ) : isDownloading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={13} className="animate-spin text-zinc-400" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-zinc-400">
                              {track.downloadProgress || 0}%
                            </span>
                            <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 transition-all duration-200"
                                style={{ width: `${track.downloadProgress || 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onStartDownload(track);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/5 text-zinc-400 hover:text-white text-[11px] font-medium transition-colors cursor-pointer"
                          title="Download untuk diputar secara offline"
                        >
                          <Download size={12} />
                          <span>Unduh</span>
                        </button>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 text-right pr-4">
                      <div className="flex items-center justify-end gap-1">
                        {onPlayNext && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onPlayNext(track);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Putar Berikutnya"
                          >
                            <CornerDownRight size={14} />
                          </button>
                        )}
                        {onOpenAddToPlaylistModal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddToPlaylistModal([track.id]);
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            title="Tambahkan ke Playlist"
                          >
                            <ListPlus size={14} />
                          </button>
                        )}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveTrack(track.id);
                          }}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                          title="Hapus dari daftar"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Floating Bulk Action Bar (When 1 or more tracks are selected) */}
      {selectedTrackIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#141418]/95 backdrop-blur-xl border border-white/[0.08] text-white px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-1.5 pr-2">
            <span className="text-xs font-semibold text-white font-mono">{selectedTrackIds.size}</span>
            <span className="text-xs text-zinc-400">dipilih</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10" />

          {/* Action: Play Selected */}
          <button
            onClick={handlePlaySelected}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-white text-black rounded-full text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer hover:bg-zinc-200"
            title="Putar lagu-lagu yang dipilih"
          >
            <Play size={13} fill="currentColor" />
            <span>Putar</span>
          </button>

          {/* Action: Add to Queue */}
          {onAddTracksToQueue && (
            <button
              onClick={handleQueueSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-medium border border-white/5 transition-colors cursor-pointer"
              title="Tambahkan lagu yang dipilih ke antrian pemutar"
            >
              <Plus size={13} />
              <span>Antrian</span>
            </button>
          )}

          {/* Action: Download Selected */}
          {onDownloadBatch && (
            <button
              onClick={handleDownloadSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-medium border border-white/5 transition-colors cursor-pointer"
              title="Unduh lagu yang dipilih untuk offline"
            >
              <Download size={13} />
              <span>Unduh</span>
            </button>
          )}

          {/* Action: Add to Custom Playlist */}
          {onOpenAddToPlaylistModal && (
            <button
              onClick={() => onOpenAddToPlaylistModal(Array.from(selectedTrackIds))}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-full text-xs font-medium border border-white/5 transition-colors cursor-pointer"
              title="Masukkan lagu yang dipilih ke playlist"
            >
              <ListPlus size={14} className="text-zinc-300" />
              <span>Masukkan ke Playlist</span>
            </button>
          )}

          {/* Action: Delete Selected */}
          <button
            onClick={handleRemoveSelected}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/5 hover:bg-red-500/15 text-red-400 rounded-full text-xs font-medium border border-white/5 transition-colors cursor-pointer"
            title="Hapus lagu yang dipilih"
          >
            <Trash2 size={13} />
            <span>Hapus</span>
          </button>

          {/* Clear Selection */}
          <button
            onClick={clearSelection}
            className="p-1.5 hover:bg-white/10 text-zinc-400 hover:text-white rounded-full transition-colors ml-1 cursor-pointer"
            title="Batalkan pilihan"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
