// Zero-dependency ultra-fast canvas color extraction (< 3ms)
// Implements Section 7.1 of design.md:
// "Konversi ke HSL lalu batasi: saturasi maksimum 55%, lightness antara 35% dan 55%."
export interface ExtractedColors {
  primary: string; // e.g. "rgb(91, 143, 158)" - --now
  secondary: string; // e.g. "rgb(27, 43, 47)" - --now-dark
  dark?: string; // alias for secondary / --now-dark
  accent: string; // e.g. "#F4F4F0" - --accent (off-white)
  isDark: boolean;
}

const colorCache = new Map<string, ExtractedColors>();

export function toRgba(rgbStr: string, alpha: number): string {
  if (!rgbStr) return `rgba(11, 11, 12, ${alpha})`;
  if (rgbStr.startsWith('rgba')) {
    return rgbStr.replace(/[\d\.]+\)$/, `${alpha})`);
  }
  if (rgbStr.startsWith('rgb(')) {
    return rgbStr.replace('rgb(', 'rgba(').replace(')', `, ${alpha})`);
  }
  if (rgbStr.startsWith('#')) {
    let hex = rgbStr.slice(1);
    if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return rgbStr;
}

// Default from design (1).md: --now = #6B7F94, --now-dark = #6B7F94 x 0.3 (#20262C)
export const DEFAULT_COLORS: ExtractedColors = {
  primary: 'rgb(107, 127, 148)', // #6B7F94
  secondary: 'rgb(32, 38, 44)', // #6B7F94 x 0.3
  dark: 'rgb(32, 38, 44)',
  accent: '#F4F4F0', // --accent (off-white)
  isDark: true,
};

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

export function extractColorsFromImage(imageUrl: string): Promise<ExtractedColors> {
  if (!imageUrl) return Promise.resolve(DEFAULT_COLORS);

  const cached = colorCache.get(imageUrl);
  if (cached) return Promise.resolve(cached);

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          resolve(DEFAULT_COLORS);
          return;
        }

        ctx.drawImage(img, 0, 0, size, size);
        const imgData = ctx.getImageData(0, 0, size, size).data;

        const buckets: { r: number; g: number; b: number; score: number }[] = [];

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue;

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const delta = max - min;
          const lightness = (max + min) / 2;

          if (delta > 15 && lightness > 30 && lightness < 225) {
            const saturation = max === 0 ? 0 : delta / max;
            const score = saturation * (1 - Math.abs(lightness - 128) / 128);
            buckets.push({ r, g, b, score });
          }
        }

        let primaryR = 107;
        let primaryG = 127;
        let primaryB = 148;

        if (buckets.length > 0) {
          buckets.sort((a, b) => b.score - a.score);
          const chosen = buckets[0];

          // Clamping to HSL per Section 7.1:
          // Max saturation 55%, lightness 35% - 55%
          const [h, s, l] = rgbToHsl(chosen.r, chosen.g, chosen.b);
          const clampedS = Math.min(0.55, Math.max(0.2, s));
          const clampedL = Math.min(0.55, Math.max(0.35, l));
          [primaryR, primaryG, primaryB] = hslToRgb(h, clampedS, clampedL);
        }

        // Secondary: --now x 0.3 for deep mood contrast
        const secondaryR = Math.round(primaryR * 0.3);
        const secondaryG = Math.round(primaryG * 0.3);
        const secondaryB = Math.round(primaryB * 0.3);

        const result: ExtractedColors = {
          primary: `rgb(${primaryR}, ${primaryG}, ${primaryB})`,
          secondary: `rgb(${secondaryR}, ${secondaryG}, ${secondaryB})`,
          accent: '#F4F4F0',
          isDark: true,
        };

        if (colorCache.size > 200) {
          const firstKey = colorCache.keys().next().value;
          if (firstKey) colorCache.delete(firstKey);
        }
        colorCache.set(imageUrl, result);

        resolve(result);
      } catch (e) {
        resolve(DEFAULT_COLORS);
      }
    };

    img.onerror = () => {
      resolve(DEFAULT_COLORS);
    };

    img.src = imageUrl;
  });
}
