import React, { useState } from 'react';
import { ApiClient, UserProfile } from '../services/apiClient';
import { SFXmark, SFPersonCropCircle } from './common/AppleIcons';
import { useAnimatedSheet } from '../utils/animations';

interface MobileAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const MobileAuthModal: React.FC<MobileAuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { sheetRef, backdropRef, handleDismiss } = useAnimatedSheet(isOpen, onClose);

  // Synchronize initial mode when modal opens
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setErrorMessage(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(12);
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setErrorMessage('Silakan masukkan alamat email.');
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 6) {
      setErrorMessage('Password minimal 6 karakter.');
      return;
    }

    if (mode === 'register' && !trimmedName) {
      setErrorMessage('Silakan masukkan nama lengkap.');
      return;
    }

    setIsLoading(true);
    try {
      let result: { token: string; user: UserProfile };
      if (mode === 'login') {
        result = await ApiClient.login(trimmedEmail, trimmedPassword);
      } else {
        result = await ApiClient.register(trimmedName, trimmedEmail, trimmedPassword);
      }

      triggerHaptic(20);
      onSuccess(result.user);
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Terjadi kesalahan, periksa koneksi server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end select-none"
      onClick={handleDismiss}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-md mx-auto bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] sm:mb-8 border-t sm:border border-white/10 p-6 flex flex-col max-h-[90vh] overflow-y-auto shadow-2xl text-white font-sans will-change-transform"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(var(--sab) + 24px)' }}
      >
        {/* Grab Handle */}
        <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

        {/* Header & Close Button */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">
              <SFPersonCropCircle size={20} fill="#FFFFFF" />
            </div>
            <div>
              <h3 className="text-[17px] font-bold text-white tracking-tight">
                {mode === 'login' ? 'Masuk ke AuraAudio' : 'Buat Akun Baru'}
              </h3>
              <p className="text-[11px] text-neutral-400">Sinkronisasi Musik & Server Cloud</p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-neutral-400 hover:text-white transition-colors"
            aria-label="Tutup"
          >
            <SFXmark size={14} fill="currentColor" />
          </button>
        </div>

        {/* Mode Switcher (Apple Segments) */}
        <div className="mt-5 p-1 bg-black/40 border border-white/10 rounded-2xl flex items-center">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setMode('login');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              triggerHaptic(8);
              setMode('register');
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-center text-xs font-semibold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white text-black shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Daftar Akun Baru
          </button>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs">
            {errorMessage}
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
                className="w-full h-11 px-3.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
              />
            </div>
          )}

          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              className="w-full h-11 px-3.5 rounded-xl bg-black/40 border border-white/10 text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-white/40 focus:ring-1 focus:ring-white/20 transition-all"
            />
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-3 h-12 rounded-full bg-white text-black font-semibold text-[15px] hover:bg-neutral-200 active:scale-[0.98] transition-all flex items-center justify-center shadow-lg disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-800">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Memproses...</span>
              </div>
            ) : mode === 'login' ? (
              'Masuk Sekarang'
            ) : (
              'Buat Akun'
            )}
          </button>
        </form>

        {/* Benefits Footnote */}
        <p className="mt-5 text-[11px] text-center text-neutral-500 leading-relaxed">
          Dengan masuk, seluruh koleksi playlist, riwayat putar, dan lagu favorit akan tersimpan aman di server database AuraAudio.
        </p>
      </div>
    </div>
  );
};
