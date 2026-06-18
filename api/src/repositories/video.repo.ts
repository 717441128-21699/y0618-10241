import { prepareAll, prepareGet, prepareRun, query } from '../database.js';
import type { Video, VideoCategory, VideoStatus } from '../../../shared/types.js';
import { findUserById } from './user.repo.js';

interface VideoRow {
  id: number;
  title: string;
  description: string;
  cover_url: string;
  file_path: string;
  author_id: number;
  category: VideoCategory;
  duration: number;
  view_count: number;
  like_count: number;
  is_paid: number;
  price: number;
  status: VideoStatus;
  hls_360p: string;
  hls_720p: string;
  hls_1080p: string;
  created_at: string;
}

function mapVideoRow(row: VideoRow): Video {
  const author = findUserById(row.author_id) || {
    id: row.author_id, username: 'unknown', email: '', avatar: '', createdAt: '',
  };
  const hlsReady = row.status === 'ready' && row.hls_360p;
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    coverUrl: row.cover_url,
    author,
    category: row.category,
    duration: row.duration,
    viewCount: row.view_count,
    likeCount: row.like_count,
    isPaid: !!row.is_paid,
    price: row.price,
    status: row.status,
    createdAt: row.created_at,
    hlsPlaylists: hlsReady ? {
      '360p': row.hls_360p,
      '720p': row.hls_720p,
      '1080p': row.hls_1080p,
      auto: row.hls_720p,
    } : null,
  };
}

export interface CreateVideoParams {
  title: string;
  description: string;
  coverUrl: string;
  filePath: string;
  authorId: number;
  category: VideoCategory;
  duration: number;
  isPaid: boolean;
  price: number;
}

export function findAllVideos(params?: { category?: VideoCategory; search?: string; limit?: number; offset?: number }): Video[] {
  let sql = `SELECT v.* FROM videos v WHERE v.status = 'ready'`;
  const namedParams: Record<string, unknown> = {};

  if (params?.category) {
    sql += ' AND v.category = $category';
    namedParams.$category = params.category;
  }
  if (params?.search) {
    sql += ' AND (v.title LIKE $search OR v.description LIKE $search)';
    namedParams.$search = `%${params.search}%`;
  }
  sql += ' ORDER BY v.created_at DESC';
  if (params?.limit) {
    sql += ' LIMIT $limit';
    namedParams.$limit = params.limit;
  }
  if (params?.offset) {
    sql += ' OFFSET $offset';
    namedParams.$offset = params.offset;
  }

  const rows = prepareAll<VideoRow>(sql, Object.keys(namedParams).length > 0 ? namedParams : []);
  return rows.map(mapVideoRow);
}

export function findVideoById(id: number): Video | null {
  const row = prepareGet<VideoRow>('SELECT * FROM videos WHERE id = ?', [id]);
  return row ? mapVideoRow(row) : null;
}

export function incrementViewCount(id: number): void {
  prepareRun('UPDATE videos SET view_count = view_count + 1 WHERE id = $id', { $id: id });
}

export function createVideo(params: CreateVideoParams): Video {
  const result = prepareRun(
    `INSERT INTO videos (title, description, cover_url, file_path, author_id, category, duration, is_paid, price, status)
     VALUES ($title, $description, $coverUrl, $filePath, $authorId, $category, $duration, $isPaid, $price, 'transcoding')`,
    {
      $title: params.title,
      $description: params.description,
      $coverUrl: params.coverUrl,
      $filePath: params.filePath,
      $authorId: params.authorId,
      $category: params.category,
      $duration: params.duration,
      $isPaid: params.isPaid ? 1 : 0,
      $price: params.price,
    }
  );
  return findVideoById(result.lastInsertRowid)!;
}

export function updateVideoStatus(id: number, status: VideoStatus, hls?: { '360p': string; '720p': string; '1080p': string }): void {
  if (hls) {
    prepareRun(
      `UPDATE videos SET status = $status, hls_360p = $h360, hls_720p = $h720, hls_1080p = $h1080 WHERE id = $id`,
      { $id: id, $status: status, $h360: hls['360p'], $h720: hls['720p'], $h1080: hls['1080p'] }
    );
  } else {
    prepareRun('UPDATE videos SET status = $status WHERE id = $id', { $id: id, $status: status });
  }
}

export function likeVideo(id: number): number {
  prepareRun('UPDATE videos SET like_count = like_count + 1 WHERE id = $id', { $id: id });
  const result = query('SELECT like_count FROM videos WHERE id = ?', [id]);
  if (result.length > 0 && result[0].values.length > 0) {
    return Number(result[0].values[0][0]);
  }
  return 0;
}
