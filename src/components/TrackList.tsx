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
  dynamicLighting,
}) => {
  // Multi-select state
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

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
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto select-none relative font-['Sora']">
      {/* Back button to library grid */}
      {onBackToLibrary && (
        <div className="px-8 pt-6 -mb-3 flex items-center z-10">
          <button
            onClick={onBackToLibrary}
            className="flex items-center gap-2 px-3 py-1.5 rounded-[8px] bg-[#17171A] hover:bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0] text-xs font-medium transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Kembali ke Pustaka</span>
          </button>
        </div>
      )}

      {/* 1. Hero Banner (Section 5.4 design.md: Cover 280px radius 8px, Title Display 40px 300) */}
      <div className="p-8 pb-7 flex flex-col md:flex-row items-start md:items-end gap-7 flex-shrink-0 relative overflow-hidden select-none">
        <div className="w-48 h-48 md:w-60 md:h-60 rounded-[8px] shadow-2xl bg-[#17171A] overflow-hidden flex-shrink-0 flex items-center justify-center text-[#8D8D93] relative z-10 transition-transform duration-300 hover:scale-[1.01]">
          {playlistCover ? (
            <img
              src={playlistCover}
              alt={customPlaylist ? customPlaylist.name : 'Daftar Lagu'}
              className="w-full h-full object-cover"
            />
          ) : (
            <ListMusic size={64} className="text-[#8D8D93]" />
          )}
        </div>

        <div className="min-w-0 flex-1 relative z-10">
          <span className="text-[12px] font-semibold uppercase tracking-wider text-[#8D8D93] block mb-1">
            {customPlaylist ? 'Playlist Kustom' : currentFilter === 'offline' ? 'Koleksi Offline' : 'Koleksi Pustaka'}
          </span>
          <h1 className="text-3xl md:text-4xl lg:text-[40px] font-light text-[#F4F4F0] tracking-[-0.8px] my-2 line-clamp-2 leading-none">
            {customPlaylist
              ? customPlaylist.name
              : currentFilter === 'offline'
              ? 'Tersimpan Offline'
              : 'Semua Lagu'}
          </h1>
          <p className="text-[13px] text-[#8D8D93] font-normal line-clamp-2 mt-2">
            {customPlaylist?.description || 'Daftar putar lagu favorit pilihan Anda di AuraAudio'}
          </p>
          <div className="flex items-center gap-2 text-[12px] text-[#8D8D93] font-normal mt-3">
            <span className="font-semibold text-[#F4F4F0]">AuraAudio</span>
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

      {/* 2. Action Bar (Section 5: Circular 48px play button, secondary buttons #1F1F23) */}
      <div className="px-8 py-4 flex items-center justify-between gap-4 sticky top-0 bg-[#0B0B0C]/90 backdrop-blur-xl z-20">
        <div className="flex items-center gap-3">
          {/* Primary Accent Play Button: Circular 48px, #F4F4F0, rounded-full */}
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
              className="w-12 h-12 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center shadow-md transition-transform hover:scale-105 active:scale-95 cursor-pointer flex-shrink-0"
              title={isPlaylistActive && isPlaying ? 'Jeda' : 'Putar'}
            >
              {isPlaylistActive && isPlaying ? (
                <Pause size={20} fill="currentColor" />
              ) : (
                <Play size={20} fill="currentColor" className="ml-0.5" />
              )}
            </button>
          )}

          {/* Shuffle Button */}
          {onPlayShuffled && tracks.length > 0 && (
            <button
              onClick={() => onPlayShuffled(tracks)}
              className="h-10 px-4 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer"
              title="Acak & Putar"
            >
              <Shuffle size={15} />
              <span>Acak</span>
            </button>
          )}

          {/* Download Playlist / Offline Status */}
          {onDownloadBatch && tracks.length > 0 && (
            isAllOffline ? (
              <div
                className="h-10 px-4 rounded-[8px] bg-[#1F1F23] text-[#F4F4F0] text-xs font-medium flex items-center gap-2 cursor-default"
                title="Semua lagu dalam playlist ini sudah tersimpan secara offline"
              >
                <CheckCircle2 size={15} />
                <span>Tersimpan Offline ({tracks.length} lagu)</span>
              </div>
            ) : (
              <button
                onClick={() => onDownloadBatch(tracks)}
                className="h-10 px-4 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] text-xs font-medium flex items-center gap-2 transition-colors cursor-pointer group"
                title="Unduh seluruh playlist untuk diputar secara offline"
              >
                <Download size={14} className="text-[#F4F4F0] group-hover:scale-110 transition-transform" />
                <span>Unduh Playlist ({pendingDownloadCount} lagu)</span>
              </button>
            )
          )}

          {/* Delete Playlist (if custom playlist) */}
          {customPlaylist && onDeleteCustomPlaylist && (
            <button
              onClick={() => onDeleteCustomPlaylist(customPlaylist.id)}
              className="h-10 w-10 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-[#E07A7A] flex items-center justify-center transition-colors cursor-pointer"
              title="Hapus playlist ini"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Search Within Playlist */}
        <div className="relative w-56 md:w-64 h-10 rounded-[8px] bg-[#17171A] hover:bg-[#1F1F23] focus-within:bg-[#1F1F23] px-3 flex items-center gap-2 text-xs text-[#F4F4F0]">
          <Search size={14} className="text-[#8D8D93] flex-shrink-0" />
          <input
            type="text"
            placeholder="Cari dalam daftar..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-transparent text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none w-full"
          />
        </div>
      </div>

      {/* Main Track Table */}
      <div className="flex-1 overflow-y-auto px-6 md:px-8 py-4 pb-12">
        {tracks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8 rounded-[10px] bg-[#17171A]">
            <div className="w-14 h-14 rounded-[8px] bg-[#1F1F23] flex items-center justify-center text-[#8D8D93] mb-4">
              <Music size={26} />
            </div>
            <h3 className="text-sm font-semibold text-[#F4F4F0] mb-1">
              {searchQuery
                ? 'Tidak Ada Lagu yang Cocok'
                : customPlaylist
                ? 'Playlist Masih Kosong'
                : 'Koleksi Belum Memiliki Lagu'}
            </h3>
            <p className="text-xs text-[#8D8D93] max-w-sm mb-6">
              {searchQuery
                ? `Tidak ditemukan lagu dengan kata kunci "${searchQuery}". Coba kata kunci lain.`
                : customPlaylist
                ? 'Gunakan fitur centang pada lagu apa saja, lalu klik "Ke Playlist" untuk memasukkannya ke sini.'
                : 'Mulai dengan mengimpor file playlist M3U, spreadsheet CSV, atau masukkan file audio lokal.'}
            </p>

            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="px-5 py-2.5 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[8px] text-xs font-semibold transition-all cursor-pointer"
              >
                Hapus Pencarian
              </button>
            )}

            {!searchQuery && !customPlaylist && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenImportModal('youtube')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[8px] text-xs font-medium transition-all cursor-pointer"
                >
                  <YoutubeIcon size={14} className="text-[#8D8D93]" />
                  <span>Link YouTube</span>
                </button>
                <button
                  onClick={() => onOpenImportModal('playlist')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[8px] text-xs font-medium transition-all cursor-pointer"
                >
                  <FileSpreadsheet size={14} className="text-[#8D8D93]" />
                  <span>Import M3U / CSV</span>
                </button>
                <button
                  onClick={() => onOpenImportModal('spotify')}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[8px] text-xs font-medium transition-all cursor-pointer"
                >
                  <SpotifyIcon size={14} className="text-[#8D8D93]" />
                  <span>Import Spotify</span>
                </button>
              </div>
            )}

            {!searchQuery && customPlaylist && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onOpenImportModal('playlist')}
                  className="flex items-center gap-2 px-5 py-2.5 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[8px] text-xs font-medium transition-all cursor-pointer"
                >
                  <FileSpreadsheet size={15} className="text-[#8D8D93]" />
                  <span>Impor File Playlist (M3U / CSV)</span>
                </button>
              </div>
            )}
          </div>
        ) : (
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="text-[12px] font-normal text-[#8D8D93] pb-2 select-none">
                {/* Select All Checkbox Header */}
                <th className="w-12 py-2 pl-4 text-center">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={handleToggleSelectAll}
                      className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-all cursor-pointer ${
                        selectedTrackIds.size > 0 && selectedTrackIds.size === tracks.length
                          ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                          : selectedTrackIds.size > 0
                          ? 'bg-[#34343A] text-[#F4F4F0]'
                          : 'bg-[#1F1F23] text-transparent hover:bg-[#34343A]'
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
                        <div className="w-2 h-0.5 bg-[#F4F4F0] rounded-full" />
                      ) : null}
                    </button>
                  </div>
                </th>
                <th className="py-2 text-[12px] font-normal text-[#8D8D93]">Judul</th>
                <th className="w-44 py-2 text-[12px] font-normal text-[#8D8D93] hidden md:table-cell">Album</th>
                <th className="w-28 py-2 text-[12px] font-normal text-[#8D8D93] hidden lg:table-cell">Sumber</th>
                <th className="w-24 py-2 text-right pr-6">
                  <Clock3 size={14} className="inline text-[#8D8D93]" />
                </th>
                <th className="w-20 py-2 text-right pr-4"></th>
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
                    className={`group transition-colors rounded-[8px] cursor-pointer ${
                      isRowChecked
                        ? 'bg-[#17171A] text-[#F4F4F0]'
                        : currentTrack?.id === track.id
                        ? 'bg-[#17171A] text-[#F4F4F0]'
                        : 'hover:bg-[#1F1F23]'
                    }`}
                  >
                    {/* Index or Checkbox */}
                    <td className="py-2 pl-4 text-[11px] font-mono text-[#8D8D93] text-center">
                      <div className="w-8 flex items-center justify-center gap-1.5">
                        {/* Checkbox */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSelectTrack(track.id);
                          }}
                          className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-all ${
                            isRowChecked
                              ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                              : selectedTrackIds.size > 0
                              ? 'bg-[#34343A] text-transparent opacity-70 hover:opacity-100'
                              : 'bg-[#1F1F23] text-transparent opacity-0 group-hover:opacity-100'
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
                            } w-4 text-center font-normal`}
                          >
                            {isItemPlaying ? (
                              <Volume2 size={14} className="text-[#F4F4F0] inline" />
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
                            className="hidden group-hover:flex text-[#F4F4F0] hover:scale-105 transition-transform cursor-pointer"
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
                        <div className="w-10 h-10 rounded-[6px] bg-[#17171A] overflow-hidden flex-shrink-0 flex items-center justify-center shadow-sm">
                          {track.thumbnailUrl ? (
                            <img
                              src={track.thumbnailUrl}
                              alt={track.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Music size={16} className="text-[#8D8D93]" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <p
                              className={`text-sm font-normal truncate ${
                                isRowChecked
                                  ? 'text-[#F4F4F0]'
                                  : currentTrack?.id === track.id
                                  ? 'text-[#F4F4F0] font-medium'
                                  : 'text-[#F4F4F0]'
                              }`}
                            >
                              {track.title}
                            </p>
                            {isOfflineReady && (
                              <span title="Tersimpan Offline">
                                <CheckCircle2 size={12} className="fill-[#F4F4F0] text-[#0B0B0C] flex-shrink-0" />
                              </span>
                            )}
                          </div>
                          <p className="text-xs font-normal text-[#8D8D93] group-hover:text-[#F4F4F0] truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Album */}
                    <td className="py-2.5 hidden md:table-cell">
                      <span className="text-xs font-normal text-[#8D8D93] truncate block">
                        {track.album || '-'}
                      </span>
                    </td>

                    {/* Source Badge */}
                    <td className="py-2.5 hidden lg:table-cell">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-[4px] text-[10px] font-mono bg-[#1F1F23] text-[#8D8D93] uppercase">
                        {track.sourceType}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-2.5 text-[11px] font-mono text-[#8D8D93] text-right pr-6">
                      {formatDuration(track.duration)}
                    </td>

                    {/* Offline / Download Status */}
                    <td className="py-3">
                      {isOfflineReady ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[6px] bg-[#1F1F23] text-xs text-[#8D8D93] font-medium">
                          <CheckCircle2 size={12} className="fill-[#F4F4F0] text-[#0B0B0C]" />
                          <span>Offline</span>
                        </span>
                      ) : isDownloading ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={13} className="animate-spin text-[#8D8D93]" />
                          <div className="flex flex-col">
                            <span className="text-[10px] font-mono text-[#8D8D93]">
                              {track.downloadProgress || 0}%
                            </span>
                            <div className="w-16 h-1 bg-[#34343A] rounded-[2px] overflow-hidden">
                              <div
                                className="h-full bg-[#F4F4F0] transition-all duration-200"
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
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-[#1F1F23] hover:bg-[#34343A] text-[#8D8D93] hover:text-[#F4F4F0] text-[11px] font-medium transition-colors cursor-pointer"
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
                            className="p-1.5 rounded-[6px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#34343A] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
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
                            className="p-1.5 rounded-[6px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#34343A] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
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
                          className="p-1.5 rounded-[6px] text-[#8D8D93] hover:text-[#E07A7A] hover:bg-[#34343A] transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
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
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#17171A] text-[#F4F4F0] px-5 py-2.5 rounded-[8px] shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center gap-1.5 pr-2">
            <span className="text-xs font-semibold text-[#F4F4F0] font-mono">{selectedTrackIds.size}</span>
            <span className="text-xs text-[#8D8D93]">dipilih</span>
          </div>

          <div className="h-4 w-[1px] bg-[#34343A]" />

          {/* Action: Play Selected */}
          <button
            onClick={handlePlaySelected}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#F4F4F0] text-[#0B0B0C] rounded-[6px] text-xs font-semibold shadow-sm transition-all active:scale-95 cursor-pointer hover:brightness-95"
            title="Putar lagu-lagu yang dipilih"
          >
            <Play size={13} fill="currentColor" />
            <span>Putar</span>
          </button>

          {/* Action: Add to Queue */}
          {onAddTracksToQueue && (
            <button
              onClick={handleQueueSelected}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[6px] text-xs font-medium transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[6px] text-xs font-medium transition-colors cursor-pointer"
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
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[6px] text-xs font-medium transition-colors cursor-pointer"
              title="Masukkan lagu yang dipilih ke playlist"
            >
              <ListPlus size={14} className="text-[#F4F4F0]" />
              <span>Masukkan ke Playlist</span>
            </button>
          )}

          {/* Action: Delete Selected */}
          <button
            onClick={handleRemoveSelected}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1F1F23] hover:bg-[#34343A] text-[#E07A7A] rounded-[6px] text-xs font-medium transition-colors cursor-pointer"
            title="Hapus lagu yang dipilih"
          >
            <Trash2 size={13} />
            <span>Hapus</span>
          </button>

          {/* Clear Selection */}
          <button
            onClick={clearSelection}
            className="p-1 hover:bg-[#34343A] text-[#8D8D93] hover:text-[#F4F4F0] rounded-[4px] transition-colors ml-1 cursor-pointer"
            title="Batalkan pilihan"
          >
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
};
