import React, { useState, useEffect, useRef } from 'react';
import { Track, YTMusicTrackItem } from '../../types/music';
import { MobileYoutubeService } from '../../services/mobileYoutubeService';
import { MobileDownloadService } from '../../services/mobileDownloadService';
import { ApiClient } from '../../services/apiClient';
import {
  SFSearch,
  SFXmark,
  SFPlayFill,
  SFPlus,
  SFMusicNote,
  SFArrowDownCircle,
  SFArrowDown,
  SFEllipsis,
  SFCheckmark,
  SFPersonCropCircle,
  SFDisc,
  SFMic,
  SFChevronRight,
} from '../common/AppleIcons';
import { MobileSongActionMenu } from '../MobileSongActionMenu';
import { MobileAddToPlaylistModal } from '../MobileAddToPlaylistModal';
import { MobileSongInfoModal } from '../MobileSongInfoModal';
import {
  animate,
  AppleSprings,
  animatePress,
  animateViewEntrance,
  animateStaggeredList,
} from '../../utils/animations';

interface MobileSearchViewProps {
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (tracks: Track[]) => void;
  onSelectArtist?: (artistId: string, artistName: string) => void;
  onSelectAlbum?: (albumId: string, albumTitle?: string) => void;
}

type SearchCategoryTab = 'all' | 'songs' | 'artists' | 'albums';

export const MobileSearchView: React.FC<MobileSearchViewProps> = ({
  onPlayTrack,
  onAddToQueue,
  onSelectArtist,
  onSelectAlbum,
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Track[]>([]);
  const [realAlbums, setRealAlbums] = useState<{ id: string; title: string; artist: string; year?: string; thumbnailUrl: string }[]>([]);
  const [realArtists, setRealArtists] = useState<{ id: string; name: string; subscribers?: string; thumbnailUrl: string }[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [downloadedIds, setDownloadedIds] = useState<Set<string>>(new Set());
  const [activeSearchTab, setActiveSearchTab] = useState<SearchCategoryTab>('all');
  const [actionMenuTrack, setActionMenuTrack] = useState<Track | null>(null);
  const [addToPlaylistTrack, setAddToPlaylistTrack] = useState<Track | null>(null);
  const [songInfoTrack, setSongInfoTrack] = useState<Track | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resultsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (results.length > 0 && resultsContainerRef.current) {
      animateViewEntrance(resultsContainerRef.current);
    }
  }, [results, activeSearchTab]);

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  const updateDownloadedStatus = async () => {
    const downloads = await MobileDownloadService.getDownloadedTracks();
    setDownloadedIds(new Set(downloads.map((d) => d.id)));
  };

  useEffect(() => {
    updateDownloadedStatus();
    const unsub = MobileDownloadService.subscribe(updateDownloadedStatus);
    return unsub;
  }, []);

  // Figma Exact "Your Genres" (Frame 136) with real editorial artwork
  const yourGenres = [
    { title: 'Hip-Hop', cover: '/assets/cover746_33eaf06e.png', query: 'Hip-Hop Hits' },
    { title: 'Pop', cover: '/assets/cover741_73375ae3.png', query: 'Pop Hits' },
    { title: 'Rock & Metal', cover: '/assets/cover754_a152c468.png', query: 'Rock Classics' },
    { title: 'R&B / Soul', cover: '/assets/cover742_a2859d97.png', query: 'R&B Soul' },
  ];

  // Figma Exact "Browse New Music" (Frame 137) with real editorial artwork
  const browseCategories = [
    { title: 'Spatial Audio', cover: '/assets/cover748_0643063b.png', query: 'Spatial Audio' },
    { title: 'Hits Today', cover: '/assets/cover749_697d7b55.png', query: 'Top Hits Today' },
    { title: 'Dance & Electronic', cover: '/assets/cover752_99add504.png', query: 'Dance Electronic' },
    { title: 'Alternative & Indie', cover: '/assets/cover751_bdc69831.png', query: 'Alternative Indie' },
    { title: 'Chill & Relax', cover: '/assets/cover745_9f67c060.png', query: 'Chill Relax' },
    { title: 'Anime & J-Pop', cover: '/assets/cover744_7cfff703.png', query: 'Anime J-Pop' },
  ];

  // Debounced auto-search when query changes
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setRealAlbums([]);
      setRealArtists([]);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(() => {
      handleSearch(query);
    }, 450);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      setRealAlbums([]);
      setRealArtists([]);
      return;
    }
    triggerHaptic(6);
    setIsSearching(true);
    try {
      const unifiedData = await ApiClient.searchAll(searchQuery);
      if (unifiedData && (unifiedData.songs.length > 0 || unifiedData.albums.length > 0)) {
        setResults(unifiedData.songs);
        setRealAlbums(unifiedData.albums);
        setRealArtists(unifiedData.artists);
      } else {
        const searchTracks = await MobileYoutubeService.search(searchQuery);
        const convertedTracks: Track[] = searchTracks.map((item: YTMusicTrackItem) => ({
          id: item.id,
          title: item.title,
          artist: item.artist,
          duration: item.duration,
          sourceType: 'youtube',
          url: item.url,
          thumbnailUrl: item.thumbnailUrl,
          dateAdded: Date.now(),
        }));
        setResults(convertedTracks);
        setRealAlbums([]);
        setRealArtists([]);
      }
    } catch (e) {
      console.warn('Search failed:', e);
    } finally {
      setIsSearching(false);
    }
  };

  const handleDownloadTrack = async (track: Track) => {
    triggerHaptic(10);
    await MobileDownloadService.downloadTrack(track);
    await updateDownloadedStatus();
  };

  // Pure real albums from YouTube Music (no fake fabricated fallbacks)
  const displayedAlbums = realAlbums.map((a) => ({
    id: a.id,
    title: a.title,
    artist: a.artist,
    cover: a.thumbnailUrl,
    year: a.year,
  }));

  // Pure real artists from YouTube Music (no fake fabricated fallbacks)
  const displayedArtists = realArtists.map((a) => ({
    id: a.id,
    name: a.name,
    thumbnailUrl: a.thumbnailUrl,
    trackCount: undefined,
  }));

  const topResult = results[0] || null;

  return (
    <div className="flex-1 overflow-y-auto px-5 select-none pb-40 space-y-5 font-sans">
      {/* Header Matching Figma */}
      <div className="pt-4 pb-1">
        <h1 className="text-[20px] font-bold text-white tracking-tight">Search</h1>
      </div>

      {/* Search Input with Liquid Glass & iOS Fluid Animation */}
      <div className="flex items-center gap-2.5 w-full">
        <div
          onClick={() => inputRef.current?.focus()}
          className={`relative flex items-center flex-1 h-[44px] liquid-glass rounded-[14px] px-3.5 cursor-text transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isFocused
              ? 'border-white/40 ring-2 ring-white/10 shadow-[0_0_20px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.32)]'
              : 'hover:border-white/20'
          }`}
        >
          {/* 1. Search Icon with fluid scale/color transition */}
          <div className="relative z-10 flex items-center justify-center pointer-events-none mr-2.5 flex-shrink-0">
            <SFSearch
              size={17}
              fill={isFocused ? '#FFFFFF' : '#8E8E93'}
              className={`transition-all duration-300 transform ${
                isFocused ? 'scale-105 text-white' : 'text-neutral-400'
              }`}
            />
          </div>

          {/* 2. Seamless Transparent Input floating inside the liquid-glass shell */}
          <input
            ref={inputRef}
            type="text"
            value={query}
            onFocus={() => {
              triggerHaptic(5);
              setIsFocused(true);
            }}
            onBlur={() => {
              // Delay slightly so clicking Cancel or Clear registers before blur
              setTimeout(() => {
                if (!query.trim()) {
                  setIsFocused(false);
                }
              }, 180);
            }}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                inputRef.current?.blur();
                handleSearch(query);
              }
            }}
            placeholder="Artists, Songs, Lyrics, and More"
            className="w-full bg-transparent text-white text-[14px] placeholder-neutral-500 font-normal outline-none border-none p-0 focus:outline-none focus:ring-0 leading-normal"
          />

          {/* 3. Right Action: iOS Spinner, Clear (✕), or Mic */}
          <div className="relative z-10 flex items-center gap-1.5 ml-2 flex-shrink-0">
            {isSearching ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : query.length > 0 ? (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerHaptic(6);
                  setQuery('');
                  setResults([]);
                  inputRef.current?.focus();
                }}
                className="w-5 h-5 rounded-full bg-white/20 hover:bg-white/30 active:scale-75 transition-all flex items-center justify-center text-white/80 animate-pop-in cursor-pointer"
                aria-label="Hapus pencarian"
              >
                <SFXmark size={10} fill="currentColor" />
              </button>
            ) : (
              <div className="text-neutral-500 pointer-events-none flex items-center justify-center">
                <SFMic size={17} fill="#8E8E93" />
              </div>
            )}
          </div>
        </div>

        {/* 4. Fluid Animated Cancel / Batal Button */}
        <div
          className={`overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex-shrink-0 ${
            isFocused || query.length > 0
              ? 'max-w-[70px] opacity-100 translate-x-0'
              : 'max-w-0 opacity-0 translate-x-4 pointer-events-none'
          }`}
        >
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              setQuery('');
              setResults([]);
              setIsFocused(false);
              inputRef.current?.blur();
            }}
            className="text-[15px] font-medium text-white/90 hover:text-white px-1.5 py-1 whitespace-nowrap active:scale-90 transition-transform duration-150 cursor-pointer"
          >
            Batal
          </button>
        </div>
      </div>

      {/* IF SEARCH ACTIVE: Matching Figma mobile - search results (2222:8061) */}
      {query.trim().length > 0 ? (
        <div ref={resultsContainerRef} className="space-y-5 will-change-transform">
          {/* 1. Category Filter Segmented Capsule (Figma Top Menu 360x48) */}
          <div className="w-full flex justify-center py-1">
            <div className="liquid-glass-pill rounded-full p-1 flex items-center justify-between w-full max-w-[360px] border border-white/10 shadow-lg">
              {(['all', 'songs', 'artists', 'albums'] as SearchCategoryTab[]).map((tab) => {
                const isSelected = activeSearchTab === tab;
                const labelMap = { all: 'Top Results', songs: 'Songs', artists: 'Artists', albums: 'Albums' };
                return (
                  <button
                    key={tab}
                    onClick={() => {
                      triggerHaptic(5);
                      setActiveSearchTab(tab);
                    }}
                    className={`flex-1 py-1.5 rounded-full text-[12px] text-center transition-all duration-200 cursor-pointer ${
                      isSelected
                        ? 'bg-white text-black font-semibold shadow-sm'
                        : 'text-white/60 hover:text-white font-medium active:opacity-70'
                    }`}
                  >
                    {labelMap[tab]}
                  </button>
                );
              })}
            </div>
          </div>

          {isSearching && (
            <div className="py-12 text-center text-xs text-neutral-400 animate-fade-in-up">
              Searching Apple Music database...
            </div>
          )}

          {!isSearching && results.length === 0 && (
            <div className="py-16 text-center text-xs text-neutral-400 animate-fade-in-up">
              No matching songs found for "{query}"
            </div>
          )}

          {/* TAB 1: ALL (Top Results) - Minimalist Figma Flat List (No Bulky Cards) */}
          {!isSearching && activeSearchTab === 'all' && results.length > 0 && (
            <div className="space-y-6 animate-fade-in-up">
              {/* Songs List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[15px] font-bold text-white tracking-tight">Songs</h3>
                  {results.length > 5 && (
                    <button
                      onClick={() => setActiveSearchTab('songs')}
                      className="text-xs text-neutral-400 hover:text-white font-medium"
                    >
                      See all
                    </button>
                  )}
                </div>

                <div className="divide-y divide-white/[0.04]">
                  {results.slice(0, 5).map((track) => {
                    const isDownloaded = downloadedIds.has(track.id);
                    return (
                      <div
                        key={track.id}
                        onClick={() => {
                          triggerHaptic(8);
                          onPlayTrack(track);
                        }}
                        className="flex items-center justify-between py-2.5 px-0.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-neutral-900 border border-white/5 flex-shrink-0 flex items-center justify-center shadow-sm">
                            {track.thumbnailUrl ? (
                              <img
                                src={track.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  const target = e.currentTarget;
                                  if (track.id && !target.src.includes('hqdefault')) {
                                    target.src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
                                  } else {
                                    target.style.display = 'none';
                                  }
                                }}
                              />
                            ) : (
                              <SFMusicNote size={18} fill="rgba(255,255,255,0.4)" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 pr-2">
                            <h4 className="text-[14.5px] font-medium text-white truncate tracking-tight">
                              {track.title}
                            </h4>
                            <p className="text-[12.5px] text-neutral-400 truncate mt-0.5 font-normal">
                              {track.artist}
                            </p>
                          </div>
                        </div>

                        {/* Actions: Download, Ellipsis */}
                        <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleDownloadTrack(track)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                              isDownloaded ? 'text-white' : 'text-white/40 hover:text-white'
                            }`}
                            title={isDownloaded ? 'Tersimpan Offline' : 'Unduh Offline'}
                          >
                            {isDownloaded ? (
                              <SFCheckmark size={15} fill="#FFFFFF" />
                            ) : (
                              <SFArrowDown size={17} fill="currentColor" />
                            )}
                          </button>
                          <button
                            onClick={() => {
                              triggerHaptic(6);
                              setActionMenuTrack(track);
                            }}
                            className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-transform"
                            title="Opsi"
                          >
                            <SFEllipsis size={17} fill="currentColor" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Artists Section */}
              {displayedArtists.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[15px] font-bold text-white tracking-tight">Artists</h3>
                    {displayedArtists.length > 3 && (
                      <button
                        onClick={() => setActiveSearchTab('artists')}
                        className="text-xs text-neutral-400 hover:text-white font-medium"
                      >
                        See all
                      </button>
                    )}
                  </div>

                  <div className="divide-y divide-white/[0.04]">
                    {displayedArtists.slice(0, 3).map((art) => (
                      <div
                        key={art.id}
                        onClick={() => onSelectArtist && onSelectArtist(art.id, art.name)}
                        className="flex items-center justify-between py-2.5 px-0.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 border border-white/10 flex-shrink-0 flex items-center justify-center shadow-sm">
                            {art.thumbnailUrl ? (
                              <img
                                src={art.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.currentTarget as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <SFPersonCropCircle size={24} fill="#FFFFFF" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1 pr-2">
                            <h4 className="text-[14.5px] font-medium text-white truncate tracking-tight">{art.name}</h4>
                            <p className="text-[12.5px] text-neutral-400 mt-0.5">Artist</p>
                          </div>
                        </div>
                        <SFChevronRight size={14} fill="#8E8E93" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Albums Section Preview */}
              {displayedAlbums.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center justify-between px-1">
                    <h3 className="text-[15px] font-bold text-white tracking-tight">Albums</h3>
                    {displayedAlbums.length > 2 && (
                      <button
                        onClick={() => setActiveSearchTab('albums')}
                        className="text-xs text-neutral-400 hover:text-white font-medium"
                      >
                        See all
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3.5 pt-1">
                    {displayedAlbums.slice(0, 2).map((alb) => (
                      <div
                        key={alb.id}
                        onClick={() => onSelectAlbum && onSelectAlbum(alb.id, alb.title)}
                        className="cursor-pointer active:scale-98 transition-transform flex flex-col gap-2"
                      >
                        <div className="w-full aspect-square rounded-[14px] overflow-hidden bg-neutral-900 border border-white/10 relative shadow-md">
                          {alb.cover ? (
                            <img
                              src={alb.cover}
                              alt={alb.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).src = '/assets/cover748_0643063b.png';
                              }}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <SFDisc size={28} fill="#8E8E93" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 text-left px-0.5">
                          <h4 className="text-[13.5px] font-semibold text-white truncate leading-tight">{alb.title}</h4>
                          <p className="text-[11.5px] text-neutral-400 truncate mt-0.5">
                            {alb.artist} {alb.year ? `• ${alb.year}` : ''}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SONGS ONLY - Full Flat List */}
          {!isSearching && activeSearchTab === 'songs' && (
            <div className="divide-y divide-white/[0.04] animate-fade-in-up">
              {results.map((track) => {
                const isDownloaded = downloadedIds.has(track.id);
                return (
                  <div
                    key={track.id}
                    onClick={() => {
                      triggerHaptic(8);
                      onPlayTrack(track);
                    }}
                    className="flex items-center justify-between py-2.5 px-0.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-12 h-12 rounded-[8px] overflow-hidden bg-neutral-900 border border-white/5 flex-shrink-0 flex items-center justify-center shadow-sm">
                        {track.thumbnailUrl ? (
                          <img
                            src={track.thumbnailUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.currentTarget;
                              if (track.id && !target.src.includes('hqdefault')) {
                                target.src = `https://i.ytimg.com/vi/${track.id}/hqdefault.jpg`;
                              } else {
                                target.style.display = 'none';
                              }
                            }}
                          />
                        ) : (
                          <SFMusicNote size={18} fill="rgba(255,255,255,0.4)" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1 pr-2">
                        <h4 className="text-[14.5px] font-medium text-white truncate tracking-tight">{track.title}</h4>
                        <p className="text-[12.5px] text-neutral-400 truncate mt-0.5 font-normal">{track.artist}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleDownloadTrack(track)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                          isDownloaded ? 'text-white' : 'text-white/40 hover:text-white'
                        }`}
                        title={isDownloaded ? 'Tersimpan Offline' : 'Unduh Offline'}
                      >
                        {isDownloaded ? (
                          <SFCheckmark size={15} fill="#FFFFFF" />
                        ) : (
                          <SFArrowDown size={17} fill="currentColor" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          triggerHaptic(6);
                          setActionMenuTrack(track);
                        }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-white/40 hover:text-white active:scale-90 transition-transform"
                        title="Opsi"
                      >
                        <SFEllipsis size={17} fill="currentColor" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 3: ARTISTS ONLY */}
          {!isSearching && activeSearchTab === 'artists' && (
            <div className="divide-y divide-white/[0.04] animate-fade-in-up">
              {displayedArtists.map((art) => (
                <div
                  key={art.id}
                  onClick={() => onSelectArtist && onSelectArtist(art.id, art.name)}
                  className="flex items-center justify-between py-2.5 px-0.5 hover:bg-white/[0.04] active:bg-white/[0.08] transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3.5 min-w-0 flex-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-neutral-800 border border-white/10 flex-shrink-0 flex items-center justify-center shadow-sm">
                      {art.thumbnailUrl ? (
                        <img
                          src={art.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      ) : (
                        <SFPersonCropCircle size={24} fill="#FFFFFF" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pr-2">
                      <h4 className="text-[14.5px] font-medium text-white truncate tracking-tight">{art.name}</h4>
                      <p className="text-[12.5px] text-neutral-400 mt-0.5">
                        Artist {art.trackCount ? `• ${art.trackCount} Tracks` : ''}
                      </p>
                    </div>
                  </div>
                  <SFChevronRight size={14} fill="#8E8E93" />
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: ALBUMS ONLY */}
          {!isSearching && activeSearchTab === 'albums' && (
            <div className="grid grid-cols-2 gap-3.5 animate-fade-in-up">
              {displayedAlbums.map((alb) => (
                <div
                  key={alb.id}
                  onClick={() => onSelectAlbum && onSelectAlbum(alb.id, alb.title)}
                  className="cursor-pointer active:scale-98 transition-transform flex flex-col gap-2"
                >
                  <div className="w-full aspect-square rounded-[14px] overflow-hidden bg-neutral-900 border border-white/10 relative shadow-md">
                    {alb.cover ? (
                      <img
                        src={alb.cover}
                        alt={alb.title}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = '/assets/cover748_0643063b.png';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <SFDisc size={28} fill="#8E8E93" />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 text-left px-0.5">
                    <h4 className="text-[13.5px] font-semibold text-white truncate leading-tight">{alb.title}</h4>
                    <p className="text-[11.5px] text-neutral-400 truncate mt-0.5">
                      {alb.artist} {alb.year ? `• ${alb.year}` : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Default Browse Categories Matching Figma 1:1 Editorial */
        <div className="space-y-6 animate-fade-in-up">
          {/* 1. Your Genres (Figma Frame 136) */}
          <div className="space-y-3">
            <h2 className="text-[18px] font-bold text-white tracking-tight">Your Genres</h2>
            <div className="grid grid-cols-2 gap-3">
              {yourGenres.map((g, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(g.query);
                    handleSearch(g.query);
                  }}
                  className="group relative h-28 rounded-2xl overflow-hidden shadow-lg cursor-pointer active:scale-95 transition-all duration-150 border border-white/5"
                >
                  <img
                    src={g.cover}
                    alt={g.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3.5 flex flex-col justify-end">
                    <span className="text-[15px] font-bold text-white tracking-tight leading-tight drop-shadow-md">
                      {g.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 2. Browse New Music (Figma Frame 137) */}
          <div className="space-y-3">
            <h2 className="text-[18px] font-bold text-white tracking-tight">Browse New Music</h2>
            <div className="grid grid-cols-2 gap-3">
              {browseCategories.map((c, idx) => (
                <div
                  key={idx}
                  onClick={() => {
                    setQuery(c.query);
                    handleSearch(c.query);
                  }}
                  className="group relative h-24 rounded-2xl overflow-hidden shadow-lg cursor-pointer active:scale-95 transition-all duration-150 border border-white/5"
                >
                  <img
                    src={c.cover}
                    alt={c.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-3 flex flex-col justify-end">
                    <span className="text-[14px] font-bold text-white tracking-tight leading-tight drop-shadow-md">
                      {c.title}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Song Action Menu Sheet */}
      <MobileSongActionMenu
        isOpen={!!actionMenuTrack}
        onClose={() => setActionMenuTrack(null)}
        track={actionMenuTrack}
        onAddToPlaylist={(t) => setAddToPlaylistTrack(t)}
        onPlayNext={(t) => onPlayTrack(t)}
        onDownload={(t) => handleDownloadTrack(t)}
        onOpenSongInfo={(t) => setSongInfoTrack(t)}
      />

      {/* Add To Playlist Modal */}
      <MobileAddToPlaylistModal
        isOpen={!!addToPlaylistTrack}
        onClose={() => setAddToPlaylistTrack(null)}
        track={addToPlaylistTrack}
      />

      {/* Song Info & Credits Modal */}
      <MobileSongInfoModal
        isOpen={!!songInfoTrack}
        onClose={() => setSongInfoTrack(null)}
        track={songInfoTrack}
      />
    </div>
  );
};
