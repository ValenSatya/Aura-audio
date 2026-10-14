import React, { useState, useRef } from 'react';
import { UserProfile } from '../types/music';
import {
  X,
  User,
  CheckCircle2,
  Loader2,
  LogOut,
  Edit2,
  Upload,
  Camera,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onProfileUpdated: (profile: UserProfile) => void;
}

// Helper to center-crop & compress uploaded avatar to 256x256 max
function processUploadedImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Format berkas harus berupa gambar (JPG, PNG, WebP)'));
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (!result) {
        reject(new Error('Gagal membaca berkas gambar'));
        return;
      }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const size = 256;
          canvas.width = size;
          canvas.height = size;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(result);
            return;
          }

          // Center-crop to square
          const minDim = Math.min(img.width, img.height);
          const sx = (img.width - minDim) / 2;
          const sy = (img.height - minDim) / 2;

          ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, size, size);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.88);
          resolve(dataUrl);
        } catch {
          resolve(result);
        }
      };
      img.onerror = () => reject(new Error('Format gambar tidak valid atau rusak'));
      img.src = result;
    };
    reader.onerror = () => reject(new Error('Gagal membaca berkas dari sistem'));
    reader.readAsDataURL(file);
  });
}

// 8 Aesthetic Preset Avatars
const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=150&auto=format&fit=crop&q=80',
];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
}) => {
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isEditing, setIsEditing] = useState(false);

  // Hidden file input for custom PP upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [customAvatars, setCustomAvatars] = useState<string[]>(() => {
    if (userProfile.avatarUrl && !PRESET_AVATARS.includes(userProfile.avatarUrl)) {
      return [userProfile.avatarUrl];
    }
    return [];
  });

  // Form states
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(PRESET_AVATARS[0]);

  // Edit profile state
  const [editName, setEditName] = useState(userProfile.name || '');
  const [editAvatar, setEditAvatar] = useState(userProfile.avatarUrl || PRESET_AVATARS[0]);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError('Ukuran foto profil maksimal 10 MB');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const dataUrl = await processUploadedImage(file);
      setCustomAvatars((prev) => (prev.includes(dataUrl) ? prev : [dataUrl, ...prev]));
      if (authMode === 'register') {
        setSelectedAvatar(dataUrl);
      } else {
        setEditAvatar(dataUrl);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal memproses gambar foto profil');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Silakan isi username dan password');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (window.electronAPI?.loginAccount) {
        const res = await window.electronAPI.loginAccount({ username: username.trim(), password });
        if (res.success && res.user) {
          onProfileUpdated(res.user);
          onClose();
        } else {
          setError(res.error || 'Username atau password salah');
        }
      } else {
        const demoUser: UserProfile = {
          isLoggedIn: true,
          name: username.trim(),
          username: username.trim(),
          avatarUrl: selectedAvatar,
          loginDate: Date.now(),
        };
        onProfileUpdated(demoUser);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal masuk akun');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    if (password.length < 4) {
      setError('Password minimal 4 karakter');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      if (window.electronAPI?.registerAccount) {
        const res = await window.electronAPI.registerAccount({
          name: displayName.trim() || username.trim(),
          username: username.trim(),
          password,
          avatarUrl: selectedAvatar,
        });
        if (res.success && res.user) {
          onProfileUpdated(res.user);
          onClose();
        } else {
          setError(res.error || 'Gagal mendaftarkan akun');
        }
      } else {
        const demoUser: UserProfile = {
          isLoggedIn: true,
          name: displayName.trim() || username.trim(),
          username: username.trim(),
          avatarUrl: selectedAvatar,
          loginDate: Date.now(),
        };
        onProfileUpdated(demoUser);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal mendaftar akun');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (window.electronAPI?.updateAccountProfile) {
        const res = await window.electronAPI.updateAccountProfile({
          name: editName,
          avatarUrl: editAvatar,
        });
        if (res.success && res.user) {
          onProfileUpdated(res.user);
          setIsEditing(false);
        } else {
          setError(res.error || 'Gagal memperbarui profil');
        }
      } else {
        onProfileUpdated({
          ...userProfile,
          name: editName,
          avatarUrl: editAvatar,
        });
        setIsEditing(false);
      }
    } catch (err: any) {
      setError(err?.message || 'Gagal update profil');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    setIsLoading(true);
    try {
      if (window.electronAPI?.logoutAccount) {
        await window.electronAPI.logoutAccount();
      }
      onProfileUpdated({ isLoggedIn: false });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Gagal logout');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-md z-50 flex items-center justify-center p-4 select-none font-['Sora']">
      <div className="bg-[#17171A] rounded-[10px] w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#121214]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-[#F4F4F0]">
              {userProfile.isLoggedIn ? 'Profil Pengguna' : 'Akun Pengguna'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-[8px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {userProfile.isLoggedIn ? (
            /* Logged in state */
            <div className="space-y-5 text-center">
              <div className="relative w-20 h-20 rounded-[8px] overflow-hidden bg-[#1F1F23] mx-auto shadow-md group">
                <img
                  src={isEditing ? editAvatar : userProfile.avatarUrl || PRESET_AVATARS[0]}
                  alt={userProfile.name}
                  className="w-full h-full object-cover"
                />
                {isEditing && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center text-[#F4F4F0] cursor-pointer hover:bg-black/85 transition-colors"
                    title="Klik untuk unggah foto profil baru dari komputer"
                  >
                    <Camera size={18} />
                    <span className="text-[9px] font-semibold mt-1">Ganti PP</span>
                  </div>
                )}
              </div>

              {!isEditing ? (
                <div className="space-y-1">
                  <h4 className="text-base font-semibold text-[#F4F4F0]">{userProfile.name}</h4>
                  <p className="text-xs text-[#8D8D93]">@{userProfile.username || 'user'}</p>
                  <p className="text-[11px] text-[#F4F4F0] font-medium pt-1 flex items-center justify-center gap-1">
                    <CheckCircle2 size={13} /> Akun Aktif di Aplikasi
                  </p>
                </div>
              ) : (
                <div className="space-y-3 text-left">
                  <div>
                    <label className="text-[11px] font-medium text-[#8D8D93] mb-1 block">Nama Tampilan</label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full h-10 px-3.5 bg-[#1F1F23] rounded-[8px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none"
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-medium text-[#8D8D93]">Pilih Foto Profil (PP)</label>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-[11px] text-[#F4F4F0] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                      >
                        <Upload size={12} />
                        <span>Unggah Foto</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full mb-2.5 h-10 px-3 bg-[#1F1F23] hover:bg-[#34343A] rounded-[8px] text-xs text-[#F4F4F0] flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Upload size={14} className="text-[#8D8D93]" />
                      <span>Pilih Foto dari Komputer</span>
                    </button>

                    <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-0.5">
                      {customAvatars.map((av, idx) => (
                        <div
                          key={`custom-${idx}`}
                          onClick={() => setEditAvatar(av)}
                          className={`aspect-square rounded-[8px] overflow-hidden cursor-pointer relative transition-all ${
                            editAvatar === av ? 'ring-2 ring-[#F4F4F0]' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="custom" className="w-full h-full object-cover" />
                          <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-[#F4F4F0] text-center py-0.5">
                            Kamu
                          </span>
                        </div>
                      ))}
                      {PRESET_AVATARS.map((av, idx) => (
                        <div
                          key={idx}
                          onClick={() => setEditAvatar(av)}
                          className={`aspect-square rounded-[8px] overflow-hidden cursor-pointer transition-all ${
                            editAvatar === av ? 'ring-2 ring-[#F4F4F0]' : 'opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={av} alt="preset" className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && <div className="p-3 bg-[#2D1616] rounded-[8px] text-xs text-[#E07A7A]">{error}</div>}

              <div className="pt-2 flex gap-3">
                {!isEditing ? (
                  <>
                    <button
                      onClick={() => {
                        setEditName(userProfile.name || '');
                        setEditAvatar(userProfile.avatarUrl || PRESET_AVATARS[0]);
                        setIsEditing(true);
                      }}
                      className="flex-1 h-10 bg-[#1F1F23] hover:bg-[#34343A] text-[#F4F4F0] rounded-[8px] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Edit2 size={14} />
                      <span>Edit Profil</span>
                    </button>
                    <button
                      onClick={handleLogout}
                      disabled={isLoading}
                      className="px-4 h-10 bg-[#2D1616] hover:bg-[#3D1E1E] text-[#E07A7A] rounded-[8px] text-xs font-medium transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isLoading ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
                      <span>Keluar</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 h-10 bg-[#1F1F23] text-[#8D8D93] hover:text-[#F4F4F0] rounded-[8px] text-xs font-medium transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      onClick={handleUpdateProfile}
                      disabled={isLoading}
                      className="flex-1 h-10 bg-[#F4F4F0] hover:bg-white text-[#0B0B0C] rounded-[8px] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      {isLoading && <Loader2 size={14} className="animate-spin" />}
                      <span>Simpan</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            /* Not logged in: Login & Register tabs */
            <div className="space-y-5">
              {/* Tabs Switcher */}
              <div className="flex p-1 bg-[#121214] rounded-[8px]">
                <button
                  onClick={() => {
                    setAuthMode('login');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                    authMode === 'login' ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold' : 'text-[#8D8D93] hover:text-[#F4F4F0]'
                  }`}
                >
                  Masuk (Login)
                </button>
                <button
                  onClick={() => {
                    setAuthMode('register');
                    setError(null);
                  }}
                  className={`flex-1 py-2 rounded-[6px] text-xs font-medium transition-all cursor-pointer ${
                    authMode === 'register' ? 'bg-[#1F1F23] text-[#F4F4F0] font-semibold' : 'text-[#8D8D93] hover:text-[#F4F4F0]'
                  }`}
                >
                  Daftar Akun Baru
                </button>
              </div>

              {/* Form Area */}
              <form onSubmit={authMode === 'login' ? handleLogin : handleRegister} className="space-y-3.5">
                {authMode === 'register' && (
                  <>
                    <div>
                      <label className="text-[11px] font-medium text-[#8D8D93] mb-1 block">Nama Lengkap / Panggilan</label>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Contoh: Valentino"
                        className="w-full h-10 px-3.5 bg-[#1F1F23] rounded-[8px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none"
                      />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[11px] font-medium text-[#8D8D93]">Pilih Foto Profil (PP)</label>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="text-[11px] text-[#F4F4F0] hover:underline flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Upload size={12} />
                          <span>Unggah Foto</span>
                        </button>
                      </div>

                      {/* Current selected preview with direct upload button */}
                      <div className="flex items-center gap-3 p-2.5 bg-[#1F1F23] rounded-[8px] mb-2.5">
                        <div className="w-11 h-11 rounded-[8px] overflow-hidden bg-[#34343A] flex-shrink-0">
                          <img src={selectedAvatar} alt="preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#F4F4F0] truncate">Foto Profil Terpilih</p>
                          <p className="text-[11px] text-[#8D8D93]">Pilih preset atau unggah dari komputer</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="px-3 py-1.5 bg-[#34343A] hover:bg-[#1F1F23] text-[#F4F4F0] rounded-[6px] text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer flex-shrink-0"
                        >
                          <Upload size={13} />
                          <span>Unggah</span>
                        </button>
                      </div>

                      <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto pr-0.5">
                        {customAvatars.map((av, idx) => (
                          <div
                            key={`custom-${idx}`}
                            onClick={() => setSelectedAvatar(av)}
                            className={`aspect-square rounded-[8px] overflow-hidden cursor-pointer relative transition-all ${
                              selectedAvatar === av ? 'ring-2 ring-[#F4F4F0]' : 'opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={av} alt="custom" className="w-full h-full object-cover" />
                            <span className="absolute bottom-0 inset-x-0 bg-black/75 text-[8px] text-[#F4F4F0] text-center py-0.5">
                              Kamu
                            </span>
                          </div>
                        ))}
                        {PRESET_AVATARS.map((av, idx) => (
                          <div
                            key={idx}
                            onClick={() => setSelectedAvatar(av)}
                            className={`aspect-square rounded-[8px] overflow-hidden cursor-pointer transition-all ${
                              selectedAvatar === av ? 'ring-2 ring-[#F4F4F0]' : 'opacity-60 hover:opacity-100'
                            }`}
                          >
                            <img src={av} alt="avatar option" className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="text-[11px] font-medium text-[#8D8D93] mb-1 block">Username</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Masukkan username"
                    className="w-full h-10 px-3.5 bg-[#1F1F23] rounded-[8px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-[#8D8D93] mb-1 block">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    className="w-full h-10 px-3.5 bg-[#1F1F23] rounded-[8px] text-xs text-[#F4F4F0] placeholder-[#8D8D93] focus:outline-none"
                  />
                </div>

                {error && <div className="p-3 bg-[#2D1616] rounded-[8px] text-xs text-[#E07A7A]">{error}</div>}

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-[#F4F4F0] hover:bg-white disabled:opacity-50 text-[#0B0B0C] rounded-[8px] text-xs font-semibold transition-all cursor-pointer flex items-center justify-center gap-2 mt-2"
                >
                  {isLoading && <Loader2 size={15} className="animate-spin" />}
                  <span>{authMode === 'login' ? 'Masuk ke Aplikasi' : 'Buat Akun & Masuk'}</span>
                </button>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Hidden File Input for uploading custom PP */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};
