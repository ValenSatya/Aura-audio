import * as fs from 'fs';
import * as path from 'path';
import { spawn } from 'child_process';
import { app, BrowserWindow } from 'electron';
import { getYtDlpPath } from './ytdlpHelper';

export interface DownloadItem {
  id: string;
  title: string;
  artist: string;
  url: string;
  thumbnailUrl?: string;
  localPath?: string;
  progress: number;
  status: 'idle' | 'downloading' | 'completed' | 'failed';
  error?: string;
}

export interface BatchDownloadProgress {
  active: boolean;
  total: number;
  completed: number;
  failed: number;
  currentTitle?: string;
  overallPercent: number;
}

export class DownloadManager {
  private downloadDir: string;
  private metadataFile: string;
  private downloads: Map<string, DownloadItem> = new Map();

  // Batch queue state
  private batchQueue: Array<{ id: string; title: string; artist: string; url: string; thumbnailUrl?: string }> = [];
  private activeBatchWorkers: number = 0;
  private maxBatchConcurrency: number = 2;
  private batchTotal: number = 0;
  private batchCompleted: number = 0;
  private batchFailed: number = 0;
  private isBatchActive: boolean = false;
  private batchAborted: boolean = false;

  constructor() {
    this.downloadDir = path.join(app.getPath('userData'), 'downloads');
    this.metadataFile = path.join(app.getPath('userData'), 'downloads.json');

    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }

    this.loadSavedMetadata();
  }

  public getDownloadDir(): string {
    return this.downloadDir;
  }

  private loadSavedMetadata(): void {
    try {
      if (fs.existsSync(this.metadataFile)) {
        const raw = fs.readFileSync(this.metadataFile, 'utf-8');
        const items = JSON.parse(raw) as DownloadItem[];
        for (const item of items) {
          if (item.localPath && fs.existsSync(item.localPath)) {
            item.status = 'completed';
            item.progress = 100;
            this.downloads.set(item.id, item);
          }
        }
      }
    } catch (e) {
      console.error('Failed to load downloads metadata:', e);
    }
  }

  private saveMetadata(): void {
    try {
      const items = Array.from(this.downloads.values()).filter(
        (it) => it.status === 'completed' && it.localPath && fs.existsSync(it.localPath)
      );
      fs.writeFileSync(this.metadataFile, JSON.stringify(items, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save downloads metadata:', e);
    }
  }

  public getDownloadedItems(): DownloadItem[] {
    return Array.from(this.downloads.values()).filter(
      (it) => it.status === 'completed' && it.localPath && fs.existsSync(it.localPath)
    );
  }

  public isDownloaded(id: string): boolean {
    const item = this.downloads.get(id);
    return !!(item && item.status === 'completed' && item.localPath && fs.existsSync(item.localPath));
  }

  public getDownloadItem(id: string): DownloadItem | undefined {
    return this.downloads.get(id);
  }

  public async downloadTrack(
    track: { id: string; title: string; artist: string; url: string; thumbnailUrl?: string },
    senderWindow?: BrowserWindow
  ): Promise<DownloadItem> {
    const existing = this.downloads.get(track.id);
    if (existing && existing.status === 'completed' && existing.localPath && fs.existsSync(existing.localPath)) {
      this.notifyProgress(existing, senderWindow);
      return existing;
    }

    const safeTitle = track.title.replace(/[/\\?%*:|"<>]/g, '_').substring(0, 50);
    const fileName = `${track.id}_${safeTitle}.webm`;
    const destPath = path.join(this.downloadDir, fileName);

    const downloadItem: DownloadItem = {
      id: track.id,
      title: track.title,
      artist: track.artist,
      url: track.url,
      thumbnailUrl: track.thumbnailUrl,
      localPath: destPath,
      progress: 0,
      status: 'downloading',
    };

    this.downloads.set(track.id, downloadItem);
    this.notifyProgress(downloadItem, senderWindow);

    return new Promise((resolve, reject) => {
      const ytdl = getYtDlpPath();
      const downloadTarget = (track.url && /^https?:\/\//i.test(track.url))
        ? track.url
        : `ytsearch1:${track.artist ? `${track.artist} - ` : ''}${track.title}`.trim();

      const proc = spawn(ytdl, [
        '-f',
        'bestaudio',
        '--newline',
        '--no-playlist',
        '-o',
        destPath,
        downloadTarget,
      ]);

      let stderr = '';

      proc.stdout.on('data', (data) => {
        const text = data.toString();
        // Look for [download]  45.0%
        const match = text.match(/\[download\]\s+(\d+(\.\d+)?)%/);
        if (match) {
          const pct = Math.min(100, Math.round(parseFloat(match[1])));
          if (pct !== downloadItem.progress) {
            downloadItem.progress = pct;
            this.notifyProgress(downloadItem, senderWindow);
          }
        }
      });

      proc.stderr.on('data', (d) => {
        stderr += d.toString();
      });

      proc.on('close', (code) => {
        if (code === 0 && fs.existsSync(destPath)) {
          downloadItem.progress = 100;
          downloadItem.status = 'completed';
          downloadItem.localPath = destPath;
          this.saveMetadata();
          this.notifyProgress(downloadItem, senderWindow);
          resolve(downloadItem);
        } else {
          downloadItem.status = 'failed';
          downloadItem.error = stderr || `Exit code ${code}`;
          this.notifyProgress(downloadItem, senderWindow);
          reject(new Error(downloadItem.error));
        }
      });

      proc.on('error', (err) => {
        downloadItem.status = 'failed';
        downloadItem.error = err.message;
        this.notifyProgress(downloadItem, senderWindow);
        reject(err);
      });
    });
  }

  public deleteDownload(id: string): boolean {
    const item = this.downloads.get(id);
    if (!item) return false;

    if (item.localPath && fs.existsSync(item.localPath)) {
      try {
        fs.unlinkSync(item.localPath);
      } catch (e) {
        console.error('Failed to remove audio file:', e);
      }
    }

    this.downloads.delete(id);
    this.saveMetadata();
    return true;
  }

  public getBatchStatus(): BatchDownloadProgress {
    const total = this.batchTotal;
    const completed = this.batchCompleted;
    const failed = this.batchFailed;
    const overallPercent = total > 0 ? Math.round(((completed + failed) / total) * 100) : 0;
    const currentTrack = this.batchQueue.length > 0 ? this.batchQueue[0].title : undefined;

    return {
      active: this.isBatchActive,
      total,
      completed,
      failed,
      currentTitle: currentTrack,
      overallPercent: Math.min(100, Math.max(0, overallPercent)),
    };
  }

  public queueBatch(
    tracks: Array<{ id: string; title: string; artist: string; url: string; thumbnailUrl?: string }>,
    senderWindow?: BrowserWindow
  ): BatchDownloadProgress {
    // Filter out already downloaded tracks
    const toDownload = tracks.filter((t) => !this.isDownloaded(t.id));
    if (toDownload.length === 0) {
      return {
        active: false,
        total: tracks.length,
        completed: tracks.length,
        failed: 0,
        overallPercent: 100,
      };
    }

    this.batchAborted = false;
    this.batchQueue.push(...toDownload);
    this.batchTotal += toDownload.length;
    this.isBatchActive = true;

    this.notifyBatchProgress(senderWindow);

    // Launch workers up to max concurrency
    while (this.activeBatchWorkers < this.maxBatchConcurrency && this.batchQueue.length > 0) {
      this.processNextBatch(senderWindow);
    }

    return this.getBatchStatus();
  }

  public cancelBatch(senderWindow?: BrowserWindow): void {
    this.batchAborted = true;
    this.batchQueue = [];
    this.isBatchActive = false;
    this.notifyBatchProgress(senderWindow);
  }

  private async processNextBatch(senderWindow?: BrowserWindow): Promise<void> {
    if (this.batchAborted || this.batchQueue.length === 0) {
      if (this.activeBatchWorkers === 0) {
        this.isBatchActive = false;
        this.notifyBatchProgress(senderWindow);
      }
      return;
    }

    const nextTrack = this.batchQueue.shift();
    if (!nextTrack) return;

    this.activeBatchWorkers++;
    this.notifyBatchProgress(senderWindow);

    try {
      await this.downloadTrack(nextTrack, senderWindow);
      this.batchCompleted++;
    } catch (e) {
      console.warn(`Batch download failed for track ${nextTrack.title}:`, e);
      this.batchFailed++;
    } finally {
      this.activeBatchWorkers--;
      this.notifyBatchProgress(senderWindow);

      if (this.batchQueue.length > 0 && !this.batchAborted) {
        this.processNextBatch(senderWindow);
      } else if (this.activeBatchWorkers === 0) {
        this.isBatchActive = false;
        this.notifyBatchProgress(senderWindow);
      }
    }
  }

  private notifyBatchProgress(window?: BrowserWindow): void {
    const win = window || BrowserWindow.getAllWindows()[0];
    if (win && !win.isDestroyed()) {
      win.webContents.send('download:batch-progress', this.getBatchStatus());
    }
  }

  private notifyProgress(item: DownloadItem, window?: BrowserWindow): void {
    const win = window || BrowserWindow.getAllWindows()[0];
    if (win && !win.isDestroyed()) {
      win.webContents.send('download-progress', {
        id: item.id,
        progress: item.progress,
        status: item.status,
        localPath: item.localPath,
        error: item.error,
        title: item.title,
        artist: item.artist,
        url: item.url,
        thumbnailUrl: item.thumbnailUrl,
      });
    }
  }
}
