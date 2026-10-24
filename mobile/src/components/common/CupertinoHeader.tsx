import React from 'react';
import { SFPersonCropCircle } from './AppleIcons';

interface CupertinoHeaderProps {
  kicker?: string;
  largeTitle: string;
  onOpenProfile?: () => void;
  actionButton?: React.ReactNode;
}

export const CupertinoHeader: React.FC<CupertinoHeaderProps> = ({
  kicker,
  largeTitle,
  onOpenProfile,
  actionButton,
}) => {
  return (
    <div className="pt-2 pb-3 border-b border-white/[0.08] select-none">
      <div className="flex items-end justify-between">
        <div>
          {kicker && (
            <span className="text-[11px] font-semibold tracking-wider text-white/50 uppercase block">
              {kicker}
            </span>
          )}
          <h1 className="text-[34px] font-extrabold text-white tracking-tight leading-none mt-1">
            {largeTitle}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {actionButton}

          {onOpenProfile && (
            <button
              onClick={onOpenProfile}
              className="w-9 h-9 rounded-full bg-white/[0.08] border border-white/10 flex items-center justify-center text-white active:scale-90 transition-transform shadow-sm"
              aria-label="Profil & Pengaturan"
            >
              <SFPersonCropCircle size={20} fill="rgba(255,255,255,0.85)" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
