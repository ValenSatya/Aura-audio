/**
 * AuraAudio Playlist Transfer Service
 * Supports exporting and importing playlists in .json, .m3u, and .csv formats
 */

import { Track } from '../types/music';
import Papa from 'papaparse';

export class PlaylistTransferService {
  /**
   * Export tracks to an AuraAudio JSON file
   */
  public static exportToJSON(playlistName: string, tracks: Track[]) {
    const data = {
      name: playlistName,
      exportedAt: new Date().toISOString(),
      trackCount: tracks.length,
      tracks: tracks.map((t) => ({
        id: t.id,
        title: t.title,
        artist: t.artist,
        album: t.album,
        duration: t.duration,
        url: t.url,
        thumbnailUrl: t.thumbnailUrl,
        sourceType: t.sourceType,
      })),
    };

    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    this.triggerFileDownload(blob, `${playlistName.replace(/[\s/\\?%*:|"<>]/g, '_')}_AuraAudio.json`);
  }

  /**
   * Export tracks to a standard .m3u playlist file
   */
  public static exportToM3U(playlistName: string, tracks: Track[]) {
    let content = '#EXTM3U\n';
    for (const track of tracks) {
      content += `#EXTINF:${Math.round(track.duration || 0)},${track.artist} - ${track.title}\n`;
      content += `${track.url}\n`;
    }

    const blob = new Blob([content], { type: 'audio/x-mpegurl' });
    this.triggerFileDownload(blob, `${playlistName.replace(/[\s/\\?%*:|"<>]/g, '_')}.m3u`);
  }

  /**
   * Parse an uploaded file (.json, .m3u, or .csv) and convert to Track[]
   */
  public static async parsePlaylistFile(file: File): Promise<{ name: string; tracks: Track[] }> {
    const filename = file.name.toLowerCase();
    const defaultName = file.name.replace(/\.[^/.]+$/, '');

    if (filename.endsWith('.json')) {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) {
        return { name: defaultName, tracks: this.validateAndNormalizeTracks(parsed) };
      } else if (parsed && Array.isArray(parsed.tracks)) {
        return {
          name: parsed.name || defaultName,
          tracks: this.validateAndNormalizeTracks(parsed.tracks),
        };
      }
      throw new Error('Format JSON tidak sesuai format playlist.');
    }

    if (filename.endsWith('.m3u') || filename.endsWith('.m3u8')) {
      const text = await file.text();
      const tracks: Track[] = [];
      const lines = text.split(/\r?\n/);
      let pendingTitle = '';
      let pendingArtist = '';
      let pendingDuration = 0;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line || line.startsWith('#EXTM3U')) continue;

        if (line.startsWith('#EXTINF:')) {
          const match = line.match(/#EXTINF:(-?\d+),(.*)/);
          if (match) {
            pendingDuration = Math.max(0, parseInt(match[1], 10) || 0);
            const rawTitle = match[2].trim();
            const dashIdx = rawTitle.indexOf(' - ');
            if (dashIdx !== -1) {
              pendingArtist = rawTitle.substring(0, dashIdx).trim();
              pendingTitle = rawTitle.substring(dashIdx + 3).trim();
            } else {
              pendingTitle = rawTitle;
              pendingArtist = 'Artis Tidak Diketahui';
            }
          }
        } else if (!line.startsWith('#')) {
          tracks.push({
            id: `m3u-${Date.now()}-${tracks.length}`,
            title: pendingTitle || `Lagu ${tracks.length + 1}`,
            artist: pendingArtist || 'Artis M3U',
            album: defaultName,
            duration: pendingDuration,
            sourceType: /youtube\.com|youtu\.be/.test(line) ? 'youtube' : 'local',
            url: line,
            thumbnailUrl: '',
            dateAdded: Date.now(),
          });
          pendingTitle = '';
          pendingArtist = '';
          pendingDuration = 0;
        }
      }

      return { name: defaultName, tracks };
    }

    if (filename.endsWith('.csv')) {
      const text = await file.text();
      return new Promise((resolve, reject) => {
        Papa.parse(text, {
          header: true,
          complete: (results) => {
            const rows = (results.data as any[]).filter((r) => r.title && (r.url || r.id));
            const tracks: Track[] = rows.map((r, idx) => ({
              id: `csv-${Date.now()}-${idx}`,
              title: r.title,
              artist: r.artist || 'Artis CSV',
              album: r.album || defaultName,
              duration: parseInt(r.duration, 10) || 0,
              sourceType: 'csv',
              url: r.url || `https://www.youtube.com/watch?v=${r.id}`,
              thumbnailUrl: r.thumbnailUrl || r.cover || '',
              dateAdded: Date.now(),
            }));
            resolve({ name: defaultName, tracks });
          },
          error: (err: any) => reject(err),
        });
      });
    }

    throw new Error('Format file tidak didukung. Harap gunakan file .json, .m3u, atau .csv');
  }

  private static validateAndNormalizeTracks(rawList: any[]): Track[] {
    return rawList
      .filter((item) => item && (item.title || item.name))
      .map((item, idx) => ({
        id: item.id || `imp-${Date.now()}-${idx}`,
        title: item.title || item.name || 'Lagu Tanpa Judul',
        artist: item.artist || item.author || 'Artis Tidak Diketahui',
        album: item.album || 'Impor Aura',
        duration: parseInt(item.duration, 10) || 0,
        sourceType: item.sourceType || 'youtube',
        url: item.url || '',
        thumbnailUrl: item.thumbnailUrl || item.cover || '',
        dateAdded: item.dateAdded || Date.now(),
      }));
  }

  private static triggerFileDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  }
}
