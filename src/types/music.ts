export type SourceType = 'local' | 'youtube' | 'stream' | 'csv' | 'm3u' | 'spotify';

export type DownloadStatus = 'idle' | 'downloading' | 'completed' | 'failed';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  sourceType: SourceType;
  url: string; // file path, http stream url, youtube url, or spotify uri
  thumbnailUrl?: string;
  isOffline?: boolean;
  localPath?: string; // if downloaded or local file
  downloadStatus?: DownloadStatus;
  downloadProgress?: number; // 0 - 100
  originalSource?: string; // original source description
  preferStudioAudio?: boolean; // if true, resolver prefers clean studio/topic audio over MV
  dateAdded: number;
  spotifyId?: string;
  isrc?: string;
  resolvedYtUrl?: string;
  playedAt?: number;
}

export interface SpotifyProfile {
  isLoggedIn: boolean;
  name?: string;
  email?: string;
  avatarUrl?: string;
  id?: string;
}

export interface SpotifyPlaylistSummary {
  id: string;
  name: string;
  description?: string;
  trackCount: number;
  coverUrl: string;
  url: string;
  owner?: string;
}

export interface SpotifyImportResult {
  type: 'playlist' | 'album' | 'track';
  title: string;
  subtitle?: string;
  coverUrl?: string;
  totalTracks: number;
  tracks: Track[];
}

export interface UserProfile {
  id?: string;
  isLoggedIn: boolean;
  name?: string;
  username?: string;
  email?: string;
  avatarUrl?: string;
  createdAt?: number;
  loginDate?: number;
}


export interface UserPlaylist {
  id: string;
  title: string;
  trackCount: number;
  thumbnailUrl: string;
  url: string;
}

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  trackIds: string[];
  tracks?: Track[];
  createdAt: number;
  updatedAt: number;
}

export interface YTMusicTrackItem {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
  url: string;
}

export interface YTMusicArtistItem {
  id: string;
  name: string;
  subscribers?: string;
  thumbnailUrl: string;
  browseId?: string;
}

export interface YTMusicArtistProfile {
  id: string;
  name: string;
  subscribers?: string;
  bannerUrl?: string;
  description?: string;
  topSongs: YTMusicTrackItem[];
  albums: YTMusicAlbumItem[];
  singles: YTMusicAlbumItem[];
}


export interface YTMusicAlbumItem {
  id: string;
  title: string;
  artist: string;
  year?: string;
  type: string; // 'ALBUM' | 'SINGLE' | 'EP'
  thumbnailUrl: string;
  browseId?: string;
}

export interface YTMusicTopResult {
  title: string;
  artist: string;
  type: string; // 'Lagu' | 'Artis' | 'Album'
  thumbnailUrl: string;
  videoId?: string;
  browseId?: string;
  url?: string;
}

export interface YTMusicSearchCategorized {
  topResult: YTMusicTopResult | null;
  songs: YTMusicTrackItem[];
  artists: YTMusicArtistItem[];
  albums: YTMusicAlbumItem[];
}

export interface YTMusicPersonalizedDiscovery {
  vibeTitle: string;
  seedArtist: string;
  seedTitle?: string;
  spotlightTrack: YTMusicTrackItem | null;
  discoveryTracks: YTMusicTrackItem[];
  relatedArtists: YTMusicArtistItem[];
  moodStations: { title: string; query: string; color: string }[];
}

export interface EQBandConfig {
  frequency: number;
  gain: number; // -12dB to +12dB
  type: BiquadFilterType;
  label: string;
  description: string;
}

export interface EQPreset {
  id: string;
  name: string;
  gains: number[]; // 8 gains matching the 8 bands
}

export type RepeatMode = 'off' | 'all' | 'one';

export type PlaylistFilter = 'all' | 'offline' | 'local' | 'youtube' | 'stream' | 'yt_liked' | 'yt_playlists' | 'yt_search';

export interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
}

export interface BatchDownloadProgress {
  active: boolean;
  total: number;
  completed: number;
  failed: number;
  currentTitle?: string;
  overallPercent: number;
}

export interface CrossfadeSettings {
  enabled: boolean;
  duration: number; // in seconds (0 - 12)
}

export interface AppSettings {
  dynamicLighting: {
    enabled: boolean;
    intensity: 'subtle' | 'medium' | 'vibrant';
  };
  audio: {
    preferStudioAudio: boolean;
    crossfadeDuration: number;
    crossfadeEnabled: boolean;
  };
  storage: {
    autoBackupPlaylists: boolean;
  };
}

