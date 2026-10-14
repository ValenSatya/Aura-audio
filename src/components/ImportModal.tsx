import React, { useState, useEffect } from 'react';
import { Track, SpotifyImportResult, SpotifyProfile } from '../types/music';
import {
  X,
  FileSpreadsheet,
  FolderOpen,
  Plus,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Download,
  Play,
  User,
  LogOut,
  RefreshCw,
} from 'lucide-react';
import { YoutubeIcon } from './YoutubeIcon';
import { SpotifyIcon } from './SpotifyIcon';

interface ImportModalProps {
  isOpen: boolean;
  initialTab?: 'youtube' | 'playlist' | 'local' | 'spotify';
  onClose: () => void;
  onAddTracks: (tracks: Track[]) => void;
  onImportAsPlaylist?: (
    playlistName: string,
    tracks: Track[],
    options: { createAsPlaylist: boolean; preferStudioAudio: boolean }
  ) => void;
  onStartDownload?: (track: Track) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  initialTab = 'youtube',
  onClose,
  onAddTracks,
  onImportAsPlaylist,
  onStartDownload,
}) => {
  const [activeTab, setActiveTab] = useState<'youtube' | 'playlist' | 'local' | 'spotify'>(initialTab);

  // YouTube single URL input
  const [ytUrl, setYtUrl] = useState('');
  const [isLoadingYt, setIsLoadingYt] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytPreview, setYtPreview] = useState<{
    id: string;
    title: string;
    artist: string;
    duration: number;
    thumbnailUrl?: string;
  } | null>(null);

  // M3U/CSV file import state
  const [playlistLoading, setPlaylistLoading] = useState(false);
  const [playlistError, setPlaylistError] = useState<string | null>(null);
  const [targetPlaylistName, setTargetPlaylistName] = useState('');
  const [createAsNewPlaylist, setCreateAsNewPlaylist] = useState(true);
  const [preferStudioAudio, setPreferStudioAudio] = useState(true);
  const [playlistResult, setPlaylistResult] = useState<{
    type: 'm3u' | 'csv';
    fileName: string;
    tracks: Array<{
      title: string;
      artist?: string;
      url?: string;
      duration?: number;
      filePath?: string;
    }>;
  } | null>(null);

  // Spotify integration state (The Spotube Method)
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isLoadingSpotify, setIsLoadingSpotify] = useState(false);
  const [spotifyError, setSpotifyError] = useState<string | null>(null);
  const [spotifyResult, setSpotifyResult] = useState<SpotifyImportResult | null>(null);
  const [spotifyAuthStatus, setSpotifyAuthStatus] = useState<SpotifyProfile>({ isLoggedIn: false });
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<Array<{ id: string; name: string; trackCount: number; coverUrl: string; url: string }>>([]);
  const [showPlaylistsDropdown, setShowPlaylistsDropdown] = useState(false);

  useEffect(() => {
    if (isOpen && window.electronAPI?.getSpotifyAuthStatus) {
      window.electronAPI
        .getSpotifyAuthStatus()
        .then((status) => {
          setSpotifyAuthStatus(status || { isLoggedIn: false });
        })
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handler for single YouTube URL
  const handleFetchYt = async () => {
    if (!ytUrl.trim()) return;
    setIsLoadingYt(true);
    setYtError(null);
    setYtPreview(null);

    try {
      if (window.electronAPI?.getYouTubeInfo) {
        const meta = await window.electronAPI.getYouTubeInfo(ytUrl.trim());
        setYtPreview({
          id: meta.id,
          title: meta.title,
          artist: meta.artist || meta.uploader || 'YouTube Audio',
          duration: meta.duration || 0,
          thumbnailUrl: meta.thumbnailUrl,
        });
      } else {
        setYtPreview({
          id: 'demo_' + Date.now(),
          title: 'YouTube Stream: ' + ytUrl.substring(0, 30),
          artist: 'YouTube',
          duration: 180,
        });
      }
    } catch (err: any) {
      setYtError(err.message || 'Gagal mengambil informasi dari link YouTube tersebut.');
    } finally {
      setIsLoadingYt(false);
    }
  };

  const handleAddYt = (shouldDownload = false) => {
    if (!ytPreview) return;
    const newTrack: Track = {
      id: ytPreview.id,
      title: ytPreview.title,
      artist: ytPreview.artist,
      duration: ytPreview.duration,
      sourceType: 'youtube',
      url: ytUrl.trim(),
      thumbnailUrl: ytPreview.thumbnailUrl,
      isOffline: false,
      dateAdded: Date.now(),
    };

    onAddTracks([newTrack]);
    if (shouldDownload && onStartDownload) {
      onStartDownload(newTrack);
    }
    setYtUrl('');
    setYtPreview(null);
    onClose();
  };

  // Handler for M3U / CSV file dialog
  const handleSelectPlaylistFile = async () => {
    setPlaylistError(null);
    setPlaylistResult(null);
    try {
      if (!window.electronAPI?.openPlaylistFile) return;
      const res = await window.electronAPI.openPlaylistFile();
      if (!res || !res.filePath) return;

      const chosenPath = res.filePath;
      const isCsv = chosenPath.toLowerCase().endsWith('.csv');
      setPlaylistLoading(true);

      let parsed: any = null;
      if (isCsv && window.electronAPI?.parseCSVFile) {
        parsed = await window.electronAPI.parseCSVFile(chosenPath);
      } else if (window.electronAPI?.parseM3UFile) {
        parsed = await window.electronAPI.parseM3UFile(chosenPath);
      }

      if (!parsed || !parsed.tracks || parsed.tracks.length === 0) {
        setPlaylistError('Tidak ditemukan lagu yang valid di dalam file tersebut.');
        return;
      }

      const fileName = chosenPath.split(/[/\\]/).pop() || 'Playlist';
      const cleanName = fileName.replace(/\.[^/.]+$/, '');
      setTargetPlaylistName(cleanName);
      setPlaylistResult({
        type: isCsv ? 'csv' : 'm3u',
        fileName,
        tracks: parsed.tracks,
      });
    } catch (err: any) {
      setPlaylistError(err.message || 'Gagal memproses file playlist.');
    } finally {
      setPlaylistLoading(false);
    }
  };

  const handleImportPlaylistTracks = () => {
    if (!playlistResult || playlistResult.tracks.length === 0) return;

    const tracksToImport: Track[] = playlistResult.tracks.map((t, idx) => ({
      id: `imported_${Date.now()}_${idx}`,
      title: t.title || 'Unknown Title',
      artist: t.artist || 'Unknown Artist',
      duration: t.duration || 0,
      sourceType: playlistResult.type === 'csv' ? 'youtube' : 'm3u',
      url: t.url || t.filePath || '',
      localPath: t.filePath,
      isOffline: Boolean(t.filePath),
      dateAdded: Date.now(),
    }));

    if (createAsNewPlaylist && onImportAsPlaylist) {
      onImportAsPlaylist(targetPlaylistName.trim() || 'Playlist Baru', tracksToImport, {
        createAsPlaylist: true,
        preferStudioAudio,
      });
    } else {
      onAddTracks(tracksToImport);
    }

    setPlaylistResult(null);
    onClose();
  };

  // Handler for local audio file dialog
  const handleSelectLocalAudio = async () => {
    try {
      if (!window.electronAPI?.openAudioFiles) return;
      const filePaths = await window.electronAPI.openAudioFiles();
      if (!filePaths || filePaths.length === 0) return;

      const newTracks: Track[] = filePaths.map((fp: string, idx: number) => {
        const fileName = fp.split(/[/\\]/).pop() || 'Lagu';
        const title = fileName.replace(/\.[^/.]+$/, '');
        return {
          id: `local_${Date.now()}_${idx}`,
          title: title,
          artist: 'File Komputer Lokal',
          duration: 0,
          sourceType: 'local',
          url: fp,
          localPath: fp,
          isOffline: true,
          dateAdded: Date.now(),
        };
      });

      onAddTracks(newTracks);
      onClose();
    } catch (err) {
      console.error('Failed to import local files:', err);
    }
  };

  // Handlers for Spotify
  const handleFetchSpotify = async (customUrl?: string) => {
    const urlToFetch = (customUrl || spotifyUrl).trim();
    if (!urlToFetch) return;
    setIsLoadingSpotify(true);
    setSpotifyError(null);
    setSpotifyResult(null);

    try {
      if (window.electronAPI?.resolveSpotifyUrl) {
        const res = await window.electronAPI.resolveSpotifyUrl(urlToFetch);
        const tracks: Track[] = (res.tracks || []).map((t: any, idx: number) => ({
          id: `sp_${t.id || idx}_${Date.now()}`,
          title: t.title,
          artist: t.artist,
          album: t.album || res.title,
          duration: t.duration || 180,
          sourceType: 'spotify',
          url: t.url || `https://open.spotify.com/track/${t.id}`,
          thumbnailUrl: t.thumbnailUrl || res.coverUrl,
          spotifyId: t.id,
          isOffline: false,
          dateAdded: Date.now(),
        }));

        setSpotifyResult({
          type: res.type,
          title: res.title,
          subtitle: res.subtitle,
          coverUrl: res.coverUrl,
          totalTracks: res.totalTracks || tracks.length,
          tracks,
        });
        setTargetPlaylistName(res.title);
      }
    } catch (err: any) {
      setSpotifyError(err.message || 'Gagal mengambil data dari tautan Spotify.');
    } finally {
      setIsLoadingSpotify(false);
    }
  };

  const handleImportSpotifyTracks = (playImmediately: boolean = false) => {
    if (!spotifyResult || spotifyResult.tracks.length === 0) return;

    if (createAsNewPlaylist && onImportAsPlaylist && spotifyResult.type !== 'track' && !playImmediately) {
      onImportAsPlaylist(targetPlaylistName.trim() || spotifyResult.title, spotifyResult.tracks, {
        createAsPlaylist: true,
        preferStudioAudio,
      });
    } else {
      onAddTracks(spotifyResult.tracks);
    }

    setSpotifyResult(null);
    setSpotifyUrl('');
    onClose();
  };

  const handleLoginSpotify = async () => {
    setIsLoadingAuth(true);
    try {
      if (window.electronAPI?.loginSpotify) {
        const status = await window.electronAPI.loginSpotify();
        setSpotifyAuthStatus(status || { isLoggedIn: false });
      }
    } catch (e: any) {
      console.error('Spotify login error:', e);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleLogoutSpotify = async () => {
    try {
      if (window.electronAPI?.logoutSpotify) {
        await window.electronAPI.logoutSpotify();
        setSpotifyAuthStatus({ isLoggedIn: false });
        setUserPlaylists([]);
        setShowPlaylistsDropdown(false);
      }
    } catch (e) {}
  };

  const handleFetchLikedSongs = async () => {
    setIsLoadingSpotify(true);
    setSpotifyError(null);
    try {
      if (window.electronAPI?.getSpotifyLikedSongs) {
        const liked = await window.electronAPI.getSpotifyLikedSongs();
        if (liked && liked.length > 0) {
          const tracks: Track[] = liked.map((t: any, idx: number) => ({
            id: `sp_${t.id || idx}_${Date.now()}`,
            title: t.title,
            artist: t.artist,
            album: t.album || 'Spotify Liked Songs',
            duration: t.duration || 180,
            sourceType: 'spotify',
            url: t.url,
            thumbnailUrl: t.thumbnailUrl,
            spotifyId: t.id,
            isOffline: false,
            dateAdded: Date.now(),
          }));

          setSpotifyResult({
            type: 'playlist',
            title: 'Liked Songs (Spotify)',
            subtitle: `${liked.length} lagu favorit`,
            coverUrl: liked[0]?.thumbnailUrl,
            totalTracks: liked.length,
            tracks,
          });
          setTargetPlaylistName('Liked Songs (Spotify)');
        } else {
          setSpotifyError('Tidak ada lagu yang ditemukan di Liked Songs akun Spotify.');
        }
      }
    } catch (err: any) {
      setSpotifyError(err.message || 'Gagal mengambil Liked Songs.');
    } finally {
      setIsLoadingSpotify(false);
    }
  };

  const handleToggleUserPlaylists = async () => {
    if (showPlaylistsDropdown) {
      setShowPlaylistsDropdown(false);
      return;
    }
    setIsLoadingSpotify(true);
    try {
      if (window.electronAPI?.getSpotifyUserPlaylists) {
        const pl = await window.electronAPI.getSpotifyUserPlaylists();
        setUserPlaylists(pl || []);
        setShowPlaylistsDropdown(true);
      }
    } catch (err: any) {
      setSpotifyError(err.message || 'Gagal memuat daftar playlist.');
    } finally {
      setIsLoadingSpotify(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 font-['Sora'] select-none">
      <div className="bg-[#17171A] rounded-[10px] w-full max-w-lg overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#121214]">
          <h3 className="text-sm font-semibold text-[#F4F4F0]">Import Musik & Playlist</h3>
          <button
            onClick={onClose}
            className="p-2 rounded-[8px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab selection */}
        <div className="p-1.5 mx-6 mt-4 bg-[#121214] rounded-[8px] flex gap-1">
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex-1 py-2 text-xs font-medium rounded-[6px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'youtube'
                ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold'
                : 'text-[#8D8D93] hover:text-[#F4F4F0]'
            }`}
          >
            <YoutubeIcon size={14} className={activeTab === 'youtube' ? 'text-[#F4F4F0]' : 'text-[#8D8D93]'} />
            <span>Link YouTube</span>
          </button>

          <button
            onClick={() => setActiveTab('playlist')}
            className={`flex-1 py-2 text-xs font-medium rounded-[6px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'playlist'
                ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold'
                : 'text-[#8D8D93] hover:text-[#F4F4F0]'
            }`}
          >
            <FileSpreadsheet size={14} className={activeTab === 'playlist' ? 'text-[#F4F4F0]' : 'text-[#8D8D93]'} />
            <span>M3U / CSV</span>
          </button>

          <button
            onClick={() => setActiveTab('local')}
            className={`flex-1 py-2 text-xs font-medium rounded-[6px] flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'local'
                ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold'
                : 'text-[#8D8D93] hover:text-[#F4F4F0]'
            }`}
          >
            <FolderOpen size={14} className={activeTab === 'local' ? 'text-[#F4F4F0]' : 'text-[#8D8D93]'} />
            <span>File Lokal</span>
          </button>

          <button
            onClick={() => setActiveTab('spotify')}
            className={`flex-1 py-2 text-xs font-medium rounded-[6px] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'spotify'
                ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold'
                : 'text-[#8D8D93] hover:text-[#F4F4F0]'
            }`}
          >
            <SpotifyIcon size={14} className={activeTab === 'spotify' ? 'text-[#F4F4F0]' : 'text-[#8D8D93]'} />
            <span>Spotify</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 pt-4">
          {/* TAB 1: YOUTUBE */}
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-[#F4F4F0] mb-1.5">
                  Masukkan URL YouTube (Video / Music)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://www.youtube.com/watch?v=... atau https://youtu.be/..."
                    value={ytUrl}
                    onChange={(e) => setYtUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetchYt()}
                    className="flex-1 h-10 px-3.5 bg-[#1F1F23] rounded-[8px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none"
                  />
                  <button
                    onClick={handleFetchYt}
                    disabled={!ytUrl.trim() || isLoadingYt}
                    className="h-10 px-4 bg-[#F4F4F0] hover:bg-white disabled:bg-[#1F1F23] disabled:text-[#8D8D93] text-[#0B0B0C] rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isLoadingYt ? <Loader2 size={14} className="animate-spin" /> : null}
                    <span>Cek Info</span>
                  </button>
                </div>
              </div>

              {ytError && (
                <div className="p-3 bg-[#2D1616] rounded-[8px] flex items-start gap-2 text-xs text-[#E07A7A]">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{ytError}</span>
                </div>
              )}

              {ytPreview && (
                <div className="p-3 bg-[#1F1F23] rounded-[8px] flex items-center gap-3 animate-in fade-in duration-200">
                  <div className="w-12 h-12 rounded-[6px] overflow-hidden bg-[#0B0B0C] flex-shrink-0">
                    <img
                      src={ytPreview.thumbnailUrl}
                      alt={ytPreview.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-[#F4F4F0] truncate">{ytPreview.title}</p>
                    <p className="text-[11px] text-[#8D8D93] truncate mt-0.5">{ytPreview.artist}</p>
                    <span className="text-[10px] text-[#8D8D93] mt-0.5 inline-block font-['JetBrains_Mono']">
                      {Math.floor(ytPreview.duration / 60)}:
                      {String(ytPreview.duration % 60).padStart(2, '0')}
                    </span>
                  </div>
                </div>
              )}

              {ytPreview && (
                <div className="flex gap-2.5 pt-2">
                  <button
                    onClick={() => handleAddYt(false)}
                    className="flex-1 h-10 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[8px] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Tambah ke Antrean</span>
                  </button>

                  <button
                    onClick={() => handleAddYt(true)}
                    className="flex-1 h-10 bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Download size={14} />
                    <span>Tambah & Unduh Offline</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: M3U & CSV */}
          {activeTab === 'playlist' && (
            <div className="space-y-4">
              <div className="text-center p-6 rounded-[8px] bg-[#1F1F23]">
                <FileSpreadsheet size={32} className="mx-auto text-[#8D8D93] mb-2" />
                <h4 className="text-xs font-semibold text-[#F4F4F0] mb-1">Pilih File Playlist M3U / CSV</h4>
                <p className="text-[11px] text-[#8D8D93] max-w-xs mx-auto mb-4">
                  Mendukung format .m3u, .m3u8, serta spreadsheet tabel .csv (judul, artis, link/path).
                </p>

                <button
                  onClick={handleSelectPlaylistFile}
                  disabled={playlistLoading}
                  className="px-5 h-10 bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] rounded-[8px] text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer"
                >
                  {playlistLoading ? <Loader2 size={14} className="animate-spin" /> : <FolderOpen size={14} />}
                  <span>Pilih File Playlist</span>
                </button>
              </div>

              {playlistError && (
                <div className="p-3 bg-[#2D1616] rounded-[8px] flex items-start gap-2 text-xs text-[#E07A7A]">
                  <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                  <span>{playlistError}</span>
                </div>
              )}

              {playlistResult && (
                <div className="p-4 bg-[#1F1F23] rounded-[8px] space-y-3.5 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#F4F4F0] truncate max-w-[280px]">
                        {playlistResult.fileName}
                      </p>
                      <p className="text-[11px] text-[#F4F4F0] flex items-center gap-1 mt-0.5">
                        <CheckCircle2 size={12} /> {playlistResult.tracks.length} lagu berhasil dideteksi
                      </p>
                    </div>
                    <span className="text-[10px] uppercase font-['JetBrains_Mono'] px-2 py-0.5 rounded-[4px] bg-[#34343A] text-[#8D8D93]">
                      {playlistResult.type}
                    </span>
                  </div>

                  {/* Playlist Name Input */}
                  <div>
                    <label className="block text-[11px] font-medium text-[#8D8D93] mb-1">
                      Nama Playlist Baru
                    </label>
                    <input
                      type="text"
                      value={targetPlaylistName}
                      onChange={(e) => setTargetPlaylistName(e.target.value)}
                      placeholder="Nama playlist..."
                      className="w-full h-10 px-3.5 bg-[#17171A] rounded-[8px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none"
                    />
                  </div>

                  {/* Options */}
                  <div className="space-y-2 pt-1 text-xs text-[#8D8D93]">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-[#F4F4F0]">
                      <input
                        type="checkbox"
                        checked={createAsNewPlaylist}
                        onChange={(e) => setCreateAsNewPlaylist(e.target.checked)}
                        className="w-4 h-4 rounded-[4px] bg-[#17171A] accent-[#F4F4F0] cursor-pointer"
                      />
                      <span>Simpan sebagai Playlist Baru di Sidebar ("{targetPlaylistName || 'Playlist'}")</span>
                    </label>

                    <label className="flex items-center gap-2.5 cursor-pointer select-none text-[#F4F4F0]">
                      <input
                        type="checkbox"
                        checked={preferStudioAudio}
                        onChange={(e) => setPreferStudioAudio(e.target.checked)}
                        className="w-4 h-4 rounded-[4px] bg-[#17171A] accent-[#F4F4F0] cursor-pointer"
                      />
                      <span>Prioritaskan Audio Studio Resmi (Hindari MV / Video Klip)</span>
                    </label>
                  </div>

                  <button
                    onClick={handleImportPlaylistTracks}
                    className="w-full h-10 bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] rounded-[8px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>
                      {createAsNewPlaylist
                        ? `Buat Playlist "${targetPlaylistName || 'Playlist'}" (${playlistResult.tracks.length} Lagu)`
                        : `Impor ${playlistResult.tracks.length} Lagu ke Antrean`}
                    </span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: FILE LOKAL */}
          {activeTab === 'local' && (
            <div className="text-center p-8 rounded-[8px] bg-[#1F1F23] space-y-4">
              <FolderOpen size={36} className="mx-auto text-[#8D8D93]" />
              <div>
                <h4 className="text-xs font-semibold text-[#F4F4F0] mb-1">Tambah File Audio dari Komputer</h4>
                <p className="text-[11px] text-[#8D8D93] max-w-xs mx-auto">
                  Pilih satu atau banyak file musik (MP3, WAV, FLAC, OGG, M4A, AAC) yang tersimpan di laptop Anda.
                </p>
              </div>

              <button
                onClick={handleSelectLocalAudio}
                className="px-6 h-10 bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] rounded-[8px] text-xs font-semibold inline-flex items-center gap-2 transition-all cursor-pointer"
              >
                <FolderOpen size={15} />
                <span>Jelajahi File Komputer</span>
              </button>
            </div>
          )}

          {/* TAB 4: SPOTIFY (The Spotube Method) */}
          {activeTab === 'spotify' && (
            <div className="space-y-4">
              {/* URL Input */}
              <div>
                <label className="block text-xs font-medium text-[#F4F4F0] mb-1.5">
                  Tempel Tautan Spotify (Playlist, Album, atau Lagu)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="https://open.spotify.com/playlist/... atau /album/... atau /track/..."
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleFetchSpotify()}
                    className="flex-1 h-10 px-3.5 bg-[#1F1F23] rounded-[8px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none"
                  />
                  <button
                    onClick={() => handleFetchSpotify()}
                    disabled={!spotifyUrl.trim() || isLoadingSpotify}
                    className="h-10 px-4 bg-[#F4F4F0] hover:bg-white disabled:bg-[#1F1F23] disabled:text-[#8D8D93] text-[#0B0B0C] rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    {isLoadingSpotify ? <Loader2 size={14} className="animate-spin" /> : null}
                    <span>Ambil Data</span>
                  </button>
                </div>
              </div>

              {/* Error Notice */}
              {spotifyError && (
                <div className="p-3 bg-[#1F1F23] rounded-[8px] flex items-center gap-2 text-xs text-[#E07A7A]">
                  <AlertCircle size={15} className="flex-shrink-0" />
                  <span>{spotifyError}</span>
                </div>
              )}

              {/* Preview Card */}
              {spotifyResult && (
                <div className="p-4 bg-[#1F1F23] rounded-[8px] space-y-3 animate-in fade-in">
                  <div className="flex items-center gap-3">
                    {spotifyResult.coverUrl ? (
                      <img
                        src={spotifyResult.coverUrl}
                        alt={spotifyResult.title}
                        className="w-14 h-14 rounded-[8px] object-cover flex-shrink-0 bg-[#0B0B0C]"
                      />
                    ) : (
                      <div className="w-14 h-14 rounded-[8px] bg-[#121214] flex items-center justify-center text-[#8D8D93]">
                        <SpotifyIcon size={24} />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] uppercase font-mono tracking-wider text-[#8D8D93] block">
                        {spotifyResult.type === 'playlist'
                          ? 'Spotify Playlist'
                          : spotifyResult.type === 'album'
                          ? 'Spotify Album'
                          : 'Spotify Track'}
                      </span>
                      <h4 className="text-sm font-semibold text-[#F4F4F0] truncate">{spotifyResult.title}</h4>
                      <p className="text-xs text-[#8D8D93] truncate">
                        {spotifyResult.subtitle ? `${spotifyResult.subtitle} • ` : ''}
                        {spotifyResult.totalTracks} lagu
                      </p>
                    </div>
                  </div>

                  {spotifyResult.type !== 'track' && (
                    <div className="space-y-2 pt-1 border-t border-white/5">
                      <input
                        type="text"
                        placeholder="Nama playlist di AuraAudio"
                        value={targetPlaylistName}
                        onChange={(e) => setTargetPlaylistName(e.target.value)}
                        className="w-full h-8 px-3 bg-[#121214] rounded-[6px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none"
                      />
                      <label className="flex items-center gap-2 cursor-pointer text-xs text-[#8D8D93] hover:text-[#F4F4F0]">
                        <input
                          type="checkbox"
                          checked={createAsNewPlaylist}
                          onChange={(e) => setCreateAsNewPlaylist(e.target.checked)}
                          className="rounded text-[#F4F4F0] focus:ring-0 cursor-pointer"
                        />
                        <span>Simpan sebagai Playlist baru di Pustaka</span>
                      </label>
                    </div>
                  )}

                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => handleImportSpotifyTracks(false)}
                      className="flex-1 h-9 bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] rounded-[6px] text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus size={14} />
                      <span>
                        {createAsNewPlaylist && spotifyResult.type !== 'track'
                          ? 'Simpan ke Playlist'
                          : 'Tambah ke Antrean'}
                      </span>
                    </button>
                    <button
                      onClick={() => handleImportSpotifyTracks(true)}
                      className="h-9 px-3.5 bg-[#121214] hover:bg-[#17171A] text-[#F4F4F0] rounded-[6px] text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Play size={13} fill="currentColor" />
                      <span>Putar</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Spotify Account Connect Box */}
              <div className="p-3.5 bg-[#121214] rounded-[8px] space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SpotifyIcon size={16} className="text-[#F4F4F0]" />
                    <span className="text-xs font-semibold text-[#F4F4F0]">Akun Spotify</span>
                  </div>
                  {spotifyAuthStatus.isLoggedIn ? (
                    <span className="text-[11px] text-[#8D8D93] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#B7F161] inline-block" />
                      Terhubung
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#8D8D93]">Belum terhubung</span>
                  )}
                </div>

                {spotifyAuthStatus.isLoggedIn ? (
                  <div className="space-y-2 pt-1">
                    <div className="flex items-center justify-between text-xs text-[#F4F4F0] bg-[#1F1F23] px-3 py-2 rounded-[6px]">
                      <div className="flex items-center gap-2 truncate">
                        {spotifyAuthStatus.avatarUrl ? (
                          <img
                            src={spotifyAuthStatus.avatarUrl}
                            alt=""
                            className="w-5 h-5 rounded-full object-cover"
                          />
                        ) : (
                          <User size={14} className="text-[#8D8D93]" />
                        )}
                        <span className="truncate">{spotifyAuthStatus.name}</span>
                      </div>
                      <button
                        onClick={handleLogoutSpotify}
                        className="text-[11px] text-[#8D8D93] hover:text-[#E07A7A] transition-colors cursor-pointer flex items-center gap-1"
                        title="Logout dari Spotify"
                      >
                        <LogOut size={12} />
                        <span>Keluar</span>
                      </button>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleFetchLikedSongs}
                        disabled={isLoadingSpotify}
                        className="flex-1 h-8 bg-[#1F1F23] hover:bg-[#25252A] text-xs text-[#F4F4F0] rounded-[6px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <RefreshCw size={12} className={isLoadingSpotify ? 'animate-spin' : ''} />
                        <span>Liked Songs</span>
                      </button>

                      <button
                        onClick={handleToggleUserPlaylists}
                        disabled={isLoadingSpotify}
                        className="flex-1 h-8 bg-[#1F1F23] hover:bg-[#25252A] text-xs text-[#F4F4F0] rounded-[6px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <span>Daftar Playlist</span>
                      </button>
                    </div>

                    {showPlaylistsDropdown && userPlaylists.length > 0 && (
                      <div className="mt-2 max-h-40 overflow-y-auto space-y-1 bg-[#1F1F23] p-1.5 rounded-[6px]">
                        {userPlaylists.map((pl) => (
                          <div
                            key={pl.id}
                            onClick={() => {
                              handleFetchSpotify(pl.url);
                              setShowPlaylistsDropdown(false);
                            }}
                            className="px-2.5 py-1.5 rounded-[4px] hover:bg-[#121214] text-xs text-[#F4F4F0] flex items-center justify-between cursor-pointer"
                          >
                            <span className="truncate">{pl.name}</span>
                            <span className="text-[10px] text-[#8D8D93] flex-shrink-0 ml-2">{pl.trackCount} lagu</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-[#8D8D93] mb-2 leading-relaxed">
                      Hubungkan akun Spotify (Free atau Premium) untuk menarik playlist pribadi dan lagu yang disukai secara otomatis.
                    </p>
                    <button
                      onClick={handleLoginSpotify}
                      disabled={isLoadingAuth}
                      className="w-full h-8 bg-[#1F1F23] hover:bg-[#25252A] text-[#F4F4F0] rounded-[6px] text-xs font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      {isLoadingAuth ? <Loader2 size={13} className="animate-spin" /> : <SpotifyIcon size={13} />}
                      <span>Masuk dengan Spotify</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
