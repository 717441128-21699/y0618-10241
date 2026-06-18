import { prepareGet, prepareRun } from '../database.js';
import { generatePlayToken } from '../middleware/auth.js';
import type { PlayAuthToken, PurchaseRequest } from '../../../shared/types.js';
import { findVideoById } from '../repositories/video.repo.js';
import { broadcastMessage } from '../websocket.js';

export async function purchaseVideo(userId: number, req: PurchaseRequest): Promise<PlayAuthToken> {
  const video = findVideoById(req.videoId);
  if (!video) throw new Error('视频不存在');
  if (!video.isPaid) throw new Error('该视频无需付费');

  const existing = prepareGet<{ play_token: string; token_expires_at: string }>(
    'SELECT play_token, token_expires_at FROM purchases WHERE user_id = ? AND video_id = ? AND status = ? ORDER BY created_at DESC LIMIT 1',
    [userId, req.videoId, 'completed']
  );

  if (existing) {
    const exp = new Date(existing.token_expires_at).getTime();
    if (exp > Date.now() + 60 * 60 * 1000) {
      return { token: existing.play_token, videoId: req.videoId, expiresAt: exp };
    }
  }

  const { token, expiresAt } = generatePlayToken(req.videoId, userId, 24 * 60 * 60 * 1000);

  await new Promise(r => setTimeout(r, 800));

  prepareRun(
    `INSERT INTO purchases (user_id, video_id, amount, status, play_token, token_expires_at)
     VALUES ($userId, $videoId, $amount, 'completed', $token, $expiresAt)`,
    {
      $userId: userId,
      $videoId: req.videoId,
      $amount: video.price,
      $token: token,
      $expiresAt: new Date(expiresAt).toISOString(),
    }
  );

  const result: PlayAuthToken = { token, videoId: req.videoId, expiresAt };

  broadcastMessage({
    type: 'purchase_success',
    payload: result,
  });

  return result;
}

export function hasValidPlayToken(userId: number, videoId: number): PlayAuthToken | null {
  const row = prepareGet<{ play_token: string; token_expires_at: string }>(
    `SELECT play_token, token_expires_at FROM purchases 
     WHERE user_id = ? AND video_id = ? AND status = 'completed'
     ORDER BY created_at DESC LIMIT 1`,
    [userId, videoId]
  );
  if (!row) return null;
  const exp = new Date(row.token_expires_at).getTime();
  if (exp <= Date.now()) return null;
  return { token: row.play_token, videoId, expiresAt: exp };
}
