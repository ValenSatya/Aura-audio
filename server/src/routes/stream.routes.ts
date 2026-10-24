import { Router, Request, Response } from 'express';
import { YouTubeService } from '../services/youtube.service.js';

const router = Router();

// GET /api/stream/resolve/:id
router.get('/resolve/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const videoId = req.params.id;
    if (!videoId) {
      res.status(400).json({ error: 'Video ID wajib diisi.' });
      return;
    }

    const resolved = await YouTubeService.resolveAudio(videoId);
    res.json({
      videoId,
      ...resolved,
    });
  } catch (err: any) {
    console.error('[Stream] Resolve error:', err);
    res.status(500).json({ error: 'Gagal menyelesaikan audio stream.', details: err?.message });
  }
});

// GET /api/stream/proxy/:id
router.get('/proxy/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const videoId = req.params.id;
    if (!videoId) {
      res.status(400).json({ error: 'Video ID wajib diisi.' });
      return;
    }

    const rangeHeader = req.headers.range;
    await YouTubeService.proxyStream(videoId, rangeHeader, res);
  } catch (err: any) {
    console.error('[Stream] Proxy error:', err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Gagal streaming audio.', details: err?.message });
    }
  }
});

// POST /api/stream/prewarm
router.post('/prewarm', async (req: Request, res: Response): Promise<void> => {
  try {
    const { videoIds } = req.body;
    if (Array.isArray(videoIds)) {
      const validIds = videoIds.filter((id) => typeof id === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(id));
      YouTubeService.prewarmAudio(validIds.slice(0, 5));
    }
    res.json({ success: true });
  } catch (err: any) {
    res.json({ success: false, error: err?.message });
  }
});

export default router;
