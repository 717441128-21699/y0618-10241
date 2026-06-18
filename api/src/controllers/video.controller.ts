import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import * as videoRepo from '../repositories/video.repo.js';
import * as progressRepo from '../repositories/progress.repo.js';
import * as danmakuRepo from '../repositories/danmaku.repo.js';
import type { AuthenticatedRequest, optionalAuthMiddleware } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { submitTranscode, getTaskProgress } from '../services/transcode.service.js';
import { purchaseVideo, hasValidPlayToken } from '../services/payment.service.js';
import type { Video, VideoCategory } from '../../../shared/types.js';
import { broadcastMessage } from '../websocket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 2 * 1024 * 1024 * 1024 } });

const router = Router();

router.get('/', (_req, res) => {
  const { category, search, limit, offset } = _req.query;
  const videos = videoRepo.findAllVideos({
    category: category as VideoCategory | undefined,
    search: search as string | undefined,
    limit: limit ? parseInt(limit as string, 10) : undefined,
    offset: offset ? parseInt(offset as string, 10) : undefined,
  });
  res.json({ videos, total: videos.length });
});

router.get('/featured', (_req, res) => {
  const all = videoRepo.findAllVideos({ limit: 8 });
  const featured = all.slice(0, 3);
  res.json({ featured, recommended: all.slice(3) });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const video = videoRepo.findVideoById(id);
  if (!video) return res.status(404).json({ error: '视频不存在' });
  videoRepo.incrementViewCount(id);
  const updated = videoRepo.findVideoById(id)!;
  const all = videoRepo.findAllVideos({ limit: 14 });
  const related = all.filter((v) => v.id !== id).slice(0, 12);
  res.json({ video: updated, related });
});

router.post('/upload', authMiddleware, upload.single('video'), async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: '未授权' });
    if (!req.file) return res.status(400).json({ error: '请上传视频文件' });

    const title = req.body.title as string;
    if (!title) return res.status(400).json({ error: '请输入视频标题' });

    const duration = parseInt(req.body.duration || '120', 10);
    const coverUrl = (req.body.coverUrl as string) ||
      `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(title)}&image_size=landscape_16_9`;

    const video = videoRepo.createVideo({
      title,
      description: (req.body.description as string) || '',
      coverUrl,
      filePath: req.file.path,
      authorId: req.userId,
      category: (req.body.category as VideoCategory) || 'other',
      duration,
      isPaid: req.body.isPaid === 'true' || req.body.isPaid === true,
      price: parseFloat(req.body.price || '0'),
    });

    submitTranscode(video.id, duration);
    res.status(201).json({ video, message: '视频已提交转码' });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id/play', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const video = videoRepo.findVideoById(id);
  if (!video) return res.status(404).json({ error: '视频不存在' });

  if (video.isPaid) {
    const authHeader = req.headers['x-play-token'] as string | undefined;
    if (!authHeader) {
      const userId = (req as AuthenticatedRequest).userId;
      if (userId) {
        const existing = hasValidPlayToken(userId, id);
        if (existing) {
          return res.json({
            playlists: video.hlsPlaylists,
            duration: video.duration,
            playToken: existing,
            previewAllowed: false,
          });
        }
      }
      return res.json({
        playlists: video.hlsPlaylists,
        duration: video.duration,
        previewAllowed: true,
        previewSeconds: 60,
      });
    }
  }

  res.json({
    playlists: video.hlsPlaylists,
    duration: video.duration,
    previewAllowed: false,
  });
});

router.post('/:id/purchase', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.userId) return res.status(401).json({ error: '未授权' });
    const id = parseInt(req.params.id, 10);
    const result = await purchaseVideo(req.userId, {
      videoId: id,
      paymentMethod: req.body.paymentMethod || 'card',
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get('/:id/progress', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: '未授权' });
  const id = parseInt(req.params.id, 10);
  const progress = progressRepo.findProgress(req.userId, id);
  res.json({ progress });
});

router.post('/:id/progress', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: '未授权' });
  const id = parseInt(req.params.id, 10);
  const { position, duration } = req.body;
  progressRepo.saveProgress(req.userId, id, position || 0, duration || 0);
  res.json({ ok: true });
});

router.get('/:id/transcode-progress', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const progress = getTaskProgress(id);
  if (!progress) {
    const video = videoRepo.findVideoById(id);
    if (video && video.status === 'ready') {
      return res.json({
        videoId: id, stage: 'done', stageProgress: 100, overallProgress: 100,
        completedResolutions: ['360p', '720p', '1080p'], message: '转码完成！',
      });
    }
    return res.status(404).json({ error: '未找到转码任务' });
  }
  res.json(progress);
});

router.post('/:id/like', (req, res) => {
  const id = parseInt(req.params.id, 10);
  try {
    const count = videoRepo.likeVideo(id);
    res.json({ likeCount: count });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/:id/danmaku', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const list = danmakuRepo.findDanmakuByVideo(id);
  res.json({ danmaku: list });
});

router.post('/:id/danmaku', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.userId || !req.user) return res.status(401).json({ error: '未授权' });
  const id = parseInt(req.params.id, 10);
  try {
    const danmaku = danmakuRepo.createDanmaku({
      videoId: id,
      userId: req.userId,
      username: req.user.username,
      time: req.body.time || 0,
      content: req.body.content || '',
      color: req.body.color || '#FFFFFF',
      fontSize: req.body.fontSize || 'medium',
    });
    broadcastMessage({ type: 'danmaku_new', payload: danmaku });
    res.status(201).json({ danmaku });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
