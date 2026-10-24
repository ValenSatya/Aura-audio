import { Router, Request, Response } from 'express';
import { YouTubeService } from '../services/youtube.service.js';

const router = Router();

// GET /api/search?q=... (Songs search)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.json([]);
      return;
    }

    const results = await YouTubeService.search(query);
    res.json(results);
  } catch (err: any) {
    console.error('[Search Songs] error:', err);
    res.status(500).json({ error: 'Gagal melakukan pencarian musik.', details: err?.message });
  }
});

// GET /api/search/albums?q=... (Real YouTube Music Albums)
router.get('/albums', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.json([]);
      return;
    }

    const albums = await YouTubeService.searchAlbums(query);
    res.json(albums);
  } catch (err: any) {
    console.error('[Search Albums] error:', err);
    res.status(500).json({ error: 'Gagal mencari album.', details: err?.message });
  }
});

// GET /api/search/artists?q=... (Real YouTube Music Artists)
router.get('/artists', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.json([]);
      return;
    }

    const artists = await YouTubeService.searchArtists(query);
    res.json(artists);
  } catch (err: any) {
    console.error('[Search Artists] error:', err);
    res.status(500).json({ error: 'Gagal mencari artis.', details: err?.message });
  }
});

// GET /api/search/all?q=... (Unified: Songs, Real Albums, Artists)
router.get('/all', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = (req.query.q as string) || '';
    if (!query.trim()) {
      res.json({ songs: [], albums: [], artists: [] });
      return;
    }

    const [songs, albums, artists] = await Promise.all([
      YouTubeService.search(query),
      YouTubeService.searchAlbums(query),
      YouTubeService.searchArtists(query),
    ]);

    res.json({ songs, albums, artists });
  } catch (err: any) {
    console.error('[Search All] error:', err);
    res.status(500).json({ error: 'Gagal mencari konten musik.', details: err?.message });
  }
});

// GET /api/search/album/:id (Real Album Details & Tracklist)
router.get('/album/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Album ID diperlukan' });
      return;
    }

    const albumDetail = await YouTubeService.getAlbum(id);
    res.json(albumDetail);
  } catch (err: any) {
    console.error(`[Album Detail] error for ${req.params.id}:`, err);
    res.status(500).json({ error: 'Gagal mengambil detail album.', details: err?.message });
  }
});

// GET /api/search/artist/:id (Real Artist Details, Top Songs, Albums, Videos)
router.get('/artist/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    if (!id) {
      res.status(400).json({ error: 'Artist ID diperlukan' });
      return;
    }

    const artistDetail = await YouTubeService.getArtist(id);
    res.json(artistDetail);
  } catch (err: any) {
    console.error(`[Artist Detail] error for ${req.params.id}:`, err);
    res.status(500).json({ error: 'Gagal mengambil detail artis.', details: err?.message });
  }
});

// GET /api/search/home-feed (Popular Hits, Real Studio Albums, Real Music Videos)
router.get('/home-feed', async (_req: Request, res: Response): Promise<void> => {
  try {
    const feed = await YouTubeService.getHomeFeed();
    res.json(feed);
  } catch (err: any) {
    console.error('[Home Feed] error:', err);
    res.status(500).json({ error: 'Gagal memuat home feed.', details: err?.message });
  }
});

// GET /api/search/videos (Official Music Videos)
router.get('/videos', async (_req: Request, res: Response): Promise<void> => {
  try {
    const videos = await YouTubeService.getMusicVideos();
    res.json(videos);
  } catch (err: any) {
    console.error('[Videos] error:', err);
    res.status(500).json({ error: 'Gagal memuat music videos.', details: err?.message });
  }
});

export default router;
