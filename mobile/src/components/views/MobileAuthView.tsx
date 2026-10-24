import React, { useState } from 'react';
import { ApiClient, UserProfile } from '../../services/apiClient';
import {
  SFChevronLeft,
  SFMusicNote,
  SFCheckmark,
  SFEye,
  SFEyeSlash,
  SFXmark,
} from '../common/AppleIcons';

interface MobileAuthViewProps {
  onBack: () => void;
  onSuccess: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const MobileAuthView: React.FC<MobileAuthViewProps> = ({
  onBack,
  onSuccess,
  initialMode = 'login',
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const triggerHaptic = (ms: number = 8) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(ms);
      }
    } catch {}
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    triggerHaptic(10);
    setErrorMessage(null);

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedName = name.trim();

    if (!trimmedEmail) {
      setErrorMessage('Silakan masukkan email atau username.');
      return;
    }
    if (!trimmedPassword || trimmedPassword.length < 4) {
      setErrorMessage('Password minimal 4 karakter.');
      return;
    }

    if (mode === 'register') {
      if (!trimmedName) {
        setErrorMessage('Silakan masukkan nama lengkap.');
        return;
      }
      if (confirmPassword && trimmedPassword !== confirmPassword.trim()) {
        setErrorMessage('Konfirmasi password tidak cocok.');
        return;
      }
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
      onBack();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Gagal terhubung ke server backend.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 select-none pb-20 text-white font-sans bg-black relative animate-in fade-in duration-200 scrollbar-none flex flex-col justify-between min-h-full">
      {/* Ambient background glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[380px] h-[300px] bg-white/[0.03] blur-[90px] pointer-events-none rounded-full" />

      {/* Top Floating Navigation Bar */}
      <div>
        <div className="pt-3 pb-2 flex items-center justify-between">
          <button
            onClick={() => {
              triggerHaptic(6);
              onBack();
            }}
            className="flex items-center gap-1 text-white text-[15px] font-medium active:opacity-70 transition-opacity"
          >
            <SFChevronLeft size={20} fill="#FFFFFF" />
            <span>Kembali</span>
          </button>

          <button
            onClick={() => {
              triggerHaptic(6);
              onBack();
            }}
            className="text-[14px] text-neutral-400 hover:text-white transition-colors"
          >
            Nanti Saja
          </button>
        </div>

        {/* Hero Branding & Header */}
        <div className="pt-8 pb-6 flex flex-col items-center text-center">
          {/* Minimal AuraAudio Emblem */}
          <div className="w-16 h-16 rounded-[22px] bg-gradient-to-b from-white/12 to-white/[0.02] border border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.85)] flex items-center justify-center mb-5 group active:scale-95 transition-transform">
            <SFMusicNote size={28} fill="#FFFFFF" />
          </div>

          <h1 className="text-[28px] font-bold text-white tracking-tight leading-tight">
            {mode === 'login' ? 'Masuk ke AuraAudio' : 'Mulai Akun Baru'}
          </h1>
          <p className="text-[13px] text-neutral-400 max-w-[280px] mt-2 leading-relaxed">
            {mode === 'login'
              ? 'Sinkronkan seluruh lagu favorit, playlist, dan riwayat putar di semua perangkat.'
              : 'Daftar sekarang untuk menikmati streaming musik tanpa jeda dan tersinkron cloud.'}
          </p>

          {/* Segmented Controller (Masuk vs Daftar) */}
          <div className="w-full max-w-[320px] mt-6 p-1 bg-neutral-900/90 border border-white/[0.08] rounded-full flex items-center shadow-inner">
            <button
              type="button"
              onClick={() => {
                triggerHaptic(8);
                setMode('login');
                setErrorMessage(null);
              }}
              className={`flex-1 py-2 text-center text-[13px] font-semibold rounded-full transition-all duration-200 ${
                mode === 'login'
                  ? 'bg-white text-black shadow-md'
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
              className={`flex-1 py-2 text-center text-[13px] font-semibold rounded-full transition-all duration-200 ${
                mode === 'register'
                  ? 'bg-white text-black shadow-md'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              Daftar Baru
            </button>
          </div>
        </div>

        {/* Error Alert Banner */}
        {errorMessage && (
          <div className="max-w-[360px] mx-auto mb-5 px-4 py-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-200 text-xs flex items-center justify-between animate-in fade-in duration-150">
            <span>{errorMessage}</span>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-red-300 hover:text-white ml-2"
            >
              <SFXmark size={14} fill="currentColor" />
            </button>
          </div>
        )}

        {/* Auth Form Fields */}
        <form onSubmit={handleSubmit} className="max-w-[360px] mx-auto space-y-3.5">
          {mode === 'register' && (
            <div className="bg-[#161618] border border-white/[0.08] focus-within:border-white/25 rounded-2xl px-4 py-2.5 transition-colors">
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Contoh: Budi Santoso"
                required
                className="w-full text-[15px] text-white placeholder-neutral-600 bg-transparent outline-none font-normal"
              />
            </div>
          )}

          <div className="bg-[#161618] border border-white/[0.08] focus-within:border-white/25 rounded-2xl px-4 py-2.5 transition-colors">
            <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
              Email atau Username
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="nama@email.com atau username"
              required
              autoCapitalize="none"
              autoComplete="username"
              className="w-full text-[15px] text-white placeholder-neutral-600 bg-transparent outline-none font-normal"
            />
          </div>

          <div className="bg-[#161618] border border-white/[0.08] focus-within:border-white/25 rounded-2xl px-4 py-2.5 transition-colors relative">
            <div className="flex items-center justify-between">
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Kata Sandi
              </label>
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-neutral-400 hover:text-white transition-colors"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <SFEyeSlash size={16} /> : <SFEye size={16} />}
              </button>
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 6 karakter"
              required
              className="w-full text-[15px] text-white placeholder-neutral-600 bg-transparent outline-none font-normal pr-6"
            />
          </div>

          {mode === 'register' && (
            <div className="bg-[#161618] border border-white/[0.08] focus-within:border-white/25 rounded-2xl px-4 py-2.5 transition-colors">
              <label className="block text-[11px] font-semibold text-neutral-400 uppercase tracking-wider mb-1">
                Konfirmasi Kata Sandi
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Ulangi kata sandi"
                required
                className="w-full text-[15px] text-white placeholder-neutral-600 bg-transparent outline-none font-normal"
              />
            </div>
          )}

          {/* Primary Action Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 mt-2 rounded-full bg-white text-black font-semibold text-[15px] hover:bg-neutral-100 active:scale-[0.98] transition-all flex items-center justify-center shadow-[0_4px_24px_rgba(255,255,255,0.12)] disabled:opacity-50"
          >
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-neutral-800">
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Memproses...</span>
              </div>
            ) : mode === 'login' ? (
              'Masuk Sekarang'
            ) : (
              'Buat Akun Aura'
            )}
          </button>
        </form>

        {/* Continue as Guest Secondary Action */}
        <div className="max-w-[360px] mx-auto mt-4 text-center">
          <button
            type="button"
            onClick={() => {
              triggerHaptic(6);
              onBack();
            }}
            className="text-[13px] text-neutral-400 hover:text-white transition-colors"
          >
            Lanjutkan sebagai Tamu (Mode Offline)
          </button>
        </div>
      </div>

      {/* Feature Pills at Bottom */}
      <div className="pt-8 pb-4 flex items-center justify-center gap-6 text-[11px] text-neutral-500">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          <span>Cloud Sync</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
          <span>Audio Lossless</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          <span>Bebas Iklan</span>
        </div>
      </div>
    </div>
  );
};
