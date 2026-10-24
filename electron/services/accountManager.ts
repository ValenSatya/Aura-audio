import { app } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import * as crypto from 'crypto';

export interface StoredUser {
  id: string;
  name: string;
  username: string;
  email?: string;
  passwordHash: string;
  avatarUrl?: string;
  createdAt: number;
}

export interface UserProfileResponse {
  id: string;
  isLoggedIn: boolean;
  name: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  createdAt: number;
  loginDate?: number;
}

export class AccountManager {
  private usersPath: string;
  private sessionPath: string;
  private playlistsPath: string;

  constructor() {
    const userData = app.getPath('userData');
    this.usersPath = path.join(userData, 'aura_users.json');
    this.sessionPath = path.join(userData, 'aura_session.json');
    this.playlistsPath = path.join(userData, 'aura_playlists.json');
  }

  private hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password.trim()).digest('hex');
  }

  private loadUsers(): StoredUser[] {
    try {
      if (fs.existsSync(this.usersPath)) {
        const raw = fs.readFileSync(this.usersPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to load users:', e);
    }
    return [];
  }

  private saveUsers(users: StoredUser[]): void {
    try {
      fs.writeFileSync(this.usersPath, JSON.stringify(users, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to save users:', e);
    }
  }

  private backendUrl = 'http://localhost:4000';

  public getCurrentUser(): UserProfileResponse | { isLoggedIn: false } {
    try {
      if (fs.existsSync(this.sessionPath)) {
        const raw = fs.readFileSync(this.sessionPath, 'utf-8');
        const session = JSON.parse(raw);
        if (session.user) {
          return {
            id: session.user.id,
            isLoggedIn: true,
            name: session.user.name,
            username: session.user.name,
            email: session.user.email,
            avatarUrl: session.user.avatarUrl,
            createdAt: session.user.createdAt ? new Date(session.user.createdAt).getTime() : Date.now(),
            loginDate: session.loginDate,
          };
        }
        const users = this.loadUsers();
        const user = users.find((u) => u.id === session.userId);
        if (user) {
          return {
            id: user.id,
            isLoggedIn: true,
            name: user.name,
            username: user.username,
            email: user.email,
            avatarUrl: user.avatarUrl,
            createdAt: user.createdAt,
            loginDate: session.loginDate,
          };
        }
      }
    } catch (e) {
      console.error('Failed to get current user session:', e);
    }
    return { isLoggedIn: false };
  }

  public async register(payload: {
    name: string;
    username: string;
    password: string;
    avatarUrl?: string;
    email?: string;
  }): Promise<{ success: boolean; user?: UserProfileResponse; error?: string }> {
    const trimmedUsername = payload.username.trim().toLowerCase();
    const trimmedName = payload.name.trim() || trimmedUsername;

    if (!trimmedUsername || trimmedUsername.length < 3) {
      return { success: false, error: 'Username minimal 3 karakter.' };
    }
    if (!payload.password || payload.password.length < 4) {
      return { success: false, error: 'Password minimal 4 karakter.' };
    }

    // 1. Try registering with Central Backend Server (aura.db)
    try {
      const res = await fetch(`${this.backendUrl}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          username: trimmedUsername,
          email: payload.email?.trim() || `${trimmedUsername}@aura.app`,
          password: payload.password,
          avatarUrl: payload.avatarUrl || '',
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        const sessionData = {
          userId: data.user.id,
          token: data.token,
          user: data.user,
          loginDate: Date.now(),
        };
        fs.writeFileSync(this.sessionPath, JSON.stringify(sessionData, null, 2), 'utf-8');

        // Also cache locally
        const users = this.loadUsers();
        users.push({
          id: data.user.id,
          name: data.user.name,
          username: trimmedUsername,
          email: data.user.email,
          passwordHash: this.hashPassword(payload.password),
          avatarUrl: data.user.avatarUrl || '',
          createdAt: Date.now(),
        });
        this.saveUsers(users);

        return {
          success: true,
          user: {
            id: data.user.id,
            isLoggedIn: true,
            name: data.user.name,
            username: trimmedUsername,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl,
            createdAt: new Date(data.user.createdAt).getTime(),
            loginDate: sessionData.loginDate,
          },
        };
      } else {
        const errData = await res.json().catch(() => ({}));
        if (res.status === 409 || res.status === 400) {
          return { success: false, error: errData.error || 'Pendaftaran gagal.' };
        }
      }
    } catch {
      console.warn('[AccountManager] Central server unreachable for register, falling back to local storage.');
    }

    // 2. Offline Fallback to Local JSON
    const users = this.loadUsers();
    if (users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      return { success: false, error: 'Username sudah digunakan, silakan pilih username lain.' };
    }

    const newUser: StoredUser = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: trimmedName,
      username: trimmedUsername,
      email: payload.email?.trim() || `${trimmedUsername}@aura.app`,
      passwordHash: this.hashPassword(payload.password),
      avatarUrl: payload.avatarUrl || '',
      createdAt: Date.now(),
    };

    users.push(newUser);
    this.saveUsers(users);

    const sessionData = { userId: newUser.id, loginDate: Date.now() };
    fs.writeFileSync(this.sessionPath, JSON.stringify(sessionData, null, 2), 'utf-8');

    return {
      success: true,
      user: {
        id: newUser.id,
        isLoggedIn: true,
        name: newUser.name,
        username: newUser.username,
        email: newUser.email,
        avatarUrl: newUser.avatarUrl,
        createdAt: newUser.createdAt,
        loginDate: sessionData.loginDate,
      },
    };
  }

  public async login(payload: {
    username: string;
    password: string;
  }): Promise<{ success: boolean; user?: UserProfileResponse; error?: string }> {
    const trimmedUsername = payload.username.trim().toLowerCase();

    // 1. Try logging in with Central Backend Server (aura.db)
    try {
      const res = await fetch(`${this.backendUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: trimmedUsername,
          email: trimmedUsername,
          password: payload.password,
        }),
        signal: AbortSignal.timeout(3000),
      });

      if (res.ok) {
        const data = await res.json();
        const sessionData = {
          userId: data.user.id,
          token: data.token,
          user: data.user,
          loginDate: Date.now(),
        };
        fs.writeFileSync(this.sessionPath, JSON.stringify(sessionData, null, 2), 'utf-8');

        return {
          success: true,
          user: {
            id: data.user.id,
            isLoggedIn: true,
            name: data.user.name,
            username: data.user.name,
            email: data.user.email,
            avatarUrl: data.user.avatarUrl,
            createdAt: new Date(data.user.createdAt).getTime(),
            loginDate: sessionData.loginDate,
          },
        };
      } else if (res.status === 401) {
        // Fallback check in local DB before giving up
        const hash = this.hashPassword(payload.password);
        const users = this.loadUsers();
        const user = users.find(
          (u) =>
            (u.username.toLowerCase() === trimmedUsername || (u.email && u.email.toLowerCase() === trimmedUsername)) &&
            u.passwordHash === hash
        );
        if (!user) {
          return { success: false, error: 'Email/Username atau password salah.' };
        }
      }
    } catch {
      console.warn('[AccountManager] Central server unreachable for login, falling back to local storage.');
    }

    // 2. Offline Fallback to Local JSON
    const hash = this.hashPassword(payload.password);
    const users = this.loadUsers();
    const user = users.find(
      (u) =>
        (u.username.toLowerCase() === trimmedUsername || (u.email && u.email.toLowerCase() === trimmedUsername)) &&
        u.passwordHash === hash
    );

    if (!user) {
      return { success: false, error: 'Username atau password salah.' };
    }

    const sessionData = { userId: user.id, loginDate: Date.now() };
    fs.writeFileSync(this.sessionPath, JSON.stringify(sessionData, null, 2), 'utf-8');

    return {
      success: true,
      user: {
        id: user.id,
        isLoggedIn: true,
        name: user.name,
        username: user.username,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
        loginDate: sessionData.loginDate,
      },
    };
  }

  public updateProfile(payload: {
    name?: string;
    avatarUrl?: string;
  }): { success: boolean; user?: UserProfileResponse; error?: string } {
    const cur = this.getCurrentUser();
    if (!cur.isLoggedIn || !cur.id) {
      return { success: false, error: 'Belum ada pengguna yang masuk.' };
    }

    let updatedUser: UserProfileResponse = { ...cur };

    try {
      if (fs.existsSync(this.sessionPath)) {
        const raw = fs.readFileSync(this.sessionPath, 'utf-8');
        const session = JSON.parse(raw);
        if (session.user) {
          if (payload.name !== undefined && payload.name.trim()) {
            session.user.name = payload.name.trim();
          }
          if (payload.avatarUrl !== undefined) {
            session.user.avatarUrl = payload.avatarUrl;
          }
          fs.writeFileSync(this.sessionPath, JSON.stringify(session, null, 2), 'utf-8');
          updatedUser = {
            id: session.user.id,
            isLoggedIn: true,
            name: session.user.name,
            username: session.user.name,
            email: session.user.email,
            avatarUrl: session.user.avatarUrl,
            createdAt: session.user.createdAt ? new Date(session.user.createdAt).getTime() : Date.now(),
            loginDate: session.loginDate,
          };
        }
      }
    } catch (e) {
      console.warn('[AccountManager] Failed to update session:', e);
    }

    const users = this.loadUsers();
    const idx = users.findIndex((u) => u.id === cur.id);
    if (idx !== -1) {
      if (payload.name !== undefined && payload.name.trim()) {
        users[idx].name = payload.name.trim();
      }
      if (payload.avatarUrl !== undefined) {
        users[idx].avatarUrl = payload.avatarUrl;
      }
      this.saveUsers(users);
    }

    return {
      success: true,
      user: updatedUser,
    };
  }

  public logout(): boolean {
    try {
      if (fs.existsSync(this.sessionPath)) {
        fs.unlinkSync(this.sessionPath);
      }
      return true;
    } catch (e) {
      console.error('Logout error:', e);
      return false;
    }
  }

  public getSession(): { userId: string; token?: string; user?: any; loginDate: number } | null {
    try {
      if (fs.existsSync(this.sessionPath)) {
        const raw = fs.readFileSync(this.sessionPath, 'utf-8');
        return JSON.parse(raw);
      }
    } catch {}
    return null;
  }

  // --- Persistent Playlists Storage & Cloud Sync ---
  public async loadPlaylists(): Promise<any[]> {
    let localPlaylists: any[] = [];
    try {
      if (fs.existsSync(this.playlistsPath)) {
        const raw = fs.readFileSync(this.playlistsPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) localPlaylists = parsed;
      }
    } catch (e) {
      console.error('Failed to load persistent playlists:', e);
    }

    // Attempt cloud sync if logged in
    const session = this.getSession();
    if (session?.token) {
      try {
        const res = await fetch(`${this.backendUrl}/api/sync/all`, {
          headers: {
            'Authorization': `Bearer ${session.token}`,
          },
          signal: AbortSignal.timeout(3000),
        });
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.playlists) && data.playlists.length > 0) {
            // Merge cloud playlists with local playlists
            const merged = [...localPlaylists];
            for (const cp of data.playlists) {
              const idx = merged.findIndex((p) => p.id === cp.id || p.name === cp.name);
              if (idx === -1) {
                merged.push({
                  id: cp.id,
                  name: cp.name,
                  description: cp.description || '',
                  coverUrl: cp.coverUrl || '',
                  tracks: cp.tracks || [],
                  trackIds: (cp.tracks || []).map((t: any) => t.id),
                  createdAt: cp.updatedAt ? new Date(cp.updatedAt).getTime() : Date.now(),
                  updatedAt: cp.updatedAt ? new Date(cp.updatedAt).getTime() : Date.now(),
                });
              } else if (cp.tracks && cp.tracks.length >= (merged[idx].tracks?.length || 0)) {
                merged[idx].tracks = cp.tracks;
                merged[idx].trackIds = cp.tracks.map((t: any) => t.id);
                merged[idx].updatedAt = Date.now();
              }
            }
            localPlaylists = merged;
            fs.writeFileSync(this.playlistsPath, JSON.stringify(localPlaylists, null, 2), 'utf-8');
          } else if (localPlaylists.length > 0) {
            // If cloud has no playlists yet, push local ones to cloud!
            fetch(`${this.backendUrl}/api/sync/playlists`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.token}`,
              },
              body: JSON.stringify({ playlists: localPlaylists }),
              signal: AbortSignal.timeout(3000),
            }).catch(() => {});
          }
        }
      } catch (err) {
        console.warn('[AccountManager] Cloud playlist sync timeout, using local fallback.');
      }
    }

    return localPlaylists;
  }

  public async savePlaylists(playlists: any[]): Promise<boolean> {
    try {
      if (!Array.isArray(playlists)) return false;
      fs.writeFileSync(this.playlistsPath, JSON.stringify(playlists, null, 2), 'utf-8');

      // Sync to cloud backend if logged in
      const session = this.getSession();
      if (session?.token) {
        fetch(`${this.backendUrl}/api/sync/playlists`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.token}`,
          },
          body: JSON.stringify({ playlists }),
          signal: AbortSignal.timeout(3000),
        }).catch(() => {});
      }
      return true;
    } catch (e) {
      console.error('Failed to save persistent playlists:', e);
      return false;
    }
  }
}
