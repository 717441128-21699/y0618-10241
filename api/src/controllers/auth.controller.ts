import { Router } from 'express';
import * as authService from '../services/auth.service.js';
import type { AuthenticatedRequest } from '../middleware/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import * as userRepo from '../repositories/user.repo.js';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const result = await authService.login(req.body);
    res.json(result);
  } catch (err) {
    res.status(401).json({ error: (err as Error).message });
  }
});

router.post('/register', async (req, res) => {
  try {
    const result = await authService.register(req.body);
    res.status(201).json(result);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

router.get('/me', authMiddleware, (req: AuthenticatedRequest, res) => {
  if (!req.userId) return res.status(401).json({ error: '未授权' });
  const user = userRepo.findUserById(req.userId);
  if (!user) return res.status(404).json({ error: '用户不存在' });
  res.json({ user });
});

export default router;
