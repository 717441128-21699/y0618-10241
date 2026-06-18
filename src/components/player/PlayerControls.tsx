import { useEffect, useRef, useState } from 'react';
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize,
  SkipBack, SkipForward, Settings, ChevronDown, Gauge
} from 'lucide-react';
import clsx from 'clsx';
import { PLAYBACK_RATES, RESOLUTIONS, Resolution } from '../../../shared/types';
import { usePlayerStore } from '../../store/usePlayerStore';
import { formatDuration } from '../../utils/format';

interface PlayerControlsProps {
  playing: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  duration: number;
  buffered: number;
  onSeek: (time: number) => void;
  onFullscreen: () => void;
  isFullscreen: boolean;
  previewLimit?: number | null;
}

export default function PlayerControls({
  playing, onTogglePlay, currentTime, duration, buffered,
  onSeek, onFullscreen, isFullscreen, previewLimit
}: PlayerControlsProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<'speed' | 'quality'>('speed');
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverX, setHoverX] = useState(0);
  const [dragging, setDragging] = useState(false);

  const { volume, muted, playbackRate, resolution,
    setVolume, toggleMuted, setPlaybackRate, setResolution } = usePlayerStore();

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferedProgress = duration > 0 ? (buffered / duration) * 100 : 0;
  const previewProgress = previewLimit && duration > 0 ? (previewLimit / duration) * 100 : null;

  const handleProgressClick = (e: React.MouseEvent | React.TouchEvent) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
    const pct = x / rect.width;
    let target = pct * duration;
    if (previewLimit) target = Math.min(target, previewLimit);
    onSeek(target);
  };

  const handleProgressHover = (e: React.MouseEvent) => {
    if (!progressRef.current || !duration) return;
    const rect = progressRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setHoverX(x);
    setHoverTime((x / rect.width) * duration);
  };

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging || !progressRef.current || !duration) return;
      const rect = progressRef.current.getBoundingClientRect();
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      let target = (x / rect.width) * duration;
      if (previewLimit) target = Math.min(target, previewLimit);
      onSeek(target);
    };
    const onUp = () => setDragging(false);
    if (dragging) {
      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
      window.addEventListener('touchmove', onMove);
      window.addEventListener('touchend', onUp);
    }
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onUp);
    };
  }, [dragging, duration, onSeek, previewLimit]);

  return (
    <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/60 to-transparent pt-16 pb-3 px-4">
      <div
        ref={progressRef}
        className="relative h-1.5 group cursor-pointer mb-3 touch-none"
        onClick={handleProgressClick}
        onMouseMove={handleProgressHover}
        onMouseLeave={() => setHoverTime(null)}
        onMouseDown={() => setDragging(true)}
        onTouchStart={() => setDragging(true)}
      >
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-full group-hover:h-3 transition-all rounded-full overflow-hidden bg-white/20">
          <div
            className="absolute inset-y-0 left-0 bg-white/30"
            style={{ width: `${bufferedProgress}%` }}
          />
          {previewProgress !== null && (
            <div
              className="absolute inset-y-0 bg-warning/60 border-r-2 border-warning"
              style={{ width: `${previewProgress}%` }}
            />
          )}
          <div
            className={clsx(
              'absolute inset-y-0 left-0 transition-all',
              previewLimit !== null ? 'bg-accent-gradient' : 'bg-brand-gradient'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full shadow-lg transition-all',
            previewLimit !== null ? 'bg-accent-primary' : 'bg-brand-primary',
            'opacity-0 group-hover:opacity-100 scale-75 group-hover:scale-100'
          )}
          style={{ left: `calc(${progress}% - 8px)` }}
        />
        {hoverTime !== null && (
          <div
            className="absolute -top-10 -translate-x-1/2 px-2 py-1 bg-black/80 rounded text-xs text-white font-mono pointer-events-none"
            style={{ left: hoverX }}
          >
            {formatDuration(hoverTime)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-white">
        <button
          onClick={() => onSeek(Math.max(0, currentTime - 10))}
          className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
          title="后退10秒"
        >
          <SkipBack className="w-5 h-5" />
        </button>
        <button
          onClick={onTogglePlay}
          className="w-11 h-11 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 transition-transform shrink-0 shadow-lg"
        >
          {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
        </button>
        <button
          onClick={() => onSeek(Math.min(duration, currentTime + 10))}
          className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
          title="前进10秒"
        >
          <SkipForward className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 group/vol shrink-0">
          <button
            onClick={toggleMuted}
            className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            {muted || volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="range-slider w-0 group-hover/vol:w-20 transition-all duration-300 overflow-hidden"
          />
        </div>

        <div className="text-xs sm:text-sm font-mono text-white/80 shrink-0">
          <span>{formatDuration(currentTime)}</span>
          <span className="mx-1 text-white/40">/</span>
          <span className={previewLimit && currentTime >= previewLimit - 0.1 ? 'text-warning' : ''}>
            {formatDuration(duration)}
          </span>
        </div>

        <div className="flex-1" />

        {previewLimit && currentTime >= previewLimit - 3 && (
          <div className="hidden sm:flex items-center gap-2 bg-warning/20 border border-warning/40 text-warning text-xs px-3 py-1.5 rounded-lg animate-pulse">
            <span>⏱</span>
            <span>预览剩余 {Math.max(0, Math.ceil(previewLimit - currentTime))}秒</span>
          </div>
        )}

        <div className="relative shrink-0">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={clsx(
              'w-9 h-9 rounded-full flex items-center justify-center transition-colors',
              showSettings ? 'bg-white/20' : 'hover:bg-white/10'
            )}
          >
            <Settings className="w-5 h-5" />
          </button>
          {showSettings && (
            <div
              className="absolute bottom-full right-0 mb-2 w-56 rounded-xl bg-black/95 backdrop-blur-xl border border-white/10 shadow-2xl overflow-hidden animate-fade-in"
              onMouseLeave={() => setShowSettings(false)}
            >
              <div className="flex border-b border-white/10">
                {(['speed', 'quality'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={clsx(
                      'flex-1 py-2.5 text-xs font-medium transition-colors',
                      activeTab === tab
                        ? 'text-brand-primary bg-white/5 border-b-2 border-brand-primary'
                        : 'text-white/60 hover:text-white'
                    )}
                  >
                    {tab === 'speed' ? '播放速度' : '清晰度'}
                  </button>
                ))}
              </div>
              <div className="max-h-64 overflow-y-auto py-1">
                {activeTab === 'speed' ? (
                  PLAYBACK_RATES.map((rate) => (
                    <button
                      key={rate}
                      onClick={() => { setPlaybackRate(rate); setShowSettings(false); }}
                      className={clsx(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between',
                        playbackRate === rate
                          ? 'bg-white/10 text-brand-primary font-medium'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span>{rate === 1 ? '正常速度' : `${rate}x`}</span>
                      {playbackRate === rate && <span>✓</span>}
                    </button>
                  ))
                ) : (
                  RESOLUTIONS.map((res) => (
                    <button
                      key={res}
                      onClick={() => { setResolution(res as Resolution); setShowSettings(false); }}
                      className={clsx(
                        'w-full px-4 py-2.5 text-left text-sm transition-colors flex items-center justify-between gap-2',
                        resolution === res
                          ? 'bg-white/10 text-brand-primary font-medium'
                          : 'text-white/80 hover:bg-white/5 hover:text-white'
                      )}
                    >
                      <span className="flex items-center gap-2">
                        <Gauge className="w-3.5 h-3.5 opacity-60" />
                        {res === 'auto' ? '自动（自适应）' : res.toUpperCase()}
                      </span>
                      {resolution === res && <span>✓</span>}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="hidden sm:block shrink-0 text-xs font-mono text-white/60 bg-white/5 px-2 py-1 rounded-md border border-white/10">
          {playbackRate}x
          <span className="mx-1 opacity-40">·</span>
          {resolution === 'auto' ? 'AUTO' : resolution.toUpperCase()}
        </div>

        <button
          onClick={onFullscreen}
          className="w-9 h-9 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors shrink-0"
        >
          {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
        </button>
      </div>
    </div>
  );
}
