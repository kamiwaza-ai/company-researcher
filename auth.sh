
#!/bin/bash

# Create auth directories
mkdir -p lib/auth
mkdir -p app/\(auth\)/login
mkdir -p app/api/auth/login

# Create auth utility files
cat > lib/auth/types.ts << 'EOL'
export interface KamiwazaTokenResponse {
    access_token: string;
    token_type: 'bearer';
    expires_in: number;
    refresh_token: null;
    id_token: null;
}

export interface KamiwazaUser {
    username: string;
    email: string;
    full_name: string | null;
    organization_id: string | null;
    is_superuser: boolean;
    external_id: string | null;
    id: string;
    is_active: boolean;
    groups: string[];
    created_at: string;
    updated_at: string | null;
    last_login: string | null;
}
EOL

cat > lib/auth/cookies.ts << 'EOL'
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
EOL

cat > lib/auth/kamiwaza.ts << 'EOL'
import { KamiwazaTokenResponse, KamiwazaUser } from './types';

const KAMIWAZA_URI = process.env.KAMIWAZA_URI;

if (!KAMIWAZA_URI) {
  throw new Error('KAMIWAZA_URI environment variable is not set');
}

export async function getKamiwazaToken(username: string, password: string): Promise<KamiwazaTokenResponse> {
  const response = await fetch(`${KAMIWAZA_URI}/auth/token`, {
    method: 'POST',
    headers: {
      'accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'password',
      username,
      password,
      scope: '',
      client_id: 'string',
      client_secret: 'string'
    }),
  });

  if (!response.ok) {
    throw new Error('Authentication failed');
  }

  return response.json();
}

export async function verifyKamiwazaToken(token: string): Promise<KamiwazaUser> {
  const response = await fetch(`${KAMIWAZA_URI}/auth/verify-token`, {
    headers: {
      'accept': 'application/json',
      'Cookie': `access_token=${token}`
    },
  });

  if (!response.ok) {
    throw new Error('Token verification failed');
  }

  return response.json();
}

export async function getCurrentUser(token: string): Promise<KamiwazaUser> {
  const response = await fetch(`${KAMIWAZA_URI}/auth/users/me`, {
    headers: {
      'accept': 'application/json',
      'Cookie': `access_token=${token}`
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch user data');
  }

  return response.json();
}
EOL

# Create middleware
cat > middleware.ts << 'EOL'
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookie } from '@/lib/auth/cookies';
import { verifyKamiwazaToken } from '@/lib/auth/kamiwaza';

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  if (path === '/login') {
    const token = await getAuthCookie();
    if (token) {
      try {
        await verifyKamiwazaToken(token);
        return NextResponse.redirect(new URL('/', request.url));
      } catch {
        // Token is invalid, continue to login page
      }
    }
    return NextResponse.next();
  }

  const token = await getAuthCookie();
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    await verifyKamiwazaToken(token);
    return NextResponse.next();
  } catch (error) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|login|api/auth).*)',
  ],
};
EOL

# Create login page
cat > app/\(auth\)/login/page.tsx << 'EOL'
'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState<string>();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.get('username'),
          password: formData.get('password'),
        }),
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (error) {
      setError('Invalid credentials');
    }
  }

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-background">
      <div className="w-full max-w-md rounded-lg border p-8">
        <h1 className="mb-6 text-2xl font-bold">Sign In</h1>
        
        {error && (
          <div className="mb-4 rounded bg-red-100 p-3 text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              className="mt-1 block w-full rounded-md border p-2"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="mt-1 block w-full rounded-md border p-2"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
}
EOL

# Create login API route
cat > app/api/auth/login/route.ts << 'EOL'
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getKamiwazaToken } from '@/lib/auth/kamiwaza';
import { setAuthCookie } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    const { access_token } = await getKamiwazaToken(username, password);
    await getCurrentUser(access_token);
    await setAuthCookie(access_token);

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}
EOL



echo "Authentication files created successfully!"
echo "Don't forget to:"
echo "1. Copy .env.local.example to .env.local and set your KAMIWAZA_URI"
echo "2. Add necessary dependencies to package.json"
echo "3. Run npm install"