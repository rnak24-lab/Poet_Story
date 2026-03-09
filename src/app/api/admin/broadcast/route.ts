import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase';
import { checkAdmin, logAdminAction } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// POST /api/admin/broadcast — bulk actions (pencils, notifications, emails)
export async function POST(req: NextRequest) {
  const admin = await checkAdmin(req);
  if (!admin) return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 403 });

  const supabase = createServerSupabase()!;
  const { action, pencilCount, message, emailSubject, emailBody } = await req.json();

  // ======================
  // 1. Bulk pencil grant
  // ======================
  if (action === 'grant_pencils') {
    const count = parseInt(pencilCount);
    if (!count || count < 1 || count > 100) {
      return NextResponse.json({ error: '연필 수량은 1~100 사이로 입력해주세요.' }, { status: 400 });
    }

    // Get all active users (not withdrawn)
    const { data: users, error: fetchErr } = await supabase
      .from('users')
      .select('id, pencils')
      .is('withdrawal_requested_at', null);

    if (fetchErr || !users) {
      return NextResponse.json({ error: '회원 조회 실패' }, { status: 500 });
    }

    // Update each user's pencils (batch via individual updates for safety)
    let successCount = 0;
    let failCount = 0;
    for (const user of users) {
      const { error } = await supabase
        .from('users')
        .update({ pencils: (user.pencils || 0) + count })
        .eq('id', user.id);
      if (error) failCount++;
      else successCount++;
    }

    // Send notification to all users
    const notifications = users.map(u => ({
      user_id: u.id,
      type: 'achievement' as const,
      message: `관리자가 연필 ${count}자루를 선물했어요! ✏️`,
      is_read: false,
    }));

    if (notifications.length > 0) {
      // Supabase insert in batches of 500
      for (let i = 0; i < notifications.length; i += 500) {
        const batch = notifications.slice(i, i + 500);
        await supabase.from('notifications').insert(batch);
      }
    }

    await logAdminAction({
      adminId: admin.id, adminName: admin.name, adminEmail: admin.email,
      action: 'bulk_grant_pencils', targetType: 'user',
      details: `전체 회원에게 연필 ${count}자루 지급 (성공: ${successCount}, 실패: ${failCount})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `${successCount}명에게 연필 ${count}자루를 지급했습니다.${failCount > 0 ? ` (실패: ${failCount}명)` : ''}`,
    });
  }

  // ======================
  // 2. Bulk notification (in-app message)
  // ======================
  if (action === 'send_notification') {
    if (!message || message.trim().length < 2) {
      return NextResponse.json({ error: '메시지를 2자 이상 입력해주세요.' }, { status: 400 });
    }

    const { data: users, error: fetchErr } = await supabase
      .from('users')
      .select('id')
      .is('withdrawal_requested_at', null);

    if (fetchErr || !users) {
      return NextResponse.json({ error: '회원 조회 실패' }, { status: 500 });
    }

    const notifications = users.map(u => ({
      user_id: u.id,
      type: 'system' as const,
      message: message.trim(),
      is_read: false,
    }));

    let insertedCount = 0;
    for (let i = 0; i < notifications.length; i += 500) {
      const batch = notifications.slice(i, i + 500);
      const { error } = await supabase.from('notifications').insert(batch);
      if (!error) insertedCount += batch.length;
    }

    await logAdminAction({
      adminId: admin.id, adminName: admin.name, adminEmail: admin.email,
      action: 'bulk_send_notification', targetType: 'user',
      details: `전체 회원에게 알림 전송: "${message.trim().slice(0, 50)}..." (${insertedCount}명)`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `${insertedCount}명에게 알림을 보냈습니다.`,
    });
  }

  // ======================
  // 3. Bulk email
  // ======================
  if (action === 'send_email') {
    if (!emailSubject || !emailBody) {
      return NextResponse.json({ error: '제목과 내용을 모두 입력해주세요.' }, { status: 400 });
    }

    const resendKey = process.env.RESEND_API_KEY;
    if (!resendKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY가 설정되지 않았습니다.' }, { status: 500 });
    }

    // Get all verified email users (not withdrawn, email verified)
    const { data: users, error: fetchErr } = await supabase
      .from('users')
      .select('id, email, name')
      .eq('is_email_verified', true)
      .is('withdrawal_requested_at', null);

    if (fetchErr || !users) {
      return NextResponse.json({ error: '회원 조회 실패' }, { status: 500 });
    }

    // Filter out admin and sample accounts
    const realUsers = users.filter(u => u.email && !u.id.startsWith('sample-') && u.id !== 'admin');

    let sentCount = 0;
    let failCount = 0;

    // Send emails one by one (Resend free tier has rate limits)
    for (const user of realUsers) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: '시글담 <noreply@sigeuldam.kr>',
            to: user.email,
            subject: emailSubject.trim(),
            html: `
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #FAFAF8;">
                <div style="text-align: center; margin-bottom: 24px;">
                  <span style="font-size: 48px;">🌸</span>
                  <h1 style="color: #1A1A1A; font-size: 20px; margin: 12px 0 4px;">시글담</h1>
                </div>
                <div style="background: white; border-radius: 16px; padding: 24px; border: 1px solid #eee;">
                  <p style="color: #666; font-size: 14px; margin: 0 0 8px;">${user.name || '시인'}님에게,</p>
                  <div style="color: #333; font-size: 14px; line-height: 1.7; white-space: pre-wrap;">${emailBody.trim()}</div>
                </div>
                <p style="color: #999; font-size: 11px; text-align: center; margin-top: 20px;">
                  이 메일은 시글담(sigeuldam.kr)에서 발송되었습니다.
                </p>
              </div>
            `,
          }),
        });
        if (res.ok) sentCount++;
        else failCount++;
      } catch {
        failCount++;
      }

      // Rate limiting: 100ms delay between emails
      await new Promise(r => setTimeout(r, 100));
    }

    await logAdminAction({
      adminId: admin.id, adminName: admin.name, adminEmail: admin.email,
      action: 'bulk_send_email', targetType: 'user',
      details: `전체 이메일 발송: "${emailSubject.trim().slice(0, 30)}..." (성공: ${sentCount}, 실패: ${failCount})`,
      req,
    });

    return NextResponse.json({
      success: true,
      message: `${sentCount}명에게 이메일을 보냈습니다.${failCount > 0 ? ` (실패: ${failCount}명)` : ''}`,
    });
  }

  return NextResponse.json({ error: '알 수 없는 액션' }, { status: 400 });
}
