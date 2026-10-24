import { useState, useEffect, useCallback } from 'react';
import { Track } from '../types/music';

const STORAGE_KEY = 'aura_listening_history';
const MAX_HISTORY = 30;

export function useListeningHistory() {
  const [history, setHistory] = useState<Track[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to load listening history from localStorage:', e);
    }
    return [];
  });

  // Save to localStorage whenever history changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Failed to save listening history to localStorage:', e);
    }
  }, [history]);

  const addToHistory = useCallback((track: Track) => {
    if (!track || !track.title) return;

    setHistory((prev) => {
      // Exclude previous instance of the same track by id or normalized title+artist
      const normTitle = track.title.toLowerCase().trim();
      const normArtist = (track.artist || '').toLowerCase().trim();

      const filtered = prev.filter((item) => {
        if (item.id === track.id) return false;
        const itemTitle = (item.title || '').toLowerCase().trim();
        const itemArtist = (item.artist || '').toLowerCase().trim();
        return !(itemTitle === normTitle && itemArtist === normArtist);
      });

      const updatedTrack: Track = {
        ...track,
        playedAt: Date.now(),
      };

      return [updatedTrack, ...filtered].slice(0, MAX_HISTORY);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      console.warn('Failed to clear listening history:', e);
    }
  }, []);

  return {
    history,
    addToHistory,
    clearHistory,
  };
}
