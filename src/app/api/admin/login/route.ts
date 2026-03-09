import { NextRequest, NextResponse } from 'next/server';
import { validateAdminLogin, generateAdminToken, logAdminAction } from '@/lib/admin-auth';

export const dynamic = 'force-dynamic';

// POST /api/admin/login — dedicated admin login
export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: '이메일과 비밀번호를 입력해주세요.' }, { status: 400 });
    }

    const admin = await validateAdminLogin(email, password);
    if (!admin) {
      return NextResponse.json({ error: '관리자 권한이 없거나 로그인 정보가 틀렸습니다.' }, { status: 401 });
    }

    // Generate secure session token
    const token = generateAdminToken(admin.id, admin.email, admin.name);

    // Log admin login
    await logAdminAction({
      adminId: admin.id, adminName: admin.name, adminEmail: admin.email,
      action: 'login', details: '관리자 로그인',
      req,
    });

    return NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        avatar: admin.avatar,
        isAdmin: true,
      },
      token,
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다.' }, { status: 500 });
  }
}
