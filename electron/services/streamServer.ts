import * as http from 'http';
import * as https from 'https';
import * as url from 'url';
import * as fs from 'fs';
import * as path from 'path';
import { YouTubeService } from './youtubeService';

const keepAliveHttpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 64,
  maxFreeSockets: 16,
  timeout: 15000,
});

const keepAliveHttpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: 60000,
  maxSockets: 64,
  maxFreeSockets: 16,
  timeout: 15000,
});

export class LocalStreamServer {
  private server: http.Server | null = null;
  private port: number = 45454;

  private proxyRemoteStream(
    remoteUrl: string,
    req: http.IncomingMessage,
    res: http.ServerResponse,
    onRetry?: () => void
  ) {
    const proxyHeaders: Record<string, string> = {
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      Referer: 'https://www.youtube.com/',
      Origin: 'https://www.youtube.com',
      Accept: '*/*',
    };
    if (req.headers.range) {
      proxyHeaders['Range'] = req.headers.range;
    }

    const isHttps = remoteUrl.startsWith('https');
    const clientProtocol = isHttps ? https : http;
    const agent = isHttps ? keepAliveHttpsAgent : keepAliveHttpAgent;

    const proxyReq = clientProtocol.request(
      remoteUrl,
      {
        method: req.method || 'GET',
        headers: proxyHeaders,
        agent,
      },
      (proxyRes) => {
        const statusCode = proxyRes.statusCode || 200;

        // If Google CDN returns 403 or 410 (stream link expired), trigger retry handler if available
        if ((statusCode === 403 || statusCode === 410) && onRetry) {
          proxyRes.resume();
          onRetry();
          return;
        }

        const responseHeaders: Record<string, any> = {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': 'Range, Content-Type',
          'Accept-Ranges': 'bytes',
        };

        if (proxyRes.headers['content-type']) {
          responseHeaders['Content-Type'] = proxyRes.headers['content-type'];
        } else {
          responseHeaders['Content-Type'] = 'audio/mp4';
        }

        if (proxyRes.headers['content-length']) {
          responseHeaders['Content-Length'] = proxyRes.headers['content-length'];
        }

        if (proxyRes.headers['content-range']) {
          responseHeaders['Content-Range'] = proxyRes.headers['content-range'];
        }

        res.writeHead(statusCode, responseHeaders);

        if (req.method === 'HEAD') {
          res.end();
          return;
        }

        proxyRes.pipe(res);
      }
    );

    proxyReq.on('error', (err) => {
      console.error('Audio stream proxy error:', err);
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'text/plain' });
        res.end('Proxy streaming error: ' + err.message);
      }
    });

    req.on('close', () => {
      proxyReq.destroy();
    });

    proxyReq.end();
  }

  public start(): Promise<number> {
    return new Promise((resolve) => {
      this.server = http.createServer(async (req, res) => {
        // Universal CORS
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Range, Content-Type');

        if (req.method === 'OPTIONS') {
          res.writeHead(204);
          res.end();
          return;
        }

        const parsedUrl = url.parse(req.url || '', true);
        const pathname = parsedUrl.pathname;

        try {
          if (pathname === '/stream-yt') {
            const targetUrl = parsedUrl.query.url as string;
            if (!targetUrl) {
              res.writeHead(400, { 'Content-Type': 'text/plain' });
              res.end('Missing url parameter');
              return;
            }

            try {
              const cookiesPath = path.join(process.env.APPDATA || '', 'aura-audio-app', 'yt_cookies.txt');
              const resolvedCookies = fs.existsSync(cookiesPath) ? cookiesPath : undefined;
              const directStreamUrl = await YouTubeService.resolveStreamUrl(
                targetUrl,
                resolvedCookies
              );

              if (!directStreamUrl) {
                throw new Error('Could not resolve stream URL for ' + targetUrl);
              }

              this.proxyRemoteStream(directStreamUrl, req, res, async () => {
                console.warn('Stream 403/expired, retrying with fresh URL for:', targetUrl);
                try {
                  YouTubeService.invalidateCache(targetUrl);
                  const freshUrl = await YouTubeService.resolveStreamUrl(targetUrl, resolvedCookies);
                  if (freshUrl) {
                    this.proxyRemoteStream(freshUrl, req, res);
                  }
                } catch (retryErr: any) {
                  if (!res.headersSent) {
                    res.writeHead(500, { 'Content-Type': 'text/plain' });
                    res.end('Stream retry failed: ' + retryErr.message);
                  }
                }
              });
            } catch (err: any) {
              console.error('YouTube stream resolver error:', err);
              if (!res.headersSent) {
                res.writeHead(500, { 'Content-Type': 'text/plain' });
                res.end('Failed to resolve YouTube audio: ' + err.message);
              }
            }
          } else if (pathname === '/stream-proxy') {
            const targetUrl = parsedUrl.query.url as string;
            if (!targetUrl) {
              res.writeHead(400, { 'Content-Type': 'text/plain' });
              res.end('Missing url parameter');
              return;
            }
            this.proxyRemoteStream(targetUrl, req, res);
          } else if (pathname === '/local-file') {
            // Serve local files with Range support
            const filePath = parsedUrl.query.path as string;
            if (!filePath || !fs.existsSync(filePath)) {
              res.writeHead(404, { 'Content-Type': 'text/plain' });
              res.end('File not found');
              return;
            }

            const stat = fs.statSync(filePath);
            const fileSize = stat.size;
            const range = req.headers.range;

            const ext = path.extname(filePath).toLowerCase();
            let contentType = 'audio/mpeg';
            if (ext === '.wav') contentType = 'audio/wav';
            else if (ext === '.ogg') contentType = 'audio/ogg';
            else if (ext === '.flac') contentType = 'audio/flac';
            else if (ext === '.m4a' || ext === '.mp4') contentType = 'audio/mp4';
            else if (ext === '.webm') contentType = 'audio/webm';

            if (range) {
              const parts = range.replace(/bytes=/, '').split('-');
              const start = parseInt(parts[0], 10);
              const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
              const chunksize = end - start + 1;
              const file = fs.createReadStream(filePath, { start, end });

              res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunksize,
                'Content-Type': contentType,
              });

              file.pipe(res);
            } else {
              res.writeHead(200, {
                'Content-Length': fileSize,
                'Content-Type': contentType,
                'Accept-Ranges': 'bytes',
              });

              fs.createReadStream(filePath).pipe(res);
            }
          } else {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
          }
        } catch (error: any) {
          console.error('Stream server error:', error);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end('Internal Server Error: ' + error.message);
          }
        }
      });

      const tryListen = () => {
        this.server?.listen(this.port, '0.0.0.0');
      };

      this.server.on('listening', () => {
        console.log(`Audio stream proxy server running on http://0.0.0.0:${this.port}`);
        resolve(this.port);
      });

      this.server.on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          console.warn(`Port ${this.port} in use, trying ${this.port + 1}...`);
          this.port++;
          tryListen();
        } else {
          console.error('Stream server failed to start:', err);
        }
      });

      tryListen();
    });
  }

  public getPort(): number {
    return this.port;
  }

  public getHttpServer(): http.Server | null {
    return this.server;
  }

  public stop(): void {
    if (this.server) {
      this.server.close();
    }
  }
}
