import React from 'react';
import { MobileTab } from '../types/music';
import {
  SFHouseFill,
  SFHouse,
  SFSearch,
  SFLibraryFill,
  SFLibrary,
  SFPersonCropCircleFill,
  SFPersonCropCircle,
} from './common/AppleIcons';
import { animate, AppleSprings } from '../utils/animations';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  onTabChange: (tab: MobileTab) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    {
      id: 'home' as const,
      label: 'Home',
      iconActive: SFHouseFill,
      iconInactive: SFHouse,
    },
    {
      id: 'search' as const,
      label: 'Search',
      iconActive: SFSearch,
      iconInactive: SFSearch,
    },
    {
      id: 'library' as const,
      label: 'Library',
      iconActive: SFLibraryFill,
      iconInactive: SFLibrary,
    },
    {
      id: 'profile' as const,
      label: 'Profile',
      iconActive: SFPersonCropCircleFill,
      iconInactive: SFPersonCropCircle,
    },
  ];

  const handleSelectTab = (tabId: MobileTab, e: React.MouseEvent<HTMLButtonElement>) => {
    try {
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate(8);
      }
    } catch {}
    animate(e.currentTarget, {
      scale: [
        { to: 0.88, duration: 80, ease: 'out(2)' },
        { to: 1, duration: 200, ease: AppleSprings.snappy },
      ],
    });
    onTabChange(tabId);
  };

  return (
    <div
      className="fixed bottom-3 left-0 right-0 z-40 flex justify-center pointer-events-none select-none"
      style={{ paddingBottom: 'calc(var(--sab) + 2px)' }}
    >
      {/* 346x54px Floating Liquid Glass Dock (Matching Figma Menu 346x54) */}
      <nav
        className="w-[346px] max-w-[92vw] h-[54px] liquid-glass-dock rounded-full p-1 flex items-center justify-between pointer-events-auto relative shadow-2xl backdrop-blur-2xl"
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          const IconComponent = isActive ? tab.iconActive : tab.iconInactive;

          return (
            <button
              key={tab.id}
              onClick={(e) => handleSelectTab(tab.id, e)}
              className="relative flex-1 h-[46px] flex items-center justify-center rounded-full transition-all duration-150 active:scale-95 will-change-transform"
              aria-label={tab.label}
            >
              {/* High-Contrast Active Indicator Pill */}
              {isActive && (
                <div className="absolute inset-y-0 inset-x-1.5 rounded-full bg-white/20 border border-white/15 shadow-[inset_0_1px_1px_rgba(255,255,255,0.3)] transition-all duration-200" />
              )}
              <IconComponent
                size={22}
                fill={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.65)'}
                className={`relative z-10 transition-transform duration-150 drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] ${
                  isActive ? 'scale-105' : 'scale-100 hover:scale-105'
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
};
