const ACCESS_TOKEN_KEY = 'cs_access_token';
const PLAY_TOKENS_KEY = 'cs_play_tokens';

export function getAccessToken(): string | null {
  try {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(ACCESS_TOKEN_KEY, token);
  } catch { /* ignore */ }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
  } catch { /* ignore */ }
}

interface PlayTokenRecord {
  token: string;
  expiresAt: number;
  userId?: number;
}

function readPlayTokens(): Record<number, PlayTokenRecord> {
  try {
    const raw = localStorage.getItem(PLAY_TOKENS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as Record<number, PlayTokenRecord>;
  } catch {
    return {};
  }
}

function writePlayTokens(tokens: Record<number, PlayTokenRecord>): void {
  try {
    localStorage.setItem(PLAY_TOKENS_KEY, JSON.stringify(tokens));
  } catch { /* ignore */ }
}

export function getPlayToken(videoId: number, currentUserId?: number): PlayTokenRecord | null {
  const all = readPlayTokens();
  const rec = all[videoId];
  if (!rec) return null;
  if (rec.expiresAt <= Date.now()) {
    delete all[videoId];
    writePlayTokens(all);
    return null;
  }
  if (currentUserId !== undefined && rec.userId !== undefined && rec.userId !== currentUserId) {
    return null;
  }
  return rec;
}

export function savePlayToken(token: { videoId: number; token: string; expiresAt: number; userId?: number }): void;
export function savePlayToken(videoId: number, token: string, expiresAt: number, userId?: number): void;
export function savePlayToken(
  videoIdOrObj: number | { videoId: number; token: string; expiresAt: number; userId?: number },
  maybeToken?: string,
  maybeExpiresAt?: number,
  maybeUserId?: number,
): void {
  const all = readPlayTokens();
  if (typeof videoIdOrObj === 'number') {
    all[videoIdOrObj] = { token: maybeToken || '', expiresAt: maybeExpiresAt || 0, userId: maybeUserId };
  } else {
    all[videoIdOrObj.videoId] = { token: videoIdOrObj.token, expiresAt: videoIdOrObj.expiresAt, userId: videoIdOrObj.userId };
  }
  writePlayTokens(all);
}

export function setPlayToken(videoId: number, token: string, expiresAt: number, userId?: number): void {
  savePlayToken(videoId, token, expiresAt, userId);
}

export function clearPlayToken(videoId: number): void {
  const all = readPlayTokens();
  delete all[videoId];
  writePlayTokens(all);
}

export function clearAllPlayTokens(): void {
  writePlayTokens({});
}

export function clearPlayTokensByUserId(userId: number): void {
  const all = readPlayTokens();
  const filtered: Record<number, PlayTokenRecord> = {};
  for (const [k, v] of Object.entries(all)) {
    if (v.userId !== undefined && v.userId !== userId) {
      filtered[Number(k)] = v;
    }
  }
  writePlayTokens(filtered);
}
