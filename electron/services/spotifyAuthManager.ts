import { app, BrowserWindow, session } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

export interface SpotifyAuthStatus {
  isLoggedIn: boolean;
  name?: string;
  email?: string;
  avatarUrl?: string;
  id?: string;
  product?: string;
}

export class SpotifyAuthManager {
  private sessionFile: string;
  private authWindow: BrowserWindow | null = null;
  private cachedAccessToken: { token: string; expiresAt: number } | null = null;

  constructor() {
    const userData = app.getPath('userData');
    this.sessionFile = path.join(userData, 'spotify_session.json');
  }

  private loadStoredData(): { sp_dc?: string; profile?: SpotifyAuthStatus } | null {
    try {
      if (fs.existsSync(this.sessionFile)) {
        const raw = fs.readFileSync(this.sessionFile, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Error loading Spotify session:', e);
    }
    return null;
  }

  private saveStoredData(data: { sp_dc?: string; profile?: SpotifyAuthStatus }): void {
    try {
      fs.writeFileSync(this.sessionFile, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving Spotify session:', e);
    }
  }

  public getSpDcCookie(): string | null {
    const stored = this.loadStoredData();
    return stored?.sp_dc || null;
  }

  public getAuthStatus(): SpotifyAuthStatus {
    const stored = this.loadStoredData();
    if (stored?.sp_dc && stored?.profile) {
      return {
        ...stored.profile,
        isLoggedIn: true,
      };
    }
    return { isLoggedIn: false };
  }

  public async getAccessToken(): Promise<string | null> {
    const now = Date.now();
    if (this.cachedAccessToken && this.cachedAccessToken.expiresAt > now + 60000) {
      return this.cachedAccessToken.token;
    }

    const spDc = this.getSpDcCookie();
    if (!spDc) return null;

    try {
      const res = await fetch(
        'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
        {
          headers: {
            'User-Agent':
              'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
            Cookie: `sp_dc=${spDc}`,
          },
        }
      );

      if (!res.ok) {
        console.error('Failed to get Spotify access token with sp_dc, HTTP:', res.status);
        return null;
      }

      const data: any = await res.json();
      if (data.accessToken) {
        const expiresAt = data.accessTokenExpirationTimestampMs || now + 3600000;
        this.cachedAccessToken = {
          token: data.accessToken,
          expiresAt,
        };
        return data.accessToken;
      }
    } catch (err) {
      console.error('Error fetching Spotify access token:', err);
    }
    return null;
  }

  public async fetchUserProfile(token: string): Promise<SpotifyAuthStatus> {
    try {
      const res = await fetch('https://api.spotify.com/v1/me', {
        headers: {
          Authorization: `Bearer ${token}`,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        },
      });

      if (res.ok) {
        const d: any = await res.json();
        return {
          isLoggedIn: true,
          id: d.id,
          name: d.display_name || d.id,
          email: d.email,
          avatarUrl: d.images?.[0]?.url,
          product: d.product,
        };
      }
    } catch (err) {
      console.error('Error fetching Spotify me profile:', err);
    }

    return { isLoggedIn: true, name: 'Pengguna Spotify' };
  }

  public async loginWithWindow(parentWindow?: BrowserWindow): Promise<SpotifyAuthStatus> {
    if (this.authWindow && !this.authWindow.isDestroyed()) {
      this.authWindow.focus();
      return this.getAuthStatus();
    }

    return new Promise((resolve) => {
      const authSes = session.fromPartition('persist:spotify_auth');

      this.authWindow = new BrowserWindow({
        width: 480,
        height: 680,
        parent: parentWindow,
        modal: true,
        title: 'Login ke Spotify',
        autoHideMenuBar: true,
        webPreferences: {
          session: authSes,
          nodeIntegration: false,
          contextIsolation: true,
        },
      });

      let resolved = false;

      const finishLogin = async (spDc: string) => {
        if (resolved) return;
        resolved = true;

        try {
          const res = await fetch(
            'https://open.spotify.com/get_access_token?reason=transport&productType=web_player',
            {
              headers: {
                'User-Agent':
                  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
                Cookie: `sp_dc=${spDc}`,
              },
            }
          );

          let profile: SpotifyAuthStatus = { isLoggedIn: true, name: 'Akun Spotify' };
          if (res.ok) {
            const data: any = await res.json();
            if (data.accessToken) {
              this.cachedAccessToken = {
                token: data.accessToken,
                expiresAt: data.accessTokenExpirationTimestampMs || Date.now() + 3600000,
              };
              profile = await this.fetchUserProfile(data.accessToken);
            }
          }

          this.saveStoredData({ sp_dc: spDc, profile });

          if (this.authWindow && !this.authWindow.isDestroyed()) {
            this.authWindow.close();
          }
          this.authWindow = null;
          resolve(profile);
        } catch (err) {
          console.error('Error completing Spotify login:', err);
          if (this.authWindow && !this.authWindow.isDestroyed()) {
            this.authWindow.close();
          }
          this.authWindow = null;
          resolve({ isLoggedIn: false });
        }
      };

      // Poll cookies periodically during user login
      const cookieCheckInterval = setInterval(async () => {
        try {
          const cookies = await authSes.cookies.get({ domain: '.spotify.com', name: 'sp_dc' });
          if (cookies.length > 0 && cookies[0].value) {
            clearInterval(cookieCheckInterval);
            await finishLogin(cookies[0].value);
          }
        } catch {}
      }, 1000);

      this.authWindow.on('closed', () => {
        clearInterval(cookieCheckInterval);
        this.authWindow = null;
        if (!resolved) {
          resolved = true;
          resolve(this.getAuthStatus());
        }
      });

      this.authWindow.loadURL('https://accounts.spotify.com/en/login');
    });
  }

  public async logout(): Promise<boolean> {
    try {
      this.cachedAccessToken = null;
      if (fs.existsSync(this.sessionFile)) {
        fs.unlinkSync(this.sessionFile);
      }
      const authSes = session.fromPartition('persist:spotify_auth');
      await authSes.clearStorageData();
      return true;
    } catch (e) {
      console.error('Error logging out of Spotify:', e);
      return false;
    }
  }
}
