import React from 'react';
import { EQBandConfig, EQPreset } from '../types/music';
import { EQ_PRESETS } from '../hooks/useMobileAudioEngine';
import { SFXmark, SFSliderHorizontal3 } from './common/AppleIcons';
import { useAnimatedSheet } from '../utils/animations';

interface MobileEqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  bands: EQBandConfig[];
  currentPreset: string;
  onBandChange: (index: number, gain: number) => void;
  onPresetSelect: (presetId: string) => void;
  onReset: () => void;
}

export const MobileEqualizerModal: React.FC<MobileEqualizerModalProps> = ({
  isOpen,
  onClose,
  bands,
  currentPreset,
  onBandChange,
  onPresetSelect,
  onReset,
}) => {
  const { sheetRef, backdropRef, handleDismiss } = useAnimatedSheet(isOpen, onClose);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex flex-col justify-end select-none"
      onClick={handleDismiss}
    >
      <div
        ref={sheetRef}
        className="w-full max-w-md mx-auto bg-[#1C1C1E] rounded-t-[32px] sm:rounded-[32px] sm:mb-8 border-t sm:border border-white/10 p-5 flex flex-col max-h-[85vh] overflow-hidden shadow-2xl text-white font-sans will-change-transform"
        onClick={(e) => e.stopPropagation()}
        style={{ paddingBottom: 'calc(var(--sab) + 16px)' }}
      >
        {/* Grab handle */}
        <div className="w-10 h-1 rounded-full bg-white/25 mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <SFSliderHorizontal3 size={18} fill="#FFFFFF" />
            <h3 className="text-[16px] font-bold text-white tracking-tight">Studio Equalizer</h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="text-xs text-white/70 active:text-white px-3 py-1 rounded-full bg-white/[0.08] hover:bg-white/15 border border-white/10 transition-colors"
            >
              <span>Reset</span>
            </button>

            <button
              onClick={handleDismiss}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/80 active:text-white"
              aria-label="Tutup equalizer"
            >
              <SFXmark size={16} fill="currentColor" />
            </button>
          </div>
        </div>

        {/* Presets Horizontal Scroll */}
        <div className="py-3 flex gap-2 overflow-x-auto scrollbar-none">
          {EQ_PRESETS.map((p: EQPreset) => (
            <button
              key={p.id}
              onClick={() => onPresetSelect(p.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                currentPreset === p.id
                  ? 'bg-white text-black shadow-md'
                  : 'bg-white/[0.08] text-white/70 hover:text-white active:bg-white/15'
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Sliders Container */}
        <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 my-2">
          {/* Reference dB levels */}
          <div className="flex justify-between items-center text-[10px] text-neutral-500 font-medium tabular-nums mb-2 px-1">
            <span>+12 dB</span>
            <span className="text-white/40">0 dB (Flat)</span>
            <span>-12 dB</span>
          </div>

          {/* Sliders Row */}
          <div className="flex justify-between items-center py-2 px-0.5 overflow-x-auto">
            {bands.map((band, idx) => (
              <div key={band.label} className="flex flex-col items-center h-44 justify-between w-9 flex-shrink-0">
                <span className="text-[11px] font-medium tabular-nums text-white/70">
                  {band.gain > 0 ? `+${band.gain}` : band.gain}
                </span>

                <input
                  type="range"
                  min="-12"
                  max="12"
                  step="1"
                  value={band.gain}
                  onChange={(e) => onBandChange(idx, parseFloat(e.target.value))}
                  className="vertical-slider h-28 accent-white cursor-pointer"
                />

                <span className="text-[11px] font-semibold text-neutral-400 mt-1">{band.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
