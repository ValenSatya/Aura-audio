import { contextBridge, ipcRenderer } from 'electron';

export interface ElectronAPI {
  // File dialogs
  openAudioFiles: () => Promise<string[] | null>;
  openPlaylistFile: () => Promise<{ filePath: string; extension: string } | null>;
  
  // Parsers
  parseM3UFile: (filePath: string) => Promise<any[]>;
  parseCSVFile: (filePath: string) => Promise<any[]>;
  autoHealPlaylist?: (playlistName: string) => Promise<any[] | null>;

  // YouTube & Streams
  getYouTubeInfo: (url: string) => Promise<any>;
  downloadYouTubeTrack: (track: any) => Promise<any>;
  deleteDownload: (id: string) => Promise<boolean>;
  getDownloadedTracks: () => Promise<any[]>;
  getStreamServerUrl: () => Promise<string>;
  resolveStreamUrl: (url: string) => Promise<string>;
  resolveStudioAudio: (artist: string, title: string, currentUrl?: string) => Promise<{ url: string; title?: string; artist?: string; duration?: number; foundStudio: boolean }>;

  // Local Account
  registerAccount: (payload: any) => Promise<{ success: boolean; user?: any; error?: string }>;
  loginAccount: (payload: any) => Promise<{ success: boolean; user?: any; error?: string }>;
  logoutAccount: () => Promise<boolean>;
  getCurrentAccount: () => Promise<any>;
  updateAccountProfile: (payload: any) => Promise<{ success: boolean; user?: any; error?: string }>;

  // Persistent Playlists Storage
  loadPersistentPlaylists: () => Promise<any[]>;
  savePersistentPlaylists: (playlists: any[]) => Promise<boolean>;
  openDownloadsFolder: () => Promise<boolean>;

  // YouTube Music Account Client
  loginYouTubeMusic: () => Promise<any>;
  logoutYouTubeMusic: () => Promise<boolean>;
  getYouTubeMusicAuthStatus: () => Promise<any>;
  getLikedMusic: () => Promise<any[]>;
  getUserPlaylists: () => Promise<any[]>;
  getPlaylistTracks: (playlistId: string) => Promise<any[]>;
  searchYouTubeMusic: (query: string) => Promise<any[]>;
  searchYouTubeMusicCategorized: (query: string) => Promise<any>;
  getArtistDetails: (browseId: string, artistName?: string) => Promise<any>;
  resolveOfficialCover: (title: string, artist: string, fallbackThumb?: string) => Promise<string>;

  // Spotify Integration (The Spotube Method)
  loginSpotify: () => Promise<any>;
  logoutSpotify: () => Promise<boolean>;
  getSpotifyAuthStatus: () => Promise<any>;
  getSpotifyLikedSongs: () => Promise<any[]>;
  getSpotifyUserPlaylists: () => Promise<any[]>;
  resolveSpotifyUrl: (url: string) => Promise<any>;
  matchSpotifyTrack: (track: any) => Promise<any>;
  preMatchSpotifyBatch: (tracks: any[]) => Promise<void>;

  // Download events & Batch
  downloadBatch: (tracks: any[]) => Promise<any>;
  cancelBatch: () => Promise<void>;
  getBatchStatus: () => Promise<any>;
  onDownloadProgress: (callback: (data: { id: string; progress: number; status: string; localPath?: string; error?: string; title?: string; artist?: string; url?: string; thumbnailUrl?: string }) => void) => () => void;
  onBatchDownloadProgress: (callback: (data: any) => void) => () => void;

  // Mini Player & System Tray
  openMiniPlayer: () => void;
  closeMiniPlayer: () => void;
  sendMiniState: (state: any) => void;
  onMiniState: (callback: (state: any) => void) => () => void;
  sendMiniAction: (action: string, payload?: any) => void;
  onMiniAction: (callback: (action: string, payload?: any) => void) => () => void;
  onTrayAction: (callback: (action: string) => void) => () => void;

  // Window control
  minimizeWindow: () => void;
  maximizeWindow: () => void;
  closeWindow: () => void;
}

const api: ElectronAPI = {
  openAudioFiles: () => ipcRenderer.invoke('dialog:openAudioFiles'),
  openPlaylistFile: () => ipcRenderer.invoke('dialog:openPlaylistFile'),

  parseM3UFile: (filePath: string) => ipcRenderer.invoke('playlist:parseM3U', filePath),
  parseCSVFile: (filePath: string) => ipcRenderer.invoke('playlist:parseCSV', filePath),
  autoHealPlaylist: (playlistName: string) => ipcRenderer.invoke('playlist:autoHealPlaylist', playlistName),

  getYouTubeInfo: (url: string) => ipcRenderer.invoke('youtube:getInfo', url),
  downloadYouTubeTrack: (track: any) => ipcRenderer.invoke('youtube:download', track),
  downloadBatch: (tracks: any[]) => ipcRenderer.invoke('youtube:downloadBatch', tracks),
  cancelBatch: () => ipcRenderer.invoke('youtube:cancelBatch'),
  getBatchStatus: () => ipcRenderer.invoke('youtube:getBatchStatus'),
  deleteDownload: (id: string) => ipcRenderer.invoke('youtube:deleteDownload', id),
  getDownloadedTracks: () => ipcRenderer.invoke('youtube:getDownloads'),
  getStreamServerUrl: () => ipcRenderer.invoke('stream:getServerUrl'),
  resolveStreamUrl: (url: string) => ipcRenderer.invoke('youtube:resolveStream', url),
  resolveStudioAudio: (artist: string, title: string, currentUrl?: string) => ipcRenderer.invoke('youtube:resolveStudioAudio', artist, title, currentUrl),

  // Local Account
  registerAccount: (payload) => ipcRenderer.invoke('account:register', payload),
  loginAccount: (payload) => ipcRenderer.invoke('account:login', payload),
  logoutAccount: () => ipcRenderer.invoke('account:logout'),
  getCurrentAccount: () => ipcRenderer.invoke('account:getCurrentUser'),
  updateAccountProfile: (payload) => ipcRenderer.invoke('account:updateProfile', payload),

  // Persistent Playlists Storage
  loadPersistentPlaylists: () => ipcRenderer.invoke('playlists:load'),
  savePersistentPlaylists: (playlists) => ipcRenderer.invoke('playlists:save', playlists),
  openDownloadsFolder: () => ipcRenderer.invoke('dialog:openDownloadsFolder'),

  loginYouTubeMusic: () => ipcRenderer.invoke('ytmusic:login-window'),
  logoutYouTubeMusic: () => ipcRenderer.invoke('ytmusic:logout'),
  getYouTubeMusicAuthStatus: () => ipcRenderer.invoke('ytmusic:get-status'),

  getLikedMusic: () => ipcRenderer.invoke('ytmusic:get-liked'),
  getUserPlaylists: () => ipcRenderer.invoke('ytmusic:get-playlists'),
  getPlaylistTracks: (playlistId: string) => ipcRenderer.invoke('ytmusic:get-playlist-tracks', playlistId),
  searchYouTubeMusic: (query: string) => ipcRenderer.invoke('ytmusic:search', query),
  searchYouTubeMusicCategorized: (query: string) => ipcRenderer.invoke('ytmusic:searchCategorized', query),
  getArtistDetails: (browseId: string, artistName?: string) => ipcRenderer.invoke('ytmusic:getArtistDetails', browseId, artistName),
  resolveOfficialCover: (title: string, artist: string, fallbackThumb?: string) =>
    ipcRenderer.invoke('media:resolveOfficialCover', title, artist, fallbackThumb),

  // Spotify Integration (The Spotube Method)
  loginSpotify: () => ipcRenderer.invoke('spotify:login-window'),
  logoutSpotify: () => ipcRenderer.invoke('spotify:logout'),
  getSpotifyAuthStatus: () => ipcRenderer.invoke('spotify:get-status'),
  getSpotifyLikedSongs: () => ipcRenderer.invoke('spotify:get-liked'),
  getSpotifyUserPlaylists: () => ipcRenderer.invoke('spotify:get-playlists'),
  resolveSpotifyUrl: (url: string) => ipcRenderer.invoke('spotify:resolve-url', url),
  matchSpotifyTrack: (track: any) => ipcRenderer.invoke('spotify:match-track', track),
  preMatchSpotifyBatch: (tracks: any[]) => ipcRenderer.invoke('spotify:pre-match-batch', tracks),

  onDownloadProgress: (callback) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('download-progress', subscription);
    return () => {
      ipcRenderer.removeListener('download-progress', subscription);
    };
  },

  onBatchDownloadProgress: (callback) => {
    const subscription = (_event: any, data: any) => callback(data);
    ipcRenderer.on('download:batch-progress', subscription);
    return () => {
      ipcRenderer.removeListener('download:batch-progress', subscription);
    };
  },

  openMiniPlayer: () => ipcRenderer.send('mini:open'),
  closeMiniPlayer: () => ipcRenderer.send('mini:close'),
  sendMiniState: (state) => ipcRenderer.send('mini:sync-state', state),
  onMiniState: (callback) => {
    const sub = (_event: any, state: any) => callback(state);
    ipcRenderer.on('mini:state', sub);
    return () => {
      ipcRenderer.removeListener('mini:state', sub);
    };
  },
  sendMiniAction: (action, payload) => ipcRenderer.send('mini:action', action, payload),
  onMiniAction: (callback) => {
    const sub = (_event: any, action: string, payload?: any) => callback(action, payload);
    ipcRenderer.on('mini:action-forward', sub);
    return () => {
      ipcRenderer.removeListener('mini:action-forward', sub);
    };
  },
  onTrayAction: (callback) => {
    const sub = (_event: any, action: string) => callback(action);
    ipcRenderer.on('tray:action', sub);
    return () => {
      ipcRenderer.removeListener('tray:action', sub);
    };
  },

  minimizeWindow: () => ipcRenderer.send('window:minimize'),
  maximizeWindow: () => ipcRenderer.send('window:maximize'),
  closeWindow: () => ipcRenderer.send('window:close'),
};

contextBridge.exposeInMainWorld('electronAPI', api);
