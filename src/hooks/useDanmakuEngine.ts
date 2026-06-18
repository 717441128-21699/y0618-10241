import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { Danmaku } from '../../shared/types';
import { usePlayerStore } from '../store/usePlayerStore';

interface ActiveDanmaku extends Danmaku {
  instanceId: string;
  track: number;
  startAt: number;
  width: number;
}

const TRACK_COUNT = 6;
const BASE_DURATION = 8000;
const DANMAKU_SPEED_FACTOR = 1;

export function useDanmakuEngine(
  danmakuList: Danmaku[],
  currentTime: number,
  containerWidth: number,
  isPlaying: boolean,
) {
  const { danmakuEnabled, danmakuOpacity, danmakuFontSize, danmakuDensity } = usePlayerStore();

  const [activeDanmakus, setActiveDanmakus] = useState<ActiveDanmaku[]>([]);
  const idCounterRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const trackFreeAtRef = useRef<number[]>(new Array(TRACK_COUNT).fill(0));
  const containerWidthRef = useRef(containerWidth);

  useEffect(() => {
    containerWidthRef.current = containerWidth;
  }, [containerWidth]);

  const activeMaxTracks = Math.max(1, Math.floor(TRACK_COUNT * danmakuDensity));

  const fontScale = useMemo(() => {
    switch (danmakuFontSize) {
      case 'small': return { fontSize: 16, height: 24 };
      case 'large': return { fontSize: 28, height: 40 };
      default: return { fontSize: 22, height: 32 };
    }
  }, [danmakuFontSize]);

  useEffect(() => {
    if (!danmakuEnabled || !isPlaying || containerWidth === 0) return;

    let animationFrame: number;
    let lastTs = performance.now();

    const estimateWidth = (text: string, size: number) => {
      return Math.min(containerWidthRef.current, text.length * size * 0.65 + 32);
    };

    const loop = (ts: number) => {
      const dt = ts - lastTs;
      lastTs = ts;

      if (Math.abs(currentTime - lastSpawnRef.current) > 0.08) {
        lastSpawnRef.current = currentTime;

        const nearDanmakus = danmakuList.filter(
          d => Math.abs(d.time - currentTime) < 0.2 && d.time >= currentTime - 0.05
        );

        if (nearDanmakus.length > 0) {
          setActiveDanmakus(prev => {
            const next = [...prev];
            for (const d of nearDanmakus) {
              const w = estimateWidth(d.content, fontScale.fontSize);
              const nowMs = ts;
              const travelTime = BASE_DURATION / DANMAKU_SPEED_FACTOR;
              let bestTrack = 0;
              let earliestFree = Infinity;
              for (let t = 0; t < activeMaxTracks; t++) {
                const free = trackFreeAtRef.current[t] || 0;
                if (free <= nowMs && free < earliestFree) {
                  earliestFree = free;
                  bestTrack = t;
                }
              }
              if (earliestFree === Infinity) continue;
              trackFreeAtRef.current[bestTrack] = nowMs + (w / (containerWidthRef.current + w)) * travelTime + 200;

              idCounterRef.current++;
              next.push({
                ...d,
                instanceId: `${d.id}-${idCounterRef.current}`,
                track: bestTrack,
                startAt: ts,
                width: w,
              });
            }
            return next;
          });
        }
      }

      const travelTime = BASE_DURATION / DANMAKU_SPEED_FACTOR;
      setActiveDanmakus(prev => prev.filter(ad => ts - ad.startAt < travelTime));

      void dt;
      animationFrame = requestAnimationFrame(loop);
    };

    animationFrame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrame);
  }, [danmakuEnabled, isPlaying, currentTime, danmakuList, activeMaxTracks, fontScale.fontSize, containerWidth]);

  const calculatePosition = useCallback((ad: ActiveDanmaku, now: number) => {
    const travelTime = BASE_DURATION / DANMAKU_SPEED_FACTOR;
    const progress = (now - ad.startAt) / travelTime;
    const x = containerWidthRef.current - progress * (containerWidthRef.current + ad.width);
    const y = ad.track * (fontScale.height + 4) + 8;
    return { x: Math.round(x), y };
  }, [fontScale.height]);

  const computeStyles = useCallback((ad: ActiveDanmaku, pos: { x: number; y: number }): React.CSSProperties => {
    return {
      position: 'absolute',
      left: pos.x,
      top: pos.y,
      whiteSpace: 'nowrap',
      color: ad.color,
      fontSize: fontScale.fontSize,
      fontWeight: 600,
      opacity: danmakuOpacity,
      textShadow: '1px 1px 2px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9), 1px -1px 2px rgba(0,0,0,0.9), -1px 1px 2px rgba(0,0,0,0.9)',
      pointerEvents: 'none',
      willChange: 'transform',
      fontFamily: 'system-ui, sans-serif',
      lineHeight: 1.2,
    };
  }, [fontScale.fontSize, danmakuOpacity]);

  return {
    activeDanmakus,
    calculatePosition,
    computeStyles,
    fontScale,
    trackHeight: fontScale.height,
  };
}
