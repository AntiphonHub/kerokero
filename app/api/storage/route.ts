import { NextRequest, NextResponse } from 'next/server';
import { getR2Object } from '@/lib/r2/storage';

export const instant = false;

export async function GET(request: NextRequest) {
  const key = request.nextUrl.searchParams.get('key');
  if (!key) {
    return new NextResponse('Key not provided', { status: 400 });
  }

  // Security check: only allow safe keys (alphanumeric, slash, underscore, hyphen, dot)
  if (!/^[a-zA-Z0-9_\-\/\.]+$/.test(key)) {
    return new NextResponse('Invalid key', { status: 400 });
  }

  const obj = await getR2Object(key);
  if (!obj) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(obj.body as unknown as BodyInit, {
    headers: {
      'Content-Type': obj.contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
