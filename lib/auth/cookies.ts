import { cookies } from 'next/headers';

const AUTH_COOKIE = 'access_token';

export async function setAuthCookie(token: string) {
  const cookieStore = cookies();
  cookieStore.set({
    name: AUTH_COOKIE,
    value: token,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  });
}

export async function getAuthCookie(): Promise<string | undefined> {
  const cookieStore = cookies();
  return cookieStore.get(AUTH_COOKIE)?.value;
}

export async function removeAuthCookie() {
  const cookieStore = cookies();
  cookieStore.delete(AUTH_COOKIE);
}
