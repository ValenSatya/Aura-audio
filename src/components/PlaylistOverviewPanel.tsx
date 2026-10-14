import React from 'react';
import { Track, UserProfile } from '../types/music';
import { useTrackCover } from '../utils/coverArt';
import { useCoverColors } from '../hooks/useCoverColors';
import { Radio, HardDrive, X, Disc } from 'lucide-react';

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
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
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
}) => {
  const coverUrl = useTrackCover(
    currentTrack?.title || '',
    currentTrack?.artist || '',
    currentTrack?.thumbnailUrl
  );
  const coverColors = useCoverColors(coverUrl || currentTrack?.thumbnailUrl);
  const isDynamicOn = dynamicLighting?.enabled ?? true;
  const glowOpacity = !isDynamicOn
    ? 0
    : dynamicLighting?.intensity === 'vibrant'
    ? 0.35
    : dynamicLighting?.intensity === 'subtle'
    ? 0.12
    : 0.22;

  if (!isOpen) return null;

  return (
    <aside className="w-72 lg:w-80 flex-shrink-0 rounded-[10px] bg-[#17171A] flex flex-col justify-between overflow-hidden select-none p-4 relative z-20 transition-all duration-300 animate-in fade-in slide-in-from-right-4 font-['Sora']">
      {/* Dynamic Ambient Light inside the overview panel */}
      {isDynamicOn && (
        <div
          className="absolute -top-16 -right-16 w-56 h-56 rounded-full blur-[80px] pointer-events-none transition-all duration-1000 ease-out z-0"
          style={{
            backgroundColor: coverColors.primary,
            opacity: glowOpacity,
          }}
        />
      )}

      {/* Top Close Button */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-[8px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] transition-colors z-20 cursor-pointer"
          title="Tutup Panel"
        >
          <X size={15} />
        </button>
      )}

      <div className="flex flex-col gap-4 relative z-10">
        {/* Artwork Card */}
        <div className="relative aspect-square w-full rounded-[8px] overflow-hidden bg-[#0B0B0C] shadow-lg flex items-center justify-center">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={currentTrack?.title || 'Cover'}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 text-[#8D8D93]">
              <Disc size={40} strokeWidth={1.5} className="animate-spin-slow opacity-60" />
              <span className="text-[11px] font-medium text-[#8D8D93]">Pilih lagu untuk memutar</span>
            </div>
          )}

          {currentTrack && (
            <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between">
              <span className="text-[10px] font-['JetBrains_Mono'] px-2 py-0.5 rounded-[4px] bg-[#0B0B0C]/85 backdrop-blur-md flex items-center gap-1.5 text-[#F4F4F0]">
                {currentTrack.isOffline ? (
                  <>
                    <HardDrive size={10} className="text-[#8D8D93]" /> Offline
                  </>
                ) : (
                  <>
                    <Radio size={10} className="text-[#8D8D93]" /> Stream
                  </>
                )}
              </span>
            </div>
          )}
        </div>

        {/* Track / Playlist Title Info */}
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-wider text-[#8D8D93] font-medium">
            {currentTrack ? 'Sedang Diputar' : 'Playlist Aktif'}
          </p>
          <h3 className="text-sm font-semibold text-[#F4F4F0] tracking-tight truncate">
            {currentTrack ? currentTrack.title : activePlaylistTitle}
          </h3>
          <p className="text-xs text-[#8D8D93] truncate">
            {currentTrack
              ? currentTrack.artist
              : userProfile?.isLoggedIn
              ? userProfile.name || 'Akun Pengguna'
              : 'Koleksi Pribadi'}
          </p>
        </div>

        {/* Metadata Details */}
        <div className="p-3.5 rounded-[8px] bg-[#1F1F23] space-y-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#8D8D93]">Sumber Audio</span>
            <span className="text-[#F4F4F0] font-medium capitalize">
              {currentTrack?.sourceType === 'youtube'
                ? 'YouTube Music'
                : currentTrack?.sourceType === 'local'
                ? 'File Lokal'
                : 'Cloud Stream'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#8D8D93]">Durasi</span>
            <span className="text-[#F4F4F0] font-['JetBrains_Mono']">
              {currentTrack ? formatDuration(currentTrack.duration) : '--:--'}
            </span>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-[#8D8D93]">Status Penyimpanan</span>
            <span className="text-[#F4F4F0] font-medium">
              {currentTrack?.isOffline ? 'Tersimpan Offline' : 'Streaming Online'}
            </span>
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="pt-4 grid grid-cols-2 gap-3 text-center">
        <div className="p-2.5 rounded-[8px] bg-[#1F1F23]">
          <span className="text-[10px] text-[#8D8D93] block mb-0.5">Total Antrean</span>
          <span className="text-xs font-medium font-['JetBrains_Mono'] text-[#F4F4F0]">
            {trackCount > 0 ? `${trackCount} Lagu` : '0 Lagu'}
          </span>
        </div>

        <div className="p-2.5 rounded-[8px] bg-[#1F1F23]">
          <span className="text-[10px] text-[#8D8D93] block mb-0.5">Kualitas Audio</span>
          <span className="text-xs font-medium font-['JetBrains_Mono'] text-[#F4F4F0]">
            {currentTrack?.sourceType === 'local' ? 'Lossless/HQ' : '256 kbps'}
          </span>
        </div>
      </div>
    </aside>
  );
};
