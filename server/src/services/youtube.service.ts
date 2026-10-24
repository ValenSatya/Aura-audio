import { Innertube, UniversalCache, ClientType } from 'youtubei.js';
import { Response } from 'express';
import { Track, AlbumItem, ArtistItem, AlbumDetail, VideoItem, ArtistDetail, HomeFeedData } from '../types/index.js';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execFileAsync = promisify(execFile);

export class YouTubeService {
  private static searchClient: Innertube | null = null;
  private static streamClient: Innertube | null = null;
  private static streamUrlCache = new Map<string, { url: string; expiresAt: number; duration: number }>();
  private static cachedHomeFeed: { data: HomeFeedData; expiresAt: number } | null = null;

  // Strict Anti-Spam / Compilation Filter
  private static SPAM_COMPILATION_REGEX = /\b(top\s*\d+|best\s*of|greatest\s*hits|playlist|compilation|collection|kumpulan|koleksi|nonstop|dj\s*remix|remix\s*full|full\s*album|lagu\s*viral|tiktok\s*hits|popular\s*songs|top\s*hits|top\s*tracks|top\s*singles|various\s*artists|terpopuler|karaoke|terbaik|lagu\s*terbaik|song\s*terbaik|hits\s*20\d\d|songs?\s*20\d\d|best\s*songs?|list\s*song\w*|daftar\s*lagu|chart\s*20\d\d|billboard\s*hot)\b/i;

  // Total Blacklist for Indian Music Content (Scripts, Labels, Genres, Keywords)
  private static INDIAN_SCRIPT_REGEX = /[\u0900-\u0D7F]/;
  private static INDIAN_KEYWORDS_REGEX = /\b(bollywood|hindi|punjabi|bhojpuri|tamil|telugu|malayalam|kannada|marathi|gujarati|haryanvi|bhangra|qawwali|ghazal|desi|t-series|tseries|zee\s*music|speed\s*records|tips\s*official|saregama|geet\s*mp3|yrf|yash\s*raj|lahari|aditya\s*music|arijit|kakkar|badshah|honey\s*singh|diljit|ghoshal|nautiyal|b\s*praak|randhawa|sidhu\s*moose|anirudh|rahman)\b/i;

  public static isBlacklisted(title: string, artist?: string, album?: string): boolean {
    const combined = `${title || ''} ${artist || ''} ${album || ''}`.trim();
    if (!combined) return true;
    return (
      this.SPAM_COMPILATION_REGEX.test(combined) ||
      this.INDIAN_SCRIPT_REGEX.test(combined) ||
      this.INDIAN_KEYWORDS_REGEX.test(combined)
    );
  }

  public static upgradeThumbnailUrl(url: string, videoId?: string): string {
    if (!url) {
      if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
        return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      }
      return '';
    }

    // Google User Content (YouTube Music & Official Artist images)
    if (url.includes('googleusercontent.com')) {
      if (/=w\d+-h\d+[^?#]*/.test(url)) {
        return url.replace(/=w\d+-h\d+[^?#]*/, '=w544-h544-l90-rj');
      }
      if (/=s\d+[^?#]*/.test(url)) {
        return url.replace(/=s\d+[^?#]*/, '=s544-c');
      }
      return `${url}=w544-h544-l90-rj`;
    }

    // YouTube static video thumbnails
    if (url.includes('i.ytimg.com')) {
      if (url.includes('default.jpg') && !url.includes('hqdefault.jpg') && !url.includes('maxresdefault.jpg')) {
        return url.replace(/(?:default|mqdefault|sddefault)\.jpg/, 'hqdefault.jpg');
      }
    }

    return url;
  }

  public static async getSearchClient(): Promise<Innertube> {
    if (!this.searchClient) {
      console.log('[Backend] Initializing YouTube Music Search Client...');
      this.searchClient = await Innertube.create({
        cache: new UniversalCache(true),
      });
      console.log('[Backend] YouTube Music Search Client ready.');
    }
    return this.searchClient;
  }

  public static async getStreamClient(): Promise<Innertube> {
    if (!this.streamClient) {
      console.log('[Backend] Initializing YouTube VisionOS Streaming Client...');
      this.streamClient = await Innertube.create({
        client_type: ClientType.VISIONOS,
        cache: new UniversalCache(true),
      });
      console.log('[Backend] YouTube VisionOS Streaming Client ready.');
    }
    return this.streamClient;
  }

  public static async search(query: string): Promise<Track[]> {
    if (!query.trim()) return [];
    const yt = await this.getSearchClient();

    try {
      const searchResult = await yt.music.search(query, { type: 'song' });
      const items = (searchResult.songs?.contents || []) as any[];

      if (items.length > 0) {
        return items
          .filter((item: any) => {
            const title = item.title || '';
            const artist = item.artists?.[0]?.name || item.author?.name || '';
            const album = item.album?.name || '';
            return !this.isBlacklisted(title, artist, album);
          })
          .map((item: any) => {
            const id = item.id || '';
            const title = item.title || 'Unknown Title';
            const artist = item.artists?.[0]?.name || item.author?.name || 'Unknown Artist';
            const album = item.album?.name || undefined;
            const duration = item.duration?.seconds || 180;
            const rawThumb = item.thumbnails?.[0]?.url || item.thumbnails?.[item.thumbnails.length - 1]?.url || '';
            const thumb = this.upgradeThumbnailUrl(rawThumb, id);

            return {
              id,
              title,
              artist,
              album,
              duration,
              url: `https://www.youtube.com/watch?v=${id}`,
              thumbnailUrl: thumb,
              sourceType: 'youtube',
              dateAdded: Date.now(),
            };
          });
      }
    } catch (err) {
      console.warn('[Backend] YouTube Music search failed, falling back to general search:', err);
    }

    // General video search fallback
    try {
      const genSearch = await yt.search(query, { type: 'video' });
      const videos = (genSearch.videos || []) as any[];
      return videos
        .filter((v: any) => {
          const title = v.title?.text || v.title || '';
          const artist = v.author?.name || '';
          return !this.isBlacklisted(title, artist);
        })
        .slice(0, 20)
        .map((v: any) => ({
          id: v.id,
          title: v.title?.text || v.title || 'Unknown',
          artist: v.author?.name || 'Unknown Artist',
          duration: v.duration?.seconds || 180,
          url: `https://www.youtube.com/watch?v=${v.id}`,
          thumbnailUrl: this.upgradeThumbnailUrl(v.thumbnails?.[0]?.url || '', v.id),
          sourceType: 'youtube',
          dateAdded: Date.now(),
        }));
    } catch {
      return [];
    }
  }

  public static async searchAlbums(query: string): Promise<AlbumItem[]> {
    if (!query.trim()) return [];
    const yt = await this.getSearchClient();
    try {
      const albumResult = await yt.music.search(query, { type: 'album' });
      const items = (albumResult.albums?.contents || []) as any[];
      return items
        .filter((item: any) => {
          const id = item.id || '';
          const title = item.title || '';
          const artist = item.artists?.[0]?.name || item.author?.name || '';
          // Strictly allow only real studio albums (MPREb_...) and non-blacklisted content
          return id.startsWith('MPREb_') && !this.isBlacklisted(title, artist);
        })
        .map((item: any) => {
          const id = item.id || '';
          const title = item.title || 'Unknown Album';
          const artist = item.artists?.[0]?.name || item.author?.name || 'Various Artists';
          const year = item.year || undefined;
          const rawThumb = item.thumbnails?.[0]?.url || item.thumbnails?.[item.thumbnails.length - 1]?.url || '';
          const thumb = this.upgradeThumbnailUrl(rawThumb);
          return {
            id,
            title,
            artist,
            year,
            thumbnailUrl: thumb,
          };
        });
    } catch (err) {
      console.warn('[Backend] searchAlbums failed:', err);
      return [];
    }
  }

  public static async searchArtists(query: string): Promise<ArtistItem[]> {
    if (!query.trim()) return [];
    const yt = await this.getSearchClient();
    try {
      const artistResult = await yt.music.search(query, { type: 'artist' });
      const items = (artistResult.artists?.contents || []) as any[];
      return items
        .filter((item: any) => {
          const name = item.name || '';
          return !this.isBlacklisted(name);
        })
        .map((item: any) => {
          const id = item.id || '';
          const name = item.name || 'Unknown Artist';
          const subscribers = item.subscribers || undefined;
          const rawThumb = item.thumbnails?.[0]?.url || item.thumbnails?.[item.thumbnails.length - 1]?.url || '';
          const thumb = this.upgradeThumbnailUrl(rawThumb);
          return {
            id,
            name,
            subscribers,
            thumbnailUrl: thumb,
          };
        });
    } catch (err) {
      console.warn('[Backend] searchArtists failed:', err);
      return [];
    }
  }

  public static async getAlbum(browseId: string): Promise<AlbumDetail> {
    const yt = await this.getSearchClient();
    try {
      const albumData = await yt.music.getAlbum(browseId);
      const header = albumData.header as any;
      const title = header?.title?.text || header?.title?.toString?.() || 'Unknown Album';
      const artist = header?.strapline_text_one?.text || header?.author?.name || 'Various Artists';
      const year = header?.subtitle?.text || undefined;
      const description = header?.description?.description?.text || header?.description?.text || undefined;
      const rawThumb = header?.thumbnail?.contents?.[0]?.url || header?.thumbnails?.[0]?.url || '';
      const coverUrl = this.upgradeThumbnailUrl(rawThumb);

      const tracks: Track[] = (albumData.contents || []).map((t: any) => {
        const id = t.id || '';
        const tTitle = t.title || 'Unknown Title';
        const tArtist = t.artists?.[0]?.name || artist;
        const duration = t.duration?.seconds || 180;
        const tThumb = t.thumbnails?.[0]?.url ? this.upgradeThumbnailUrl(t.thumbnails[0].url, id) : coverUrl;

        return {
          id,
          title: tTitle,
          artist: tArtist,
          album: title,
          duration,
          url: `https://www.youtube.com/watch?v=${id}`,
          thumbnailUrl: tThumb || coverUrl,
          sourceType: 'youtube',
          dateAdded: Date.now(),
        };
      });

      return {
        id: browseId,
        title,
        artist,
        year,
        description,
        coverUrl,
        trackCount: tracks.length,
        tracks,
      };
    } catch (err) {
      console.error(`[Backend] getAlbum(${browseId}) error:`, err);
      throw err;
    }
  }

  public static async getArtist(browseIdOrName: string): Promise<ArtistDetail> {
    const yt = await this.getSearchClient();
    let channelId = browseIdOrName;

    // If browseIdOrName is not a channel ID (UC... or FEmusic...), search for the artist first
    if (!channelId.startsWith('UC') && !channelId.startsWith('FEmusic')) {
      try {
        const searchRes = await yt.music.search(browseIdOrName, { type: 'artist' });
        const found = searchRes.artists?.contents?.[0];
        if (found?.id) {
          channelId = found.id;
        }
      } catch (err) {
        console.warn(`[Backend] Could not resolve channelId for ${browseIdOrName}:`, err);
      }
    }

    try {
      const artistData = await yt.music.getArtist(channelId);
      const header = artistData.header as any;
      const name = header?.title?.text || header?.title?.toString?.() || browseIdOrName;
      const description = header?.description?.text || header?.description?.toString?.() || undefined;
      const subscribers = header?.subscribers?.text || undefined;
      const rawThumb = header?.thumbnails?.[0]?.url || header?.thumbnail?.contents?.[0]?.url || '';
      const bannerUrl = this.upgradeThumbnailUrl(rawThumb);

      const topSongs: Track[] = [];
      const albums: AlbumItem[] = [];
      const singles: AlbumItem[] = [];
      const videos: VideoItem[] = [];
      const relatedArtists: ArtistItem[] = [];

      for (const sec of (artistData.sections || []) as any[]) {
        const secTitle = (sec.title?.text || sec.title?.toString?.() || sec.header?.title?.text || '').toLowerCase();
        const contents = sec.contents || [];

        if (secTitle.includes('top songs') || secTitle.includes('songs')) {
          for (const item of contents) {
            const id = item.id || item.endpoint?.payload?.videoId || '';
            const tTitle = typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString?.() || '');
            const tArtist = item.artists?.[0]?.name || item.author?.name || name;
            const duration = item.duration?.seconds || 180;
            const tThumb = this.upgradeThumbnailUrl(item.thumbnails?.[0]?.url || '', id);
            if (id && tTitle && !this.isBlacklisted(tTitle, tArtist)) {
              topSongs.push({
                id,
                title: tTitle,
                artist: tArtist,
                album: item.album?.name || undefined,
                duration,
                url: `https://www.youtube.com/watch?v=${id}`,
                thumbnailUrl: tThumb,
                sourceType: 'youtube',
                dateAdded: Date.now(),
              });
            }
          }
        } else if (secTitle.includes('albums')) {
          for (const item of contents) {
            const id = item.id || item.endpoint?.payload?.browseId || '';
            const aTitle = typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString?.() || '');
            const aArtist = item.artists?.[0]?.name || item.author?.name || name;
            const aYear = typeof item.year === 'string' ? item.year : (item.year?.text || item.subtitle?.text || undefined);
            const aThumb = this.upgradeThumbnailUrl(item.thumbnails?.[0]?.url || item.thumbnail?.contents?.[0]?.url || '');
            if (id && aTitle && !this.isBlacklisted(aTitle, aArtist)) {
              albums.push({
                id,
                title: aTitle,
                artist: aArtist,
                year: aYear,
                thumbnailUrl: aThumb,
              });
            }
          }
        } else if (secTitle.includes('singles') || secTitle.includes('eps')) {
          for (const item of contents) {
            const id = item.id || item.endpoint?.payload?.browseId || '';
            const sTitle = typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString?.() || '');
            const sArtist = item.artists?.[0]?.name || item.author?.name || name;
            const sYear = typeof item.year === 'string' ? item.year : (item.year?.text || item.subtitle?.text || undefined);
            const sThumb = this.upgradeThumbnailUrl(item.thumbnails?.[0]?.url || item.thumbnail?.contents?.[0]?.url || '');
            if (id && sTitle && !this.isBlacklisted(sTitle, sArtist)) {
              singles.push({
                id,
                title: sTitle,
                artist: sArtist,
                year: sYear,
                thumbnailUrl: sThumb,
              });
            }
          }
        } else if (secTitle.includes('videos')) {
          for (const item of contents) {
            const id = item.id || item.endpoint?.payload?.videoId || '';
            const vTitle = typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString?.() || '');
            const vArtist = item.artists?.[0]?.name || item.author?.name || name;
            const vThumb = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
            if (id && vTitle && !this.isBlacklisted(vTitle, vArtist)) {
              videos.push({
                id,
                title: vTitle,
                artist: vArtist,
                thumbnailUrl: vThumb,
                duration: item.duration?.seconds || 240,
              });
            }
          }
        } else if (secTitle.includes('fans might also like') || secTitle.includes('similar')) {
          for (const item of contents) {
            const id = item.id || item.endpoint?.payload?.browseId || '';
            const rName = typeof item.title === 'string' ? item.title : (item.title?.text || item.title?.toString?.() || item.name || '');
            const rThumb = this.upgradeThumbnailUrl(item.thumbnails?.[0]?.url || item.thumbnail?.contents?.[0]?.url || '');
            if (id && rName && !this.isBlacklisted(rName)) {
              relatedArtists.push({
                id,
                name: rName,
                subscribers: item.subscribers || undefined,
                thumbnailUrl: rThumb,
              });
            }
          }
        }
      }

      return {
        id: channelId,
        name,
        description,
        subscribers,
        bannerUrl,
        topSongs,
        albums,
        singles,
        videos,
        relatedArtists,
      };
    } catch (err) {
      console.error(`[Backend] getArtist(${browseIdOrName}) error:`, err);
      throw err;
    }
  }

  public static async getHomeFeed(): Promise<HomeFeedData> {
    if (this.cachedHomeFeed && this.cachedHomeFeed.expiresAt > Date.now()) {
      return this.cachedHomeFeed.data;
    }

    const yt = await this.getSearchClient();
    const TOP_MAINSTREAM_ARTISTS = [
      'The Weeknd',
      'Billie Eilish',
      'Sabrina Carpenter',
      'Bruno Mars',
      'Lady Gaga',
      'Dua Lipa',
      'Charli xcx',
      'Taylor Swift',
      'Kendrick Lamar',
      'Olivia Rodrigo',
      'Ariana Grande',
      'Coldplay',
    ];

    const newReleases: Track[] = [];
    const latestAlbums: AlbumItem[] = [];
    const musicVideos: VideoItem[] = [];

    // 1. Fetch Real Studio Albums from top artists
    for (const artist of TOP_MAINSTREAM_ARTISTS.slice(0, 6)) {
      try {
        const res = await yt.music.search(`${artist} album`, { type: 'album' });
        const items = res.albums?.contents || [];
        for (const it of items as any[]) {
          const title = it.title || '';
          const artistName = it.artists?.[0]?.name || it.author?.name || artist;
          const id = it.id || '';
          if (id.startsWith('MPREb_') && !this.isBlacklisted(title, artistName)) {
            const rawThumb = it.thumbnails?.[0]?.url || it.thumbnails?.[it.thumbnails.length - 1]?.url || '';
            latestAlbums.push({
              id,
              title,
              artist: artistName,
              year: it.year || '2025',
              thumbnailUrl: this.upgradeThumbnailUrl(rawThumb),
            });
            break;
          }
        }
      } catch {}
    }

    // 2. Fetch Real New Releases Songs
    for (const artist of TOP_MAINSTREAM_ARTISTS.slice(0, 8)) {
      try {
        const res = await yt.music.search(artist, { type: 'song' });
        const items = res.songs?.contents || [];
        for (const it of items as any[]) {
          const id = it.id || '';
          const title = it.title || '';
          const artistName = it.artists?.[0]?.name || it.author?.name || artist;
          if (id && !this.isBlacklisted(title, artistName)) {
            const rawThumb = it.thumbnails?.[0]?.url || '';
            newReleases.push({
              id,
              title,
              artist: artistName,
              album: it.album?.name,
              duration: it.duration?.seconds || 210,
              url: `https://www.youtube.com/watch?v=${id}`,
              thumbnailUrl: this.upgradeThumbnailUrl(rawThumb, id),
              sourceType: 'youtube',
              dateAdded: Date.now(),
            });
            break;
          }
        }
      } catch {}
    }

    // 3. Fetch Real Music Videos (16:9 landscape)
    const VIDEO_QUERIES = [
      'The Weeknd official music video',
      'Billie Eilish official music video',
      'Sabrina Carpenter official music video',
      'Bruno Mars Lady Gaga official music video',
      'Dua Lipa official music video',
      'Charli xcx official music video',
    ];

    for (const query of VIDEO_QUERIES) {
      try {
        const res = await yt.music.search(query, { type: 'video' });
        const items = res.videos?.contents || [];
        for (const it of items as any[]) {
          const id = it.id || '';
          const title = it.title || '';
          const artistName = it.artists?.[0]?.name || it.author?.name || query.split(' ')[0];
          if (id && !this.isBlacklisted(title, artistName)) {
            musicVideos.push({
              id,
              title: title.replace(/\s*\(Official.*?\)/i, '').trim(),
              artist: artistName,
              year: '2025',
              thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
              duration: it.duration?.seconds || 240,
            });
            break;
          }
        }
      } catch {}
    }

    // 4. Fetch Real Top Artists
    const topArtists: ArtistItem[] = [];
    const TOP_ARTISTS_NAMES = ['Sabrina Carpenter', 'The Weeknd', 'Billie Eilish', 'Bruno Mars', 'Dua Lipa', 'Lady Gaga'];
    for (const artistName of TOP_ARTISTS_NAMES) {
      try {
        const res = await yt.music.search(artistName, { type: 'artist' });
        const items = res.artists?.contents || [];
        for (const it of items as any[]) {
          const id = it.id || '';
          const name = it.name || artistName;
          if (id && !this.isBlacklisted(name)) {
            const rawThumb = it.thumbnails?.[0]?.url || it.thumbnails?.[it.thumbnails.length - 1]?.url || '';
            topArtists.push({
              id,
              name,
              subscribers: it.subscribers,
              thumbnailUrl: this.upgradeThumbnailUrl(rawThumb),
            });
            break;
          }
        }
      } catch {}
    }

    const homeData: HomeFeedData = {
      newReleases,
      latestAlbums,
      musicVideos,
      topArtists,
    };

    this.cachedHomeFeed = {
      data: homeData,
      expiresAt: Date.now() + 60 * 60 * 1000, // Cache 1 hour
    };

    return homeData;
  }

  public static async getMusicVideos(): Promise<VideoItem[]> {
    const feed = await this.getHomeFeed();
    return feed.musicVideos;
  }

  public static async prewarmAudio(videoIds: string[]): Promise<void> {
    for (const id of videoIds) {
      if (!id || this.streamUrlCache.has(id)) continue;
      this.resolveAudio(id).catch((err) => {
        console.warn(`[Backend] Background pre-warm failed for ${id}:`, err?.message || err);
      });
    }
  }

  public static async resolveAudio(videoId: string, forceYtDlp = false): Promise<{ url: string; duration: number; title?: string; artist?: string }> {
    // 1. Check in-memory cache
    if (!forceYtDlp) {
      const cached = this.streamUrlCache.get(videoId);
      if (cached && cached.expiresAt > Date.now()) {
        return { url: cached.url, duration: cached.duration };
      }
    }

    let streamUrl = '';
    let duration = 0;
    let title: string | undefined;
    let artist: string | undefined;

    // 2. Fast Path: In-Process Innertube iOS Client (~150-250ms instant resolution)
    if (!forceYtDlp) {
      try {
        const streamYt = await this.getStreamClient();
        const info = await streamYt.getBasicInfo(videoId);
        duration = info.basic_info.duration || 180;
        title = info.basic_info.title;
        artist = info.basic_info.author;

        const format = info.chooseFormat({
          type: 'audio',
          quality: 'best',
        });

        if (format && format.url) {
          streamUrl = format.url;
          console.log(`[Backend] Innertube fast-resolved audio stream for ${videoId} (~200ms)`);
        }
      } catch (ytErr: any) {
        console.warn(`[Backend] Innertube fast-resolve failed for ${videoId}:`, ytErr?.message || ytErr);
      }
    }

    // 3. Fallback: Dedicated yt-dlp binary if Innertube fails or format was 403
    if (!streamUrl) {
      const possibleBinPaths = [
        path.resolve(process.cwd(), 'server', 'bin', 'yt-dlp.exe'),
        path.resolve(process.cwd(), 'bin', 'yt-dlp.exe'),
        path.resolve(process.cwd(), '..', 'bin', 'yt-dlp.exe'),
      ];
      const binPath = possibleBinPaths.find((p) => fs.existsSync(p));

      if (binPath) {
        try {
          console.log(`[Backend] Spawning yt-dlp fallback for ${videoId}...`);
          const { stdout } = await execFileAsync(binPath, [
            '-f', 'bestaudio',
            '-g',
            `https://www.youtube.com/watch?v=${videoId}`,
          ]);
          const lines = stdout.trim().split('\n').map((l) => l.trim()).filter((l) => l.startsWith('http'));
          if (lines.length > 0) {
            streamUrl = lines[0];
            console.log(`[Backend] yt-dlp fallback resolved direct audio stream for ${videoId}`);
          }
        } catch (err: any) {
          console.warn(`[Backend] yt-dlp failed for ${videoId}:`, err?.message || err);
        }
      }
    }

    if (!streamUrl) {
      throw new Error(`Tidak dapat menyelesaikan stream audio untuk video ID: ${videoId}`);
    }

    // Cache valid stream URL for 4 hours
    this.streamUrlCache.set(videoId, {
      url: streamUrl,
      duration: duration || 210,
      expiresAt: Date.now() + 4 * 3600 * 1000,
    });

    return { url: streamUrl, duration, title, artist };
  }

  public static async proxyStream(videoId: string, rangeHeader: string | undefined, res: Response): Promise<void> {
    try {
      let resolved = await this.resolveAudio(videoId);

      const fetchHeaders: Record<string, string> = {};
      if (rangeHeader) {
        fetchHeaders['Range'] = rangeHeader;
      }

      let upstreamRes = await fetch(resolved.url, {
        headers: fetchHeaders,
      });

      // If upstream URL has expired or returned 403 Forbidden, force yt-dlp fallback!
      if (!upstreamRes.ok && upstreamRes.status !== 206) {
        console.warn(`[Backend] Upstream HTTP ${upstreamRes.status} for ${videoId}, falling back to yt-dlp...`);
        this.streamUrlCache.delete(videoId);
        resolved = await this.resolveAudio(videoId, true);
        upstreamRes = await fetch(resolved.url, {
          headers: fetchHeaders,
        });
        if (!upstreamRes.ok && upstreamRes.status !== 206) {
          throw new Error(`Upstream returned HTTP ${upstreamRes.status}`);
        }
      }

      const status = upstreamRes.status;
      const contentType = upstreamRes.headers.get('content-type') || 'audio/webm';
      const contentLength = upstreamRes.headers.get('content-length');
      const contentRange = upstreamRes.headers.get('content-range');
      const acceptRanges = upstreamRes.headers.get('accept-ranges') || 'bytes';

      res.status(status);
      res.setHeader('Content-Type', contentType);
      res.setHeader('Accept-Ranges', acceptRanges);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Authorization');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
      res.setHeader('Cache-Control', 'public, max-age=7200');

      if (contentLength) res.setHeader('Content-Length', contentLength);
      if (contentRange) res.setHeader('Content-Range', contentRange);

      if (!upstreamRes.body) {
        res.end();
        return;
      }

      const reader = upstreamRes.body.getReader();
      const pump = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            if (!res.write(value)) {
              await new Promise<void>((resolve) => res.once('drain', resolve));
            }
          }
          res.end();
        } catch {
          res.end();
        }
      };

      pump();
    } catch (e: any) {
      console.error('[Backend] proxyStream error:', e);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Gagal mem-proxy audio stream', details: e?.message });
      } else {
        res.end();
      }
    }
  }
}
