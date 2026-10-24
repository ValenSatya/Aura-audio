import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'auraaudio_jwt_secret_key_2026_super_secure_cihuy';

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    const username = (req.body.username || '').toLowerCase().trim();
    const name = (req.body.name || req.body.username || '').trim();
    let email = (req.body.email || '').toLowerCase().trim();
    const avatarUrl = req.body.avatarUrl || null;

    if (!password || password.length < 4) {
      res.status(400).json({ error: 'Password minimal 4 karakter.' });
      return;
    }

    if (!name && !username) {
      res.status(400).json({ error: 'Nama atau username wajib diisi.' });
      return;
    }

    if (!email) {
      // Auto-fallback email from username or name
      const cleanSlug = (username || name).toLowerCase().replace(/[^a-z0-9_]/g, '');
      email = `${cleanSlug || 'user'}@aura.app`;
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { name: { equals: name } }
        ]
      },
    });

    if (existingUser) {
      res.status(409).json({ error: 'Email atau username sudah terdaftar. Silakan login.' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name,
        avatarUrl,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '90d',
    });

    res.status(201).json({
      token,
      user,
    });
  } catch (err: any) {
    console.error('[Auth] Register error:', err);
    res.status(500).json({ error: 'Gagal mendaftar akun.', details: err?.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    const identifier = (req.body.email || req.body.username || '').toLowerCase().trim();

    if (!identifier || !password) {
      res.status(400).json({ error: 'Email/Username dan password wajib diisi.' });
      return;
    }

    // Try finding by email or matching name
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { email: identifier },
          { email: `${identifier}@aura.app` },
          { email: `${identifier.replace(/[^a-z0-9_]/g, '')}@aura.app` },
        ],
      },
    });

    let user = users[0];

    // If not found by direct email, search all users for matching name (case-insensitive)
    if (!user) {
      const allUsers = await prisma.user.findMany();
      user = allUsers.find(
        (u) =>
          u.name.toLowerCase() === identifier ||
          u.email.toLowerCase() === identifier ||
          u.email.toLowerCase().split('@')[0] === identifier ||
          u.email.toLowerCase().split('@')[0] === identifier.replace(/[^a-z0-9_]/g, '')
      ) as any;
    }

    if (!user) {
      res.status(401).json({ error: 'Email/Username atau password salah.' });
      return;
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      res.status(401).json({ error: 'Email/Username atau password salah.' });
      return;
    }

    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: '90d',
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
    });
  } catch (err: any) {
    console.error('[Auth] Login error:', err);
    res.status(500).json({ error: 'Gagal melakukan login.', details: err?.message });
  }
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'Sesi tidak valid.' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            playlists: true,
            favorites: true,
            history: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User tidak ditemukan.' });
      return;
    }

    res.json({ user });
  } catch (err: any) {
    console.error('[Auth] Me error:', err);
    res.status(500).json({ error: 'Gagal memuat data profil.' });
  }
});

export default router;
