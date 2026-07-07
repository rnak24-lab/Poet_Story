import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// ============================================================
// User Session Authentication (HMAC-signed cookie)
//
// Mirrors the admin token pattern in admin-auth.ts, but for
// regular users. The signed session cookie is the ONLY trusted
// source of a caller's userId on protected endpoints — never
// trust a userId sent in the request body.
//
// SECURITY: set USER_SESSION_SECRET in the environment before
// deploying. The fallback constant below is only for local dev;
// if it ships to production every user token becomes forgeable.
// ============================================================

const USER_SESSION_SECRET = process.env.USER_SESSION_SECRET || 'sigeuldam-user-secret-2026';
const SESSION_EXPIRY_DAYS = 30;
const SESSION_MAX_AGE = SESSION_EXPIRY_DAYS * 24 * 60 * 60; // seconds

export const SESSION_COOKIE = 'sd_session';

interface UserSession {
  userId: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Generate a signed user session token.
 */
export function generateUserToken(userId: string): string {
  const now = Date.now();
  const session: UserSession = {
    userId,
    issuedAt: now,
    expiresAt: now + SESSION_MAX_AGE * 1000,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', USER_SESSION_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verify and decode a user session token. Returns null if the
 * signature is invalid, the token is malformed, or it has expired.
 */
export function verifyUserToken(token: string): UserSession | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', USER_SESSION_SECRET)
      .update(payload)
      .digest('base64url');

    // Constant-time compare to avoid timing leaks on the signature.
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSig);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }

    const session: UserSession = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    );

    if (Date.now() > session.expiresAt) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Derive the caller's userId from the signed session cookie.
 * This is the trusted identity source for all protected endpoints.
 * Returns null when there is no valid session.
 */
export function getSessionUserId(req: NextRequest): string | null {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = verifyUserToken(token);
  return session?.userId ?? null;
}

/**
 * Attach a freshly-signed session cookie to a response.
 * Call this at every login-finalizing endpoint.
 */
export function setSessionCookie(res: NextResponse, userId: string): void {
  res.cookies.set(SESSION_COOKIE, generateUserToken(userId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  });
}

/**
 * Clear the session cookie (logout).
 */
export function clearSessionCookie(res: NextResponse): void {
  res.cookies.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}
