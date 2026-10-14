import { SpotifyAuthManager } from './spotifyAuthManager';

export interface SpotifyTrackData {
  id: string;
  title: string;
  artist: string;
  album?: string;
  duration: number; // in seconds
  thumbnailUrl: string;
  spotifyUri: string;
  url: string;
}

export interface SpotifyResolvedData {
  type: 'playlist' | 'album' | 'track';
  id: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  totalTracks: number;
  tracks: SpotifyTrackData[];
}

export class SpotifyClient {
  private authManager: SpotifyAuthManager;

  constructor(authManager: SpotifyAuthManager) {
    this.authManager = authManager;
  }

  public static parseSpotifyUrl(inputUrl: string): { type: 'playlist' | 'album' | 'track'; id: string } | null {
    if (!inputUrl) return null;
    const clean = inputUrl.trim();

    // Match web URL: https://open.spotify.com/{type}/{id}
    const webMatch = clean.match(/(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?)(playlist|album|track)\/([a-zA-Z0-9]+)/i);
    if (webMatch) {
      return {
        type: webMatch[1].toLowerCase() as any,
        id: webMatch[2],
      };
    }

    // Match URI: spotify:{type}:{id}
    const uriMatch = clean.match(/^spotify:(playlist|album|track):([a-zA-Z0-9]+)$/i);
    if (uriMatch) {
      return {
        type: uriMatch[1].toLowerCase() as any,
        id: uriMatch[2],
      };
    }

    return null;
  }

  /**
   * Fast embed metadata scraper: extracts complete metadata & tracklist without requiring Spotify developer keys
   */
  public async fetchViaEmbed(type: 'playlist' | 'album' | 'track', id: string): Promise<SpotifyResolvedData> {
    const embedUrl = `https://open.spotify.com/embed/${type}/${id}`;
    const res = await fetch(embedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengakses data Spotify (HTTP ${res.status})`);
    }

    const html = await res.text();
    const scriptMatch = html.match(/<script\s+id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
    if (!scriptMatch) {
      throw new Error('Format halaman Spotify embed tidak dikenali');
    }

    const nextData = JSON.parse(scriptMatch[1]);
    const entity = nextData.props?.pageProps?.state?.data?.entity;
    if (!entity) {
      throw new Error('Data konten Spotify tidak ditemukan');
    }

    const coverUrl =
      entity.visualIdentity?.image?.[0]?.url ||
      entity.coverArt?.sources?.[0]?.url ||
      entity.images?.[0]?.url ||
      '';

    if (type === 'track') {
      const trackId = entity.id || id;
      const artistName =
        Array.isArray(entity.artists) && entity.artists.length > 0
          ? entity.artists.map((a: any) => a.name).join(', ')
          : entity.subtitle || 'Unknown Artist';

      const durSec = Math.round((entity.duration || 180000) / 1000);

      const singleTrack: SpotifyTrackData = {
        id: trackId,
        title: entity.title || entity.name || 'Unknown Track',
        artist: artistName,
        album: entity.name || '',
        duration: durSec,
        thumbnailUrl: coverUrl,
        spotifyUri: entity.uri || `spotify:track:${trackId}`,
        url: `https://open.spotify.com/track/${trackId}`,
      };

      return {
        type: 'track',
        id: trackId,
        title: singleTrack.title,
        subtitle: singleTrack.artist,
        coverUrl,
        totalTracks: 1,
        tracks: [singleTrack],
      };
    }

    // Playlist or Album
    const title = entity.name || entity.title || (type === 'playlist' ? 'Spotify Playlist' : 'Spotify Album');
    const subtitle = entity.subtitle || entity.artists?.[0]?.name || '';
    const trackList = entity.trackList || [];

    const tracks: SpotifyTrackData[] = trackList.map((t: any, index: number) => {
      const tUri = t.uri || '';
      const tId = tUri.replace(/^spotify:track:/, '') || `sp-${index}-${Date.now()}`;
      const tArtist = t.subtitle || (Array.isArray(t.artists) ? t.artists.map((a: any) => a.name).join(', ') : subtitle);
      const durSec = Math.round((t.duration || 180000) / 1000);

      return {
        id: tId,
        title: t.title || t.name || `Track ${index + 1}`,
        artist: tArtist || 'Unknown Artist',
        album: title,
        duration: durSec,
        thumbnailUrl: coverUrl,
        spotifyUri: tUri || `spotify:track:${tId}`,
        url: `https://open.spotify.com/track/${tId}`,
      };
    });

    return {
      type,
      id,
      title,
      subtitle,
      coverUrl,
      totalTracks: tracks.length,
      tracks,
    };
  }

  /**
   * Resolves any Spotify URL or URI into standard track data
   */
  public async resolveUrl(url: string): Promise<SpotifyResolvedData> {
    const parsed = SpotifyClient.parseSpotifyUrl(url);
    if (!parsed) {
      throw new Error('URL Spotify tidak valid. Masukkan link lagu, playlist, atau album dari open.spotify.com');
    }

    return await this.fetchViaEmbed(parsed.type, parsed.id);
  }

  /**
   * Fetches user's Liked Songs from Spotify Web API using authenticated session
   */
  public async getUserLikedSongs(): Promise<SpotifyTrackData[]> {
    const token = await this.authManager.getAccessToken();
    if (!token) {
      throw new Error('Belum login ke akun Spotify');
    }

    const res = await fetch('https://api.spotify.com/v1/me/tracks?limit=50', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil Liked Songs Spotify (HTTP ${res.status})`);
    }

    const data: any = await res.json();
    const items = data.items || [];

    return items.map((item: any) => {
      const t = item.track;
      const artist = Array.isArray(t.artists) ? t.artists.map((a: any) => a.name).join(', ') : 'Unknown Artist';
      const coverUrl = t.album?.images?.[0]?.url || '';

      return {
        id: t.id,
        title: t.name,
        artist,
        album: t.album?.name,
        duration: Math.round((t.duration_ms || 180000) / 1000),
        thumbnailUrl: coverUrl,
        spotifyUri: t.uri,
        url: `https://open.spotify.com/track/${t.id}`,
      };
    });
  }

  /**
   * Fetches user's playlists from Spotify Web API
   */
  public async getUserPlaylists(): Promise<Array<{ id: string; name: string; trackCount: number; coverUrl: string; url: string }>> {
    const token = await this.authManager.getAccessToken();
    if (!token) {
      throw new Error('Belum login ke akun Spotify');
    }

    const res = await fetch('https://api.spotify.com/v1/me/playlists?limit=50', {
      headers: {
        Authorization: `Bearer ${token}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      },
    });

    if (!res.ok) {
      throw new Error(`Gagal mengambil playlist pengguna (HTTP ${res.status})`);
    }

    const data: any = await res.json();
    const items = data.items || [];

    return items.map((p: any) => ({
      id: p.id,
      name: p.name,
      trackCount: p.tracks?.total || 0,
      coverUrl: p.images?.[0]?.url || '',
      url: p.external_urls?.spotify || `https://open.spotify.com/playlist/${p.id}`,
    }));
  }
}
