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

  public getCurrentUser(): UserProfileResponse | { isLoggedIn: false } {
    try {
      if (fs.existsSync(this.sessionPath)) {
        const raw = fs.readFileSync(this.sessionPath, 'utf-8');
        const session = JSON.parse(raw);
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

  public register(payload: {
    name: string;
    username: string;
    password: string;
    avatarUrl?: string;
    email?: string;
  }): { success: boolean; user?: UserProfileResponse; error?: string } {
    const trimmedUsername = payload.username.trim().toLowerCase();
    const trimmedName = payload.name.trim() || trimmedUsername;

    if (!trimmedUsername || trimmedUsername.length < 3) {
      return { success: false, error: 'Username minimal 3 karakter.' };
    }
    if (!payload.password || payload.password.length < 4) {
      return { success: false, error: 'Password minimal 4 karakter.' };
    }

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

    // Auto-login session
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

  public login(payload: {
    username: string;
    password: string;
  }): { success: boolean; user?: UserProfileResponse; error?: string } {
    const trimmedUsername = payload.username.trim().toLowerCase();
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

    const users = this.loadUsers();
    const idx = users.findIndex((u) => u.id === cur.id);
    if (idx === -1) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    if (payload.name !== undefined && payload.name.trim()) {
      users[idx].name = payload.name.trim();
    }
    if (payload.avatarUrl !== undefined) {
      users[idx].avatarUrl = payload.avatarUrl;
    }

    this.saveUsers(users);

    return {
      success: true,
      user: {
        id: users[idx].id,
        isLoggedIn: true,
        name: users[idx].name,
        username: users[idx].username,
        email: users[idx].email,
        avatarUrl: users[idx].avatarUrl,
        createdAt: users[idx].createdAt,
        loginDate: Date.now(),
      },
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

  // --- Persistent Playlists Storage ---
  public loadPlaylists(): any[] {
    try {
      if (fs.existsSync(this.playlistsPath)) {
        const raw = fs.readFileSync(this.playlistsPath, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Failed to load persistent playlists:', e);
    }
    return [];
  }

  public savePlaylists(playlists: any[]): boolean {
    try {
      if (!Array.isArray(playlists)) return false;
      fs.writeFileSync(this.playlistsPath, JSON.stringify(playlists, null, 2), 'utf-8');
      return true;
    } catch (e) {
      console.error('Failed to save persistent playlists:', e);
      return false;
    }
  }
}
