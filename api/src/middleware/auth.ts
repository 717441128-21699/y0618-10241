import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'cloudstream-jwt-secret-key-2024';

export interface AuthenticatedRequest extends Request {
  userId?: number;
  user?: { id: number; username: string };
}

export function authMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: '未提供认证令牌' });
    return;
  }
  try {
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
    req.userId = decoded.id;
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ error: '认证令牌无效或已过期' });
  }
}

export function optionalAuthMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.slice(7);
      const decoded = jwt.verify(token, JWT_SECRET) as { id: number; username: string };
      req.userId = decoded.id;
      req.user = decoded;
    } catch { /* ignore */ }
  }
  next();
}

export function generateAccessToken(user: { id: number; username: string }): string {
  return jwt.sign(user, JWT_SECRET, { expiresIn: '7d' });
}

export function generatePlayToken(videoId: number, userId: number, ttlMs = 24 * 60 * 60 * 1000): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + ttlMs;
  const token = jwt.sign(
    { type: 'play', videoId, userId, exp: Math.floor(expiresAt / 1000) },
    JWT_SECRET
  );
  return { token, expiresAt };
}

export function verifyPlayToken(token: string): { valid: boolean; videoId?: number; userId?: number; exp?: number } {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { type: string; videoId: number; userId: number; exp: number };
    if (decoded.type !== 'play') return { valid: false };
    return { valid: true, videoId: decoded.videoId, userId: decoded.userId, exp: decoded.exp };
  } catch {
    return { valid: false };
  }
}
