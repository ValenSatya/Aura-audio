import { useState, useEffect } from 'react';

// In-memory cache for fast sync rendering
const localMemoryCoverCache = new Map<string, string>();
const STORAGE_CACHE_KEY = 'aura_cover_art_cache';

// Initialize cache from localStorage
try {
  const saved = localStorage.getItem(STORAGE_CACHE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    Object.entries(parsed).forEach(([key, val]) => {
      if (typeof val === 'string') {
        localMemoryCoverCache.set(key, val);
      }
    });
  }
} catch {}

function saveToLocalStorage() {
  try {
    const obj: Record<string, string> = {};
    // Only save recent 300 covers to avoid bloated storage
    let count = 0;
    for (const [k, v] of localMemoryCoverCache.entries()) {
      if (count++ > 300) break;
      obj[k] = v;
    }
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(obj));
  } catch {}
}

export async function getOfficialCoverArt(
  title: string,
  artist: string,
  fallbackThumb?: string
): Promise<string> {
  const key = `${(title || '').trim().toLowerCase()}:::${(artist || '').trim().toLowerCase()}`;

  if (localMemoryCoverCache.has(key)) {
    return localMemoryCoverCache.get(key)!;
  }

  // If electronAPI is available, resolve official studio album cover
  if (window.electronAPI?.resolveOfficialCover) {
    try {
      const resolved = await window.electronAPI.resolveOfficialCover(title, artist, fallbackThumb);
      if (resolved) {
        localMemoryCoverCache.set(key, resolved);
        saveToLocalStorage();
        return resolved;
      }
    } catch (e) {
      console.warn('Failed to resolve official cover:', e);
    }
  }

  const fallback = fallbackThumb || '';
  if (fallback) {
    localMemoryCoverCache.set(key, fallback);
  }
  return fallback;
}

export function useTrackCover(
  title: string,
  artist: string,
  fallbackThumb?: string
): string {
  const key = `${(title || '').trim().toLowerCase()}:::${(artist || '').trim().toLowerCase()}`;
  const cached = localMemoryCoverCache.get(key);

  const [coverUrl, setCoverUrl] = useState<string>(cached || fallbackThumb || '');

  useEffect(() => {
    let isMounted = true;
    const currentCached = localMemoryCoverCache.get(key);

    if (currentCached) {
      setCoverUrl(currentCached);
      return;
    }

    if (fallbackThumb) {
      setCoverUrl(fallbackThumb);
    }

    getOfficialCoverArt(title, artist, fallbackThumb).then((resolved) => {
      if (isMounted && resolved) {
        setCoverUrl(resolved);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [title, artist, fallbackThumb, key]);

  return coverUrl;
}
