import { NextRequest, NextResponse } from 'next/server';
import { storeWidget } from '@/lib/widgetCache';

export async function POST(request: NextRequest) {
  try {
    const { html, toolOutput, toolResponseMetadata } = await request.json();

    if (!html) {
      return NextResponse.json({ error: 'Missing html' }, { status: 400 });
    }

    const id = storeWidget(html, toolOutput, toolResponseMetadata);

    return NextResponse.json({ id });
  } catch (error) {
    console.error('[API /widget/store] Error:', error);
    return NextResponse.json(
      { error: 'Failed to store widget' },
      { status: 500 }
    );
  }
}

