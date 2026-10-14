import { useState, useEffect, useCallback } from 'react';
import { Track, BatchDownloadProgress } from '../types/music';

declare global {
  interface Window {
    electronAPI?: import('../../electron/preload').ElectronAPI;
  }
}

export function useDownloads(
  onTrackUpdated?: (trackData: Partial<Track> & { id: string }) => void
) {
  const [downloadingIds, setDownloadingIds] = useState<Set<string>>(new Set());
  const [batchProgress, setBatchProgress] = useState<BatchDownloadProgress | null>(null);

  // Listen for IPC download progress events
  useEffect(() => {
    if (!window.electronAPI?.onDownloadProgress) return;

    const unsubscribe = window.electronAPI.onDownloadProgress((data) => {
      if (data.status === 'completed') {
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(data.id);
          return next;
        });
        if (onTrackUpdated) {
          onTrackUpdated({
            id: data.id,
            title: data.title,
            artist: data.artist,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            localPath: data.localPath,
            isOffline: true,
            downloadStatus: 'completed',
            downloadProgress: 100,
          });
        }
      } else if (data.status === 'failed') {
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(data.id);
          return next;
        });
        if (onTrackUpdated) {
          onTrackUpdated({
            id: data.id,
            downloadStatus: 'failed',
            downloadProgress: 0,
          });
        }
      } else if (data.status === 'downloading') {
        if (onTrackUpdated) {
          onTrackUpdated({
            id: data.id,
            title: data.title,
            artist: data.artist,
            url: data.url,
            thumbnailUrl: data.thumbnailUrl,
            downloadStatus: 'downloading',
            downloadProgress: data.progress,
          });
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [onTrackUpdated]);

  // Listen for batch progress events
  useEffect(() => {
    if (!window.electronAPI?.onBatchDownloadProgress) return;

    const unsubscribeBatch = window.electronAPI.onBatchDownloadProgress((data) => {
      setBatchProgress(data);
      if (!data.active && data.total > 0 && data.completed + data.failed >= data.total) {
        // Auto clear after 4 seconds when finished
        setTimeout(() => {
          setBatchProgress((curr) => (curr && !curr.active ? null : curr));
        }, 4000);
      }
    });

    return () => {
      unsubscribeBatch();
    };
  }, []);

  const startDownload = useCallback(
    async (track: Track) => {
      if (!window.electronAPI?.downloadYouTubeTrack) return;
      if (downloadingIds.has(track.id)) return;

      setDownloadingIds((prev) => new Set(prev).add(track.id));
      if (onTrackUpdated) {
        onTrackUpdated({
          ...track,
          downloadStatus: 'downloading',
          downloadProgress: 0,
        });
      }

      try {
        await window.electronAPI.downloadYouTubeTrack({
          id: track.id,
          title: track.title,
          artist: track.artist,
          url: track.url,
          thumbnailUrl: track.thumbnailUrl,
        });
      } catch (err) {
        console.error('Download start failed:', err);
        setDownloadingIds((prev) => {
          const next = new Set(prev);
          next.delete(track.id);
          return next;
        });
        if (onTrackUpdated) {
          onTrackUpdated({
            id: track.id,
            downloadStatus: 'failed',
            downloadProgress: 0,
          });
        }
      }
    },
    [downloadingIds, onTrackUpdated]
  );

  const startBatchDownload = useCallback(
    async (tracks: Track[]) => {
      if (!window.electronAPI?.downloadBatch) return;
      const validTracks = tracks.filter(
        (t) => !t.isOffline && t.sourceType !== 'local' && (Boolean(t.url) || Boolean(t.title))
      );
      if (validTracks.length === 0) return;

      try {
        const initialStatus = await window.electronAPI.downloadBatch(
          validTracks.map((t) => ({
            id: t.id,
            title: t.title,
            artist: t.artist,
            url: t.url,
            thumbnailUrl: t.thumbnailUrl,
          }))
        );
        if (initialStatus) {
          setBatchProgress(initialStatus);
        }
      } catch (err) {
        console.error('Batch download start failed:', err);
      }
    },
    []
  );

  const cancelBatchDownload = useCallback(async () => {
    if (!window.electronAPI?.cancelBatch) return;
    try {
      await window.electronAPI.cancelBatch();
      setBatchProgress(null);
    } catch (err) {
      console.error('Cancel batch download failed:', err);
    }
  }, []);

  const removeDownload = useCallback(
    async (trackId: string) => {
      if (!window.electronAPI?.deleteDownload) return;
      const success = await window.electronAPI.deleteDownload(trackId);
      if (success && onTrackUpdated) {
        onTrackUpdated({
          id: trackId,
          isOffline: false,
          localPath: undefined,
          downloadStatus: 'idle',
          downloadProgress: 0,
        });
      }
    },
    [onTrackUpdated]
  );

  return {
    downloadingIds,
    batchProgress,
    startDownload,
    startBatchDownload,
    cancelBatchDownload,
    removeDownload,
  };
}
