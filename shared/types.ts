export type VideoStatus = 'uploading' | 'transcoding' | 'ready' | 'error';
export type VideoCategory = 'tech' | 'entertainment' | 'education' | 'gaming' | 'music' | 'other';

export interface User {
  id: number;
  username: string;
  email: string;
  avatar: string;
  createdAt: string;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Video {
  id: number;
  title: string;
  description: string;
  coverUrl: string;
  author: User;
  category: VideoCategory;
  duration: number;
  viewCount: number;
  likeCount: number;
  isPaid: boolean;
  price: number;
  status: VideoStatus;
  createdAt: string;
  hlsPlaylists: {
    '360p': string;
    '720p': string;
    '1080p': string;
    auto: string;
  } | null;
}

export interface TranscodeProgress {
  videoId: number;
  stage: 'uploading' | 'analyzing' | 'transcoding_360p' | 'transcoding_720p' | 'transcoding_1080p' | 'packaging' | 'done';
  stageProgress: number;
  overallProgress: number;
  completedResolutions: string[];
  message: string;
}

export interface Danmaku {
  id: number;
  videoId: number;
  userId: number;
  username: string;
  time: number;
  content: string;
  color: string;
  fontSize: 'small' | 'medium' | 'large';
  createdAt: string;
}

export interface SendDanmakuRequest {
  time: number;
  content: string;
  color: string;
  fontSize: 'small' | 'medium' | 'large';
}

export interface PlayProgress {
  videoId: number;
  userId: number;
  position: number;
  duration: number;
  updatedAt: string;
}

export interface PurchaseRequest {
  videoId: number;
  paymentMethod: 'alipay' | 'wechat' | 'card';
}

export interface PlayAuthToken {
  token: string;
  videoId: number;
  expiresAt: number;
}

export type WSMessageType = 'transcode_progress' | 'danmaku_new' | 'purchase_success' | 'pong';

export interface WSMessage {
  type: WSMessageType;
  payload: TranscodeProgress | Danmaku | PlayAuthToken;
}

export const VIDEO_CATEGORIES: { value: VideoCategory; label: string }[] = [
  { value: 'tech', label: '科技' },
  { value: 'entertainment', label: '娱乐' },
  { value: 'education', label: '教育' },
  { value: 'gaming', label: '游戏' },
  { value: 'music', label: '音乐' },
  { value: 'other', label: '其他' },
];

export const PLAYBACK_RATES = [0.5, 0.75, 1, 1.25, 1.5, 2];
export const RESOLUTIONS = ['auto', '1080p', '720p', '360p'] as const;
export type Resolution = typeof RESOLUTIONS[number];
