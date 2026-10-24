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

export interface YTMusicPersonalizedDiscovery {
  vibeTitle: string;
  seedArtist: string;
  seedTitle?: string;
  spotlightTrack: YTMusicTrackItem | null;
  discoveryTracks: YTMusicTrackItem[];
  relatedArtists: YTMusicArtistItem[];
  moodStations: { title: string; query: string; color: string }[];
}

export class YTMusicClient {
  private static categorizedSearchCache = new Map<string, { timestamp: number; data: YTMusicSearchCategorized }>();
  private static artistDetailsCache = new Map<string, { timestamp: number; data: YTMusicArtistProfile }>();
  private static discoveryCache = new Map<string, { timestamp: number; data: YTMusicPersonalizedDiscovery }>();
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
      /\b(reaction|reacting|reacts|review|interview|vlog|behind the scenes|making of|gameplay|walkthrough|tutorial|guitar tab|bass tab|drum cover|vocal coach|sped up|nightcore|slowed|reverb|1 hour|10 hour|loop|karaoke|parody|meme|tiktok remix|audition|podcast|lawn mower|mowing|grass cutter|music library|sound library|stock music|royalty free|sound effect|backing track|bgm collection|pine music|concert pine|free download|relaxing piano|sleep music|study music)\b/i;
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

              // Check fixedColumns (standard desktop location for duration in YT Music)
              if (duration === 0 && item.fixedColumns && item.fixedColumns.length > 0) {
                for (const fc of item.fixedColumns) {
                  const runs = fc?.musicResponsiveListItemFixedColumnRenderer?.text?.runs || [];
                  for (const r of runs) {
                    const text = r?.text?.trim();
                    if (/^\d+:\d{2}(:\d{2})?$/.test(text)) {
                      duration = this.parseDuration(text);
                      break;
                    }
                  }
                  if (duration > 0) break;
                }
              }

              // Check additional flexColumns
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

    const normKey = (artistName || browseId || '').toLowerCase().trim();
    const verified = this.VERIFIED_ARTIST_AVATARS[normKey];
    if (verified) {
      if (!browseId || !browseId.startsWith('UC')) {
        if (verified.browseId) browseId = verified.browseId;
      }
      if (!bannerUrl && verified.thumbnailUrl) {
        bannerUrl = verified.thumbnailUrl;
      }
      if (verified.name) {
        name = verified.name;
      }
    }

    if (!browseId || (!browseId.startsWith('UC') && !browseId.startsWith('FEmusic_library'))) {
      try {
        const cat = await this.searchCategorized(name);
        if (cat.artists && cat.artists.length > 0 && cat.artists[0].browseId) {
          browseId = cat.artists[0].browseId;
          if (!bannerUrl && cat.artists[0].thumbnailUrl) {
            bannerUrl = cat.artists[0].thumbnailUrl;
          }
        }
      } catch {}
    }

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

  private static VERIFIED_ARTIST_AVATARS: Record<string, { name: string; thumbnailUrl: string; browseId?: string }> = {
    'lotus juice': {
      name: 'Lotus Juice',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/MfXr37X52KK4B7YSZeKAozaNSrphw8ZcZ-uaRc8NL_z5yMnFmpKs-Ilt9QSUUuLXQhTBBdpcrN3fxQpM=w544-h544-l90-rj',
      browseId: 'UC-VwZlXGD4cUOnjU-T5m8GA',
    },
    'yoko kanno': {
      name: 'Yoko Kanno',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/q1BSXvqBGMNPSaVqEfudMaxHOgy6y3lltj6qqH2vcv2L7z1JPRF9Q32ATU6iejxlHN3_MDvXrNSL5uo4GA=w544-h544-l90-rj',
      browseId: 'UCFhMA8ygjzH72UqPf7PmlUg',
    },
    'seatbelts': {
      name: 'Seatbelts',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/q1BSXvqBGMNPSaVqEfudMaxHOgy6y3lltj6qqH2vcv2L7z1JPRF9Q32ATU6iejxlHN3_MDvXrNSL5uo4GA=w544-h544-l90-rj',
      browseId: 'UCFhMA8ygjzH72UqPf7PmlUg',
    },
    'lamp': {
      name: 'Lamp',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/oq8lyMzBJQjIsVypIjDW3iwi_xRmXVdrigvseZXMEfDAwl0RYOPGpPCDi13MAZEFLxXMvymR=w544-h544-l90-rj',
      browseId: 'UC6e51S4pFqU0o2HadIi2_7g',
    },
    'taeko onuki': {
      name: 'Taeko Onuki',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/cCgBDMtVYMOME1WsNgGUKRpIet-MEUmyraKMOmu8WFiHIKdUXj-KR-GfHotJtpNK3nRBRE7O005T1nmi=w544-h544-s-l90-rj',
      browseId: 'MPREb_OtJzBGivITB',
    },
    'lyn inaizumi': {
      name: 'Lyn Inaizumi',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/anw2N-IOoB1GWgHeS-am1dj8M4w90-PI3N4pI74e_5EtUlWGU2eVu_Y0UzZRSMXA4GoTCltsp_5Hme7Z=w544-h544-l90-rj',
      browseId: 'UC4q96Ey5q9oznXhMY8avoPQ',
    },
    'lyn': {
      name: 'Lyn',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/anw2N-IOoB1GWgHeS-am1dj8M4w90-PI3N4pI74e_5EtUlWGU2eVu_Y0UzZRSMXA4GoTCltsp_5Hme7Z=w544-h544-l90-rj',
      browseId: 'UC4q96Ey5q9oznXhMY8avoPQ',
    },
    'casiopea': {
      name: 'CASIOPEA',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/KfT9dx6-CRJvMezSTFVak3H3gprqvIlkLnJFDdbDTVfimYn_T58AhexAm3CGo-u-EfHuDLtNMSj7KzQ=w544-h544-l90-rj',
      browseId: 'UCe5j73c3K8P6WqE7F0V0i_A',
    },
    'masayoshi takanaka': {
      name: 'Masayoshi Takanaka',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/A37QO_u2pxrCbpqwYnEs7tSHwgU_sdZgzGfWApFNu5rTzqnZgKPzAcSjGVHmBAAIc-HIl3jKGrNe5NU=w544-h544-l90-rj',
      browseId: 'UCn63_o_zZ61M1uFq7r3X5lQ',
    },
    'takanaka': {
      name: 'Masayoshi Takanaka',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/A37QO_u2pxrCbpqwYnEs7tSHwgU_sdZgzGfWApFNu5rTzqnZgKPzAcSjGVHmBAAIc-HIl3jKGrNe5NU=w544-h544-l90-rj',
    },
    't-square': {
      name: 'T-SQUARE',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/EF-99Chp_93ZlA_L0bEt8jMkk-TwytANbRYfmi0XzpYpw-nQTmm9lA_YnZgrMXxJ71LMGZ7Vfcdwqw=w544-h544-l90-rj',
    },
    'tatsuro yamashita': {
      name: 'Tatsuro Yamashita',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/qstFknr0S6E4lKBNSuedjUbeX-ENjox6-plp22AsvdQpLWw5wvtgGRadKhlqMflw2CIC2al7=w544-h544-l90-rj',
    },
    'miki matsubara': {
      name: 'Miki Matsubara',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/wmt0pq4qtC_WK7xgEEixEWmeObkbmjyvj2sr0xpXo3mRy_R1yNhAfBq_Xx6H0Z9qBlIQ1-L_vg=w544-h544-l90-rj',
    },
    'one ok rock': {
      name: 'ONE OK ROCK',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/alBNODlVMkJCt-E3lNA7bF52JzzLfgd6h4_Uo5JfkKdxQ0_lZzl5po9ML3Twn0Y7tytAX9bjlfazAIQ=w544-h544-l90-rj',
      browseId: 'UCYXU4IweiEiwKHzTcaKRAzw',
    },
    'bring me the horizon': {
      name: 'Bring Me The Horizon',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/YgsyFk3KZHvI5cYtcGOcWYwbpu_GJc-IbPeWyF_Xzy2JIDwL1cPefog1szowNlvuIJ-_OkpoyWOYxhg=w544-h544-l90-rj',
      browseId: 'UCGNMi-3h6Tx72EfbW6f2BxQ',
    },
    'paramore': {
      name: 'Paramore',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/302b-QV3HY1-IE-qMD1tHKoHlA4GczxhZWUBuTdYSJzC8WQQdOB6lb9zfq1FLTZypjKGgnGAYg=w544-h544-l90-rj',
      browseId: 'UCl2qVCHeUjL3lCnSCrKxtoQ',
    },
    'linkin park': {
      name: 'Linkin Park',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/uE72emEZFH3TVtCZoIFYKmnf7vsb42RYQxb4X-lonyqPQuS_mLtKpLfBQ5JdHwUijfQo06BtSB7LoQ=w544-h544-l90-rj',
      browseId: 'UCxgN32UVVztKAQd2HkXzBtw',
    },
    'eve': {
      name: 'Eve',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/hnlJyHTxqNsNIqqc6OcGCX3bP3scieR6zFB1-RCl1zPqQCUEZyd3S1MeacvRw6WwL0pUmYGXc76Jcg=w544-h544-l90-rj',
      browseId: 'UCXW81UHV3UeWUjVMr11ov2A',
    },
    'yoasobi': {
      name: 'YOASOBI',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/8BbiNyyI7TOxlf0x0R-4JZB8x7cw-ML-yOjF8QW8rHSrViZacf-AqD-eqg2ccvbYr5C9URAa_vTJI3k=w544-h544-l90-rj',
      browseId: 'UCI6B8NkZKqlFWoiC_xE-hzA',
    },
    'kenshi yonezu': {
      name: 'Kenshi Yonezu',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/rvoJpoc0bOs8cIpf3Lcf7zB8aPZpMbGtrTduAb2o7RI6ADokPbgR64iMA5P7dwu6LLDgg6HCz_hEww=w544-h544-l90-rj',
      browseId: 'UCC_OGcKdYY-aWFvVMFVGbzw',
    },
    'king gnu': {
      name: 'King Gnu',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/0yxG_xPL-fPeW_3pLWRDB7eXD14e10fIjN6tovLhItpB4g7YqWjSgwrvJvLLSwW-04TtZ9J40ezrt1c=w544-h544-l90-rj',
      browseId: 'UC9tx_HmhNISUR39M29r9a8A',
    },
    'fujii kaze': {
      name: 'Fujii Kaze',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/toZ3JKuc9xkkDyemWTAJxnVAdjT69o1aqDWCxFRcKgYbCFNKIR9Jq-cBQ07r-6Utx3GwY4ivwx-mjkk=w544-h544-l90-rj',
      browseId: 'UCxjfYUXFwmjUCGHMeBri5_w',
    },
    'official hige dandism': {
      name: 'OFFICIAL HIGE DANDISM',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/beJAMRm4Fei9DIYc0_Fnyg8zTRHf122p5xmKRd18Bsl0B_usth9jw31aW0JVtdJbmM6nfCgv64nvs9Y=w544-h544-l90-rj',
      browseId: 'UC84Rm0a3gimYXPtqp5O_JRw',
    },
    'radwimps': {
      name: 'Radwimps',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/_S379WJWfFbCmknRo4sq2ZjaHV9UMuznYNwaznL7MyAZIQPdvLhzGcB1MbTcwVYnrCV6s2LDLhwu7A=w544-h544-l90-rj',
      browseId: 'UCT418-ChE6rgGuQlqzFsKZA',
    },
    'ado': {
      name: 'Ado',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/ES5kleAx1BlxR1xWP85JrqY3YKgLs2MyxfIfaoyk5nYZSv2rMK6Zk42_Sf_5ZJaHp4kwdqIpO45DT2oi=w544-h544-l90-rj',
      browseId: 'UC5DHwv9N4OQ9AWtKr8YSefw',
    },
    'cory wong': {
      name: 'Cory Wong',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/q863S_sm7epcSRQKwLPk2nhrvtj4C-8hq0pPo7vCLTTVNfN7OJPkZaSXNZP1BQAv9AuOLWdwI9eunQ=w544-h544-l90-rj',
      browseId: 'UCnhCLKRdja46hggWGR7K8hQ',
    },
    'tom misch': {
      name: 'Tom Misch',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/3JqpUgsIaZJODKXKTI0fjwsgABdoBVQWs-vDQYq9N6XHFYFVL2efALN5puWE0n7RhVUyN_FTXLyUlAvU=w544-h544-l90-rj',
      browseId: 'UCCCWJwLEvpPAs4r_nJiKe2Q',
    },
    'fkj': {
      name: 'FKJ',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/_ekVAjWXXaDgOKamsIK-WPAtjX0BsRFZABWefUqAYsRDgWT8eJ6ty5WevIQo_xbjknSFkxZaWLDUoX0=w544-h544-l90-rj',
      browseId: 'UCxcGxv-per5g7A9be800tQA',
    },
    'billie eilish': {
      name: 'Billie Eilish',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/tQC4rOL6xz6FhmFr0ggQExxyGbYSOsyveXVSnPBh2WjEyIzQ9pMHablLJ-0GlMBrLBlBrbWQGmzrV6KN=w544-h544-l90-rj',
      browseId: 'UCERrDZ8oN0U_n9MphMKERcg',
    },
    'the weeknd': {
      name: 'The Weeknd',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/U-SAmNOu4TynE818gLCfKsuHZ0U5YNEtO9mrjSI9WCCKERs98LzrCal5kajBBTQNwdcisoB2Bn-pHp4=w544-h544-l90-rj',
      browseId: 'UClYV6hHlupm_S_ObS1W-DYw',
    },
    'taylor swift': {
      name: 'Taylor Swift',
      thumbnailUrl:
        'https://yt3.googleusercontent.com/RCpTA6EXJQyjVFDosWOKa2SMmqkua_lA9mHPDWWciLwgqpZLz-k8rXWRF_367trrQ7up9BUwCbk6kRk=w544-h544-l90-rj',
      browseId: 'UCPC0L1d253x-KuMNwa05TpA',
    },
    'bruno mars': {
      name: 'Bruno Mars',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/hnefGBrazRhn4Z92bdSZBUENl40ONjRiVDsmZKZh-WZ2iCKE-2c7KKR7SNcZfzLHoRyB3E6as8L87YA=w544-h544-l90-rj',
      browseId: 'UCZn4r7heNOPY-C43YIywnVA',
    },
    'bernadya': {
      name: 'Bernadya',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/hxROE1fvLWSxUYAFV3IgMp5vvjN91Jx6oS6uwSVyYN9_fb3I6PLaRa3Ufb4A0awxq4J5UoPFQAQM-Q=w544-h544-l90-rj',
      browseId: 'UCUn9Xjvg8fwqpa58-_XO6zw',
    },
    'coldplay': {
      name: 'Coldplay',
      thumbnailUrl:
        'https://lh3.googleusercontent.com/IOKuXtp8PCQ_Fc-vaRKm3sKIXBxFV51gZheLTH5br-YGnWHFQf_Jywcuk7wbprYRoEbQyS_XZY6-nMJX=w544-h544-l90-rj',
      browseId: 'UCIaFw5VBEK8qaW6nRpx_qnw',
    },
  };

  private static isJunkArtistName(name: string): boolean {
    const n = (name || '').toLowerCase().trim();
    const junkPatterns = [
      'relaxing',
      'relax',
      'chill beats',
      'lofi beats',
      'lo-fi beats',
      'music channel',
      'sleep music',
      'bgm',
      'study music',
      'piano music',
      'coffee music',
      'jazz lounge',
      'records',
      'records label',
      'sound library',
      'various artists',
      'topic',
      'meditation',
      'soothing',
      'healing',
      'spa music',
      'sleep beats',
      'calm',
    ];
    return junkPatterns.some((pattern) => n.includes(pattern));
  }

  public static async getPersonalizedDiscovery(
    seeds: { id?: string; title: string; artist: string }[]
  ): Promise<YTMusicPersonalizedDiscovery> {
    const validSeeds = (seeds || []).filter(
      (s) => s && s.title && s.artist && !s.artist.toLowerCase().includes('unknown')
    );

    const primarySeed = validSeeds[0] || {
      title: 'Midnight Rendezvous',
      artist: 'Casiopea',
    };

    const primaryArtist = primarySeed.artist.trim();
    const primaryTitle = primarySeed.title.trim();

    const cacheKey = (
      validSeeds.length > 0
        ? validSeeds.map((s) => `${s.artist}:${s.title}`).slice(0, 3).join('|')
        : 'default_casiopea'
    ).toLowerCase();

    const cached = this.discoveryCache.get(cacheKey);
    const now = Date.now();
    if (cached && now - cached.timestamp < 15 * 60 * 1000) {
      return cached.data;
    }

    // Build exclusion set to strictly filter out same artist / same franchise
    const excludedArtists = new Set<string>();
    for (const seed of validSeeds.length > 0 ? validSeeds : [primarySeed]) {
      const a = (seed.artist || '').toLowerCase().trim();
      if (a) {
        excludedArtists.add(a);
      }
    }

    const allSeedText = (
      validSeeds.length > 0
        ? validSeeds.map((s) => `${s.title} ${s.artist}`).join(' ')
        : `${primaryTitle} ${primaryArtist}`
    ).toLowerCase();

    // Specific franchise exclusion if Persona/Atlus detected
    const isPersonaVibe =
      allSeedText.includes('persona') ||
      allSeedText.includes('atlus') ||
      allSeedText.includes('meguro') ||
      allSeedText.includes('hirata') ||
      allSeedText.includes('shihoko');

    const isExcluded = (songArtist: string, songTitle: string) => {
      const na = (songArtist || '').toLowerCase().trim();
      const nt = (songTitle || '').toLowerCase().trim();

      for (const a of excludedArtists) {
        if (a.length >= 3 && (na === a || na.includes(a))) return true;
      }

      if (isPersonaVibe) {
        if (na.includes('persona') || na.includes('atlus') || na.includes('shihoko') || na.includes('shoji meguro')) return true;
        if (nt.includes('persona') || nt.includes('shihoko')) return true;
      }
      return false;
    };

    // Detect musical vibe and setup tailored search queries, backup artists, and mood stations
    let vibeTitle = `Eksplorasi Vibe: Terinspirasi dari ${primaryArtist}`;
    let queries: string[] = [];
    let backupRelatedArtists: { name: string; query: string }[] = [];
    let moodStations: { title: string; query: string; color: string }[] = [];

    if (
      allSeedText.includes('yorushika') ||
      allSeedText.includes('yoasobi') ||
      allSeedText.includes('zutomayo') ||
      allSeedText.includes('ado') ||
      allSeedText.includes('eve') ||
      allSeedText.includes('kenshi yonezu') ||
      allSeedText.includes('fujii kaze') ||
      allSeedText.includes('vaundy') ||
      allSeedText.includes('king gnu') ||
      allSeedText.includes('official hige') ||
      allSeedText.includes('aimyon') ||
      allSeedText.includes('radwimps') ||
      allSeedText.includes('lisa') ||
      allSeedText.includes('milet') ||
      allSeedText.includes('j-pop') ||
      allSeedText.includes('jpop') ||
      allSeedText.includes('j-rock') ||
      allSeedText.includes('jrock')
    ) {
      vibeTitle = 'Modern J-Pop & Melodic J-Rock Hits';
      queries = [
        `${primaryArtist} popular songs`,
        'YOASOBI popular songs',
        'ZUTOMAYO popular songs',
        'Fujii Kaze popular songs',
        'Vaundy popular songs',
        'Eve popular songs',
      ];
      backupRelatedArtists = [
        { name: 'YOASOBI', query: 'YOASOBI official' },
        { name: 'ZUTOMAYO', query: 'ZUTOMAYO official' },
        { name: 'Eve', query: 'Eve official' },
        { name: 'Ado', query: 'Ado official' },
        { name: 'Fujii Kaze', query: 'Fujii Kaze official' },
        { name: 'Vaundy', query: 'Vaundy official' },
        { name: 'King Gnu', query: 'King Gnu official' },
        { name: 'Official HIGE DANdism', query: 'Official HIGE DANdism' },
      ];
      moodStations = [
        { title: 'J-Pop Night Drive', query: 'YOASOBI Yorushika Night Drive', color: 'from-blue-600/30 to-purple-900/30' },
        { title: 'Melodic J-Rock', query: 'Modern J-Rock Anime Hits', color: 'from-rose-600/30 to-amber-900/30' },
        { title: 'Soulful J-Grooves', query: 'Fujii Kaze Vaundy Soul', color: 'from-emerald-600/30 to-teal-900/30' },
        { title: 'Acoustic J-Pop', query: 'Aimyon Yorushika Acoustic', color: 'from-amber-600/30 to-orange-900/30' },
      ];
    } else if (
      isPersonaVibe ||
      allSeedText.includes('jazz fusion') ||
      allSeedText.includes('casiopea') ||
      allSeedText.includes('takanaka') ||
      allSeedText.includes('t-square') ||
      allSeedText.includes('city pop') ||
      allSeedText.includes('yoko kanno') ||
      allSeedText.includes('acid jazz') ||
      allSeedText.includes('anime') ||
      allSeedText.includes('vgm')
    ) {
      vibeTitle = 'Persona & Japanese Jazz Fusion Grooves';
      queries = [
        `${primaryArtist} popular songs`,
        'Persona 5 Lyn popular songs',
        'Lotus Juice Persona popular songs',
        'Miki Matsubara Stay With Me popular songs',
        'Casiopea Asayake Galactic Funk',
        'Masayoshi Takanaka Blue Lagoon popular songs',
      ];
      backupRelatedArtists = [
        { name: 'Lotus Juice', query: 'Lotus Juice' },
        { name: 'Lyn Inaizumi', query: 'Lyn Inaizumi Persona' },
        { name: 'Miki Matsubara', query: 'Miki Matsubara' },
        { name: 'Casiopea', query: 'Casiopea' },
        { name: 'Masayoshi Takanaka', query: 'Masayoshi Takanaka' },
        { name: 'Yoko Kanno', query: 'Yoko Kanno Seatbelts' },
        { name: 'Lamp', query: 'Lamp band' },
        { name: 'Tatsuro Yamashita', query: 'Tatsuro Yamashita' },
      ];
      moodStations = [
        { title: 'Acid Jazz & Funk', query: 'Acid Jazz Funk Groove', color: 'from-amber-600/30 to-rose-900/30' },
        { title: 'J-Fusion & City Pop', query: 'Japanese Jazz Fusion City Pop', color: 'from-cyan-600/30 to-blue-900/30' },
        { title: 'Anime & Gaming Grooves', query: 'Anime VGM Groovy Soundtracks', color: 'from-purple-600/30 to-indigo-900/30' },
        { title: 'Lofi & Instrumental Chill', query: 'Lofi Chill Beats Gaming', color: 'from-emerald-600/30 to-teal-900/30' },
      ];
    } else if (
      allSeedText.includes('indie') ||
      allSeedText.includes('bedroom pop') ||
      allSeedText.includes('dream pop') ||
      allSeedText.includes('wave to earth') ||
      allSeedText.includes('clairo') ||
      allSeedText.includes('phum') ||
      allSeedText.includes('boy pablo') ||
      allSeedText.includes('rex orange') ||
      allSeedText.includes('men i trust') ||
      allSeedText.includes('hyukoh') ||
      allSeedText.includes('black skirts') ||
      allSeedText.includes('cigarettes after sex') ||
      allSeedText.includes('laufey') ||
      allSeedText.includes('adoy') ||
      allSeedText.includes('beabadoobee') ||
      allSeedText.includes('mac demarco')
    ) {
      vibeTitle = 'Indie Bedroom Pop & Dreamy Melodies';
      queries = [
        `${primaryArtist} popular songs`,
        'Men I Trust popular songs',
        'boy pablo popular songs',
        'wave to earth popular songs',
        'Phum Viphurit popular songs',
        'Laufey popular songs',
      ];
      backupRelatedArtists = [
        { name: 'Men I Trust', query: 'Men I Trust' },
        { name: 'Phum Viphurit', query: 'Phum Viphurit' },
        { name: 'boy pablo', query: 'boy pablo' },
        { name: 'The Black Skirts', query: 'The Black Skirts' },
        { name: 'HYUKOH', query: 'HYUKOH' },
        { name: 'ADOY', query: 'ADOY' },
        { name: 'Laufey', query: 'Laufey' },
        { name: 'Mac DeMarco', query: 'Mac DeMarco' },
      ];
      moodStations = [
        { title: 'Dream Pop Chill', query: 'Dream Pop Bedroom Pop', color: 'from-pink-600/30 to-purple-900/30' },
        { title: 'Indie Folk & Acoustic', query: 'Indie Folk Acoustic Chill', color: 'from-amber-600/30 to-yellow-900/30' },
        { title: 'Late Night Bedroom', query: 'Late Night Indie Vibes', color: 'from-indigo-600/30 to-slate-900/30' },
        { title: 'Chillwave & Lo-Fi', query: 'Chillwave Indie Beats', color: 'from-teal-600/30 to-cyan-900/30' },
      ];
    } else if (
      allSeedText.includes('rock') ||
      allSeedText.includes('metal') ||
      allSeedText.includes('punk') ||
      allSeedText.includes('grunge') ||
      allSeedText.includes('linkin park') ||
      allSeedText.includes('one ok rock')
    ) {
      vibeTitle = 'Alternative Rock & Modern Energy';
      queries = [
        `${primaryArtist} popular songs`,
        'ONE OK ROCK popular songs',
        'Linkin Park popular songs',
        'Paramore popular songs',
        'Bring Me The Horizon popular songs',
      ];
      backupRelatedArtists = [
        { name: 'ONE OK ROCK', query: 'ONE OK ROCK' },
        { name: 'Bring Me The Horizon', query: 'Bring Me The Horizon' },
        { name: 'Paramore', query: 'Paramore' },
        { name: 'Linkin Park', query: 'Linkin Park' },
        { name: 'My Chemical Romance', query: 'My Chemical Romance' },
        { name: 'Muse', query: 'Muse' },
      ];
      moodStations = [
        { title: 'Modern Alt-Rock', query: 'Modern Alternative Rock', color: 'from-red-600/30 to-amber-900/30' },
        { title: 'Melodic Post-Hardcore', query: 'Melodic Post Hardcore', color: 'from-purple-600/30 to-rose-900/30' },
        { title: 'Acoustic Rock Unplugged', query: 'Acoustic Rock Unplugged', color: 'from-stone-600/30 to-zinc-900/30' },
        { title: 'High Octane Energy', query: 'High Energy Rock Workout', color: 'from-orange-600/30 to-red-900/30' },
      ];
    } else if (
      allSeedText.includes('r&b') ||
      allSeedText.includes('soul') ||
      allSeedText.includes('caesar') ||
      allSeedText.includes('frank ocean') ||
      allSeedText.includes('sza') ||
      allSeedText.includes('joji') ||
      allSeedText.includes('keshi')
    ) {
      vibeTitle = 'Smooth R&B, Neo-Soul & Chill Late Nights';
      queries = [
        `${primaryArtist} popular songs`,
        'Daniel Caesar popular songs',
        'SZA popular songs',
        'Frank Ocean popular songs',
        'Joji popular songs',
      ];
      backupRelatedArtists = [
        { name: 'Daniel Caesar', query: 'Daniel Caesar' },
        { name: 'Steve Lacy', query: 'Steve Lacy' },
        { name: 'Brent Faiyaz', query: 'Brent Faiyaz' },
        { name: 'Joji', query: 'Joji' },
        { name: 'Keshi', query: 'Keshi' },
        { name: 'UMI', query: 'UMI' },
      ];
      moodStations = [
        { title: 'Neo-Soul Warmth', query: 'Neo Soul Warm Grooves', color: 'from-orange-600/30 to-rose-900/30' },
        { title: 'Midnight R&B', query: 'Midnight R&B Slow Jams', color: 'from-indigo-600/30 to-purple-900/30' },
        { title: 'Alternative R&B', query: 'Alternative R&B Grooves', color: 'from-rose-600/30 to-violet-900/30' },
        { title: 'Soulful Chill Lounge', query: 'Chill R&B Lounge', color: 'from-blue-600/30 to-slate-900/30' },
      ];
    } else {
      vibeTitle = `Hits & Rekomendasi Terkait: ${primaryArtist}`;
      queries = [
        `${primaryArtist} popular songs`,
        `${primaryArtist} top tracks`,
        `${primaryArtist} greatest hits`,
      ];
      backupRelatedArtists = [
        { name: 'YOASOBI', query: 'YOASOBI' },
        { name: 'Men I Trust', query: 'Men I Trust' },
        { name: 'ONE OK ROCK', query: 'ONE OK ROCK' },
        { name: 'Fujii Kaze', query: 'Fujii Kaze' },
      ];
      moodStations = [
        { title: 'Eksplorasi Suasana', query: `${primaryArtist} hits`, color: 'from-blue-600/30 to-indigo-900/30' },
        { title: 'Mix Melodi Terkait', query: `${primaryArtist} top songs`, color: 'from-purple-600/30 to-rose-900/30' },
        { title: 'Akustik & Tenang', query: `${primaryArtist} acoustic`, color: 'from-amber-600/30 to-orange-900/30' },
        { title: 'Upbeat & Dinamis', query: `${primaryArtist} upbeat`, color: 'from-emerald-600/30 to-cyan-900/30' },
      ];
    }

    const discoveryTracks: YTMusicTrackItem[] = [];
    const relatedArtists: YTMusicArtistItem[] = [];
    const seenSongIds = new Set<string>();
    const seenArtistNames = new Set<string>();

    for (const art of excludedArtists) {
      seenArtistNames.add(art.toLowerCase());
    }

    const searchPromises = queries.map((q) => this.searchCategorized(q).catch(() => null));
    const results = await Promise.all(searchPromises);

    for (const res of results) {
      if (!res) continue;

      for (const song of res.songs) {
        if (!song || !song.id || seenSongIds.has(song.id)) continue;
        if (isExcluded(song.artist, song.title)) continue;

        // Filter out stock audio libraries, sound effects, BGM, and non-songs
        const normTitle = (song.title || '').toLowerCase();
        const normArtist = (song.artist || '').toLowerCase();
        if (
          normTitle.includes('music library') ||
          normTitle.includes('sound library') ||
          normTitle.includes('pine music') ||
          normTitle.includes('concert pine') ||
          normTitle.includes('european wind') ||
          normTitle.includes('sound effect') ||
          normTitle.includes('karaoke') ||
          normTitle.includes('backing track') ||
          normTitle.includes('instrumental version') ||
          normTitle.includes('1 hour') ||
          normTitle.includes('10 hour') ||
          normTitle.includes('loop') ||
          normTitle.includes('bgm collection') ||
          normTitle.includes('no copyright') ||
          normTitle.includes('royalty free') ||
          normArtist.includes('library') ||
          normArtist.includes('various artists')
        ) {
          continue;
        }

        seenSongIds.add(song.id);
        discoveryTracks.push(song);
      }

      for (const artist of res.artists) {
        if (!artist || !artist.name) continue;
        if (this.isJunkArtistName(artist.name)) continue;
        const normName = artist.name.toLowerCase().trim();
        if (seenArtistNames.has(normName)) continue;
        if (isExcluded(artist.name, '')) continue;
        seenArtistNames.add(normName);

        const verified = this.VERIFIED_ARTIST_AVATARS[normName];
        const finalThumb = verified?.thumbnailUrl || artist.thumbnailUrl;
        if (!finalThumb || finalThumb.includes('photo-1511671782779')) continue;

        relatedArtists.push({
          ...artist,
          thumbnailUrl: finalThumb,
          browseId: verified?.browseId || artist.browseId,
        });
      }
    }

    if (relatedArtists.length < 6 && backupRelatedArtists.length > 0) {
      for (const backup of backupRelatedArtists) {
        if (relatedArtists.length >= 8) break;
        const normBackup = backup.name.toLowerCase().trim();
        if (seenArtistNames.has(normBackup) || isExcluded(backup.name, '')) continue;
        if (this.isJunkArtistName(backup.name)) continue;

        const verified = this.VERIFIED_ARTIST_AVATARS[normBackup];
        let thumbUrl = verified?.thumbnailUrl || '';
        let browseId = verified?.browseId;

        if (!thumbUrl) {
          try {
            const cat = await this.searchCategorized(backup.query);
            if (cat.artists && cat.artists.length > 0 && cat.artists[0].thumbnailUrl) {
              thumbUrl = cat.artists[0].thumbnailUrl;
              browseId = cat.artists[0].browseId;
            } else if (cat.topResult && cat.topResult.thumbnailUrl && cat.topResult.type?.toLowerCase().includes('artis')) {
              thumbUrl = cat.topResult.thumbnailUrl;
              browseId = cat.topResult.browseId;
            }
          } catch {}
        }

        if (!thumbUrl || thumbUrl.includes('photo-1511671782779')) {
          continue;
        }

        seenArtistNames.add(normBackup);
        relatedArtists.push({
          id: browseId || `artist_${normBackup.replace(/[^a-z0-9]/g, '_')}`,
          name: backup.name,
          subscribers: 'Artis Terkait',
          thumbnailUrl: thumbUrl,
          browseId,
        });
      }
    }

    // Editorial Golden Songs (Spotify/Apple Music curated baseline) to guarantee high-reputation, loved tracks
    const EDITORIAL_GOLDEN_SONGS: Record<string, YTMusicTrackItem[]> = {
      jpop: [
        { id: 'by4SYYWlCJI', title: 'Yoru ni Kakeru (夜に駆ける)', artist: 'YOASOBI', duration: 261, thumbnailUrl: 'https://i.ytimg.com/vi/by4SYYWlCJI/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=by4SYYWlCJI' },
        { id: 'G-7U-OPe83U', title: 'Idol (アイドル)', artist: 'YOASOBI', duration: 213, thumbnailUrl: 'https://i.ytimg.com/vi/G-7U-OPe83U/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=G-7U-OPe83U' },
        { id: 'G_zha_H_H9M', title: 'Byoushin wo Kamu (秒針を噛む)', artist: 'ZUTOMAYO', duration: 259, thumbnailUrl: 'https://i.ytimg.com/vi/G_zha_H_H9M/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=G_zha_H_H9M' },
        { id: '1tk1pqwrOys', title: 'Kaikai Kitan (廻廻奇譚)', artist: 'Eve', duration: 221, thumbnailUrl: 'https://i.ytimg.com/vi/1tk1pqwrOys/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=1tk1pqwrOys' },
        { id: 'pgXpM4l_MwI', title: 'Show (唱)', artist: 'Ado', duration: 191, thumbnailUrl: 'https://i.ytimg.com/vi/pgXpM4l_MwI/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=pgXpM4l_MwI' },
        { id: 'dFf4AgBNR1E', title: 'Shinunoga E-Wa (死ぬのがいいわ)', artist: 'Fujii Kaze', duration: 185, thumbnailUrl: 'https://i.ytimg.com/vi/dFf4AgBNR1E/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=dFf4AgBNR1E' },
        { id: 'FSz6m-r_k8M', title: 'Tada Kimi ni Hare (ただ君に晴れ)', artist: 'Yorushika', duration: 198, thumbnailUrl: 'https://i.ytimg.com/vi/FSz6m-r_k8M/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=FSz6m-r_k8M' },
        { id: 'mHYZ_3B8H_8', title: 'Kaiju no Hanauta (怪獣の花唄)', artist: 'Vaundy', duration: 224, thumbnailUrl: 'https://i.ytimg.com/vi/mHYZ_3B8H_8/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=mHYZ_3B8H_8' },
        { id: 'M_v_b0pG1fM', title: 'Kick Back', artist: 'Kenshi Yonezu', duration: 193, thumbnailUrl: 'https://i.ytimg.com/vi/M_v_b0pG1fM/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=M_v_b0pG1fM' },
        { id: 'TQ8WlA2GxBk', title: 'Pretender', artist: 'Official HIGE DANdism', duration: 326, thumbnailUrl: 'https://i.ytimg.com/vi/TQ8WlA2GxBk/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=TQ8WlA2GxBk' },
      ],
      indie: [
        { id: 'YqXzE6iJg_0', title: 'seasons', artist: 'wave to earth', duration: 256, thumbnailUrl: 'https://i.ytimg.com/vi/YqXzE6iJg_0/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=YqXzE6iJg_0' },
        { id: 'bad_song_id', title: 'bad', artist: 'wave to earth', duration: 263, thumbnailUrl: 'https://i.ytimg.com/vi/YqXzE6iJg_0/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=YqXzE6iJg_0' },
        { id: 's2e1G9o1eZc', title: 'Show Me How', artist: 'Men I Trust', duration: 215, thumbnailUrl: 'https://i.ytimg.com/vi/s2e1G9o1eZc/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=s2e1G9o1eZc' },
        { id: 'I_b8fV_YQ6g', title: 'Everytime', artist: 'boy pablo', duration: 192, thumbnailUrl: 'https://i.ytimg.com/vi/I_b8fV_YQ6g/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=I_b8fV_YQ6g' },
        { id: '8HnLRrQ3RS4', title: 'Lover Boy', artist: 'Phum Viphurit', duration: 238, thumbnailUrl: 'https://i.ytimg.com/vi/8HnLRrQ3RS4/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=8HnLRrQ3RS4' },
        { id: 'k3Zq0r_yN6s', title: 'From the Start', artist: 'Laufey', duration: 169, thumbnailUrl: 'https://i.ytimg.com/vi/k3Zq0r_yN6s/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=k3Zq0r_yN6s' },
        { id: 'k3Zq0r_bsk', title: 'EVERYTHING', artist: 'The Black Skirts', duration: 263, thumbnailUrl: 'https://i.ytimg.com/vi/8HnLRrQ3RS4/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=8HnLRrQ3RS4' },
      ],
      jazz: [
        { id: 'eYw_0V18V_w', title: 'Last Surprise', artist: 'Lyn', duration: 236, thumbnailUrl: 'https://i.ytimg.com/vi/eYw_0V18V_w/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=eYw_0V18V_w' },
        { id: '9Gj47G2eORc', title: 'Mayonaka no Door / Stay With Me', artist: 'Miki Matsubara', duration: 311, thumbnailUrl: 'https://i.ytimg.com/vi/9Gj47G2eORc/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=9Gj47G2eORc' },
        { id: '62Z48V6z9K0', title: 'Asayake', artist: 'CASIOPEA', duration: 238, thumbnailUrl: 'https://i.ytimg.com/vi/62Z48V6z9K0/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=62Z48V6z9K0' },
        { id: 'Blue_Lagoon_MT', title: 'Blue Lagoon', artist: 'Masayoshi Takanaka', duration: 305, thumbnailUrl: 'https://i.ytimg.com/vi/62Z48V6z9K0/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=62Z48V6z9K0' },
        { id: 'Tank_Seatbelts', title: 'Tank!', artist: 'The Seatbelts', duration: 210, thumbnailUrl: 'https://i.ytimg.com/vi/9Gj47G2eORc/hqdefault.jpg', url: 'https://www.youtube.com/watch?v=9Gj47G2eORc' },
      ],
    };

    const genreKey = vibeTitle.toLowerCase().includes('j-pop') || vibeTitle.toLowerCase().includes('anime')
      ? 'jpop'
      : vibeTitle.toLowerCase().includes('indie') || vibeTitle.toLowerCase().includes('bedroom')
      ? 'indie'
      : vibeTitle.toLowerCase().includes('jazz') || vibeTitle.toLowerCase().includes('fusion') || isPersonaVibe
      ? 'jazz'
      : '';

    if (discoveryTracks.length < 8 && genreKey && EDITORIAL_GOLDEN_SONGS[genreKey]) {
      for (const golden of EDITORIAL_GOLDEN_SONGS[genreKey]) {
        if (!seenSongIds.has(golden.id) && !isExcluded(golden.artist, golden.title)) {
          seenSongIds.add(golden.id);
          discoveryTracks.push(golden);
        }
      }
    }

    if (discoveryTracks.length === 0) {
      const emergency = await this.searchCategorized('YOASOBI Yoru ni Kakeru');
      for (const song of emergency.songs) {
        if (!isExcluded(song.artist, song.title) && !seenSongIds.has(song.id)) {
          seenSongIds.add(song.id);
          discoveryTracks.push(song);
        }
      }
    }

    const spotlightTrack =
      discoveryTracks.find((t) => {
        const titleNorm = (t.title || '').toLowerCase().trim();
        return (
          t.duration >= 120 &&
          t.duration <= 400 &&
          titleNorm !== 'radio' &&
          titleNorm !== 'mix' &&
          titleNorm.length > 3
        );
      }) ||
      discoveryTracks.find((t) => t.duration >= 120 && t.duration <= 400) ||
      discoveryTracks[0] ||
      null;

    const finalDiscovery: YTMusicPersonalizedDiscovery = {
      vibeTitle,
      seedArtist: primaryArtist,
      seedTitle: primaryTitle,
      spotlightTrack,
      discoveryTracks: discoveryTracks.slice(0, 24),
      relatedArtists: relatedArtists.slice(0, 10),
      moodStations,
    };

    if (this.discoveryCache.size > 50) {
      const firstKey = this.discoveryCache.keys().next().value;
      if (firstKey) this.discoveryCache.delete(firstKey);
    }
    this.discoveryCache.set(cacheKey, { timestamp: now, data: finalDiscovery });

    return finalDiscovery;
  }
}
