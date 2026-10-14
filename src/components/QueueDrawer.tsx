import React from 'react';
import { Track } from '../types/music';
import {
  X,
  Trash2,
  Play,
  Music2,
  Volume2,
  ListMusic,
  Music,
} from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  tracks: Track[];
  currentTrack: Track | null;
  isPlaying: boolean;
  onSelectTrack: (trackId: string) => void;
  onRemoveTrack: (trackId: string) => void;
  onClearQueue: () => void;
  onStartDownload?: (track: Track) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${mins}:${formattedSecs}`;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  isOpen,
  onClose,
  tracks,
  currentTrack,
  isPlaying,
  onSelectTrack,
  onRemoveTrack,
  onClearQueue,
}) => {
  if (!isOpen) return null;

  const currentIdx = currentTrack ? tracks.findIndex((t) => t.id === currentTrack.id) : -1;
  const upNextTracks = currentIdx >= 0 ? tracks.slice(currentIdx + 1) : tracks;
  const previousTracks = currentIdx > 0 ? tracks.slice(0, currentIdx) : [];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-[360px] max-w-[90vw] bg-[#17171A] shadow-2xl flex flex-col transition-all duration-300 animate-in slide-in-from-right font-['Sora']">
      {/* Header */}
      <div className="p-4 px-5 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#1F1F23] text-[#F4F4F0] flex items-center justify-center">
            <ListMusic size={16} />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-[#F4F4F0] tracking-tight uppercase">Antrean</h2>
            <p className="text-[10px] text-[#8D8D93] font-['JetBrains_Mono']">
              {tracks.length} lagu di antrean
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {tracks.length > 0 && (
            <button
              onClick={onClearQueue}
              className="p-2 text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] rounded-[8px] transition-colors cursor-pointer"
              title="Kosongkan Antrean"
            >
              <Trash2 size={15} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] rounded-[8px] transition-colors cursor-pointer"
            title="Tutup Antrean"
          >
            <X size={17} />
          </button>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Section 1: Now Playing */}
        {currentTrack ? (
          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-[#8D8D93] mb-2 px-1">
              Sedang Diputar
            </h3>
            <div className="p-3.5 rounded-[10px] bg-[#1F1F23] flex items-center gap-3">
              {/* Thumbnail */}
              <div className="relative w-12 h-12 rounded-[6px] overflow-hidden bg-[#0B0B0C] flex-shrink-0 group">
                {currentTrack.thumbnailUrl ? (
                  <img
                    src={currentTrack.thumbnailUrl}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#8D8D93] bg-[#0B0B0C]">
                    <Music2 size={20} />
                  </div>
                )}
                {isPlaying && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="flex items-end gap-0.5 h-3.5">
                      <span className="w-1 bg-[#F4F4F0] rounded-t animate-[bounce_1s_infinite_100ms] h-full" />
                      <span className="w-1 bg-[#F4F4F0] rounded-t animate-[bounce_1s_infinite_300ms] h-2/3" />
                      <span className="w-1 bg-[#F4F4F0] rounded-t animate-[bounce_1s_infinite_200ms] h-4/5" />
                    </div>
                  </div>
                )}
              </div>

              {/* Title & Artist */}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-[#F4F4F0] truncate">{currentTrack.title}</p>
                <p className="text-[11px] text-[#8E8E93] truncate mt-0.5">{currentTrack.artist}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-medium text-[#F4F4F0] flex items-center gap-1">
                    <Volume2 size={11} /> Aktif
                  </span>
                  <span className="text-[10px] text-[#8E8E93] font-['JetBrains_Mono']">
                    {formatDuration(currentTrack.duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Section 2: Up Next */}
        <div>
          <div className="flex items-center justify-between mb-2 px-1">
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-[#8E8E93]">
              Berikutnya ({upNextTracks.length})
            </h3>
          </div>

          {upNextTracks.length === 0 ? (
            <div className="text-center py-8 px-4 rounded-[10px] bg-[#1F1F23]/60">
              <Music size={20} className="mx-auto text-[#8D8D93] mb-2" />
              <p className="text-xs text-[#F4F4F0] font-medium">Antrean kosong</p>
              <p className="text-[11px] text-[#8D8D93] mt-1 max-w-[200px] mx-auto">
                Pilih lagu untuk menambahkannya ke antrean.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {upNextTracks.map((track, i) => (
                <div
                  key={`${track.id}-${i}`}
                  className="group flex items-center justify-between p-2 rounded-[8px] hover:bg-[#1F1F23] transition-all cursor-pointer"
                  onClick={() => onSelectTrack(track.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    {/* Thumbnail */}
                    <div className="relative w-9 h-9 rounded-[6px] overflow-hidden bg-[#0B0B0C] flex-shrink-0 flex items-center justify-center">
                      {track.thumbnailUrl ? (
                        <img
                          src={track.thumbnailUrl}
                          alt={track.title}
                          className="w-full h-full object-cover group-hover:opacity-40 transition-opacity"
                        />
                      ) : (
                        <Music size={14} className="text-[#8D8D93] group-hover:opacity-40" />
                      )}
                      <Play
                        size={13}
                        className="absolute text-[#F4F4F0] opacity-0 group-hover:opacity-100 transition-opacity fill-[#F4F4F0]"
                      />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-medium text-[#F4F4F0] truncate">
                        {track.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[10px] text-[#8D8D93]">
                        <span className="truncate">{track.artist}</span>
                        {track.sourceType === 'youtube' && (
                          <YoutubeIcon size={10} className="text-[#8D8D93] flex-shrink-0" />
                        )}
                        {track.sourceType === 'm3u' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-[4px] bg-[#1F1F23] text-[#8D8D93] font-['JetBrains_Mono']">
                            M3U
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pl-2">
                    <span className="text-[11px] font-['JetBrains_Mono'] text-[#8D8D93] group-hover:hidden">
                      {formatDuration(track.duration)}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveTrack(track.id);
                      }}
                      className="hidden group-hover:block p-1 text-[#8D8D93] hover:text-[#E07A7A] hover:bg-[#34343A] rounded-[6px] transition-colors cursor-pointer"
                      title="Hapus dari antrean"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 3: Previous tracks (if any) */}
        {previousTracks.length > 0 && (
          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-[#8D8D93] mb-2 px-1">
              Diputar Sebelumnya ({previousTracks.length})
            </h3>
            <div className="space-y-1 opacity-60 hover:opacity-100 transition-opacity">
              {previousTracks.map((track, i) => (
                <div
                  key={`prev-${track.id}-${i}`}
                  className="group flex items-center justify-between p-2 rounded-[8px] hover:bg-[#1F1F23] transition-colors cursor-pointer"
                  onClick={() => onSelectTrack(track.id)}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-[6px] overflow-hidden bg-[#0B0B0C] flex-shrink-0 flex items-center justify-center">
                      {track.thumbnailUrl ? (
                        <img
                          src={track.thumbnailUrl}
                          alt={track.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Music size={12} className="text-[#8D8D93]" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-[#F4F4F0] truncate">{track.title}</p>
                      <p className="text-[10px] text-[#8D8D93] truncate">{track.artist}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-['JetBrains_Mono'] text-[#8D8D93]">
                    {formatDuration(track.duration)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
