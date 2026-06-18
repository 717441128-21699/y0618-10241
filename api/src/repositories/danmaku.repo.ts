import { prepareAll, prepareRun, query } from '../database.js';
import type { Danmaku } from '../../../shared/types.js';

interface DanmakuRow {
  id: number;
  video_id: number;
  user_id: number;
  username: string;
  time: number;
  content: string;
  color: string;
  font_size: 'small' | 'medium' | 'large';
  created_at: string;
}

function mapRow(row: DanmakuRow): Danmaku {
  return {
    id: row.id,
    videoId: row.video_id,
    userId: row.user_id,
    username: row.username,
    time: row.time,
    content: row.content,
    color: row.color,
    fontSize: row.font_size,
    createdAt: row.created_at,
  };
}

export function findDanmakuByVideo(videoId: number): Danmaku[] {
  const rows = prepareAll<DanmakuRow>(
    'SELECT * FROM danmaku WHERE video_id = ? ORDER BY time ASC',
    [videoId]
  );
  return rows.map(mapRow);
}

export function createDanmaku(params: {
  videoId: number;
  userId: number;
  username: string;
  time: number;
  content: string;
  color: string;
  fontSize: 'small' | 'medium' | 'large';
}): Danmaku {
  const result = prepareRun(
    `INSERT INTO danmaku (video_id, user_id, username, time, content, color, font_size)
     VALUES ($videoId, $userId, $username, $time, $content, $color, $fontSize)`,
    {
      $videoId: params.videoId,
      $userId: params.userId,
      $username: params.username,
      $time: params.time,
      $content: params.content,
      $color: params.color,
      $fontSize: params.fontSize,
    }
  );
  const res = query('SELECT * FROM danmaku WHERE id = ?', [result.lastInsertRowid]);
  const rows = prepareAll<DanmakuRow>('SELECT * FROM danmaku WHERE id = ?', [result.lastInsertRowid]);
  if (rows.length > 0) return mapRow(rows[0]);
  void res;
  return {
    id: result.lastInsertRowid,
    videoId: params.videoId,
    userId: params.userId,
    username: params.username,
    time: params.time,
    content: params.content,
    color: params.color,
    fontSize: params.fontSize,
    createdAt: new Date().toISOString(),
  };
}
