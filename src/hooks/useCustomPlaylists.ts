import { useState, useEffect, useCallback } from 'react';
import { CustomPlaylist, Track } from '../types/music';

const STORAGE_KEY = 'aura_custom_playlists_v1';

export function useCustomPlaylists() {
  const [playlists, setPlaylists] = useState<CustomPlaylist[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to parse custom playlists from storage:', e);
    }
    return [
      {
        id: 'playlist-favorites',
        name: 'Favorit Saya',
        description: 'Kumpulan lagu favorit pilihan Anda',
        trackIds: [],
        tracks: [],
        createdAt: Date.now(),
        updatedAt: Date.now(),
      },
    ];
  });

  // 1. Initial sync with disk-backed storage (userData/aura_playlists.json)
  useEffect(() => {
    let isMounted = true;
    if (window.electronAPI?.loadPersistentPlaylists) {
      window.electronAPI.loadPersistentPlaylists().then((diskPlaylists) => {
        if (isMounted && Array.isArray(diskPlaylists) && diskPlaylists.length > 0) {
          setPlaylists(diskPlaylists);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(diskPlaylists));
          } catch {}
        }
      }).catch((err) => console.warn('Failed to load disk playlists:', err));
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Dual-layer auto-save to both localStorage and disk file
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
    } catch (e) {
      console.error('Failed to save custom playlists to storage:', e);
    }
    if (window.electronAPI?.savePersistentPlaylists) {
      window.electronAPI.savePersistentPlaylists(playlists).catch((err) => {
        console.warn('Failed to save playlists to disk:', err);
      });
    }
  }, [playlists]);


  const createPlaylist = useCallback(
    (
      name: string,
      description?: string,
      initialTracksOrIds: (Track | string)[] = [],
      directTracks?: Track[]
    ): CustomPlaylist => {
      let resolvedTracks: Track[] = directTracks ? [...directTracks] : [];
      let resolvedIds: string[] = [];

      if (Array.isArray(initialTracksOrIds) && initialTracksOrIds.length > 0) {
        if (typeof initialTracksOrIds[0] === 'object' && initialTracksOrIds[0] !== null) {
          resolvedTracks = initialTracksOrIds as Track[];
          resolvedIds = resolvedTracks.map((t) => t.id);
        } else {
          resolvedIds = initialTracksOrIds as string[];
          if (!resolvedTracks || resolvedTracks.length === 0) {
            resolvedTracks = [];
          }
        }
      }

      const newPlaylist: CustomPlaylist = {
        id: `playlist-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        name: name.trim() || 'Playlist Baru',
        description: description?.trim() || '',
        trackIds: Array.from(new Set(resolvedIds)),
        tracks: resolvedTracks,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setPlaylists((prev) => [newPlaylist, ...prev]);
      return newPlaylist;
    },
    []
  );

  const setPlaylistTracks = useCallback((playlistId: string, newTracks: Track[]) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return {
            ...p,
            tracks: newTracks,
            trackIds: newTracks.map((t) => t.id),
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  }, []);

  const deletePlaylist = useCallback((id: string) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const renamePlaylist = useCallback((id: string, newName: string, newDescription?: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          return {
            ...p,
            name: newName.trim() || p.name,
            description: newDescription !== undefined ? newDescription.trim() : p.description,
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  }, []);

  const addTracksToPlaylist = useCallback(
    (playlistId: string, items: (Track | string)[], tracksToAdd: Track[] = []) => {
      if (items.length === 0 && tracksToAdd.length === 0) return;

      const trackObjs: Track[] = [...tracksToAdd];
      const trackIdList: string[] = [];

      for (const item of items) {
        if (typeof item === 'string') {
          trackIdList.push(item);
        } else if (item && typeof item === 'object') {
          trackObjs.push(item);
          trackIdList.push(item.id);
        }
      }

      setPlaylists((prev) =>
        prev.map((p) => {
          if (p.id === playlistId) {
            const existingTracks = p.tracks || [];
            const existingUrls = new Set(existingTracks.map((t) => t.url));
            const existingIds = new Set(p.trackIds);

            const filteredNewTracks = trackObjs.filter(
              (t) => !existingIds.has(t.id) && !existingUrls.has(t.url)
            );
            const combinedTracks = [...existingTracks, ...filteredNewTracks];
            const combinedIds = Array.from(
              new Set([...p.trackIds, ...trackIdList, ...combinedTracks.map((t) => t.id)])
            );

            return {
              ...p,
              tracks: combinedTracks,
              trackIds: combinedIds,
              updatedAt: Date.now(),
            };
          }
          return p;
        })
      );
    },
    []
  );

  const removeTrackFromPlaylist = useCallback((playlistId: string, trackId: string) => {
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return {
            ...p,
            tracks: (p.tracks || []).filter((t) => t.id !== trackId),
            trackIds: p.trackIds.filter((id) => id !== trackId),
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  }, []);

  const removeTracksFromPlaylist = useCallback((playlistId: string, trackIds: string[]) => {
    const toRemove = new Set(trackIds);
    setPlaylists((prev) =>
      prev.map((p) => {
        if (p.id === playlistId) {
          return {
            ...p,
            tracks: (p.tracks || []).filter((t) => !toRemove.has(t.id)),
            trackIds: p.trackIds.filter((id) => !toRemove.has(id)),
            updatedAt: Date.now(),
          };
        }
        return p;
      })
    );
  }, []);

  return {
    playlists,
    customPlaylists: playlists,
    createPlaylist,
    deletePlaylist,
    renamePlaylist,
    setPlaylistTracks,
    addTracksToPlaylist,
    removeTrackFromPlaylist,
    removeTracksFromPlaylist,
  };
}
