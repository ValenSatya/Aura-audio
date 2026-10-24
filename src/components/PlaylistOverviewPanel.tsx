import React, { useMemo } from 'react';
import { Track, UserProfile } from '../types/music';
import { useTrackCover } from '../utils/coverArt';
import { useCoverColors } from '../hooks/useCoverColors';
import {
  Radio,
  HardDrive,
  X,
  Disc,
  Play,
  ListMusic,
  Download,
  Plus,
  Sparkles,
  User,
  Music2,
  ChevronRight,
} from 'lucide-react';

interface PlaylistOverviewPanelProps {
  currentTrack: Track | null;
  activePlaylistTitle?: string;
  userProfile?: UserProfile;
  isOpen?: boolean;
  onClose?: () => void;
  trackCount?: number;
  dynamicLighting?: {
    enabled: boolean;
    intensity: 'subtle' | 'medium' | 'vibrant';
  };
  upcomingTrack?: Track | null;
  onPlayUpcoming?: () => void;
  onOpenQueue?: () => void;
  liveDuration?: number;
  onStartDownload?: (track: Track) => void;
  onOpenAddToPlaylistModal?: () => void;
  onNavigateToArtist?: (artist: string) => void;
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0 || isNaN(seconds)) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const PlaylistOverviewPanel: React.FC<PlaylistOverviewPanelProps> = ({
  currentTrack,
  activePlaylistTitle = 'Koleksi Musik',
  userProfile,
  isOpen = true,
  onClose,
  trackCount = 0,
  dynamicLighting,
  upcomingTrack,
  onPlayUpcoming,
  onOpenQueue,
  liveDuration,
  onStartDownload,
  onOpenAddToPlaylistModal,
  onNavigateToArtist,
}) => {
  const coverUrl = useTrackCover(
    currentTrack?.title || '',
    currentTrack?.artist || '',
    currentTrack?.thumbnailUrl
  );
  const coverColors = useCoverColors(coverUrl || currentTrack?.thumbnailUrl);
  const isDynamicOn = dynamicLighting?.enabled ?? true;

  const displayDuration = useMemo(() => {
    if (liveDuration && liveDuration > 0) return formatDuration(liveDuration);
    if (currentTrack?.duration && currentTrack.duration > 0) return formatDuration(currentTrack.duration);
    return '--:--';
  }, [currentTrack, liveDuration]);

  if (!isOpen) return null;

  return (
    <aside className="w-80 lg:w-84 flex-shrink-0 bg-[#121216] border-l border-white/[0.06] flex flex-col h-full overflow-hidden select-none relative z-20 transition-all duration-300 animate-in fade-in slide-in-from-right-4 shadow-2xl">
      {/* Panel Top Header Bar */}
      <div className="h-14 px-5 flex items-center justify-between border-b border-white/[0.06] flex-shrink-0 bg-[#121216]/90 backdrop-blur-md">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
          <div className="min-w-0">
            <span className="text-[11px] font-bold uppercase tracking-wider text-white block truncate">
              Sedang Diputar
            </span>
            <span className="text-[10px] text-zinc-400 block truncate">
              {activePlaylistTitle}
            </span>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            title="Tutup Panel"
          >
            <X size={15} />
          </button>
        )}
      </div>

      {/* Scrollable Content Container with Bottom Padding to avoid PlayerBar Collision */}
      <div className="flex-1 overflow-y-auto p-5 pb-36 space-y-6 scrollbar-thin">
        {/* 1. Large Cover Art with Ambient Glow */}
        <div className="relative">
          {/* Ambient Glow Backdrop */}
          {coverUrl && isDynamicOn && (
            <div
              className="absolute -inset-2 bg-cover bg-center opacity-30 filter blur-2xl scale-105 pointer-events-none rounded-2xl transition-all duration-700 -z-10"
              style={{ backgroundImage: `url(${coverUrl})` }}
            />
          )}

          <div className="relative aspect-square w-full rounded-[18px] overflow-hidden bg-[#1A1A22] border border-white/[0.08] shadow-[0_16px_36px_rgba(0,0,0,0.6)] flex items-center justify-center group">
            {coverUrl ? (
              <img
                src={coverUrl}
                alt={currentTrack?.title || 'Cover'}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 text-zinc-500">
                <Disc size={44} strokeWidth={1.5} className="animate-spin-slow opacity-60" />
                <span className="text-xs font-medium text-zinc-400">Pilih lagu untuk memutar</span>
              </div>
            )}

            {currentTrack && (
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-medium text-white shadow-md">
                {currentTrack.isOffline ? (
                  <>
                    <HardDrive size={11} className="text-emerald-400" />
                    <span>Lokal • Lossless</span>
                  </>
                ) : (
                  <>
                    <Radio size={11} className="text-blue-400" />
                    <span>Stream • 256 kbps</span>
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 2. Track Title & Artist Metadata + Quick Actions */}
        <div className="space-y-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug line-clamp-2">
              {currentTrack ? currentTrack.title : 'Tidak Ada Lagu'}
            </h2>

            {currentTrack?.artist && (
              <button
                onClick={() => onNavigateToArtist?.(currentTrack.artist)}
                className="text-xs sm:text-sm font-medium text-zinc-300 hover:text-white transition-colors truncate mt-1 flex items-center gap-1.5 text-left group/art"
                title={`Lihat artis ${currentTrack.artist}`}
              >
                <span className="group-hover/art:underline">{currentTrack.artist}</span>
                <ChevronRight size={13} className="text-zinc-500 group-hover/art:text-white transition-colors" />
              </button>
            )}
          </div>

          {/* Quick Action Buttons */}
          {currentTrack && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {onOpenAddToPlaylistModal && (
                <button
                  onClick={onOpenAddToPlaylistModal}
                  className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Tambah ke Playlist"
                >
                  <Plus size={14} />
                  <span>Playlist</span>
                </button>
              )}

              {onStartDownload && (
                <button
                  onClick={() => onStartDownload(currentTrack)}
                  className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Unduh untuk diputar offline"
                >
                  <Download size={13} />
                  <span>Unduh</span>
                </button>
              )}

              {onOpenQueue && (
                <button
                  onClick={onOpenQueue}
                  className="px-3 py-1.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-zinc-200 hover:text-white text-xs font-medium border border-white/[0.08] flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
                  title="Lihat antrean putar"
                >
                  <ListMusic size={14} />
                  <span>Antrean</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* 3. "Berikutnya di Antrean" (Next Track Preview) */}
        <div className="p-3.5 rounded-[16px] bg-[#17171C] border border-white/[0.06] space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-zinc-400 font-semibold uppercase tracking-wider">
              <Music2 size={13} />
              <span>Berikutnya</span>
            </div>
            {onOpenQueue && (
              <button
                onClick={onOpenQueue}
                className="text-[11px] text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer"
              >
                Lihat Semua ({trackCount})
              </button>
            )}
          </div>

          {upcomingTrack ? (
            <div
              onClick={onPlayUpcoming}
              className="flex items-center gap-3 p-2 rounded-xl bg-white/[0.03] hover:bg-white/[0.08] transition-all cursor-pointer group/up"
            >
              <div className="relative w-10 h-10 rounded-[8px] overflow-hidden bg-[#202028] flex-shrink-0 border border-white/[0.06]">
                {upcomingTrack.thumbnailUrl ? (
                  <img src={upcomingTrack.thumbnailUrl} alt={upcomingTrack.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <Disc size={16} />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/up:opacity-100 transition-opacity flex items-center justify-center">
                  <Play size={14} fill="white" className="text-white ml-0.5" />
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-white truncate group-hover/up:text-zinc-200">
                  {upcomingTrack.title}
                </p>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  {upcomingTrack.artist}
                </p>
              </div>

              <span className="text-[11px] font-mono text-zinc-500 flex-shrink-0">
                {formatDuration(upcomingTrack.duration)}
              </span>
            </div>
          ) : (
            <div className="py-2 text-center text-xs text-zinc-500 font-normal">
              Antrean berikutnya kosong
            </div>
          )}
        </div>

        {/* 4. "Tentang Artis" Card */}
        {currentTrack?.artist && (
          <div className="p-4 rounded-[16px] bg-[#17171C] border border-white/[0.06] space-y-3 shadow-sm">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Tentang Artis
            </span>

            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-zinc-300 font-bold text-base flex-shrink-0">
                <User size={18} />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-white truncate">
                  {currentTrack.artist}
                </h4>
                <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                  Kreator & Musisi
                </p>
              </div>
            </div>

            {onNavigateToArtist && (
              <button
                onClick={() => onNavigateToArtist(currentTrack.artist)}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-medium text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Buka Profil Artis & Diskografi</span>
                <ChevronRight size={13} />
              </button>
            )}
          </div>
        )}

        {/* 5. Audio Fidelity & Technical Specifications Chips */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 rounded-xl bg-[#17171C] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 font-medium block">Format Audio</span>
            <span className="text-xs font-mono font-semibold text-white mt-0.5 block truncate">
              {currentTrack?.sourceType === 'local' ? 'Lossless HQ' : 'AAC 256 kbps'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#17171C] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 font-medium block">Durasi</span>
            <span className="text-xs font-mono font-semibold text-white mt-0.5 block">
              {displayDuration}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#17171C] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 font-medium block">Sumber</span>
            <span className="text-xs font-semibold text-white mt-0.5 block truncate capitalize">
              {currentTrack?.sourceType === 'youtube'
                ? 'YouTube Music'
                : currentTrack?.sourceType === 'local'
                ? 'File Lokal'
                : 'Cloud Stream'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-[#17171C] border border-white/[0.06]">
            <span className="text-[10px] text-zinc-400 font-medium block">Total Antrean</span>
            <span className="text-xs font-mono font-semibold text-white mt-0.5 block">
              {trackCount} Lagu
            </span>
          </div>
        </div>
      </div>
    </aside>
  );
};
