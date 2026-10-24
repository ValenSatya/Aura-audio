import React, { useRef, useEffect, useState } from 'react';
import { Track } from '../../types/music';
import { UserProfile, ApiClient, HomeFeedData } from '../../services/apiClient';
import {
  SFPlayFill,
  SFChevronRight,
  SFStar,
  SFEllipsis,
  SFArrowDownCircle,
  SFPersonCropCircle,
} from '../common/AppleIcons';
import { animateViewEntrance } from '../../utils/animations';

interface MobileHomeViewProps {
  tracks: Track[];
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist: (tracks: Track[], startIndex?: number) => void;
  onOpenProfile?: () => void;
  onOpenAuth?: (mode?: 'login' | 'register') => void;
  onSelectAlbum?: (albumId: string, albumTitle?: string) => void;
  onSelectArtist?: (artistId?: string, artistName?: string) => void;
  user?: UserProfile | null;
}

export const MobileHomeView: React.FC<MobileHomeViewProps> = ({
  tracks,
  onPlayTrack,
  onPlayPlaylist,
  onOpenProfile,
  onOpenAuth,
  onSelectAlbum,
  onSelectArtist,
  user,
}) => {
  const viewRef = useRef<HTMLDivElement>(null);
  const [homeFeed, setHomeFeed] = useState<HomeFeedData | null>(null);

  useEffect(() => {
    if (viewRef.current) {
      animateViewEntrance(viewRef.current);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    ApiClient.getHomeFeed()
      .then((data) => {
        if (isMounted && data) {
          setHomeFeed(data);
        }
      })
      .catch((err) => {
        console.warn('Failed to load home feed:', err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  // Curated Fallback Top Hit Songs (100% Full Top Lagu Asli)
  const fallbackTopSongs: {
    id: string;
    tag: string;
    title: string;
    artist: string;
    album: string;
    thumbnailUrl: string;
    rawTrack?: Track;
  }[] = [
    {
      id: 'song-espresso',
      tag: 'Top Hit',
      title: 'Espresso',
      artist: 'Sabrina Carpenter',
      album: 'Short n’ Sweet',
      thumbnailUrl: 'https://lh3.googleusercontent.com/FMh1mOI0ufvUCAkbUM6aUmU5WK7O5PnndyyXKP1-DCEip20SQz5eeYn3lZ29p-ASb-19ZfBVc_NKe5Ko=w544-h544-l90-rj',
    },
    {
      id: 'song-blinding-lights',
      tag: 'Global Hit',
      title: 'Blinding Lights',
      artist: 'The Weeknd',
      album: 'After Hours',
      thumbnailUrl: 'https://lh3.googleusercontent.com/U-SAmNOu4TynE818gLCfKsuHZ0U5YNEtO9mrjSI9WCCKERs98LzrCal5kajBBTQNwdcisoB2Bn-pHp4=w544-h544-l90-rj',
    },
    {
      id: 'song-birds-of-feather',
      tag: 'Trending Song',
      title: 'Birds of a Feather',
      artist: 'Billie Eilish',
      album: 'HIT ME HARD AND SOFT',
      thumbnailUrl: 'https://lh3.googleusercontent.com/tQC4rOL6xz6FhmFr0ggQExxyGbYSOsyveXVSnPBh2WjEyIzQ9pMHablLJ-0GlMBrLBlBrbWQGmzrV6KN=w544-h544-l90-rj',
    },
    {
      id: 'song-die-with-smile',
      tag: 'Popular Hit',
      title: 'Die With A Smile',
      artist: 'Lady Gaga & Bruno Mars',
      album: 'Single • 2024',
      thumbnailUrl: 'https://lh3.googleusercontent.com/LGakWMVZWC03VdfhpQmXbEci5o6B1e6NqvElGbEY0vMP5wCJhIZHwgFQoWCkX5WQDWly9JCNRRABmGm2=w544-h544-l90-rj',
    },
    {
      id: 'song-apt',
      tag: 'Viral Hit',
      title: 'APT.',
      artist: 'ROSÉ & Bruno Mars',
      album: 'rosie • 2024',
      thumbnailUrl: 'https://yt3.googleusercontent.com/-MtYkhdYuOvj8YWHA4afh-OUYMYHNpBpkk047QgGAxLJMLE570Pj0-LQjA2PW1ltedqTusKOjzXvuS8=w544-h544-l90-rj',
    },
    {
      id: 'song-taste',
      tag: 'Hot Track',
      title: 'Taste',
      artist: 'Sabrina Carpenter',
      album: 'Short n’ Sweet',
      thumbnailUrl: 'https://lh3.googleusercontent.com/FMh1mOI0ufvUCAkbUM6aUmU5WK7O5PnndyyXKP1-DCEip20SQz5eeYn3lZ29p-ASb-19ZfBVc_NKe5Ko=w544-h544-l90-rj',
    },
    {
      id: 'song-starboy',
      tag: 'Chart Leader',
      title: 'Starboy',
      artist: 'The Weeknd',
      album: 'Starboy',
      thumbnailUrl: 'https://yt3.googleusercontent.com/dcxXIIlest09vnvKznWM9VWQXu1EL7lKxBzXGzwgmVjmMNBm1dEWT_0qn1xrEZYyKF_qRE1TLq8P_JY_mQ=w544-h544-l90-rj',
    },
    {
      id: 'song-training-season',
      tag: 'Dance Pop',
      title: 'Training Season',
      artist: 'Dua Lipa',
      album: 'Radical Optimism',
      thumbnailUrl: 'https://yt3.googleusercontent.com/5d51ZlGjNP_Gss3Z3RKP7B98ASQ7pxvp4XI3IAQ3kniFFjgLPDPnR6_K3tYZGoMVvfJYXBtu3awwsTI=w544-h544-l90-rj',
    },
  ];

  // Natural variety of tags for Top Songs (No repetitive text)
  const SONG_TAGS = ['Top Hit', 'Trending Song', 'Global Hit', 'Viral Hit', 'Hot Track', 'Popular Hit', 'New Single', 'Chart Leader'];

  const displayedTopSongs =
    homeFeed?.newReleases && homeFeed.newReleases.length > 0
      ? homeFeed.newReleases.map((t, idx) => ({
          id: t.id,
          tag: SONG_TAGS[idx % SONG_TAGS.length],
          title: t.title,
          artist: t.artist,
          album: t.album || 'Single',
          thumbnailUrl: t.thumbnailUrl || '/assets/cover748_0643063b.png',
          rawTrack: t,
        }))
      : fallbackTopSongs;

  // Fallback for New Releases (if offline or loading)
  const fallbackNewReleases = [
    {
      id: 'rel-1',
      title: 'Trinkets',
      artistYear: 'Ashnikko • 2025',
      thumbnail: '/assets/thumb_trinkets.png',
      trackIdx: 0,
    },
    {
      id: 'rel-2',
      title: 'Smoochie Girl',
      artistYear: 'Ashnikko • 2025',
      thumbnail: '/assets/thumb_smoochie.png',
      trackIdx: 1,
    },
    {
      id: 'rel-3',
      title: 'Piece of You',
      artistYear: 'Joji • 2026',
      thumbnail: '/assets/thumb_pieceofyou.png',
      trackIdx: 2,
    },
    {
      id: 'rel-4',
      title: "Choosin' Texas",
      artistYear: 'Ella Langley • 2025',
      thumbnail: '/assets/thumb_choosin.png',
      trackIdx: 3,
    },
  ];

  // Fallback for Latest Albums
  const fallbackLatestAlbums = [
    {
      id: 'album-1',
      title: 'Wuthering Heights',
      artistDate: 'Charli xcx • Feb 13, 2026',
      cover: '/assets/cover276.png',
      trackIdx: 4,
    },
    {
      id: 'album-2',
      title: 'ODYSSEY',
      artistDate: 'ILLENIUM • Feb 6, 2026',
      cover: '/assets/cover277.png',
      trackIdx: 5,
    },
    {
      id: 'album-3',
      title: 'Piss in the Wind',
      artistDate: 'Joji • Feb 6, 2026',
      cover: '/assets/cover278.png',
      trackIdx: 2,
    },
    {
      id: 'album-4',
      title: 'It’s Not That Deep',
      artistDate: 'Demi Lovato • Nov 21, 2025',
      cover: '/assets/cover748_0643063b.png',
      trackIdx: 6,
    },
  ];

  // Fallback for Music Videos
  const fallbackMusicVideos = [
    {
      id: 'mv-1',
      title: 'Past Won’t Leave My Bed',
      artistYear: 'Joji • 2025',
      cover: '/assets/cover_daft_punk.png',
      trackIdx: 2,
    },
    {
      id: 'mv-2',
      title: 'Dandelion',
      artistYear: 'Ella Langley • 2025',
      cover: '/assets/cover741_73375ae3.png',
      trackIdx: 3,
    },
    {
      id: 'mv-3',
      title: 'Let You Fade',
      artistYear: 'LINKIN PARK • 2025',
      cover: '/assets/cover748_0643063b.png',
      trackIdx: 2,
    },
  ];

  return (
    <div
      ref={viewRef}
      className="flex-1 overflow-y-auto px-5 select-none pb-40 will-change-transform bg-black scrollbar-none"
    >
      {/* iOS Large Title Header: Home + Profile Avatar (Static, scrolls with content) */}
      <div className="pt-6 sm:pt-8 mb-6 flex items-center justify-between">
        <h1 className="text-[34px] font-bold text-white tracking-tight leading-none">
          Home
        </h1>

        <button
          onClick={() => {
            triggerHaptic(8);
            if (!user && onOpenAuth) {
              onOpenAuth('login');
            } else {
              onOpenProfile?.();
            }
          }}
          className="w-10 h-10 rounded-full bg-gradient-to-br from-neutral-800 to-neutral-900 border border-white/15 flex items-center justify-center text-white font-semibold text-[15px] shadow-sm active:scale-95 transition-transform"
          aria-label="Open Profile"
        >
          {user ? (
            user.name.charAt(0).toUpperCase()
          ) : (
            <SFPersonCropCircle size={22} fill="#FFFFFF" />
          )}
        </button>
      </div>

      {/* Section 1: Top Picks for You (100% Full Top Lagu, Clean Edge without Glass Effect) */}
      <div className="space-y-3">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-[20px] font-bold text-white tracking-tight">Top Picks for You</h2>
        </div>

        {/* Horizontal Snap Shelf of Top Hit Songs */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
          {displayedTopSongs.map((song) => (
            <div
              key={song.id}
              onClick={() => {
                triggerHaptic(8);
                onPlayTrack(
                  song.rawTrack || {
                    id: song.id,
                    title: song.title,
                    artist: song.artist,
                    album: song.album,
                    duration: 210,
                    thumbnailUrl: song.thumbnailUrl,
                    sourceType: 'youtube',
                    url: `https://www.youtube.com/watch?v=${song.id}`,
                    dateAdded: Date.now(),
                  }
                );
              }}
              className="flex-shrink-0 w-[185px] cursor-pointer group snap-start active:scale-[0.98] transition-all duration-150"
            >
              {/* Category Tag above card */}
              <p className="text-[12px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5 text-left">
                {song.tag}
              </p>

              {/* Clean Artwork Card (Natural edge, No forced glass border) */}
              <div className="w-[185px] h-[220px] rounded-[16px] overflow-hidden relative shadow-[0_6px_20px_rgba(0,0,0,0.7)] bg-neutral-900 border-0">
                <img
                  src={song.thumbnailUrl}
                  alt={song.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/assets/cover748_0643063b.png';
                  }}
                />

                {/* Subtle vignette gradient for readable text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent flex flex-col justify-end p-3 pointer-events-none" />

                {/* Bottom Song Title & Artist Inside Card */}
                <div className="absolute bottom-3 left-3 right-3 z-10 text-left pointer-events-none">
                  <h3 className="text-[15px] font-bold text-white tracking-tight leading-tight truncate drop-shadow-md">
                    {song.title}
                  </h3>
                  <p className="text-[12px] text-white/70 truncate mt-0.5">
                    {song.artist}
                  </p>
                </div>

                {/* Floating Play Indicator */}
                <div className="absolute bottom-3 right-3 z-10 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                  <SFPlayFill size={13} fill="#000000" className="translate-x-0.5" />
                </div>
              </div>

              {/* Text Below Card */}
              <div className="mt-2 text-left">
                <h4 className="text-[14px] font-semibold text-white truncate leading-tight">
                  {song.title}
                </h4>
                <p className="text-[13px] text-neutral-400 truncate leading-tight mt-0.5">
                  {song.artist} {song.album ? `• ${song.album}` : ''}
                </p>
              </div>
            </div>
          ))}

          <div className="w-2 flex-shrink-0" />
        </div>
      </div>

      {/* Section 2: New Releases For You (Figma Frame 32 - 40px gap from Frame 150) */}
      <div className="mt-10 space-y-3">
        {/* Section Header with Chevron (Figma Frame 43) */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer active:opacity-70 transition-opacity">
            <h2 className="text-[18px] font-bold text-white tracking-tight">New Releases For You</h2>
            <SFChevronRight size={14} className="text-white/60" />
          </div>
        </div>

        {/* Minimal 1:1 Song List (Figma Song Mobile 360x42) */}
        <div className="divide-y divide-white/[0.04]">
          {homeFeed && homeFeed.newReleases && homeFeed.newReleases.length > 0
            ? homeFeed.newReleases.slice(0, 4).map((song) => (
                <div
                  key={song.id}
                  onClick={() => {
                    triggerHaptic(8);
                    onPlayTrack(song);
                  }}
                  className="h-[48px] py-1 flex items-center justify-between cursor-pointer active:bg-white/[0.04] transition-colors rounded-md group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <img
                      src={song.thumbnailUrl || '/assets/thumb_trinkets.png'}
                      alt={song.title}
                      className="w-[34px] h-[34px] rounded-[6px] object-cover bg-neutral-800 flex-shrink-0 border border-white/5"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/cover748_0643063b.png';
                      }}
                    />
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-medium text-white truncate leading-tight group-hover:text-white">
                        {song.title}
                      </h3>
                      <p className="text-[13px] text-white/50 truncate mt-0.5 leading-tight">
                        {song.artist} {song.album ? `• ${song.album}` : ''}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3.5 flex-shrink-0 text-white/60"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => triggerHaptic(6)}
                      className="hover:text-white active:scale-90 transition-transform"
                      aria-label="Download"
                    >
                      <SFArrowDownCircle size={18} fill="#FFFFFF" />
                    </button>
                    <button
                      onClick={() => triggerHaptic(6)}
                      className="hover:text-white active:scale-90 transition-transform"
                      aria-label="Favorite"
                    >
                      <SFStar size={18} className="text-white/70" />
                    </button>
                    <button
                      onClick={() => triggerHaptic(6)}
                      className="hover:text-white active:scale-90 transition-transform"
                      aria-label="More"
                    >
                      <SFEllipsis size={18} fill="#FFFFFF" />
                    </button>
                  </div>
                </div>
              ))
            : fallbackNewReleases.map((song) => (
                <div
                  key={song.id}
                  onClick={() => {
                    triggerHaptic(8);
                    if (tracks[song.trackIdx % tracks.length]) {
                      onPlayTrack(tracks[song.trackIdx % tracks.length]);
                    }
                  }}
                  className="h-[48px] py-1 flex items-center justify-between cursor-pointer active:bg-white/[0.04] transition-colors rounded-md group"
                >
                  <div className="flex items-center gap-3 min-w-0 pr-3">
                    <img
                      src={song.thumbnail}
                      alt={song.title}
                      className="w-[34px] h-[34px] rounded-[6px] object-cover bg-neutral-800 flex-shrink-0 border border-white/5"
                      loading="lazy"
                    />
                    <div className="min-w-0">
                      <h3 className="text-[14px] font-medium text-white truncate leading-tight group-hover:text-white">
                        {song.title}
                      </h3>
                      <p className="text-[13px] text-white/50 truncate mt-0.5 leading-tight">
                        {song.artistYear}
                      </p>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3.5 flex-shrink-0 text-white/60"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() => triggerHaptic(6)}
                      className="hover:text-white active:scale-90 transition-transform"
                      aria-label="Download"
                    >
                      <SFArrowDownCircle size={18} fill="#FFFFFF" />
                    </button>
                    <button
                      onClick={() => triggerHaptic(6)}
                      className="hover:text-white active:scale-90 transition-transform"
                      aria-label="Favorite"
                    >
                      <SFStar size={18} className="text-white/70" />
                    </button>
                    <button
                      onClick={() => triggerHaptic(6)}
                      className="hover:text-white active:scale-90 transition-transform"
                      aria-label="More"
                    >
                      <SFEllipsis size={18} fill="#FFFFFF" />
                    </button>
                  </div>
                </div>
              ))}
        </div>
      </div>

      {/* Section 3: Latest Albums For You (Figma Frame 78 - 40px gap from Frame 32) */}
      <div className="mt-10 space-y-3">
        {/* Section Header with Chevron */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer active:opacity-70 transition-opacity">
            <h2 className="text-[18px] font-bold text-white tracking-tight">Latest Albums For You</h2>
            <SFChevronRight size={14} className="text-white/60" />
          </div>
        </div>

        {/* Horizontal Snap Shelf (160x160 Square Cards) */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
          {homeFeed && homeFeed.latestAlbums && homeFeed.latestAlbums.length > 0
            ? homeFeed.latestAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => {
                    triggerHaptic(8);
                    if (onSelectAlbum) {
                      onSelectAlbum(album.id, album.title);
                    }
                  }}
                  className="flex-shrink-0 w-[160px] cursor-pointer group snap-start active:scale-95 transition-all duration-150"
                >
                  <div className="w-[160px] h-[160px] rounded-[8px] overflow-hidden relative shadow-md bg-neutral-900 border border-white/5">
                    <img
                      src={album.thumbnailUrl || '/assets/cover276.png'}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/cover748_0643063b.png';
                      }}
                    />
                    <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <SFPlayFill size={14} fill="#000000" className="translate-x-0.5" />
                    </div>
                  </div>
                  <div className="mt-2 text-left">
                    <h3 className="text-[14px] font-medium text-white truncate">{album.title}</h3>
                    <p className="text-[13px] text-white/50 truncate mt-0.5">
                      {album.artist} {album.year ? `• ${album.year}` : ''}
                    </p>
                  </div>
                </div>
              ))
            : fallbackLatestAlbums.map((album) => (
                <div
                  key={album.id}
                  onClick={() => {
                    triggerHaptic(8);
                    if (tracks[album.trackIdx % tracks.length]) {
                      onPlayPlaylist(tracks, album.trackIdx % tracks.length);
                    }
                  }}
                  className="flex-shrink-0 w-[160px] cursor-pointer group snap-start active:scale-95 transition-all duration-150"
                >
                  <div className="w-[160px] h-[160px] rounded-[8px] overflow-hidden relative shadow-md bg-neutral-900 border border-white/5">
                    <img
                      src={album.cover}
                      alt={album.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute bottom-2.5 right-2.5 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                      <SFPlayFill size={14} fill="#000000" className="translate-x-0.5" />
                    </div>
                  </div>
                  <div className="mt-2 text-left">
                    <h3 className="text-[14px] font-medium text-white truncate">{album.title}</h3>
                    <p className="text-[13px] text-white/50 truncate mt-0.5">{album.artistDate}</p>
                  </div>
                </div>
              ))}
          <div className="w-2 flex-shrink-0" />
        </div>
      </div>

      {/* Section 4: New Music Videos For You (Figma Frame 76 - 40px gap from Frame 78) */}
      <div className="mt-10 space-y-3">
        {/* Section Header with Chevron */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 cursor-pointer active:opacity-70 transition-opacity">
            <h2 className="text-[18px] font-bold text-white tracking-tight">New Music Videos For You</h2>
            <SFChevronRight size={14} className="text-white/60" />
          </div>
        </div>

        {/* Horizontal Snap Shelf (284x160 16:9 Landscape Video Cards) */}
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
          {homeFeed && homeFeed.musicVideos && homeFeed.musicVideos.length > 0
            ? homeFeed.musicVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => {
                    triggerHaptic(8);
                    onPlayTrack({
                      id: video.id,
                      title: video.title,
                      artist: video.artist,
                      album: 'Music Video',
                      duration: video.duration || 210,
                      thumbnailUrl: video.thumbnailUrl,
                      sourceType: 'youtube',
                      url: `https://www.youtube.com/watch?v=${video.id}`,
                      dateAdded: Date.now(),
                    });
                  }}
                  className="flex-shrink-0 w-[284px] cursor-pointer group snap-start active:scale-95 transition-all duration-150"
                >
                  <div className="w-[284px] h-[160px] rounded-[10px] overflow-hidden relative shadow-md bg-neutral-900 border border-white/5">
                    <img
                      src={video.thumbnailUrl || '/assets/cover_daft_punk.png'}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = '/assets/cover748_0643063b.png';
                      }}
                    />
                    {/* Center Play Button for Video */}
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 active:scale-95 transition-transform">
                        <SFPlayFill size={16} fill="#FFFFFF" className="translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-left">
                    <h3 className="text-[14px] font-medium text-white truncate">{video.title}</h3>
                    <p className="text-[13px] text-white/50 truncate mt-0.5">
                      {video.artist} {video.year ? `• ${video.year}` : ''}
                    </p>
                  </div>
                </div>
              ))
            : fallbackMusicVideos.map((video) => (
                <div
                  key={video.id}
                  onClick={() => {
                    triggerHaptic(8);
                    if (tracks[video.trackIdx % tracks.length]) {
                      onPlayPlaylist(tracks, video.trackIdx % tracks.length);
                    }
                  }}
                  className="flex-shrink-0 w-[284px] cursor-pointer group snap-start active:scale-95 transition-all duration-150"
                >
                  <div className="w-[284px] h-[160px] rounded-[10px] overflow-hidden relative shadow-md bg-neutral-900 border border-white/5">
                    <img
                      src={video.cover}
                      alt={video.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    {/* Center Play Button for Video */}
                    <div className="absolute inset-0 bg-black/25 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/20 flex items-center justify-center text-white shadow-lg group-hover:scale-110 active:scale-95 transition-transform">
                        <SFPlayFill size={16} fill="#FFFFFF" className="translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 text-left">
                    <h3 className="text-[14px] font-medium text-white truncate">{video.title}</h3>
                    <p className="text-[13px] text-white/50 truncate mt-0.5">{video.artistYear}</p>
                  </div>
                </div>
              ))}
          <div className="w-2 flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};
