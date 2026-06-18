import { prepareGet, prepareRun } from '../database.js';
import type { PlayProgress } from '../../../shared/types.js';

interface ProgressRow {
  id: number;
  video_id: number;
  user_id: number;
  position: number;
  duration: number;
  updated_at: string;
}

export function findProgress(userId: number, videoId: number): PlayProgress | null {
  const row = prepareGet<ProgressRow>(
    'SELECT * FROM play_progress WHERE user_id = ? AND video_id = ?',
    [userId, videoId]
  );
  if (!row) return null;
  return {
    videoId: row.video_id,
    userId: row.user_id,
    position: row.position,
    duration: row.duration,
    updatedAt: row.updated_at,
  };
}

export function saveProgress(userId: number, videoId: number, position: number, duration: number): void {
  prepareRun(
    `INSERT INTO play_progress (user_id, video_id, position, duration, updated_at)
     VALUES ($userId, $videoId, $position, $duration, CURRENT_TIMESTAMP)
     ON CONFLICT(user_id, video_id) DO UPDATE SET
       position = excluded.position,
       duration = excluded.duration,
       updated_at = CURRENT_TIMESTAMP`,
    { $userId: userId, $videoId: videoId, $position: position, $duration: duration }
  );
}
