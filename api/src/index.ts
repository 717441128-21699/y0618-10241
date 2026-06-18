import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { createServer } from 'http';

import { initDatabase } from './database.js';
import { initWebSocketServer } from './websocket.js';
import authRouter from './controllers/auth.controller.js';
import videoRouter from './controllers/video.controller.js';
import { verifyPlayToken } from './middleware/auth.js';
import * as videoRepo from './repositories/video.repo.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function start() {
  await initDatabase();

  const app = express();
  const server = createServer(app);
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

  initWebSocketServer(server);

  app.use(cors({ origin: true, credentials: true }));
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, ts: Date.now(), env: process.env.NODE_ENV || 'development' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/videos', videoRouter);

  app.get('/api/stream/:id/:quality.m3u8', (req, res) => {
    const id = parseInt(req.params.id, 10);
    const quality = req.params.quality;
    const video = videoRepo.findVideoById(id);
    if (!video) return res.status(404).json({ error: '视频不存在' });

    if (video.isPaid) {
      const authHeader = req.headers['x-play-token'] as string | undefined;
      if (authHeader) {
        const result = verifyPlayToken(authHeader);
        if (result.valid && result.videoId === id) {
          const demoSrc: Record<string, string> = {
            '360p': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            '720p': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
            '1080p': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
          };
          const target = demoSrc[quality] || demoSrc['720p'];
          return res.json({ source: target });
        }
      }

      if (quality === '360p') {
        const demoSrc: Record<string, string> = {
          '360p': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
        };
        return res.json({ source: demoSrc['360p'] });
      }

      return res.status(403).json({ error: '需要购买该视频才能观看完整内容' });
    }

    const demoSrc: Record<string, string> = {
      '360p': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      '720p': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
      '1080p': 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8',
    };
    const target = demoSrc[quality] || demoSrc['720p'];
    res.json({ source: target });
  });

  app.use('/api/*', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  const distDir = path.join(__dirname, '..', '..', 'dist');
  app.use(express.static(distDir));
  app.get('*', (_req, res) => {
    const indexPath = path.join(distDir, 'index.html');
    if (fs.existsSync(indexPath)) res.sendFile(indexPath);
    else res.status(404).send('Not found');
  });

  server.listen(PORT, () => {
    console.log(`\n🚀 CloudStream API Server running on http://localhost:${PORT}`);
    console.log(`   WebSocket: ws://localhost:${PORT}/ws\n`);
  });
}

start().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export {};
