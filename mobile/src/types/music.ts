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
  isDownloaded?: boolean;
  localPath?: string;
  downloadStatus?: DownloadStatus;
  downloadProgress?: number; // 0 - 100
  originalSource?: string;
  preferStudioAudio?: boolean;
  dateAdded: number;
  spotifyId?: string;
  isrc?: string;
  resolvedYtUrl?: string;
}

export interface UserProfile {
  id?: string;
  isLoggedIn: boolean;
  name?: string;
  username?: string;
  avatarUrl?: string;
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

export interface YTMusicAlbumItem {
  id: string;
  title: string;
  artist: string;
  year?: string;
  type?: string;
  thumbnailUrl: string;
  browseId?: string;
}

export interface RealAlbumDetail {
  id: string;
  title: string;
  artist: string;
  year?: string;
  description?: string;
  coverUrl: string;
  trackCount: number;
  tracks: Track[];
}

export interface YTMusicTopResult {
  title: string;
  artist: string;
  type: string;
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

export interface EQBandConfig {
  frequency: number;
  gain: number;
  type: BiquadFilterType;
  label: string;
  description: string;
}

export interface EQPreset {
  id: string;
  name: string;
  gains: number[];
}

export type RepeatMode = 'off' | 'all' | 'one';

export type MobileTab = 'home' | 'search' | 'library' | 'profile' | 'browse' | 'radio';

export interface StorageStats {
  trackCount: number;
  totalBytes: number;
  formattedSize: string;
  isPersistent: boolean;
}

export interface CrossfadeSettings {
  enabled: boolean;
  duration: number;
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
}
