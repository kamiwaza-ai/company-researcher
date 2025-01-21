// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser, getKamiwazaToken } from '@/lib/auth/kamiwaza';
import { setAuthCookie } from '@/lib/auth/cookies';

export async function POST(request: NextRequest) {
  console.log('🟢 API: Login request received');
  try {
    const { username, password } = await request.json();
    console.log('🟢 API: Attempting login for username:', username);

    // Get token from Kamiwaza
    console.log('🟢 API: Calling getKamiwazaToken...');
    const tokenResponse = await getKamiwazaToken(username, password);
    console.log('🟢 API: Token response received');

    // Get user info using token
    console.log('🟢 API: Getting user info...');
    await getCurrentUser(tokenResponse.access_token);
    console.log('🟢 API: User info retrieved');

    // Set the auth cookie
    console.log('🟢 API: Setting auth cookie...');
    await setAuthCookie(tokenResponse.access_token);
    console.log('🟢 API: Auth cookie set');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('🔴 API: Login error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}