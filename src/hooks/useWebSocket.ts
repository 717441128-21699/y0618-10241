import { useEffect, useRef, useCallback } from 'react';
import type { WSMessage } from '../../shared/types';

type MessageHandler = (msg: WSMessage) => void;
type Sendable = Record<string, any>;

export function useWebSocket() {
  const wsRef = useRef<WebSocket | null>(null);
  const handlersRef = useRef<Set<MessageHandler>>(new Set());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pendingQueueRef = useRef<Sendable[]>([]);

  const connect = useCallback(() => {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname === 'localhost'
      ? `localhost:${import.meta.env.VITE_API_PORT || 3001}`
      : window.location.host;
    const url = `${proto}//${host}/ws`;

    try {
      const ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WS] Connected');
        if (pingTimerRef.current) clearInterval(pingTimerRef.current);
        pingTimerRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            try { ws.send(JSON.stringify({ type: 'ping' })); } catch {}
          }
        }, 30000);
        pendingQueueRef.current.forEach((msg) => {
          try { ws.send(JSON.stringify(msg)); } catch {}
        });
        pendingQueueRef.current = [];
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          if (msg.type === 'pong') return;
          handlersRef.current.forEach((h) => {
            try { h(msg); } catch (e) { console.warn('[WS] handler err:', e); }
          });
        } catch { /* ignore */ }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected, reconnecting in 3s...');
        if (pingTimerRef.current) {
          clearInterval(pingTimerRef.current);
          pingTimerRef.current = null;
        }
        reconnectTimerRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        try { ws.close(); } catch {}
      };

      wsRef.current = ws;
    } catch (err) {
      console.error('[WS] Connect failed:', err);
      reconnectTimerRef.current = setTimeout(connect, 3000);
    }
  }, []);

  const onMessage = useCallback((handler: MessageHandler) => {
    handlersRef.current.add(handler);
    return () => { handlersRef.current.delete(handler); };
  }, []);

  const sendMessage = useCallback((msg: Sendable) => {
    const ws = wsRef.current;
    const str = JSON.stringify(msg);
    if (ws && ws.readyState === WebSocket.OPEN) {
      try { ws.send(str); return true; } catch {}
    }
    pendingQueueRef.current.push(msg);
    if (pendingQueueRef.current.length > 100) pendingQueueRef.current.shift();
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (pingTimerRef.current) clearInterval(pingTimerRef.current);
      if (wsRef.current) {
        try { wsRef.current.close(); } catch {}
        wsRef.current = null;
      }
    };
  }, [connect]);

  const connected = wsRef.current?.readyState === WebSocket.OPEN;

  return { onMessage, sendMessage, connected };
}
