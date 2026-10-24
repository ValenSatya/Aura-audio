import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Track, RepeatMode } from '../types/music';

const STORAGE_KEY = 'aura_mobile_playlist_v3_figma';
const QUEUE_STORAGE_KEY = 'aura_mobile_queue_v3_figma';
const CURRENT_INDEX_KEY = 'aura_mobile_current_index_v3_figma';

export const INITIAL_MOBILE_TRACKS: Track[] = [
  {
    id: 'figma-1',
    title: 'Toxic',
    artist: 'Britney Spears',
    album: 'In the Zone',
    duration: 200,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=LOZuxwVk7TU',
    thumbnailUrl: '/assets/cover_britney_toxic.png',
    dateAdded: Date.now(),
  },
  {
    id: 'figma-2',
    title: 'Around the World',
    artist: 'Daft Punk',
    album: 'Homework',
    duration: 238,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=K0HSD_i2DvA',
    thumbnailUrl: '/assets/cover_daft_punk.png',
    dateAdded: Date.now() - 1000,
  },
  {
    id: 'figma-3',
    title: 'In the End',
    artist: 'LINKIN PARK',
    album: 'Hybrid Theory',
    duration: 216,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=eVTXPUF4Oz4',
    thumbnailUrl: '/assets/cover748_0643063b.png',
    dateAdded: Date.now() - 2000,
  },
  {
    id: 'figma-4',
    title: 'Blinding Lights',
    artist: 'The Weeknd',
    album: 'After Hours',
    duration: 200,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=4NRXx6U8ABQ',
    thumbnailUrl: '/assets/cover750_718c959e.png',
    dateAdded: Date.now() - 3000,
  },
  {
    id: 'figma-5',
    title: 'Chop Suey!',
    artist: 'System of a Down',
    album: 'Toxicity',
    duration: 210,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=CSvFpBOe8eY',
    thumbnailUrl: '/assets/cover749_697d7b55.png',
    dateAdded: Date.now() - 4000,
  },
  {
    id: 'figma-6',
    title: 'Circles',
    artist: 'Post Malone',
    album: "Hollywood's Bleeding",
    duration: 215,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=wXhTHyIgQ_U',
    thumbnailUrl: '/assets/cover751_bdc69831.png',
    dateAdded: Date.now() - 5000,
  },
  {
    id: 'figma-7',
    title: 'Tití Me Preguntó',
    artist: 'Bad Bunny',
    album: 'Un Verano Sin Ti',
    duration: 243,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=Cr8K88UcO0s',
    thumbnailUrl: '/assets/cover752_99add504.png',
    dateAdded: Date.now() - 6000,
  },
  {
    id: 'figma-8',
    title: 'Enter Sandman',
    artist: 'Metallica',
    album: 'Metallica',
    duration: 331,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=CD-E-LDc384',
    thumbnailUrl: '/assets/cover755_dcfe9b5a.png',
    dateAdded: Date.now() - 7000,
  },
  {
    id: 'figma-9',
    title: 'The Reason',
    artist: 'Hoobastank',
    album: 'The Reason',
    duration: 232,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=fV4DiAyExN0',
    thumbnailUrl: '/assets/cover747_e84f19dd.png',
    dateAdded: Date.now() - 8000,
  },
  {
    id: 'figma-10',
    title: 'Master of Puppets',
    artist: 'Metallica',
    album: 'Master of Puppets',
    duration: 515,
    sourceType: 'youtube',
    url: 'https://www.youtube.com/watch?v=E0ozmU9cJDg',
    thumbnailUrl: '/assets/cover754_a152c468.png',
    dateAdded: Date.now() - 9000,
  },
];

export function useMobilePlaylist() {
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          // If stored data was the old fake figma dummy data, clear it for a clean start
          const hasOldDummyOnly = parsed.length > 0 && parsed.every((t: any) => t.id?.startsWith('figma-'));
          if (!hasOldDummyOnly) return parsed;
        }
      }
    } catch {}
    // Clean, genuine empty library for new users!
    return [];
  });

  const [queue, setQueue] = useState<Track[]>(() => {
    try {
      const savedQ = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (savedQ) {
        const parsed = JSON.parse(savedQ);
        if (Array.isArray(parsed)) {
          const hasOldDummyOnly = parsed.length > 0 && parsed.every((t: any) => t.id?.startsWith('figma-'));
          if (!hasOldDummyOnly && parsed.length > 0) return parsed;
        }
      }
    } catch {}
    return [];
  });

  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(() => {
    try {
      const savedIdx = localStorage.getItem(CURRENT_INDEX_KEY);
      if (savedIdx !== null) {
        const idx = parseInt(savedIdx, 10);
        if (!isNaN(idx)) return idx;
      }
    } catch {}
    return 0;
  });

  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');
  const shuffledOrderRef = useRef<number[]>([]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    } catch {}
  }, [tracks]);

  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {}
  }, [queue]);

  useEffect(() => {
    try {
      if (currentTrackIndex !== null) {
        localStorage.setItem(CURRENT_INDEX_KEY, currentTrackIndex.toString());
      }
    } catch {}
  }, [currentTrackIndex]);

  const currentTrack = useMemo(() => {
    if (currentTrackIndex === null || currentTrackIndex < 0 || currentTrackIndex >= queue.length) {
      return null;
    }
    return queue[currentTrackIndex];
  }, [queue, currentTrackIndex]);

  const shuffleQueue = useCallback((sourceQueue: Track[]): number[] => {
    const indices = sourceQueue.map((_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next && queue.length > 0) {
        const shuffled = shuffleQueue(queue);
        if (currentTrackIndex !== null) {
          const currentPosInShuffled = shuffled.indexOf(currentTrackIndex);
          if (currentPosInShuffled !== -1) {
            shuffled.splice(currentPosInShuffled, 1);
            shuffled.unshift(currentTrackIndex);
          }
        }
        shuffledOrderRef.current = shuffled;
      }
      return next;
    });
  }, [queue, currentTrackIndex, shuffleQueue]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const getNextIndex = useCallback((): number | null => {
    if (queue.length === 0) return null;
    if (repeatMode === 'one' && currentTrackIndex !== null) {
      return currentTrackIndex;
    }
    if (isShuffle && shuffledOrderRef.current.length === queue.length) {
      const currentPos = shuffledOrderRef.current.indexOf(currentTrackIndex ?? 0);
      if (currentPos !== -1 && currentPos + 1 < shuffledOrderRef.current.length) {
        return shuffledOrderRef.current[currentPos + 1];
      }
      if (repeatMode === 'all') {
        return shuffledOrderRef.current[0];
      }
      return null;
    }
    const current = currentTrackIndex ?? -1;
    if (current + 1 < queue.length) {
      return current + 1;
    }
    if (repeatMode === 'all') {
      return 0;
    }
    return null;
  }, [queue.length, currentTrackIndex, repeatMode, isShuffle]);

  const getPrevIndex = useCallback((): number | null => {
    if (queue.length === 0) return null;
    if (repeatMode === 'one' && currentTrackIndex !== null) {
      return currentTrackIndex;
    }
    if (isShuffle && shuffledOrderRef.current.length === queue.length) {
      const currentPos = shuffledOrderRef.current.indexOf(currentTrackIndex ?? 0);
      if (currentPos > 0) {
        return shuffledOrderRef.current[currentPos - 1];
      }
      if (repeatMode === 'all') {
        return shuffledOrderRef.current[shuffledOrderRef.current.length - 1];
      }
      return null;
    }
    const current = currentTrackIndex ?? 0;
    if (current - 1 >= 0) {
      return current - 1;
    }
    if (repeatMode === 'all') {
      return queue.length - 1;
    }
    return 0;
  }, [queue.length, currentTrackIndex, repeatMode, isShuffle]);

  const playInQueue = useCallback((newQueue: Track[], startIndex: number = 0) => {
    setQueue(newQueue);
    setCurrentTrackIndex(startIndex);
  }, []);

  const playTrackAtomic = useCallback((track: Track) => {
    setQueue((prevQueue) => {
      const existingIdx = prevQueue.findIndex((t) => t.id === track.id);
      if (existingIdx !== -1) {
        setCurrentTrackIndex(existingIdx);
        return prevQueue;
      }
      const newQueue = [...prevQueue, track];
      setCurrentTrackIndex(newQueue.length - 1);
      return newQueue;
    });
  }, []);

  const addToQueue = useCallback((newTracks: Track[]) => {
    setQueue((prev) => [...prev, ...newTracks]);
  }, []);

  const importTracksToLibrary = useCallback((newTracks: Track[]) => {
    setTracks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const filtered = newTracks.filter((t) => !existingIds.has(t.id));
      return [...filtered, ...prev];
    });
    setQueue((prev) => [...prev, ...newTracks]);
  }, []);

  return {
    tracks,
    setTracks,
    queue,
    currentTrack,
    currentTrackIndex,
    setCurrentTrackIndex,
    isShuffle,
    repeatMode,
    playInQueue,
    playTrackAtomic,
    addToQueue,
    importTracksToLibrary,
    getNextIndex,
    getPrevIndex,
    toggleShuffle,
    toggleRepeat,
  };
}
