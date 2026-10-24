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
  YTMusicPersonalizedDiscovery,
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
  Disc3,
  RotateCw,
  ChevronLeft,
  ChevronRight,
  Flame,
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
  listeningHistory?: Track[];
  onSelectCustomPlaylist?: (id: string) => void;
  onViewChange?: (view: 'ytmusic' | 'library' | 'custom_playlist' | 'stage') => void;
  dynamicLighting?: {
    enabled: boolean;
    intensity: 'subtle' | 'medium' | 'vibrant';
  };
  activeColor?: string;
}

export const DEFAULT_TRENDING_TRACKS: YTMusicTrackItem[] = [];

export const REAL_POPULAR_SONGS: Track[] = [
  {
    id: 'd5gf9dXbPi0',
    title: 'Birds of a Feather',
    artist: 'Billie Eilish',
    album: 'HIT ME HARD AND SOFT',
    duration: 196,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=d5gf9dXbPi0',
    thumbnailUrl: 'https://i.ytimg.com/vi/d5gf9dXbPi0/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'kPa7bsKwL-8',
    title: 'Die With A Smile',
    artist: 'Lady Gaga & Bruno Mars',
    album: 'Die With A Smile',
    duration: 251,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=kPa7bsKwL-8',
    thumbnailUrl: 'https://i.ytimg.com/vi/kPa7bsKwL-8/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'eVli-tstM5E',
    title: 'Espresso',
    artist: 'Sabrina Carpenter',
    album: "Short n' Sweet",
    duration: 175,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=eVli-tstM5E',
    thumbnailUrl: 'https://i.ytimg.com/vi/eVli-tstM5E/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: '4NRXx6U8ABQ',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
    thumbnailUrl: 'https://i.ytimg.com/vi/4NRXx6U8ABQ/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'ic8j13gfnM8',
    title: 'Cruel Summer',
    artist: 'Taylor Swift',
    album: 'Lover',
    duration: 178,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=ic8j13gfnM8',
    thumbnailUrl: 'https://i.ytimg.com/vi/ic8j13gfnM8/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'o04_vHq10F0',
    title: 'Satu Bulan',
    artist: 'Bernadya',
    album: 'Sialnya, Hidup Harus Tetap Berjalan',
    duration: 194,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=o04_vHq10F0',
    thumbnailUrl: 'https://i.ytimg.com/vi/o04_vHq10F0/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'iHjT50U5V78',
    title: 'Evaluasi',
    artist: 'Hindia',
    album: 'Menari Dengan Bayangan',
    duration: 204,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=iHjT50U5V78',
    thumbnailUrl: 'https://i.ytimg.com/vi/iHjT50U5V78/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'mxyucVdu8n4',
    title: 'Lowkey',
    artist: 'NIKI',
    album: 'wanna take this downtown?',
    duration: 171,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=mxyucVdu8n4',
    thumbnailUrl: 'https://i.ytimg.com/vi/mxyucVdu8n4/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: 'dvgZkm1xWPE',
    title: 'Viva La Vida',
    artist: 'Coldplay',
    album: 'Viva La Vida',
    duration: 242,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=dvgZkm1xWPE',
    thumbnailUrl: 'https://i.ytimg.com/vi/dvgZkm1xWPE/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
  {
    id: '34Na4j8AVgA',
    title: 'Starboy',
    artist: 'The Weeknd',
    album: 'Starboy',
    duration: 230,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=34Na4j8AVgA',
    thumbnailUrl: 'https://i.ytimg.com/vi/34Na4j8AVgA/hqdefault.jpg',
    isOffline: false,
    dateAdded: Date.now(),
  },
];

export const SAMPLE_SONGS: Track[] = REAL_POPULAR_SONGS;

export const REAL_POPULAR_ARTISTS = [
  {
    id: 'UCERrDZ8oN0U_n9MphMKERcg',
    name: 'Billie Eilish',
    subscribers: '106 jt pendengar bulanan',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/tQC4rOL6xz6FhmFr0ggQExxyGbYSOsyveXVSnPBh2WjEyIzQ9pMHablLJ-0GlMBrLBlBrbWQGmzrV6KN=w544-h544-l90-rj',
  },
  {
    id: 'UClYV6hHlupm_S_ObS1W-DYw',
    name: 'The Weeknd',
    subscribers: '115 jt pendengar bulanan',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/U-SAmNOu4TynE818gLCfKsuHZ0U5YNEtO9mrjSI9WCCKERs98LzrCal5kajBBTQNwdcisoB2Bn-pHp4=w544-h544-l90-rj',
  },
  {
    id: 'UCPC0L1d253x-KuMNwa05TpA',
    name: 'Taylor Swift',
    subscribers: '98 jt pendengar bulanan',
    thumbnailUrl:
      'https://yt3.googleusercontent.com/RCpTA6EXJQyjVFDosWOKa2SMmqkua_lA9mHPDWWciLwgqpZLz-k8rXWRF_367trrQ7up9BUwCbk6kRk=w544-h544-l90-rj',
  },
  {
    id: 'UCZn4r7heNOPY-C43YIywnVA',
    name: 'Bruno Mars',
    subscribers: '118 jt pendengar bulanan',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/hnefGBrazRhn4Z92bdSZBUENl40ONjRiVDsmZKZh-WZ2iCKE-2c7KKR7SNcZfzLHoRyB3E6as8L87YA=w544-h544-l90-rj',
  },
  {
    id: 'UCUn9Xjvg8fwqpa58-_XO6zw',
    name: 'Bernadya',
    subscribers: '12 jt pendengar bulanan',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/hxROE1fvLWSxUYAFV3IgMp5vvjN91Jx6oS6uwSVyYN9_fb3I6PLaRa3Ufb4A0awxq4J5UoPFQAQM-Q=w544-h544-l90-rj',
  },
  {
    id: 'UCIaFw5VBEK8qaW6nRpx_qnw',
    name: 'Coldplay',
    subscribers: '89 jt pendengar bulanan',
    thumbnailUrl:
      'https://lh3.googleusercontent.com/IOKuXtp8PCQ_Fc-vaRKm3sKIXBxFV51gZheLTH5br-YGnWHFQf_Jywcuk7wbprYRoEbQyS_XZY6-nMJX=w544-h544-l90-rj',
  },
];

export const SAMPLE_PLAYLISTS = [
  { id: 'sample-pl-1', name: 'Midnight Drive', trackCount: 24, coverUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=400&fit=crop' },
  { id: 'sample-pl-2', name: 'Fokus Belajar', trackCount: 38, coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop' },
  { id: 'sample-pl-3', name: 'Santai Sore', trackCount: 52, coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=400&fit=crop' },
  { id: 'sample-pl-4', name: 'Energi Positif', trackCount: 60, coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop' },
  { id: 'sample-pl-5', name: 'Perjalanan', trackCount: 29, coverUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop' },
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

function formatRelativeTime(timestamp?: number): string {
  if (!timestamp) return '';
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'Baru saja';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} mnt lalu`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} jam lalu`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay === 1) return 'Kemarin';
  if (diffDay < 7) return `${diffDay} hr lalu`;
  return new Date(timestamp).toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
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
  listeningHistory = [],
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

  // Dedicated Home Page Redesign States (Juxtopposed Apple Music Redesign)
  const [activeHeroIndex, setActiveHeroIndex] = useState(0);
  const [homeFilter, setHomeFilter] = useState<'all' | 'music' | 'artists'>('all');
  const [refreshKey, setRefreshKey] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [personalizedData, setPersonalizedData] = useState<YTMusicPersonalizedDiscovery | null>(null);
  const [isLoadingPersonalized, setIsLoadingPersonalized] = useState(false);

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

  // Live dynamic discover data fetched from YouTube Music
  const [dynamicTrendingSongs, setDynamicTrendingSongs] = useState<Track[]>([]);
  const [dynamicPopularArtists, setDynamicPopularArtists] = useState<any[]>([]);

  // Fetch real personalized discover data from YouTube Music on mount, on refresh, or when taste signals change
  useEffect(() => {
    let isCancelled = false;
    async function fetchPersonalizedDiscovery() {
      if (!window.electronAPI?.getPersonalizedDiscovery) return;
      setIsLoadingPersonalized(true);

      // Calculate real taste affinity from cumulative history and library
      // (Frequency-weighted: An artist played 1 time will NEVER overwrite the user's core taste anchor!)
      const artistCounts = new Map<string, { count: number; tracks: Track[] }>();

      // 1. Weight listening history
      (listeningHistory || []).forEach((t) => {
        if (!t || !t.artist || t.artist.toLowerCase().includes('unknown')) return;
        const norm = t.artist.trim();
        if (!artistCounts.has(norm)) {
          artistCounts.set(norm, { count: 0, tracks: [] });
        }
        const entry = artistCounts.get(norm)!;
        entry.count += 1;
        if (entry.tracks.length < 3) entry.tracks.push(t);
      });

      // 2. Weight library tracks (+1.5 weight per saved song)
      (libraryTracks || []).forEach((t) => {
        if (!t || !t.artist || t.artist.toLowerCase().includes('unknown')) return;
        const norm = t.artist.trim();
        if (!artistCounts.has(norm)) {
          artistCounts.set(norm, { count: 0, tracks: [] });
        }
        const entry = artistCounts.get(norm)!;
        entry.count += 1.5;
        if (entry.tracks.length < 3) entry.tracks.push(t);
      });

      let seeds: { id?: string; title: string; artist: string }[] = [];

      if (artistCounts.size > 0) {
        // Sort artists by cumulative affinity score descending
        const sorted = Array.from(artistCounts.entries()).sort(
          (a, b) => b[1].count - a[1].count
        );
        // Take top 4 artists as seeds
        seeds = sorted.slice(0, 4).map(([artist, data]) => ({
          id: data.tracks[0]?.id,
          title: data.tracks[0]?.title || artist,
          artist,
        }));
      } else {
        const fallback = (listeningHistory?.length ? listeningHistory : (libraryTracks || [])).slice(0, 5);
        seeds = fallback.map((t) => ({ id: t.id, title: t.title, artist: t.artist }));
      }

      try {
        const data: YTMusicPersonalizedDiscovery = await window.electronAPI.getPersonalizedDiscovery(seeds);
        if (isCancelled || !data) return;

        setPersonalizedData(data);
        if (data.discoveryTracks && data.discoveryTracks.length > 0) {
          setDynamicTrendingSongs(data.discoveryTracks.map(convertItemToTrack));
        }
        if (data.relatedArtists && data.relatedArtists.length > 0) {
          const junkKeywords = [
            'relax',
            'chill beats',
            'lofi beats',
            'music channel',
            'sleep music',
            'study music',
            'sound library',
            'jazz lounge',
            'records',
            'various artists',
          ];
          const filtered = data.relatedArtists
            .filter((a: any) => {
              if (!a || !a.name) return false;
              const n = a.name.toLowerCase();
              if (junkKeywords.some((k) => n.includes(k))) return false;
              if (a.thumbnailUrl && a.thumbnailUrl.includes('photo-1511671782779')) return false;
              return true;
            })
            .map((a: any, idx: number) => ({
              id: a.id || a.browseId || `art-live-${idx}`,
              browseId: a.browseId,
              name: a.name,
              subscribers: a.subscribers || 'Artis Terkait',
              thumbnailUrl:
                a.thumbnailUrl && !a.thumbnailUrl.includes('photo-1511671782779')
                  ? a.thumbnailUrl
                  : REAL_POPULAR_ARTISTS[idx % REAL_POPULAR_ARTISTS.length].thumbnailUrl,
            }));
          setDynamicPopularArtists(filtered);
        }
      } catch (err) {
        console.warn('Personalized discovery fallback:', err);
      } finally {
        if (!isCancelled) {
          setIsLoadingPersonalized(false);
        }
      }
    }

    fetchPersonalizedDiscovery();
    return () => {
      isCancelled = true;
    };
  }, [
    refreshKey,
  ]);

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

  // Curated spotlight showcase items for the Apple Music Redesign Hero Banner (Personalized)
  const spotlightItems = useMemo(() => {
    const list: {
      track: Track;
      badge: string;
      tagline: string;
      genre: string;
    }[] = [];

    if (personalizedData?.spotlightTrack) {
      list.push({
        track: convertItemToTrack(personalizedData.spotlightTrack),
        badge: 'TERINSPIRASI DARI SELERA MUSIKMU',
        tagline: personalizedData.seedArtist
          ? `Menjelajahi spektrum musik baru sejalan dengan aliran ${personalizedData.seedArtist}`
          : 'Track unggulan terkurasi khusus untukmu',
        genre: personalizedData.vibeTitle,
      });
    }

    if (personalizedData?.discoveryTracks && personalizedData.discoveryTracks.length > 1) {
      const moreDiscovery = personalizedData.discoveryTracks.slice(1, 4).map((dt, idx) => ({
        track: convertItemToTrack(dt),
        badge: idx === 0 ? 'VIBE PENEMUAN' : idx === 1 ? 'ALIRAN SERUMPUN' : 'REKOMENDASI PINTAR',
        tagline: 'Karya musik berfrekuensi serupa yang belum pernah kamu dengar',
        genre: personalizedData.vibeTitle,
      }));
      list.push(...moreDiscovery);
    }

    // Fallbacks if discovery is loading or empty
    if (list.length === 0) {
      const pool = [
        ...(libraryTracks || []),
        ...(dynamicTrendingSongs.length > 0 ? dynamicTrendingSongs : []),
        ...REAL_POPULAR_SONGS,
      ];
      pool.slice(0, 4).forEach((t, i) => {
        list.push({
          track: t,
          badge: i === 0 ? 'PILIHAN HARI INI' : 'HEAVY ROTATION',
          tagline: 'Track paling menonjol yang dikurasi khusus untukmu',
          genre: t.album || 'Koleksi Musik',
        });
      });
    }

    return list;
  }, [personalizedData, libraryTracks, dynamicTrendingSongs, refreshKey]);

  // Curated mood playlists for Home (Refined, authentic Apple Music style)
  const homeCuratedPlaylists = useMemo(() => {
    const list = [
      {
        id: 'curated-chill',
        title: 'Santai Sore',
        subtitle: 'Akustik, Lo-fi & Chill',
        coverUrl: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=400&h=400&fit=crop',
      },
      {
        id: 'curated-night',
        title: 'Midnight Drive',
        subtitle: 'Synthwave & Melodic Night',
        coverUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=400&h=400&fit=crop',
      },
      {
        id: 'curated-focus',
        title: 'Fokus Belajar',
        subtitle: 'Piano Instrumental & Klasik',
        coverUrl: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=400&h=400&fit=crop',
      },
      {
        id: 'curated-energy',
        title: 'Energi Positif',
        subtitle: 'Pop Hits & Semangat Pagi',
        coverUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400&h=400&fit=crop',
      },
      {
        id: 'curated-travel',
        title: 'Perjalanan & Roadtrip',
        subtitle: 'Indie Rock & Petualangan',
        coverUrl: 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=400&h=400&fit=crop',
      },
      {
        id: 'curated-sleep',
        title: 'Malam Tenang',
        subtitle: 'Ambient & Deep Sleep',
        coverUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=400&h=400&fit=crop',
      },
    ];

    if (customPlaylists && customPlaylists.length > 0) {
      const real = customPlaylists.slice(0, 3).map((pl) => {
        const count = pl.tracks?.length || 0;
        return {
          id: pl.id,
          title: pl.name,
          subtitle: count > 0 ? `Playlist • ${count} lagu` : 'Playlist kustom',
          coverUrl: pl.tracks?.[0]?.thumbnailUrl || null,
        };
      });
      return [...real, ...list].slice(0, 6);
    }

    return list;
  }, [customPlaylists]);

  // Real, globally recognized popular artists with live dynamic query fallback
  const popularArtistsList = useMemo(() => {
    if (dynamicPopularArtists.length > 0) {
      const valid = dynamicPopularArtists.filter(
        (art) =>
          art &&
          art.name &&
          art.thumbnailUrl &&
          !art.thumbnailUrl.includes('photo-1511671782779')
      );
      if (valid.length > 0) return valid;
    }
    return REAL_POPULAR_ARTISTS;
  }, [dynamicPopularArtists]);

  const isHomeView = activeTab === 'playlists' && !selectedPlaylist && !selectedArtistProfile;

  return (
    <div className="flex-1 flex flex-col h-full bg-transparent overflow-y-auto select-none relative">
      {/* Main Content Area */}
      <div className="px-9 py-7 pb-28 flex-1">
        {selectedArtistProfile ? (
          /* DEDICATED ARTIST PROFILE VIEW */
          <div className="space-y-8 animate-in fade-in duration-200 -mx-9 -mt-7">
            {/* Artist Hero Header */}
            <div className="relative min-h-[300px] md:min-h-[340px] w-full overflow-hidden flex flex-col justify-between p-7 md:p-9 select-none bg-[#121215]">
              {/* Blurred Ambient Backdrop */}
              {selectedArtistProfile.bannerUrl && (
                <>
                  <img
                    src={selectedArtistProfile.bannerUrl}
                    alt={selectedArtistProfile.name}
                    className="absolute inset-0 w-full h-full object-cover object-center opacity-30 filter blur-2xl scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E11] via-[#0E0E11]/70 to-black/40" />
                </>
              )}

              {/* Top Bar: Back Button */}
              <div className="relative z-10">
                <button
                  onClick={() => setSelectedArtistProfile(null)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/50 hover:bg-black/80 text-[#F4F4F0] text-xs font-medium backdrop-blur-md border border-white/10 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <ArrowLeft size={15} />
                  <span>Kembali</span>
                </button>
              </div>

              {/* Artist Header Metadata with Portrait and Info */}
              <div className="relative z-10 flex items-end gap-6 pt-6">
                {selectedArtistProfile.bannerUrl && (
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-full overflow-hidden bg-[#1D1D24] border-2 border-white/10 shadow-2xl flex-shrink-0">
                    <img
                      src={selectedArtistProfile.bannerUrl}
                      alt={selectedArtistProfile.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 font-medium">
                    <CheckCircle2 size={15} />
                    <span>Artis Terverifikasi</span>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-bold text-[#F4F4F0] tracking-tight">
                    {selectedArtistProfile.name}
                  </h1>

                  <p className="text-[13px] text-zinc-400">
                    {selectedArtistProfile.subscribers
                      ? `${selectedArtistProfile.subscribers} pendengar bulanan`
                      : 'Artis Populer'}
                  </p>
                </div>
              </div>
            </div>

            {/* Artist Body Content */}
            <div className="px-9 space-y-8 pb-10">
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
                  className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
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
                  className="w-11 h-11 rounded-full bg-[#1A1A20] hover:bg-[#25252D] text-zinc-400 hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors cursor-pointer disabled:opacity-40"
                  title="Acak Lagu Teratas"
                >
                  <Shuffle size={18} />
                </button>

                {onDownloadBatch && selectedArtistProfile.topSongs.length > 0 && (
                  <button
                    onClick={() => onDownloadBatch(selectedArtistProfile.topSongs.map(convertItemToTrack))}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1A1A20] hover:bg-[#25252D] border border-white/[0.06] text-xs font-medium text-[#F4F4F0] transition-colors cursor-pointer"
                    title="Unduh seluruh lagu teratas artis ini"
                  >
                    <Download size={14} className="text-[#F4F4F0]" />
                    <span>Unduh Semua</span>
                  </button>
                )}

                {loadingArtist && (
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <Loader2 size={16} className="animate-spin text-white" />
                    <span>Memuat profil artis...</span>
                  </div>
                )}
              </div>

              {/* Section: Populer */}
              <div className="space-y-4">
                <h2 className="text-xl font-semibold tracking-tight text-white">Lagu Populer</h2>

                {loadingArtist && selectedArtistProfile.topSongs.length === 0 ? (
                  <div className="space-y-2 animate-pulse">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <div key={i} className="h-14 rounded-[12px] bg-[#141418]" />
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
                  <div className="py-8 text-center text-xs text-zinc-400 bg-[#141418] rounded-[12px] border border-white/[0.04]">
                    Tidak ada lagu populer yang ditemukan.
                  </div>
                )}
              </div>

              {/* Section: Diskografi */}
              {(selectedArtistProfile.albums.length > 0 || selectedArtistProfile.singles.length > 0) && (
                <div className="space-y-4 pt-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold tracking-tight text-white">Diskografi</h2>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setArtistDiscographyTab('all')}
                        className={`h-8 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                          artistDiscographyTab === 'all'
                            ? 'bg-white text-black'
                            : 'bg-[#141418] hover:bg-[#1A1A20] text-zinc-400 hover:text-white border border-white/[0.04]'
                        }`}
                      >
                        Semua
                      </button>
                      {selectedArtistProfile.albums.length > 0 && (
                        <button
                          onClick={() => setArtistDiscographyTab('albums')}
                          className={`h-8 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            artistDiscographyTab === 'albums'
                              ? 'bg-white text-black'
                              : 'bg-[#141418] hover:bg-[#1A1A20] text-zinc-400 hover:text-white border border-white/[0.04]'
                          }`}
                        >
                          Album
                        </button>
                      )}
                      {selectedArtistProfile.singles.length > 0 && (
                        <button
                          onClick={() => setArtistDiscographyTab('singles')}
                          className={`h-8 px-3.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                            artistDiscographyTab === 'singles'
                              ? 'bg-white text-black'
                              : 'bg-[#141418] hover:bg-[#1A1A20] text-zinc-400 hover:text-white border border-white/[0.04]'
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
                        className="group p-3 rounded-[14px] bg-[#141418] hover:bg-[#1A1A20] border border-white/[0.04] hover:border-white/[0.08] transition-all cursor-pointer flex flex-col select-none"
                      >
                        <div className="relative aspect-square w-full rounded-[10px] overflow-hidden bg-[#1D1D24] mb-2.5 shadow-md border border-white/[0.06]">
                          {item.thumbnailUrl ? (
                            <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <Music size={32} />
                            </div>
                          )}
                          <div className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all shadow-xl">
                            <Play size={15} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>
                        <p className="text-xs font-semibold text-white tracking-tight truncate group-hover:text-zinc-200 transition-colors">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                          {item.year ? `${item.year} • ` : ''}{item.type || 'Album'}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : isHomeView ? (
          /* SECTION: JUXTOPPOSED APPLE MUSIC REDESIGN HOME LAYOUT (PREMIUM 7 TINY FIXES) */
          <div className="space-y-10 animate-in fade-in duration-200">
            {/* 1. Header Beranda & Aksi Cepat */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-1">
              <div>
                <span className="text-[10px] font-semibold tracking-wider text-zinc-400 uppercase block">
                  {getGreeting()} • Eksplorasi Kurasi Musik
                </span>
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight mt-0.5">
                  Dengarkan Sekarang
                </h1>
              </div>

              {/* Action Controls: Segarkan & Filter Kategori */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Tombol Segarkan (Juxtopposed: refresh recommendations anytime) */}
                <button
                  onClick={() => {
                    setIsRefreshing(true);
                    setRefreshKey((k) => k + 1);
                    setTimeout(() => setIsRefreshing(false), 500);
                  }}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141418] hover:bg-[#1A1A20] text-zinc-300 hover:text-white border border-white/[0.04] hover:border-white/[0.08] text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 shadow-sm"
                  title="Segarkan rekomendasi musik"
                >
                  <RotateCw
                    size={14}
                    strokeWidth={1.75}
                    className={`transition-transform duration-500 ${
                      isRefreshing ? 'rotate-180 text-white' : ''
                    }`}
                  />
                  <span>Segarkan</span>
                </button>

                {/* Filter Pills */}
                <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#141418] border border-white/[0.04]">
                  {(
                    [
                      { id: 'all', label: 'Semua' },
                      { id: 'music', label: 'Musik' },
                      { id: 'artists', label: 'Artis' },
                    ] as const
                  ).map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setHomeFilter(f.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer ${
                        homeFilter === f.id
                          ? 'bg-white text-black font-semibold shadow-sm'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* 2. Hero Spotlight Carousel Banner (Integrated Editorial Showcase) */}
            {(homeFilter === 'all' || homeFilter === 'music') && spotlightItems.length > 0 && (() => {
              const currentSpotlight = spotlightItems[activeHeroIndex % spotlightItems.length];
              const heroTrack = currentSpotlight.track;

              // Intelligent editorial title sanitization (e.g. avoid raw placeholder "RADIO")
              const rawTitle = (heroTrack.title || '').trim();
              const isGenericTitle =
                rawTitle.toUpperCase() === 'RADIO' ||
                rawTitle.toUpperCase() === 'MIX' ||
                rawTitle.toUpperCase() === 'TRACK' ||
                rawTitle.length <= 2;
              const displayTitle = isGenericTitle
                ? (heroTrack.album ? `Radio — ${heroTrack.album}` : `Stasiun Radio ${heroTrack.artist}`)
                : rawTitle;

              // Companion songs to populate the right-side "Di Stasiun Ini" column
              const companionPool =
                personalizedData?.discoveryTracks && personalizedData.discoveryTracks.length > 1
                  ? personalizedData.discoveryTracks.map(convertItemToTrack)
                  : dynamicTrendingSongs.length > 0
                  ? dynamicTrendingSongs
                  : REAL_POPULAR_SONGS;
              const companionTracks = companionPool
                .filter((t) => t.id !== heroTrack.id)
                .slice(0, 3);

              return (
                <div className="relative overflow-hidden rounded-[22px] bg-[#131317] border border-white/[0.06] p-6 lg:p-7 shadow-[0_12px_40px_rgba(0,0,0,0.45)] select-none group transition-all duration-300">
                  {/* Dynamic Cover Ambient Glow */}
                  {heroTrack.thumbnailUrl && (
                    <div
                      className="absolute -right-16 -bottom-16 w-96 h-96 bg-cover bg-center opacity-20 filter blur-3xl scale-125 pointer-events-none transition-all duration-700"
                      style={{ backgroundImage: `url(${heroTrack.thumbnailUrl})` }}
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-r from-[#121216]/95 via-[#131318]/90 to-[#101014]/95 pointer-events-none" />

                  {/* Main Container: 2-Column Responsive Split */}
                  <div className="relative z-10 flex flex-col lg:flex-row items-stretch justify-between gap-6 lg:gap-8">
                    {/* Left Section: Featured Spotlight with Artwork + Editorial Info (Close Proximity) */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1 min-w-0">
                      {/* Cover Art with deep drop shadow, subtle border & hover play */}
                      <div className="relative w-44 h-44 sm:w-48 sm:h-48 lg:w-52 lg:h-52 rounded-[18px] overflow-hidden flex-shrink-0 bg-[#1A1A22] shadow-[0_16px_36px_rgba(0,0,0,0.6)] border border-white/[0.08] group/art">
                        {heroTrack.thumbnailUrl ? (
                          <img
                            src={heroTrack.thumbnailUrl}
                            alt={displayTitle}
                            className="w-full h-full object-cover group-hover/art:scale-105 transition-transform duration-500 ease-out"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-500">
                            <Music size={44} strokeWidth={1.5} />
                          </div>
                        )}
                        {/* Play Overlay */}
                        <div
                          onClick={() => onPlayTrack(heroTrack)}
                          className="absolute inset-0 bg-black/40 opacity-0 group-hover/art:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                        >
                          <div className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-xl transform scale-90 group-hover/art:scale-100 transition-transform">
                            <Play size={20} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>
                      </div>

                      {/* Metadata & Actions (Direct proximity to artwork) */}
                      <div className="flex flex-col justify-between flex-1 min-w-0 py-1 space-y-3">
                        <div>
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="text-[10px] font-bold tracking-wider uppercase px-2.5 py-0.5 rounded-full bg-white/[0.08] text-zinc-200 border border-white/[0.08] w-fit">
                              {currentSpotlight.badge}
                            </span>
                            <span className="text-xs text-zinc-400 font-medium truncate max-w-xs">
                              {currentSpotlight.genre}
                            </span>
                          </div>

                          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight line-clamp-2">
                            {displayTitle}
                          </h2>
                          <p className="text-sm sm:text-base font-semibold text-zinc-300 mt-1 truncate">
                            {heroTrack.artist}
                          </p>
                          <p className="text-xs sm:text-sm text-zinc-400 font-normal line-clamp-2 mt-1.5 leading-relaxed max-w-lg">
                            {currentSpotlight.tagline}
                          </p>
                        </div>

                        {/* Action Buttons Row */}
                        <div className="flex items-center gap-2.5 pt-2 flex-wrap">
                          <button
                            onClick={() => onPlayTrack(heroTrack)}
                            className="px-5 h-10 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                            title={`Putar ${displayTitle}`}
                          >
                            <Play size={15} fill="currentColor" className="ml-0.5" />
                            <span>Putar Sekarang</span>
                          </button>

                          <button
                            onClick={() => onAddTracksToQueue([heroTrack])}
                            className="px-4 h-10 rounded-full bg-white/[0.06] hover:bg-white/[0.1] text-zinc-200 hover:text-white text-xs font-medium flex items-center gap-2 border border-white/[0.08] transition-colors cursor-pointer active:scale-95"
                            title="Tambahkan ke antrean putar"
                          >
                            <ListPlus size={15} strokeWidth={1.75} />
                            <span>+ Antrean</span>
                          </button>

                          {onStartDownload && (
                            <button
                              onClick={() => onStartDownload(heroTrack)}
                              className="w-10 h-10 rounded-full bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors cursor-pointer active:scale-95"
                              title="Unduh lagu ini"
                            >
                              <Download size={15} strokeWidth={1.75} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section: "Di Stasiun Ini" Mini Queue (Desktop lg+) */}
                    <div className="hidden lg:flex flex-col justify-between w-72 xl:w-84 pl-6 border-l border-white/[0.06] flex-shrink-0">
                      <div>
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/[0.04]">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                              Di Stasiun Ini
                            </span>
                          </div>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            Rekomendasi Terkait
                          </span>
                        </div>

                        <div className="space-y-1.5">
                          {companionTracks.map((ct, cIdx) => (
                            <div
                              key={`comp-${ct.id}-${cIdx}`}
                              onClick={() => onPlayTrack(ct)}
                              className="group/item flex items-center gap-3 p-2 rounded-[10px] hover:bg-white/[0.06] cursor-pointer transition-colors"
                            >
                              <div className="relative w-9 h-9 rounded-[6px] overflow-hidden bg-[#1E1E26] flex-shrink-0 border border-white/[0.06]">
                                {ct.thumbnailUrl ? (
                                  <img src={ct.thumbnailUrl} alt={ct.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-zinc-400">
                                    <Music size={14} />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/item:opacity-100 transition-opacity flex items-center justify-center">
                                  <Play size={12} fill="white" className="text-white ml-0.5" />
                                </div>
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-white truncate group-hover/item:text-zinc-200">
                                  {ct.title}
                                </p>
                                <p className="text-[11px] text-zinc-400 truncate">
                                  {ct.artist}
                                </p>
                              </div>

                              <span className="text-[11px] font-mono text-zinc-500 flex-shrink-0 group-hover/item:text-zinc-300">
                                {formatDuration(ct.duration)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Integrated Slide Navigation & Indicators */}
                      <div className="flex items-center justify-between pt-3 mt-1 border-t border-white/[0.04]">
                        <div className="flex items-center gap-1.5">
                          {spotlightItems.map((_, idx) => (
                            <button
                              key={idx}
                              onClick={() => setActiveHeroIndex(idx)}
                              className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                                idx === activeHeroIndex % spotlightItems.length
                                  ? 'w-5 bg-white'
                                  : 'w-1.5 bg-white/25 hover:bg-white/50'
                              }`}
                              title={`Slide ${idx + 1}`}
                            />
                          ))}
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() =>
                              setActiveHeroIndex(
                                (prev) => (prev - 1 + spotlightItems.length) % spotlightItems.length
                              )
                            }
                            className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors cursor-pointer"
                            title="Sebelumnya"
                          >
                            <ChevronLeft size={14} strokeWidth={2} />
                          </button>
                          <button
                            onClick={() =>
                              setActiveHeroIndex((prev) => (prev + 1) % spotlightItems.length)
                            }
                            className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors cursor-pointer"
                            title="Berikutnya"
                          >
                            <ChevronRight size={14} strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Mobile / Tablet Slide Controls (hidden on lg+) */}
                  <div className="flex lg:hidden items-center justify-between pt-4 mt-3 border-t border-white/[0.04] relative z-10">
                    <div className="flex items-center gap-1.5">
                      {spotlightItems.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setActiveHeroIndex(idx)}
                          className={`h-1.5 rounded-full transition-all duration-200 cursor-pointer ${
                            idx === activeHeroIndex % spotlightItems.length
                              ? 'w-5 bg-white'
                              : 'w-1.5 bg-white/25 hover:bg-white/50'
                          }`}
                          title={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() =>
                          setActiveHeroIndex(
                            (prev) => (prev - 1 + spotlightItems.length) % spotlightItems.length
                          )
                        }
                        className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors cursor-pointer"
                        title="Sebelumnya"
                      >
                        <ChevronLeft size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() =>
                          setActiveHeroIndex((prev) => (prev + 1) % spotlightItems.length)
                        }
                        className="w-7 h-7 rounded-full bg-white/[0.04] hover:bg-white/[0.1] text-zinc-300 hover:text-white flex items-center justify-center border border-white/[0.06] transition-colors cursor-pointer"
                        title="Berikutnya"
                      >
                        <ChevronRight size={14} strokeWidth={2} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* 3. Baru Saja Diputar / Heavy Rotation */}
            {(homeFilter === 'all' || homeFilter === 'music') && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-white tracking-tight">
                      Baru Saja Diputar
                    </h2>
                    <p className="text-xs text-zinc-400 font-normal mt-0.5">
                      Kembali ke musik yang baru dan sering kamu dengarkan
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      if (onViewChange) onViewChange('library');
                    }}
                    className="text-[13px] text-zinc-400 hover:text-white font-medium transition-colors cursor-pointer"
                  >
                    Lihat semua
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                  {(() => {
                    const fallbackSource = dynamicTrendingSongs.length > 0 ? dynamicTrendingSongs : REAL_POPULAR_SONGS;
                    const recentList = (listeningHistory && listeningHistory.length > 0
                      ? listeningHistory
                      : libraryTracks && libraryTracks.length > 0
                      ? libraryTracks
                      : fallbackSource
                    ).slice(0, 6);

                    return recentList.map((item) => (
                      <div
                        key={`heavy-${item.id}`}
                        onClick={() => onPlayTrack(item)}
                        className="group p-3.5 rounded-[16px] bg-[#141418] hover:bg-[#1A1A20] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200 cursor-pointer select-none flex flex-col shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] active:scale-[0.98]"
                      >
                        <div className="relative aspect-square w-full rounded-[10px] overflow-hidden bg-[#1D1D24] mb-3 shadow-md border border-white/[0.06]">
                          {item.thumbnailUrl ? (
                            <img
                              src={item.thumbnailUrl}
                              alt={item.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-400">
                              <Music size={32} strokeWidth={1.5} />
                            </div>
                          )}
                          <div className="absolute bottom-2.5 right-2.5 w-10 h-10 rounded-full bg-white text-black flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 shadow-xl hover:scale-105 active:scale-95">
                            <Play size={16} fill="currentColor" className="ml-0.5" />
                          </div>
                        </div>
                        <div className="pt-0.5">
                          <h4 className="text-[13px] font-semibold text-white tracking-tight truncate group-hover:text-zinc-200 transition-colors">
                            {item.title}
                          </h4>
                          <div className="flex items-center justify-between text-[12px] text-zinc-400 font-normal truncate mt-0.5">
                            <span className="truncate flex-1">{item.artist}</span>
                            {item.playedAt && (
                              <span className="text-[10px] text-zinc-500 font-mono ml-1 flex-shrink-0">
                                {formatRelativeTime(item.playedAt)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

            {/* 4. Mix Penemuan: Karena Kamu Mendengarkan [Seed] */}
            {(homeFilter === 'all' || homeFilter === 'music') && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white tracking-tight">
                    {personalizedData?.seedArtist
                      ? `Mix Penemuan: Karena Kamu Mendengarkan ${personalizedData.seedArtist}`
                      : 'Lagu Terpopuler Hari Ini'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-normal mt-0.5">
                    {personalizedData?.vibeTitle
                      ? `${personalizedData.vibeTitle} • Eksplorasi musik berirama serupa tanpa repetisi artis`
                      : 'Tangga lagu dan track yang paling banyak didengarkan hari ini'}
                  </p>
                </div>

                {(() => {
                  const fallbackList = dynamicTrendingSongs.length > 0 ? dynamicTrendingSongs : REAL_POPULAR_SONGS;
                  const discoveryPool =
                    personalizedData?.discoveryTracks && personalizedData.discoveryTracks.length > 0
                      ? personalizedData.discoveryTracks.map(convertItemToTrack)
                      : fallbackList;
                  const topList = discoveryPool.slice(0, 10);
                  const col1 = topList.slice(0, 5);
                  const col2 = topList.slice(5, 10);

                  const renderSongRow = (track: Track, rankIndex: number) => (
                    <div
                      key={`top-${track.id}-${rankIndex}`}
                      onClick={() => onPlayTrack(track)}
                      className="h-14 px-3.5 rounded-[12px] bg-[#141418] hover:bg-[#1A1A20] border border-white/[0.03] hover:border-white/[0.06] flex items-center gap-3.5 group transition-all duration-200 cursor-pointer select-none shadow-sm"
                    >
                      {/* Rank / Play Indicator */}
                      <div className="w-5 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-medium text-zinc-500 group-hover:hidden">
                          {rankIndex + 1}
                        </span>
                        <div className="w-6 h-6 rounded-full bg-white text-black hidden group-hover:flex items-center justify-center shadow-md">
                          <Play size={11} fill="currentColor" className="ml-0.5" />
                        </div>
                      </div>

                      {/* Cover Artwork */}
                      <div className="w-10 h-10 rounded-[6px] overflow-hidden bg-[#1D1D24] border border-white/[0.06] flex-shrink-0">
                        {track.thumbnailUrl ? (
                          <img
                            src={track.thumbnailUrl}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-zinc-400">
                            <Music size={16} strokeWidth={1.5} />
                          </div>
                        )}
                      </div>

                      {/* Song Title & Artist */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-[13px] font-semibold text-white group-hover:text-zinc-200 transition-colors truncate">
                          {track.title}
                        </h4>
                        <p className="text-[12px] text-zinc-400 font-normal truncate mt-0.5">
                          {track.artist}
                        </p>
                      </div>

                      {/* Duration */}
                      <span className="text-[12px] font-mono text-zinc-500 flex-shrink-0 group-hover:hidden">
                        {formatDuration(track.duration)}
                      </span>

                      {/* Hover Action Buttons */}
                      <div className="hidden group-hover:flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onAddTracksToQueue([track]);
                          }}
                          className="w-7 h-7 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                          title="Tambah ke Antrean"
                        >
                          <ListPlus size={14} strokeWidth={1.75} />
                        </button>

                        {onStartDownload && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onStartDownload(track);
                            }}
                            className="w-7 h-7 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                            title="Unduh Lagu"
                          >
                            <Download size={14} strokeWidth={1.75} />
                          </button>
                        )}

                        {onOpenAddToPlaylistModal && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenAddToPlaylistModal([track]);
                            }}
                            className="w-7 h-7 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white flex items-center justify-center transition-colors"
                            title="Tambah ke Playlist"
                          >
                            <Plus size={14} strokeWidth={1.75} />
                          </button>
                        )}
                      </div>
                    </div>
                  );

                  return (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        {col1.map((t, idx) => renderSongRow(t, idx))}
                      </div>
                      <div className="space-y-2">
                        {col2.map((t, idx) => renderSongRow(t, idx + 5))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* 5. Stasiun Mood & Vibe Pilihan (Adaptive Vibe Stations) */}
            {(homeFilter === 'all' || homeFilter === 'music') && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white tracking-tight">
                    Stasiun Mood & Vibe Pilihan
                  </h2>
                  <p className="text-xs text-zinc-400 font-normal mt-0.5">
                    Pilih suasana musik yang beresonansi dengan seleramu untuk eksplorasi instan
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3.5">
                  {(
                    personalizedData?.moodStations && personalizedData.moodStations.length > 0
                      ? personalizedData.moodStations
                      : [
                          { title: 'Acid Jazz & Funk', query: 'Acid Jazz Funk Groove', color: 'from-amber-600/30 to-rose-900/30' },
                          { title: 'J-Fusion & City Pop', query: 'Japanese Jazz Fusion City Pop', color: 'from-cyan-600/30 to-blue-900/30' },
                          { title: 'Anime & Gaming Grooves', query: 'Anime VGM Groovy Soundtracks', color: 'from-purple-600/30 to-indigo-900/30' },
                          { title: 'Lofi & Instrumental Chill', query: 'Lofi Chill Beats Gaming', color: 'from-emerald-600/30 to-teal-900/30' },
                        ]
                  ).map((cat) => (
                    <div
                      key={cat.title}
                      onClick={() => handleSearch(cat.query, true)}
                      className={`h-24 p-4 rounded-[14px] bg-gradient-to-br ${cat.color} bg-[#141418] hover:bg-[#1A1A20] border border-white/[0.06] hover:border-white/[0.12] flex flex-col justify-between cursor-pointer select-none group transition-all duration-200 shadow-md hover:scale-[1.02] active:scale-[0.98]`}
                    >
                      <span className="text-sm font-bold text-white tracking-tight block drop-shadow-sm">
                        {cat.title}
                      </span>
                      <span className="text-[11px] font-mono text-zinc-300 group-hover:text-white transition-colors flex items-center justify-between">
                        <span>Putar Stasiun</span>
                        <span>→</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 6. Artis Serupa Pilihan (Juxtopposed Related Artists Showcase) */}
            {(homeFilter === 'all' || homeFilter === 'artists') && (
              <div className="space-y-4">
                <div>
                  <h2 className="text-lg font-semibold text-white tracking-tight">
                    {personalizedData?.seedArtist
                      ? `Artis Serupa Pilihan (${personalizedData.seedArtist})`
                      : 'Artis Populer Pilihan'}
                  </h2>
                  <p className="text-xs text-zinc-400 font-normal mt-0.5">
                    Musisi dan kreator se-ekosistem musik untuk memperluas referensimu
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
                  {popularArtistsList.map((art) => (
                    <div
                      key={art.id}
                      onClick={() => handleOpenArtist(art)}
                      className="group p-4 rounded-[16px] bg-[#141418] hover:bg-[#1A1A20] border border-white/[0.04] hover:border-white/[0.08] transition-all duration-200 cursor-pointer select-none flex flex-col items-center text-center shadow-[0_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.5)] active:scale-[0.98]"
                    >
                      <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden bg-[#1D1D24] mb-3 border border-white/[0.08] shadow-lg group-hover:scale-105 transition-transform duration-200 flex-shrink-0 relative flex items-center justify-center">
                        <span className="text-xl font-bold text-zinc-400 select-none">
                          {(art.name || 'A').charAt(0).toUpperCase()}
                        </span>
                        {art.thumbnailUrl && (
                          <img
                            src={art.thumbnailUrl}
                            alt={art.name}
                            className="absolute inset-0 w-full h-full object-cover"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                          />
                        )}
                      </div>
                      <h4 className="text-[13px] font-semibold text-white group-hover:text-zinc-200 truncate w-full">
                        {art.name}
                      </h4>
                      <p className="text-[11px] text-zinc-400 font-normal truncate w-full mt-0.5">
                        {art.subscribers}
                      </p>
                      <span className="mt-2 px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-[10px] font-medium text-zinc-400 uppercase tracking-wider">
                        {personalizedData?.seedArtist ? 'Artis Terkait' : 'Artis'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
