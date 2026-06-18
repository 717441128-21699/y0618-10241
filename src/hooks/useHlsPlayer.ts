import { useEffect, useRef, useState, useCallback } from 'react';
import Hls from 'hls.js';
import type HlsClass from 'hls.js';

interface UseHlsPlayerOptions {
  onTimeUpdate?: (time: number, duration: number) => void;
  onPlayStateChange?: (playing: boolean) => void;
  initialTime?: number;
  previewLimit?: number;
}

export function useHlsPlayer(src: string, options: UseHlsPlayerOptions = {}) {
  const { onTimeUpdate, onPlayStateChange, initialTime = 0, previewLimit } = options;

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const hlsRef = useRef<HlsClass | null>(null);
  const durationRef = useRef(0);
  const hasSeekedInitialRef = useRef(false);

  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const togglePlay = useCallback(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused || v.ended) {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (videoRef.current) {
      try {
        videoRef.current.currentTime = Math.max(0, Math.min(durationRef.current || 99999, time));
      } catch {}
    }
  }, []);

  const toggleFullscreen = useCallback(() => {
    const container = videoRef.current?.parentElement;
    if (!container) return;
    try {
      if (!document.fullscreenElement) {
        container.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    } catch {}
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setIsLoading(true);
    setError(null);
    hasSeekedInitialRef.current = false;

    if (hlsRef.current) {
      try { hlsRef.current.destroy(); } catch {}
      hlsRef.current = null;
    }

    const attachSrc = (realSrc: string) => {
      if (!realSrc) {
        setError('暂无视频源');
        setIsLoading(false);
        return;
      }
      if (Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: false,
          maxBufferLength: 30,
        });
        hls.loadSource(realSrc);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setIsLoading(false);
        });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                try { hls.startLoad(); } catch {}
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                try { hls.recoverMediaError(); } catch {}
                break;
              default:
                console.error('HLS fatal:', data);
                setError('视频播放出错');
                setIsLoading(false);
            }
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = realSrc;
        const onMeta = () => { setIsLoading(false); };
        video.addEventListener('loadedmetadata', onMeta, { once: true });
      } else {
        video.src = realSrc;
        const onMeta = () => { setIsLoading(false); };
        video.addEventListener('loadedmetadata', onMeta, { once: true });
      }
    };

    if (src.endsWith('.m3u8') || src.startsWith('blob:') || src.startsWith('data:')) {
      attachSrc(src);
    } else {
      fetch(src)
        .then((r) => r.json().then((d) => d?.source || d?.url || src).catch(() => src))
        .then(attachSrc)
        .catch(() => attachSrc(src));
    }

    const onTime = () => {
      let t = video.currentTime;
      if (previewLimit !== undefined && previewLimit !== null && t >= previewLimit) {
        t = previewLimit;
        video.pause();
        try { video.currentTime = previewLimit; } catch {}
      }
      setCurrentTime(t);
      const d = durationRef.current = video.duration || durationRef.current;
      setDuration(d);
      onTimeUpdate?.(t, d);
    };

    const onDuration = () => {
      const d = durationRef.current = video.duration || 0;
      setDuration(d);
      if (!hasSeekedInitialRef.current && initialTime && initialTime > 0 && initialTime < d - 5) {
        hasSeekedInitialRef.current = true;
        try {
          video.currentTime = initialTime;
        } catch {}
      }
    };

    const onPlay = () => {
      setPlaying(true);
      onPlayStateChange?.(true);
    };
    const onPause = () => {
      setPlaying(false);
      onPlayStateChange?.(false);
    };
    const onEnded = () => {
      setPlaying(false);
      onPlayStateChange?.(false);
    };
    const onProgress = () => {
      try {
        if (video.buffered.length > 0) {
          setBuffered(video.buffered.end(video.buffered.length - 1));
        }
      } catch {}
    };
    const onWaiting = () => setIsLoading(true);
    const onPlaying = () => setIsLoading(false);
    const onCanPlay = () => setIsLoading(false);
    const onSeeked = () => setIsLoading(false);

    video.addEventListener('timeupdate', onTime);
    video.addEventListener('durationchange', onDuration);
    video.addEventListener('loadedmetadata', onDuration);
    video.addEventListener('play', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onEnded);
    video.addEventListener('progress', onProgress);
    video.addEventListener('waiting', onWaiting);
    video.addEventListener('playing', onPlaying);
    video.addEventListener('canplay', onCanPlay);
    video.addEventListener('seeked', onSeeked);

    return () => {
      video.removeEventListener('timeupdate', onTime);
      video.removeEventListener('durationchange', onDuration);
      video.removeEventListener('loadedmetadata', onDuration);
      video.removeEventListener('play', onPlay);
      video.removeEventListener('pause', onPause);
      video.removeEventListener('ended', onEnded);
      video.removeEventListener('progress', onProgress);
      video.removeEventListener('waiting', onWaiting);
      video.removeEventListener('playing', onPlaying);
      video.removeEventListener('canplay', onCanPlay);
      video.removeEventListener('seeked', onSeeked);
      if (hlsRef.current) {
        try { hlsRef.current.destroy(); } catch {}
        hlsRef.current = null;
      }
    };
  }, [src, initialTime, previewLimit, onTimeUpdate, onPlayStateChange]);

  return {
    videoRef,
    playing,
    currentTime,
    duration,
    buffered,
    isLoading,
    error,
    togglePlay,
    seek,
    toggleFullscreen,
    hlsInstance: hlsRef.current,
  };
}
