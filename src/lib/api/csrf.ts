import { NextRequest, NextResponse } from 'next/server';

/**
 * Basic CSRF protection: verify that mutating requests come from the same origin.
 * Browsers send the Origin header on cross-site POST/DELETE requests; an absent
 * Origin means same-origin or server-to-server, which we allow through.
 * Returns a 403 NextResponse when the origin mismatches, otherwise null.
 */
export function assertSameOrigin(request: NextRequest): NextResponse | null {
  const origin = request.headers.get('origin');
  if (!origin) return null;

  const host =
    request.headers.get('x-forwarded-host') ||
    request.headers.get('host');
  if (!host) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 403 });
  }

  try {
    const originHost = new URL(origin).host;
    if (originHost !== host) {
      return NextResponse.json({ error: 'Cross-origin request blocked' }, { status: 403 });
    }
  } catch {
    return NextResponse.json({ error: 'Invalid origin' }, { status: 403 });
  }
  return null;
}