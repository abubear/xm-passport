import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'xm-passport-dev-secret-change-in-production';
const TOKEN_NAME = 'xm-passport-token';

export interface UserPayload {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string;
  rank: string;
  is_admin: number;
  auth_provider: string;
}

export function signToken(payload: UserPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): UserPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as UserPayload;
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export function getAuthToken(): string | undefined {
  const cookieStore = cookies();
  return cookieStore.get(TOKEN_NAME)?.value;
}

export function clearAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(TOKEN_NAME);
}
