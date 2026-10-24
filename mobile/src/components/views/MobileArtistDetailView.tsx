import React, { useState, useEffect } from 'react';
import { Track } from '../../types/music';
import {
  SFChevronLeft,
  SFPlayFill,
  SFHeart,
  SFHeartFill,
  SFMusicNote,
  SFArrowDownCircle,
  SFCheckmark,
  SFDisc,
  SFChevronRight,
} from '../common/AppleIcons';
import { MobileDownloadService } from '../../services/mobileDownloadService';
import { ApiClient, ArtistDetail } from '../../services/apiClient';

interface MobileArtistDetailViewProps {
  artistId?: string;
  artistName: string;
  onBack: () => void;
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist?: (tracks: Track[], startIndex?: number) => void;
  onSelectAlbum?: (albumId: string) => void;
  onSelectArtist?: (artistId: string, artistName: string) => void;
}

export const MobileArtistDetailView: React.FC<MobileArtistDetailViewProps> = ({
  artistId,
  artistName,
  onBack,
  onPlayTrack,
  onPlayPlaylist,
  onSelectAlbum,
  onSelectArtist,
}) => {
  const [isFollowing, setIsFollowing] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [artistDetail, setArtistDetail] = useState<ArtistDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  useEffect(() => {
    MobileDownloadService.getDownloadedTracks().then((list) => {
      setDownloadedIds(new Set(list.map((t) => t.id)));
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);

    const targetKey = artistName || artistId || '';
    if (!targetKey) return;
    ApiClient.getArtistDetail(targetKey).then((data) => {
      if (!active) return;
      if (data) {
        setArtistDetail(data);
      }
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [artistId, artistName]);

  const displayName = artistDetail?.name || artistName;
  const heroImage = artistDetail?.bannerUrl || '';
  const topSongs = artistDetail?.topSongs || [];
  const albums = artistDetail?.albums || [];
  const singles = artistDetail?.singles || [];
  const videos = artistDetail?.videos || [];
  const related = artistDetail?.relatedArtists || [];

  return (
    <div className="flex-1 overflow-y-auto select-none pb-44 text-white font-sans animate-in fade-in duration-200 scrollbar-none">
      {/* Hero Banner with Dark Vignette Gradient (Matching Figma mobile - artist 3267:5534) */}
      <div className="relative w-full h-[300px] overflow-hidden bg-neutral-900">
        {heroImage ? (
          <img
            src={heroImage}
            alt={displayName}
            className="w-full h-full object-cover scale-105 transition-opacity duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-b from-neutral-800 to-black flex items-center justify-center">
            <SFMusicNote size={64} fill="#52525B" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/30" />

        {/* Back Button */}
        <button
          onClick={() => {
            triggerHaptic(6);
            onBack();
          }}
          className="absolute top-4 left-4 z-20 w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white active:scale-95 transition-transform"
        >
          <SFChevronLeft size={20} fill="#FFFFFF" />
        </button>

        {/* Artist Name & Actions */}
        <div className="absolute bottom-4 left-5 right-5 z-20">
          <p className="text-[11px] uppercase tracking-widest font-bold text-neutral-400">Artist</p>
          <h1 className="text-[30px] font-bold text-white tracking-tight leading-tight line-clamp-1 drop-shadow-md">
            {displayName}
          </h1>
          <p className="text-xs text-neutral-300 mt-1">
            {artistDetail?.subscribers ? `${artistDetail.subscribers} • ` : ''}Verified Artist
          </p>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={() => {
                triggerHaptic(10);
                if (topSongs.length > 0) {
                  if (onPlayPlaylist) {
                    onPlayPlaylist(topSongs, 0);
                  } else {
                    onPlayTrack(topSongs[0]);
                  }
                }
              }}
              disabled={topSongs.length === 0}
              className="h-10 px-6 rounded-full bg-white text-black font-semibold text-xs flex items-center gap-2 active:scale-95 shadow-md transition-transform disabled:opacity-50"
            >
              <SFPlayFill size={14} fill="#000000" />
              Play
            </button>
            <button
              onClick={() => {
                triggerHaptic(8);
                setIsFollowing(!isFollowing);
              }}
              className={`h-10 px-4 rounded-full border text-xs font-semibold flex items-center gap-1.5 active:scale-95 transition-all ${
                isFollowing
                  ? 'bg-white/20 border-white/40 text-white'
                  : 'bg-black/50 backdrop-blur-md border-white/20 text-neutral-300 hover:text-white'
              }`}
            >
              {isFollowing ? (
                <>
                  <SFHeartFill size={14} fill="#FFFFFF" />
                  <span>Following</span>
                </>
              ) : (
                <>
                  <SFHeart size={14} fill="currentColor" />
                  <span>Follow</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-6 pt-5">
        {loading ? (
          <div className="space-y-4 pt-2">
            <div className="h-5 w-28 bg-white/10 rounded-full animate-pulse" />
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-14 bg-white/5 rounded-2xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <>
            {/* Section 1: Top Songs */}
            {topSongs.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[18px] font-bold text-white tracking-tight">Top Songs</h2>
                <div className="space-y-1.5">
                  {topSongs.slice(0, 5).map((track, idx) => {
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
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <span className="w-4 text-center text-xs font-medium tabular-nums text-neutral-500 flex-shrink-0">
                            {idx + 1}
                          </span>
                          <div className="w-11 h-11 rounded-[8px] overflow-hidden bg-neutral-900 border border-white/5 flex-shrink-0">
                            {track.thumbnailUrl ? (
                              <img src={track.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <SFMusicNote size={14} fill="#8E8E93" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4 className="text-[14px] font-semibold text-white truncate tracking-tight">{track.title}</h4>
                            <p className="text-[11.5px] text-neutral-400 truncate mt-0.5">{track.album || displayName}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={async () => {
                              triggerHaptic(10);
                              await MobileDownloadService.downloadTrack(track);
                              setDownloadedIds((prev) => new Set([...prev, track.id]));
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-neutral-500 hover:text-white"
                          >
                            {isDownloaded ? <SFCheckmark size={15} fill="#FFFFFF" /> : <SFArrowDownCircle size={17} fill="currentColor" />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 2: Studio Albums */}
            {albums.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-[18px] font-bold text-white tracking-tight">Studio Albums</h2>
                </div>
                <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none snap-x">
                  {albums.map((alb, i) => (
                    <div
                      key={`${alb.id}-${i}`}
                      onClick={() => onSelectAlbum && onSelectAlbum(alb.id)}
                      className="w-36 flex-shrink-0 cursor-pointer group active:scale-95 transition-transform snap-start"
                    >
                      <div className="w-36 h-36 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-md mb-2 relative">
                        {alb.thumbnailUrl ? (
                          <img
                            src={alb.thumbnailUrl}
                            alt={alb.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <SFDisc size={28} fill="#8E8E93" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-[13px] font-semibold text-white truncate">{alb.title}</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">
                        Album {alb.year ? `• ${alb.year}` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 3: Singles & EPs */}
            {singles.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[18px] font-bold text-white tracking-tight">Singles & EPs</h2>
                <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none snap-x">
                  {singles.map((s, i) => (
                    <div
                      key={`${s.id}-${i}`}
                      onClick={() => onSelectAlbum && onSelectAlbum(s.id)}
                      className="w-32 flex-shrink-0 cursor-pointer group active:scale-95 transition-transform snap-start"
                    >
                      <div className="w-32 h-32 rounded-2xl overflow-hidden bg-neutral-900 border border-white/10 shadow-md mb-2">
                        {s.thumbnailUrl ? (
                          <img
                            src={s.thumbnailUrl}
                            alt={s.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <SFDisc size={24} fill="#8E8E93" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-[12.5px] font-semibold text-white truncate">{s.title}</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Single {s.year ? `• ${s.year}` : ''}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 4: Music Videos */}
            {videos.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[18px] font-bold text-white tracking-tight">Music Videos</h2>
                <div className="flex gap-4 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none snap-x">
                  {videos.map((vid) => (
                    <div
                      key={vid.id}
                      onClick={() => {
                        triggerHaptic(8);
                        onPlayTrack({
                          id: vid.id,
                          title: vid.title,
                          artist: vid.artist || displayName,
                          duration: vid.duration || 210,
                          url: `https://www.youtube.com/watch?v=${vid.id}`,
                          thumbnailUrl: vid.thumbnailUrl,
                          sourceType: 'youtube',
                          dateAdded: Date.now(),
                        });
                      }}
                      className="flex-shrink-0 w-[240px] cursor-pointer group snap-start active:scale-95 transition-transform"
                    >
                      <div className="w-[240px] h-[135px] rounded-xl overflow-hidden relative shadow-md bg-neutral-900 border border-white/10">
                        <img
                          src={vid.thumbnailUrl}
                          alt={vid.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                          <div className="w-9 h-9 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 active:scale-95 transition-transform">
                            <SFPlayFill size={14} fill="#FFFFFF" className="translate-x-0.5" />
                          </div>
                        </div>
                      </div>
                      <h4 className="text-[13px] font-medium text-white truncate mt-1.5">{vid.title}</h4>
                      <p className="text-[11.5px] text-neutral-500 truncate mt-0.5">Music Video</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 5: Fans Might Also Like */}
            {related.length > 0 && (
              <div className="space-y-3">
                <h2 className="text-[18px] font-bold text-white tracking-tight">Fans Might Also Like</h2>
                <div className="flex gap-3.5 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-none snap-x">
                  {related.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => onSelectArtist && onSelectArtist(art.id, art.name)}
                      className="w-28 flex-shrink-0 cursor-pointer group active:scale-95 transition-transform text-center snap-start"
                    >
                      <div className="w-28 h-28 rounded-full overflow-hidden bg-neutral-900 border border-white/10 shadow-md mb-2 mx-auto">
                        {art.thumbnailUrl ? (
                          <img
                            src={art.thumbnailUrl}
                            alt={art.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <SFMusicNote size={24} fill="#8E8E93" />
                          </div>
                        )}
                      </div>
                      <h4 className="text-[12.5px] font-semibold text-white truncate">{art.name}</h4>
                      <p className="text-[11px] text-neutral-500 mt-0.5">Artist</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Section 6: About Artist */}
            {artistDetail?.description && (
              <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5 space-y-2">
                <h3 className="text-sm font-semibold text-white">About {displayName}</h3>
                <p className="text-xs text-neutral-400 leading-relaxed whitespace-pre-line">
                  {artistDetail.description}
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
