import { useState, useEffect } from 'react';
import { extractColorsFromImage, ExtractedColors } from '../utils/colorExtractor';

const DEFAULT_COLORS: ExtractedColors = {
  primary: 'rgb(24, 24, 30)',
  secondary: 'rgb(14, 14, 18)',
  accent: 'rgb(30, 215, 96)',
  isDark: true,
};

export function useCoverColors(coverUrl?: string): ExtractedColors {
  const [colors, setColors] = useState<ExtractedColors>(DEFAULT_COLORS);

  useEffect(() => {
    let isMounted = true;
    if (!coverUrl) {
      setColors(DEFAULT_COLORS);
      return;
    }

    extractColorsFromImage(coverUrl).then((res) => {
      if (isMounted) {
        setColors(res);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [coverUrl]);

  return colors;
}
