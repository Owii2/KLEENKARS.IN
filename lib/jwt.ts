import jwt from 'jsonwebtoken';
import type { SignOptions } from 'jsonwebtoken';

if (!process.env.JWT_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error("FATAL: JWT_SECRET environment variable is missing in production mode.");
}

const JWT_SECRET = process.env.JWT_SECRET || 'kleenkars_dev_fallback_secret_key_change_in_prod';

export function signToken(payload: object, expiresIn: SignOptions["expiresIn"] = '7d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days in seconds

export const REFRESH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export function signRefreshToken(payload: object, expiresIn: SignOptions["expiresIn"] = '30d') {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}
