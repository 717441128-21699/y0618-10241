import { create } from 'zustand';
import type { User, AuthResponse, LoginRequest, RegisterRequest } from '../../shared/types';
import { getAccessToken, setAccessToken, clearAccessToken, clearAllPlayTokens } from '../utils/token';
import client from '../api/client';

interface AuthState {
  user: User | null;
  accessToken: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;

  login(username: string, password: string): Promise<void>;
  login(req: LoginRequest): Promise<void>;
  register(username: string, email: string, password: string): Promise<void>;
  register(req: RegisterRequest): Promise<void>;
  logout: () => void;
  initAuth: () => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: getAccessToken(),
  isLoading: false,
  error: null,
  isAuthenticated: !!getAccessToken(),

  login: async (usernameOrReq: string | LoginRequest, maybePassword?: string) => {
    set({ isLoading: true, error: null });
    const req: LoginRequest =
      typeof usernameOrReq === 'string'
        ? { username: usernameOrReq, password: maybePassword || '' }
        : usernameOrReq;
    try {
      const res = await client.post<AuthResponse>('/auth/login', req);
      const { user, accessToken } = res.data;
      clearAllPlayTokens();
      setAccessToken(accessToken);
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({
        error: (err as { response?: { data?: { error?: string } } }).response?.data?.error || '登录失败',
        isLoading: false,
      });
      throw err;
    }
  },

  register: async (
    usernameOrReq: string | RegisterRequest,
    maybeEmail?: string,
    maybePassword?: string,
  ) => {
    set({ isLoading: true, error: null });
    const req: RegisterRequest =
      typeof usernameOrReq === 'string'
        ? { username: usernameOrReq, email: maybeEmail || '', password: maybePassword || '' }
        : usernameOrReq;
    try {
      const res = await client.post<AuthResponse>('/auth/register', req);
      const { user, accessToken } = res.data;
      clearAllPlayTokens();
      setAccessToken(accessToken);
      set({ user, accessToken, isAuthenticated: true, isLoading: false });
    } catch (err) {
      set({
        error: (err as { response?: { data?: { error?: string } } }).response?.data?.error || '注册失败',
        isLoading: false,
      });
      throw err;
    }
  },

  logout: () => {
    clearAccessToken();
    clearAllPlayTokens();
    set({ user: null, accessToken: null, isAuthenticated: false });
  },

  initAuth: async () => {
    const token = get().accessToken;
    const prevUserId = get().user?.id;
    if (!token) return;
    try {
      const res = await client.get<{ user: User }>('/auth/me');
      const newUser = res.data.user;
      if (prevUserId && prevUserId !== newUser.id) {
        clearAllPlayTokens();
      }
      set({ user: newUser });
    } catch {
      clearAccessToken();
      clearAllPlayTokens();
      set({ user: null, accessToken: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),
}));
