/**
 * AuraAudio Mobile Download Service
 * Manages permanent offline downloads in IndexedDB
 * Allows 100% offline audio playback (0ms latency & 0MB data usage)
 */

import { Track } from '../types/music';

const DOWNLOAD_DB_NAME = 'AuraAudioDownloadsDB';
const DOWNLOAD_DB_VERSION = 1;
const DOWNLOAD_STORE = 'aura_downloads';

export interface DownloadedTrackRecord {
  id: string;
  track: Track;
  audioBlob: Blob;
  sizeBytes: number;
  downloadedAt: number;
}

type DownloadListener = () => void;

export class MobileDownloadService {
  private static dbPromise: Promise<IDBDatabase> | null = null;
  private static listeners: Set<DownloadListener> = new Set();
  private static downloadingIds: Set<string> = new Set();

  public static subscribe(listener: DownloadListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private static notify() {
    for (const l of this.listeners) {
      l();
    }
  }

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DOWNLOAD_DB_NAME, DOWNLOAD_DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(DOWNLOAD_STORE)) {
          const store = db.createObjectStore(DOWNLOAD_STORE, { keyPath: 'id' });
          store.createIndex('downloadedAt', 'downloadedAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  public static isDownloading(trackId: string): boolean {
    return this.downloadingIds.has(trackId);
  }

  public static async isDownloaded(trackId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(DOWNLOAD_STORE, 'readonly');
        const store = tx.objectStore(DOWNLOAD_STORE);
        const req = store.get(trackId);
        req.onsuccess = () => resolve(!!req.result);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  public static async getDownloadedAudioUrl(trackId: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(DOWNLOAD_STORE, 'readonly');
        const store = tx.objectStore(DOWNLOAD_STORE);
        const req = store.get(trackId);
        req.onsuccess = () => {
          const record: DownloadedTrackRecord | undefined = req.result;
          if (record && record.audioBlob) {
            resolve(URL.createObjectURL(record.audioBlob));
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  }

  public static async getDownloadedTracks(): Promise<Track[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(DOWNLOAD_STORE, 'readonly');
        const store = tx.objectStore(DOWNLOAD_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const records: DownloadedTrackRecord[] = req.result || [];
          const tracks = records
            .sort((a, b) => b.downloadedAt - a.downloadedAt)
            .map((r) => ({
              ...r.track,
              isDownloaded: true,
            }));
          resolve(tracks);
        };
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  public static async downloadTrack(track: Track, resolvedStreamUrl?: string): Promise<boolean> {
    if (this.downloadingIds.has(track.id)) return false;

    this.downloadingIds.add(track.id);
    this.notify();

    try {
      let fetchUrl = resolvedStreamUrl || track.url;

      // If YouTube or stream URL needs resolving
      if (!resolvedStreamUrl && (/youtube\.com|youtu\.be/.test(track.url) || track.sourceType === 'youtube')) {
        const { MobileYoutubeService } = await import('./mobileYoutubeService');
        fetchUrl = await MobileYoutubeService.resolveStreamUrl(track.url);
      }

      const response = await fetch(fetchUrl, { mode: 'cors' });
      if (!response.ok) {
        throw new Error(`Download HTTP error ${response.status}`);
      }

      const blob = await response.blob();
      const db = await this.getDB();

      const record: DownloadedTrackRecord = {
        id: track.id,
        track: { ...track, isDownloaded: true },
        audioBlob: blob,
        sizeBytes: blob.size,
        downloadedAt: Date.now(),
      };

      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(DOWNLOAD_STORE, 'readwrite');
        const store = tx.objectStore(DOWNLOAD_STORE);
        const req = store.put(record);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });

      this.downloadingIds.delete(track.id);
      this.notify();

      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        try {
          navigator.vibrate([15, 30, 15]);
        } catch {}
      }

      return true;
    } catch (e) {
      console.warn('[MobileDownloadService] Download failed:', e);
      this.downloadingIds.delete(track.id);
      this.notify();
      return false;
    }
  }

  public static async removeDownload(trackId: string): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(DOWNLOAD_STORE, 'readwrite');
        const store = tx.objectStore(DOWNLOAD_STORE);
        const req = store.delete(trackId);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  public static async clearAllDownloads(): Promise<boolean> {
    try {
      const db = await this.getDB();
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(DOWNLOAD_STORE, 'readwrite');
        const store = tx.objectStore(DOWNLOAD_STORE);
        const req = store.clear();
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
      this.notify();
      return true;
    } catch {
      return false;
    }
  }

  public static async getTotalDownloadedBytes(): Promise<number> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(DOWNLOAD_STORE, 'readonly');
        const store = tx.objectStore(DOWNLOAD_STORE);
        const req = store.getAll();
        req.onsuccess = () => {
          const records: DownloadedTrackRecord[] = req.result || [];
          const total = records.reduce((acc, r) => acc + (r.sizeBytes || 0), 0);
          resolve(total);
        };
        req.onerror = () => resolve(0);
      });
    } catch {
      return 0;
    }
  }
}
