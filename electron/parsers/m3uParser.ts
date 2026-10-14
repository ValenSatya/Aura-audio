import * as path from 'path';

export interface ParsedM3UEntry {
  title: string;
  artist: string;
  url: string;
  duration: number;
  sourceType: 'local' | 'stream' | 'youtube';
}

function cleanScrapedPrefix(text: string): string {
  // Cleans scraped view counts like "20 jt pemutaran;Lyn" while preserving artist names starting with numbers (e.g. "9Lana", "50 Cent")
  return text.replace(/^[\d.,\s\u00a0]+(?:(?:jt|rb|k|m|b)\s*)?(?:views?|pemutaran|tontonan)\s*[;•·-]?\s*/gi, '').trim();
}

function cleanTitleNoise(title: string): string {
  // Cleans MV and video markers from titles: (Official Music Video), (Official Video), [MV], 【MV】, etc.
  return title
    .replace(/\s*[\(\[\{【（](?:official\s*(?:music\s*)?video|official\s*audio|official\s*mv|music\s*video|lyric\s*video|mv|m\/v|pv|full\s*ver(?:sion)?)[\)\]\}】）]/gi, '')
    .trim();
}

export function parseM3UContent(content: string, baseDir: string = ''): ParsedM3UEntry[] {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const results: ParsedM3UEntry[] = [];

  let currentTitle = '';
  let currentArtist = 'Unknown Artist';
  let currentDuration = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      // Format: #EXTINF:123,Artist - Title or #EXTINF:279,6,5 jt pemutaran;Lyn - Title
      const infoPart = line.substring(8);
      
      const durMatch = infoPart.match(/^(-?\d+)\s*,\s*(.*)$/);
      let parsedDuration = 0;
      let namePart = infoPart;

      if (durMatch) {
        const d = parseInt(durMatch[1], 10);
        if (!isNaN(d) && d > 0) {
          parsedDuration = d;
        }
        namePart = durMatch[2].trim();
      } else {
        const commaIndex = infoPart.indexOf(',');
        if (commaIndex !== -1) {
          const durationStr = infoPart.substring(0, commaIndex).trim();
          const d = parseInt(durationStr, 10);
          if (!isNaN(d) && d > 0) parsedDuration = d;
          namePart = infoPart.substring(commaIndex + 1).trim();
        }
      }
      currentDuration = parsedDuration;

      // Clean scraped prefixes before parsing artist and title
      namePart = cleanScrapedPrefix(namePart);

      if (namePart.includes(' - ')) {
        const parts = namePart.split(' - ');
        currentArtist = cleanScrapedPrefix(parts[0].trim());
        currentTitle = cleanTitleNoise(parts.slice(1).join(' - ').trim());
      } else if (namePart.includes(';')) {
        const parts = namePart.split(';');
        currentArtist = cleanScrapedPrefix(parts[0].trim());
        currentTitle = cleanTitleNoise(parts.slice(1).join(';').trim());
      } else {
        currentTitle = cleanTitleNoise(namePart);
      }
    } else if (!line.startsWith('#')) {
      // It's a file path or URL
      const isHttp = /^https?:\/\//i.test(line);
      let resolvedUrl = line;

      if (!isHttp && baseDir) {
        if (!path.isAbsolute(line)) {
          resolvedUrl = path.resolve(baseDir, line);
        }
      }

      if (!currentTitle) {
        // Fallback title from filename or URL
        const baseName = path.basename(line).replace(/\.[^/.]+$/, '');
        currentTitle = cleanTitleNoise(decodeURIComponent(baseName) || 'Untitled Track');
      }

      const isYouTube = /youtube\.com|youtu\.be/i.test(resolvedUrl);
      const detectedSource: 'local' | 'stream' | 'youtube' = isYouTube
        ? 'youtube'
        : isHttp
        ? 'stream'
        : 'local';

      results.push({
        title: currentTitle || 'Untitled Track',
        artist: currentArtist || 'Unknown Artist',
        url: resolvedUrl,
        duration: currentDuration,
        sourceType: detectedSource,
      });

      // Reset for next track
      currentTitle = '';
      currentArtist = 'Unknown Artist';
      currentDuration = 0;
    }
  }

  return results;
}
