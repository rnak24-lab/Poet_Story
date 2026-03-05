import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    // Admin shortcut
    if (email === 'admin' && password === 'huruhi24!') {
      return NextResponse.json({
        user: {
          id: 'admin',
          email: 'admin@sigeuldam.kr',
          name: '관리자',
          avatar: '👑',
          pencils: 999,
          isAdmin: true,
          isEmailVerified: true,
          referralCode: 'ADMIN',
          collectedFlowers: [],
          createdAt: '2026-01-01T00:00:00.000Z',
        }
      });
    }

    const supabase = createServerSupabase();
    if (!supabase) {
      return NextResponse.json({ error: '서버 설정 오류입니다. 잠시 후 다시 시도해주세요.' }, { status: 503 });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email.trim())
      .single();

    if (!user || error) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 틀렸습니다.' }, { status: 401 });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return NextResponse.json({ error: '이메일 또는 비밀번호가 틀렸습니다.' }, { status: 401 });
    }

    // Check withdrawal status
    if (user.withdrawal_requested_at) {
      const requestedAt = new Date(user.withdrawal_requested_at);
      const now = new Date();
      const daysPassed = Math.floor((now.getTime() - requestedAt.getTime()) / (1000 * 60 * 60 * 24));
      const daysLeft = 15 - daysPassed;

      if (daysPassed >= 15) {
        return NextResponse.json({ error: '탈퇴 처리가 완료된 계정입니다.' }, { status: 403 });
      }

      // Return user info + withdrawal info so frontend can offer recovery
      return NextResponse.json({
        withdrawalPending: true,
        daysLeft,
        withdrawalRequestedAt: user.withdrawal_requested_at,
        user: {
          id: user.id, email: user.email, name: user.name,
          avatar: user.avatar || '🌸', pencils: user.pencils || 0,
          isAdmin: user.is_admin || false, isEmailVerified: true,
          referralCode: user.referral_code,
          collectedFlowers: user.collected_flowers || [],
          createdAt: user.created_at,
        }
      });
    }

    // Check email verification
    if (!user.is_email_verified) {
      return NextResponse.json({
        error: '이메일 인증이 필요합니다.',
        needsVerification: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar || '🌸',
          pencils: user.pencils || 0,
          isAdmin: user.is_admin || false,
          isEmailVerified: false,
          referralCode: user.referral_code,
          collectedFlowers: user.collected_flowers || [],
          createdAt: user.created_at,
        }
      }, { status: 403 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar || '🌸',
        pencils: user.pencils || 0,
        isAdmin: user.is_admin || false,
        isEmailVerified: true,
        referralCode: user.referral_code,
        collectedFlowers: user.collected_flowers || [],
        createdAt: user.created_at,
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
