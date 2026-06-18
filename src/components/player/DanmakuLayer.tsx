import { useEffect, useRef } from 'react';
import { Danmaku } from '../../../shared/types';
import { usePlayerStore } from '../../store/usePlayerStore';
import clsx from 'clsx';

interface DanmakuLayerProps {
  danmakus: Danmaku[];
  currentTime: number;
  enabled: boolean;
}

interface ActiveDanmaku {
  id: number;
  content: string;
  color: string;
  fontSize: 'small' | 'medium' | 'large';
  track: number;
  startTime: number;
  width: number;
}

const TRAVEL_TIME = 8000;
const MAX_TRACKS = 6;

export default function DanmakuLayer({ danmakus, currentTime, enabled }: DanmakuLayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<Map<number, ActiveDanmaku>>(new Map());
  const trackEndTimesRef = useRef<number[]>(new Array(MAX_TRACKS).fill(0));
  const rafRef = useRef<number>(0);
  const lastTriggeredRef = useRef<Set<number>>(new Set());
  const { danmakuOpacity, danmakuFontSize, danmakuDensity } = usePlayerStore();

  const fontSizeMap = {
    small: { size: '12px', trackHeight: 24 },
    medium: { size: '16px', trackHeight: 30 },
    large: { size: '22px', trackHeight: 38 },
  };

  const assignTrack = (now: number, width: number, containerWidth: number): number => {
    const travelSpeed = (containerWidth + width) / TRAVEL_TIME;
    const safeDistance = width * (1 - danmakuDensity / 100) + 80;
    let bestTrack = -1;
    let bestEndTime = Infinity;

    for (let i = 0; i < MAX_TRACKS; i++) {
      const trackEnd = trackEndTimesRef.current[i] || 0;
      if (now >= trackEnd) {
        return i;
      }
      const remaining = (trackEndTimesRef.current[i] - now) / travelSpeed;
      if (remaining > safeDistance && trackEnd < bestEndTime) {
        bestEndTime = trackEnd;
        bestTrack = i;
      }
    }
    if (bestTrack === -1) {
      const earliest = Math.min(...trackEndTimesRef.current);
      bestTrack = trackEndTimesRef.current.indexOf(earliest);
    }
    return bestTrack;
  };

  useEffect(() => {
    if (!enabled) {
      activeRef.current.clear();
      lastTriggeredRef.current.clear();
      trackEndTimesRef.current = new Array(MAX_TRACKS).fill(0);
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      return;
    }

    const containerWidth = containerRef.current?.clientWidth || 1280;
    const now = performance.now();

    danmakus.forEach((d) => {
      if (lastTriggeredRef.current.has(d.id)) return;
      const diff = Math.abs(d.time - currentTime);
      if (diff < 0.3) {
        lastTriggeredRef.current.add(d.id);
        const fs = fontSizeMap[danmakuFontSize];
        const estWidth = Math.min(d.content.length * (parseInt(fs.size) * 0.7) + 40, containerWidth * 0.9);
        const track = assignTrack(now, estWidth, containerWidth);
        const travelSpeed = (containerWidth + estWidth) / TRAVEL_TIME;
        trackEndTimesRef.current[track] = now + estWidth / travelSpeed * 1.1;

        const el = document.createElement('div');
        el.className = 'absolute whitespace-nowrap pointer-events-none will-change-transform font-bold drop-shadow-lg';
        el.style.color = d.color;
        el.style.fontSize = fontSizeMap[d.fontSize].size;
        el.style.opacity = String(danmakuOpacity / 100);
        el.style.textShadow = '0 1px 3px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.5)';
        el.style.webkitTextStroke = '0.3px rgba(0,0,0,0.5)';
        el.style.top = `${track * fontSizeMap[d.fontSize].trackHeight + 16}px`;
        el.textContent = d.content;
        el.dataset.id = String(d.id);
        containerRef.current?.appendChild(el);

        activeRef.current.set(d.id, {
          id: d.id,
          content: d.content,
          color: d.color,
          fontSize: d.fontSize,
          track,
          startTime: now,
          width: estWidth,
        });
      }
    });

    const render = () => {
      const frameNow = performance.now();
      const cw = containerRef.current?.clientWidth || containerWidth;
      activeRef.current.forEach((ad, id) => {
        const elapsed = frameNow - ad.startTime;
        const travelSpeed = (cw + ad.width) / TRAVEL_TIME;
        const x = cw - elapsed * travelSpeed;
        const el = containerRef.current?.querySelector(`[data-id="${id}"]`);
        if (el) {
          (el as HTMLElement).style.transform = `translateX(${x}px)`;
        }
        if (x + ad.width < -50) {
          el?.remove();
          activeRef.current.delete(id);
        }
      });
      rafRef.current = requestAnimationFrame(render);
    };
    rafRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [currentTime, danmakus, enabled, danmakuOpacity, danmakuFontSize, danmakuDensity]);

  return (
    <div
      ref={containerRef}
      className={clsx(
        'absolute inset-0 overflow-hidden z-10 pointer-events-none transition-opacity duration-300',
        !enabled && 'opacity-0'
      )}
    />
  );
}
