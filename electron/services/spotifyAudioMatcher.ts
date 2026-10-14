import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { YTMusicClient, YTMusicTrackItem } from './ytMusicClient';
import { YouTubeService } from './youtubeService';

export interface MatchedAudioResult {
  spotifyId: string;
  ytUrl: string;
  videoId: string;
  matchedTitle: string;
  matchedArtist: string;
  duration: number;
}

export class SpotifyAudioMatcher {
  private cacheFile: string;
  private memoryCache: Map<string, MatchedAudioResult> = new Map();
  private pendingPromises: Map<string, Promise<MatchedAudioResult | null>> = new Map();

  constructor() {
    const userData = app.getPath('userData');
    this.cacheFile = path.join(userData, 'spotify_yt_matches.json');
    this.loadCache();
  }

  private loadCache(): void {
    try {
      if (fs.existsSync(this.cacheFile)) {
        const raw = fs.readFileSync(this.cacheFile, 'utf-8');
        const data = JSON.parse(raw);
        if (typeof data === 'object' && data !== null) {
          for (const [k, v] of Object.entries(data)) {
            this.memoryCache.set(k, v as MatchedAudioResult);
          }
        }
      }
    } catch (e) {
      console.error('Error loading Spotify audio match cache:', e);
    }
  }

  private saveCache(): void {
    try {
      const obj: Record<string, MatchedAudioResult> = {};
      for (const [k, v] of this.memoryCache.entries()) {
        obj[k] = v;
      }
      fs.writeFileSync(this.cacheFile, JSON.stringify(obj, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving Spotify audio match cache:', e);
    }
  }

  /**
   * Cleans artist and title strings for optimal search matching
   */
  private cleanQuery(title: string, artist: string): string {
    const cleanArt = (artist || '').replace(/\s*,\s*/g, ' ').replace(/\s+feat\..*$/i, '').trim();
    const cleanTit = (title || '').replace(/\s*[\(\[](feat\.|ft\.|with).*?[\)\]]/gi, '').trim();
    return cleanArt ? `${cleanArt} ${cleanTit}` : cleanTit;
  }

  /**
   * Fast matching algorithm: Finds best YouTube audio for a Spotify track
   */
  public async matchTrack(track: {
    id?: string;
    spotifyId?: string;
    title: string;
    artist: string;
    duration: number;
  }): Promise<MatchedAudioResult | null> {
    const spId = track.spotifyId || track.id;
    if (!spId || !track.title) return null;

    // 1. Instant Cache check (0ms)
    if (this.memoryCache.has(spId)) {
      return this.memoryCache.get(spId)!;
    }

    // 2. Prevent duplicate concurrent requests for the same track
    if (this.pendingPromises.has(spId)) {
      return await this.pendingPromises.get(spId)!;
    }

    const matchPromise = (async (): Promise<MatchedAudioResult | null> => {
      try {
        const queryBase = this.cleanQuery(track.title, track.artist);
        const searchQuery = `${queryBase} Topic`;

        // Attempt 1: Fast HTTP InnerTube search via YTMusicClient (200-400ms)
        let candidates: YTMusicTrackItem[] = [];
        try {
          candidates = await YTMusicClient.search(searchQuery);
        } catch {
          // If song-filtered search fails, try regular search query
          try {
            candidates = await YTMusicClient.search(queryBase);
          } catch {}
        }

        if (candidates && candidates.length > 0) {
          const targetDuration = track.duration || 0;
          let bestCandidate: YTMusicTrackItem | null = null;
          let lowestScore = 999999;

          for (const cand of candidates) {
            const candDuration = cand.duration || 0;
            const durDiff = Math.abs(candDuration - targetDuration);

            // Channel & title check
            const artistLower = (track.artist || '').toLowerCase();
            const channelLower = (cand.artist || '').toLowerCase();
            const titleLower = (cand.title || '').toLowerCase();
            const isTopic = channelLower.includes('topic') || channelLower.includes(artistLower);

            // Penalty score calculation (lower is better)
            let score = durDiff;

            // Heavily reward official Topic channels
            if (isTopic) score -= 10;

            // Penalize live/cover/karaoke/remix if original was not
            const isLive = /live|concert|tour|acoustic/i.test(titleLower) && !/live|concert/i.test(track.title);
            if (isLive) score += 30;

            if (score < lowestScore) {
              lowestScore = score;
              bestCandidate = cand;
            }
          }

          if (bestCandidate && bestCandidate.id) {
            const result: MatchedAudioResult = {
              spotifyId: spId,
              ytUrl: `https://www.youtube.com/watch?v=${bestCandidate.id}`,
              videoId: bestCandidate.id,
              matchedTitle: bestCandidate.title,
              matchedArtist: bestCandidate.artist,
              duration: bestCandidate.duration || targetDuration,
            };

            this.memoryCache.set(spId, result);
            this.saveCache();
            return result;
          }
        }

        // Attempt 2: Fallback to YouTubeService resolveStudioAudio (yt-dlp)
        const fallback = await YouTubeService.resolveStudioAudio(track.artist, track.title);
        if (fallback && fallback.url) {
          const vId = YouTubeService.extractVideoId(fallback.url) || fallback.url;
          const result: MatchedAudioResult = {
            spotifyId: spId,
            ytUrl: fallback.url,
            videoId: vId,
            matchedTitle: fallback.title || track.title,
            matchedArtist: fallback.artist || track.artist,
            duration: fallback.duration || track.duration,
          };

          this.memoryCache.set(spId, result);
          this.saveCache();
          return result;
        }
      } catch (err) {
        console.error(`Error matching Spotify track ${track.title} to YouTube:`, err);
      } finally {
        this.pendingPromises.delete(spId);
      }

      return null;
    })();

    this.pendingPromises.set(spId, matchPromise);
    return await matchPromise;
  }

  /**
   * Pre-matches a batch of upcoming tracks in background for instant 0ms playback transitions
   */
  public preMatchBatch(
    tracks: Array<{ id?: string; spotifyId?: string; title: string; artist: string; duration: number }>
  ): void {
    if (!tracks || tracks.length === 0) return;

    // Process top 3 un-cached tracks in the background
    const uncached = tracks
      .filter((t) => {
        const id = t.spotifyId || t.id;
        return id && !this.memoryCache.has(id);
      })
      .slice(0, 3);

    uncached.forEach((t) => {
      this.matchTrack(t).catch(() => {});
    });
  }
}
