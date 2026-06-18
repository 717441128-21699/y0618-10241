import { prepareGet, prepareRun } from '../database.js';
import type { User } from '../../../shared/types.js';

interface UserRow {
  id: number;
  username: string;
  email: string;
  password_hash: string;
  avatar: string;
  created_at: string;
}

export function mapUserRow(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    email: row.email,
    avatar: row.avatar,
    createdAt: row.created_at,
  };
}

export function findUserById(id: number): User | null {
  const row = prepareGet<UserRow>('SELECT * FROM users WHERE id = ?', [id]);
  return row ? mapUserRow(row) : null;
}

export function findUserByUsername(username: string): User | null {
  const row = prepareGet<UserRow>('SELECT * FROM users WHERE username = ?', [username]);
  return row ? mapUserRow(row) : null;
}

export function findUserWithPassword(login: string): (User & { passwordHash: string }) | null {
  const row = prepareGet<UserRow>(
    'SELECT * FROM users WHERE username = ? OR email = ?',
    [login, login]
  );
  if (!row) return null;
  return { ...mapUserRow(row), passwordHash: row.password_hash };
}

export function createUser(data: { username: string; email: string; passwordHash: string }): User {
  const result = prepareRun(
    'INSERT INTO users (username, email, password_hash) VALUES ($username, $email, $passwordHash)',
    { $username: data.username, $email: data.email, $passwordHash: data.passwordHash }
  );
  return findUserById(result.lastInsertRowid)!;
}
