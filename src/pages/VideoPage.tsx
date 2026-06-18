import { useEffect, useState, useCallback, useMemo, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart, Share2, Download, Clock, Eye, ThumbsUp, User,
  ArrowLeft, AlertCircle, Crown, RotateCcw, Shield, Bookmark
} from 'lucide-react';
import VideoPlayer from '../components/player/VideoPlayer';
import DanmakuInput from '../components/player/DanmakuInput';
import PaywallModal from '../components/player/PaywallModal';
import { useAuthStore } from '../store/useAuthStore';
import { useWebSocket } from '../hooks/useWebSocket';
import {
  getVideoDetail, getVideoPlayInfo, getDanmakuList,
  sendDanmaku, saveProgress, getProgress, likeVideo,
  purchaseVideo, VideoDetailResponse
} from '../api/video.api';
import type { Video, Danmaku, PlayAuthToken } from '../../shared/types';
import { formatCompactNumber, formatDuration, formatDate, formatTokenExpiry } from '../utils/format';
import { getPlayToken, savePlayToken } from '../utils/token';
import clsx from 'clsx';
import VideoCard from '../components/layout/VideoCard';

const PREVIEW_LIMIT = 60;

export default function VideoPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const videoId = parseInt(id || '0');

  const { user, isAuthenticated } = useAuthStore();
  const { onMessage } = useWebSocket();

  const [loading, setLoading] = useState(true);
  const [video, setVideo] = useState<Video | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [danmakus, setDanmakus] = useState<Danmaku[]>([]);
  const [playToken, setPlayToken] = useState<PlayAuthToken | null>(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [initialTime, setInitialTime] = useState(0);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [liked, setLiked] = useState(false);
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);
  const lastTimeRef = useRef(0);
  const durationRef = useRef(0);
  const saveTimerRef = useRef<number | null>(null);

  const needsPurchase = video?.isPaid && !playToken;
  const effectivePreview = needsPurchase ? PREVIEW_LIMIT : null;

  const fetchData = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    setError(null);
    try {
      const [detailRes, danmakuRes] = await Promise.all([
        getVideoDetail(videoId),
        getDanmakuList(videoId),
      ]);
      setVideo(detailRes.video);
      setDanmakus(danmakuRes);

      if (detailRes.related) {
        setRelatedVideos(detailRes.related);
      }

      if (detailRes.video.isPaid) {
        const cached = getPlayToken(videoId);
        if (cached && cached.expiresAt > Date.now()) {
          setPlayToken({ videoId, token: cached.token, expiresAt: cached.expiresAt });
        } else {
          try {
            const info = await getVideoPlayInfo(videoId);
            if (info.playToken && info.playToken.expiresAt > Date.now()) {
              setPlayToken(info.playToken);
              savePlayToken(info.playToken);
            }
          } catch {}
        }
      }

      if (isAuthenticated) {
        try {
          const prog = await getProgress(videoId);
          if (prog && prog.position > 5 && prog.position < (detailRes.video.duration || 999999) - 10) {
            setInitialTime(prog.position);
            setShowResumeToast(true);
            setTimeout(() => setShowResumeToast(false), 4000);
          }
        } catch {}
        try {
          const info = await getVideoPlayInfo(videoId);
          setLiked(info.liked || false);
        } catch {}
      }
    } catch (err: any) {
      setError(err.response?.data?.error || '加载视频失败');
    } finally {
      setLoading(false);
    }
  }, [videoId, isAuthenticated]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    const unsub = onMessage((msg) => {
      if (msg.type === 'danmaku_new') {
        const d = msg.payload as Danmaku;
        if (d.videoId === videoId) {
          setDanmakus((prev) => [...prev, d]);
        }
      }
      if (msg.type === 'purchase_success') {
        const t = msg.payload as PlayAuthToken;
        if (t.videoId === videoId) {
          setPlayToken(t);
          savePlayToken(t);
        }
      }
    });
    return unsub;
  }, [videoId, onMessage]);

  const handleTimeUpdate = useCallback((time: number, dur: number) => {
    lastTimeRef.current = time;
    durationRef.current = dur;
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(() => {
      if (isAuthenticated && time > 5) {
        saveProgress(videoId, time, dur).catch(() => {});
      }
    }, 5000);
  }, [videoId, isAuthenticated]);

  const handlePreviewReached = useCallback(() => {
    setShowPaywall(true);
  }, []);

  const handleSendDanmaku = useCallback(async (content: string, color: string, fontSize: 'small' | 'medium' | 'large') => {
    try {
      await sendDanmaku(videoId, {
        time: lastTimeRef.current,
        content,
        color,
        fontSize,
      });
    } catch {}
  }, [videoId]);

  const handlePurchase = useCallback(async (method: 'alipay' | 'wechat' | 'card'): Promise<PlayAuthToken> => {
    const res = await purchaseVideo(videoId, method);
    setPlayToken(res);
    savePlayToken(res);
    return res;
  }, [videoId]);

  const handleLike = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    try {
      await likeVideo(videoId);
      setLiked((v) => !v);
      setVideo((v) => v ? { ...v, likeCount: v.likeCount + (liked ? -1 : 1) } : v);
    } catch {}
  };

  const handleResumeFromStart = () => {
    setInitialTime(0);
    setShowResumeToast(false);
  };

  const handleResume = () => {
    setShowResumeToast(false);
  };

  const danmakuCount = useMemo(() => danmakus.length, [danmakus]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-5">
            <div className="aspect-video rounded-2xl bg-bg-card shimmer animate-pulse" />
            <div className="h-10 w-3/4 rounded-xl bg-bg-card shimmer animate-pulse" />
            <div className="h-24 rounded-xl bg-bg-card shimmer animate-pulse" />
          </div>
          <div className="space-y-4">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-bg-card shimmer animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 text-center">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-error/15 flex items-center justify-center mb-5">
          <AlertCircle className="w-8 h-8 text-error" />
        </div>
        <h2 className="text-2xl font-bold font-display text-text-primary mb-2">无法加载视频</h2>
        <p className="text-text-muted mb-6">{error || '视频不存在或已被删除'}</p>
        <Link to="/" className="btn-primary h-11 px-6 inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5 animate-fade-in">
          <div className="relative">
            <VideoPlayer
              video={video}
              playToken={playToken?.token || null}
              initialTime={initialTime}
              danmakus={danmakus}
              previewLimit={effectivePreview}
              onTimeUpdate={handleTimeUpdate}
              onPreviewReached={handlePreviewReached}
            />
            <DanmakuInput
              currentTime={lastTimeRef.current}
              onSend={handleSendDanmaku}
              disabled={needsPurchase}
            />

            {showResumeToast && (
              <div className="absolute top-5 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
                <div className="glass-panel rounded-xl px-5 py-3 flex items-center gap-3 border border-brand-primary/30 shadow-xl">
                  <RotateCcw className="w-5 h-5 text-brand-primary" />
                  <div className="text-sm">
                    <span className="text-text-primary font-medium">检测到上次观看进度</span>
                    <span className="text-text-muted ml-2">
                      {formatDuration(initialTime)} / {formatDuration(video.duration)}
                    </span>
                  </div>
                  <button
                    onClick={handleResumeFromStart}
                    className="text-xs text-text-secondary hover:text-text-primary ml-2 px-3 py-1 rounded-lg hover:bg-border-subtle transition-colors"
                  >
                    从头播放
                  </button>
                  <button
                    onClick={handleResume}
                    className="text-xs bg-brand-primary text-white px-3 py-1.5 rounded-lg hover:bg-brand-primary/90 transition-colors font-medium"
                  >
                    继续观看
                  </button>
                </div>
              </div>
            )}

            {playToken && (
              <div className="mt-3 glass-panel rounded-xl px-4 py-2.5 flex items-center gap-3 border border-success/20 animate-fade-in">
                <Shield className="w-4.5 h-4.5 text-success shrink-0" />
                <div className="text-xs flex items-center gap-2 flex-wrap">
                  <span className="text-text-secondary">播放鉴权已激活</span>
                  <span className="text-text-muted">·</span>
                  <span className="text-success font-mono">
                    有效期至 {formatTokenExpiry(playToken.expiresAt)}
                  </span>
                  <span className="text-text-muted">·</span>
                  <span className="font-mono text-text-muted">
                    Token: {playToken.token.slice(0, 12)}...
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="card-base p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-bold font-display text-text-primary leading-snug">
                  {video.isPaid && (
                    <span className="inline-flex items-center gap-1 mr-2 align-middle text-xs bg-accent-gradient text-white px-2 py-1 rounded-lg font-semibold">
                      <Crown className="w-3 h-3" />
                      付费
                    </span>
                  )}
                  {video.title}
                </h1>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-text-muted">
                  <span className="flex items-center gap-1">
                    <Eye className="w-3.5 h-3.5" />
                    {formatCompactNumber(video.viewCount)} 观看
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="w-3.5 h-3.5" />
                    {formatCompactNumber(video.likeCount)} 点赞
                  </span>
                  <span className="flex items-center gap-1">
                    💬 {formatCompactNumber(danmakuCount)} 弹幕
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDuration(video.duration)}
                  </span>
                  <span className="flex items-center gap-1">
                    {formatDate(video.createdAt)}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={handleLike}
                  className={clsx(
                    'h-10 px-4 rounded-xl flex items-center gap-2 text-sm font-medium transition-all',
                    liked
                      ? 'bg-brand-primary/15 text-brand-primary border border-brand-primary/30 hover:bg-brand-primary/25'
                      : 'bg-bg-overlay text-text-secondary hover:text-text-primary hover:bg-border-subtle border border-border-subtle'
                  )}
                >
                  <ThumbsUp className={clsx('w-4 h-4', liked && 'fill-current')} />
                  {liked ? '已点赞' : '点赞'}
                </button>
                <button className="h-10 px-4 rounded-xl bg-bg-overlay border border-border-subtle flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary hover:bg-border-subtle transition-all">
                  <Share2 className="w-4 h-4" />
                  分享
                </button>
                <button className="h-10 px-4 rounded-xl bg-bg-overlay border border-border-subtle flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary hover:bg-border-subtle transition-all">
                  <Bookmark className="w-4 h-4" />
                  收藏
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-border-subtle flex flex-col sm:flex-row gap-4">
              <Link
                to={`/user/${video.author.id}`}
                className="flex items-center gap-3 shrink-0 group"
              >
                <div className="relative">
                  {video.author.avatar ? (
                    <img src={video.author.avatar} alt="" className="w-12 h-12 rounded-full object-cover ring-2 ring-border-subtle group-hover:ring-brand-primary/40 transition-all" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-brand-gradient flex items-center justify-center shadow-md">
                      <User className="w-6 h-6 text-white" />
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-text-primary group-hover:text-brand-primary transition-colors truncate">
                    {video.author.username}
                  </p>
                  <p className="text-xs text-text-muted">加入于 {formatDate(video.author.createdAt)}</p>
                </div>
              </Link>
              <div className="flex-1 flex items-center gap-3 sm:justify-end">
                <button className="h-10 px-5 rounded-xl border-2 border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white font-semibold transition-all text-sm">
                  + 关注 UP 主
                </button>
              </div>
            </div>

            {video.description && (
              <div className="mt-5 pt-4 border-t border-border-subtle">
                <p className="text-sm text-text-secondary whitespace-pre-wrap leading-relaxed">
                  {video.description}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-1 space-y-4">
          <div className="card-base p-4">
            <h3 className="font-bold text-text-primary font-display flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-brand-gradient rounded-full" />
              推荐视频
            </h3>
            <div className="space-y-3">
              {relatedVideos.slice(0, 6).map((v, i) => (
                <Link
                  key={v.id}
                  to={`/video/${v.id}`}
                  className="flex gap-3 group animate-slide-up"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="relative w-40 shrink-0 aspect-video rounded-xl overflow-hidden bg-bg-overlay">
                    <img
                      src={v.coverUrl}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono">
                      {formatDuration(v.duration)}
                    </div>
                    {v.isPaid && (
                      <div className="absolute top-1 left-1 chip bg-accent-gradient text-white text-[10px] px-1.5 py-0.5">
                        <Crown className="w-2.5 h-2.5 inline mr-0.5" />
                        付费
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-brand-primary transition-colors leading-snug">
                      {v.title}
                    </p>
                    <p className="text-xs text-text-muted mt-1.5">{v.author.username}</p>
                    <p className="text-xs text-text-muted">
                      {formatCompactNumber(v.viewCount)} 观看
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="card-base p-4">
            <h3 className="font-bold text-text-primary font-display flex items-center gap-2 mb-4">
              <span className="w-1 h-5 bg-accent-gradient rounded-full" />
              全站热门
            </h3>
            <div className="space-y-3">
              {relatedVideos.slice(6).map((v, i) => (
                <Link
                  key={v.id}
                  to={`/video/${v.id}`}
                  className="flex gap-3 group animate-slide-up"
                  style={{ animationDelay: `${(i + 6) * 0.05}s` }}
                >
                  <div className="relative w-40 shrink-0 aspect-video rounded-xl overflow-hidden bg-bg-overlay">
                    <img
                      src={v.coverUrl}
                      alt={v.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[10px] text-white font-mono">
                      {formatDuration(v.duration)}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1 pt-0.5">
                    <p className="text-sm font-medium text-text-primary line-clamp-2 group-hover:text-brand-primary transition-colors leading-snug">
                      {v.title}
                    </p>
                    <p className="text-xs text-text-muted mt-1.5">{v.author.username}</p>
                    <p className="text-xs text-text-muted">
                      {formatCompactNumber(v.viewCount)} 观看
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showPaywall && video.isPaid && (
        <PaywallModal
          video={video}
          previewTime={lastTimeRef.current}
          previewLimit={PREVIEW_LIMIT}
          onPurchase={handlePurchase}
          onClose={() => {
            setShowPaywall(false);
            handleTimeUpdate(initialTime || 0, durationRef.current);
          }}
        />
      )}
    </div>
  );
}
