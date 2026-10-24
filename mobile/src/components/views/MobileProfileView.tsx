import React, { useState, useEffect } from 'react';
import { CrossfadeSettings } from '../../types/music';
import { MobileDownloadService } from '../../services/mobileDownloadService';
import { MobileAudioCache } from '../../services/mobileAudioCache';
import { ApiClient, UserProfile } from '../../services/apiClient';
import {
  SFPersonCropCircle,
  SFSliderHorizontal3,
  SFLaptopcomputer,
  SFChevronRight,
  SFArrowDownCircle,
  SFMusicNote,
  SFAirplayAudio,
  SFCheckmark,
} from '../common/AppleIcons';

interface MobileProfileViewProps {
  currentPreset: string;
  crossfadeSettings: CrossfadeSettings;
  onOpenEQ?: () => void;
  onSetCrossfadeSettings: (settings: CrossfadeSettings) => void;
  onNavigateToLibraryDownloads: () => void;
  syncData?: { isConnected: boolean; user: any | null };
  user: UserProfile | null;
  onOpenAuth: (mode?: 'login' | 'register') => void;
  onLogout: () => void;
}

export const MobileProfileView: React.FC<MobileProfileViewProps> = ({
  currentPreset,
  crossfadeSettings,
  onOpenEQ,
  onSetCrossfadeSettings,
  onNavigateToLibraryDownloads,
  syncData,
  user,
  onOpenAuth,
  onLogout,
}) => {
  // Storage Stats
  const [downloadCount, setDownloadCount] = useState<number>(0);
  const [downloadSizeMB, setDownloadSizeMB] = useState<string>('0.0 MB');
  const [isClearingCache, setIsClearingCache] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // App Settings Toggles
  const [soundCheck, setSoundCheck] = useState<boolean>(() => {
    return localStorage.getItem('aura_sound_check') === 'true';
  });

  const loadStorageStats = async () => {
    try {
      const tracks = await MobileDownloadService.getDownloadedTracks();
      const bytes = await MobileDownloadService.getTotalDownloadedBytes();
      setDownloadCount(tracks.length);
      const mb = (bytes / (1024 * 1024)).toFixed(1);
      setDownloadSizeMB(`${mb} MB`);
    } catch {
      setDownloadCount(0);
      setDownloadSizeMB('0.0 MB');
    }
  };

  useEffect(() => {
    loadStorageStats();
    const unsub = MobileDownloadService.subscribe(loadStorageStats);
    return unsub;
  }, []);

  const handleSyncCloud = async () => {
    setIsSyncing(true);
    setStatusMessage('Menyinkronkan dengan server...');
    try {
      await ApiClient.syncAll();
      setStatusMessage('Data berhasil disinkronkan!');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Sinkronisasi cloud gagal, mode offline aktif.');
      setTimeout(() => setStatusMessage(null), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Hapus semua file audio yang diunduh dan cache offline?')) return;
    setIsClearingCache(true);
    try {
      await MobileDownloadService.clearAllDownloads();
      await MobileAudioCache.clearAllCache();
      await loadStorageStats();
      setStatusMessage('Cache berhasil dibersihkan');
      setTimeout(() => setStatusMessage(null), 3000);
    } catch {
      setStatusMessage('Gagal membersihkan cache');
    } finally {
      setIsClearingCache(false);
    }
  };

  return (
    <div className="min-h-full pb-36 px-4 pt-4 select-none text-white font-sans">
      {/* iOS Large Title Header */}
      <div className="mb-4 pt-2">
        <h1 className="text-[32px] font-bold tracking-tight text-white">Settings</h1>
      </div>

      {/* 1. Account Profile Card (Dynamic Guest vs Logged In) */}
      <div className="bg-[#1C1C1E] rounded-2xl p-4 border border-white/5 mb-6 shadow-sm">
        {user ? (
          // Logged In State
          <div>
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-neutral-700 to-neutral-800 border border-white/15 flex items-center justify-center text-white font-bold text-xl shadow-sm flex-shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-semibold text-white truncate">{user.name}</h2>
                <div className="flex items-center gap-1.5 mt-0.5 text-neutral-400">
                  <span className="text-[13px] truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
                  <p className="text-[11px] text-neutral-400">Akun Aura • Tersinkron Cloud</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center gap-2.5">
              <button
                onClick={handleSyncCloud}
                disabled={isSyncing}
                className="flex-1 py-2 px-3 rounded-xl bg-white/10 hover:bg-white/15 active:scale-95 text-xs font-semibold text-white transition-all text-center"
              >
                {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
              </button>
              <button
                onClick={onLogout}
                className="py-2 px-4 rounded-xl bg-red-500/15 hover:bg-red-500/25 active:scale-95 text-xs font-semibold text-red-300 transition-all text-center"
              >
                Keluar
              </button>
            </div>
          </div>
        ) : (
          // Clean Guest State
          <div>
            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 shadow-sm flex-shrink-0">
                <SFPersonCropCircle size={28} fill="#FFFFFF" />
              </div>

              <div className="flex-1 min-w-0">
                <h2 className="text-[17px] font-semibold text-white">AuraAudio ID</h2>
                <p className="text-[13px] text-neutral-400 mt-0.5">Mode Tamu (Guest)</p>
                <p className="text-[11px] text-neutral-500 mt-0.5">
                  Masuk untuk sinkronisasi lagu & riwayat
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3.5 border-t border-white/[0.08] flex items-center gap-2.5">
              <button
                onClick={() => onOpenAuth('login')}
                className="flex-1 py-2.5 rounded-xl bg-white text-black font-semibold text-xs active:scale-95 transition-all text-center shadow-sm"
              >
                Masuk
              </button>
              <button
                onClick={() => onOpenAuth('register')}
                className="flex-1 py-2.5 rounded-xl bg-white/10 border border-white/10 text-white font-semibold text-xs hover:bg-white/15 active:scale-95 transition-all text-center"
              >
                Daftar Akun Baru
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 2. Monochrome Audio & Playback Group */}
      <div className="mb-6">
        <div className="text-[12px] uppercase font-semibold text-neutral-400 px-3 mb-2 tracking-wider">
          Audio & Playback
        </div>
        <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 divide-y divide-white/[0.06] shadow-sm overflow-hidden">
          {/* Audio Quality (Monochrome Icon) */}
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-white/10 flex items-center justify-center text-white">
                <SFMusicNote size={15} fill="#FFFFFF" />
              </div>
              <span className="text-[15px] font-medium text-white">Audio Quality</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-neutral-400">Lossless</span>
              <SFChevronRight size={14} fill="#8E8E93" />
            </div>
          </div>

          {/* Equalizer Shortcut Row (Monochrome Icon) */}
          <div
            onClick={onOpenEQ}
            className="flex items-center justify-between p-3.5 cursor-pointer active:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-white/10 flex items-center justify-center text-white">
                <SFSliderHorizontal3 size={15} fill="#FFFFFF" />
              </div>
              <div>
                <span className="text-[15px] font-medium text-white block leading-tight">Equalizer</span>
                <span className="text-[11px] text-neutral-500">8-Band Audio Studio</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-neutral-400 capitalize">{currentPreset || 'Flat'}</span>
              <SFChevronRight size={14} fill="#8E8E93" />
            </div>
          </div>

          {/* Sound Check Toggle (Monochrome Switch) */}
          <div className="flex items-center justify-between p-3.5">
            <div>
              <span className="text-[15px] font-medium text-white block leading-tight">Sound Check</span>
              <span className="text-[11px] text-neutral-500">Normalisasi volume lagu</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={soundCheck}
                onChange={(e) => {
                  setSoundCheck(e.target.checked);
                  localStorage.setItem('aura_sound_check', String(e.target.checked));
                }}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-black" />
            </label>
          </div>

          {/* Crossfade (Monochrome) */}
          <div className="p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[15px] font-medium text-white block leading-tight">Crossfade</span>
                <span className="text-[11px] text-neutral-500">Transisi halus antar lagu</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={crossfadeSettings.enabled}
                  onChange={(e) =>
                    onSetCrossfadeSettings({
                      enabled: e.target.checked,
                      duration: e.target.checked ? Math.max(1, crossfadeSettings.duration || 3) : 0,
                    })
                  }
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-white peer-checked:after:bg-black" />
              </label>
            </div>

            {crossfadeSettings.enabled && (
              <div className="pt-2 flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="12"
                  step="1"
                  value={crossfadeSettings.duration}
                  onChange={(e) =>
                    onSetCrossfadeSettings({
                      enabled: true,
                      duration: parseInt(e.target.value, 10),
                    })
                  }
                  className="flex-1 accent-white h-1.5 bg-white/15 rounded-lg cursor-pointer"
                />
                <span className="text-xs font-medium tabular-nums text-white min-w-[28px] text-right">
                  {crossfadeSettings.duration}s
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. Monochrome Downloads & Storage Group */}
      <div className="mb-6">
        <div className="text-[12px] uppercase font-semibold text-neutral-400 px-3 mb-2 tracking-wider">
          Downloads & Storage
        </div>
        <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 divide-y divide-white/[0.06] shadow-sm overflow-hidden">
          {/* Downloaded Music */}
          <div
            onClick={onNavigateToLibraryDownloads}
            className="flex items-center justify-between p-3.5 cursor-pointer active:bg-white/[0.04] transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-white/10 flex items-center justify-center text-white">
                <SFArrowDownCircle size={15} fill="#FFFFFF" />
              </div>
              <span className="text-[15px] font-medium text-white">Downloaded Music</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[13px] text-neutral-400">
                {downloadCount} lagu ({downloadSizeMB})
              </span>
              <SFChevronRight size={14} fill="#8E8E93" />
            </div>
          </div>

          {/* Clear Cache */}
          <div
            onClick={handleClearCache}
            className={`flex items-center justify-between p-3.5 cursor-pointer active:bg-white/[0.04] transition-colors ${
              downloadCount === 0 || isClearingCache ? 'opacity-40 pointer-events-none' : ''
            }`}
          >
            <span className="text-[15px] font-medium text-neutral-300 hover:text-white">
              {isClearingCache ? 'Membersihkan...' : 'Hapus Cache Unduhan'}
            </span>
            <span className="text-xs text-neutral-500">IndexedDB</span>
          </div>
        </div>

        {statusMessage && (
          <div className="mt-2 text-xs text-center text-neutral-300 font-medium">
            {statusMessage}
          </div>
        )}
      </div>

      {/* 4. Monochrome Connected Devices Group */}
      <div className="mb-6">
        <div className="text-[12px] uppercase font-semibold text-neutral-400 px-3 mb-2 tracking-wider">
          Connected Devices
        </div>
        <div className="bg-[#1C1C1E] rounded-2xl border border-white/5 divide-y divide-white/[0.06] shadow-sm overflow-hidden">
          <div className="flex items-center justify-between p-3.5">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-[7px] bg-white/10 flex items-center justify-center text-white">
                <SFLaptopcomputer size={15} fill="#FFFFFF" />
              </div>
              <div>
                <span className="text-[15px] font-medium text-white block leading-tight">
                  AuraSync Laptop Studio
                </span>
                <span className="text-[11px] text-neutral-500">Wi-Fi Lokal Port 45454</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  syncData?.isConnected ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' : 'bg-neutral-600'
                }`}
              />
              <span className="text-xs text-neutral-400">
                {syncData?.isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Monochrome Footer Info */}
      <div className="text-center text-neutral-500 text-xs space-y-1 pt-2">
        <p className="font-semibold text-neutral-400">AuraAudio Mobile</p>
        <p className="text-[11px]">Versi 1.0.1 • Monokrom Minimalis</p>
      </div>
    </div>
  );
};
