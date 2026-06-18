import { WebSocketServer, WebSocket } from 'ws';
import type { Server as HTTPServer } from 'http';
import type { WSMessage } from '../../shared/types.js';

let wss: WebSocketServer | null = null;
const clients = new Set<WebSocket>();

export function initWebSocketServer(server: HTTPServer): void {
  wss = new WebSocketServer({ server, path: '/ws' });
  console.log('[WS] WebSocket server initialized at /ws');

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('[WS] Client connected, total:', clients.size);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        }
      } catch { /* ignore */ }
    });

    ws.on('close', () => {
      clients.delete(ws);
      console.log('[WS] Client disconnected, total:', clients.size);
    });

    ws.on('error', () => {
      clients.delete(ws);
    });
  });
}

export function broadcastMessage(message: WSMessage): void {
  if (!wss) return;
  const data = JSON.stringify(message);
  for (const client of clients) {
    if (client.readyState === WebSocket.OPEN) {
      try {
        client.send(data);
      } catch { /* ignore */ }
    }
  }
}

export function sendToClient(ws: WebSocket, message: WSMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}
