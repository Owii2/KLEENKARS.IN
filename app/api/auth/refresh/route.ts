import { NextResponse } from 'next/server';
import { verifyToken, signToken, COOKIE_MAX_AGE } from '@/lib/jwt';
import { hashToken, rotateRefreshToken } from '@/lib/auth';

interface RefreshPayload {
  id?: string;
  role?: string;
}

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || '';
    const match = cookie.match(/refreshToken=([^;]+)/);
    if (!match) return NextResponse.json({ success: false, message: 'No refresh token' }, { status: 401 });
    const refreshTokenRaw = match[1];
    const tokenHash = hashToken(refreshTokenRaw);

    // rotate token in DB
    const initialPayload = verifyToken(refreshTokenRaw) as RefreshPayload | null;
    const rotated = await rotateRefreshToken(tokenHash, initialPayload?.id || undefined);
    // Note: rotateRefreshToken verifies expiry and revoked state.
    if (!rotated) {
      // Try to find matching token by hash to obtain customer id
      return NextResponse.json({ success: false, message: 'Invalid or expired refresh token' }, { status: 401 });
    }

    // rotated.rec contains new token record and rotated.raw is the raw token
    // issue new access token
    const payload = verifyToken(refreshTokenRaw) as RefreshPayload | null;
    const newAccess = signToken({ id: payload?.id ?? rotated.rec.customerId, role: payload?.role ?? 'customer' });
    const maxAge = COOKIE_MAX_AGE;
    const secureAttr = process.env.NODE_ENV === 'production' ? 'Secure; ' : '';
    const cookieStr = `token=${newAccess}; HttpOnly; Path=/; Max-Age=${maxAge}; SameSite=Lax; ${secureAttr}`;
    const refreshCookie = `refreshToken=${rotated.raw}; HttpOnly; Path=/; Max-Age=${60 * 60 * 24 * 30}; SameSite=Lax; ${secureAttr}`;

    const response = new NextResponse(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
    response.headers.append('Set-Cookie', cookieStr);
    response.headers.append('Set-Cookie', refreshCookie);

    return response;
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
