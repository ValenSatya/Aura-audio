import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  UserProfile,
  UserPlaylist,
  YTMusicTrackItem,
  Track,
  CustomPlaylist,
  YTMusicSearchCategorized,
  YTMusicArtistItem,
  YTMusicArtistProfile,
  YTMusicAlbumItem,
  YTMusicTopResult,
} from '../types/music';
import { useTrackCover } from '../utils/coverArt';
import {
  Heart,
  Search,
  Play,
  Pause,
  Plus,
  Download,
  Loader2,
  Tv,
  User,
  Check,
  X,
  Music,
  Sparkles,
  ArrowLeft,
  Shuffle,
  Clock3,
  ListMusic,
  CheckCircle2,
  MoreHorizontal,
  CornerDownRight,
  ListPlus,
} from 'lucide-react';

interface YTMusicViewProps {
  userProfile: UserProfile;
  onOpenAuthModal: () => void;
  onPlayTrack: (track: Track) => void;
  onPlayPlaylist?: (tracks: Track[], startIndex?: number) => void;
  onPlayShuffled?: (tracks: Track[]) => void;
  onPlayNext?: (track: Track) => void;
  onAddTracksToQueue: (tracks: Track[]) => void;
  onStartDownload: (track: Track) => void;
  onDownloadBatch?: (tracks: Track[]) => void;
  onOpenAddToPlaylistModal?: (tracks: Track[]) => void;
  activeTab?: 'liked' | 'playlists' | 'search';
  onTabChange?: (tab: 'liked' | 'playlists' | 'search') => void;
  externalSearchQuery?: string;
  onExternalSearchChange?: (q: string) => void;
  customPlaylists?: CustomPlaylist[];
  libraryTracks?: Track[];
  onSelectCustomPlaylist?: (id: string) => void;
  onViewChange?: (view: 'ytmusic' | 'library' | 'custom_playlist' | 'stage') => void;
  dynamicLighting?: {
    enabled: boolean;
    intensity: 'subtle' | 'medium' | 'vibrant';
  };
  activeColor?: string;
}

export const DEFAULT_TRENDING_TRACKS: YTMusicTrackItem[] = [];

export const SAMPLE_SONGS: Track[] = [
  {
    id: 'sample-1',
    title: 'Glass Hours',
    artist: 'Nara Velle',
    album: 'Soft Static',
    duration: 222,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=sample-1',
    thumbnailUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'sample-2',
    title: 'Neon Harbor',
    artist: 'Kiro Mansa',
    album: 'Night Ferry',
    duration: 245,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=sample-2',
    thumbnailUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'sample-3',
    title: 'Paper Moons',
    artist: 'Ayla Rowe',
    album: 'Quiet Rooms',
    duration: 178,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=sample-3',
    thumbnailUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'sample-4',
    title: 'Low Tide Radio',
    artist: 'Odan Reyes',
    album: 'Salt Air',
    duration: 199,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=sample-4',
    thumbnailUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'sample-5',
    title: 'Slow Signal',
    artist: 'Nara Velle',
    album: 'Soft Static',
    duration: 231,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=sample-5',
    thumbnailUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'sample-6',
    title: 'Afterglow Line',
    artist: 'Kiro Mansa',
    album: 'Night Ferry',
    duration: 262,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=sample-6',
    thumbnailUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
    isOffline: false,
    dateAdded: Date.now(),
  },
];

export const SAMPLE_PLAYLISTS = [
  { id: 'sample-pl-1', name: 'Midnight Drive', trackCount: 24, coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=300&h=300&fit=crop' },
  { id: 'sample-pl-2', name: 'Fokus Belajar', trackCount: 38, coverUrl: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop' },
  { id: 'sample-pl-3', name: 'Santai Sore', trackCount: 52, coverUrl: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop' },
  { id: 'sample-pl-4', name: 'Favorit Saya', trackCount: 71, coverUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop' },
  { id: 'sample-pl-5', name: 'Perjalanan', trackCount: 19, coverUrl: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop' },
];

const NEUTRAL_CATEGORIES = [
  { id: 'pop', title: 'Pop', query: 'Pop Hits', bg: '#2B3038' },
  { id: 'indie', title: 'Indie', query: 'Indie Songs', bg: '#363B42' },
  { id: 'lofi', title: 'Lo-fi', query: 'Lo-fi Chill Beats', bg: '#3A3F47' },
  { id: 'jazz', title: 'Jazz', query: 'Jazz Music', bg: '#4A5059' },
  { id: 'akustik', title: 'Akustik', query: 'Acoustic Guitar', bg: '#4A453F' },
  { id: 'elektronik', title: 'Elektronik', query: 'Electronic Beats', bg: '#1A1D21' },
  { id: 'klasik', title: 'Klasik', query: 'Classical Piano', bg: '#2B3038' },
  { id: 'hiphop', title: 'Hip-hop', query: 'Hip-hop Hits', bg: '#363B42' },
];

export interface CuratedPlaylist {
  id: string;
  title: string;
  description: string;
  coverUrl: string;
  tracks: YTMusicTrackItem[];
}

export const CURATED_PLAYLISTS: CuratedPlaylist[] = [];

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 11) return 'Selamat Pagi';
  if (hour >= 11 && hour < 15) return 'Selamat Siang';
  if (hour >= 15 && hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m < 10 ? '0' : ''}${m}:${s < 10 ? '0' : ''}${s}`;
}

// Subcomponent: Most Played Album Card with Official Cover Art lookup
const MostPlayedCard: React.FC<{
  item: YTMusicTrackItem;
  onPlay: () => void;
}> = ({ item, onPlay }) => {
  const officialCover = useTrackCover(item.title, item.artist, item.thumbnailUrl);

  return (
    <div
      onClick={onPlay}
      className="flex flex-col gap-2.5 cursor-pointer group select-none min-w-[130px] flex-1"
    >
      {/* Square Rounded-8px Cover Art */}
      <div className="relative aspect-square w-full rounded-[8px] overflow-hidden bg-[#17171A] shadow-md transition-transform duration-300 group-hover:scale-[1.02]">
        {officialCover || item.thumbnailUrl ? (
          <img
            src={officialCover || item.thumbnailUrl}
            alt={item.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-[#17171A] text-[#8D8D93]">
            <Music size={28} />
          </div>
        )}
        {/* Play Overlay */}
        <div className="absolute inset-0 bg-[#0B0B0C]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center shadow-xl transform scale-90 group-hover:scale-100 transition-transform">
            <Play size={16} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      </div>

      {/* Title & Metadata */}
      <div className="space-y-0.5">
        <h4 className="text-xs font-medium text-[#F4F4F0] tracking-tight truncate group-hover:text-white transition-colors">
          {item.title}
        </h4>
        <p className="text-[11px] font-normal text-[#8D8D93] truncate">{item.artist}</p>
      </div>
    </div>
  );
};

// Subcomponent: 2-Column All Songs Compact Row with Official Cover Art and 3-Dots Action Menu
const AllSongsCompactRow: React.FC<{
  item: YTMusicTrackItem | Track;
  isSelected: boolean;
  onToggleSelect: (e: React.MouseEvent) => void;
  onPlay: () => void;
  rank?: number;
  onPlayNext?: () => void;
  onAddToPlaylist?: () => void;
  onAddToQueue?: () => void;
  onDownload?: () => void;
}> = ({
  item,
  isSelected,
  onToggleSelect,
  onPlay,
  rank,
  onPlayNext,
  onAddToPlaylist,
  onAddToQueue,
  onDownload,
}) => {
  const officialCover = useTrackCover(item.title, item.artist, item.thumbnailUrl);
  const isOffline = 'isOffline' in item ? (item as Track).isOffline : false;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [openUpwards, setOpenUpwards] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const handleToggleMenu = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isMenuOpen && menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      setOpenUpwards(spaceBelow < 220);
    }
    setIsMenuOpen((prev) => !prev);
  };

  return (
    <div
      onClick={onPlay}
      className={`group relative flex items-center justify-between p-2 rounded-[8px] cursor-pointer transition-colors ${
        isSelected
          ? 'bg-[#17171A]'
          : 'hover:bg-[#1F1F23]'
      }`}
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {rank !== undefined && (
          <span className="w-5 text-center text-xs font-mono text-[#8D8D93] group-hover:text-[#F4F4F0] flex-shrink-0">
            {rank}
          </span>
        )}
        {/* Checkbox (on hover or when selected) */}
        <button
          onClick={onToggleSelect}
          className={`w-4 h-4 rounded-[4px] flex items-center justify-center transition-all flex-shrink-0 cursor-pointer ${
            isSelected
              ? 'bg-[#F4F4F0] text-[#0B0B0C]'
              : 'opacity-0 group-hover:opacity-100 bg-[#34343A] text-transparent hover:bg-[#1F1F23]'
          }`}
          title="Pilih Lagu"
        >
          <Check size={10} strokeWidth={3} />
        </button>

        {/* Small Rounded Square Artwork (40x40, radius 6px) */}
        <div className="relative w-10 h-10 rounded-[6px] overflow-hidden bg-[#17171A] flex-shrink-0">
          {officialCover || item.thumbnailUrl ? (
            <img
              src={officialCover || item.thumbnailUrl}
              alt={item.title}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
              <Music size={16} />
            </div>
          )}
          <div className="absolute inset-0 bg-[#0B0B0C]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Play size={12} fill="white" className="text-white ml-0.5" />
          </div>
        </div>

        {/* Title and Artist */}
        <div className="min-w-0 flex-1 pr-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <p className="text-xs font-medium text-[#F4F4F0] tracking-tight truncate group-hover:text-white transition-colors">
              {item.title}
            </p>
            {isOffline && (
              <span className="inline-flex items-center gap-0.5 text-[#8D8D93] flex-shrink-0" title="Offline">
                <CheckCircle2 size={11} className="fill-[#8D8D93] text-[#0B0B0C]" />
              </span>
            )}
          </div>
          <p className="text-[11px] font-normal text-[#8D8D93] truncate">{item.artist}</p>
        </div>
      </div>

      {/* Right side: Duration and 3-dots Menu Button */}
      <div className="flex items-center gap-2 flex-shrink-0 pl-2">
        <span className="text-[11px] font-mono text-[#8D8D93]">
          {formatDuration(item.duration)}
        </span>

        {/* 3-Dots Action Button */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={handleToggleMenu}
            className={`p-1.5 rounded-[6px] transition-all text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] cursor-pointer ${
              isMenuOpen
                ? 'opacity-100 bg-[#1F1F23] text-[#F4F4F0]'
                : 'opacity-0 group-hover:opacity-100'
            }`}
            title="Opsi Lagu"
          >
            <MoreHorizontal size={15} />
          </button>

          {/* Floating Context Dropdown Menu (Border-less, surface-high, radius 8px) */}
          {isMenuOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className={`absolute right-0 ${
                openUpwards ? 'bottom-full mb-1.5' : 'top-full mt-1.5'
              } w-52 py-1.5 bg-[#1F1F23] rounded-[8px] shadow-[0_12px_32px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-150`}
            >
              {onPlayNext && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onPlayNext();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#F4F4F0] hover:bg-[#17171A] transition-colors flex items-center gap-2.5 cursor-pointer rounded-[6px]"
                >
                  <CornerDownRight size={14} className="text-[#8D8D93]" />
                  <span>Putar Berikutnya</span>
                </button>
              )}

              {onAddToPlaylist && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onAddToPlaylist();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#F4F4F0] hover:bg-[#17171A] transition-colors flex items-center gap-2.5 cursor-pointer rounded-[6px]"
                >
                  <Plus size={14} className="text-[#8D8D93]" />
                  <span>Tambah ke Playlist</span>
                </button>
              )}

              {onAddToQueue && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onAddToQueue();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#F4F4F0] hover:bg-[#17171A] transition-colors flex items-center gap-2.5 cursor-pointer rounded-[6px]"
                >
                  <ListMusic size={14} className="text-[#8D8D93]" />
                  <span>Tambahkan ke Antrean</span>
                </button>
              )}

              {onDownload && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsMenuOpen(false);
                    onDownload();
                  }}
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#F4F4F0] hover:bg-[#17171A] transition-colors flex items-center gap-2.5 cursor-pointer rounded-[6px] mt-0.5"
                >
                  <Download size={14} className="text-[#8D8D93]" />
                  <span>Unduh Lagu</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const YTMusicView: React.FC<YTMusicViewProps> = ({
  userProfile,
  onOpenAuthModal,
  onPlayTrack,
  onPlayPlaylist,
  onPlayShuffled,
  onPlayNext,
  onAddTracksToQueue,
  onStartDownload,
  onDownloadBatch,
  onOpenAddToPlaylistModal,
  activeTab: controlledTab,
  onTabChange,
  externalSearchQuery,
  onExternalSearchChange,
  customPlaylists = [],
  libraryTracks = [],
  onSelectCustomPlaylist,
  onViewChange,
  dynamicLighting,
  activeColor,
}) => {
  const [isTopResultMenuOpen, setIsTopResultMenuOpen] = useState(false);
  const topResultMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isTopResultMenuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (topResultMenuRef.current && !topResultMenuRef.current.contains(e.target as Node)) {
        setIsTopResultMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isTopResultMenuOpen]);
  const isDynamicOn = dynamicLighting?.enabled ?? true;
  const glowOpacity = !isDynamicOn
    ? 0
    : dynamicLighting?.intensity === 'vibrant'
    ? 0.45
    : dynamicLighting?.intensity === 'subtle'
    ? 0.16
    : 0.28;

  const [internalTab, setInternalTab] = useState<'liked' | 'playlists' | 'search'>(
    controlledTab || 'search'
  );

  const activeTab = controlledTab || internalTab;

  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [searchResults, setSearchResults] = useState<YTMusicTrackItem[]>([]);
  const [categorizedResults, setCategorizedResults] = useState<YTMusicSearchCategorized>({
    topResult: null,
    songs: [],
    artists: [],
    albums: [],
  });
  const [searchFilter, setSearchFilter] = useState<'all' | 'songs' | 'artists' | 'albums'>('all');
  const [isSearching, setIsSearching] = useState(false);

  // Dedicated Spotify Artist Profile State
  const [selectedArtistProfile, setSelectedArtistProfile] = useState<YTMusicArtistProfile | null>(null);
  const [loadingArtist, setLoadingArtist] = useState(false);
  const [artistDiscographyTab, setArtistDiscographyTab] = useState<'all' | 'albums' | 'singles'>('all');

  const handleOpenArtist = async (artist: {
    id?: string;
    browseId?: string;
    name: string;
    thumbnailUrl?: string;
    subscribers?: string;
  }) => {
    const browseId = artist.browseId || (artist.id && artist.id.startsWith('UC') ? artist.id : undefined);
    setLoadingArtist(true);
    setSelectedArtistProfile({
      id: browseId || artist.id || artist.name,
      name: artist.name,
      subscribers: artist.subscribers,
      bannerUrl: artist.thumbnailUrl,
      topSongs: [],
      albums: [],
      singles: [],
    });

    try {
      if (window.electronAPI?.getArtistDetails) {
        const details = await window.electronAPI.getArtistDetails(browseId || '', artist.name);
        if (details) {
          setSelectedArtistProfile(details);
        }
      }
    } catch (err) {
      console.error('Failed to load artist details:', err);
    } finally {
      setLoadingArtist(false);
    }
  };


  const [likedTracks, setLikedTracks] = useState<YTMusicTrackItem[]>([]);
  const [loadingLiked, setLoadingLiked] = useState(false);

  const [playlists, setPlaylists] = useState<UserPlaylist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<UserPlaylist | null>(null);
  const [playlistTracks, setPlaylistTracks] = useState<YTMusicTrackItem[]>([]);
  const [loadingPlaylistTracks, setLoadingPlaylistTracks] = useState(false);

  // Multi-select state
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);

  // Fetch Liked Music from YouTube Music Account
  const fetchLikedMusic = async () => {
    if (!userProfile?.isLoggedIn) return;
    setLoadingLiked(true);
    try {
      if (window.electronAPI?.getLikedMusic) {
        const res = await window.electronAPI.getLikedMusic();
        setLikedTracks(res || []);
      }
    } catch (e) {
      console.warn('Failed to fetch liked music:', e);
    } finally {
      setLoadingLiked(false);
    }
  };

  // Fetch User Playlists
  const fetchPlaylists = async () => {
    if (!userProfile?.isLoggedIn) return;
    setLoadingPlaylists(true);
    try {
      if (window.electronAPI?.getUserPlaylists) {
        const res = await window.electronAPI.getUserPlaylists();
        setPlaylists(res || []);
      }
    } catch (e) {
      console.warn('Failed to fetch user playlists:', e);
    } finally {
      setLoadingPlaylists(false);
    }
  };

  const searchSeqRef = React.useRef(0);

  // Execute Search via Electron IPC
  const executeSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) {
      setSearchResults([]);
      setCategorizedResults({ topResult: null, songs: [], artists: [], albums: [] });
      setIsSearching(false);
      return;
    }

    const currentSeq = ++searchSeqRef.current;
    setIsSearching(true);
    setSelectedArtistProfile(null);

    try {
      if (window.electronAPI?.searchYouTubeMusicCategorized) {
        const catRes = await window.electronAPI.searchYouTubeMusicCategorized(trimmed);
        if (currentSeq === searchSeqRef.current) {
          setCategorizedResults(catRes || { topResult: null, songs: [], artists: [], albums: [] });
          setSearchResults(catRes?.songs || []);
        }
      } else if (window.electronAPI?.searchYouTubeMusic) {
        const results = await window.electronAPI.searchYouTubeMusic(trimmed);
        if (currentSeq === searchSeqRef.current) {
          setSearchResults(results || []);
          setCategorizedResults({ topResult: null, songs: results || [], artists: [], albums: [] });
        }
      }
    } catch (e) {
      console.error('Search failed:', e);
      if (currentSeq === searchSeqRef.current) {
        setSearchResults([]);
        setCategorizedResults({ topResult: null, songs: [], artists: [], albums: [] });
      }
    } finally {
      if (currentSeq === searchSeqRef.current) {
        setIsSearching(false);
      }
    }
  };

  const handleSearch = (queryToSearch?: string, notifyExternal = false) => {
    const q = (queryToSearch !== undefined ? queryToSearch : searchQuery).trim();
    if (queryToSearch !== undefined) {
      setSearchQuery(queryToSearch);
      if (notifyExternal) {
        onExternalSearchChange?.(queryToSearch);
      }
    }

    if (onTabChange) onTabChange('search');
    else setInternalTab('search');

    executeSearch(q);
  };

  // Debounced sync with external search query from TopBar
  useEffect(() => {
    if (externalSearchQuery !== undefined) {
      setSearchQuery(externalSearchQuery);
      if (!externalSearchQuery.trim()) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      const timer = setTimeout(() => {
        executeSearch(externalSearchQuery);
      }, 350);

      return () => clearTimeout(timer);
    }
  }, [externalSearchQuery]);

  useEffect(() => {
    if (activeTab === 'liked') {
      fetchLikedMusic();
    } else if (activeTab === 'playlists') {
      fetchPlaylists();
    }
  }, [activeTab, userProfile?.isLoggedIn]);

  // Convert YTMusicTrackItem or Track to standard Track model
  const convertItemToTrack = (item: YTMusicTrackItem | Track): Track => {
    if ('sourceType' in item && (item as Track).sourceType) {
      return item as Track;
    }
    return {
      id: item.id,
      title: item.title,
      artist: item.artist,
      duration: item.duration,
      sourceType: 'youtube',
      url: item.url,
      thumbnailUrl: item.thumbnailUrl,
      isOffline: false,
      dateAdded: Date.now(),
    };
  };

  // Load tracks of a selected playlist
  const openPlaylistDetails = async (pl: UserPlaylist) => {
    setSelectedPlaylist(pl);
    setLoadingPlaylistTracks(true);
    try {
      if (window.electronAPI?.getPlaylistTracks) {
        const tracks = await window.electronAPI.getPlaylistTracks(pl.id);
        setPlaylistTracks(tracks || []);
      }
    } catch (e) {
      console.error('Failed to get playlist tracks:', e);
    } finally {
      setLoadingPlaylistTracks(false);
    }
  };

  // Determine current active real list
  const currentActiveList: YTMusicTrackItem[] =
    activeTab === 'playlists' && selectedPlaylist
      ? playlistTracks
      : activeTab === 'liked'
      ? likedTracks
      : searchResults;

  // Title & Subtitle of current section
  const heroTitle =
    activeTab === 'liked'
      ? 'Lagu yang Disukai'
      : activeTab === 'playlists' && selectedPlaylist
      ? selectedPlaylist.title
      : searchQuery.trim()
      ? `Hasil untuk "${searchQuery}"`
      : 'Tangga Lagu & Rekomendasi Populer';

  const heroSubtitle =
    activeTab === 'liked'
      ? `${likedTracks.length} lagu disukai • YouTube Music`
      : activeTab === 'playlists' && selectedPlaylist
      ? `${playlistTracks.length} lagu di playlist`
      : searchQuery.trim()
      ? `${currentActiveList.length} lagu ditemukan`
      : 'Pilihan lagu terpopuler yang paling sering didengarkan hari ini';

  const totalMinutes = Math.round(
    currentActiveList.reduce((acc, t) => acc + (t.duration || 180), 0) / 60
  );

  const mostPlayedList = currentActiveList.slice(0, 4);
  const allSongsList = currentActiveList;

  // Toggle Track Selection
  const handleToggleSelectTrack = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedTrackIds((prev) => {
      const next = new Set(prev);
      if (e.shiftKey && lastSelectedId) {
        const lastIdx = currentActiveList.findIndex((t) => t.id === lastSelectedId);
        const currIdx = currentActiveList.findIndex((t) => t.id === id);
        if (lastIdx !== -1 && currIdx !== -1) {
          const [start, end] = [Math.min(lastIdx, currIdx), Math.max(lastIdx, currIdx)];
          for (let i = start; i <= end; i++) {
            next.add(currentActiveList[i].id);
          }
          return next;
        }
      }
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    setLastSelectedId(id);
  };

  const clearSelection = () => {
    setSelectedTrackIds(new Set());
    setLastSelectedId(null);
  };

  const getSelectedTracks = (): Track[] => {
    return currentActiveList
      .filter((t) => selectedTrackIds.has(t.id))
      .map(convertItemToTrack);
  };

  const handlePlaySelected = () => {
    const selected = getSelectedTracks();
    if (selected.length === 0) return;
    if (onPlayPlaylist) onPlayPlaylist(selected);
    else {
      onAddTracksToQueue(selected);
      onPlayTrack(selected[0]);
    }
  };

  // Smart diverse selection for the 3 featured cards
  const featured1 =
    libraryTracks?.[0] ||
    customPlaylists?.[0]?.tracks?.[0] ||
    (currentActiveList?.[0] ? convertItemToTrack(currentActiveList[0]) : null) ||
    SAMPLE_SONGS[0];

  // For featured2 (Pilihan hari ini), pick a track with different artist/album if possible
  const featured2 = useMemo(() => {
    if (!libraryTracks || libraryTracks.length === 0) return SAMPLE_SONGS[1];
    // Find track from library with different artist
    const differentArtist = libraryTracks.find(
      (t) =>
        t.id !== featured1.id &&
        t.artist &&
        (!featured1.artist || !t.artist.toLowerCase().includes(featured1.artist.toLowerCase()))
    );
    if (differentArtist) return differentArtist;
    // Or from another custom playlist
    if (customPlaylists && customPlaylists.length > 1 && customPlaylists[1]?.tracks?.[0]) {
      return customPlaylists[1].tracks[0];
    }
    // Fallback to sample or different index to avoid monotony
    return libraryTracks[1] && libraryTracks[1].id !== featured1.id
      ? libraryTracks[1]
      : SAMPLE_SONGS[1];
  }, [libraryTracks, customPlaylists, featured1]);

  // For featured3 (Rilis terbaru), pick another diverse track
  const featured3 = useMemo(() => {
    if (!libraryTracks || libraryTracks.length === 0) return SAMPLE_SONGS[2];
    const different = libraryTracks.find(
      (t) =>
        t.id !== featured1.id &&
        t.id !== featured2.id &&
        t.artist &&
        (!featured1.artist || !t.artist.toLowerCase().includes(featured1.artist.toLowerCase())) &&
        (!featured2.artist || !t.artist.toLowerCase().includes(featured2.artist.toLowerCase()))
    );
    if (different) return different;
    if (customPlaylists && customPlaylists.length > 2 && customPlaylists[2]?.tracks?.[0]) {
      return customPlaylists[2].tracks[0];
    }
    return libraryTracks[2] && libraryTracks[2].id !== featured1.id && libraryTracks[2].id !== featured2.id
      ? libraryTracks[2]
      : SAMPLE_SONGS[2];
  }, [libraryTracks, customPlaylists, featured1, featured2]);

  const isHomeView = activeTab === 'playlists' && !selectedPlaylist;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto select-none relative">
      {/* Main Content Area */}
      <div className="px-9 py-6 pb-28 flex-1">
        {isHomeView ? (
          /* SECTION 6.1: BERANDA DENGAN 3 KARTU SOROTAN DAN DUA KOLOM TERISI PENUH */
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* 3 Kartu Sorotan Berdampingan (Grid 3 kolom sama lebar, Tinggi 200px / 220px pada >= 1600, Radius 10px, Jarak 16px) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Kartu 1: Lanjutkan mendengarkan */}
              {(() => {
                const s1 = featured1 || SAMPLE_SONGS[0];
                return (
                  <div className="h-[200px] 2xl:h-[220px] rounded-[10px] p-[22px] bg-[#17171A] flex justify-between select-none relative group">
                    <div className="flex flex-col justify-between flex-1 min-w-0 pr-4">
                      <div className="space-y-1">
                        <span className="text-[13px] text-[#8D8D93] block font-normal">
                          Lanjutkan mendengarkan
                        </span>
                        <h3 className="text-[24px] font-light text-[#F4F4F0] tracking-tight leading-tight line-clamp-2">
                          {s1.title}
                        </h3>
                        <p className="text-[13px] text-[#8D8D93] truncate">
                          {s1.artist}
                        </p>
                      </div>

                      <div>
                        <button
                          onClick={() => onPlayTrack(s1)}
                          className="w-12 h-12 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          aria-label={`Putar ${s1.title}`}
                          title={`Putar ${s1.title}`}
                        >
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </button>
                      </div>
                    </div>

                    <div className="w-[120px] h-[120px] 2xl:w-[140px] 2xl:h-[140px] rounded-[8px] overflow-hidden flex-shrink-0 bg-[#1F1F23] self-end">
                      {s1.thumbnailUrl ? (
                        <img src={s1.thumbnailUrl} alt={s1.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                          <Music size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Kartu 2: Pilihan hari ini */}
              {(() => {
                const s2 = featured2 || SAMPLE_SONGS[1];
                return (
                  <div className="h-[200px] 2xl:h-[220px] rounded-[10px] p-[22px] bg-[#17171A] flex justify-between select-none relative group">
                    <div className="flex flex-col justify-between flex-1 min-w-0 pr-4">
                      <div className="space-y-1">
                        <span className="text-[13px] text-[#8D8D93] block font-normal">
                          Pilihan hari ini
                        </span>
                        <h3 className="text-[24px] font-light text-[#F4F4F0] tracking-tight leading-tight line-clamp-2">
                          {s2.title}
                        </h3>
                        <p className="text-[13px] text-[#8D8D93] truncate">
                          {s2.artist}
                        </p>
                      </div>

                      <div>
                        <button
                          onClick={() => onPlayTrack(s2)}
                          className="w-12 h-12 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          aria-label={`Putar ${s2.title}`}
                          title={`Putar ${s2.title}`}
                        >
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </button>
                      </div>
                    </div>

                    <div className="w-[120px] h-[120px] 2xl:w-[140px] 2xl:h-[140px] rounded-[8px] overflow-hidden flex-shrink-0 bg-[#1F1F23] self-end">
                      {s2.thumbnailUrl ? (
                        <img src={s2.thumbnailUrl} alt={s2.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                          <Music size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Kartu 3: Rilis terbaru */}
              {(() => {
                const s3 = featured3 || SAMPLE_SONGS[2];
                return (
                  <div className="h-[200px] 2xl:h-[220px] rounded-[10px] p-[22px] bg-[#17171A] flex justify-between select-none relative group">
                    <div className="flex flex-col justify-between flex-1 min-w-0 pr-4">
                      <div className="space-y-1">
                        <span className="text-[13px] text-[#8D8D93] block font-normal">
                          Rilis terbaru
                        </span>
                        <h3 className="text-[24px] font-light text-[#F4F4F0] tracking-tight leading-tight line-clamp-2">
                          {s3.title}
                        </h3>
                        <p className="text-[13px] text-[#8D8D93] truncate">
                          {s3.artist}
                        </p>
                      </div>

                      <div>
                        <button
                          onClick={() => onPlayTrack(s3)}
                          className="w-12 h-12 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                          aria-label={`Putar ${s3.title}`}
                          title={`Putar ${s3.title}`}
                        >
                          <Play size={20} fill="currentColor" className="ml-0.5" />
                        </button>
                      </div>
                    </div>

                    <div className="w-[120px] h-[120px] 2xl:w-[140px] 2xl:h-[140px] rounded-[8px] overflow-hidden flex-shrink-0 bg-[#1F1F23] self-end">
                      {s3.thumbnailUrl ? (
                        <img src={s3.thumbnailUrl} alt={s3.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                          <Music size={32} />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Area Dua Kolom (Section 6.1: Kiri 1.7fr Terakhir diputar 6 lagu, Kanan 1fr Playlist kamu 5 baris) */}
            <div className="grid grid-cols-1 lg:grid-cols-[1.7fr_1fr] gap-4 items-start pt-2">
              {/* Kolom Kiri: Terakhir Diputar (1.7fr) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <h2 className="text-[18px] font-normal text-[#F4F4F0]">
                    Terakhir diputar
                  </h2>
                  <button
                    onClick={() => {
                      if (onViewChange) onViewChange('library');
                    }}
                    className="text-[13px] text-[#8D8D93] hover:text-[#F4F4F0] transition-colors cursor-pointer"
                  >
                    Lihat semua
                  </button>
                </div>

                {/* Tabel 6 Lagu (Bagian 3.4) */}
                <div className="w-full">
                  <div className="grid grid-cols-[32px_2.4fr_1.4fr_1.2fr_60px] gap-4 px-3 py-1.5 text-[12px] text-[#8D8D93] select-none">
                    <span className="text-center">#</span>
                    <span>Judul</span>
                    <span>Artis</span>
                    <span className="hidden xl:block">Album</span>
                    <span className="text-right">Durasi</span>
                  </div>

                  <div className="space-y-1">
                    {(() => {
                      const recentList: Track[] = (libraryTracks && libraryTracks.length >= 6
                        ? libraryTracks.slice(0, 6)
                        : [...(libraryTracks || []), ...SAMPLE_SONGS]
                      ).slice(0, 6);

                      return recentList.map((track, idx) => (
                        <div
                          key={track.id}
                          onClick={() => onPlayTrack(track)}
                          className="h-14 rounded-[8px] grid grid-cols-[32px_2.4fr_1.4fr_1.2fr_60px] gap-4 px-3 items-center group hover:bg-[#1F1F23] transition-colors cursor-pointer select-none"
                        >
                          <div className="flex items-center justify-center">
                            <span className="text-[12px] text-[#8D8D93] group-hover:hidden">
                              {idx + 1}
                            </span>
                            <div className="w-7 h-7 rounded-full bg-[#F4F4F0] text-[#0B0B0C] hidden group-hover:flex items-center justify-center shadow">
                              <Play size={12} fill="currentColor" className="ml-0.5" />
                            </div>
                          </div>

                          <div className="flex items-center gap-3.5 min-w-0">
                            <div className="w-10 h-10 rounded-[6px] overflow-hidden bg-[#1F1F23] flex-shrink-0">
                              {track.thumbnailUrl ? (
                                <img src={track.thumbnailUrl} alt={track.title} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                                  <Music size={16} />
                                </div>
                              )}
                            </div>
                            <span className="text-[14px] font-normal text-[#F4F4F0] truncate">
                              {track.title}
                            </span>
                          </div>

                          <span className="text-[13px] text-[#8D8D93] truncate">
                            {track.artist}
                          </span>

                          <span className="text-[13px] text-[#8D8D93] truncate hidden xl:block">
                            {track.album || 'Single'}
                          </span>

                          <span className="text-[12px] font-mono text-[#8D8D93] text-right">
                            {formatDuration(track.duration)}
                          </span>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>

              {/* Kolom Kanan: Panel Playlist Kamu (1fr) */}
              <div className="rounded-[10px] bg-[#17171A] p-5 space-y-2 select-none">
                <div className="flex items-center justify-between pb-1">
                  <h2 className="text-[18px] font-normal text-[#F4F4F0]">
                    Playlist kamu
                  </h2>
                </div>

                <div className="space-y-1">
                  {(() => {
                    const displayedPlaylists = (customPlaylists && customPlaylists.length >= 5
                      ? customPlaylists.slice(0, 5)
                      : [
                          ...(customPlaylists || []),
                          ...SAMPLE_PLAYLISTS.slice(0, Math.max(0, 5 - (customPlaylists?.length || 0))).map((sp) => ({
                            id: sp.id,
                            name: sp.name,
                            trackCount: sp.trackCount,
                            tracks: [],
                            trackIds: [],
                          })),
                        ]
                    ).slice(0, 5);

                    return displayedPlaylists.map((pl) => {
                      const cover = pl.tracks?.[0]?.thumbnailUrl;
                      const count = pl.tracks && pl.tracks.length > 0 ? pl.tracks.length : (pl as any).trackCount || 0;

                      return (
                        <div
                          key={pl.id}
                          onClick={() => {
                            if (onSelectCustomPlaylist && !pl.id.startsWith('sample-')) {
                              onSelectCustomPlaylist(pl.id);
                            } else if (onViewChange) {
                              onViewChange('library');
                            }
                          }}
                          className="h-14 px-3 py-2 rounded-[8px] flex items-center gap-3.5 hover:bg-[#1F1F23] transition-colors cursor-pointer group"
                        >
                          <div className="w-12 h-12 rounded-[6px] overflow-hidden bg-[#1F1F23] flex-shrink-0 flex items-center justify-center">
                            {cover ? (
                              <img src={cover} alt={pl.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-[18px] font-light text-[#8D8D93]">
                                {pl.name.slice(0, 1).toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <h4 className="text-[14px] font-normal text-[#F4F4F0] truncate">
                              {pl.name}
                            </h4>
                            <p className="text-[12px] text-[#8D8D93] truncate">
                              {count} lagu
                            </p>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            </div>

            {/* Seksi Baru Ditambahkan (Section 6.1: Kartu cover 200px baris rata kiri) */}
            <div className="space-y-3 pt-4">
              <h2 className="text-[18px] font-normal text-[#F4F4F0]">
                Baru ditambahkan
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-5">
                {(() => {
                  const addedList = (libraryTracks && libraryTracks.length >= 6
                    ? libraryTracks.slice(0, 6)
                    : [...(libraryTracks || []), ...SAMPLE_SONGS]
                  ).slice(0, 6);

                  return addedList.map((item) => (
                    <div
                      key={`added-${item.id}`}
                      onClick={() => onPlayTrack(item)}
                      className="group cursor-pointer select-none flex flex-col"
                    >
                      <div className="relative aspect-square w-full rounded-[8px] overflow-hidden bg-[#1F1F23] mb-2.5 shadow-md">
                        {item.thumbnailUrl ? (
                          <img
                            src={item.thumbnailUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                            <Music size={32} />
                          </div>
                        )}
                        <div className="absolute bottom-2.5 right-2.5 w-11 h-11 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-xl">
                          <Play size={18} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>
                      <h4 className="text-[14px] font-normal text-[#F4F4F0] truncate">
                        {item.title}
                      </h4>
                      <p className="text-[12px] text-[#8D8D93] truncate mt-0.5">
                        {item.artist}
                      </p>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        ) : (
          /* VIEW C: Search Results / Liked Music / User Playlists */
          <div className="space-y-7 animate-in fade-in duration-200">
            {/* User Playlists List View when no playlist is selected yet */}
            {activeTab === 'playlists' && !selectedPlaylist ? (
              <div className="space-y-5">
                <div>
                  <h2 className="text-2xl font-light tracking-tight text-[#F4F4F0]">Playlist Kamu</h2>
                  <p className="text-xs text-[#8D8D93] mt-1">Playlist dari koleksi akun YouTube Music Anda</p>
                </div>

                {loadingPlaylists ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="p-3 rounded-[10px] bg-[#17171A] animate-pulse">
                        <div className="aspect-square w-full rounded-[8px] bg-[#1F1F23] mb-3" />
                        <div className="h-3 w-3/4 rounded bg-[#1F1F23] mb-1.5" />
                        <div className="h-2 w-1/2 rounded bg-[#1F1F23]" />
                      </div>
                    ))}
                  </div>
                ) : playlists.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {playlists.map((pl) => (
                      <div
                        key={pl.id}
                        onClick={() => openPlaylistDetails(pl)}
                        className="group p-3 rounded-[10px] bg-[#17171A] hover:bg-[#1F1F23] transition-colors cursor-pointer select-none flex flex-col"
                      >
                        <div className="relative aspect-square w-full rounded-[8px] overflow-hidden mb-3 bg-[#0B0B0C] shadow-md">
                          {pl.thumbnailUrl ? (
                            <img src={pl.thumbnailUrl} alt={pl.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                              <ListMusic size={32} />
                            </div>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openPlaylistDetails(pl);
                            }}
                            className="absolute bottom-2 right-2 w-10 h-10 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-xl transition-all hover:scale-105 cursor-pointer"
                            title="Buka Playlist"
                          >
                            <Play size={16} fill="currentColor" className="translate-x-0.5" />
                          </button>
                        </div>
                        <h4 className="text-xs font-semibold text-[#F4F4F0] tracking-tight truncate mb-1">{pl.title}</h4>
                        <p className="text-[11px] text-[#8D8D93]">{pl.trackCount || 0} lagu</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-16 bg-[#17171A] rounded-[10px]">
                    <ListMusic size={36} className="mx-auto text-[#8D8D93] mb-3" />
                    <p className="text-sm font-semibold text-[#F4F4F0] mb-1">Belum Ada Playlist</p>
                    <p className="text-xs text-[#8D8D93] max-w-sm mx-auto mb-4">
                      {userProfile?.isLoggedIn
                        ? 'Tidak ada playlist yang ditemukan di akun YouTube Music Anda.'
                        : 'Masuk dengan akun YouTube Music Anda untuk melihat playlist Anda.'}
                    </p>
                    {!userProfile?.isLoggedIn && (
                      <button
                        onClick={onOpenAuthModal}
                        className="px-5 py-2 rounded-[8px] bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] text-xs font-semibold transition-all cursor-pointer"
                      >
                        Masuk YouTube Music
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : selectedArtistProfile ? (
              <div className="space-y-8 animate-in fade-in duration-200 -mx-6 -mt-6">
                {/* Artist Hero Header */}
                <div className="relative h-72 md:h-80 w-full overflow-hidden flex flex-col justify-between p-6 md:p-8 select-none bg-gradient-to-b from-[#2e2e2e] to-[#121212]">
                  {/* Banner Image */}
                  {selectedArtistProfile.bannerUrl && (
                    <img
                      src={selectedArtistProfile.bannerUrl}
                      alt={selectedArtistProfile.name}
                      className="absolute inset-0 w-full h-full object-cover object-center opacity-70 filter brightness-90"
                    />
                  )}
                  {/* Spotify Dark Bottom Vignette */}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-black/30" />

                  {/* Top Bar: Back Button */}
                  <div className="relative z-10">
                    <button
                      onClick={() => setSelectedArtistProfile(null)}
                      className="flex items-center gap-2 px-3.5 py-1.5 rounded-[8px] bg-[#17171A]/80 hover:bg-[#1F1F23] text-[#F4F4F0] text-xs font-medium transition-colors cursor-pointer"
                    >
                      <ArrowLeft size={16} />
                      <span>Kembali</span>
                    </button>
                  </div>

                  {/* Artist Header Metadata */}
                  <div className="relative z-10 space-y-1">
                    <div className="flex items-center gap-1.5 text-xs text-[#8D8D93]">
                      <CheckCircle2 size={15} className="text-[#8D8D93]" />
                      <span>Artis Terverifikasi</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-light text-[#F4F4F0] tracking-tight">
                      {selectedArtistProfile.name}
                    </h1>

                    <p className="text-[13px] text-[#8D8D93]">
                      {selectedArtistProfile.subscribers
                        ? `${selectedArtistProfile.subscribers} pendengar bulanan`
                        : 'Artis Populer'}
                    </p>
                  </div>
                </div>

                {/* Artist Body Content */}
                <div className="px-6 space-y-8 pb-10">
                  {/* Action Controls */}
                  <div className="flex items-center gap-4">
                    <button
                      disabled={selectedArtistProfile.topSongs.length === 0}
                      onClick={() => {
                        if (selectedArtistProfile.topSongs.length > 0) {
                          if (onPlayPlaylist) {
                            onPlayPlaylist(selectedArtistProfile.topSongs.map(convertItemToTrack), 0);
                          } else {
                            onPlayTrack(convertItemToTrack(selectedArtistProfile.topSongs[0]));
                          }
                        }
                      }}
                      className="w-12 h-12 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Putar Lagu Teratas"
                    >
                      <Play size={20} fill="currentColor" className="ml-0.5" />
                    </button>

                    <button
                      disabled={selectedArtistProfile.topSongs.length === 0}
                      onClick={() => {
                        if (selectedArtistProfile.topSongs.length > 0) {
                          if (onPlayShuffled) {
                            onPlayShuffled(selectedArtistProfile.topSongs.map(convertItemToTrack));
                          } else if (onPlayPlaylist) {
                            onPlayPlaylist(selectedArtistProfile.topSongs.map(convertItemToTrack));
                          }
                        }
                      }}
                      className="w-11 h-11 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-[#8D8D93] hover:text-[#F4F4F0] flex items-center justify-center transition-colors cursor-pointer disabled:opacity-40"
                      title="Acak Lagu Teratas"
                    >
                      <Shuffle size={18} />
                    </button>

                    {onDownloadBatch && selectedArtistProfile.topSongs.length > 0 && (
                      <button
                        onClick={() => onDownloadBatch(selectedArtistProfile.topSongs.map(convertItemToTrack))}
                        className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-xs font-medium text-[#F4F4F0] transition-colors cursor-pointer"
                        title="Unduh seluruh lagu teratas artis ini"
                      >
                        <Download size={14} className="text-[#F4F4F0]" />
                        <span>Unduh Semua</span>
                      </button>
                    )}

                    {loadingArtist && (
                      <div className="flex items-center gap-2 text-xs text-[#8D8D93]">
                        <Loader2 size={16} className="animate-spin text-[#F4F4F0]" />
                        <span>Memuat profil artis...</span>
                      </div>
                    )}
                  </div>

                  {/* Section: Populer */}
                  <div className="space-y-4">
                    <h2 className="text-2xl font-light tracking-tight text-[#F4F4F0]">Populer</h2>

                    {loadingArtist && selectedArtistProfile.topSongs.length === 0 ? (
                      <div className="space-y-2 animate-pulse">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <div key={i} className="h-14 rounded-[8px] bg-[#17171A]" />
                        ))}
                      </div>
                    ) : selectedArtistProfile.topSongs.length > 0 ? (
                      <div className="space-y-1">
                        {selectedArtistProfile.topSongs.map((track, idx) => (
                          <AllSongsCompactRow
                            key={track.id}
                            item={track}
                            isSelected={selectedTrackIds.has(track.id)}
                            onToggleSelect={(e) => handleToggleSelectTrack(track.id, e)}
                            onPlay={() => {
                              if (onPlayPlaylist) {
                                onPlayPlaylist(selectedArtistProfile.topSongs.map(convertItemToTrack), idx);
                              } else {
                                onPlayTrack(convertItemToTrack(track));
                              }
                            }}
                            rank={idx + 1}
                            onPlayNext={() => onPlayNext?.(convertItemToTrack(track))}
                            onAddToPlaylist={() => onOpenAddToPlaylistModal?.([convertItemToTrack(track)])}
                            onAddToQueue={() => onAddTracksToQueue([convertItemToTrack(track)])}
                            onDownload={() => onStartDownload(convertItemToTrack(track))}
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="py-8 text-center text-xs text-[#8D8D93] bg-[#17171A] rounded-[10px]">
                        Tidak ada lagu populer yang ditemukan.
                      </div>
                    )}
                  </div>

                  {/* Section: Diskografi */}
                  {(selectedArtistProfile.albums.length > 0 || selectedArtistProfile.singles.length > 0) && (
                    <div className="space-y-4 pt-4">
                      <div className="flex items-center justify-between">
                        <h2 className="text-2xl font-light tracking-tight text-[#F4F4F0]">Diskografi</h2>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setArtistDiscographyTab('all')}
                            className={`h-9 px-4 rounded-[8px] text-[13px] transition-all cursor-pointer ${
                              artistDiscographyTab === 'all'
                                ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                                : 'bg-[#17171A] hover:bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0]'
                            }`}
                          >
                            Semua
                          </button>
                          {selectedArtistProfile.albums.length > 0 && (
                            <button
                              onClick={() => setArtistDiscographyTab('albums')}
                              className={`h-9 px-4 rounded-[8px] text-[13px] transition-all cursor-pointer ${
                                artistDiscographyTab === 'albums'
                                  ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                                  : 'bg-[#17171A] hover:bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0]'
                              }`}
                            >
                              Album
                            </button>
                          )}
                          {selectedArtistProfile.singles.length > 0 && (
                            <button
                              onClick={() => setArtistDiscographyTab('singles')}
                              className={`h-9 px-4 rounded-[8px] text-[13px] transition-all cursor-pointer ${
                                artistDiscographyTab === 'singles'
                                  ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                                  : 'bg-[#17171A] hover:bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0]'
                              }`}
                            >
                              Single & EP
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                        {(artistDiscographyTab === 'all'
                          ? [...selectedArtistProfile.albums, ...selectedArtistProfile.singles]
                          : artistDiscographyTab === 'albums'
                          ? selectedArtistProfile.albums
                          : selectedArtistProfile.singles
                        ).map((item) => (
                          <div
                            key={item.id}
                            onClick={() => handleSearch(item.title, true)}
                            className="group p-3 rounded-[10px] bg-[#17171A] hover:bg-[#1F1F23] transition-colors cursor-pointer flex flex-col select-none"
                          >
                            <div className="relative aspect-square w-full rounded-[8px] overflow-hidden bg-[#0B0B0C] mb-2.5 shadow-md">
                              {item.thumbnailUrl ? (
                                <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                                  <Music size={32} />
                                </div>
                              )}
                              <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-xl">
                                <Play size={15} fill="currentColor" className="translate-x-0.5" />
                              </div>
                            </div>
                            <p className="text-xs font-semibold text-[#F4F4F0] tracking-tight truncate group-hover:text-white transition-colors">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-[#8D8D93] truncate mt-0.5">
                              {item.year ? `${item.year} • ` : ''}{item.type || 'Album'}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>

                {/* Back button if viewing a specific user playlist */}
                {activeTab === 'playlists' && selectedPlaylist && (
                  <button
                    onClick={() => setSelectedPlaylist(null)}
                    className="flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    <ArrowLeft size={16} />
                    <span>Kembali ke Daftar Playlist</span>
                  </button>
                )}

                {/* When Search Tab and query is empty: Screen 2 Category Tiles Grid */}
                {activeTab === 'search' && !searchQuery.trim() ? (
                  <div className="space-y-4 animate-in fade-in duration-200">
                    <div className="space-y-1">
                      <h2 className="text-[18px] font-normal text-[#F4F4F0] tracking-tight">
                        Jelajahi Genre & Kategori
                      </h2>
                      <p className="text-[13px] text-[#8D8D93]">
                        Pilih genre atau suasana musik untuk mulai mendengarkan
                      </p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                      {NEUTRAL_CATEGORIES.map((cat) => (
                        <div
                          key={cat.id}
                          onClick={() => {
                            handleSearch(cat.query, true);
                          }}
                          style={{ backgroundColor: cat.bg }}
                          className="h-[160px] rounded-[10px] p-[18px] flex flex-col justify-between cursor-pointer select-none transition-transform hover:scale-[1.02] active:scale-[0.98] group"
                        >
                          <span className="text-[14px] font-normal text-[#F4F4F0] tracking-tight leading-tight block">
                            {cat.title}
                          </span>
                          <span className="text-[11px] font-mono text-[#8D8D93] uppercase tracking-wider block">
                            AuraAudio
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Category Filter Chips (Section 3.9 & 6.2: tinggi 36px, radius 8px) */}
                    {activeTab === 'search' && (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                        <button
                          onClick={() => setSearchFilter('all')}
                          className={`h-9 px-4 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
                            searchFilter === 'all'
                              ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                              : 'bg-[#17171A] hover:bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0]'
                          }`}
                        >
                          Semua
                        </button>
                        <button
                          onClick={() => setSearchFilter('songs')}
                          className={`h-9 px-4 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
                            searchFilter === 'songs'
                              ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                              : 'bg-[#17171A] hover:bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0]'
                          }`}
                        >
                          Lagu
                        </button>
                        {categorizedResults.artists.length > 0 && (
                          <button
                            onClick={() => setSearchFilter('artists')}
                            className={`h-9 px-4 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
                              searchFilter === 'artists'
                                ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                                : 'bg-[#17171A] hover:bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0]'
                            }`}
                          >
                            Artis
                          </button>
                        )}
                        {categorizedResults.albums.length > 0 && (
                          <button
                            onClick={() => setSearchFilter('albums')}
                            className={`h-9 px-4 rounded-[8px] text-xs font-medium transition-colors cursor-pointer ${
                              searchFilter === 'albums'
                                ? 'bg-[#F4F4F0] text-[#0B0B0C]'
                                : 'bg-[#17171A] hover:bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0]'
                            }`}
                          >
                            Album
                          </button>
                        )}
                      </div>
                    )}

                    {/* Hero Title & Metadata */}
                    <div className="space-y-1">
                      <h2 className="text-[28px] font-light tracking-tight text-[#F4F4F0]">{heroTitle}</h2>
                      <p className="text-[13px] text-[#8D8D93] font-normal">
                        {heroSubtitle}
                        {currentActiveList.length > 0 && (
                          <>
                            <span className="text-[#8D8D93] mx-1.5">•</span>
                            <span>{totalMinutes} menit total</span>
                          </>
                        )}
                      </p>
                    </div>

                    {/* Loading Skeleton */}
                    {(isSearching || loadingPlaylistTracks || loadingLiked) && (
                      <div className="space-y-6 animate-pulse">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="flex flex-col gap-2.5">
                              <div className="aspect-square w-full rounded-[8px] bg-[#17171A]" />
                              <div className="h-3 w-3/4 rounded-full bg-[#17171A]" />
                              <div className="h-2 w-1/2 rounded-full bg-[#17171A]" />
                            </div>
                          ))}
                        </div>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                          {[1, 2, 3, 4, 5, 6].map((i) => (
                            <div key={i} className="h-14 rounded-[8px] bg-[#17171A]" />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Empty State when no tracks found */}
                    {!isSearching && !loadingPlaylistTracks && !loadingLiked && allSongsList.length === 0 && (
                      <div className="text-center py-16 bg-[#17171A] rounded-[10px]">
                        <Search size={36} className="mx-auto text-[#8D8D93] mb-3" />
                        <p className="text-[18px] font-normal text-[#F4F4F0] mb-1">
                          {searchQuery.trim()
                            ? `Tidak ada hasil untuk "${searchQuery}"`
                            : 'Tidak ada lagu yang ditemukan'}
                        </p>
                        <p className="text-[13px] text-[#8D8D93] max-w-sm mx-auto mb-4">
                          {searchQuery.trim()
                            ? 'Pastikan kata kunci pencarian Anda benar atau coba kata kunci lain.'
                            : 'Coba cari lagu yang ingin Anda dengarkan di atas.'}
                        </p>
                        {searchQuery.trim() && (
                          <button
                            onClick={() => {
                              setSearchQuery('');
                              onExternalSearchChange?.('');
                            }}
                            className="px-5 py-2.5 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-white text-xs font-semibold transition-all cursor-pointer"
                          >
                            Hapus Pencarian
                          </button>
                        )}
                      </div>
                    )}
                  </>
                )}

                {/* VIEW MODE 1: SEARCH TAB with "Semua" Filter (Spotify Top Result + Lagu + Artis + Album) */}
                {!isSearching && activeTab === 'search' && searchFilter === 'all' && (
                  <div className="space-y-8 animate-in fade-in duration-200">
                    {/* Top Result + Top 4 Lagu Hero */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                      {/* Left: Hasil Teratas (Top Result) */}
                      {categorizedResults.topResult && (() => {
                        const topResultTrack: Track = {
                          id: categorizedResults.topResult.videoId || categorizedResults.topResult.title,
                          title: categorizedResults.topResult.title,
                          artist: categorizedResults.topResult.artist,
                          duration: 0,
                          sourceType: 'youtube',
                          url: categorizedResults.topResult.url || (categorizedResults.topResult.videoId ? `https://www.youtube.com/watch?v=${categorizedResults.topResult.videoId}` : ''),
                          thumbnailUrl: categorizedResults.topResult.thumbnailUrl,
                          isOffline: false,
                          dateAdded: Date.now(),
                        };
                        const isArtistResult = categorizedResults.topResult.type === 'Artis' || !categorizedResults.topResult.videoId;

                        return (
                          <div className="lg:col-span-5 space-y-3">
                            <h3 className="text-xl font-normal tracking-tight text-[#F4F4F0]">Hasil Teratas</h3>
                            <div
                              onClick={() => {
                                if (isArtistResult) {
                                  handleOpenArtist({
                                    id: categorizedResults.topResult?.browseId,
                                    browseId: categorizedResults.topResult?.browseId,
                                    name: categorizedResults.topResult?.title || '',
                                    thumbnailUrl: categorizedResults.topResult?.thumbnailUrl,
                                    subscribers: categorizedResults.topResult?.artist,
                                  });
                                } else {
                                  onPlayTrack(topResultTrack);
                                }
                              }}
                              className="group relative p-5 rounded-[10px] bg-[#17171A] hover:bg-[#1F1F23] transition-colors cursor-pointer flex flex-col justify-between min-h-[220px] select-none"
                            >
                              <div className="relative w-24 h-24 mb-4">
                                <img
                                  src={categorizedResults.topResult.thumbnailUrl}
                                  alt={categorizedResults.topResult.title}
                                  className={`w-full h-full object-cover shadow-lg ${
                                    isArtistResult ? 'rounded-full' : 'rounded-[8px]'
                                  }`}
                                />
                              </div>

                              <div>
                                <h4 className="text-2xl font-light text-[#F4F4F0] tracking-tight line-clamp-1 group-hover:text-white transition-colors">
                                  {categorizedResults.topResult.title}
                                </h4>
                                <div className="flex items-center gap-2 mt-1">
                                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#1F1F23] text-[#8D8D93]">
                                    {categorizedResults.topResult.type || 'Lagu'}
                                  </span>
                                  <span className="text-xs text-[#8D8D93] font-normal truncate">
                                    {categorizedResults.topResult.artist}
                                  </span>
                                </div>
                              </div>

                              <div className="absolute bottom-5 right-5 flex items-center gap-2">
                                {!isArtistResult && (
                                  <div className="relative" ref={topResultMenuRef}>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setIsTopResultMenuOpen((prev) => !prev);
                                      }}
                                      className={`w-10 h-10 rounded-[8px] bg-[#1F1F23] hover:bg-[#34343A] text-[#8D8D93] hover:text-[#F4F4F0] flex items-center justify-center shadow-lg transition-colors cursor-pointer ${
                                        isTopResultMenuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                      }`}
                                      title="Opsi Lagu"
                                    >
                                      <MoreHorizontal size={18} />
                                    </button>

                                    {isTopResultMenuOpen && (
                                      <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 bottom-full mb-2 w-52 py-1.5 bg-[#1F1F23] rounded-[8px] shadow-[0_12px_32px_rgba(0,0,0,0.8)] z-50 animate-in fade-in zoom-in-95 duration-150"
                                      >
                                        {onPlayNext && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setIsTopResultMenuOpen(false);
                                              onPlayNext(topResultTrack);
                                            }}
                                            className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#F4F4F0] hover:bg-[#34343A] transition-colors flex items-center gap-2.5 cursor-pointer rounded-[6px]"
                                          >
                                            <CornerDownRight size={14} className="text-[#8D8D93]" />
                                            <span>Putar Berikutnya</span>
                                          </button>
                                        )}

                                        {onOpenAddToPlaylistModal && (
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setIsTopResultMenuOpen(false);
                                              onOpenAddToPlaylistModal([topResultTrack]);
                                            }}
                                            className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#F4F4F0] hover:bg-[#34343A] transition-colors flex items-center gap-2.5 cursor-pointer rounded-[6px]"
                                          >
                                            <Plus size={14} className="text-[#8D8D93]" />
                                            <span>Tambah ke Playlist</span>
                                          </button>
                                        )}

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsTopResultMenuOpen(false);
                                            onAddTracksToQueue([topResultTrack]);
                                          }}
                                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#F4F4F0] hover:bg-[#34343A] transition-colors flex items-center gap-2.5 cursor-pointer rounded-[6px]"
                                        >
                                          <ListMusic size={14} className="text-[#8D8D93]" />
                                          <span>Tambahkan ke Antrean</span>
                                        </button>

                                        <button
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setIsTopResultMenuOpen(false);
                                            onStartDownload(topResultTrack);
                                          }}
                                          className="w-full px-3.5 py-2 text-left text-xs font-medium text-[#F4F4F0] hover:bg-[#34343A] transition-colors flex items-center gap-2.5 cursor-pointer rounded-[6px] mt-0.5"
                                        >
                                          <Download size={14} className="text-[#8D8D93]" />
                                          <span>Unduh Lagu</span>
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="w-12 h-12 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center shadow-xl opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all hover:scale-105 active:scale-95 cursor-pointer">
                                  <Play size={20} fill="currentColor" className="ml-0.5" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()}

                      {/* Right: Lagu (Top 4 Songs) */}
                      {categorizedResults.songs.length > 0 && (
                        <div className={`${categorizedResults.topResult ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-3`}>
                          <h3 className="text-xl font-normal tracking-tight text-[#F4F4F0]">Lagu</h3>
                          <div className="space-y-1">
                            {categorizedResults.songs.slice(0, 4).map((track, idx) => (
                              <AllSongsCompactRow
                                key={track.id}
                                item={track}
                                isSelected={selectedTrackIds.has(track.id)}
                                onToggleSelect={(e) => handleToggleSelectTrack(track.id, e)}
                                onPlay={() => {
                                  if (onPlayPlaylist) onPlayPlaylist(categorizedResults.songs.map(convertItemToTrack), idx);
                                  else onPlayTrack(convertItemToTrack(track));
                                }}
                                rank={idx + 1}
                                onPlayNext={() => onPlayNext?.(convertItemToTrack(track))}
                                onAddToPlaylist={() => onOpenAddToPlaylistModal?.([convertItemToTrack(track)])}
                                onAddToQueue={() => onAddTracksToQueue([convertItemToTrack(track)])}
                                onDownload={() => onStartDownload(convertItemToTrack(track))}
                              />
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Artis Section */}
                    {categorizedResults.artists.length > 0 && (
                      <div className="space-y-3.5 pt-2">
                        <h3 className="text-xl font-normal tracking-tight text-[#F4F4F0]">Artis</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {categorizedResults.artists.map((artist) => (
                            <div
                              key={artist.id}
                              onClick={() => handleOpenArtist(artist)}
                              className="group p-3.5 rounded-[10px] bg-[#17171A] hover:bg-[#1F1F23] transition-colors cursor-pointer flex flex-col items-center text-center select-none"
                            >
                              <div className="relative aspect-square w-full rounded-full overflow-hidden bg-[#1F1F23] mb-3 shadow-md group-hover:scale-105 transition-transform">
                                {artist.thumbnailUrl ? (
                                  <img src={artist.thumbnailUrl} alt={artist.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                                    <User size={32} />
                                  </div>
                                )}
                              </div>
                              <p className="text-xs font-semibold text-[#F4F4F0] tracking-tight truncate w-full group-hover:text-white transition-colors">
                                {artist.name}
                              </p>
                              <p className="text-[11px] text-[#8D8D93] truncate w-full mt-0.5">
                                {artist.subscribers || 'Artis'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Album & Single Section */}
                    {categorizedResults.albums.length > 0 && (
                      <div className="space-y-3.5 pt-2">
                        <h3 className="text-xl font-normal tracking-tight text-[#F4F4F0]">Album & Single</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                          {categorizedResults.albums.map((album) => (
                            <div
                              key={album.id}
                              onClick={() => handleSearch(album.title, true)}
                              className="group p-3 rounded-[10px] bg-[#17171A] hover:bg-[#1F1F23] transition-colors cursor-pointer flex flex-col select-none"
                            >
                              <div className="relative aspect-square w-full rounded-[8px] overflow-hidden bg-[#0B0B0C] mb-2.5 shadow-md">
                                {album.thumbnailUrl ? (
                                  <img src={album.thumbnailUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                                    <Music size={32} />
                                  </div>
                                )}
                                <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-xl">
                                  <Play size={15} fill="currentColor" className="translate-x-0.5" />
                                </div>
                              </div>
                              <p className="text-xs font-semibold text-[#F4F4F0] tracking-tight truncate group-hover:text-white transition-colors">
                                {album.title}
                              </p>
                              <p className="text-[11px] text-[#8D8D93] truncate mt-0.5">
                                {album.year ? `${album.year} • ` : ''}{album.type || 'Album'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lagu Lainnya Section */}
                    {categorizedResults.songs.length > 4 && (
                      <div className="space-y-3.5 pt-2">
                        <h3 className="text-xl font-normal tracking-tight text-[#F4F4F0]">Lagu Lainnya</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-1">
                          {categorizedResults.songs.slice(4).map((item, idx) => (
                            <AllSongsCompactRow
                              key={item.id}
                              item={item}
                              isSelected={selectedTrackIds.has(item.id)}
                              onToggleSelect={(e) => handleToggleSelectTrack(item.id, e)}
                              onPlay={() => {
                                if (onPlayPlaylist) {
                                  onPlayPlaylist(categorizedResults.songs.map(convertItemToTrack), idx + 4);
                                } else {
                                  onPlayTrack(convertItemToTrack(item));
                                }
                              }}
                              rank={idx + 5}
                              onPlayNext={() => onPlayNext?.(convertItemToTrack(item))}
                              onAddToPlaylist={() => onOpenAddToPlaylistModal?.([convertItemToTrack(item)])}
                              onAddToQueue={() => onAddTracksToQueue([convertItemToTrack(item)])}
                              onDownload={() => onStartDownload(convertItemToTrack(item))}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW MODE 2: SEARCH TAB with "Lagu" Filter OR Liked/Playlists */}
                {!isSearching && (activeTab !== 'search' || searchFilter === 'songs') && allSongsList.length > 0 && (
                  <div className="space-y-3 pb-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <h3 className="text-xs uppercase tracking-wider font-medium text-[#8D8D93]">Daftar Lagu</h3>
                        {selectedTrackIds.size > 0 && (
                          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-[#1F1F23] text-[#F4F4F0]">
                            {selectedTrackIds.size} dipilih
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            if (onPlayPlaylist) onPlayPlaylist(currentActiveList.map(convertItemToTrack));
                          }}
                          className="px-4 py-2 rounded-full bg-[#1F1F23] hover:bg-[#34343A] text-xs font-medium text-[#F4F4F0] transition-all shadow-sm cursor-pointer"
                        >
                          Putar Semua
                        </button>
                        {onDownloadBatch && currentActiveList.length > 0 && (
                          <button
                            onClick={() => onDownloadBatch(currentActiveList.map(convertItemToTrack))}
                            className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#1F1F23] hover:bg-[#34343A] text-xs font-medium text-[#F4F4F0] transition-all shadow-sm cursor-pointer"
                            title="Unduh seluruh lagu dalam daftar ini untuk offline"
                          >
                            <Download size={13} className="text-[#F4F4F0]" />
                            <span>Unduh Semua</span>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-5 gap-y-1">
                      {allSongsList.map((item, idx) => (
                        <AllSongsCompactRow
                          key={item.id}
                          item={item}
                          isSelected={selectedTrackIds.has(item.id)}
                          onToggleSelect={(e) => handleToggleSelectTrack(item.id, e)}
                          onPlay={() => {
                            if (onPlayPlaylist) {
                              onPlayPlaylist(allSongsList.map(convertItemToTrack), idx);
                            } else {
                              onPlayTrack(convertItemToTrack(item));
                            }
                          }}
                          rank={idx + 1}
                          onPlayNext={() => onPlayNext?.(convertItemToTrack(item))}
                          onAddToPlaylist={() => onOpenAddToPlaylistModal?.([convertItemToTrack(item)])}
                          onAddToQueue={() => onAddTracksToQueue([convertItemToTrack(item)])}
                          onDownload={() => onStartDownload(convertItemToTrack(item))}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* VIEW MODE 3: SEARCH TAB with "Artis" Filter */}
                {!isSearching && activeTab === 'search' && searchFilter === 'artists' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-normal tracking-tight text-[#F4F4F0]">Artis</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {categorizedResults.artists.map((artist) => (
                        <div
                          key={artist.id}
                          onClick={() => handleOpenArtist(artist)}
                          className="group p-3.5 rounded-[10px] bg-[#17171A] hover:bg-[#1F1F23] transition-colors cursor-pointer flex flex-col items-center text-center select-none"
                        >
                          <div className="relative aspect-square w-full rounded-full overflow-hidden bg-[#1F1F23] mb-3 shadow-md group-hover:scale-105 transition-transform">
                            {artist.thumbnailUrl ? (
                              <img src={artist.thumbnailUrl} alt={artist.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                                <User size={32} />
                              </div>
                            )}
                          </div>
                          <p className="text-xs font-semibold text-[#F4F4F0] tracking-tight truncate w-full group-hover:text-white transition-colors">
                            {artist.name}
                          </p>
                          <p className="text-[11px] text-[#8D8D93] truncate w-full mt-0.5">
                            {artist.subscribers || 'Artis'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* VIEW MODE 4: SEARCH TAB with "Album" Filter */}
                {!isSearching && activeTab === 'search' && searchFilter === 'albums' && (
                  <div className="space-y-4">
                    <h3 className="text-xl font-normal tracking-tight text-[#F4F4F0]">Album & Single</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {categorizedResults.albums.map((album) => (
                        <div
                          key={album.id}
                          onClick={() => handleSearch(album.title, true)}
                          className="group p-3 rounded-[10px] bg-[#17171A] hover:bg-[#1F1F23] transition-colors cursor-pointer flex flex-col select-none"
                        >
                          <div className="relative aspect-square w-full rounded-[8px] overflow-hidden bg-[#0B0B0C] mb-2.5 shadow-md">
                            {album.thumbnailUrl ? (
                              <img src={album.thumbnailUrl} alt={album.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-[#8D8D93]">
                                <Music size={32} />
                              </div>
                            )}
                            <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-[#F4F4F0] text-[#0B0B0C] flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-xl">
                              <Play size={15} fill="currentColor" className="ml-0.5" />
                            </div>
                          </div>
                          <p className="text-xs font-semibold text-[#F4F4F0] tracking-tight truncate group-hover:text-white transition-colors">
                            {album.title}
                          </p>
                          <p className="text-[11px] text-[#8D8D93] truncate mt-0.5">
                            {album.year ? `${album.year} • ` : ''}{album.type || 'Album'}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      {/* Floating Multi-Select Action Bar (Section 2: radius 8px, latar --surface #17171A, tanpa border) */}
      {selectedTrackIds.size > 0 && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 bg-[#17171A] text-[#F4F4F0] px-5 py-2.5 rounded-[8px] shadow-2xl flex items-center gap-4 animate-in fade-in slide-in-from-bottom duration-200">
          <span className="text-xs font-medium text-[#F4F4F0]">
            {selectedTrackIds.size} lagu dipilih
          </span>

          <div className="h-4 w-[1px] bg-[#34343A]" />

          <button
            onClick={handlePlaySelected}
            className="flex items-center gap-1.5 text-xs font-medium text-[#F4F4F0] hover:text-white transition-colors cursor-pointer"
          >
            <Play size={13} fill="currentColor" /> Putar
          </button>

          {onPlayNext && (
            <button
              onClick={() => {
                const selected = getSelectedTracks();
                if (selected.length > 0) {
                  onPlayNext(selected[0]);
                }
                clearSelection();
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-[#8D8D93] hover:text-[#F4F4F0] transition-colors cursor-pointer"
            >
              <CornerDownRight size={13} className="text-[#8D8D93]" /> Berikutnya
            </button>
          )}

          {onOpenAddToPlaylistModal && (
            <button
              onClick={() => {
                const selected = getSelectedTracks();
                onOpenAddToPlaylistModal(selected);
                clearSelection();
              }}
              className="flex items-center gap-1.5 text-xs font-medium text-[#F4F4F0] hover:text-white transition-colors cursor-pointer"
              title="Masukkan lagu yang dipilih ke playlist"
            >
              <ListPlus size={14} className="text-[#8D8D93]" /> Masukkan ke Playlist
            </button>
          )}

          <button
            onClick={() => {
              const selected = getSelectedTracks();
              onAddTracksToQueue(selected);
              clearSelection();
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#8D8D93] hover:text-[#F4F4F0] transition-colors cursor-pointer"
          >
            <ListMusic size={13} /> Antrean
          </button>

          <button
            onClick={() => {
              const selected = getSelectedTracks();
              if (onDownloadBatch) onDownloadBatch(selected);
              else selected.forEach((t) => onStartDownload(t));
              clearSelection();
            }}
            className="flex items-center gap-1.5 text-xs font-medium text-[#8D8D93] hover:text-[#F4F4F0] transition-colors cursor-pointer"
          >
            <Download size={13} /> Unduh
          </button>

          <button
            onClick={clearSelection}
            className="p-1 hover:bg-[#34343A] rounded-[4px] text-[#8D8D93] hover:text-[#F4F4F0] transition-colors ml-1 cursor-pointer"
            title="Batal Pilih"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};
