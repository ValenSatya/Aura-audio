import { useRef, useEffect } from 'react';
import { animate, spring, createTimeline, eases, stagger } from 'animejs';

/**
 * Standard Apple-grade Spring Curves
 */
export const AppleSprings = {
  // Snappy for buttons, icons, micro-interactions
  snappy: spring({ bounce: 0.18, duration: 320 }),
  // Smooth for bottom sheets, modals, screen pushes
  sheet: spring({ bounce: 0.12, duration: 420 }),
  // Gentle for album covers, large cards
  gentle: spring({ bounce: 0.22, duration: 480 }),
};

/**
 * Animate Bottom Sheet / Modal entrance with native Apple physics
 */
export const animateSheetEntrance = (target: HTMLElement | null, onComplete?: () => void) => {
  if (!target) return;
  const anim = animate(target, {
    y: ['100%', '0%'],
    opacity: [0.85, 1],
    ease: AppleSprings.sheet,
  });
  if (onComplete) anim.then(onComplete);
};

/**
 * Animate Bottom Sheet / Modal exit
 */
export const animateSheetExit = (target: HTMLElement | null, onComplete?: () => void) => {
  if (!target) return;
  const anim = animate(target, {
    y: ['0%', '100%'],
    opacity: [1, 0],
    duration: 240,
    ease: 'in(2)',
  });
  if (onComplete) anim.then(onComplete);
};

/**
 * Hook to manage smooth Anime.js sheet entrance & dismissal
 */
export const useAnimatedSheet = (isOpen: boolean, onClose: () => void) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && sheetRef.current) {
      animateSheetEntrance(sheetRef.current);
      if (backdropRef.current) {
        animate(backdropRef.current, { opacity: [0, 1], duration: 250, ease: 'out(2)' });
      }
    }
  }, [isOpen]);

  const handleDismiss = () => {
    if (sheetRef.current) {
      if (backdropRef.current) {
        animate(backdropRef.current, { opacity: [1, 0], duration: 200, ease: 'in(2)' });
      }
      animateSheetExit(sheetRef.current, onClose);
    } else {
      onClose();
    }
  };

  return { sheetRef, backdropRef, handleDismiss };
};

/**
 * Micro-bounce press for buttons and interactive icons
 */
export const animatePress = (target: HTMLElement | null) => {
  if (!target) return;
  animate(target, {
    scale: [
      { to: 0.92, duration: 90, ease: 'out(2)' },
      { to: 1, duration: 180, ease: AppleSprings.snappy },
    ],
  });
};

/**
 * Fade & slide entrance for screen views / lists
 */
export const animateViewEntrance = (target: HTMLElement | null, onComplete?: () => void) => {
  if (!target) return;
  const anim = animate(target, {
    opacity: [0, 1],
    y: [12, 0],
    duration: 280,
    ease: 'out(3)',
  });
  if (onComplete) anim.then(onComplete);
};

/**
 * Staggered entrance for song lists or grid tiles
 */
export const animateStaggeredList = (targets: HTMLElement[] | string, onComplete?: () => void) => {
  if (!targets) return;
  const anim = animate(targets, {
    opacity: [0, 1],
    y: [14, 0],
    delay: stagger(35, { start: 20 }),
    duration: 300,
    ease: 'out(2.5)',
  });
  if (onComplete) anim.then(onComplete);
};

/**
 * Album cover swap pop
 */
export const animateCoverPop = (target: HTMLElement | null) => {
  if (!target) return;
  animate(target, {
    scale: [0.94, 1],
    opacity: [0.7, 1],
    ease: AppleSprings.gentle,
  });
};

export { animate, spring, createTimeline, eases, stagger };

