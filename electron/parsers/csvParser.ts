import Papa from 'papaparse';
import * as path from 'path';

export interface ParsedCSVEntry {
  title: string;
  artist: string;
  album?: string;
  url: string;
  duration: number;
  sourceType: 'local' | 'stream' | 'youtube';
}

export function parseCSVContent(content: string, baseDir: string = ''): ParsedCSVEntry[] {
  const parsed = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const results: ParsedCSVEntry[] = [];
  const rows = parsed.data as Record<string, any>[];

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;

    // Normalize keys to lowercase for flexible matching
    const normalized: Record<string, any> = {};
    for (const [key, val] of Object.entries(row)) {
      normalized[key.trim().toLowerCase()] = val;
    }

    // Match URL or file path
    const rawUrl =
      normalized['url'] ||
      normalized['path'] ||
      normalized['file'] ||
      normalized['file_path'] ||
      normalized['source'] ||
      normalized['link'] ||
      normalized['uri'] ||
      '';

    const urlStr = String(rawUrl || '').trim();
    if (!urlStr) continue;

    // Detect source type
    let sourceType: 'local' | 'stream' | 'youtube' = 'local';
    let resolvedUrl = urlStr;

    if (/youtube\.com|youtu\.be/i.test(urlStr)) {
      sourceType = 'youtube';
    } else if (/^https?:\/\//i.test(urlStr)) {
      sourceType = 'stream';
    } else {
      sourceType = 'local';
      if (baseDir && !path.isAbsolute(urlStr)) {
        resolvedUrl = path.resolve(baseDir, urlStr);
      }
    }

    // Match Title
    const rawTitle =
      normalized['title'] ||
      normalized['judul'] ||
      normalized['name'] ||
      normalized['track'] ||
      normalized['track_name'] ||
      normalized['song'] ||
      '';

    let title = String(rawTitle).trim();
    if (!title) {
      const baseName = path.basename(urlStr).replace(/\.[^/.]+$/, '');
      title = decodeURIComponent(baseName) || 'Untitled Track';
    }

    // Match Artist
    const rawArtist =
      normalized['artist'] ||
      normalized['penyanyi'] ||
      normalized['artist_name'] ||
      normalized['singer'] ||
      normalized['creator'] ||
      normalized['channel'] ||
      '';
    const artist = String(rawArtist).trim() || 'Unknown Artist';

    // Match Album
    const album = normalized['album'] ? String(normalized['album']).trim() : undefined;

    // Match Duration
    const rawDuration = normalized['duration'] || normalized['durasi'] || normalized['length'] || normalized['time'];
    let duration = 0;
    if (typeof rawDuration === 'number') {
      duration = rawDuration;
    } else if (typeof rawDuration === 'string') {
      // Check for mm:ss or hh:mm:ss
      if (rawDuration.includes(':')) {
        const parts = rawDuration.split(':').map(Number);
        if (parts.length === 2) {
          duration = parts[0] * 60 + parts[1];
        } else if (parts.length === 3) {
          duration = parts[0] * 3600 + parts[1] * 60 + parts[2];
        }
      } else {
        const num = parseFloat(rawDuration);
        if (!isNaN(num)) duration = num;
      }
    }

    results.push({
      title,
      artist,
      album,
      url: resolvedUrl,
      duration,
      sourceType,
    });
  }

  return results;
}
