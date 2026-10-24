import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
  className?: string;
  fill?: string;
}

// 1. Play Circle Fill (Apple Music Listen Now Tab Icon)
export const SFPlayCircleFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="10" fill={fill} />
    <path
      d="M9.8 8.44C9.8 7.63 10.7 7.14 11.38 7.58L16.22 10.64C16.84 11.03 16.84 11.97 16.22 12.36L11.38 15.42C10.7 15.86 9.8 15.37 9.8 14.56V8.44Z"
      fill="#000000"
    />
  </svg>
);

// 2. Play Circle Outline (Apple Music Listen Now Tab Icon Outline)
export const SFPlayCircle: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="9" stroke={fill} strokeWidth="2" />
    <path
      d="M10 8.5C10 7.85 10.72 7.46 11.27 7.82L15.4 10.5C15.9 10.82 15.9 11.58 15.4 11.9L11.27 14.58C10.72 14.94 10 14.55 10 13.9V8.5Z"
      fill={fill}
    />
  </svg>
);

// 3. Square Grid 2x2 (Apple Music Browse Tab Icon)
export const SFGrid2x2Fill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="2" fill={fill} />
    <rect x="13.5" y="3.5" width="7" height="7" rx="2" fill={fill} />
    <rect x="3.5" y="13.5" width="7" height="7" rx="2" fill={fill} />
    <rect x="13.5" y="13.5" width="7" height="7" rx="2" fill={fill} />
  </svg>
);

export const SFGrid2x2: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.8" stroke={fill} strokeWidth="1.8" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.8" stroke={fill} strokeWidth="1.8" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.8" stroke={fill} strokeWidth="1.8" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.8" stroke={fill} strokeWidth="1.8" />
  </svg>
);

// 4. Dot Radio Waves (Apple Music Radio Tab Icon)
export const SFRadioFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="2.5" fill={fill} />
    <path
      d="M7.76 7.76C6.54 8.98 5.75 10.66 5.75 12.5C5.75 14.34 6.54 16.02 7.76 17.24M16.24 7.76C17.46 8.98 18.25 10.66 18.25 12.5C18.25 14.34 17.46 16.02 16.24 17.24"
      stroke={fill}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
    <path
      d="M4.22 4.22C2.37 6.07 1.25 8.64 1.25 11.5C1.25 14.36 2.37 16.93 4.22 18.78M19.78 4.22C21.63 6.07 22.75 8.64 22.75 11.5C22.75 14.36 21.63 16.93 19.78 18.78"
      stroke={fill}
      strokeWidth="2.2"
      strokeLinecap="round"
    />
  </svg>
);

// 5. Square Stack Fill (Apple Music Library Tab Icon)
export const SFLibraryFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <rect x="5.5" y="2.5" width="13" height="13" rx="2.5" fill={fill} fillOpacity="0.4" />
    <rect x="4" y="5" width="16" height="14" rx="2.5" fill={fill} fillOpacity="0.7" />
    <rect x="2.5" y="7.5" width="19" height="14" rx="3" fill={fill} />
  </svg>
);

export const SFLibrary: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M7 3.5H17C18.1 3.5 19 4.4 19 5.5" stroke={fill} strokeWidth="1.8" strokeLinecap="round" />
    <path d="M5 6.5H19C20.1 6.5 21 7.4 21 8.5" stroke={fill} strokeWidth="1.8" strokeLinecap="round" />
    <rect x="3" y="9.5" width="18" height="11.5" rx="2.5" stroke={fill} strokeWidth="1.8" />
    <path d="M9.5 13.5V17M14.5 13.5V17" stroke={fill} strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 6. Magnifying Glass (Apple Music Search Tab Icon)
export const SFSearch: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="11" cy="11" r="7" stroke={fill} strokeWidth="2.4" />
    <path d="M16.5 16.5L21.5 21.5" stroke={fill} strokeWidth="2.6" strokeLinecap="round" />
  </svg>
);

// 7. Play Fill (Apple Music Solid Play Triangle with Rounded Vertices)
export const SFPlayFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M7.8 5.75C7.8 4.75 8.92 4.15 9.76 4.7L20.24 11.45C21.02 11.95 21.02 13.05 20.24 13.55L9.76 20.3C8.92 20.85 7.8 20.25 7.8 19.25V5.75Z"
      fill={fill}
    />
  </svg>
);

// 8. Pause Fill (Apple Music Solid Dual Capsule Pillars)
export const SFPauseFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <rect x="6.5" y="4.5" width="4" height="15" rx="2" fill={fill} />
    <rect x="13.5" y="4.5" width="4" height="15" rx="2" fill={fill} />
  </svg>
);

// 9. Forward Fill (Apple Music Skip Next Double Chevrons with Bar)
export const SFForwardFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M4.5 7.2C4.5 6.2 5.65 5.65 6.45 6.25L13.2 11.4C13.8 11.85 13.8 12.75 13.2 13.2L6.45 18.35C5.65 18.95 4.5 18.4 4.5 17.4V7.2Z"
      fill={fill}
    />
    <path
      d="M12.5 7.2C12.5 6.2 13.65 5.65 14.45 6.25L21.2 11.4C21.8 11.85 21.8 12.75 21.2 13.2L14.45 18.35C13.65 18.95 12.5 18.4 12.5 17.4V7.2Z"
      fill={fill}
    />
  </svg>
);

// 10. Backward Fill (Apple Music Skip Previous Double Chevrons with Bar)
export const SFBackwardFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M19.5 7.2C19.5 6.2 18.35 5.65 17.55 6.25L10.8 11.4C10.2 11.85 10.2 12.75 10.8 13.2L17.55 18.35C18.35 18.95 19.5 18.4 19.5 17.4V7.2Z"
      fill={fill}
    />
    <path
      d="M11.5 7.2C11.5 6.2 10.35 5.65 9.55 6.25L2.8 11.4C2.2 11.85 2.2 12.75 2.8 13.2L9.55 18.35C10.35 18.95 11.5 18.4 11.5 17.4V7.2Z"
      fill={fill}
    />
  </svg>
);

// 11. Quote Bubble Fill (Apple Music Interactive Lyrics Icon)
export const SFQuoteBubbleFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M21.5 11.5C21.5 16.5 17.2 20.5 12 20.5C10.5 20.5 9.1 20.2 7.8 19.6L3.8 20.9C3.3 21.1 2.8 20.6 3 20.1L4.3 16.2C3.2 14.8 2.5 13.2 2.5 11.5C2.5 6.5 6.8 2.5 12 2.5C17.2 2.5 21.5 6.5 21.5 11.5Z"
      fill={fill}
    />
    <path
      d="M9.8 10C9.8 8.9 9.1 8 8 8C7.1 8 6.4 8.7 6.4 9.6C6.4 11.8 7.8 13.5 9.6 13.9L10 13.1C8.8 12.7 8.1 11.8 8.1 10.6C8.3 10.7 8.6 10.8 9 10.8C9.5 10.8 9.8 10.4 9.8 10ZM15.8 10C15.8 8.9 15.1 8 14 8C13.1 8 12.4 8.7 12.4 9.6C12.4 11.8 13.8 13.5 15.6 13.9L16 13.1C14.8 12.7 14.1 11.8 14.1 10.6C14.3 10.7 14.6 10.8 15 10.8C15.5 10.8 15.8 10.4 15.8 10Z"
      fill="#000000"
    />
  </svg>
);

// 12. AirPlay Audio (Apple Music Official Output Switcher)
export const SFAirplayAudio: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M8.5 17.5L12 12.5L15.5 17.5C15.9 18.1 15.5 18.9 14.7 18.9H9.3C8.5 18.9 8.1 18.1 8.5 17.5Z"
      fill={fill}
    />
    <path
      d="M7.8 13.2C6.7 11.9 6 10.3 6 8.5C6 5.2 8.7 2.5 12 2.5C15.3 2.5 18 5.2 18 8.5C18 10.3 17.3 11.9 16.2 13.2"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M4.5 15.8C3 13.8 2 11.3 2 8.5C2 3 6.5 -1.5 12 -1.5C17.5 -1.5 22 3 22 8.5C22 11.3 21 13.8 19.5 15.8"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
    />
  </svg>
);

// 13. Speaker Volume Low & High
export const SFSpeakerFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M6 9.5H3.5C2.7 9.5 2 10.2 2 11V13C2 13.8 2.7 14.5 3.5 14.5H6L10.8 18.7C11.5 19.3 12.5 18.8 12.5 17.9V6.1C12.5 5.2 11.5 4.7 10.8 5.3L6 9.5Z"
      fill={fill}
    />
  </svg>
);

export const SFSpeakerWave3Fill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M5 9.5H3C2.4 9.5 2 9.9 2 10.5V13.5C2 14.1 2.4 14.5 3 14.5H5L9.5 18.5C10.1 19 11 18.6 11 17.8V6.2C11 5.4 10.1 5 9.5 5.5L5 9.5Z"
      fill={fill}
    />
    <path d="M14.5 9C15.2 9.8 15.6 10.9 15.6 12C15.6 13.1 15.2 14.2 14.5 15" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    <path d="M17.5 6.5C18.9 7.9 19.8 9.8 19.8 12C19.8 14.2 18.9 16.1 17.5 17.5" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    <path d="M20.5 4C22.5 6 23.8 8.8 23.8 12C23.8 15.2 22.5 18 20.5 20" stroke={fill} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 14. Shuffle & Repeat
export const SFShuffle: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M16 4H20V8M20 4L14 10M4 20L10 14" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M16 20H20V16M20 20L4 4" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SFRepeat: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M17 2L21 6L17 10" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M3 11V9C3 7.3 4.3 6 6 6H21" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    <path d="M7 22L3 18L7 14" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M21 13V15C21 16.7 19.7 18 18 18H3" stroke={fill} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SFListBullet: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <line x1="8" y1="6" x2="21" y2="6" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
    <line x1="8" y1="12" x2="21" y2="12" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
    <line x1="8" y1="18" x2="21" y2="18" stroke={fill} strokeWidth="2.2" strokeLinecap="round" />
    <circle cx="4" cy="6" r="1.5" fill={fill} />
    <circle cx="4" cy="12" r="1.5" fill={fill} />
    <circle cx="4" cy="18" r="1.5" fill={fill} />
  </svg>
);

// 15. Chevrons (Apple iOS Navigation)
export const SFChevronDown: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M6 9L12 15L18 9" stroke={fill} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SFChevronRight: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M9 6L15 12L9 18" stroke={fill} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SFChevronLeft: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M15 6L9 12L15 18" stroke={fill} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SFChevronUp: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M18 15L12 9L6 15" stroke={fill} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 16. Ellipsis (Apple 3-Dots More Action)
export const SFEllipsis: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="5" cy="12" r="2" fill={fill} />
    <circle cx="12" cy="12" r="2" fill={fill} />
    <circle cx="19" cy="12" r="2" fill={fill} />
  </svg>
);

export const SFEllipsisCircle: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="9" stroke={fill} strokeWidth="2" />
    <circle cx="8" cy="12" r="1.5" fill={fill} />
    <circle cx="12" cy="12" r="1.5" fill={fill} />
    <circle cx="16" cy="12" r="1.5" fill={fill} />
  </svg>
);

// 17. Heart (Apple Music Love Track)
export const SFHeart: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
      stroke={fill}
      strokeWidth="2"
      fill="none"
    />
  </svg>
);

export const SFHeartFill: React.FC<IconProps> = ({ size = 24, className = '', fill = '#FA2D48', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.81 12 5.09C13.09 3.81 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.04L12 21.35Z"
      fill={fill}
    />
  </svg>
);

// 18. Download & Offline
export const SFArrowDownCircle: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="9" stroke={fill} strokeWidth="2" />
    <path d="M12 7V16M12 16L8.5 12.5M12 16L15.5 12.5" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SFArrowDownCircleFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="10" fill={fill} />
    <path d="M12 7V15M12 15L8.5 11.5M12 15L15.5 11.5" stroke="#000000" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 19. Close & Xmark
export const SFXmark: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M18 6L6 18M6 6L18 18" stroke={fill} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export const SFXmarkCircleFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="10" fill={fill} />
    <path d="M15 9L9 15M9 9L15 15" stroke="#000000" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 20. Music Note & Disc
export const SFMusicNote: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M9 18V5L20 3V16M9 18C9 19.66 7.66 21 6 21C4.34 21 3 19.66 3 18C3 16.34 4.34 15 6 15C7.66 15 9 16.34 9 18ZM20 16C20 17.66 18.66 19 17 19C15.34 19 14 17.66 14 16C14 14.34 15.34 13 17 13C18.66 13 20 14.34 20 16Z"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SFDisc: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="9" stroke={fill} strokeWidth="2" />
    <circle cx="12" cy="12" r="3" stroke={fill} strokeWidth="2" />
    <circle cx="12" cy="12" r="1" fill={fill} />
  </svg>
);

// 21. User Profile & Settings
export const SFPersonCropCircle: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="9" stroke={fill} strokeWidth="2" />
    <circle cx="12" cy="9" r="3.2" stroke={fill} strokeWidth="1.8" />
    <path d="M6.5 18C7.5 15.5 9.5 14.2 12 14.2C14.5 14.2 16.5 15.5 17.5 18" stroke={fill} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

export const SFPersonCropCircleFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="10" fill={fill} />
    <circle cx="12" cy="9" r="3" fill="#000000" />
    <path d="M6 18.5C7.2 15.8 9.3 14.5 12 14.5C14.7 14.5 16.8 15.8 18 18.5" fill="#000000" />
  </svg>
);

// 22. Sliders & Equalizer
export const SFSliderHorizontal3: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <line x1="3" y1="6" x2="21" y2="6" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    <circle cx="8" cy="6" r="2.5" fill={fill} />
    <line x1="3" y1="12" x2="21" y2="12" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    <circle cx="16" cy="12" r="2.5" fill={fill} />
    <line x1="3" y1="18" x2="21" y2="18" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    <circle cx="10" cy="18" r="2.5" fill={fill} />
  </svg>
);

// 23. AuraSync Devices (Laptop & iPhone)
export const SFLaptopcomputer: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <rect x="4" y="5" width="16" height="11" rx="2" stroke={fill} strokeWidth="1.8" />
    <path d="M2 19H22" stroke={fill} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

export const SFIphone: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <rect x="6" y="2" width="12" height="20" rx="3.5" stroke={fill} strokeWidth="1.8" />
    <line x1="10.5" y1="18.5" x2="13.5" y2="18.5" stroke={fill} strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);

// 24. Sparkles & Flame (Aura AI & Trending)
export const SFSparkles: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M12 3L13.5 8.5L19 10L13.5 11.5L12 17L10.5 11.5L5 10L10.5 8.5L12 3Z"
      fill={fill}
    />
    <path
      d="M19 16L19.8 18.2L22 19L19.8 19.8L19 22L18.2 19.8L16 19L18.2 18.2L19 16Z"
      fill={fill}
    />
  </svg>
);

export const SFFlameFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M12 2C10.5 5 12 7.5 11 9C10 10.5 8 11.5 8 14C8 17.3 10.7 20 14 20C17.3 20 20 17.3 20 14C20 9 15 6 15 2C13.5 3 13 4 12 2Z"
      fill={fill}
    />
  </svg>
);

// 25. Headphones
export const SFHeadphones: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M3 14V11C3 6.03 7.03 2 12 2C16.97 2 21 6.03 21 11V14" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    <rect x="2" y="14" width="4.5" height="7" rx="2" fill={fill} />
    <rect x="17.5" y="14" width="4.5" height="7" rx="2" fill={fill} />
  </svg>
);

// 26. Checkmark
export const SFCheckmark: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M5 12.5L9.5 17L19 7" stroke={fill} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 27. Upload
export const SFUpload: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M12 16V4M12 4L7 9M12 4L17 9" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M4 14V19C4 19.55 4.45 20 5 20H19C19.55 20 20 19.55 20 19V14" stroke={fill} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 28. Plus
export const SFPlus: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <line x1="12" y1="5" x2="12" y2="19" stroke={fill} strokeWidth="2.4" strokeLinecap="round" />
    <line x1="5" y1="12" x2="19" y2="12" stroke={fill} strokeWidth="2.4" strokeLinecap="round" />
  </svg>
);

// 29. House / Home (Apple Music Home Tab)
export const SFHouseFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M12 2.5L2.5 10.2C2.18 10.46 2 10.85 2 11.26V20C2 20.83 2.67 21.5 3.5 21.5H8.5C9.05 21.5 9.5 21.05 9.5 20.5V15.5C9.5 14.95 9.95 14.5 10.5 14.5H13.5C14.05 14.5 14.5 14.95 14.5 15.5V20.5C14.5 21.05 14.95 21.5 15.5 21.5H20.5C21.33 21.5 22 20.83 22 20V11.26C22 10.85 21.82 10.46 21.5 10.2L12 2.5Z"
      fill={fill}
    />
  </svg>
);

export const SFHouse: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M12 3.2L3.5 10.2V19.5C3.5 20.33 4.17 21 5 21H8.5C9.05 21 9.5 20.55 9.5 20V15C9.5 14.45 9.95 14 10.5 14H13.5C14.05 14 14.5 14.45 14.5 15V20C14.5 20.55 14.95 21 15.5 21H19C19.83 21 20.5 20.33 20.5 19.5V10.2L12 3.2Z"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 30. Compass / Browse
export const SFCompassFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="9.5" fill={fill} />
    <path d="M15.5 8.5L10 10.5L8.5 15.5L14 13.5L15.5 8.5Z" fill="#000000" />
  </svg>
);

export const SFCompass: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <circle cx="12" cy="12" r="9" stroke={fill} strokeWidth="2" />
    <polygon points="14.5,9.5 10.5,10.8 9.5,14.5 13.5,13.2" fill={fill} />
  </svg>
);

// 31. Dolby Atmos / Lossless Badge
export const DolbyAtmosBadge: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 border border-white/10 text-[9px] font-bold tracking-wider uppercase text-white/70 select-none ${className}`}>
    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
    <span>Dolby Atmos</span>
  </div>
);

// 32. Star (Apple Music Favorite)
export const SFStar: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M12 2.5L14.9 8.6L21.6 9.5L16.7 14.2L17.9 20.8L12 17.6L6.1 20.8L7.3 14.2L2.4 9.5L9.1 8.6L12 2.5Z"
      stroke={fill}
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const SFStarFill: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path
      d="M12 2.5L14.9 8.6L21.6 9.5L16.7 14.2L17.9 20.8L12 17.6L6.1 20.8L7.3 14.2L2.4 9.5L9.1 8.6L12 2.5Z"
      fill={fill}
      stroke={fill}
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

// Apple Logo (Official Apple Music Brand Icon)
export const SFAppleLogo: React.FC<IconProps> = ({ size = 16, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 170 170" fill={fill} className={className} {...props}>
    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.08-7.61-7.8-11.73-14.14-5.3-8.08-9.49-17.26-12.57-27.53-3.08-10.27-4.63-20.09-4.63-29.47 0-14.86 3.82-26.25 11.45-34.17 7.64-7.92 16.79-11.96 27.46-12.12 4.12 0 9.07 1.09 14.85 3.27 5.78 2.18 9.38 3.33 10.81 3.45 2.05-.12 5.92-1.38 11.61-3.77 5.69-2.39 10.36-3.41 14.02-3.07 10.27.65 18.66 4.38 25.17 11.2-8.32 5.12-12.39 12.33-12.21 21.63.18 7.39 2.95 13.68 8.32 18.88 5.37 5.19 11.89 8.21 19.57 9.05-1.9 5.88-4.27 12.01-7.1 18.39zM119.22 33.02c0-5.74 1.94-11.22 5.82-16.44 3.87-5.22 8.78-9.08 14.73-11.58-.2 1.43-.37 2.81-.51 4.14-.35 4.67-1.95 9.35-4.8 14.04-2.85 4.69-6.66 8.35-11.43 10.98-1.91.95-3.85 1.54-5.81 1.77.67-.97 1.34-1.94 2-2.91z" />
  </svg>
);

// 33. Sort (Two vertical opposite arrows)
export const SFArrowUpArrowDown: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M7 4V19M7 4L3.5 7.5M7 4L10.5 7.5M17 20V5M17 20L13.5 16.5M17 20L20.5 16.5" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 34. List / Filter (3 horizontal lines)
export const SFLine3Horizontal: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M4 6H20M4 12H20M4 18H20" stroke={fill} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 35. Arrow Down Simple (Download)
export const SFArrowDown: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M12 3.5V16.5M12 16.5L6.5 11M12 16.5L17.5 11" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 36. Mic (SF Symbols Microphone for Search / Siri)
export const SFMic: React.FC<IconProps> = ({ size = 24, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <rect x="9" y="3" width="6" height="11" rx="3" fill={fill} />
    <path d="M5 10C5 13.866 8.134 17 12 17C15.866 17 19 13.866 19 10" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    <path d="M12 17V21" stroke={fill} strokeWidth="2" strokeLinecap="round" />
    <path d="M8.5 21H15.5" stroke={fill} strokeWidth="2" strokeLinecap="round" />
  </svg>
);

// 37. Eye (SF Eye for password reveal)
export const SFEye: React.FC<IconProps> = ({ size = 20, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// 38. Eye Slash (SF Eye Slash for password hide)
export const SFEyeSlash: React.FC<IconProps> = ({ size = 20, className = '', fill = 'currentColor', ...props }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} {...props}>
    <path d="M17.94 17.94A10.07 10.07 0 0112 20C5 20 1 12 1 12A18.45 18.45 0 015.06 6.06M9.9 4.24A9.12 9.12 0 0112 4C19 4 23 12 23 12A18.5 18.5 0 0119.78 16.22M1 1L23 23M14.12 14.12A3 3 0 119.88 9.88" stroke={fill} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);


