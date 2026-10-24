import { spawn } from 'child_process';
import * as fs from 'fs';
import { getYtDlpPath } from './ytdlpHelper';

export interface YouTubeInfo {
  id: string;
  title: string;
  artist: string;
  duration: number;
  thumbnailUrl: string;
  url: string;
}

export class YouTubeService {
  private static urlCache: Map<string, { streamUrl: string; expiresAt: number }> = new Map();
  private static pendingPromises: Map<string, Promise<string>> = new Map();

  private static pruneCache(): void {
    const now = Date.now();
    for (const [k, v] of this.urlCache.entries()) {
      if (v.expiresAt <= now) {
        this.urlCache.delete(k);
      }
    }
    if (this.urlCache.size > 200) {
      const oldestKeys = Array.from(this.urlCache.keys()).slice(0, 50);
      for (const k of oldestKeys) {
        this.urlCache.delete(k);
      }
    }
  }

  public static isValidURL(url: string): boolean {
    if (!url) return false;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return true;
    return /(?:youtube\.com|youtu\.be|youtube-nocookie\.com)/i.test(trimmed);
  }

  public static extractVideoId(url: string): string | null {
    if (!url) return null;
    const trimmed = url.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) return trimmed;
    const match = trimmed.match(/(?:v=|\/shorts\/|\/embed\/|youtu\.be\/|\/v\/)([a-zA-Z0-9_-]{11})/);
    return match ? match[1] : null;
  }

  public static invalidateCache(url: string): void {
    if (!url) return;
    const videoId = this.extractVideoId(url);
    if (videoId) {
      this.urlCache.delete(`https://www.youtube.com/watch?v=${videoId}`);
    }
    this.urlCache.delete(url);
  }

  private static runYtDlpStream(targetUrl: string, cookiesPath?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const ytdl = getYtDlpPath();
      const args = [
        '-g',
        '-f',
        'bestaudio[ext=m4a]/bestaudio/best',
        '--no-playlist',
        '--no-warnings',
        '--force-ipv4',
        '--no-cache-dir',
        '--no-part',
        '--prefer-free-formats',
        '--socket-timeout',
        '8',
        '--extractor-args',
        'youtube:player_client=android,web',
      ];

      if (cookiesPath && fs.existsSync(cookiesPath)) {
        args.push('--cookies', cookiesPath);
      }

      args.push(targetUrl);

      const proc = spawn(ytdl, args);
      let stdout = '';
      let stderr = '';
      let isSettled = false;

      const timer = setTimeout(() => {
        if (!isSettled) {
          isSettled = true;
          try {
            proc.kill('SIGKILL');
          } catch {}
          reject(new Error('Pencarian stream audio time out (20s)'));
        }
      }, 20000);

      proc.stdout.on('data', (d) => {
        stdout += d.toString();
      });

      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('close', (code) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);

        if (code !== 0 || !stdout.trim()) {
          return reject(new Error(stderr || `Gagal mengekstrak stream audio (code ${code})`));
        }

        const lines = stdout.trim().split(/\r?\n/).map((l) => l.trim()).filter((l) => l.length > 0);
        if (lines.length === 0) {
          return reject(new Error('Tidak ada stream URL yang dikembalikan yt-dlp'));
        }
        resolve(lines[0]);
      });

      proc.on('error', (err) => {
        if (isSettled) return;
        isSettled = true;
        clearTimeout(timer);
        reject(err);
      });
    });
  }

  public static async resolveStreamUrl(videoUrl: string, cookiesPath?: string): Promise<string> {
    if (!videoUrl) return '';

    // Direct return for local or already direct CDN URLs
    if (videoUrl.startsWith('http://127.0.0.1') || videoUrl.includes('googlevideo.com')) {
      return videoUrl;
    }

    if (!this.isValidURL(videoUrl)) {
      return videoUrl;
    }

    // Extract video ID to canonicalize URL and avoid querying full playlists
    const videoId = this.extractVideoId(videoUrl);
    const targetUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : videoUrl;

    const cached = this.urlCache.get(targetUrl) || this.urlCache.get(videoUrl);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.streamUrl;
    }

    if (this.pendingPromises.has(targetUrl)) {
      return this.pendingPromises.get(targetUrl)!;
    }

    const promise = (async () => {
      try {
        // ALWAYS try WITHOUT cookies first: Public streams never need cookies, and browser
        // session cookies frequently trigger YouTube's "The page needs to be reloaded" bot shield.
        let directUrl: string;
        try {
          directUrl = await this.runYtDlpStream(targetUrl);
        } catch (firstErr: any) {
          // If public resolution failed and user has cookies (e.g. member-only or age-restricted), retry with cookies
          if (cookiesPath && fs.existsSync(cookiesPath)) {
            console.warn('Public stream resolution failed, attempting with cookies:', firstErr.message);
            directUrl = await this.runYtDlpStream(targetUrl, cookiesPath);
          } else {
            throw firstErr;
          }
        }

        // Cache for 5 hours across both canonical and original URL
        this.pruneCache();
        const cacheEntry = {
          streamUrl: directUrl,
          expiresAt: Date.now() + 5 * 3600 * 1000,
        };
        this.urlCache.set(targetUrl, cacheEntry);
        this.urlCache.set(videoUrl, cacheEntry);

        return directUrl;
      } finally {
        this.pendingPromises.delete(targetUrl);
      }
    })();

    this.pendingPromises.set(targetUrl, promise);
    return promise;
  }

  private static runYtDlpInfo(targetUrl: string, cookiesPath?: string): Promise<YouTubeInfo> {
    return new Promise((resolve, reject) => {
      const ytdl = getYtDlpPath();
      const args = [
        '-j',
        '--skip-download',
        '--no-playlist',
        '--no-warnings',
        '--force-ipv4',
      ];

      if (cookiesPath && fs.existsSync(cookiesPath)) {
        args.push('--cookies', cookiesPath);
      }

      args.push(targetUrl);

      const proc = spawn(ytdl, args);
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (chunk) => {
        stdout += chunk;
      });

      proc.stderr.on('data', (chunk) => {
        stderr += chunk;
      });

      proc.on('close', (code) => {
        if (code !== 0) {
          return reject(new Error(`Gagal membaca info YouTube: ${stderr || 'Exit code ' + code}`));
        }

        try {
          const data = JSON.parse(stdout);
          const thumbnails = data.thumbnails || [];
          const bestThumb = thumbnails.length > 0 ? thumbnails[thumbnails.length - 1].url : (data.thumbnail || '');

          resolve({
            id: data.id || String(Date.now()),
            title: data.title || 'YouTube Track',
            artist: data.uploader || data.channel || data.artist || 'YouTube Artist',
            duration: Math.round(data.duration || 0),
            thumbnailUrl: bestThumb,
            url: data.webpage_url || targetUrl,
          });
        } catch (e: any) {
          reject(new Error(`Gagal mem-parsing data YouTube: ${e.message}`));
        }
      });

      proc.on('error', (err) => {
        reject(new Error(`Gagal menjalankan yt-dlp: ${err.message}`));
      });
    });
  }

  public static async getInfo(url: string, cookiesPath?: string): Promise<YouTubeInfo> {
    const videoId = this.extractVideoId(url);
    const targetUrl = videoId ? `https://www.youtube.com/watch?v=${videoId}` : url;

    try {
      return await this.runYtDlpInfo(targetUrl);
    } catch (firstErr: any) {
      if (cookiesPath && fs.existsSync(cookiesPath)) {
        return await this.runYtDlpInfo(targetUrl, cookiesPath);
      }
      throw firstErr;
    }
  }

  public static async resolveStudioAudio(
    artist: string,
    title: string,
    currentUrl?: string
  ): Promise<{ url: string; title?: string; artist?: string; duration?: number; foundStudio: boolean }> {
    const fallback = {
      url: currentUrl || '',
      title: title || '',
      artist: artist || '',
      foundStudio: false,
    };

    if (!title.trim()) return fallback;

    const cleanArt = (artist || '').trim();
    const cleanTit = (title || '').trim();
    const query = cleanArt ? `${cleanArt} ${cleanTit} Topic` : `${cleanTit} Official Audio`;

    return new Promise((resolve) => {
      const ytdl = getYtDlpPath();
      const args = [
        '--flat-playlist',
        '-j',
        '--no-playlist',
        '--no-warnings',
        `ytsearch5:${query}`,
      ];

      const proc = spawn(ytdl, args);
      let stdout = '';

      proc.stdout.on('data', (chunk) => {
        stdout += chunk;
      });

      const timer = setTimeout(() => {
        try {
          proc.kill();
        } catch {}
        resolve(fallback);
      }, 7000);

      proc.on('close', (code) => {
        clearTimeout(timer);
        if (code !== 0 || !stdout.trim()) {
          return resolve(fallback);
        }

        const lines = stdout.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
        let bestMatch: any = null;

        for (const line of lines) {
          try {
            const item = JSON.parse(line);
            const uploader = (item.uploader || item.channel || '').toLowerCase();
            const ititle = (item.title || '').toLowerCase();

            const isTopic = uploader.includes('topic') || (item.description && item.description.includes('Provided to YouTube by'));
            const isMv = /official\s*(?:music\s*)?video|music\s*video|\bmv\b|\bm\/v\b|\bpv\b/i.test(ititle);

            if (isTopic) {
              bestMatch = item;
              break;
            } else if (!isMv && !bestMatch) {
              bestMatch = item;
            }
          } catch {}
        }

        if (bestMatch && bestMatch.id) {
          return resolve({
            url: `https://www.youtube.com/watch?v=${bestMatch.id}`,
            title: bestMatch.title || title,
            artist: bestMatch.uploader || bestMatch.channel || artist,
            duration: Math.round(bestMatch.duration || 0),
            foundStudio: true,
          });
        }

        resolve(fallback);
      });

      proc.on('error', () => {
        clearTimeout(timer);
        resolve(fallback);
      });
    });
  }
}

