import * as path from 'path';
import * as fs from 'fs';
import { app } from 'electron';

export function getYtDlpPath(): string {
  const candidates: string[] = [
    path.join(process.cwd(), 'bin', 'yt-dlp.exe'),
  ];

  try {
    if (app && typeof app.getAppPath === 'function') {
      candidates.push(path.join(app.getAppPath(), 'bin', 'yt-dlp.exe'));
    }
  } catch {}

  try {
    if (process.resourcesPath) {
      candidates.push(path.join(process.resourcesPath, 'bin', 'yt-dlp.exe'));
    }
  } catch {}

  candidates.push(path.join(__dirname, '..', '..', 'bin', 'yt-dlp.exe'));

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  // Fallback to system PATH
  return 'yt-dlp';
}
