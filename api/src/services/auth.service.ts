import bcrypt from 'bcryptjs';
import * as userRepo from '../repositories/user.repo.js';
import { generateAccessToken } from '../middleware/auth.js';
import type { AuthResponse, LoginRequest, RegisterRequest, User } from '../../../shared/types.js';

export async function login(data: LoginRequest): Promise<AuthResponse> {
  const userWithPass = userRepo.findUserWithPassword(data.username);
  if (!userWithPass) {
    throw new Error('用户名或密码错误');
  }
  const valid = await bcrypt.compare(data.password, userWithPass.passwordHash);
  if (!valid) {
    throw new Error('用户名或密码错误');
  }
  const { passwordHash: _ignored, ...user } = userWithPass;
  const accessToken = generateAccessToken({ id: user.id, username: user.username });
  return { user: user as User, accessToken };
}

export async function register(data: RegisterRequest): Promise<AuthResponse> {
  if (!data.username || data.username.length < 3) throw new Error('用户名至少3个字符');
  if (!data.password || data.password.length < 6) throw new Error('密码至少6个字符');
  if (userRepo.findUserByUsername(data.username)) throw new Error('用户名已存在');

  const passwordHash = await bcrypt.hash(data.password, 10);
  const user = userRepo.createUser({
    username: data.username,
    email: data.email || `${data.username}@example.com`,
    passwordHash,
  });
  const accessToken = generateAccessToken({ id: user.id, username: user.username });
  return { user, accessToken };
}
