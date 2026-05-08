import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { fetchBackend } from '@/lib/server/backendBaseUrl';

export async function GET() {
  try {
    // Get the auth token
    const cookieStore = cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required' }),
        { status: 401 }
      );
    }

    // Get dashboard data from backend
    const backendResponse = await fetchBackend('/api/dashboard', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json().catch(() => ({}));
      console.error('❌ Backend dashboard error:', errorData);
      const message =
        (errorData && errorData.error && errorData.error.message) ||
        errorData.detail ||
        'Failed to get dashboard data'
      return new NextResponse(
        JSON.stringify({ message }),
        { status: backendResponse.status }
      );
    }

    const data = await backendResponse.json();
    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ Dashboard error:', error);
    return new NextResponse(
      JSON.stringify({ message: 'An error occurred while fetching dashboard data' }),
      { status: 500 }
    );
  }
} 