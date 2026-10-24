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

interface MobileAlbumDetailViewProps {
  album: {
    title: string;
    artist: string;
    year?: string;
    genre?: string;
    coverUrl?: string;
    tracks: Track[];
    copyright?: string;
  };
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onPlayAll: (tracks: Track[], startIndex?: number) => void;
  onShuffle: (tracks: Track[]) => void;
  onSelectArtist?: (artistName: string) => void;
  onOpenSongInfo?: (track: Track) => void;
}

export const MobileAlbumDetailView: React.FC<MobileAlbumDetailViewProps> = ({
  album,
  onBack,
  onPlayTrack,
  onPlayAll,
  onShuffle,
  onSelectArtist,
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

  const totalDuration = album.tracks.reduce((acc, t) => acc + (t.duration || 210), 0);
  const totalMinutes = Math.floor(totalDuration / 60);
  const cover = album.coverUrl || album.tracks[0]?.thumbnailUrl || '/assets/cover748_0643063b.png';

  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${mins}:${s < 10 ? `0${s}` : s}`;
  };

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
          <span>Kembali</span>
        </button>
        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-widest">Album</span>
      </div>

      {/* Hero Section (Matching Figma mobile - album 4142:17232) */}
      <div className="flex flex-col items-center text-center pt-4 pb-6">
        {/* Large Album Artwork */}
        <div className="w-[230px] h-[230px] rounded-[20px] overflow-hidden bg-neutral-900 shadow-[0_20px_50px_rgba(0,0,0,0.85)] border border-white/10 relative mb-5">
          <img
            src={cover}
            alt={album.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.currentTarget as HTMLImageElement).src = '/assets/cover748_0643063b.png';
            }}
          />
        </div>

        {/* Title */}
        <h1 className="text-[24px] font-bold text-white tracking-tight leading-tight px-4 line-clamp-2">
          {album.title}
        </h1>

        {/* Clickable Artist Name */}
        <button
          onClick={() => onSelectArtist && onSelectArtist(album.artist)}
          className="text-[16px] font-semibold text-neutral-300 hover:text-white mt-1 active:opacity-75 transition-colors"
        >
          {album.artist}
        </button>

        {/* Release Metadata */}
        <p className="text-[11px] text-neutral-500 mt-1 uppercase tracking-wider">
          {album.genre || 'Rock & Pop'} • {album.year || '2024'} • Lossless
        </p>

        {/* Action Buttons: Play & Shuffle */}
        <div className="flex gap-3 w-full max-w-[330px] mt-5">
          <button
            onClick={() => {
              triggerHaptic(10);
              onPlayAll(album.tracks, 0);
            }}
            className="flex-1 h-11 rounded-full bg-white text-black font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 shadow-md transition-transform"
          >
            <SFPlayFill size={15} fill="#000000" />
            Play
          </button>
          <button
            onClick={() => {
              triggerHaptic(10);
              onShuffle(album.tracks);
            }}
            className="flex-1 h-11 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 border border-white/10 transition-transform"
          >
            <SFShuffle size={15} fill="#FFFFFF" />
            Shuffle
          </button>
        </div>
      </div>

      {/* Numbered Tracklist (Frame 295) */}
      <div className="divide-y divide-white/[0.06] pt-2 border-t border-white/[0.08]">
        {album.tracks.map((track, idx) => {
          const isDownloaded = downloadedIds.has(track.id);
          const trackNo = idx + 1 < 10 ? `0${idx + 1}` : `${idx + 1}`;
          return (
            <div
              key={`${track.id}-${idx}`}
              onClick={() => {
                triggerHaptic(8);
                onPlayTrack(track);
              }}
              className="flex items-center justify-between py-3 px-1.5 hover:bg-white/[0.04] active:bg-white/[0.08] cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-4 min-w-0 flex-1">
                {/* Track Number */}
                <span className="w-5 text-left text-xs font-medium tabular-nums text-neutral-500 flex-shrink-0">
                  {trackNo}
                </span>

                {/* Track Info */}
                <div className="min-w-0 flex-1">
                  <h4 className="text-[14.5px] font-semibold text-white truncate tracking-tight">{track.title}</h4>
                  <p className="text-[11px] text-neutral-500 truncate mt-0.5">{track.artist}</p>
                </div>
              </div>

              {/* Time & Download */}
              <div className="flex items-center gap-3 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                <span className="text-xs font-medium tabular-nums text-neutral-500">
                  {formatSeconds(track.duration || 210)}
                </span>

                <button
                  onClick={async () => {
                    triggerHaptic(10);
                    await MobileDownloadService.downloadTrack(track);
                    setDownloadedIds((prev) => new Set([...prev, track.id]));
                  }}
                  className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${
                    isDownloaded ? 'text-white' : 'text-neutral-500 hover:text-white'
                  }`}
                  title={isDownloaded ? 'Downloaded' : 'Download'}
                >
                  {isDownloaded ? (
                    <SFCheckmark size={14} fill="#FFFFFF" />
                  ) : (
                    <SFArrowDownCircle size={16} fill="currentColor" />
                  )}
                </button>

                <button
                  onClick={() => {
                    triggerHaptic(6);
                    setActionMenuTrack(track);
                  }}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-neutral-500 hover:text-white"
                  title="Opsi Lagu"
                >
                  <SFEllipsis size={15} fill="currentColor" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Album Footer Info */}
      <div className="mt-8 pt-4 border-t border-white/[0.08] text-xs text-neutral-500 space-y-1">
        <p>{album.tracks.length} Songs • {totalMinutes} Minutes</p>
        <p className="text-[11px] text-neutral-600">
          {album.copyright || `℗ ${album.year || '2024'} Record Recordings LLC, under exclusive license to Apple Music`}
        </p>
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
