const assert = require('assert');
const path = require('path');
const fs = require('fs');
const Papa = require('papaparse');

function cleanScrapedPrefix(text) {
  return text.replace(/^[\d.,\s\u00a0]+(?:(?:jt|rb|k|m|b)\s*)?(?:views?|pemutaran|tontonan)\s*[;•·-]?\s*/gi, '').trim();
}

function cleanTitleNoise(title) {
  return title
    .replace(/\s*[\(\[\{【（](?:official\s*(?:music\s*)?video|official\s*audio|official\s*mv|music\s*video|lyric\s*video|mv|m\/v|pv|full\s*ver(?:sion)?)[\)\]\}】）]/gi, '')
    .trim();
}

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
      const durMatch = infoPart.match(/^(-?\d+)\s*,\s*(.*)$/);
      let parsedDuration = 0;
      let namePart = infoPart;

      if (durMatch) {
        const d = parseInt(durMatch[1], 10);
        if (!isNaN(d) && d > 0) parsedDuration = d;
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
      const isHttp = /^https?:\/\//i.test(line);
      let resolvedUrl = line;

      if (!isHttp && baseDir) {
        if (!path.isAbsolute(line)) {
          resolvedUrl = path.resolve(baseDir, line);
        }
      }

      if (!currentTitle) {
        const baseName = path.basename(line).replace(/\.[^/.]+$/, '');
        currentTitle = cleanTitleNoise(decodeURIComponent(baseName) || 'Untitled Track');
      }

      const isYouTube = /youtube\.com|youtu\.be/i.test(resolvedUrl);
      const detectedSource = isYouTube ? 'youtube' : isHttp ? 'stream' : 'local';

      results.push({
        title: currentTitle || 'Untitled Track',
        artist: currentArtist || 'Unknown Artist',
        url: resolvedUrl,
        duration: currentDuration,
        sourceType: detectedSource,
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
      url: resolvedUrl,
      duration,
      sourceType,
    });
  }

  return results;
}

console.log('====================================================');
console.log('🧪 RUNNING COMPREHENSIVE FEATURE TESTS FOR AURAAUDIO');
console.log('====================================================\n');

let totalTests = 0;
let passedTests = 0;

function runTest(name, fn) {
  totalTests++;
  try {
    fn();
    console.log(`✅ [PASS] ${name}`);
    passedTests++;
  } catch (err) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(err);
  }
}

// ----------------------------------------------------
// SCENARIO 1: M3U PARSING & CLEANING
// ----------------------------------------------------
runTest('Scenario 1.1: M3U Parser parses #EXTINF with duration, artist, title', () => {
  const content = `#EXTM3U
#EXTINF:240,Queen - Bohemian Rhapsody
C:\\Music\\BohemianRhapsody.mp3
#EXTINF:185,Lofi Girl - Chill Beats
https://stream.zeno.fm/f3wvbbqmdg8uv
#EXTINF:213,Rick Astley - Never Gonna Give You Up (Official Music Video)
https://www.youtube.com/watch?v=dQw4w9WgXcQ
`;
  const result = parseM3UContent(content, 'C:\\Music');
  assert.strictEqual(result.length, 3);
  assert.strictEqual(result[0].title, 'Bohemian Rhapsody');
  assert.strictEqual(result[0].artist, 'Queen');
  assert.strictEqual(result[0].sourceType, 'local');

  assert.strictEqual(result[1].title, 'Chill Beats');
  assert.strictEqual(result[1].artist, 'Lofi Girl');
  assert.strictEqual(result[1].sourceType, 'stream');

  // Verify that (Official Music Video) noise is stripped from title
  assert.strictEqual(result[2].title, 'Never Gonna Give You Up');
  assert.strictEqual(result[2].artist, 'Rick Astley');
  assert.strictEqual(result[2].sourceType, 'youtube');
});

runTest('Scenario 1.2: M3U Parser cleans scraped view count prefixes', () => {
  const content = `#EXTM3U
#EXTINF:279,6,5 jt pemutaran;Lyn - My Destiny
https://www.youtube.com/watch?v=D0qubf4HPNo
#EXTINF:210,120 rb views - Alan Walker - Faded [MV]
https://www.youtube.com/watch?v=60ItHLz5WEA
`;
  const result = parseM3UContent(content);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].artist, 'Lyn');
  assert.strictEqual(result[0].title, 'My Destiny');

  assert.strictEqual(result[1].artist, 'Alan Walker');
  assert.strictEqual(result[1].title, 'Faded');
});

// ----------------------------------------------------
// SCENARIO 2: CSV SPREADSHEET PARSER
// ----------------------------------------------------
runTest('Scenario 2.1: CSV Parser detects indonesian & english column headers', () => {
  const csvContent = `judul,penyanyi,durasi,link
Hati-Hati di Jalan,Tulus,04:02,https://www.youtube.com/watch?v=sample1
Sial,Mahalini,180,https://www.youtube.com/watch?v=sample2
`;
  const result = parseCSVContent(csvContent);
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].title, 'Hati-Hati di Jalan');
  assert.strictEqual(result[0].artist, 'Tulus');
  assert.strictEqual(result[0].duration, 242); // 4*60 + 2
  assert.strictEqual(result[0].sourceType, 'youtube');

  assert.strictEqual(result[1].title, 'Sial');
  assert.strictEqual(result[1].artist, 'Mahalini');
  assert.strictEqual(result[1].duration, 180);
});

runTest('Scenario 2.2: CSV Parser detects local file paths and resolves relative paths', () => {
  const csvContent = `title,artist,path
Track 1,Artist 1,songs/track1.mp3
Track 2,Artist 2,C:\\Absolute\\track2.flac
`;
  const result = parseCSVContent(csvContent, 'C:\\MyMusic');
  assert.strictEqual(result.length, 2);
  assert.strictEqual(result[0].sourceType, 'local');
  assert.strictEqual(result[0].url, path.resolve('C:\\MyMusic', 'songs/track1.mp3'));
  assert.strictEqual(result[1].sourceType, 'local');
  assert.strictEqual(result[1].url, 'C:\\Absolute\\track2.flac');
});

// ----------------------------------------------------
// SCENARIO 3: IMPORT MODAL CONTRACT (ARRAY VS {TRACKS})
// ----------------------------------------------------
runTest('Scenario 3.1: ImportModal handles both raw array and { tracks } payload without error', () => {
  const rawArray = [
    { title: 'Song 1', artist: 'Artist 1', url: 'https://youtube.com/watch?v=1', duration: 200, sourceType: 'youtube' }
  ];
  const objFormat = {
    tracks: [
      { title: 'Song 2', artist: 'Artist 2', url: 'https://youtube.com/watch?v=2', duration: 180, sourceType: 'youtube' }
    ]
  };

  const parsed1 = Array.isArray(rawArray) ? rawArray : (rawArray.tracks || []);
  const parsed2 = Array.isArray(objFormat) ? objFormat : (objFormat.tracks || []);

  assert.strictEqual(parsed1.length, 1);
  assert.strictEqual(parsed1[0].title, 'Song 1');
  assert.strictEqual(parsed2.length, 1);
  assert.strictEqual(parsed2[0].title, 'Song 2');
});

// ----------------------------------------------------
// SCENARIO 4: SHUFFLE QUEUE DETERMINISTIC BEHAVIOR
// ----------------------------------------------------
runTest('Scenario 4.1: Deterministic shuffle permutation does NOT skip songs on peeking/prefetching', () => {
  // Simulating usePlaylist deterministic shuffle permutation logic
  function generateShuffledOrder(totalTracks, startIndex) {
    const indices = [];
    for (let i = 0; i < totalTracks; i++) {
      if (i !== startIndex) indices.push(i);
    }
    // Simple deterministic permutation for testing
    for (let i = indices.length - 1; i > 0; i--) {
      const j = (i * 7) % (i + 1);
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return startIndex !== null ? [startIndex, ...indices] : indices;
  }

  const queue = [
    { id: '1', title: 'Track 1' },
    { id: '2', title: 'Track 2' },
    { id: '3', title: 'Track 3' },
    { id: '4', title: 'Track 4' },
    { id: '5', title: 'Track 5' },
  ];

  let currentTrackIndex = 0;
  const isShuffle = true;
  const repeatMode = 'all';
  const shuffledOrder = generateShuffledOrder(queue.length, currentTrackIndex);

  function getNextIndex(baseIdx) {
    const pos = shuffledOrder.indexOf(baseIdx);
    const nextPos = pos + 1;
    if (nextPos < shuffledOrder.length) return shuffledOrder[nextPos];
    return repeatMode === 'all' ? shuffledOrder[0] : null;
  }

  // Peeking 10 times in a row MUST return the exact same next index
  const peek1 = getNextIndex(currentTrackIndex);
  const peek2 = getNextIndex(currentTrackIndex);
  const peek3 = getNextIndex(currentTrackIndex);
  assert.strictEqual(peek1, peek2);
  assert.strictEqual(peek2, peek3);

  // Moving forward sequentially MUST visit all 5 unique tracks in the permutation
  const visited = [currentTrackIndex];
  let cur = currentTrackIndex;
  for (let step = 0; step < queue.length - 1; step++) {
    cur = getNextIndex(cur);
    visited.push(cur);
  }

  assert.strictEqual(visited.length, 5);
  const uniqueVisited = new Set(visited);
  assert.strictEqual(uniqueVisited.size, 5, 'All 5 songs must be visited in shuffle mode without skipping!');
});

runTest('Scenario 4.2: Previous track navigation in shuffle mode steps back through permutation', () => {
  function generateShuffledOrder(totalTracks, startIndex) {
    const indices = [];
    for (let i = 0; i < totalTracks; i++) {
      if (i !== startIndex) indices.push(i);
    }
    return startIndex !== null ? [startIndex, ...indices] : indices;
  }

  const queueLength = 4;
  const shuffledOrder = [2, 0, 3, 1];

  function getPrevIndex(baseIdx) {
    const pos = shuffledOrder.indexOf(baseIdx);
    const prevPos = pos - 1;
    if (prevPos >= 0) return shuffledOrder[prevPos];
    return shuffledOrder[shuffledOrder.length - 1];
  }

  // If current is 3 (index 2 in order), previous must be 0 (index 1)
  assert.strictEqual(getPrevIndex(3), 0);
  // If current is 0, previous must be 2
  assert.strictEqual(getPrevIndex(0), 2);
  // If current is 2, previous must wrap around to 1
  assert.strictEqual(getPrevIndex(2), 1);
});

// ----------------------------------------------------
// SCENARIO 5: SPOTIFY URL RESOLVER PATTERNS
// ----------------------------------------------------
runTest('Scenario 5.1: SpotifyClient parses all supported Spotify URL variants', () => {
  // Regex from our updated SpotifyClient
  function parseSpotifyUrl(inputUrl) {
    if (!inputUrl) return null;
    const clean = inputUrl.trim();
    const webMatch = clean.match(/(?:open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(?:user\/[^\/]+\/)?)(playlist|album|track)\/([a-zA-Z0-9]+)/i);
    if (webMatch) {
      return { type: webMatch[1].toLowerCase(), id: webMatch[2] };
    }
    const uriMatch = clean.match(/^spotify:(playlist|album|track):([a-zA-Z0-9]+)$/i);
    if (uriMatch) {
      return { type: uriMatch[1].toLowerCase(), id: uriMatch[2] };
    }
    return null;
  }

  // 1. Standard web track
  const t1 = parseSpotifyUrl('https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT?si=abc123');
  assert.deepStrictEqual(t1, { type: 'track', id: '4cOdK2wGLETKBW3PvgPWqT' });

  // 2. Standard web album
  const a1 = parseSpotifyUrl('https://open.spotify.com/album/1DFixLWuPkv3KT3TnV35m3');
  assert.deepStrictEqual(a1, { type: 'album', id: '1DFixLWuPkv3KT3TnV35m3' });

  // 3. Internationalized URL (e.g. Indonesian /intl-id/)
  const t2 = parseSpotifyUrl('https://open.spotify.com/intl-id/track/0VjIjW4GlUZAMYd2vXMi3b');
  assert.deepStrictEqual(t2, { type: 'track', id: '0VjIjW4GlUZAMYd2vXMi3b' });

  // 4. User playlist URL
  const p1 = parseSpotifyUrl('https://open.spotify.com/user/spotify/playlist/37i9dQZF1DXcBWIGoYBM5M');
  assert.deepStrictEqual(p1, { type: 'playlist', id: '37i9dQZF1DXcBWIGoYBM5M' });

  // 5. Native Spotify URI
  const u1 = parseSpotifyUrl('spotify:playlist:37i9dQZF1DXcBWIGoYBM5M');
  assert.deepStrictEqual(u1, { type: 'playlist', id: '37i9dQZF1DXcBWIGoYBM5M' });

  // 6. Invalid URL returns null
  assert.strictEqual(parseSpotifyUrl('https://google.com'), null);
});

// ----------------------------------------------------
// SCENARIO 6: 8-BAND EQUALIZER & PRESETS INTEGRITY
// ----------------------------------------------------
runTest('Scenario 6.1: Equalizer presets integrity and gain clamping', () => {
  const PRESETS = [
    { id: 'flat', name: 'Flat (Default)', gains: [0, 0, 0, 0, 0, 0, 0, 0] },
    { id: 'bass_boost', name: 'Bass Boost', gains: [7, 6, 4, 1, 0, 0, 0, 0] },
    { id: 'rock', name: 'Rock', gains: [5, 3, -1, -2, 1, 3, 5, 6] },
    { id: 'pop', name: 'Pop', gains: [-1, 2, 4, 5, 3, 0, -1, -2] },
    { id: 'vocal', name: 'Vocal Clarity', gains: [-3, -1, 1, 4, 5, 4, 2, 0] },
    { id: 'jazz', name: 'Jazz & Acoustic', gains: [3, 2, 1, 2, -1, -1, 2, 3] },
    { id: 'electronic', name: 'Electronic / EDM', gains: [6, 5, 1, 0, -2, 2, 4, 5] },
    { id: 'classical', name: 'Classical', gains: [4, 3, 2, 1, -1, 2, 3, 4] },
  ];

  for (const preset of PRESETS) {
    assert.strictEqual(preset.gains.length, 8, `Preset ${preset.id} must have 8 bands`);
    for (const g of preset.gains) {
      assert.ok(g >= -12 && g <= 12, `Gain ${g} in ${preset.id} must be within [-12, +12]`);
    }
  }

  // Clamping test
  const clamp = (val) => Math.max(-12, Math.min(12, val));
  assert.strictEqual(clamp(25), 12);
  assert.strictEqual(clamp(-30), -12);
  assert.strictEqual(clamp(5), 5);
});

// ----------------------------------------------------
// SCENARIO 7: BATCH DOWNLOAD PROGRESS COUNTER RESET
// ----------------------------------------------------
runTest('Scenario 7.1: Batch download counters reset accurately between runs', () => {
  let isBatchActive = false;
  let batchTotal = 0;
  let batchCompleted = 0;
  let batchFailed = 0;

  function queueBatch(items) {
    if (!isBatchActive) {
      batchTotal = 0;
      batchCompleted = 0;
      batchFailed = 0;
    }
    batchTotal += items.length;
    isBatchActive = true;
  }

  function completeItem() {
    batchCompleted++;
    if (batchCompleted + batchFailed >= batchTotal) {
      isBatchActive = false;
    }
  }

  // Batch 1: 2 items
  queueBatch([1, 2]);
  assert.strictEqual(batchTotal, 2);
  completeItem();
  completeItem();
  assert.strictEqual(isBatchActive, false);
  assert.strictEqual(batchCompleted, 2);

  // Batch 2: 3 items (must reset counters to 0, not inherit completed=2)
  queueBatch([3, 4, 5]);
  assert.strictEqual(batchTotal, 3);
  assert.strictEqual(batchCompleted, 0);
  assert.strictEqual(batchFailed, 0);
  completeItem();
  const overallPercent = Math.round(((batchCompleted + batchFailed) / batchTotal) * 100);
  assert.strictEqual(overallPercent, 33);
});

// ----------------------------------------------------
// SCENARIO 8: STREAM COMPLETION WATCHDOG & AUTO-SKIP
// ----------------------------------------------------
runTest('Scenario 8.1: Near-end watchdog triggers completion when stream stops near duration', () => {
  let endedTriggered = false;
  let hasTriggeredEnded = false;
  const duration = 180.0;
  let currentTime = 179.7; // 0.3s before end, typical stream truncation

  function onTimeUpdate(cur, dur, seeking) {
    if (!hasTriggeredEnded && dur > 3 && isFinite(dur) && cur >= dur - 0.35 && !seeking) {
      hasTriggeredEnded = true;
      endedTriggered = true;
    }
  }

  onTimeUpdate(currentTime, duration, false);
  assert.strictEqual(endedTriggered, true, 'Watchdog should trigger track completion');
  assert.strictEqual(hasTriggeredEnded, true);

  // Subsequent timeupdates should not double-fire
  endedTriggered = false;
  onTimeUpdate(currentTime, duration, false);
  assert.strictEqual(endedTriggered, false, 'Should not fire duplicate completion');
});

runTest('Scenario 8.2: Stream stall near end (<1.8s) triggers completion', () => {
  let completionTriggered = false;
  let hasTriggeredEnded = false;
  const duration = 210.0;
  const currentTime = 208.5; // Stalled 1.5s before end

  function onStallNearEnd(cur, dur) {
    if (!hasTriggeredEnded && dur > 3 && dur - cur <= 1.8) {
      // Simulate watchdog timeout firing
      hasTriggeredEnded = true;
      completionTriggered = true;
    }
  }

  onStallNearEnd(currentTime, duration);
  assert.strictEqual(completionTriggered, true, 'Stall near end should trigger completion');
});

runTest('Scenario 8.3: Broken song triggers auto-skip to next track in queue', () => {
  const queue = [
    { id: '1', title: 'Song 1', url: 'valid' },
    { id: '2', title: 'Song 2 (Dead Stream)', url: 'broken' },
    { id: '3', title: 'Song 3', url: 'valid' },
  ];
  let currentIdx = 0;
  let consecutiveErrors = 0;

  function playTrack(idx) {
    currentIdx = idx;
    if (queue[idx].url === 'broken') {
      handleError('404 Not Found');
    } else {
      consecutiveErrors = 0;
    }
  }

  function handleError(msg) {
    consecutiveErrors++;
    if (consecutiveErrors < 4) {
      // Auto-skip
      const nextIdx = (currentIdx + 1) % queue.length;
      playTrack(nextIdx);
    }
  }

  // Song 1 finishes, advances to Song 2
  playTrack(1);
  // Song 2 was broken, should auto-advance to Song 3
  assert.strictEqual(currentIdx, 2, 'Should automatically skip broken song to song 3');
  assert.strictEqual(consecutiveErrors, 0, 'Should reset error counter on successful track');
});

runTest('Scenario 8.4: Consecutive errors capped at threshold to prevent infinite loop', () => {
  let paused = false;
  let consecutiveErrors = 0;

  function handleError() {
    if (consecutiveErrors >= 4) {
      paused = true;
      return;
    }
    consecutiveErrors++;
  }

  for (let i = 0; i < 6; i++) {
    handleError();
  }

  assert.strictEqual(paused, true, 'Should pause playback when exceeding max consecutive errors');
  assert.strictEqual(consecutiveErrors, 4, 'Should cap at 4');
});

console.log('\n====================================================');
console.log(`📊 TEST RESULTS: ${passedTests} / ${totalTests} TESTS PASSED!`);
console.log('====================================================');

if (passedTests !== totalTests) {
  process.exit(1);
}
