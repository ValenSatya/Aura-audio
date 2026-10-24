import { Track } from '../types/music';
import { MobilePlaylistStorage } from './mobilePlaylistStorage';

const DEFAULT_CLOUD_URL = 'https://auraaudio-backend.onrender.com';
const SERVER_URL_KEY = 'aura_custom_server_url';

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem(SERVER_URL_KEY);
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/$/, '');
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:4000';
    }
    return DEFAULT_CLOUD_URL;
  }
  return 'http://localhost:4000';
}

const API_BASE_URL = getApiBaseUrl();

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
  albums: { id: string; title: string; artist: string; year?: string; thumbnailUrl: string }[];
  singles: { id: string; title: string; artist: string; year?: string; thumbnailUrl: string }[];
  videos: VideoItem[];
  relatedArtists: { id: string; name: string; subscribers?: string; thumbnailUrl: string }[];
}

export interface HomeFeedData {
  newReleases: Track[];
  latestAlbums: { id: string; title: string; artist: string; year?: string; thumbnailUrl: string }[];
  musicVideos: VideoItem[];
  topArtists?: { id: string; name: string; subscribers?: string; thumbnailUrl: string }[];
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
}

export class ApiClient {
  private static tokenKey = 'aura_auth_token';
  private static userKey = 'aura_auth_user';

  public static getBaseUrl(): string {
    return getApiBaseUrl();
  }

  public static setCustomServerUrl(url: string): void {
    if (typeof window !== 'undefined') {
      if (!url || !url.trim()) {
        localStorage.removeItem(SERVER_URL_KEY);
      } else {
        localStorage.setItem(SERVER_URL_KEY, url.trim().replace(/\/$/, ''));
      }
    }
  }

  public static getCustomServerUrl(): string {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(SERVER_URL_KEY) || '';
  }

  public static getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.tokenKey);
  }

  public static setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.tokenKey, token);
    }
  }

  public static isAuthenticated(): boolean {
    return !!this.getToken();
  }

  public static getUser(): UserProfile | null {
    if (typeof window === 'undefined') return null;
    const token = this.getToken();
    if (!token) {
      // If there's no valid token, ensure guest state
      localStorage.removeItem(this.userKey);
      localStorage.removeItem('aura_profile_name');
      localStorage.removeItem('aura_profile_email');
      return null;
    }
    const raw = localStorage.getItem(this.userKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public static setUser(user: UserProfile): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.userKey, JSON.stringify(user));
      localStorage.setItem('aura_profile_name', user.name);
      localStorage.setItem('aura_profile_email', user.email);
    }
  }

  public static logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(this.tokenKey);
      localStorage.removeItem(this.userKey);
      localStorage.removeItem('aura_profile_name');
      localStorage.removeItem('aura_profile_email');
    }
  }

  private static getHeaders(): HeadersInit {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  // Health check
  public static async isServerAvailable(): Promise<boolean> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/health`, {
        signal: AbortSignal.timeout(1500),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Auth
  public static async login(email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Login gagal.');
    }

    const data = await res.json();
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  public static async register(name: string, email: string, password: string): Promise<{ token: string; user: UserProfile }> {
    const res = await fetch(`${getApiBaseUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Pendaftaran gagal.');
    }

    const data = await res.json();
    this.setToken(data.token);
    this.setUser(data.user);
    return data;
  }

  // Cloud Sync
  public static async syncAll(): Promise<{ playlists: any[]; favorites: Track[]; history: Track[] } | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sync/all`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(4000),
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.playlists) && data.playlists.length > 0) {
          MobilePlaylistStorage.mergeCloudPlaylists(data.playlists);
        } else {
          // If cloud has no playlists, push local playlists to cloud!
          const current = MobilePlaylistStorage.getPlaylists();
          if (current.length > 0) {
            this.syncPlaylists(current).catch(() => {});
          }
        }
        return data;
      }
    } catch (e) {
      console.warn('[ApiClient] syncAll failed (offline mode):', e);
    }
    return null;
  }

  public static async syncPlaylists(playlists: any[]): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sync/playlists`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ playlists }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async addFavorite(track: Track): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sync/favorites`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ track }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async removeFavorite(trackId: string): Promise<boolean> {
    const token = this.getToken();
    if (!token) return false;

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/sync/favorites/${trackId}`, {
        method: 'DELETE',
        headers: this.getHeaders(),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  public static async recordHistory(track: Track): Promise<void> {
    const token = this.getToken();
    if (!token) return;

    try {
      await fetch(`${getApiBaseUrl()}/api/sync/history`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({ track }),
      });
    } catch {}
  }

  // Live YouTube Music Search via Backend
  public static async searchMusic(query: string): Promise<Track[]> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/search?q=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(6000),
      });
      if (!res.ok) throw new Error('Search failed');
      return await res.json();
    } catch (e) {
      console.warn('[ApiClient] searchMusic error:', e);
      return [];
    }
  }

  // Unified Search: Songs, Real Albums, Artists from YouTube Music
  public static async searchAll(query: string): Promise<{
    songs: Track[];
    albums: { id: string; title: string; artist: string; year?: string; thumbnailUrl: string }[];
    artists: { id: string; name: string; subscribers?: string; thumbnailUrl: string }[];
  }> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/search/all?q=${encodeURIComponent(query)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error('Search all failed');
      return await res.json();
    } catch (e) {
      console.warn('[ApiClient] searchAll error:', e);
      return { songs: [], albums: [], artists: [] };
    }
  }

  // Fetch Real Album Details & Tracklist from YouTube Music
  public static async getAlbumDetail(browseId: string): Promise<{
    id: string;
    title: string;
    artist: string;
    year?: string;
    description?: string;
    coverUrl: string;
    trackCount: number;
    tracks: Track[];
  } | null> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/search/album/${encodeURIComponent(browseId)}`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error('Get album failed');
      return await res.json();
    } catch (e) {
      console.warn(`[ApiClient] getAlbumDetail error for ${browseId}:`, e);
      return null;
    }
  }

  // Fetch Real Artist Detail
  public static async getArtistDetail(artistIdOrName: string): Promise<ArtistDetail | null> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/search/artist/${encodeURIComponent(artistIdOrName)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error('Get artist failed');
      return await res.json();
    } catch (e) {
      console.warn(`[ApiClient] getArtistDetail error for ${artistIdOrName}:`, e);
      return null;
    }
  }

  // Fetch Real Dynamic Home Feed (Popular releases, Studio Albums, Music Videos)
  public static async getHomeFeed(): Promise<HomeFeedData> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/search/home-feed`, {
        signal: AbortSignal.timeout(12000),
      });
      if (!res.ok) throw new Error('Get home feed failed');
      return await res.json();
    } catch (e) {
      console.warn('[ApiClient] getHomeFeed error:', e);
      return { newReleases: [], latestAlbums: [], musicVideos: [] };
    }
  }

  // Fetch Real Music Videos
  public static async getMusicVideos(): Promise<VideoItem[]> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/search/videos`, {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) throw new Error('Get videos failed');
      return await res.json();
    } catch (e) {
      console.warn('[ApiClient] getMusicVideos error:', e);
      return [];
    }
  }

  // Pre-resolve stream on backend to warm up server cache
  public static async resolveAudioStream(videoId: string): Promise<boolean> {
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/stream/resolve/${videoId}`, {
        signal: AbortSignal.timeout(6000),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // Pre-warm multiple upcoming tracks in background (0ms server latency on skip)
  public static async prewarmStreams(videoIds: string[]): Promise<void> {
    if (!videoIds || videoIds.length === 0) return;
    try {
      await fetch(`${getApiBaseUrl()}/api/stream/prewarm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoIds }),
      });
    } catch {}
  }

  // Streaming Proxy URL
  public static getAudioStreamProxyUrl(videoId: string): string {
    return `${getApiBaseUrl()}/api/stream/proxy/${videoId}`;
  }
}
