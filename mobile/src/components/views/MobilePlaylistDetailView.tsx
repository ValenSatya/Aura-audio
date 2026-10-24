import React, { useState } from 'react';
import { Track } from '../../types/music';
import {
  SFChevronLeft,
  SFPlayFill,
  SFShuffle,
  SFMusicNote,
  SFArrowDownCircle,
  SFEllipsis,
  SFCheckmark,
} from '../common/AppleIcons';
import { MobileDownloadService } from '../../services/mobileDownloadService';
import { MobileSongActionMenu } from '../MobileSongActionMenu';
import { MobileAddToPlaylistModal } from '../MobileAddToPlaylistModal';

interface MobilePlaylistDetailViewProps {
  playlist: {
    id: string;
    name: string;
    description?: string;
    curator?: string;
    coverUrl?: string;
    tracks: Track[];
  };
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], startIndex?: number) => void;
  onShuffle: (tracks: Track[]) => void;
  onOpenSongInfo?: (track: Track) => void;
}

export const MobilePlaylistDetailView: React.FC<MobilePlaylistDetailViewProps> = ({
  playlist,
  onBack,
  onPlayTrack,
  onPlayAll,
  onShuffle,
  onOpenSongInfo,
}) => {
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [actionMenuTrack, setActionMenuTrack] = useState<Track | null>(null);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  React.useEffect(() => {
    MobileDownloadService.getDownloadedTracks().then((list) => {
      setDownloadedIds(new Set(list.map((t) => t.id)));
    });
  }, []);

  const totalDuration = playlist.tracks.reduce((acc, t) => acc + (t.duration || 210), 0);
  const totalMinutes = Math.floor(totalDuration / 60);

  const heroCover = playlist.coverUrl || playlist.tracks[0]?.thumbnailUrl || '/assets/cover747_e84f19dd.png';

  return (
    <div className="flex-1 overflow-y-auto px-5 select-none pb-44 text-white font-sans animate-in fade-in duration-200">
      {/* Top Floating Back Bar */}
      <div className="sticky top-0 z-30 pt-3 pb-2 -mx-5 px-5 flex items-center justify-between bg-black/60 backdrop-blur-xl border-b border-white/[0.06]">
        <button
          onClick={() => {
            triggerHaptic(6);
            onBack();
          }}
          className="flex items-center gap-1 text-white text-[15px] font-semibold active:opacity-70 transition-opacity"
        >
          <SFChevronLeft size={20} fill="#FFFFFF" />
          <span>Library</span>
        </button>
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Playlist</span>
      </div>

      {/* Hero Section (Matching Figma mobile - playlist 3262:4884) */}
      <div className="flex flex-col items-center text-center pt-4 pb-6">
        {/* Large Square Cover (230x230) with Drop Shadow */}
        <div className="w-[230px] h-[230px] rounded-[20px] overflow-hidden bg-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/10 relative mb-5">
          <img src={heroCover} alt={playlist.name} className="w-full h-full object-cover" />
        </div>

        {/* Title & Metadata */}
        <h1 className="text-[24px] font-bold text-white tracking-tight leading-tight px-4 line-clamp-2">
          {playlist.name}
        </h1>
        <p className="text-[13px] font-medium text-neutral-400 mt-1">
          {playlist.curator || 'Apple Music Curated'}
        </p>
        <p className="text-[11px] text-neutral-500 mt-0.5">
          {playlist.tracks.length} Songs • {totalMinutes} Minutes • Lossless
        </p>

        {playlist.description && (
          <p className="text-xs text-neutral-400/90 max-w-[310px] mt-2 leading-relaxed">
            {playlist.description}
          </p>
        )}

        {/* Apple 2-Button Action Row: Play & Shuffle */}
        <div className="flex gap-3 w-full max-w-[330px] mt-5">
          <button
            onClick={() => {
              triggerHaptic(10);
              onPlayAll(playlist.tracks, 0);
            }}
            className="flex-1 h-11 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md transition-transform"
          >
            <SFPlayFill size={15} fill="#000000" />
            Play
          </button>
          <button
            onClick={() => {
              triggerHaptic(10);
              onShuffle(playlist.tracks);
            }}
            className="flex-1 h-11 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 border border-white/10 transition-transform"
          >
            <SFShuffle size={15} fill="#FFFFFF" />
            Shuffle
          </button>
        </div>
      </div>

      {/* Tracklist (Frame 296) */}
      <div className="space-y-1 pt-2 border-t border-white/[0.08]">
        {playlist.tracks.map((track, idx) => {
          const isDownloaded = downloadedIds.has(track.id);
          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => {
                triggerHaptic(8);
                onPlayTrack(track);
              }}
              className="flex items-center justify-between p-2 rounded-2xl hover:bg-white/[0.06] active:bg-white/[0.1] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Track Number */}
                <span className="w-5 text-center text-xs font-medium tabular-nums text-neutral-500 flex-shrink-0">
                  {idx + 1}
                </span>

                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-[8px] overflow-hidden bg-neutral-900 border border-white/5 flex-shrink-0">
                  {track.thumbnailUrl ? (
                    <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <SFMusicNote size={14} fill="#8E8E93" />
                    </div>
                  )}
                </div>

                {/* Title & Artist */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-[14px] font-semibold text-white truncate tracking-tight">{track.title}</h4>
                  <p className="text-[12px] text-neutral-400 truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={async () => {
                    triggerHaptic(10);
                    await MobileDownloadService.downloadTrack(track);
                    setDownloadedIds((prev) => new Set([...prev, track.id]));
                  }}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                    isDownloaded ? 'text-white' : 'text-neutral-500 hover:text-white'
                  }`}
                  title={isDownloaded ? 'Downloaded' : 'Download'}
                >
                  {isDownloaded ? (
                    <SFCheckmark size={15} fill="#FFFFFF" />
                  ) : (
                    <SFArrowDownCircle size={17} fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={() => {
                    triggerHaptic(6);
                    setActionMenuTrack(track);
                  }}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-white"
                  title="Opsi Lagu"
                >
                  <SFEllipsis size={16} fill="currentColor" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Song Action Menu */}
      <MobileSongActionMenu
        isOpen={!!actionMenuTrack}
        onClose={() => setActionMenuTrack(null)}
        track={actionMenuTrack}
        onAddToPlaylist={(t) => setAddToPlaylistTrack(t)}
        onPlayNext={(t) => onPlayTrack(t)}
        onDownload={async (t) => {
          await MobileDownloadService.downloadTrack(t);
          setDownloadedIds((prev) => new Set([...prev, t.id]));
        }}
        onOpenSongInfo={(t) => {
          if (onOpenSongInfo) onOpenSongInfo(t);
        }}
      />

      {/* Add To Playlist Modal */}
      <MobileAddToPlaylistModal
        isOpen={!!addToPlaylistTrack}
        onClose={() => setAddToPlaylistTrack(null)}
        track={addToPlaylistTrack}
      />
    </div>
  );
};
