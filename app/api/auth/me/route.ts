import { NextResponse } from 'next/server';
import { getAuthCookie } from '@/lib/auth/cookies';
import { getCurrentUser } from '@/lib/auth/kamiwaza';

export async function GET() {
  try {
    const token = await getAuthCookie();
    if (!token) {
      return NextResponse.json(null);
    }

    const user = await getCurrentUser(token);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Failed to get user:', error);
    return NextResponse.json(null);
  }
} 