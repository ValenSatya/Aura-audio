import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import streamRoutes from './routes/stream.routes.js';
import searchRoutes from './routes/search.routes.js';
import syncRoutes from './routes/sync.routes.js';
import { YouTubeService } from './services/youtube.service.js';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Range'],
    exposedHeaders: ['Content-Range', 'Content-Length', 'Accept-Ranges'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Root Index & Health Endpoints
app.get('/', (req: Request, res: Response) => {
  // If requesting JSON or curl
  if (req.headers.accept?.includes('application/json')) {
    res.json({
      service: 'AuraAudio Dedicated Backend Server',
      status: 'online',
      version: '1.0.0',
      client_app: 'http://localhost:5173',
      endpoints: {
        health: '/api/health',
        search: '/api/search?q=:query',
        stream_resolve: '/api/stream/resolve/:id',
        stream_proxy: '/api/stream/proxy/:id',
        auth_register: 'POST /api/auth/register',
        auth_login: 'POST /api/auth/login',
        sync_all: 'GET /api/sync/all',
      },
    });
    return;
  }

  // HTML Dashboard for Browser
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AuraAudio Backend Server</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body { background-color: #000000; color: #FFFFFF; font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif; }
  </style>
</head>
<body class="min-h-screen p-5 md:p-12 flex flex-col items-center justify-center bg-black selection:bg-rose-500 selection:text-white">
  <div class="w-full max-w-2xl bg-[#121214] border border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl">
    <!-- Header -->
    <div class="flex items-center justify-between pb-6 border-b border-white/10">
      <div class="flex items-center gap-3.5">
        <div class="w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#FA2D48] to-[#FF375F] flex items-center justify-center text-white font-bold text-2xl shadow-[0_0_20px_rgba(250,45,72,0.4)]">
          ♫
        </div>
        <div>
          <h1 class="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            AuraAudio Server
            <span class="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white/80">v1.0.0</span>
          </h1>
          <p class="text-xs text-neutral-400 mt-0.5">Dedicated Backend API & High-Speed Audio Proxy</p>
        </div>
      </div>
      <div class="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-semibold shadow-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
        Online (Port 4000)
      </div>
    </div>

    <!-- Quick Stats -->
    <div class="grid grid-cols-3 gap-3 my-6">
      <div class="p-3.5 rounded-xl bg-[#1c1c1e] border border-white/5">
        <p class="text-[11px] text-neutral-400 uppercase font-semibold">Database</p>
        <p class="text-sm font-bold text-white mt-0.5">SQLite (aura.db)</p>
      </div>
      <div class="p-3.5 rounded-xl bg-[#1c1c1e] border border-white/5">
        <p class="text-[11px] text-neutral-400 uppercase font-semibold">Audio Proxy</p>
        <p class="text-sm font-bold text-emerald-400 mt-0.5">HTTP 206 (CORS 0)</p>
      </div>
      <div class="p-3.5 rounded-xl bg-[#1c1c1e] border border-white/5">
        <p class="text-[11px] text-neutral-400 uppercase font-semibold">Auth Engine</p>
        <p class="text-sm font-bold text-white mt-0.5">JWT + Bcrypt</p>
      </div>
    </div>

    <!-- API Routes List -->
    <div class="space-y-2 mb-6">
      <h2 class="text-xs font-semibold uppercase text-neutral-400 tracking-wider mb-2">Endpoint Live Test</h2>
      <a href="/api/health" target="_blank" class="flex items-center justify-between p-3.5 rounded-xl bg-[#1c1c1e]/70 hover:bg-[#1c1c1e] border border-white/5 transition group">
        <div class="flex items-center gap-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">GET</span>
          <span class="text-sm font-mono text-neutral-200">/api/health</span>
        </div>
        <span class="text-xs text-neutral-400 group-hover:text-white transition">Health check status →</span>
      </a>
      <a href="/api/search?q=Megan+Moroney" target="_blank" class="flex items-center justify-between p-3.5 rounded-xl bg-[#1c1c1e]/70 hover:bg-[#1c1c1e] border border-white/5 transition group">
        <div class="flex items-center gap-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">GET</span>
          <span class="text-sm font-mono text-neutral-200">/api/search?q=Megan+Moroney</span>
        </div>
        <span class="text-xs text-neutral-400 group-hover:text-white transition">Search YouTube Music →</span>
      </a>
      <a href="/api/stream/resolve/LS3Zp3yn9nY" target="_blank" class="flex items-center justify-between p-3.5 rounded-xl bg-[#1c1c1e]/70 hover:bg-[#1c1c1e] border border-white/5 transition group">
        <div class="flex items-center gap-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">GET</span>
          <span class="text-sm font-mono text-neutral-200">/api/stream/resolve/LS3Zp3yn9nY</span>
        </div>
        <span class="text-xs text-neutral-400 group-hover:text-white transition">Resolve direct audio link →</span>
      </a>
      <a href="/api/stream/proxy/LS3Zp3yn9nY" target="_blank" class="flex items-center justify-between p-3.5 rounded-xl bg-[#1c1c1e]/70 hover:bg-[#1c1c1e] border border-white/5 transition group">
        <div class="flex items-center gap-3">
          <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">GET</span>
          <span class="text-sm font-mono text-neutral-200">/api/stream/proxy/LS3Zp3yn9nY</span>
        </div>
        <span class="text-xs text-neutral-400 group-hover:text-white transition">Stream proxy with range seek →</span>
      </a>
    </div>

    <!-- Client Link & Footer -->
    <div class="pt-5 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-400 gap-2">
      <span class="flex items-center gap-1.5">
        Aplikasi Mobile: 
        <a href="http://localhost:5173" target="_blank" class="text-rose-400 hover:text-rose-300 font-semibold underline underline-offset-2">
          http://localhost:5173 ↗
        </a>
      </span>
      <span class="text-neutral-500 font-medium">Khusus Cihuy • AuraAudio Suite</span>
    </div>
  </div>
</body>
</html>`);
});

// Health Check Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'AuraAudio Dedicated Backend Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/stream', streamRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/sync', syncRoutes);

// Direct album & artist route alias
app.get('/api/album/:id', (req: Request, res: Response) => {
  res.redirect(307, `/api/search/album/${req.params.id}`);
});
app.get('/api/artist/:id', (req: Request, res: Response) => {
  res.redirect(307, `/api/search/artist/${req.params.id}`);
});

// Global 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} tidak ditemukan.` });
});

// Start Server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`[AuraAudio Server] Running on http://0.0.0.0:${PORT}`);
  console.log(`[AuraAudio Server] Health check: http://localhost:${PORT}/api/health`);
  // Warm up YouTube in-memory streaming clients in background
  YouTubeService.getStreamClient().catch(() => {});
  YouTubeService.getSearchClient().catch(() => {});
});

export default app;
