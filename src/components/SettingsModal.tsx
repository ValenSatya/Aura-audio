import React, { useState } from 'react';
import { AppSettings, UserProfile } from '../types/music';
import {
  X,
  Sparkles,
  User,
  HardDrive,
  Info,
  FolderOpen,
  Trash2,
  Volume2,
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSettings: (newSettings: AppSettings) => void;
  userProfile: UserProfile;
  onOpenAuthModal: () => void;
  onOpenEqualizer: () => void;
  previewColors?: { primary: string; secondary: string };
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  userProfile,
  onOpenAuthModal,
  onOpenEqualizer,
  previewColors,
}) => {
  const [activeTab, setActiveTab] = useState<'visual' | 'audio' | 'account' | 'storage' | 'about'>('visual');
  const [cleanCacheNotice, setCleanCacheNotice] = useState(false);

  if (!isOpen) return null;

  const handleToggleDynamicLight = (enabled: boolean) => {
    onUpdateSettings({
      ...settings,
      dynamicLighting: {
        ...settings.dynamicLighting,
        enabled,
      },
    });
  };

  const handleIntensityChange = (intensity: 'subtle' | 'medium' | 'vibrant') => {
    onUpdateSettings({
      ...settings,
      dynamicLighting: {
        ...settings.dynamicLighting,
        intensity,
      },
    });
  };

  const handleCrossfadeChange = (val: number) => {
    onUpdateSettings({
      ...settings,
      audio: {
        ...settings.audio,
        crossfadeDuration: val,
        crossfadeEnabled: val > 0,
      },
    });
  };

  const handlePreferStudioToggle = (prefer: boolean) => {
    onUpdateSettings({
      ...settings,
      audio: {
        ...settings.audio,
        preferStudioAudio: prefer,
      },
    });
  };

  const handleOpenDownloads = async () => {
    if (window.electronAPI?.openDownloadsFolder) {
      await window.electronAPI.openDownloadsFolder();
    }
  };

  const handleClearImageCache = () => {
    try {
      localStorage.removeItem('aura_cover_art_cache');
      setCleanCacheNotice(true);
      setTimeout(() => setCleanCacheNotice(false), 2500);
    } catch {}
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-['Sora']">
      <div className="bg-[#17171A] rounded-[10px] w-full max-w-2xl h-[560px] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#121214] flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <h3 className="text-sm font-semibold text-[#F4F4F0] tracking-tight">Pengaturan Aplikasi</h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[8px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] transition-colors cursor-pointer"
            title="Tutup"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Workspace */}
        <div className="flex flex-1 overflow-hidden">
          {/* Left Navigation Sidebar */}
          <div className="w-52 bg-[#121214] p-3 flex flex-col gap-1 flex-shrink-0">
            <button
              onClick={() => setActiveTab('visual')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer text-left ${
                activeTab === 'visual'
                  ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold'
                  : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#17171A]'
              }`}
            >
              <Sparkles size={16} className={activeTab === 'visual' ? 'text-[#F4F4F0]' : ''} />
              <span>Dynamic Light</span>
            </button>

            <button
              onClick={() => setActiveTab('audio')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer text-left ${
                activeTab === 'audio'
                  ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold'
                  : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#17171A]'
              }`}
            >
              <Volume2 size={16} className={activeTab === 'audio' ? 'text-[#F4F4F0]' : ''} />
              <span>Audio & Suara</span>
            </button>

            <button
              onClick={() => setActiveTab('account')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer text-left ${
                activeTab === 'account'
                  ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold'
                  : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#17171A]'
              }`}
            >
              <User size={16} className={activeTab === 'account' ? 'text-[#F4F4F0]' : ''} />
              <span>Akun Pengguna</span>
            </button>

            <button
              onClick={() => setActiveTab('storage')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer text-left ${
                activeTab === 'storage'
                  ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold'
                  : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#17171A]'
              }`}
            >
              <HardDrive size={16} className={activeTab === 'storage' ? 'text-[#F4F4F0]' : ''} />
              <span>Penyimpanan</span>
            </button>

            <button
              onClick={() => setActiveTab('about')}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-[8px] text-xs font-medium transition-all cursor-pointer text-left mt-auto ${
                activeTab === 'about'
                  ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold'
                  : 'text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#17171A]'
              }`}
            >
              <Info size={16} className={activeTab === 'about' ? 'text-[#F4F4F0]' : ''} />
              <span>Tentang</span>
            </button>
          </div>

          {/* Right Content Tab */}
          <div className="flex-1 p-6 overflow-y-auto space-y-6">
            {/* TAB 1: DYNAMIC LIGHT */}
            {activeTab === 'visual' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-[#F4F4F0] mb-1">Dynamic Light (Aura Glow)</h4>
                  <p className="text-xs text-[#8D8D93]">
                    Pendaran atmosferik halus di latar belakang aplikasi yang otomatis beradaptasi dengan warna cover album lagu aktif.
                  </p>
                </div>

                {/* Switch ON/OFF */}
                <div className="flex items-center justify-between p-4 rounded-[10px] bg-[#1F1F23]">
                  <div>
                    <p className="text-xs font-semibold text-[#F4F4F0]">Aktifkan Dynamic Light</p>
                    <p className="text-[11px] text-[#8D8D93] mt-0.5">
                      Pendaran warna bernafas halus setiap pergantian lagu.
                    </p>
                  </div>
                  <button
                    onClick={() => handleToggleDynamicLight(!settings.dynamicLighting.enabled)}
                    className={`w-10 h-[22px] rounded-[4px] transition-colors relative cursor-pointer ${
                      settings.dynamicLighting.enabled ? 'bg-[#F4F4F0]' : 'bg-[#34343A]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-[2px] transition-transform absolute top-[3px] ${
                        settings.dynamicLighting.enabled
                          ? 'left-[21px] bg-[#0B0B0C]'
                          : 'left-[3px] bg-[#8D8D93]'
                      }`}
                    />
                  </button>
                </div>

                {/* Intensity Options */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#F4F4F0]">Tingkat Intensitas Cahaya</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'subtle' as const, label: 'Halus (Subtle)', desc: 'Pendaran lembut dan tenang' },
                      { id: 'medium' as const, label: 'Sedang (Normal)', desc: 'Keseimbangan kontras optimal' },
                      { id: 'vibrant' as const, label: 'Vibrant (Terang)', desc: 'Warna hidup dan berkarakter' },
                    ].map((item) => (
                      <button
                        key={item.id}
                        disabled={!settings.dynamicLighting.enabled}
                        onClick={() => handleIntensityChange(item.id)}
                        className={`p-3.5 rounded-[8px] text-left transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                          settings.dynamicLighting.intensity === item.id
                            ? 'bg-[#34343A] text-[#F4F4F0]'
                            : 'bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#34343A]'
                        }`}
                      >
                        <p className="text-xs font-semibold text-[#F4F4F0] mb-1">{item.label}</p>
                        <p className="text-[10px] text-[#8D8D93] leading-tight">{item.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live Color Preview Box */}
                <div className="p-4 rounded-[10px] bg-[#1F1F23] space-y-2">
                  <p className="text-xs font-semibold text-[#F4F4F0]">Preview Aura Lagu Aktif</p>
                  <div
                    className="h-20 w-full rounded-[8px] flex items-center justify-center transition-all duration-700 relative overflow-hidden"
                    style={{
                      background: settings.dynamicLighting.enabled
                        ? `radial-gradient(circle at 50% 50%, ${previewColors?.primary || '#5B8F9E'} 0%, ${previewColors?.secondary || '#17171A'} 100%)`
                        : '#141416',
                    }}
                  >
                    <span className="text-xs font-medium text-[#F4F4F0] drop-shadow-md z-10">
                      {settings.dynamicLighting.enabled ? 'Aura Aktif' : 'Dynamic Light Nonaktif'}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: AUDIO */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-[#F4F4F0] mb-1">Audio & Transisi</h4>
                  <p className="text-xs text-[#8D8D93]">
                    Pengaturan pemutaran audio berkecepatan tinggi dengan resolusi 48kHz.
                  </p>
                </div>

                {/* Crossfade Slider */}
                <div className="p-4 rounded-[10px] bg-[#1F1F23] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#F4F4F0]">Crossfade Transisi Antarlagu</p>
                      <p className="text-[11px] text-[#8D8D93] mt-0.5">
                        Membuat transisi mulus dan menyatu saat pergantian track lagu.
                      </p>
                    </div>
                    <span className="text-xs font-['JetBrains_Mono'] font-medium px-2.5 py-1 rounded-[6px] bg-[#34343A] text-[#F4F4F0]">
                      {settings.audio.crossfadeDuration}s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="12"
                    step="1"
                    value={settings.audio.crossfadeDuration}
                    onChange={(e) => handleCrossfadeChange(Number(e.target.value))}
                    className="w-full accent-[#F4F4F0] cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-[#8D8D93] font-['JetBrains_Mono']">
                    <span>Mati (0s)</span>
                    <span>6s</span>
                    <span>12s</span>
                  </div>
                </div>

                {/* Prefer Studio Audio */}
                <div className="flex items-center justify-between p-4 rounded-[10px] bg-[#1F1F23]">
                  <div>
                    <p className="text-xs font-semibold text-[#F4F4F0]">Prioritaskan Audio Studio (Topic)</p>
                    <p className="text-[11px] text-[#8D8D93] mt-0.5">
                      Memilih audio track album murni tanpa dialog atau noise video musik.
                    </p>
                  </div>
                  <button
                    onClick={() => handlePreferStudioToggle(!settings.audio.preferStudioAudio)}
                    className={`w-10 h-[22px] rounded-[4px] transition-colors relative cursor-pointer ${
                      settings.audio.preferStudioAudio ? 'bg-[#F4F4F0]' : 'bg-[#34343A]'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-[2px] transition-transform absolute top-[3px] ${
                        settings.audio.preferStudioAudio
                          ? 'left-[21px] bg-[#0B0B0C]'
                          : 'left-[3px] bg-[#8D8D93]'
                      }`}
                    />
                  </button>
                </div>

                {/* Equalizer Shortcut */}
                <div className="p-4 rounded-[10px] bg-[#1F1F23] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#F4F4F0]">Equalizer 8-Band Parametrik</p>
                    <p className="text-[11px] text-[#8D8D93] mt-0.5">
                      Kustomisasi kurva frekuensi bass, midrange, dan clarity.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenEqualizer();
                    }}
                    className="px-4 py-2 rounded-[8px] bg-[#34343A] hover:bg-[#1F1F23] text-[#F4F4F0] text-xs font-medium transition-all cursor-pointer"
                  >
                    Buka Equalizer
                  </button>
                </div>
              </div>
            )}

            {/* TAB 3: ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-[#F4F4F0] mb-1">Akun Pengguna</h4>
                  <p className="text-xs text-[#8D8D93]">
                    Profil lokal untuk mengelola daftar putar, histori lagu, dan koleksi favorit Anda.
                  </p>
                </div>

                {userProfile.isLoggedIn ? (
                  <div className="p-5 rounded-[10px] bg-[#1F1F23] space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-[8px] overflow-hidden bg-[#34343A] flex items-center justify-center flex-shrink-0">
                        {userProfile.avatarUrl ? (
                          <img src={userProfile.avatarUrl} alt={userProfile.name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={28} className="text-[#8D8D93]" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h5 className="text-sm font-semibold text-[#F4F4F0] truncate">{userProfile.name}</h5>
                        <p className="text-xs text-[#8D8D93] truncate">@{userProfile.username || 'user'}</p>
                        <p className="text-[11px] text-[#F4F4F0] font-medium mt-0.5">● Akun Lokal Aktif</p>
                      </div>
                    </div>

                    <div className="pt-2 flex gap-3">
                      <button
                        onClick={() => {
                          onClose();
                          onOpenAuthModal();
                        }}
                        className="flex-1 py-2.5 rounded-[8px] bg-[#34343A] hover:bg-[#1F1F23] text-[#F4F4F0] text-xs font-medium transition-all cursor-pointer"
                      >
                        Kelola Profil & Avatar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 rounded-[10px] bg-[#1F1F23] text-center space-y-3">
                    <div className="w-12 h-12 rounded-[8px] bg-[#34343A] flex items-center justify-center mx-auto text-[#8D8D93]">
                      <User size={24} />
                    </div>
                    <p className="text-xs font-semibold text-[#F4F4F0]">Belum Masuk Akun</p>
                    <p className="text-[11px] text-[#8D8D93] max-w-xs mx-auto">
                      Daftar akun lokal gratis untuk memasang foto profil kustom dan mengamankan seluruh koleksi playlist Anda.
                    </p>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAuthModal();
                      }}
                      className="px-6 py-2.5 rounded-[8px] bg-[#F4F4F0] hover:brightness-95 text-[#0B0B0C] text-xs font-medium transition-all cursor-pointer"
                    >
                      Masuk atau Daftar Akun
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: STORAGE */}
            {activeTab === 'storage' && (
              <div className="space-y-6">
                <div>
                  <h4 className="text-sm font-semibold text-[#F4F4F0] mb-1">Penyimpanan & Unduhan</h4>
                  <p className="text-xs text-[#8D8D93]">
                    Pengelolaan direktori file lokal, lagu offline tersimpan, dan data cache.
                  </p>
                </div>

                {/* Downloads Folder */}
                <div className="p-4 rounded-[10px] bg-[#1F1F23] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#F4F4F0]">Folder Unduhan Lagu</p>
                    <p className="text-[11px] text-[#8D8D93] mt-0.5">
                      Lagu yang Anda unduh untuk offline tersimpan di folder sistem lokal.
                    </p>
                  </div>
                  <button
                    onClick={handleOpenDownloads}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#34343A] hover:bg-[#1F1F23] text-[#F4F4F0] text-xs font-medium transition-all cursor-pointer"
                  >
                    <FolderOpen size={14} />
                    <span>Buka Folder</span>
                  </button>
                </div>

                {/* Playlist Backup Status */}
                <div className="p-4 rounded-[10px] bg-[#1F1F23] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#F4F4F0]">Penyimpanan Playlist Persisten</p>
                    <p className="text-[11px] text-[#8D8D93] mt-0.5">
                      Dual-Layer Backup aktif: seluruh playlist tersimpan otomatis dan aman.
                    </p>
                  </div>
                  <span className="text-[11px] font-medium text-[#F4F4F0] bg-[#34343A] px-3 py-1 rounded-[6px]">
                    Tersimpan Otomatis
                  </span>
                </div>

                {/* Clear Cover Art Cache */}
                <div className="p-4 rounded-[10px] bg-[#1F1F23] flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-[#F4F4F0]">Bersihkan Cache Cover Album</p>
                    <p className="text-[11px] text-[#8D8D93] mt-0.5">
                      Hapus cache riwayat gambar album jika ingin membebaskan ruang memori.
                    </p>
                  </div>
                  <button
                    onClick={handleClearImageCache}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-[8px] bg-[#34343A] hover:bg-[#1F1F23] text-[#E07A7A] text-xs font-medium transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>{cleanCacheNotice ? 'Cache Dibersihkan!' : 'Bersihkan Cache'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* TAB 5: ABOUT */}
            {activeTab === 'about' && (
              <div className="space-y-5 text-center py-6">
                <div className="w-14 h-14 rounded-[10px] bg-[#1F1F23] flex items-center justify-center mx-auto">
                  <div className="w-6 h-6 flex items-center gap-1">
                    <div className="w-2.5 h-6 bg-[#F4F4F0] rounded-[2px]" />
                    <div className="w-2.5 h-4 bg-[#F4F4F0]/60 rounded-[2px]" />
                  </div>
                </div>
                <div>
                  <h4 className="text-base font-semibold text-[#F4F4F0]">AuraAudio</h4>
                  <p className="text-xs text-[#8D8D93] mt-0.5">Versi 1.0.0 • High-Fidelity 48kHz Engine</p>
                </div>
                <p className="text-xs text-[#8D8D93] max-w-sm mx-auto leading-relaxed">
                  Aplikasi pemutar musik modern dengan integrasi YouTube Music berkecepatan tinggi, audio engine lokal, dan tata visual atmosferik yang tenang.
                </p>
                <div className="pt-2 text-[11px] text-[#8D8D93] font-['JetBrains_Mono']">
                  Ditenagai oleh Electron • React • Tailwind CSS • Vite
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
