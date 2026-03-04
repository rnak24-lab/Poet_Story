// NextAuth placeholder - not actively used (localStorage-based auth)
// Keep this route for future Kakao/Naver OAuth integration
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({ message: 'Auth endpoint placeholder' });
}

export async function POST() {
  return NextResponse.json({ message: 'Auth endpoint placeholder' });
}
