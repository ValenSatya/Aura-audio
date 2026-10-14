import React from 'react';
import { EQBandConfig, EQPreset, CrossfadeSettings } from '../types/music';
import { EQ_PRESETS } from '../hooks/useAudioEngine';
import { Sliders, RotateCcw, X, Volume2, Shuffle } from 'lucide-react';
import { Visualizer } from './Visualizer';

interface EqualizerProps {
  isOpen: boolean;
  onClose: () => void;
  bands: EQBandConfig[];
  currentPreset: string;
  onBandChange: (index: number, gain: number) => void;
  onPresetSelect: (presetId: string) => void;
  onReset: () => void;
  analyserNode: AnalyserNode | null;
  isPlaying: boolean;
  crossfadeSettings?: CrossfadeSettings;
  onCrossfadeChange?: (settings: Partial<CrossfadeSettings>) => void;
}

export const Equalizer: React.FC<EqualizerProps> = ({
  isOpen,
  onClose,
  bands,
  currentPreset,
  onBandChange,
  onPresetSelect,
  onReset,
  analyserNode,
  isPlaying,
  crossfadeSettings = { enabled: true, duration: 4 },
  onCrossfadeChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-[360px] max-w-[90vw] bg-[#17171A] shadow-2xl flex flex-col z-40 transition-all duration-300 font-['Sora'] select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-[#121214]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[8px] bg-[#1F1F23] text-[#F4F4F0] flex items-center justify-center">
            <Sliders size={17} />
          </div>
          <div>
            <h2 className="text-xs font-semibold text-[#F4F4F0] uppercase tracking-tight">8-Band Equalizer</h2>
            <p className="text-[10px] text-[#8D8D93]">Penyetelan Audio Presisi</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-[8px] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23] transition-colors cursor-pointer"
          title="Tutup Equalizer"
        >
          <X size={17} />
        </button>
      </div>

      {/* Visualizer Header Widget */}
      <div className="mx-6 mt-4 p-4 rounded-[8px] bg-[#1F1F23]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-[#8D8D93] flex items-center gap-1.5">
            <Volume2 size={13} className="text-[#8D8D93]" /> Spektrum Frekuensi
          </span>
          <span className="text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-[4px] bg-[#34343A] text-[#8D8D93] font-['JetBrains_Mono']">
            60 FPS
          </span>
        </div>
        <div className="h-16 rounded-[6px] bg-[#0B0B0C] p-2 flex items-center">
          <Visualizer analyserNode={analyserNode} isPlaying={isPlaying} barCount={36} height={48} />
        </div>
      </div>

      {/* Preset & Reset Row */}
      <div className="px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex-1">
          <label className="text-[10px] font-medium uppercase tracking-wider text-[#8D8D93] block mb-1">
            Preset EQ
          </label>
          <select
            value={currentPreset}
            onChange={(e) => onPresetSelect(e.target.value)}
            className="w-full bg-[#1F1F23] text-xs text-[#F4F4F0] rounded-[8px] px-3 py-2 focus:outline-none cursor-pointer"
          >
            {EQ_PRESETS.map((p: EQPreset) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
            {currentPreset === 'custom' && <option value="custom">Custom (Kustom)</option>}
          </select>
        </div>

        <div>
          <label className="text-[10px] font-medium uppercase tracking-wider text-transparent block mb-1">
            Reset
          </label>
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1F1F23] hover:bg-[#34343A] text-[#8D8D93] hover:text-[#F4F4F0] rounded-[8px] text-xs font-medium transition-colors cursor-pointer"
            title="Reset semua band ke 0 dB"
          >
            <RotateCcw size={13} />
            Reset
          </button>
        </div>
      </div>

      {/* 8 EQ Sliders */}
      <div className="flex-1 px-4 py-4 overflow-y-auto flex items-center justify-between">
        {bands.map((band, idx) => (
          <div key={band.label} className="flex flex-col items-center h-64 justify-between w-10">
            {/* dB Value Badge */}
            <span
              className={`text-[10px] font-['JetBrains_Mono'] font-medium px-1.5 py-0.5 rounded-[4px] transition-colors ${
                band.gain !== 0
                  ? 'text-[#F4F4F0] bg-[#34343A]'
                  : 'text-[#8D8D93]'
              }`}
            >
              {band.gain > 0 ? `+${band.gain}` : band.gain}
              <span className="text-[8px]">dB</span>
            </span>

            {/* Vertical Slider */}
            <div className="relative flex-1 flex items-center justify-center my-2">
              <div className="absolute w-6 h-[1px] bg-[#34343A] pointer-events-none top-1/2 -translate-y-1/2" />
              <input
                type="range"
                min="-12"
                max="12"
                step="1"
                value={band.gain}
                onChange={(e) => onBandChange(idx, parseFloat(e.target.value))}
                className="vertical-slider h-44 accent-[#F4F4F0] cursor-pointer"
                title={`${band.label} (${band.description}): ${band.gain > 0 ? `+${band.gain}` : band.gain} dB`}
              />
            </div>

            {/* Frequency Label */}
            <div className="text-center">
              <span className="text-xs font-medium text-[#F4F4F0] block">{band.label}</span>
              <span className="text-[9px] text-[#8D8D93] block truncate max-w-[40px]">
                {band.description}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Crossfade Transition Settings Panel */}
      <div className="mx-6 mb-5 p-4 rounded-[8px] bg-[#1F1F23] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[6px] bg-[#34343A] text-[#8D8D93]">
              <Shuffle size={14} />
            </div>
            <div>
              <h3 className="text-xs font-semibold text-[#F4F4F0] tracking-tight">Transisi Audio (Crossfade)</h3>
              <p className="text-[10px] text-[#8D8D93]">Sambungan antar lagu tanpa jeda hening</p>
            </div>
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => onCrossfadeChange?.({ enabled: !crossfadeSettings.enabled })}
            className={`w-10 h-[22px] rounded-[4px] p-0.5 transition-colors relative cursor-pointer ${
              crossfadeSettings.enabled ? 'bg-[#F4F4F0]' : 'bg-[#34343A]'
            }`}
            title={crossfadeSettings.enabled ? 'Nonaktifkan Crossfade' : 'Aktifkan Crossfade'}
          >
            <div
              className={`w-4 h-4 rounded-[3px] transition-transform ${
                crossfadeSettings.enabled
                  ? 'translate-x-[18px] bg-[#0B0B0C]'
                  : 'translate-x-0 bg-[#8D8D93]'
              }`}
            />
          </button>
        </div>

        {/* Duration Slider & Chips */}
        {crossfadeSettings.enabled && (
          <div className="flex flex-col gap-2.5 pt-1 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-[#8D8D93]">Durasi Transisi</span>
              <span className="font-['JetBrains_Mono'] text-xs font-medium text-[#F4F4F0] bg-[#34343A] px-2.5 py-0.5 rounded-[4px]">
                {crossfadeSettings.duration === 0 ? '0s (Gapless)' : `${crossfadeSettings.duration} detik`}
              </span>
            </div>

            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={crossfadeSettings.duration}
              onChange={(e) => onCrossfadeChange?.({ duration: parseInt(e.target.value, 10) })}
              className="w-full accent-[#F4F4F0] h-1.5 bg-[#34343A] rounded-[4px] cursor-pointer"
            />

            {/* Quick Presets */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[0, 2, 4, 6, 10].map((sec) => (
                <button
                  key={sec}
                  onClick={() => onCrossfadeChange?.({ duration: sec })}
                  className={`py-1 rounded-[6px] text-[10px] font-['JetBrains_Mono'] transition-all cursor-pointer ${
                    crossfadeSettings.duration === sec
                      ? 'bg-[#F4F4F0] text-[#0B0B0C] font-semibold'
                      : 'bg-[#34343A] text-[#8D8D93] hover:text-[#F4F4F0] hover:bg-[#1F1F23]'
                  }`}
                >
                  {sec === 0 ? '0s' : `${sec}s`}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
