/**
 * AuraAudio Smart Offline Audio Cache
 * Uses IndexedDB to store audio streams locally for 0ms buffering & 0MB repeat quota
 */

const DB_NAME = 'AuraAudioCacheDB';
const DB_VERSION = 1;
const STORE_NAME = 'audio_tracks';
const MAX_CACHE_SIZE_BYTES = 300 * 1024 * 1024; // 300 MB limit

interface CachedAudioRecord {
  id: string; // videoId or trackId
  blob: Blob;
  mimeType: string;
  size: number;
  cachedAt: number;
  lastPlayedAt: number;
}

export class MobileAudioCache {
  private static dbPromise: Promise<IDBDatabase> | null = null;

  private static getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = (e.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('lastPlayedAt', 'lastPlayedAt', { unique: false });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    return this.dbPromise;
  }

  /**
   * Retrieves a cached local Blob URL for a track if available
   */
  public static async getCachedAudioUrl(trackId: string): Promise<string | null> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(trackId);

        req.onsuccess = () => {
          const record: CachedAudioRecord | undefined = req.result;
          if (record && record.blob) {
            // Update lastPlayed timestamp for LRU
            record.lastPlayedAt = Date.now();
            store.put(record);
            const localUrl = URL.createObjectURL(record.blob);
            resolve(localUrl);
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

  /**
   * Saves downloaded or streamed audio blob into local cache in background
   */
  public static async cacheAudioStream(trackId: string, streamUrl: string): Promise<void> {
    if (!trackId || !streamUrl || streamUrl.startsWith('blob:')) return;

    try {
      const response = await fetch(streamUrl);
      if (!response.ok) return;

      const blob = await response.blob();
      const db = await this.getDB();

      await this.enforceLRUCacheLimit(db, blob.size);

      const record: CachedAudioRecord = {
        id: trackId,
        blob,
        mimeType: blob.type || 'audio/mp4',
        size: blob.size,
        cachedAt: Date.now(),
        lastPlayedAt: Date.now(),
      };

      const tx = db.transaction(STORE_NAME, 'readwrite');
      tx.objectStore(STORE_NAME).put(record);
    } catch (e) {
      console.warn('[Cache] Background caching skipped for track:', trackId, e);
    }
  }

  /**
   * Enforces LRU memory limit to prevent filling phone internal storage
   */
  private static async enforceLRUCacheLimit(db: IDBDatabase, newSize: number): Promise<void> {
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('lastPlayedAt');
      const req = index.openCursor(null, 'next'); // oldest first

      let totalSize = newSize;
      const recordsToDelete: string[] = [];

      req.onsuccess = (e) => {
        const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          totalSize += cursor.value.size || 0;
          if (totalSize > MAX_CACHE_SIZE_BYTES) {
            recordsToDelete.push(cursor.value.id);
          }
          cursor.continue();
        } else {
          for (const id of recordsToDelete) {
            store.delete(id);
          }
          resolve();
        }
      };

      req.onerror = () => resolve();
    });
  }

  public static async clearAllCache(): Promise<boolean> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const req = tx.objectStore(STORE_NAME).clear();
        req.onsuccess = () => resolve(true);
        req.onerror = () => resolve(false);
      });
    } catch {
      return false;
    }
  }

  /**
   * Returns list of cached track IDs
   */
  public static async getDownloadedTrackIds(): Promise<string[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAllKeys();
        req.onsuccess = () => resolve((req.result as string[]) || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }
}
