import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    console.log('[API /widget/log]', payload);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[API /widget/log] Error logging widget event:', error);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
