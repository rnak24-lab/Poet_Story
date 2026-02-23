import { NextRequest, NextResponse } from 'next/server';

/*
  관리자 알림 API
  
  에러 발생 시 관리자에게 이메일을 보냄.
  
  이메일 전송 방법 (우선순위):
  1. Resend API (RESEND_API_KEY 설정 시)
  2. 콘솔 로그 + 인메모리 저장 (키 없을 때 — 데모 모드)
  
  환경변수:
  - RESEND_API_KEY: Resend API 키 (resend.com에서 발급)
  - ADMIN_EMAIL: 알림 받을 이메일 (기본: admin@sigeuldam.kr)
  - ADMIN_FROM_EMAIL: 발신 이메일 (기본: alerts@sigeuldam.kr)
*/

// 인메모리 에러 로그 (DB 없을 때 임시 저장)
const errorLogs: Array<{
  type: string;
  message: string;
  userName: string;
  userEmail: string;
  statusCode?: number;
  timestamp: string;
  notified: boolean;
}> = [];

// Rate limit: 같은 타입 에러는 5분에 1번만 이메일 발송
const lastNotified: Record<string, number> = {};
const RATE_LIMIT_MS = 5 * 60 * 1000; // 5분

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, message, userName, userEmail, statusCode, timestamp } = body;

    // 에러 로그 인메모리 저장 (최근 200개)
    errorLogs.push({
      type: type || 'UNKNOWN',
      message: message || '',
      userName: userName || '',
      userEmail: userEmail || '',
      statusCode,
      timestamp: timestamp || new Date().toISOString(),
      notified: false,
    });
    if (errorLogs.length > 200) errorLogs.shift();

    // Rate limit 체크
    const now = Date.now();
    const lastTime = lastNotified[type] || 0;
    if (now - lastTime < RATE_LIMIT_MS) {
      console.log(`[NOTIFY] Rate limited: ${type} (last notified ${Math.round((now - lastTime) / 1000)}s ago)`);
      return NextResponse.json({ logged: true, emailed: false, reason: 'rate_limited' });
    }

    // 이메일 전송 시도
    const resendKey = process.env.RESEND_API_KEY;
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@sigeuldam.kr';
    const fromEmail = process.env.ADMIN_FROM_EMAIL || 'alerts@sigeuldam.kr';

    if (resendKey) {
      // ===== Resend로 실제 이메일 전송 =====
      try {
        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: `시글담 알림 <${fromEmail}>`,
            to: adminEmail,
            subject: `🚨 [시글담] 자동완성 오류 — ${type}`,
            html: buildEmailHtml({ type, message, userName, userEmail, statusCode, timestamp }),
          }),
        });

        if (emailResponse.ok) {
          lastNotified[type] = now;
          errorLogs[errorLogs.length - 1].notified = true;
          console.log(`[NOTIFY] Email sent to ${adminEmail} for ${type}`);
          return NextResponse.json({ logged: true, emailed: true });
        } else {
          const err = await emailResponse.text().catch(() => '');
          console.error(`[NOTIFY] Resend failed: ${emailResponse.status}`, err);
        }
      } catch (emailErr) {
        console.error('[NOTIFY] Email send error:', emailErr);
      }
    }

    // ===== 이메일 키 없음 — 콘솔 + 인메모리만 =====
    lastNotified[type] = now;
    console.warn(`\n${'='.repeat(60)}`);
    console.warn(`🚨 [시글담 관리자 알림] 자동완성 오류 발생!`);
    console.warn(`${'='.repeat(60)}`);
    console.warn(`에러 타입: ${type}`);
    console.warn(`메시지: ${message}`);
    console.warn(`사용자: ${userName || '알 수 없음'} (${userEmail || '이메일 없음'})`);
    if (statusCode) console.warn(`HTTP 상태: ${statusCode}`);
    console.warn(`시간: ${timestamp}`);
    console.warn(`${'='.repeat(60)}\n`);
    console.warn(`💡 실제 이메일 알림을 받으려면 환경변수를 설정하세요:`);
    console.warn(`   RESEND_API_KEY=re_xxxxx`);
    console.warn(`   ADMIN_EMAIL=your@email.com\n`);

    return NextResponse.json({ logged: true, emailed: false, reason: 'no_email_key' });

  } catch (error) {
    console.error('[NOTIFY] Route error:', error);
    return NextResponse.json({ error: 'Notification failed' }, { status: 500 });
  }
}

// GET: 관리자가 최근 에러 로그를 볼 수 있음 (관리자 대시보드용)
export async function GET(req: NextRequest) {
  // 간단한 인증 (쿼리 파라미터 or 헤더)
  const authHeader = req.headers.get('x-admin-key');
  const url = new URL(req.url);
  const key = url.searchParams.get('key');
  
  const adminKey = process.env.ADMIN_API_KEY || 'sigeuldam-admin-2026';
  
  if (authHeader !== adminKey && key !== adminKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.json({
    total: errorLogs.length,
    logs: errorLogs.slice(-50).reverse(), // 최근 50개
    summary: {
      last24h: errorLogs.filter(l => Date.now() - new Date(l.timestamp).getTime() < 86400000).length,
      byType: errorLogs.reduce((acc, l) => {
        acc[l.type] = (acc[l.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
  });
}

// ===== 이메일 HTML 템플릿 =====
function buildEmailHtml(info: {
  type: string;
  message: string;
  userName?: string;
  userEmail?: string;
  statusCode?: number;
  timestamp: string;
}): string {
  const typeEmoji: Record<string, string> = {
    'NO_API_KEY': '🔑',
    'AUTH_FAILED': '🔐',
    'RATE_LIMIT': '⏱️',
    'SERVER_DOWN': '💀',
    'TIMEOUT': '⏰',
    'NETWORK_ERROR': '🌐',
    'EMPTY_RESPONSE': '📭',
    'CRITICAL_ERROR': '🔥',
  };

  const typeLabel: Record<string, string> = {
    'NO_API_KEY': 'API 키 미설정',
    'AUTH_FAILED': 'API 인증 실패',
    'RATE_LIMIT': '요청 한도 초과',
    'SERVER_DOWN': 'AI 서버 다운',
    'TIMEOUT': '응답 시간 초과',
    'NETWORK_ERROR': '네트워크 오류',
    'EMPTY_RESPONSE': '빈 응답',
    'CRITICAL_ERROR': '서버 내부 오류',
  };

  const emoji = typeEmoji[info.type] || '⚠️';
  const label = typeLabel[info.type] || info.type;
  const time = new Date(info.timestamp).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' });

  return `
    <div style="font-family: -apple-system, 'Pretendard', sans-serif; max-width: 500px; margin: 0 auto; padding: 32px 16px;">
      <div style="background: #FFF5F0; border-radius: 16px; padding: 24px; border: 1px solid #FFE0D0;">
        <h1 style="font-size: 20px; color: #2A2A2A; margin: 0 0 16px 0;">
          ${emoji} 시글담 자동완성 오류
        </h1>
        
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr>
            <td style="padding: 8px 0; color: #999; width: 100px;">에러 타입</td>
            <td style="padding: 8px 0; color: #2A2A2A; font-weight: 600;">
              <span style="background: #FF4444; color: white; padding: 2px 8px; border-radius: 8px; font-size: 12px;">${label}</span>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 0; color: #999;">사용자</td>
            <td style="padding: 8px 0; color: #2A2A2A;">${info.userName || '알 수 없음'}</td>
          </tr>
          ${info.userEmail ? `
          <tr>
            <td style="padding: 8px 0; color: #999;">이메일</td>
            <td style="padding: 8px 0; color: #2A2A2A;">${info.userEmail}</td>
          </tr>` : ''}
          ${info.statusCode ? `
          <tr>
            <td style="padding: 8px 0; color: #999;">HTTP 상태</td>
            <td style="padding: 8px 0; color: #FF4444; font-weight: 600;">${info.statusCode}</td>
          </tr>` : ''}
          <tr>
            <td style="padding: 8px 0; color: #999;">발생 시간</td>
            <td style="padding: 8px 0; color: #2A2A2A;">${time}</td>
          </tr>
        </table>
        
        <div style="background: white; border-radius: 12px; padding: 16px; margin-top: 16px;">
          <p style="font-size: 12px; color: #999; margin: 0 0 8px 0;">상세 메시지</p>
          <pre style="font-size: 13px; color: #2A2A2A; white-space: pre-wrap; word-break: break-all; margin: 0; font-family: 'Menlo', monospace;">${info.message}</pre>
        </div>
      </div>
      
      <p style="font-size: 11px; color: #CCC; text-align: center; margin-top: 16px;">
        시글담 자동 알림 시스템 · 같은 에러는 5분에 1회만 전송됩니다
      </p>
    </div>
  `;
}
