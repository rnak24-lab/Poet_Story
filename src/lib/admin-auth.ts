import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import crypto from 'crypto';

// ============================================================
// Admin Authentication & Session Management
// ============================================================

const ADMIN_TOKEN_SECRET = process.env.ADMIN_TOKEN_SECRET || 'sigeuldam-admin-secret-2026';
const ADMIN_TOKEN_EXPIRY_HOURS = 24;

interface AdminSession {
  adminId: string;
  email: string;
  name: string;
  issuedAt: number;
  expiresAt: number;
}

/**
 * Generate a signed admin session token
 */
export function generateAdminToken(adminId: string, email: string, name: string): string {
  const now = Date.now();
  const session: AdminSession = {
    adminId,
    email,
    name,
    issuedAt: now,
    expiresAt: now + ADMIN_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000,
  };
  const payload = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', ADMIN_TOKEN_SECRET)
    .update(payload)
    .digest('base64url');
  return `${payload}.${signature}`;
}

/**
 * Verify and decode an admin session token
 */
export function verifyAdminToken(token: string): AdminSession | null {
  try {
    const [payload, signature] = token.split('.');
    if (!payload || !signature) return null;

    const expectedSig = crypto
      .createHmac('sha256', ADMIN_TOKEN_SECRET)
      .update(payload)
      .digest('base64url');

    if (signature !== expectedSig) return null;

    const session: AdminSession = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    );

    // Check expiry
    if (Date.now() > session.expiresAt) return null;

    return session;
  } catch {
    return null;
  }
}

/**
 * Check admin authentication from request headers
 * Uses 'x-admin-token' header with signed token
 */
export async function checkAdmin(req: NextRequest): Promise<{ id: string; name: string; email: string } | null> {
  // New secure token-based auth
  const token = req.headers.get('x-admin-token');
  if (token) {
    const session = verifyAdminToken(token);
    if (session) {
      return { id: session.adminId, name: session.name, email: session.email };
    }
  }

  // Legacy: x-admin-id header for backward compatibility (will be removed later)
  // Only allow if admin ID matches a real admin user in the DB
  const adminId = req.headers.get('x-admin-id');
  if (adminId) {
    // Check env-based admin
    const envAdminEmail = process.env.ADMIN_EMAIL;
    if (adminId === 'admin' && envAdminEmail) {
      return { id: 'admin', name: '관리자', email: envAdminEmail };
    }
    // Check DB-based admin
    const supabase = createServerSupabase();
    if (supabase) {
      const { data } = await supabase.from('users').select('id, is_admin, name, email').eq('id', adminId).single();
      if (data?.is_admin) {
        return { id: data.id, name: data.name, email: data.email };
      }
    }
  }

  return null;
}

/**
 * Validate admin login credentials
 * Returns admin info if credentials are valid, null otherwise
 */
export async function validateAdminLogin(email: string, password: string): Promise<{ id: string; email: string; name: string; avatar: string } | null> {
  // 1. Check env-based admin credentials
  const envEmail = process.env.ADMIN_EMAIL;
  const envPassword = process.env.ADMIN_PASSWORD;
  if (envEmail && envPassword && email === envEmail && password === envPassword) {
    return {
      id: 'admin',
      email: envEmail,
      name: '관리자',
      avatar: '👑',
    };
  }

  // 2. Check DB-based admin user
  const supabase = createServerSupabase();
  if (!supabase) return null;

  const bcrypt = (await import('bcryptjs')).default;
  const { data: user } = await supabase
    .from('users')
    .select('id, email, name, avatar, password_hash, is_admin')
    .eq('email', email.trim())
    .single();

  if (!user || !user.is_admin) return null;

  // If the user has a password_hash, verify it
  if (user.password_hash) {
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return null;
  }

  return {
    id: user.id,
    email: user.email,
    name: user.name || '관리자',
    avatar: user.avatar || '👑',
  };
}

// ============================================================
// Admin Access Logging
// ============================================================

interface AdminLogEntry {
  adminId: string;
  adminName: string;
  adminEmail: string;
  action: string;
  targetType?: string;
  targetId?: string;
  details?: string;
  req?: NextRequest;
}

/**
 * Record an admin action to the admin_logs table
 */
export async function logAdminAction(entry: AdminLogEntry): Promise<void> {
  try {
    const supabase = createServerSupabase();
    if (!supabase) {
      console.warn('[AdminLog] Supabase not available, skipping log');
      return;
    }

    const ipAddress = entry.req?.headers.get('x-forwarded-for')
      || entry.req?.headers.get('x-real-ip')
      || 'unknown';
    const userAgent = entry.req?.headers.get('user-agent') || 'unknown';

    await supabase.from('admin_logs').insert({
      admin_id: entry.adminId,
      admin_name: entry.adminName,
      admin_email: entry.adminEmail,
      action: entry.action,
      target_type: entry.targetType || null,
      target_id: entry.targetId || null,
      details: entry.details || null,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error('[AdminLog] Failed to write log:', error);
  }
}
