import client from './client';
import type {
  Video, VideoCategory, TranscodeProgress, PlayProgress,
  PlayAuthToken, SendDanmakuRequest, Danmaku, VideoStatus,
} from '../../shared/types';

export interface VideoDetailResponse {
  video: Video;
  related: Video[];
}

export interface VideoPlayInfoResponse {
  playlists: Video['hlsPlaylists'];
  duration: number;
  previewAllowed: boolean;
  previewSeconds: number;
  playToken?: PlayAuthToken;
  liked?: boolean;
  purchased?: boolean;
}

export type ProgressCallback = (progress: number) => void;

export async function getVideos(params?: { category?: VideoCategory; search?: string; limit?: number }) {
  const res = await client.get<{ videos: Video[]; total: number }>('/videos', { params });
  return res.data;
}

export async function getFeaturedVideos() {
  const res = await client.get<{ featured: Video[]; recommended: Video[] }>('/videos/featured');
  return res.data;
}

export async function getVideoDetail(id: number): Promise<VideoDetailResponse> {
  try {
    const res = await client.get<{ video: Video; related?: Video[] }>(`/videos/${id}`);
    return {
      video: res.data.video,
      related: res.data.related || [],
    };
  } catch {
    const allRes = await getVideos({ limit: 20 });
    const video = allRes.videos.find((v) => v.id === id) || allRes.videos[0];
    const related = allRes.videos.filter((v) => v.id !== video?.id).slice(0, 12);
    return { video, related };
  }
}

export async function getVideoPlayInfo(id: number): Promise<VideoPlayInfoResponse> {
  try {
    const res = await client.get<VideoPlayInfoResponse>(`/videos/${id}/play`);
    return res.data;
  } catch {
    return {
      playlists: null,
      duration: 0,
      previewAllowed: true,
      previewSeconds: 60,
    };
  }
}

export async function uploadVideo(
  formData: FormData,
  onProgress?: ProgressCallback,
): Promise<{ videoId: number; video: Video }> {
  const res = await client.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (evt) => {
      if (evt.total && onProgress) {
        onProgress(evt.loaded / evt.total);
      }
    },
  });
  const data = res.data as any;
  return {
    videoId: data.videoId ?? data.video?.id ?? 0,
    video: data.video,
  };
}

export async function getTranscodeProgress(videoId: number): Promise<TranscodeProgress | null> {
  try {
    const res = await client.get<TranscodeProgress>(`/videos/${videoId}/transcode-progress`);
    return res.data;
  } catch {
    return null;
  }
}

export async function getProgress(videoId: number): Promise<PlayProgress | null> {
  try {
    const res = await client.get<PlayProgress | { progress: PlayProgress | null }>(`/videos/${videoId}/progress`);
    const d: any = res.data;
    return d?.progress ?? d ?? null;
  } catch {
    return null;
  }
}

export async function saveProgress(videoId: number, position: number, duration: number) {
  await client.post(`/videos/${videoId}/progress`, { position, duration });
}

export async function getDanmakuList(videoId: number): Promise<Danmaku[]> {
  try {
    const res = await client.get<Danmaku[] | { danmaku: Danmaku[] }>(`/videos/${videoId}/danmaku`);
    const d: any = res.data;
    return Array.isArray(d) ? d : d?.danmaku || [];
  } catch {
    return [];
  }
}

export async function sendDanmaku(videoId: number, data: SendDanmakuRequest): Promise<Danmaku> {
  const res = await client.post<Danmaku | { danmaku: Danmaku }>(`/videos/${videoId}/danmaku`, data);
  const d: any = res.data;
  return d?.danmaku ?? d;
}

export async function likeVideo(videoId: number): Promise<{ liked: boolean; likeCount: number }> {
  try {
    const res = await client.post<{ liked?: boolean; likeCount: number }>(`/videos/${videoId}/like`);
    return { liked: res.data.liked ?? true, likeCount: res.data.likeCount };
  } catch {
    return { liked: true, likeCount: 0 };
  }
}

export async function purchaseVideo(
  videoId: number,
  paymentMethod: 'alipay' | 'wechat' | 'card',
): Promise<PlayAuthToken> {
  const res = await client.post<PlayAuthToken>(`/videos/${videoId}/purchase`, { videoId, paymentMethod });
  return res.data;
}

export { TranscodeProgress };
