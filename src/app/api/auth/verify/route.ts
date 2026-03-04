import { NextRequest, NextResponse } from 'next/server';
import { getStoredCode, deleteStoredCode } from '@/lib/verification-store';
import { createServerSupabase } from '@/lib/supabase';

export async function POST(req: NextRequest) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: '이메일과 인증 코드를 입력해주세요.' }, { status: 400 });
    }

    // Check in-memory store first
    const memCode = getStoredCode(email);
    
    // Also check DB
    const supabase = createServerSupabase();
    let dbCode: string | null = null;
    let dbExpired = false;
    
    if (supabase) {
      const { data: user } = await supabase
        .from('users')
        .select('verification_code, verification_expires_at')
        .eq('email', email)
        .single();
      
      if (user?.verification_code) {
        dbCode = user.verification_code;
        if (user.verification_expires_at && new Date(user.verification_expires_at) < new Date()) {
          dbExpired = true;
        }
      }
    }

    const validCode = memCode || (!dbExpired ? dbCode : null);

    if (!validCode) {
      return NextResponse.json(
        { error: '인증 코드가 만료되었거나 존재하지 않습니다. 재발송해주세요.' },
        { status: 400 }
      );
    }

    if (validCode !== code) {
      return NextResponse.json(
        { error: '인증 코드가 일치하지 않습니다.' },
        { status: 400 }
      );
    }

    // Code matches! Update DB
    if (supabase) {
      await supabase
        .from('users')
        .update({ 
          is_email_verified: true, 
          verification_code: null,
          verification_expires_at: null,
        })
        .eq('email', email);
    }

    // Clean up memory
    deleteStoredCode(email);

    // Return updated user data
    let userData = null;
    if (supabase) {
      const { data: user } = await supabase
        .from('users')
        .select('id, email, name, avatar, pencils, referral_code, is_email_verified, is_admin, collected_flowers, created_at')
        .eq('email', email)
        .single();
      
      if (user) {
        userData = {
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
        };
      }
    }

    return NextResponse.json({ verified: true, user: userData });

  } catch (error) {
    console.error('Verify error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
