import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Track, PlaylistFilter, RepeatMode } from '../types/music';

const STORAGE_KEY = 'aura_audio_playlist';
const QUEUE_STORAGE_KEY = 'aura_audio_playback_queue';
const CURRENT_INDEX_STORAGE_KEY = 'aura_audio_current_track_index';

export function usePlaylist(serverUrl: string = 'http://127.0.0.1:45454') {
  // Master persistent library of tracks
  const [tracks, setTracks] = useState<Track[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Active playback queue (the list of tracks actively lined up to play)
  const [queue, setQueue] = useState<Track[]>(() => {
    try {
      const savedQueue = localStorage.getItem(QUEUE_STORAGE_KEY);
      if (savedQueue) {
        const parsed = JSON.parse(savedQueue);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const savedTracks = localStorage.getItem(STORAGE_KEY);
      if (savedTracks) {
        const parsed = JSON.parse(savedTracks);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return [];
  });

  // Index of currently playing track in the queue
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number | null>(() => {
    try {
      const savedIdx = localStorage.getItem(CURRENT_INDEX_STORAGE_KEY);
      if (savedIdx !== null) {
        const idx = parseInt(savedIdx, 10);
        if (!isNaN(idx)) return idx;
      }
    } catch {}
    return null;
  });

  const [filter, setFilter] = useState<PlaylistFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>('all');

  // Deterministic non-repeating shuffle permutation
  const shuffledOrderRef = useRef<number[]>([]);

  // Fisher-Yates algorithm to generate a full non-repeating permutation
  const generateShuffledOrder = useCallback((totalTracks: number, startIndex: number | null): number[] => {
    if (totalTracks <= 0) return [];
    const indices: number[] = [];
    for (let i = 0; i < totalTracks; i++) {
      if (i !== startIndex) {
        indices.push(i);
      }
    }
    // Shuffle in-place
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    if (startIndex !== null && startIndex >= 0 && startIndex < totalTracks) {
      return [startIndex, ...indices];
    }
    return indices;
  }, []);

  // Persist tracks library to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tracks));
    } catch {}
  }, [tracks]);

  // Persist queue and currentTrackIndex
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(queue));
    } catch {}
  }, [queue]);

  useEffect(() => {
    try {
      if (currentTrackIndex !== null) {
        localStorage.setItem(CURRENT_INDEX_STORAGE_KEY, String(currentTrackIndex));
      } else {
        localStorage.removeItem(CURRENT_INDEX_STORAGE_KEY);
      }
    } catch {}
  }, [currentTrackIndex]);

  // Sync offline status from Electron
  useEffect(() => {
    async function syncDownloads() {
      if (window.electronAPI?.getDownloadedTracks) {
        try {
          const offlineList = await window.electronAPI.getDownloadedTracks();
          const offlineMap = new Map<string, any>();
          for (const item of offlineList) {
            if (item.localPath) offlineMap.set(item.id, item);
          }

          setTracks((prev) => {
            const existingIds = new Set(prev.map((t) => t.id));
            const updated = prev.map((t) => {
              if (offlineMap.has(t.id)) {
                const offItem = offlineMap.get(t.id);
                return {
                  ...t,
                  isOffline: true,
                  localPath: offItem.localPath,
                  downloadStatus: 'completed' as const,
                  downloadProgress: 100,
                };
              }
              return t;
            });

            // Automatically add ANY downloaded tracks from disk that are not yet in library
            const newDownloadedTracks: Track[] = [];
            for (const item of offlineList) {
              if (item.localPath && !existingIds.has(item.id)) {
                newDownloadedTracks.push({
                  id: item.id,
                  title: item.title || 'Lagu Unduhan',
                  artist: item.artist || 'YouTube Music',
                  duration: 0,
                  sourceType: 'youtube',
                  url: item.url,
                  thumbnailUrl: item.thumbnailUrl,
                  isOffline: true,
                  localPath: item.localPath,
                  downloadStatus: 'completed',
                  downloadProgress: 100,
                  dateAdded: Date.now(),
                });
              }
            }

            return [...updated, ...newDownloadedTracks];
          });

          // Also update matching offline tracks in queue
          setQueue((prevQ) => {
            return prevQ.map((t) => {
              if (offlineMap.has(t.id)) {
                const offItem = offlineMap.get(t.id);
                return {
                  ...t,
                  isOffline: true,
                  localPath: offItem.localPath,
                  downloadStatus: 'completed' as const,
                  downloadProgress: 100,
                };
              }
              return t;
            });
          });
        } catch (e) {
          console.error('Failed to sync downloads:', e);
        }
      }
    }
    syncDownloads();
  }, []);

  // Filtered and searched tracks within the library
  const filteredTracks = useMemo(() => {
    return tracks.filter((track) => {
      // Filter by type
      if (
        filter === 'offline' &&
        !track.isOffline &&
        track.downloadStatus !== 'completed' &&
        track.downloadStatus !== 'downloading' &&
        track.sourceType !== 'local'
      )
        return false;
      if (filter === 'local' && track.sourceType !== 'local') return false;
      if (filter === 'youtube' && track.sourceType !== 'youtube') return false;
      if (filter === 'stream' && track.sourceType !== 'stream' && track.sourceType !== 'm3u') return false;

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesTitle = track.title.toLowerCase().includes(q);
        const matchesArtist = track.artist.toLowerCase().includes(q);
        const matchesAlbum = track.album?.toLowerCase().includes(q);
        return matchesTitle || matchesArtist || matchesAlbum;
      }

      return true;
    });
  }, [tracks, filter, searchQuery]);

  // Current playing track: strictly points to the track at currentTrackIndex in queue
  const currentTrack = useMemo(() => {
    if (currentTrackIndex === null || currentTrackIndex < 0 || currentTrackIndex >= queue.length) {
      return null;
    }
    return queue[currentTrackIndex];
  }, [queue, currentTrackIndex]);

  // Convert track to streamable URL (synchronous fallback)
  const getPlayableUrl = useCallback(
    (track: Track): string => {
      if (track.isOffline && track.localPath) {
        return `${serverUrl}/local-file?path=${encodeURIComponent(track.localPath)}`;
      }
      if (track.sourceType === 'local') {
        return `${serverUrl}/local-file?path=${encodeURIComponent(track.url)}`;
      }
      if (track.sourceType === 'spotify' || track.spotifyId) {
        if (track.resolvedYtUrl) {
          return `${serverUrl}/stream-yt?url=${encodeURIComponent(track.resolvedYtUrl)}`;
        }
      }
      const isYt = track.sourceType === 'youtube' || /(?:youtube\.com|youtu\.be)/i.test(track.url);
      if (isYt) {
        return `${serverUrl}/stream-yt?url=${encodeURIComponent(track.url)}`;
      }
      if (/^https?:\/\//i.test(track.url)) {
        return `${serverUrl}/stream-proxy?url=${encodeURIComponent(track.url)}`;
      }
      return track.url;
    },
    [serverUrl]
  );

  // Proactive background pre-fetch for upcoming tracks
  const prefetchTrackStream = useCallback(
    async (track: Track | null | undefined): Promise<string | null> => {
      if (!track) return null;
      if (track.isOffline && track.localPath) {
        return `${serverUrl}/local-file?path=${encodeURIComponent(track.localPath)}`;
      }
      if (track.sourceType === 'local') {
        return `${serverUrl}/local-file?path=${encodeURIComponent(track.url)}`;
      }

      // Spotify background matching & pre-resolution
      if (track.sourceType === 'spotify' || track.spotifyId) {
        if (!track.resolvedYtUrl && window.electronAPI?.matchSpotifyTrack) {
          try {
            const matched = await window.electronAPI.matchSpotifyTrack(track);
            if (matched?.ytUrl) {
              track.resolvedYtUrl = matched.ytUrl;
            }
          } catch {}
        }
        if (track.resolvedYtUrl) {
          if (window.electronAPI?.resolveStreamUrl) {
            window.electronAPI.resolveStreamUrl(track.resolvedYtUrl).catch(() => {});
          }
          return `${serverUrl}/stream-yt?url=${encodeURIComponent(track.resolvedYtUrl)}`;
        }
        return null;
      }

      const isYt = track.sourceType === 'youtube' || /(?:youtube\.com|youtu\.be)/i.test(track.url);
      if (!isYt) return track.url;

      // Pre-resolve stream URL into YouTubeService cache in the background
      if (window.electronAPI?.resolveStreamUrl) {
        window.electronAPI.resolveStreamUrl(track.url).catch(() => {});
      }
      return `${serverUrl}/stream-yt?url=${encodeURIComponent(track.url)}`;
    },
    [serverUrl]
  );

  // Reliable, high-performance stream resolution via LocalStreamServer (guaranteed CORS & Web Audio compatibility)
  const resolvePlayableUrl = useCallback(
    async (track: Track): Promise<string> => {
      if (track.isOffline && track.localPath) {
        return `${serverUrl}/local-file?path=${encodeURIComponent(track.localPath)}`;
      }
      if (track.sourceType === 'local') {
        return `${serverUrl}/local-file?path=${encodeURIComponent(track.url)}`;
      }

      // Spotify resolution via Spotube Matcher
      if (track.sourceType === 'spotify' || track.spotifyId) {
        let ytUrl = track.resolvedYtUrl;
        if (!ytUrl && window.electronAPI?.matchSpotifyTrack) {
          const matched = await window.electronAPI.matchSpotifyTrack(track);
          if (matched?.ytUrl) {
            ytUrl = matched.ytUrl;
            track.resolvedYtUrl = ytUrl;
          }
        }
        if (ytUrl) {
          if (window.electronAPI?.resolveStreamUrl) {
            window.electronAPI.resolveStreamUrl(ytUrl).catch(() => {});
          }
          return `${serverUrl}/stream-yt?url=${encodeURIComponent(ytUrl)}`;
        }
      }

      const isYt = track.sourceType === 'youtube' || /(?:youtube\.com|youtu\.be)/i.test(track.url);
      if (isYt) {
        // Pre-resolve stream in background so streamServer gets it in 0ms
        if (window.electronAPI?.resolveStreamUrl) {
          window.electronAPI.resolveStreamUrl(track.url).catch(() => {});
        }
        return `${serverUrl}/stream-yt?url=${encodeURIComponent(track.url)}`;
      }

      if (/^https?:\/\//i.test(track.url)) {
        return `${serverUrl}/stream-proxy?url=${encodeURIComponent(track.url)}`;
      }

      return track.url;
    },
    [serverUrl]
  );

  // Primary playback activator: sets active queue, sets playing index, and keeps library updated
  const playInQueue = useCallback(
    (newQueue: Track[], startIndex: number = 0, autoShuffle: boolean = false) => {
      if (!newQueue || newQueue.length === 0) return;
      const safeIndex = Math.max(0, Math.min(newQueue.length - 1, startIndex));

      setQueue([...newQueue]);
      setCurrentTrackIndex(safeIndex);

      if (autoShuffle) {
        setIsShuffle(true);
        shuffledOrderRef.current = generateShuffledOrder(newQueue.length, safeIndex);
      } else if (isShuffle) {
        shuffledOrderRef.current = generateShuffledOrder(newQueue.length, safeIndex);
      } else {
        shuffledOrderRef.current = [];
      }

      // Background pre-match for Spotify tracks in queue (instant 0ms transitions)
      if (window.electronAPI?.preMatchSpotifyBatch) {
        const upcoming = newQueue.slice(safeIndex + 1, safeIndex + 5);
        const spotifyUpcoming = upcoming.filter((t) => t.sourceType === 'spotify' || t.spotifyId);
        if (spotifyUpcoming.length > 0) {
          window.electronAPI.preMatchSpotifyBatch(spotifyUpcoming);
        }
      }

      // Preserve newly played tracks in master library (without reordering library)
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const existingUrls = new Set(prev.map((t) => t.url));
        const toAdd = newQueue.filter((t) => !existingIds.has(t.id) && !existingUrls.has(t.url));
        if (toAdd.length === 0) return prev;
        return [...prev, ...toAdd];
      });
    },
    [generateShuffledOrder, isShuffle]
  );

  // Atomically load and play an entire playlist (preserves clicked track index)
  const playPlaylistAtomic = useCallback(
    (newTracks: Track[], startIndex: number = 0) => {
      playInQueue(newTracks, startIndex, false);
    },
    [playInQueue]
  );

  // Atomically load, shuffle, and play an entire playlist
  const playPlaylistShuffled = useCallback(
    (newTracks: Track[], startIndex?: number) => {
      if (!newTracks || newTracks.length === 0) return;
      const chosenIdx =
        typeof startIndex === 'number' && startIndex >= 0 && startIndex < newTracks.length
          ? startIndex
          : Math.floor(Math.random() * newTracks.length);
      playInQueue(newTracks, chosenIdx, true);
    },
    [playInQueue]
  );

  // Atomically play a single track: if in queue switch to it; otherwise append and switch
  const playTrackAtomic = useCallback(
    (trackToPlay: Track) => {
      const existingIdx = queue.findIndex(
        (t) => t.id === trackToPlay.id || (t.url && trackToPlay.url && t.url === trackToPlay.url)
      );

      if (existingIdx !== -1) {
        setCurrentTrackIndex(existingIdx);
      } else {
        const nextQueue = [...queue, trackToPlay];
        setQueue(nextQueue);
        setCurrentTrackIndex(nextQueue.length - 1);
      }

      // Also ensure track is present in master library
      setTracks((prev) => {
        const exists = prev.some(
          (t) => t.id === trackToPlay.id || (t.url && trackToPlay.url && t.url === trackToPlay.url)
        );
        return exists ? prev : [...prev, trackToPlay];
      });
    },
    [queue]
  );

  // Append tracks to current playback queue
  const addToQueue = useCallback((tracksToAdd: Track[]) => {
    if (!tracksToAdd || tracksToAdd.length === 0) return;
    setQueue((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const filtered = tracksToAdd.filter((t) => !existingIds.has(t.id));
      return [...prev, ...filtered];
    });

    // Also ensure tracks are stored in master library
    setTracks((prev) => {
      const existingIds = new Set(prev.map((t) => t.id));
      const newItems = tracksToAdd.filter((t) => !existingIds.has(t.id));
      return newItems.length > 0 ? [...prev, ...newItems] : prev;
    });
  }, []);

  // Insert tracks immediately after currently playing track in queue (Putar Berikutnya)
  const playNextInQueue = useCallback(
    (trackOrTracks: Track | Track[]) => {
      const toInsert = Array.isArray(trackOrTracks) ? trackOrTracks : [trackOrTracks];
      if (toInsert.length === 0) return;

      setQueue((prev) => {
        if (
          prev.length === 0 ||
          currentTrackIndex === null ||
          currentTrackIndex < 0 ||
          currentTrackIndex >= prev.length
        ) {
          return [...prev, ...toInsert];
        }

        const insertPos = currentTrackIndex + 1;
        const nextQueue = [...prev];
        nextQueue.splice(insertPos, 0, ...toInsert);
        return nextQueue;
      });

      // Also ensure tracks are stored in master library
      setTracks((prev) => {
        const existingIds = new Set(prev.map((t) => t.id));
        const newItems = toInsert.filter((t) => !existingIds.has(t.id));
        return newItems.length > 0 ? [...prev, ...newItems] : prev;
      });
    },
    [currentTrackIndex]
  );

  // Remove a track from current queue
  const removeFromQueue = useCallback(
    (id: string) => {
      setQueue((prev) => {
        const idx = prev.findIndex((t) => t.id === id);
        if (idx === -1) return prev;
        const next = prev.filter((t) => t.id !== id);
        if (currentTrackIndex !== null) {
          if (idx === currentTrackIndex) {
            if (next.length === 0) {
              setCurrentTrackIndex(null);
            } else if (currentTrackIndex >= next.length) {
              setCurrentTrackIndex(next.length - 1);
            }
          } else if (idx < currentTrackIndex) {
            setCurrentTrackIndex(currentTrackIndex - 1);
          }
        }
        return next;
      });
    },
    [currentTrackIndex]
  );

  // Clear current playback queue only
  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentTrackIndex(null);
  }, []);

  // Add tracks to master library
  const addTracks = useCallback((newTracks: Track[]) => {
    setTracks((prev) => {
      const existingUrls = new Map(prev.map((t) => [t.url, t]));
      const existingIds = new Set(prev.map((t) => t.id));

      const updated = prev.map((item) => {
        const incoming = newTracks.find((nt) => nt.url === item.url || nt.id === item.id);
        if (incoming) {
          return {
            ...item,
            thumbnailUrl: item.thumbnailUrl || incoming.thumbnailUrl,
            preferStudioAudio: incoming.preferStudioAudio ?? item.preferStudioAudio,
            duration: item.duration > 0 ? item.duration : incoming.duration,
          };
        }
        return item;
      });

      const toAdd: Track[] = [];
      for (const t of newTracks) {
        if (!existingUrls.has(t.url) && !existingIds.has(t.id)) {
          toAdd.push(t);
        }
      }

      return [...updated, ...toAdd];
    });

    // If queue is currently empty, populate it with incoming tracks
    setQueue((prevQ) => {
      if (prevQ.length === 0) {
        return [...newTracks];
      }
      return prevQ;
    });
  }, []);

  // Remove track from library and queue
  const removeTrack = useCallback(
    (id: string) => {
      setTracks((prev) => prev.filter((t) => t.id !== id));
      removeFromQueue(id);
    },
    [removeFromQueue]
  );

  // Clear master library and queue
  const clearPlaylist = useCallback(() => {
    setTracks([]);
    clearQueue();
  }, [clearQueue]);

  // Update track in library and queue
  const updateTrack = useCallback((id: string, updates: Partial<Track>) => {
    setTracks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
    setQueue((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  }, []);

  // Update downloaded track
  const addOrUpdateDownloadedTrack = useCallback((trackData: Partial<Track> & { id: string }) => {
    setTracks((prev) => {
      const idx = prev.findIndex((t) => t.id === trackData.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = {
          ...copy[idx],
          ...trackData,
          isOffline: trackData.downloadStatus === 'completed' ? true : copy[idx].isOffline,
          localPath: trackData.localPath || copy[idx].localPath,
        };
        return copy;
      } else if (
        trackData.downloadStatus === 'completed' ||
        trackData.downloadStatus === 'downloading'
      ) {
        const newTrack: Track = {
          id: trackData.id,
          title: trackData.title || 'Lagu Unduhan',
          artist: trackData.artist || 'YouTube Music',
          duration: trackData.duration || 0,
          sourceType: 'youtube',
          url: trackData.url || '',
          thumbnailUrl: trackData.thumbnailUrl,
          isOffline: trackData.downloadStatus === 'completed',
          localPath: trackData.localPath,
          downloadStatus: trackData.downloadStatus,
          downloadProgress: trackData.downloadProgress || 0,
          dateAdded: Date.now(),
        };
        return [...prev, newTrack];
      }
      return prev;
    });

    setQueue((prev) => {
      const idx = prev.findIndex((t) => t.id === trackData.id);
      if (idx === -1) return prev;
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        ...trackData,
        isOffline: trackData.downloadStatus === 'completed' ? true : copy[idx].isOffline,
        localPath: trackData.localPath || copy[idx].localPath,
      };
      return copy;
    });
  }, []);

  // Select a track in queue by ID
  const selectTrack = useCallback(
    (id: string) => {
      const idx = queue.findIndex((t) => t.id === id);
      if (idx !== -1) {
        setCurrentTrackIndex(idx);
      }
    },
    [queue]
  );

  // Compute next track index strictly within current queue (deterministic & non-destructive)
  const getNextIndex = useCallback(
    (fromIndex?: number): number | null => {
      if (queue.length === 0) return null;
      const baseIdx = fromIndex !== undefined ? fromIndex : currentTrackIndex;
      if (baseIdx === null) return 0;

      if (repeatMode === 'one') {
        return baseIdx;
      }

      if (isShuffle && queue.length > 1) {
        let order = shuffledOrderRef.current;
        if (order.length !== queue.length) {
          order = generateShuffledOrder(queue.length, baseIdx);
          shuffledOrderRef.current = order;
        }

        let pos = order.indexOf(baseIdx);
        if (pos === -1) {
          pos = 0;
        }

        const nextPos = pos + 1;
        if (nextPos < order.length) {
          return order[nextPos];
        }
        return repeatMode === 'all' ? order[0] : null;
      }

      const next = baseIdx + 1;
      if (next < queue.length) {
        return next;
      }
      return repeatMode === 'all' ? 0 : null;
    },
    [queue.length, currentTrackIndex, repeatMode, isShuffle, generateShuffledOrder]
  );

  // Compute previous track index strictly within current queue (deterministic & non-destructive)
  const getPrevIndex = useCallback(
    (fromIndex?: number): number | null => {
      if (queue.length === 0) return null;
      const baseIdx = fromIndex !== undefined ? fromIndex : currentTrackIndex;
      if (baseIdx === null) return 0;

      if (repeatMode === 'one') {
        return baseIdx;
      }

      if (isShuffle && queue.length > 1) {
        let order = shuffledOrderRef.current;
        if (order.length !== queue.length) {
          order = generateShuffledOrder(queue.length, baseIdx);
          shuffledOrderRef.current = order;
        }

        let pos = order.indexOf(baseIdx);
        if (pos === -1) {
          pos = 0;
        }

        const prevPos = pos - 1;
        if (prevPos >= 0) {
          return order[prevPos];
        }
        return repeatMode === 'all' ? order[order.length - 1] : order[0];
      }

      const prev = baseIdx - 1;
      if (prev >= 0) {
        return prev;
      }
      return repeatMode === 'all' ? queue.length - 1 : 0;
    },
    [queue.length, currentTrackIndex, repeatMode, isShuffle, generateShuffledOrder]
  );

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      if (next) {
        shuffledOrderRef.current = generateShuffledOrder(queue.length, currentTrackIndex);
      } else {
        shuffledOrderRef.current = [];
      }
      return next;
    });
  }, [queue.length, currentTrackIndex, generateShuffledOrder]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  return {
    tracks,
    filteredTracks,
    queue,
    currentTrack,
    currentTrackIndex,
    filter,
    searchQuery,
    isShuffle,
    repeatMode,
    setFilter,
    setSearchQuery,
    addTracks,
    removeTrack,
    clearPlaylist,
    updateTrack,
    addOrUpdateDownloadedTrack,
    setTracks,
    selectTrack,
    playInQueue,
    playTrackAtomic,
    playPlaylistAtomic,
    playPlaylistShuffled,
    setCurrentTrackIndex,
    getNextIndex,
    getPrevIndex,
    toggleShuffle,
    toggleRepeat,
    getPlayableUrl,
    resolvePlayableUrl,
    prefetchTrackStream,
    addToQueue,
    playNextInQueue,
    removeFromQueue,
    clearQueue,
  };
}
