import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'bd_session';
const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60;

function getSecret(): Uint8Array {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('NEXTAUTH_SECRET must be set to at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ ...user })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: SESSION_DURATION_SECONDS,
    path: '/',
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      email: payload.email as string,
      name: payload.name as string | null,
      role: payload.role as string,
    };
  } catch {
    return null;
  }
}

export async function destroySession(): Promise<void> {
  cookies().delete(SESSION_COOKIE);
}

export async function requireAuth(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) {
    throw new Response('Unauthorized', { status: 401 });
  }
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireAuth();
  if (session.role !== 'admin') {
    throw new Response('Forbidden', { status: 403 });
  }
  return session;
}
