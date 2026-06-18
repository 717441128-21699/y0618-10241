import { useEffect, useState, useRef, useCallback } from 'react';
import { useHlsPlayer } from '../../hooks/useHlsPlayer';
import { usePlayerStore } from '../../store/usePlayerStore';
import PlayerControls from './PlayerControls';
import DanmakuLayer from './DanmakuLayer';
import { Danmaku, Video } from '../../../shared/types';
import clsx from 'clsx';
import { Play, Loader2 } from 'lucide-react';

interface VideoPlayerProps {
  video: Video;
  playToken?: string | null;
  initialTime?: number;
  danmakus: Danmaku[];
  previewLimit?: number | null;
  onTimeUpdate: (time: number, duration: number) => void;
  onPreviewReached?: () => void;
  onAuthFailed?: () => void;
  showControls?: boolean;
}

export default function VideoPlayer({
  video, playToken, initialTime, danmakus, previewLimit,
  onTimeUpdate, onPreviewReached, onAuthFailed
}: VideoPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<number | null>(null);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showCenterPlay, setShowCenterPlay] = useState(false);
  const [bigPlayFlash, setBigPlayFlash] = useState(0);

  const { danmakuEnabled, playbackRate, resolution, volume, muted } = usePlayerStore();

  const src = video.hlsPlaylists
    ? (resolution === 'auto' ? video.hlsPlaylists.auto : video.hlsPlaylists[resolution as '360p' | '720p' | '1080p'])
    : '';

  const {
    videoRef, playing, currentTime, duration, buffered,
    togglePlay, seek, toggleFullscreen: hlsToggleFs,
    isLoading, error, hlsInstance
  } = useHlsPlayer(src, {
    onTimeUpdate: (t, d) => {
      onTimeUpdate(t, d);
      if (previewLimit && t >= previewLimit) {
        onPreviewReached?.();
      }
    },
    onPlayStateChange: (p) => {
      setShowCenterPlay(false);
      if (!p) {
        setBigPlayFlash((n) => n + 1);
        setShowCenterPlay(true);
        const id = window.setTimeout(() => setShowCenterPlay(false), 800);
        return () => clearTimeout(id);
      }
    },
    onAuthFailed: () => {
      onAuthFailed?.();
    },
    initialTime,
    previewLimit: previewLimit || undefined,
    playToken,
  });

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.playbackRate = playbackRate;
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [playbackRate, volume, muted, videoRef]);

  useEffect(() => {
    if (!hlsInstance || !video.hlsPlaylists) return;
    const targetLevel = resolution === '1080p' ? 2 : resolution === '720p' ? 1 : resolution === '360p' ? 0 : -1;
    try {
      if (targetLevel === -1) {
        hlsInstance.currentLevel = -1;
      } else {
        const levels = hlsInstance.levels || [];
        if (levels[targetLevel]) {
          hlsInstance.currentLevel = targetLevel;
        }
      }
    } catch {}
  }, [resolution, hlsInstance, video.hlsPlaylists]);

  useEffect(() => {
    const onFs = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFs);
    return () => document.removeEventListener('fullscreenchange', onFs);
  }, []);

  const showControlsTemporarily = useCallback(() => {
    setControlsVisible(true);
    if (hideTimerRef.current) window.clearTimeout(hideTimerRef.current);
    hideTimerRef.current = window.setTimeout(() => {
      if (playing && !danmakuEnabled) setControlsVisible(false);
    }, 2800);
  }, [playing, danmakuEnabled]);

  const handleContainerMove = () => showControlsTemporarily();
  const handleContainerLeave = () => {
    if (playing) setControlsVisible(false);
  };

  const handleClick = (e: React.MouseEvent) => {
    const t = e.target as HTMLElement;
    if (t.closest('button') || t.closest('input')) return;
    togglePlay();
  };

  const handleKey = useCallback((e: KeyboardEvent) => {
    if (!containerRef.current?.contains(document.activeElement) &&
        document.activeElement?.tagName !== 'INPUT' &&
        document.activeElement?.tagName !== 'TEXTAREA') return;
    switch (e.key) {
      case ' ':
      case 'k':
        e.preventDefault(); togglePlay(); break;
      case 'ArrowLeft':
        e.preventDefault(); seek(Math.max(0, currentTime - 5)); break;
      case 'ArrowRight':
        e.preventDefault(); seek(Math.min(duration, currentTime + 5)); break;
      case 'f':
        e.preventDefault(); hlsToggleFs(); break;
      case 'm':
        e.preventDefault(); usePlayerStore.getState().toggleMuted(); break;
    }
  }, [togglePlay, seek, currentTime, duration, hlsToggleFs]);

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [handleKey]);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onMouseMove={handleContainerMove}
      onMouseLeave={handleContainerLeave}
      onClick={handleClick}
      className={clsx(
        'relative w-full aspect-video bg-black rounded-t-2xl overflow-hidden group select-none',
        'outline-none focus-visible:ring-2 focus-visible:ring-brand-primary/50'
      )}
    >
      <video
        ref={videoRef}
        playsInline
        crossOrigin="anonymous"
        className="absolute inset-0 w-full h-full object-contain bg-black"
        poster={video.coverUrl}
      />

      <DanmakuLayer
        danmakus={danmakus}
        currentTime={currentTime}
        enabled={danmakuEnabled}
      />

      {isLoading && !playing && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none bg-black/30">
          <div className="w-14 h-14 rounded-2xl bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/10 animate-pulse">
            <Loader2 className="w-7 h-7 text-white animate-spin" />
          </div>
        </div>
      )}

      {showCenterPlay && !isLoading && (
        <div
          key={bigPlayFlash}
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none animate-fade-in"
        >
          <div className="w-20 h-20 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center border border-white/20 animate-[scale_0.4s_ease-out]">
            <Play className="w-10 h-10 text-white ml-1" />
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60">
          <div className="text-center text-white px-6">
            <p className="text-lg font-semibold mb-2">视频加载失败</p>
            <p className="text-sm text-white/70">{error}</p>
          </div>
        </div>
      )}

      <div
        className={clsx(
          'transition-all duration-300',
          !controlsVisible && 'opacity-0 pointer-events-none translate-y-2'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <PlayerControls
          playing={playing}
          onTogglePlay={togglePlay}
          currentTime={currentTime}
          duration={duration}
          buffered={buffered}
          onSeek={seek}
          onFullscreen={hlsToggleFs}
          isFullscreen={isFullscreen}
          previewLimit={previewLimit || null}
        />
      </div>
    </div>
  );
}
