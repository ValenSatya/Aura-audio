import { app, BrowserWindow, ipcMain, dialog, session, Tray, Menu, nativeImage, shell } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';
import { LocalStreamServer } from './services/streamServer';
import { YouTubeService } from './services/youtubeService';
import { DownloadManager } from './services/downloadManager';
import { AuthManager } from './services/authManager';
import { AccountManager } from './services/accountManager';
import { YTMusicClient } from './services/ytMusicClient';
import { parseM3UContent } from './parsers/m3uParser';
import { parseCSVContent } from './parsers/csvParser';
import { resolveOfficialCover } from './services/coverArtService';
import { SpotifyAuthManager } from './services/spotifyAuthManager';
import { SpotifyClient } from './services/spotifyClient';
import { SpotifyAudioMatcher } from './services/spotifyAudioMatcher';
import { SyncServer } from './services/syncServer';

let mainWindow: BrowserWindow | null = null;
let miniPlayerWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let streamServer: LocalStreamServer | null = null;
let downloadManager: DownloadManager | null = null;
let authManager: AuthManager | null = null;
let accountManager: AccountManager | null = null;
let spotifyAuthManager: SpotifyAuthManager | null = null;
let spotifyClient: SpotifyClient | null = null;
let spotifyAudioMatcher: SpotifyAudioMatcher | null = null;
let isQuitting = false;


const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 980,
    minHeight: 650,
    backgroundColor: '#09090b',
    title: 'AuraAudio Music Player',
    frame: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  if (isDev && process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    // mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('close', (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow?.hide();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

try {
  app.setPath('userData', path.join(app.getPath('appData'), 'aura-audio-app'));
} catch (e) {
  console.warn('Could not set custom userData path:', e);
}

// Low-RAM and high-speed streaming optimizations
app.commandLine.appendSwitch('js-flags', '--max-old-space-size=256');
app.commandLine.appendSwitch('disable-background-timer-throttling');
app.commandLine.appendSwitch('disable-backgrounding-occluded-windows');
app.commandLine.appendSwitch('disable-renderer-backgrounding');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-zero-copy');
app.commandLine.appendSwitch('autoplay-policy', 'no-user-gesture-required');

app.whenReady().then(async () => {
  // Inject Universal CORS headers so browser media elements can stream directly from CDNs
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    responseHeaders['Access-Control-Allow-Origin'] = ['*'];
    responseHeaders['Access-Control-Allow-Headers'] = ['*'];
    responseHeaders['Access-Control-Allow-Methods'] = ['GET, HEAD, OPTIONS'];
    callback({ responseHeaders });
  });

  // Start local streaming server
  streamServer = new LocalStreamServer();
  await streamServer.start();

  // Initialize download manager
  downloadManager = new DownloadManager();

  // Initialize authentication manager
  authManager = new AuthManager();

  // Initialize local account and playlist manager
  accountManager = new AccountManager();

  // Initialize Spotify services (The Spotube Method)
  spotifyAuthManager = new SpotifyAuthManager();
  spotifyClient = new SpotifyClient(spotifyAuthManager);
  spotifyAudioMatcher = new SpotifyAudioMatcher();

  // Initialize AuraSync server for cross-platform mobile sync
  if (streamServer && streamServer.getHttpServer() && accountManager) {
    SyncServer.init(streamServer.getHttpServer()!, accountManager);
    SyncServer.onCommand((cmd) => {
      mainWindow?.webContents.send('sync:remote-command', cmd);
    });
  }

  // AuraSync broadcast IPC
  ipcMain.on('sync:broadcast-state', (_event, state: any) => {
    SyncServer.broadcastPlaybackState(state);
  });

  // Local Account IPC handlers
  ipcMain.handle('account:register', async (_event, payload: any) => {
    if (!accountManager) return { success: false, error: 'AccountManager belum siap' };
    return accountManager.register(payload);
  });

  ipcMain.handle('account:login', async (_event, payload: any) => {
    if (!accountManager) return { success: false, error: 'AccountManager belum siap' };
    return accountManager.login(payload);
  });

  ipcMain.handle('account:logout', async () => {
    if (!accountManager) return false;
    return accountManager.logout();
  });

  ipcMain.handle('account:getCurrentUser', async () => {
    if (!accountManager) return { isLoggedIn: false };
    return accountManager.getCurrentUser();
  });

  ipcMain.handle('account:updateProfile', async (_event, payload: any) => {
    if (!accountManager) return { success: false, error: 'AccountManager belum siap' };
    return accountManager.updateProfile(payload);
  });

  // Persistent Playlists Storage
  ipcMain.handle('playlists:load', async () => {
    if (!accountManager) return [];
    return accountManager.loadPlaylists();
  });

  ipcMain.handle('playlists:save', async (_event, playlists: any[]) => {
    if (!accountManager) return false;
    return accountManager.savePlaylists(playlists);
  });

  ipcMain.handle('dialog:openDownloadsFolder', async () => {
    const dir = downloadManager ? downloadManager.getDownloadDir() : app.getPath('downloads');
    if (fs.existsSync(dir)) {
      shell.openPath(dir);
      return true;
    }
    return false;
  });

  ipcMain.handle('youtube:resolveStream', async (_event, url: string) => {
    const cookiesPath = authManager && authManager.hasCookies() ? authManager.getCookiesPath() : undefined;
    return await YouTubeService.resolveStreamUrl(url, cookiesPath);
  });

  // YouTube Music Account Client IPC
  ipcMain.handle('ytmusic:login-window', async () => {
    if (!authManager) return { isLoggedIn: false };
    return await authManager.loginWithWindow(mainWindow || undefined);
  });

  ipcMain.handle('ytmusic:logout', async () => {
    if (!authManager) return false;
    return await authManager.logout();
  });

  ipcMain.handle('ytmusic:get-status', async () => {
    if (accountManager) {
      const cur = accountManager.getCurrentUser();
      if (cur.isLoggedIn) return cur;
    }
    if (!authManager) return { isLoggedIn: false };
    return authManager.getAuthStatus();
  });


  ipcMain.handle('ytmusic:get-liked', async () => {
    if (!authManager) return [];
    const cookiesPath = authManager.getCookiesPath();
    return await YTMusicClient.getLikedMusic(cookiesPath);
  });

  ipcMain.handle('ytmusic:get-playlists', async () => {
    if (!authManager) return [];
    const cookiesPath = authManager.getCookiesPath();
    return await YTMusicClient.getUserPlaylists(cookiesPath);
  });

  ipcMain.handle('ytmusic:get-playlist-tracks', async (_event, playlistId: string) => {
    const cookiesPath = authManager && authManager.hasCookies() ? authManager.getCookiesPath() : undefined;
    return await YTMusicClient.getPlaylistTracks(playlistId, cookiesPath);
  });

  ipcMain.handle('ytmusic:search', async (_event, query: string) => {
    return await YTMusicClient.search(query);
  });

  ipcMain.handle('ytmusic:searchCategorized', async (_event, query: string) => {
    return await YTMusicClient.searchCategorized(query);
  });

  ipcMain.handle('ytmusic:getArtistDetails', async (_event, browseId: string, artistName?: string) => {
    return await YTMusicClient.getArtistDetails(browseId, artistName);
  });

  ipcMain.handle('ytmusic:getPersonalizedDiscovery', async (_event, seeds: any[]) => {
    return await YTMusicClient.getPersonalizedDiscovery(seeds);
  });

  ipcMain.handle('media:resolveOfficialCover', async (_event, title: string, artist: string, fallbackThumb?: string) => {
    return await resolveOfficialCover(title, artist, fallbackThumb);
  });

  // Spotify Integration IPC handlers (The Spotube Method)
  ipcMain.handle('spotify:login-window', async () => {
    if (!spotifyAuthManager) return { isLoggedIn: false };
    return await spotifyAuthManager.loginWithWindow(mainWindow || undefined);
  });

  ipcMain.handle('spotify:logout', async () => {
    if (!spotifyAuthManager) return false;
    return await spotifyAuthManager.logout();
  });

  ipcMain.handle('spotify:get-status', async () => {
    if (!spotifyAuthManager) return { isLoggedIn: false };
    return spotifyAuthManager.getAuthStatus();
  });

  ipcMain.handle('spotify:get-liked', async () => {
    if (!spotifyClient) return [];
    try {
      return await spotifyClient.getUserLikedSongs();
    } catch (e: any) {
      console.error('Failed to get Spotify liked songs:', e);
      return [];
    }
  });

  ipcMain.handle('spotify:get-playlists', async () => {
    if (!spotifyClient) return [];
    try {
      return await spotifyClient.getUserPlaylists();
    } catch (e: any) {
      console.error('Failed to get Spotify playlists:', e);
      return [];
    }
  });

  ipcMain.handle('spotify:resolve-url', async (_event, url: string) => {
    if (!spotifyClient) throw new Error('Spotify client belum siap');
    return await spotifyClient.resolveUrl(url);
  });

  ipcMain.handle('spotify:match-track', async (_event, track: any) => {
    if (!spotifyAudioMatcher) throw new Error('Spotify audio matcher belum siap');
    return await spotifyAudioMatcher.matchTrack(track);
  });

  ipcMain.handle('spotify:pre-match-batch', async (_event, tracks: any[]) => {
    if (spotifyAudioMatcher) {
      spotifyAudioMatcher.preMatchBatch(tracks);
    }
  });


  // Register IPC handlers
  ipcMain.handle('dialog:openAudioFiles', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Pilih File Audio',
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'wav', 'ogg', 'flac', 'm4a', 'aac', 'webm'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled) return null;
    return result.filePaths;
  });

  ipcMain.handle('dialog:openPlaylistFile', async () => {
    if (!mainWindow) return null;
    const result = await dialog.showOpenDialog(mainWindow, {
      title: 'Pilih File Playlist (M3U / CSV)',
      properties: ['openFile'],
      filters: [
        { name: 'Playlist & Spreadsheet', extensions: ['m3u', 'm3u8', 'csv'] },
        { name: 'M3U Playlists', extensions: ['m3u', 'm3u8'] },
        { name: 'CSV Spreadsheets', extensions: ['csv'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (result.canceled || result.filePaths.length === 0) return null;
    const filePath = result.filePaths[0];
    const ext = path.extname(filePath).toLowerCase().replace('.', '');
    return { filePath, extension: ext };
  });

  ipcMain.handle('playlist:parseM3U', async (_event, filePath: string) => {
    if (!fs.existsSync(filePath)) throw new Error('File tidak ditemukan');
    const content = fs.readFileSync(filePath, 'utf-8');
    const baseDir = path.dirname(filePath);
    return parseM3UContent(content, baseDir);
  });

  ipcMain.handle('playlist:parseCSV', async (_event, filePath: string) => {
    if (!fs.existsSync(filePath)) throw new Error('File tidak ditemukan');
    const content = fs.readFileSync(filePath, 'utf-8');
    const baseDir = path.dirname(filePath);
    return parseCSVContent(content, baseDir);
  });

  ipcMain.handle('playlist:autoHealPlaylist', async (_event, playlistName: string) => {
    try {
      const candidates = [
        path.join(app.getPath('downloads'), `${playlistName}.m3u`),
        path.join(app.getPath('downloads'), `${playlistName}.m3u8`),
        path.join(app.getPath('downloads'), 'My playlist_1.m3u'),
        path.join(app.getPath('documents'), `${playlistName}.m3u`),
      ];
      for (const p of candidates) {
        if (fs.existsSync(p)) {
          const content = fs.readFileSync(p, 'utf-8');
          const baseDir = path.dirname(p);
          return parseM3UContent(content, baseDir);
        }
      }
      return null;
    } catch (e) {
      console.warn('Auto-heal playlist check failed:', e);
      return null;
    }
  });

  ipcMain.handle('youtube:getInfo', async (_event, url: string) => {
    return await YouTubeService.getInfo(url);
  });

  ipcMain.handle('youtube:resolveStudioAudio', async (_event, artist: string, title: string, currentUrl?: string) => {
    return await YouTubeService.resolveStudioAudio(artist, title, currentUrl);
  });

  ipcMain.handle('youtube:download', async (_event, track: any) => {
    if (!downloadManager) throw new Error('Download manager not initialized');
    return await downloadManager.downloadTrack(track, mainWindow || undefined);
  });

  ipcMain.handle('youtube:deleteDownload', async (_event, id: string) => {
    if (!downloadManager) return false;
    return downloadManager.deleteDownload(id);
  });

  ipcMain.handle('youtube:downloadBatch', async (_event, tracks: any[]) => {
    if (!downloadManager) throw new Error('Download manager not initialized');
    return downloadManager.queueBatch(tracks, mainWindow || undefined);
  });

  ipcMain.handle('youtube:cancelBatch', async () => {
    if (!downloadManager) return;
    downloadManager.cancelBatch(mainWindow || undefined);
  });

  ipcMain.handle('youtube:getBatchStatus', async () => {
    if (!downloadManager) return { active: false, total: 0, completed: 0, failed: 0, overallPercent: 0 };
    return downloadManager.getBatchStatus();
  });

  ipcMain.handle('youtube:getDownloads', async () => {
    if (!downloadManager) return [];
    return downloadManager.getDownloadedItems();
  });

  ipcMain.handle('stream:getServerUrl', async () => {
    const port = streamServer ? streamServer.getPort() : 45454;
    return `http://127.0.0.1:${port}`;
  });

  ipcMain.on('window:minimize', () => {
    mainWindow?.minimize();
  });

  ipcMain.on('window:maximize', () => {
    if (mainWindow?.isMaximized()) {
      mainWindow.unmaximize();
    } else {
      mainWindow?.maximize();
    }
  });

  ipcMain.on('window:close', () => {
    if (!isQuitting) {
      mainWindow?.hide();
    } else {
      mainWindow?.close();
    }
  });

  // Mini Player Window IPC handlers
  ipcMain.on('mini:open', () => {
    openMiniPlayerWindow();
  });

  ipcMain.on('mini:close', () => {
    if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
      miniPlayerWindow.close();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  ipcMain.on('mini:sync-state', (_event, state) => {
    if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
      miniPlayerWindow.webContents.send('mini:state', state);
    }
    if (state?.currentTrack?.title) {
      updateTrayMenu(state.currentTrack.title);
    }
  });

  ipcMain.on('mini:action', (_event, action, payload) => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('mini:action-forward', action, payload);
    }
  });

  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

const TRAY_ICON_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAJ0lEQVR4nGNgGL7gPw5AXwOIERspBlAciCQZgE0xxQaQBCg2gO4AAKGFn2GNdfcuAAAAAElFTkSuQmCC';

function createTray() {
  const icon = nativeImage.createFromDataURL(TRAY_ICON_PNG);
  tray = new Tray(icon);
  tray.setToolTip('AuraAudio');

  updateTrayMenu();

  const handleTrayClick = () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
        mainWindow.focus();
      }
    }
  };

  tray.on('click', handleTrayClick);
  tray.on('double-click', handleTrayClick);
}

function updateTrayMenu(trackTitle?: string) {
  if (!tray || tray.isDestroyed()) return;

  const contextMenu = Menu.buildFromTemplate([
    { label: trackTitle ? `🎵 ${trackTitle}` : 'AuraAudio', enabled: false },
    { type: 'separator' },
    {
      label: 'Putar / Jeda',
      click: () => {
        mainWindow?.webContents.send('tray:action', 'play-pause');
      },
    },
    {
      label: 'Lagu Berikutnya',
      click: () => {
        mainWindow?.webContents.send('tray:action', 'next');
      },
    },
    {
      label: 'Lagu Sebelumnya',
      click: () => {
        mainWindow?.webContents.send('tray:action', 'prev');
      },
    },
    { type: 'separator' },
    {
      label: 'Buka Mini Player',
      click: () => {
        openMiniPlayerWindow();
      },
    },
    {
      label: 'Tampilkan Aplikasi Utama',
      click: () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Keluar',
      click: () => {
        isQuitting = true;
        if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
          miniPlayerWindow.close();
        }
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.close();
        }
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function openMiniPlayerWindow() {
  if (miniPlayerWindow && !miniPlayerWindow.isDestroyed()) {
    miniPlayerWindow.show();
    miniPlayerWindow.focus();
    return;
  }

  miniPlayerWindow = new BrowserWindow({
    width: 360,
    height: 104,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    frame: false,
    transparent: false,
    backgroundColor: '#09090b',
    skipTaskbar: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: true,
      backgroundThrottling: false,
      spellcheck: false,
    },
  });

  const miniDevUrl = isDev && process.env.VITE_DEV_SERVER_URL
    ? `${process.env.VITE_DEV_SERVER_URL}?view=mini`
    : '';

  if (miniDevUrl) {
    miniPlayerWindow.loadURL(miniDevUrl);
  } else {
    miniPlayerWindow.loadFile(path.join(__dirname, '../dist/index.html'), { query: { view: 'mini' } });
  }

  miniPlayerWindow.on('closed', () => {
    miniPlayerWindow = null;
  });
}

app.on('before-quit', () => {
  isQuitting = true;
});

app.on('window-all-closed', () => {
  if (isQuitting) {
    if (streamServer) {
      streamServer.stop();
    }
    if (process.platform !== 'darwin') {
      app.quit();
    }
  }
});
