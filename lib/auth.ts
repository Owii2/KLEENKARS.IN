import crypto from 'crypto';
import { prisma } from '@/lib/prisma';

export function generateRawToken(len = 64) {
  return crypto.randomBytes(len).toString('hex');
}

export function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createRefreshToken(customerId: string, days = 30) {
  const raw = generateRawToken(64);
  const tokenHash = hashToken(raw);
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  const rec = await prisma.refreshToken.create({ data: { tokenHash, customerId, expiresAt } });
  return { raw, rec };
}

export async function rotateRefreshToken(oldTokenHash: string, customerId?: string) {
  const old = await prisma.refreshToken.findUnique({ where: { tokenHash: oldTokenHash } });
  if (!old) return null;
  if (old.revoked) return null;
  if (new Date() > old.expiresAt) return null;

  // create new token
  const { raw, rec } = await createRefreshToken(customerId || old.customerId);

  // mark old revoked and set replacedBy
  await prisma.refreshToken.update({ where: { id: old.id }, data: { revoked: true, replacedBy: rec.id } });

  return { raw, rec };
}

export async function revokeRefreshTokenByHash(tokenHash: string) {
  const t = await prisma.refreshToken.findUnique({ where: { tokenHash } });
  if (!t) return false;
  await prisma.refreshToken.update({ where: { id: t.id }, data: { revoked: true } });
  return true;
}
import jwt from "jsonwebtoken";

const JWT_SECRET =
  process.env.JWT_SECRET || "kleenkars_secret";

export type AuthRole = "admin" | "manager" | "supervisor" | "staff" | string;

export interface AuthUser {
  id: string;
  role: AuthRole;
  name: string;
}

export function createToken(data: AuthUser) {

  return jwt.sign(data, JWT_SECRET, {
    expiresIn: "7d",
  });

}

export function verifyToken(token: string): AuthUser | null {

  try {

    return jwt.verify(token, JWT_SECRET) as AuthUser;

  } catch {

    return null;

  }

}

export function sanitizeIdentifier(identifier: string): string {
  if (!identifier) return "";
  const trimmed = identifier.trim();
  const digits = trimmed.replace(/\D/g, "");
  // If it's a phone-like string (only contains +, digits, spaces, parentheses, dashes) and has at least 10 digits, get the last 10 digits.
  if (digits.length >= 10 && /^[+\d\s()-]+$/.test(trimmed)) {
    return digits.slice(-10);
  }
  return trimmed;
}

export async function generateNextCustomerId(): Promise<string> {
  const customers = await prisma.customer.findMany({
    where: {
      id: {
        startsWith: "KKSC"
      }
    },
    select: {
      id: true
    }
  });

  let maxNum = 0;
  for (const c of customers) {
    const match = c.id.match(/^KKSC(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) {
        maxNum = num;
      }
    }
  }

  const nextNum = maxNum + 1;
  return `KKSC${String(nextNum).padStart(3, '0')}`;
}
