const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

function parseM3UContent(content, baseDir = '') {
  const lines = content.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  const results = [];

  let currentTitle = '';
  let currentArtist = 'Unknown Artist';
  let currentDuration = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('#EXTINF:')) {
      const infoPart = line.substring(8);
      const commaIndex = infoPart.indexOf(',');
      
      if (commaIndex !== -1) {
        const durationStr = infoPart.substring(0, commaIndex).trim();
        const parsedDuration = parseInt(durationStr, 10);
        if (!isNaN(parsedDuration) && parsedDuration > 0) {
          currentDuration = parsedDuration;
        }

        const namePart = infoPart.substring(commaIndex + 1).trim();
        if (namePart.includes(' - ')) {
          const parts = namePart.split(' - ');
          currentArtist = parts[0].trim();
          currentTitle = parts.slice(1).join(' - ').trim();
        } else {
          currentTitle = namePart;
        }
      }
    } else if (!line.startsWith('#')) {
      const isHttp = /^https?:\/\//i.test(line);
      let resolvedUrl = line;

      if (!isHttp && baseDir) {
        if (!path.isAbsolute(line)) {
          resolvedUrl = path.resolve(baseDir, line);
        }
      }

      if (!currentTitle) {
        const baseName = path.basename(line).replace(/\.[^/.]+$/, '');
        currentTitle = decodeURIComponent(baseName) || 'Untitled Track';
      }

      const isYouTube = /youtube\.com|youtu\.be/i.test(resolvedUrl);
      const detectedSource = isYouTube ? 'youtube' : isHttp ? 'stream' : 'local';

      results.push({
        title: currentTitle,
        artist: currentArtist,
        url: resolvedUrl,
        duration: currentDuration,
        sourceType: detectedSource
      });

      currentTitle = '';
      currentArtist = 'Unknown Artist';
      currentDuration = 0;
    }
  }

  return results;
}

function parseCSVContent(content, baseDir = '') {
  const parsed = Papa.parse(content, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });

  const results = [];
  const rows = parsed.data;

  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;

    const normalized = {};
    for (const [key, val] of Object.entries(row)) {
      normalized[key.trim().toLowerCase()] = val;
    }

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

    let sourceType = 'local';
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

    const rawArtist =
      normalized['artist'] ||
      normalized['penyanyi'] ||
      normalized['artist_name'] ||
      normalized['singer'] ||
      normalized['creator'] ||
      normalized['channel'] ||
      '';
    const artist = String(rawArtist).trim() || 'Unknown Artist';

    const album = normalized['album'] ? String(normalized['album']).trim() : undefined;

    const rawDuration = normalized['duration'] || normalized['durasi'] || normalized['length'] || normalized['time'];
    let duration = 0;
    if (typeof rawDuration === 'number') {
      duration = rawDuration;
    } else if (typeof rawDuration === 'string') {
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

console.log('--- TEST 1: M3U PARSER WITH YOUTUBE LINKS ---');
const m3uContent = fs.readFileSync(path.join(__dirname, 'sample.m3u'), 'utf-8');
const m3uTracks = parseM3UContent(m3uContent, __dirname);
console.log('Parsed M3U Tracks count:', m3uTracks.length);
console.log('M3U Tracks:', JSON.stringify(m3uTracks, null, 2));

if (m3uTracks.length !== 4) throw new Error('Expected 4 tracks in M3U');
if (m3uTracks[2].sourceType !== 'youtube') throw new Error('Third track should be recognized as youtube');
if (m3uTracks[2].title !== 'Never Gonna Give You Up') throw new Error('Third track title mismatch');
console.log('>>> TEST 1 PASSED! <<<\n');

console.log('--- TEST 2: CSV PARSER WITH YOUTUBE LINKS ---');
const csvContent = fs.readFileSync(path.join(__dirname, 'sample.csv'), 'utf-8');
const csvTracks = parseCSVContent(csvContent, __dirname);
console.log('Parsed CSV Tracks count:', csvTracks.length);
console.log('CSV Tracks:', JSON.stringify(csvTracks, null, 2));

if (csvTracks.length !== 3) throw new Error('Expected 3 tracks in CSV');
if (csvTracks[0].sourceType !== 'youtube') throw new Error('First CSV track should be youtube');
console.log('>>> TEST 2 PASSED! <<<\n');

console.log('ALL TESTS PASSED!');
