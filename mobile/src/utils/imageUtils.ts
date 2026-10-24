/**
 * Utility to upgrade YouTube & YouTube Music thumbnails to crisp HD (544x544 or 800x800)
 * Eliminates blurry/pixelated artwork ("gambar burik") and broken images.
 */
export function upgradeThumbnailUrl(url?: string, videoId?: string): string {
  if (!url) {
    if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
      return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
    }
    return '';
  }

  // Google User Content (YouTube Music high-res artwork)
  if (url.includes('googleusercontent.com')) {
    if (/=w\d+-h\d+[^?#]*/.test(url)) {
      return url.replace(/=w\d+-h\d+[^?#]*/, '=w544-h544-l90-rj');
    }
    if (/=s\d+[^?#]*/.test(url)) {
      return url.replace(/=s\d+[^?#]*/, '=s544-c');
    }
    return `${url}=w544-h544-l90-rj`;
  }

  // YouTube static video thumbnails
  if (url.includes('i.ytimg.com')) {
    if (url.includes('default.jpg') && !url.includes('hqdefault.jpg') && !url.includes('maxresdefault.jpg')) {
      return url.replace(/(?:default|mqdefault|sddefault)\.jpg/, 'hqdefault.jpg');
    }
  }

  return url;
}

export const FALLBACK_COVER = '/assets/cover748_0643063b.png';
