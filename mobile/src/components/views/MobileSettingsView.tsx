import React, { useState } from 'react';
import { CrossfadeSettings } from '../../types/music';
import { Sliders, Shuffle, Info, Cloud, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ApiClient } from '../../services/apiClient';

interface MobileSettingsViewProps {
  crossfadeSettings: CrossfadeSettings;
  onCrossfadeChange: (settings: Partial<CrossfadeSettings>) => void;
  onOpenEQ: () => void;
}

export const MobileSettingsView: React.FC<MobileSettingsViewProps> = ({
  crossfadeSettings,
  onCrossfadeChange,
  onOpenEQ,
}) => {
  const [serverUrl, setServerUrl] = useState(() => ApiClient.getBaseUrl());
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<'success' | 'error' | null>(null);

  const handleSaveServerUrl = () => {
    ApiClient.setCustomServerUrl(serverUrl);
    setTestResult(null);
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    ApiClient.setCustomServerUrl(serverUrl);
    try {
      const ok = await ApiClient.isServerAvailable();
      setTestResult(ok ? 'success' : 'error');
    } catch {
      setTestResult('error');
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
      <div className="pt-2">
        <h2 className="text-xl font-bold text-[#F4F4F0]">Setelan</h2>
        <p className="text-xs text-[#8D8D93] mt-0.5">Konfigurasi Audio, Cloud & Tampilan</p>
      </div>

      {/* Cloud Server & Sync Section */}
      <div className="bg-[#17171A] rounded-[16px] p-4 border border-[#202024] space-y-3">
        <div className="flex items-center gap-2">
          <Cloud size={16} className="text-[#F4F4F0]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D8D93]">Cloud Server & Sinkronisasi</h3>
        </div>
        <p className="text-[11px] text-[#8D8D93]">
          Alamat server backend untuk sinkronisasi akun & playlist 24 jam tanpa perlu laptop menyala.
        </p>

        <div className="space-y-2 pt-1">
          <input
            type="text"
            value={serverUrl}
            onChange={(e) => {
              setServerUrl(e.target.value);
              setTestResult(null);
            }}
            placeholder="https://auraaudio-backend.onrender.com"
            className="w-full bg-[#111113] border border-[#2A2A30] rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-600 outline-none focus:border-white/40 font-mono"
          />

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={handleSaveServerUrl}
              className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-white text-[11px] font-semibold transition-colors active:scale-95"
            >
              Simpan URL
            </button>
            <button
              onClick={handleTestConnection}
              disabled={isTesting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-black text-[11px] font-semibold transition-transform active:scale-95 disabled:opacity-50"
            >
              {isTesting ? <RefreshCw size={12} className="animate-spin" /> : null}
              <span>{isTesting ? 'Menguji...' : 'Uji Koneksi'}</span>
            </button>
            {testResult === 'success' && (
              <span className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                <CheckCircle2 size={13} />
                <span>Terhubung!</span>
              </span>
            )}
            {testResult === 'error' && (
              <span className="flex items-center gap-1 text-[11px] text-red-400 font-medium">
                <AlertCircle size={13} />
                <span>Gagal terhubung</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Audio Settings */}
      <div className="bg-[#17171A] rounded-[16px] p-4 border border-[#202024] space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D8D93]">Audio Engine</h3>

        {/* 8-Band Equalizer row */}
        <div
          onClick={onOpenEQ}
          className="flex items-center justify-between p-2 rounded-[10px] active:bg-[#1F1F23] cursor-pointer"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#1F1F23] flex items-center justify-center text-[#F4F4F0]">
              <Sliders size={16} />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#F4F4F0]">8-Band Equalizer</p>
              <p className="text-[11px] text-[#8D8D93]">Penyetelan frekuensi 60Hz - 14kHz</p>
            </div>
          </div>
          <span className="text-xs text-[#8D8D93]">Buka ›</span>
        </div>

        {/* Crossfade */}
        <div className="pt-2 border-t border-[#26262B]">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1F1F23] flex items-center justify-center text-[#F4F4F0]">
                <Shuffle size={16} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#F4F4F0]">Transisi Crossfade</p>
                <p className="text-[11px] text-[#8D8D93]">Transisi halus antar lagu</p>
              </div>
            </div>

            <button
              onClick={() => onCrossfadeChange({ enabled: !crossfadeSettings.enabled })}
              className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
                crossfadeSettings.enabled ? 'bg-[#F4F4F0]' : 'bg-[#34343A]'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  crossfadeSettings.enabled ? 'translate-x-5 bg-black' : 'translate-x-0 bg-[#8D8D93]'
                }`}
              />
            </button>
          </div>

          {crossfadeSettings.enabled && (
            <div className="mt-3 bg-[#121214] p-3 rounded-[10px] space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-[#8D8D93]">Durasi</span>
                <span className="font-mono text-[#F4F4F0]">{crossfadeSettings.duration} detik</span>
              </div>
              <input
                type="range"
                min="0"
                max="12"
                value={crossfadeSettings.duration}
                onChange={(e) => onCrossfadeChange({ duration: parseInt(e.target.value, 10) })}
                className="w-full h-1 bg-[#34343A] accent-[#F4F4F0] cursor-pointer"
              />
            </div>
          )}
        </div>
      </div>

      {/* About Box */}
      <div className="bg-[#17171A] rounded-[16px] p-4 border border-[#202024] space-y-2">
        <div className="flex items-center gap-2">
          <Info size={16} className="text-[#8D8D93]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#8D8D93]">Tentang AuraAudio Mobile</h3>
        </div>
        <p className="text-xs text-[#F4F4F0]">AuraAudio Mobile Edition v1.0.0</p>
        <p className="text-[11px] text-[#8D8D93] leading-relaxed">
          Dibangun dengan React, TypeScript, Tailwind CSS, dan Capacitor untuk performa audio mobile bertenaga tinggi.
        </p>
      </div>
    </div>
  );
};
