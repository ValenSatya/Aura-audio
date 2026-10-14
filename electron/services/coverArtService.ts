import https from 'https';
import http from 'http';

interface CoverCacheItem {
  coverUrl: string;
  source: 'itunes' | 'deezer' | 'ytmusic' | 'fallback';
  timestamp: number;
}

// In-memory cache for fast lookups
const memoryCache = new Map<string, CoverCacheItem>();

/**
 * Normalizes title and artist strings to remove YouTube video noise
 * e.g., "Nujabes - Luv (Sic) [Official Music Video]" -> "Luv (Sic)" & "Nujabes"
 */
export function cleanMusicMetadata(title: string, artist: string): { cleanTitle: string; cleanArtist: string } {
  let cleanTitle = title || '';
  let cleanArtist = artist || '';

  // If artist is inside title (e.g., "Artist - Title")
  if (cleanTitle.includes(' - ') && (!cleanArtist || cleanArtist === 'YouTube Artist' || cleanArtist.includes('Topic') || cleanArtist.includes('VEVO'))) {
    const parts = cleanTitle.split(' - ');
    if (parts.length >= 2) {
      cleanArtist = parts[0].trim();
      cleanTitle = parts.slice(1).join(' - ').trim();
    }
  }

  // Remove common YouTube video suffixes and noise
  cleanTitle = cleanTitle
    .replace(/\s*(\(|\[)(official\s*(music\s*)?video|video|audio|official\s*audio|lyric(s)?(\s*video)?|visualizer|mv|hd|hq|4k|remastered|remaster\s*\d*|prod\..*?|clip\s*officiel|video\s*clip|live|performance).*?(\)|\])/gi, '')
    .replace(/ft\..*?|feat\..*?/gi, '') // simplify search term
    .replace(/[|#@].*$/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Clean artist noise (e.g. "Artist - Topic", "ArtistVEVO")
  cleanArtist = cleanArtist
    .replace(/(\s*-\s*topic|\s*vevo)$/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  return { cleanTitle: cleanTitle || title, cleanArtist: cleanArtist || artist };
}

/**
 * Perform a simple JSON GET request
 */
function fetchJson(url: string, timeoutMs = 4000): Promise<any> {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;

    const req = client.get(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AuraMusic/1.0',
          Accept: 'application/json',
        },
      },
      (res) => {
        if (res.statusCode && (res.statusCode < 200 || res.statusCode >= 300)) {
          return resolve(null);
        }

        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });

        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve(data);
          } catch {
            resolve(null);
          }
        });
      }
    );

    req.setTimeout(timeoutMs, () => {
      req.destroy();
      resolve(null);
    });

    req.on('error', () => {
      resolve(null);
    });
  });
}

/**
 * Lookup Apple iTunes Search API for official 600x600/1000x1000 studio album cover art
 */
async function searchItunesCover(cleanTitle: string, cleanArtist: string): Promise<string | null> {
  try {
    const query = `${cleanArtist} ${cleanTitle}`.trim();
    if (!query) return null;

    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=1`;
    const res = await fetchJson(url);

    if (res && res.results && res.results.length > 0) {
      const first = res.results[0];
      const artwork = first.artworkUrl100 || first.artworkUrl60;
      if (artwork) {
        // Upgrade 100x100 artwork to crisp 600x600 high resolution
        return artwork.replace('100x100bb', '600x600bb').replace('60x60bb', '600x600bb');
      }
    }
  } catch {}
  return null;
}

/**
 * Fallback to Deezer Search API for official high resolution album cover art
 */
async function searchDeezerCover(cleanTitle: string, cleanArtist: string): Promise<string | null> {
  try {
    const query = `${cleanArtist} ${cleanTitle}`.trim();
    if (!query) return null;

    const url = `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=1`;
    const res = await fetchJson(url);

    if (res && res.data && res.data.length > 0) {
      const first = res.data[0];
      if (first.album) {
        return first.album.cover_xl || first.album.cover_big || first.album.cover_medium || null;
      }
    }
  } catch {}
  return null;
}

/**
 * Main Resolver: Resolves genuine official album cover art
 */
export async function resolveOfficialCover(title: string, artist: string, fallbackThumb?: string): Promise<string> {
  const cacheKey = `${(title || '').toLowerCase()}:::${(artist || '').toLowerCase()}`;
  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey)!.coverUrl;
  }

  const { cleanTitle, cleanArtist } = cleanMusicMetadata(title, artist);

  // 1. Try Apple iTunes Search API (Best quality, strictly official album covers)
  let coverUrl = await searchItunesCover(cleanTitle, cleanArtist);

  // 2. Try Deezer Search API if iTunes returned nothing
  if (!coverUrl) {
    coverUrl = await searchDeezerCover(cleanTitle, cleanArtist);
  }

  // 3. If still nothing, check if the fallback thumbnail is already a high-res square Google/YouTube Music release
  if (!coverUrl && fallbackThumb) {
    if (fallbackThumb.includes('googleusercontent.com')) {
      // Upgrade YouTube Music official track cover to large square
      coverUrl = fallbackThumb.replace(/=w\d+-h\d+.*$/, '=w600-h600-l90-rj');
    } else {
      coverUrl = fallbackThumb;
    }
  }

  const finalUrl = coverUrl || fallbackThumb || '';

  if (finalUrl) {
    memoryCache.set(cacheKey, {
      coverUrl: finalUrl,
      source: coverUrl ? 'itunes' : 'fallback',
      timestamp: Date.now(),
    });
  }

  return finalUrl;
}
