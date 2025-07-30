import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

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
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8003'}/api/dashboard`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json();
      console.error('❌ Backend dashboard error:', errorData);
      return new NextResponse(
        JSON.stringify({ message: errorData.detail || 'Failed to get dashboard data' }),
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