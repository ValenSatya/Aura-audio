import { Track } from '../types/music';

export interface CustomPlaylist {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  createdAt: number;
  tracks: Track[];
}

const STORAGE_KEY = 'aura_custom_playlists_v2';

// Built-in default seed playlists
const DEFAULT_PLAYLISTS: CustomPlaylist[] = [
  {
    id: 'pl_favorites',
    name: 'Favorit Saya',
    description: 'Lagu-lagu favorit pilihanmu',
    coverUrl: '/assets/cover747_e84f19dd.png',
    createdAt: Date.now() - 1000000,
    tracks: [],
  },
  {
    id: 'pl_chill',
    name: 'Chill & Relax',
    description: 'Musik santai untuk fokus dan istirahat',
    coverUrl: '/assets/cover748_0643063b.png',
    createdAt: Date.now() - 500000,
    tracks: [],
  },
];

type PlaylistListener = (playlists: CustomPlaylist[]) => void;
const listeners: Set<PlaylistListener> = new Set();

export class MobilePlaylistStorage {
  public static getPlaylists(): CustomPlaylist[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        // Fallback check legacy
        const legacy = localStorage.getItem('aura_custom_playlists');
        if (legacy) {
          const parsedLegacy = JSON.parse(legacy);
          if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
            const migrated: CustomPlaylist[] = parsedLegacy.map((p: any) => ({
              id: p.id || `pl_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              name: p.name || 'Untitled Playlist',
              description: 'Migrated playlist',
              coverUrl: '/assets/cover747_e84f19dd.png',
              createdAt: Date.now(),
              tracks: Array.isArray(p.tracks) ? p.tracks : [],
            }));
            localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated));
            return migrated;
          }
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PLAYLISTS));
        return DEFAULT_PLAYLISTS;
      }
      return JSON.parse(raw);
    } catch {
      return DEFAULT_PLAYLISTS;
    }
  }

  public static mergeCloudPlaylists(cloudPlaylists: any[]) {
    const current = this.getPlaylists();
    const merged = [...current];
    let hasChanges = false;

    for (const cp of cloudPlaylists) {
      if (!cp || !cp.name) continue;
      const idx = merged.findIndex((p) => p.id === cp.id || p.name.toLowerCase() === cp.name.toLowerCase());
      const cloudTracks = Array.isArray(cp.tracks) ? cp.tracks : [];
      if (idx === -1) {
        merged.push({
          id: cp.id || `pl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          name: cp.name,
          description: cp.description || 'Disinkronkan dari Desktop',
          coverUrl: cp.coverUrl || cloudTracks[0]?.thumbnailUrl || '/assets/cover747_e84f19dd.png',
          createdAt: cp.updatedAt ? new Date(cp.updatedAt).getTime() : Date.now(),
          tracks: cloudTracks,
        });
        hasChanges = true;
      } else if (cloudTracks.length >= merged[idx].tracks.length) {
        merged[idx].tracks = cloudTracks;
        if (cp.coverUrl) merged[idx].coverUrl = cp.coverUrl;
        hasChanges = true;
      }
    }

    if (hasChanges) {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        listeners.forEach((cb) => cb(merged));
      } catch (e) {
        console.error('Failed to save merged playlists:', e);
      }
    }
  }

  public static savePlaylists(playlists: CustomPlaylist[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(playlists));
      listeners.forEach((cb) => cb(playlists));

      // Auto-sync to backend cloud if authenticated
      import('./apiClient').then(({ ApiClient }) => {
        if (ApiClient.isAuthenticated()) {
          ApiClient.syncPlaylists(playlists).catch(() => {});
        }
      }).catch(() => {});
    } catch (e) {
      console.error('Failed to save playlists to localStorage:', e);
    }
  }

  public static createPlaylist(name: string, initialTracks: Track[] = []): CustomPlaylist {
    const playlists = this.getPlaylists();
    const newPl: CustomPlaylist = {
      id: `pl_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      name: name.trim() || 'Daftar Putar Baru',
      description: 'Daftar putar pribadi',
      coverUrl: initialTracks[0]?.thumbnailUrl || '/assets/cover747_e84f19dd.png',
      createdAt: Date.now(),
      tracks: initialTracks,
    };
    playlists.unshift(newPl);
    this.savePlaylists(playlists);
    return newPl;
  }

  public static addTrackToPlaylist(playlistId: string, track: Track): { success: boolean; playlistName: string } {
    const playlists = this.getPlaylists();
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return { success: false, playlistName: '' };

    // Avoid duplicate if already exists
    const exists = pl.tracks.some((t) => t.id === track.id);
    if (!exists) {
      pl.tracks.push(track);
      if (!pl.coverUrl || pl.coverUrl.includes('/assets/cover747')) {
        pl.coverUrl = track.thumbnailUrl || pl.coverUrl;
      }
      this.savePlaylists(playlists);
    }
    return { success: true, playlistName: pl.name };
  }

  public static removeTrackFromPlaylist(playlistId: string, trackId: string) {
    const playlists = this.getPlaylists();
    const pl = playlists.find((p) => p.id === playlistId);
    if (!pl) return;
    pl.tracks = pl.tracks.filter((t) => t.id !== trackId);
    this.savePlaylists(playlists);
  }

  public static deletePlaylist(playlistId: string) {
    const playlists = this.getPlaylists().filter((p) => p.id !== playlistId);
    this.savePlaylists(playlists);
  }

  public static subscribe(listener: PlaylistListener): () => void {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
}
