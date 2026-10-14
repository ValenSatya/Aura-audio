import { spawn } from 'child_process';
import * as fs from 'fs';
import { getYtDlpPath } from './ytdlpHelper';

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
  type: string;
  thumbnailUrl: string;
  browseId?: string;
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

export interface YTUserPlaylistItem {
  id: string;
  title: string;
  trackCount: number;
  thumbnailUrl: string;
  url: string;
}

export class YTMusicClient {
  private static categorizedSearchCache = new Map<string, { timestamp: number; data: YTMusicSearchCategorized }>();
  private static artistDetailsCache = new Map<string, { timestamp: number; data: YTMusicArtistProfile }>();
  private static runYtDlpJson(args: string[]): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const ytdl = getYtDlpPath();
      const proc = spawn(ytdl, args);

      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (d) => {
        stdout += d.toString();
      });

      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('close', (code) => {
        if (code !== 0 && !stdout.trim()) {
          return reject(new Error(stderr || `yt-dlp process exited with code ${code}`));
        }

        const lines = stdout.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
        const results: any[] = [];

        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            results.push(parsed);
          } catch {}
        }

        resolve(results);
      });

      proc.on('error', (err) => reject(err));
    });
  }

  private static searchCache = new Map<string, { timestamp: number; tracks: YTMusicTrackItem[] }>();

  private static parseDuration(durStr: string): number {
    if (!durStr) return 0;
    const parts = durStr.trim().split(':').map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      return parts[0] * 60 + parts[1];
    } else if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2];
    }
    return 0;
  }

  private static isJunkVideo(title: string, channel: string): boolean {
    const blacklist =
      /\b(reaction|reacting|reacts|review|interview|vlog|behind the scenes|making of|gameplay|walkthrough|tutorial|guitar tab|bass tab|drum cover|vocal coach|sped up|nightcore|slowed|reverb|1 hour|10 hour|loop|karaoke|parody|meme|tiktok remix|audition|podcast|lawn mower|mowing|grass cutter)\b/i;
    return blacklist.test(title) || blacklist.test(channel);
  }

  private static cleanSongTitle(rawTitle: string): string {
    let t = rawTitle;
    t = t.replace(
      /\s*[\(\[](Official\s*(Music\s*)?Video|Official\s*Audio|Official\s*HD|Official\s*4K|Music\s*Video|MV|Audio|Visualizer|Lyric\s*Video|Lyrics|4K|HD|HQ|1080p|60fps|Remastered)[\)\]]/gi,
      ''
    );
    t = t.replace(/^["']|["']$/g, '');
    t = t.replace(/\s+-\s*$/, '').trim();
    return t || rawTitle;
  }

  private static cleanSongArtist(channel: string, rawTitle: string): string {
    let artist = channel || 'Unknown Artist';
    if (artist.endsWith(' - Topic')) {
      artist = artist.replace(/\s*-\s*Topic$/, '').trim();
    }
    if (artist.endsWith(' Official')) {
      artist = artist.replace(/\s*Official$/, '').trim();
    }
    if (rawTitle.includes(' - ')) {
      const parts = rawTitle.split(' - ');
      if (parts.length >= 2 && (!channel || channel.includes('Topic') || channel.includes('VEVO') || channel.includes('Records'))) {
        return parts[0].trim();
      }
    }
    return artist;
  }

  private static findRenderers(obj: any, results: any[] = []): any[] {
    if (!obj || typeof obj !== 'object') return results;
    if (obj.musicResponsiveListItemRenderer) {
      results.push(obj.musicResponsiveListItemRenderer);
    }
    for (const k of Object.keys(obj)) {
      this.findRenderers(obj[k], results);
    }
    return results;
  }

  private static async searchViaInnertube(query: string, withSongFilter: boolean): Promise<YTMusicTrackItem[]> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
      const url = 'https://music.youtube.com/youtubei/v1/search';
      const payload: any = {
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20240401.01.00',
            hl: 'en',
            gl: 'US',
          },
        },
        query,
      };

      if (withSongFilter) {
        // Song filter param for YouTube Music
        payload.params = 'EgWKAQIIAWoQEAMQBBAJEAoQBRAREBAQFQ%3D%3D';
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://music.youtube.com/',
          Origin: 'https://music.youtube.com',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Innertube HTTP ${res.status}`);
      }

      const data: any = await res.json();
      const renderers = this.findRenderers(data);
      const tracks: YTMusicTrackItem[] = [];
      const seenIds = new Set<string>();

      for (const item of renderers) {
        const videoId =
          item.playlistItemData?.videoId ||
          item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
          item.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.navigationEndpoint?.watchEndpoint?.videoId ||
          item.navigationEndpoint?.watchEndpoint?.videoId;

        if (!videoId || seenIds.has(videoId)) continue;

        const col0Runs = item.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        const rawTitle = col0Runs.map((r: any) => r.text).join('').trim();
        if (!rawTitle) continue;

        const col1Runs = item.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
        const artistRuns = col1Runs.filter((r: any) => {
          const pageType = r.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;
          return (
            pageType === 'MUSIC_PAGE_TYPE_ARTIST' ||
            pageType === 'MUSIC_PAGE_TYPE_USER_CHANNEL'
          );
        });

        let rawArtist = '';
        if (artistRuns.length > 0) {
          rawArtist = artistRuns.map((r: any) => r.text).join(', ');
        } else {
          const fullText = col1Runs.map((r: any) => r.text).join('');
          const parts = fullText.split('•');
          rawArtist = parts[0]?.trim() || 'Unknown Artist';
        }

        if (this.isJunkVideo(rawTitle, rawArtist)) continue;

        let duration = 0;
        for (let idx = col1Runs.length - 1; idx >= 0; idx--) {
          const text = col1Runs[idx]?.text?.trim();
          if (/^\d+:\d{2}(:\d{2})?$/.test(text)) {
            duration = this.parseDuration(text);
            break;
          }
        }

        // Check additional columns if duration not in col1
        if (duration === 0 && item.flexColumns && item.flexColumns.length > 2) {
          for (let c = 2; c < item.flexColumns.length; c++) {
            const runs = item.flexColumns[c]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
            for (let idx = runs.length - 1; idx >= 0; idx--) {
              const text = runs[idx]?.text?.trim();
              if (/^\d+:\d{2}(:\d{2})?$/.test(text)) {
                duration = this.parseDuration(text);
                break;
              }
            }
            if (duration > 0) break;
          }
        }

        const thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
        let thumb = '';
        if (thumbs.length > 0) {
          thumb = thumbs[thumbs.length - 1].url;
          // Upgrade thumbnail to high resolution
          thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj');
        } else {
          thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        }

        seenIds.add(videoId);
        tracks.push({
          id: videoId,
          title: this.cleanSongTitle(rawTitle),
          artist: this.cleanSongArtist(rawArtist, rawTitle),
          duration,
          thumbnailUrl: thumb,
          url: `https://www.youtube.com/watch?v=${videoId}`,
        });
      }

      return tracks;
    } catch (err) {
      clearTimeout(timeoutId);
      throw err;
    }
  }

  public static async search(query: string): Promise<YTMusicTrackItem[]> {
    const q = query.trim();
    if (!q) return [];

    const cacheKey = q.toLowerCase();
    const now = Date.now();

    const cached = this.searchCache.get(cacheKey);
    if (cached && now - cached.timestamp < 10 * 60 * 1000) {
      return cached.tracks;
    }

    const catCached = this.categorizedSearchCache.get(cacheKey);
    if (catCached && now - catCached.timestamp < 10 * 60 * 1000 && catCached.data.songs.length > 0) {
      return catCached.data.songs;
    }

    try {
      // 1. Direct lightning-fast Innertube API (< 300ms) with Songs filter
      let tracks = await this.searchViaInnertube(q, true);

      // 2. If fewer than 6 tracks, search without song filter to augment results
      if (tracks.length < 6) {
        try {
          const generalTracks = await this.searchViaInnertube(q, false);
          const existingIds = new Set(tracks.map((t) => t.id));
          for (const gt of generalTracks) {
            if (!existingIds.has(gt.id)) {
              tracks.push(gt);
              existingIds.add(gt.id);
            }
          }
        } catch {}
      }

      if (tracks.length > 0) {
        // Cache successful results
        if (this.searchCache.size > 200) {
          const firstKey = this.searchCache.keys().next().value;
          if (firstKey) this.searchCache.delete(firstKey);
        }
        this.searchCache.set(cacheKey, { timestamp: now, tracks });
        return tracks;
      }
    } catch (innertubeErr: any) {
      console.warn('Innertube search error, trying yt-dlp fallback:', innertubeErr?.message || innertubeErr);
    }

    // 3. Fallback to yt-dlp only if direct HTTP failed
    try {
      console.log('Falling back to yt-dlp search for:', q);
      const raw = await this.runYtDlpJson([
        '--flat-playlist',
        '-j',
        '--no-warnings',
        '--force-ipv4',
        '--no-cache-dir',
        `ytsearch20:${q} song`,
      ]);

      const seenIds = new Set<string>();
      const fallbackTracks: YTMusicTrackItem[] = [];

      for (const item of raw) {
        if (!item.id || seenIds.has(item.id)) continue;
        seenIds.add(item.id);

        const rawTitle = item.title || '';
        const channel = item.channel || item.uploader || '';
        if (this.isJunkVideo(rawTitle, channel)) continue;

        const dur = Math.round(item.duration || 0);
        const thumbs = item.thumbnails || [];
        const thumb =
          thumbs.length > 0
            ? thumbs[thumbs.length - 1].url
            : `https://i.ytimg.com/vi/${item.id}/hqdefault.jpg`;

        fallbackTracks.push({
          id: item.id,
          title: this.cleanSongTitle(rawTitle),
          artist: this.cleanSongArtist(channel, rawTitle),
          duration: dur,
          thumbnailUrl: thumb,
          url: item.url || item.webpage_url || `https://www.youtube.com/watch?v=${item.id}`,
        });
      }

      if (fallbackTracks.length > 0) {
        this.searchCache.set(cacheKey, { timestamp: now, tracks: fallbackTracks });
      }
      return fallbackTracks;
    } catch (e: any) {
      console.error('YTMusic search fallback error:', e);
      return [];
    }
  }

  public static async searchCategorized(query: string): Promise<YTMusicSearchCategorized> {
    const q = query.trim();
    if (!q) {
      return { topResult: null, songs: [], artists: [], albums: [] };
    }

    const cacheKey = q.toLowerCase();
    const cached = this.categorizedSearchCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < 10 * 60 * 1000) {
      return cached.data;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const url = 'https://music.youtube.com/youtubei/v1/search';
      const payload: any = {
        context: {
          client: {
            clientName: 'WEB_REMIX',
            clientVersion: '1.20240401.01.00',
            hl: 'id',
            gl: 'ID',
          },
        },
        query: q,
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
          Referer: 'https://music.youtube.com/',
          Origin: 'https://music.youtube.com',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new Error(`Innertube HTTP ${res.status}`);
      }

      const data: any = await res.json();
      const tabContent =
        data.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

      let topResult: YTMusicTopResult | null = null;
      const songs: YTMusicTrackItem[] = [];
      const artists: YTMusicArtistItem[] = [];
      const albums: YTMusicAlbumItem[] = [];
      const seenSongIds = new Set<string>();
      const seenArtistIds = new Set<string>();
      const seenAlbumIds = new Set<string>();

      // 1. Check musicCardShelfRenderer (Top Result)
      for (const s of tabContent) {
        if (s.musicCardShelfRenderer) {
          const card = s.musicCardShelfRenderer;
          const cardTitle = card.title?.runs?.map((r: any) => r.text).join('').trim() || '';
          const subtitleRuns = card.subtitle?.runs || [];
          const cardType = subtitleRuns[0]?.text?.trim() || 'Lagu';
          const cardArtist = subtitleRuns.slice(1).map((r: any) => r.text).join('').replace(/^[•\s]+/, '').trim() || '';
          const thumbs = card.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
          let cardThumb = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : '';
          if (cardThumb) cardThumb = cardThumb.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj');

          const videoId =
            card.buttons?.[0]?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
            card.onTap?.watchEndpoint?.videoId;
          const browseId =
            card.title?.runs?.[0]?.navigationEndpoint?.browseEndpoint?.browseId ||
            card.onTap?.browseEndpoint?.browseId;

          topResult = {
            title: this.cleanSongTitle(cardTitle),
            artist: this.cleanSongArtist(cardArtist, cardTitle),
            type: cardType,
            thumbnailUrl: cardThumb,
            videoId: videoId || undefined,
            browseId: browseId || undefined,
            url: videoId ? `https://www.youtube.com/watch?v=${videoId}` : undefined,
          };
          break;
        }
      }

      // 2. Extract songs, artists, albums from sections
      for (const s of tabContent) {
        const contents = s.itemSectionRenderer?.contents || s.musicShelfRenderer?.contents || [];
        for (const itemWrapper of contents) {
          const item = itemWrapper.musicResponsiveListItemRenderer;
          if (!item) continue;

          const col0Runs = item.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
          const rawTitle = col0Runs.map((r: any) => r.text).join('').trim();
          if (!rawTitle) continue;

          const col1Runs = item.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
          const fullCol1 = col1Runs.map((r: any) => r.text).join('');

          const thumbs = item.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
          let thumb = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : '';
          if (thumb) thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj');

          const videoId =
            item.playlistItemData?.videoId ||
            item.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
            item.navigationEndpoint?.watchEndpoint?.videoId;

          const browseId =
            item.navigationEndpoint?.browseEndpoint?.browseId ||
            col0Runs[0]?.navigationEndpoint?.browseEndpoint?.browseId;

          const pageType =
            item.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType ||
            col0Runs[0]?.navigationEndpoint?.browseEndpoint?.browseEndpointContextSupportedConfigs?.browseEndpointContextMusicConfig?.pageType;

          const firstToken = col1Runs[0]?.text?.trim()?.toLowerCase() || '';

          // Filter by category:
          if (
            firstToken === 'lagu' ||
            firstToken === 'song' ||
            firstToken === 'track' ||
            pageType === 'MUSIC_PAGE_TYPE_TRACK' ||
            (videoId && !browseId && firstToken !== 'video' && firstToken !== 'episode' && firstToken !== 'podcast')
          ) {
            if (this.isJunkVideo(rawTitle, fullCol1)) continue;
            if (videoId && !seenSongIds.has(videoId)) {
              seenSongIds.add(videoId);

              let duration = 0;
              for (let i = col1Runs.length - 1; i >= 0; i--) {
                const t = col1Runs[i]?.text?.trim();
                if (/^\d+:\d{2}(:\d{2})?$/.test(t)) {
                  duration = this.parseDuration(t);
                  break;
                }
              }

              const artistParts = fullCol1.split('•');
              const rawArtist = (artistParts.length > 1 ? artistParts[1] : artistParts[0]).trim();

              songs.push({
                id: videoId,
                title: this.cleanSongTitle(rawTitle),
                artist: this.cleanSongArtist(rawArtist, rawTitle),
                duration,
                thumbnailUrl: thumb || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                url: `https://www.youtube.com/watch?v=${videoId}`,
              });
            }
          } else if (
            firstToken === 'artis' ||
            firstToken === 'artist' ||
            pageType === 'MUSIC_PAGE_TYPE_ARTIST'
          ) {
            const artistId = browseId || rawTitle;
            if (!seenArtistIds.has(artistId)) {
              seenArtistIds.add(artistId);
              const subParts = fullCol1.split('•');
              const subscribers = (subParts.length > 1 ? subParts[1] : '').trim();

              artists.push({
                id: artistId,
                name: rawTitle,
                subscribers,
                thumbnailUrl: thumb,
                browseId,
              });
            }
          } else if (
            firstToken === 'album' ||
            firstToken === 'single' ||
            firstToken === 'ep' ||
            pageType === 'MUSIC_PAGE_TYPE_ALBUM'
          ) {
            const albumId = browseId || rawTitle;
            if (!seenAlbumIds.has(albumId)) {
              seenAlbumIds.add(albumId);
              const subParts = fullCol1.split('•');
              const albumArtist = (subParts.length > 1 ? subParts[1] : '').trim();
              const year = (subParts.length > 2 ? subParts[2] : '').trim();

              albums.push({
                id: albumId,
                title: rawTitle,
                artist: albumArtist,
                year,
                type: firstToken.toUpperCase(),
                thumbnailUrl: thumb,
                browseId,
              });
            }
          }
        }
      }

      // Only fallback to dedicated song search if zero songs were extracted from initial response
      if (songs.length === 0) {
        try {
          const dedicatedSongs = await this.search(q);
          for (const ds of dedicatedSongs) {
            if (!seenSongIds.has(ds.id)) {
              seenSongIds.add(ds.id);
              songs.push(ds);
            }
          }
        } catch {}
      }

      // Prime searchCache with extracted songs so TopBar or quick previews hit memory cache in 0ms
      if (songs.length > 0) {
        this.searchCache.set(cacheKey, { timestamp: now, tracks: songs });
      }

      // If topResult was null, use the #1 song or #1 artist as topResult
      if (!topResult) {
        if (songs.length > 0) {
          topResult = {
            title: songs[0].title,
            artist: songs[0].artist,
            type: 'Lagu',
            thumbnailUrl: songs[0].thumbnailUrl,
            videoId: songs[0].id,
            url: songs[0].url,
          };
        } else if (artists.length > 0) {
          topResult = {
            title: artists[0].name,
            artist: artists[0].subscribers || 'Artis',
            type: 'Artis',
            thumbnailUrl: artists[0].thumbnailUrl,
            browseId: artists[0].browseId,
          };
        }
      }

      const result: YTMusicSearchCategorized = { topResult, songs, artists, albums };

      if (this.categorizedSearchCache.size > 150) {
        const firstKey = this.categorizedSearchCache.keys().next().value;
        if (firstKey) this.categorizedSearchCache.delete(firstKey);
      }
      this.categorizedSearchCache.set(cacheKey, { timestamp: now, data: result });

      return result;
    } catch (err: any) {
      console.warn('Categorized search failed, falling back to songs search:', err?.message || err);
      const fallbackSongs = await this.search(q);
      const topResult: YTMusicTopResult | null =
        fallbackSongs.length > 0
          ? {
              title: fallbackSongs[0].title,
              artist: fallbackSongs[0].artist,
              type: 'Lagu',
              thumbnailUrl: fallbackSongs[0].thumbnailUrl,
              videoId: fallbackSongs[0].id,
              url: fallbackSongs[0].url,
            }
          : null;
      return { topResult, songs: fallbackSongs, artists: [], albums: [] };
    }
  }

  public static async getArtistDetails(browseId: string, artistName?: string): Promise<YTMusicArtistProfile> {
    const key = (browseId || artistName || '').toLowerCase().trim();
    if (!key) {
      return {
        id: '',
        name: artistName || 'Artis',
        subscribers: '',
        bannerUrl: '',
        topSongs: [],
        albums: [],
        singles: [],
      };
    }

    const cached = this.artistDetailsCache.get(key);
    const now = Date.now();
    if (cached && now - cached.timestamp < 30 * 60 * 1000) {
      return cached.data;
    }

    let name = artistName || 'Artis';
    let subscribers = '';
    let bannerUrl = '';
    let description = '';
    const topSongs: YTMusicTrackItem[] = [];
    const albums: YTMusicAlbumItem[] = [];
    const singles: YTMusicAlbumItem[] = [];
    const seenSongIds = new Set<string>();
    const seenAlbumIds = new Set<string>();

    if (browseId && (browseId.startsWith('UC') || browseId.startsWith('FEmusic_library'))) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 6000);

        const url = 'https://music.youtube.com/youtubei/v1/browse';
        const payload: any = {
          context: {
            client: {
              clientName: 'WEB_REMIX',
              clientVersion: '1.20240401.01.00',
              hl: 'id',
              gl: 'ID',
            },
          },
          browseId,
        };

        const res = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Referer: 'https://music.youtube.com/',
            Origin: 'https://music.youtube.com',
          },
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (res.ok) {
          const data: any = await res.json();
          const header = data.header?.musicImmersiveHeaderRenderer || data.header?.musicVisualHeaderRenderer;
          if (header) {
            const headerName = header.title?.runs?.map((r: any) => r.text).join('').trim();
            if (headerName) name = headerName;
            subscribers =
              header.subscriptionButton?.subscribeButtonRenderer?.subscriberCountText?.runs?.map((r: any) => r.text).join('').trim() ||
              header.subscriberCountText?.runs?.map((r: any) => r.text).join('').trim() ||
              '';
            const thumbs = header.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
            if (thumbs.length > 0) {
              bannerUrl = thumbs[thumbs.length - 1].url;
              bannerUrl = bannerUrl.replace(/=w\d+-h\d+.*$/, '=w2880-h1200-p-l90-rj');
            }
            description = header.description?.runs?.map((r: any) => r.text).join('').trim() || '';
          }

          const sections =
            data.contents?.singleColumnBrowseResultsRenderer?.tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents || [];

          for (const s of sections) {
            const shelf = s.musicShelfRenderer;
            const carousel = s.musicCarouselShelfRenderer;

            if (shelf) {
              for (const item of shelf.contents || []) {
                const r = item.musicResponsiveListItemRenderer;
                if (!r) continue;

                const col0Runs = r.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
                const rawTitle = col0Runs.map((x: any) => x.text).join('').trim();
                const videoId =
                  r.playlistItemData?.videoId ||
                  r.overlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer?.playNavigationEndpoint?.watchEndpoint?.videoId ||
                  r.navigationEndpoint?.watchEndpoint?.videoId;

                if (!videoId || !rawTitle || seenSongIds.has(videoId)) continue;
                seenSongIds.add(videoId);

                const col1Runs = r.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs || [];
                let duration = 0;
                for (let i = col1Runs.length - 1; i >= 0; i--) {
                  const t = col1Runs[i]?.text?.trim();
                  if (/^\d+:\d{2}(:\d{2})?$/.test(t)) {
                    duration = this.parseDuration(t);
                    break;
                  }
                }

                const itemThumbs = r.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                let thumb = itemThumbs.length > 0 ? itemThumbs[itemThumbs.length - 1].url : '';
                if (thumb) thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj');

                topSongs.push({
                  id: videoId,
                  title: this.cleanSongTitle(rawTitle),
                  artist: name,
                  duration,
                  thumbnailUrl: thumb || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
                  url: `https://www.youtube.com/watch?v=${videoId}`,
                });
              }
            }

            if (carousel) {
              const cTitle = carousel.header?.musicCarouselShelfBasicHeaderRenderer?.title?.runs?.map((r: any) => r.text).join('').toLowerCase() || '';
              const isSingle = cTitle.includes('single') || cTitle.includes('ep');
              const isAlbum = cTitle.includes('album');

              if (isSingle || isAlbum) {
                const target = isSingle ? singles : albums;
                for (const item of carousel.contents || []) {
                  const twoRow = item.musicTwoRowItemRenderer;
                  if (!twoRow) continue;

                  const albumTitle = twoRow.title?.runs?.map((r: any) => r.text).join('').trim() || '';
                  if (!albumTitle) continue;

                  const sub = twoRow.subtitle?.runs?.map((r: any) => r.text).join('').trim() || '';
                  const twoRowThumbs = twoRow.thumbnailRenderer?.musicThumbnailRenderer?.thumbnail?.thumbnails || [];
                  let thumb = twoRowThumbs.length > 0 ? twoRowThumbs[twoRowThumbs.length - 1].url : '';
                  if (thumb) thumb = thumb.replace(/=w\d+-h\d+.*$/, '=w544-h544-l90-rj');

                  const bId = twoRow.navigationEndpoint?.browseEndpoint?.browseId;
                  const itemKey = bId || albumTitle;
                  if (seenAlbumIds.has(itemKey)) continue;
                  seenAlbumIds.add(itemKey);

                  target.push({
                    id: itemKey,
                    title: albumTitle,
                    artist: name,
                    year: sub,
                    type: isSingle ? 'SINGLE' : 'ALBUM',
                    thumbnailUrl: thumb,
                    browseId: bId,
                  });
                }
              }
            }
          }
        }
      } catch (err: any) {
        console.warn('Innertube artist browse error:', err?.message || err);
      }
    }

    // Fallback: if topSongs is empty, fetch top songs via Innertube query
    if (topSongs.length === 0) {
      try {
        const query = `${name} songs`;
        const songs = await this.searchViaInnertube(query, true);
        for (const s of songs.slice(0, 10)) {
          if (!seenSongIds.has(s.id)) {
            seenSongIds.add(s.id);
            topSongs.push(s);
          }
        }
      } catch {}
    }

    const profile: YTMusicArtistProfile = {
      id: browseId || name,
      name,
      subscribers,
      bannerUrl,
      description,
      topSongs,
      albums,
      singles,
    };

    if (this.artistDetailsCache.size > 100) {
      const firstKey = this.artistDetailsCache.keys().next().value;
      if (firstKey) this.artistDetailsCache.delete(firstKey);
    }
    this.artistDetailsCache.set(key, { timestamp: now, data: profile });

    return profile;
  }


  public static async getLikedMusic(cookiesPath: string): Promise<YTMusicTrackItem[]> {
    if (!fs.existsSync(cookiesPath)) {
      throw new Error('Anda belum login. Silakan hubungkan akun YouTube Anda terlebih dahulu.');
    }

    try {
      // First try LM (Liked Music), fallback to LL (Liked Videos)
      let raw = await this.runYtDlpJson([
        '--cookies',
        cookiesPath,
        '--flat-playlist',
        '-j',
        'https://www.youtube.com/playlist?list=LM',
      ]);

      if (raw.length === 0) {
        raw = await this.runYtDlpJson([
          '--cookies',
          cookiesPath,
          '--flat-playlist',
          '-j',
          'https://www.youtube.com/playlist?list=LL',
        ]);
      }

      return raw.map((item) => {
        const thumbs = item.thumbnails || [];
        const thumb = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : '';
        return {
          id: item.id || `liked_${Date.now()}_${Math.random()}`,
          title: item.title || 'Untitled Track',
          artist: item.uploader || item.channel || 'YouTube Artist',
          duration: Math.round(item.duration || 0),
          thumbnailUrl: thumb,
          url: item.url || item.webpage_url || `https://www.youtube.com/watch?v=${item.id}`,
        };
      });
    } catch (e: any) {
      console.error('Failed to get Liked Music:', e);
      throw new Error(`Gagal memuat lagu favorit: ${e.message}`);
    }
  }

  public static async getUserPlaylists(cookiesPath: string): Promise<YTUserPlaylistItem[]> {
    if (!fs.existsSync(cookiesPath)) {
      throw new Error('Anda belum login. Silakan hubungkan akun YouTube Anda terlebih dahulu.');
    }

    try {
      const raw = await this.runYtDlpJson([
        '--cookies',
        cookiesPath,
        '--flat-playlist',
        '-j',
        'https://www.youtube.com/feed/playlists',
      ]);

      return raw.map((item) => {
        const thumbs = item.thumbnails || [];
        const thumb = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : '';
        return {
          id: item.id || `pl_${Date.now()}`,
          title: item.title || item.playlist_title || 'Untitled Playlist',
          trackCount: item.playlist_count || item.n_entries || 0,
          thumbnailUrl: thumb,
          url: item.url || item.webpage_url || `https://www.youtube.com/playlist?list=${item.id}`,
        };
      });
    } catch (e: any) {
      console.error('Failed to get user playlists:', e);
      return [];
    }
  }

  public static async getPlaylistTracks(
    playlistId: string,
    cookiesPath?: string
  ): Promise<YTMusicTrackItem[]> {
    try {
      const args = ['--flat-playlist', '-j'];
      if (cookiesPath && fs.existsSync(cookiesPath)) {
        args.push('--cookies', cookiesPath);
      }
      args.push(`https://www.youtube.com/playlist?list=${playlistId}`);

      const raw = await this.runYtDlpJson(args);

      return raw.map((item) => {
        const thumbs = item.thumbnails || [];
        const thumb = thumbs.length > 0 ? thumbs[thumbs.length - 1].url : '';
        return {
          id: item.id || `track_${Date.now()}_${Math.random()}`,
          title: item.title || 'Untitled Track',
          artist: item.uploader || item.channel || 'YouTube Artist',
          duration: Math.round(item.duration || 0),
          thumbnailUrl: thumb,
          url: item.url || item.webpage_url || `https://www.youtube.com/watch?v=${item.id}`,
        };
      });
    } catch (e: any) {
      console.error(`Failed to get playlist tracks for ${playlistId}:`, e);
      throw new Error(`Gagal memuat lagu playlist: ${e.message}`);
    }
  }
}
