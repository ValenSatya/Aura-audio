export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number;
  url: string;
  thumbnailUrl?: string;
  sourceType?: 'youtube' | 'local' | 'stream';
  dateAdded?: number;
}

export interface AlbumItem {
  id: string;
  title: string;
  artist: string;
  year?: string;
  thumbnailUrl: string;
}

export interface ArtistItem {
  id: string;
  name: string;
  subscribers?: string;
  thumbnailUrl: string;
}

export interface AlbumDetail {
  id: string;
  title: string;
  artist: string;
  year?: string;
  description?: string;
  coverUrl: string;
  trackCount: number;
  tracks: Track[];
}

export interface VideoItem {
  id: string;
  title: string;
  artist: string;
  year?: string;
  thumbnailUrl: string;
  duration?: number;
}

export interface ArtistDetail {
  id: string;
  name: string;
  description?: string;
  subscribers?: string;
  bannerUrl?: string;
  topSongs: Track[];
  albums: AlbumItem[];
  singles: AlbumItem[];
  videos: VideoItem[];
  relatedArtists: ArtistItem[];
}

export interface HomeFeedData {
  newReleases: Track[];
  latestAlbums: AlbumItem[];
  musicVideos: VideoItem[];
  topArtists?: ArtistItem[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: UserProfile;
}

export interface SyncData {
  playlists: any[];
  favorites: Track[];
  history: Track[];
}
