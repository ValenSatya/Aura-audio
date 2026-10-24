import { Router, Response } from 'express';
import { prisma } from '../prisma.js';
import { requireAuth, AuthRequest } from '../middlewares/auth.middleware.js';

const router = Router();

// All sync routes require valid JWT auth
router.use(requireAuth);

// GET /api/sync/all - Fetch all user playlists, favorites, and recent history
router.get('/all', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const [playlists, favorites, history] = await Promise.all([
      prisma.playlist.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
      }),
      prisma.favorite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.playHistory.findMany({
        where: { userId },
        orderBy: { playedAt: 'desc' },
        take: 50,
      }),
    ]);

    const parsedPlaylists = playlists.map((p) => {
      let tracks = [];
      try {
        tracks = JSON.parse(p.tracksJson);
      } catch {}
      return {
        id: p.id,
        name: p.name,
        description: p.description,
        coverUrl: p.coverUrl,
        tracks,
        updatedAt: p.updatedAt,
      };
    });

    const parsedFavorites = favorites.map((f) => {
      try {
        return JSON.parse(f.trackJson);
      } catch {
        return { id: f.trackId };
      }
    });

    const parsedHistory = history.map((h) => {
      try {
        return JSON.parse(h.trackJson);
      } catch {
        return { id: h.trackId };
      }
    });

    res.json({
      playlists: parsedPlaylists,
      favorites: parsedFavorites,
      history: parsedHistory,
    });
  } catch (err: any) {
    console.error('[Sync] all error:', err);
    res.status(500).json({ error: 'Gagal memuat sinkronisasi cloud.', details: err?.message });
  }
});

// POST /api/sync/playlists - Save or update playlists
router.post('/playlists', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { playlists } = req.body;

    if (!Array.isArray(playlists)) {
      res.status(400).json({ error: 'Payload playlists harus berupa array.' });
      return;
    }

    const savedResults = [];

    for (const pl of playlists) {
      if (!pl.name) continue;

      const tracksJson = JSON.stringify(pl.tracks || []);
      const plId = pl.id || undefined;

      if (plId) {
        const existing = await prisma.playlist.findFirst({
          where: { id: plId, userId },
        });

        if (existing) {
          const updated = await prisma.playlist.update({
            where: { id: plId },
            data: {
              name: pl.name,
              description: pl.description || null,
              coverUrl: pl.coverUrl || null,
              tracksJson,
            },
          });
          savedResults.push(updated);
          continue;
        }
      }

      const created = await prisma.playlist.create({
        data: {
          userId,
          name: pl.name,
          description: pl.description || null,
          coverUrl: pl.coverUrl || null,
          tracksJson,
        },
      });
      savedResults.push(created);
    }

    res.json({
      message: `Berhasil menyinkronkan ${savedResults.length} playlist.`,
      playlists: savedResults,
    });
  } catch (err: any) {
    console.error('[Sync] playlists error:', err);
    res.status(500).json({ error: 'Gagal menyinkronkan playlist.', details: err?.message });
  }
});

// POST /api/sync/favorites - Add or update a favorite track
router.post('/favorites', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { track } = req.body;

    if (!track || !track.id) {
      res.status(400).json({ error: 'Data track tidak valid.' });
      return;
    }

    const trackJson = JSON.stringify(track);

    const favorite = await prisma.favorite.upsert({
      where: {
        userId_trackId: {
          userId,
          trackId: track.id,
        },
      },
      update: {
        trackJson,
      },
      create: {
        userId,
        trackId: track.id,
        trackJson,
      },
    });

    res.json({ message: 'Lagu ditambahkan ke favorit.', favorite });
  } catch (err: any) {
    console.error('[Sync] add favorite error:', err);
    res.status(500).json({ error: 'Gagal menyimpan lagu favorit.', details: err?.message });
  }
});

// DELETE /api/sync/favorites/:trackId - Remove a favorite track
router.delete('/favorites/:trackId', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const trackId = req.params.trackId;

    await prisma.favorite.deleteMany({
      where: {
        userId,
        trackId,
      },
    });

    res.json({ message: 'Lagu dihapus dari favorit.' });
  } catch (err: any) {
    console.error('[Sync] delete favorite error:', err);
    res.status(500).json({ error: 'Gagal menghapus lagu favorit.' });
  }
});

// POST /api/sync/history - Record track playback
router.post('/history', async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { track } = req.body;

    if (!track || !track.id) {
      res.status(400).json({ error: 'Data track tidak valid.' });
      return;
    }

    const trackJson = JSON.stringify(track);

    await prisma.playHistory.create({
      data: {
        userId,
        trackId: track.id,
        trackJson,
      },
    });

    res.json({ message: 'Riwayat pemutaran dicatat.' });
  } catch (err: any) {
    console.error('[Sync] record history error:', err);
    res.status(500).json({ error: 'Gagal mencatat riwayat pemutaran.' });
  }
});

export default router;
