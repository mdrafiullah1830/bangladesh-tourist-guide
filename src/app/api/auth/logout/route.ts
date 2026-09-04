import { NextResponse } from 'next/server';
import { destroySession } from '@/lib/auth/session';
import { NextRequest } from 'next/server';
import { assertSameOrigin } from '@/lib/api/csrf';

export async function POST(request: NextRequest) {
  const csrfError = assertSameOrigin(request);
  if (csrfError) return csrfError;

  await destroySession();
  return NextResponse.json({ success: true });
}
