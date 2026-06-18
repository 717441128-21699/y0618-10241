import { create } from 'zustand';
import type { Resolution } from '../../shared/types';

interface PlayerSettings {
  volume: number;
  muted: boolean;
  playbackRate: number;
  resolution: Resolution;
  danmakuEnabled: boolean;
  danmakuOpacity: number;
  danmakuFontSize: 'small' | 'medium' | 'large';
  danmakuDensity: number;
}

interface PlayerState extends PlayerSettings {
  setVolume: (v: number) => void;
  setMuted: (m: boolean) => void;
  toggleMuted: () => void;
  setPlaybackRate: (r: number) => void;
  setResolution: (r: Resolution) => void;
  setDanmakuEnabled: (e: boolean) => void;
  toggleDanmaku: () => void;
  setDanmakuOpacity: (o: number) => void;
  setDanmakuFontSize: (s: 'small' | 'medium' | 'large') => void;
  setDanmakuDensity: (d: number) => void;
}

export const usePlayerStore = create<PlayerState>((set) => ({
  volume: 0.8,
  muted: false,
  playbackRate: 1,
  resolution: 'auto',
  danmakuEnabled: true,
  danmakuOpacity: 90,
  danmakuFontSize: 'medium',
  danmakuDensity: 70,

  setVolume: (v) => set({ volume: Math.max(0, Math.min(1, v)), muted: v === 0 }),
  setMuted: (m) => set({ muted: m }),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  setPlaybackRate: (r) => set({ playbackRate: r }),
  setResolution: (r) => set({ resolution: r }),
  setDanmakuEnabled: (e) => set({ danmakuEnabled: e }),
  toggleDanmaku: () => set((s) => ({ danmakuEnabled: !s.danmakuEnabled })),
  setDanmakuOpacity: (o) => set({ danmakuOpacity: Math.max(20, Math.min(100, o)) }),
  setDanmakuFontSize: (s) => set({ danmakuFontSize: s }),
  setDanmakuDensity: (d) => set({ danmakuDensity: Math.max(30, Math.min(100, d)) }),
}));
