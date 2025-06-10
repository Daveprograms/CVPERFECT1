import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return new NextResponse(JSON.stringify({ detail: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Log headers before proxying
    console.log('Proxying upload to backend with headers:', {
      'Authorization': `Bearer ${token}`,
      'content-type': req.headers.get('content-type')
    });

    // Forward the raw request body and headers to the backend
    const response = await fetch('http://localhost:8000/api/resume/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'content-type': req.headers.get('content-type') || ''
      },
      body: req.body as any,
      duplex: 'half'
    } as any);

    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to upload resume')
      } else {
        const text = await response.text()
        throw new Error(text || 'Failed to upload resume')
      }
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Resume upload error:', error, error?.message, error?.stack);
    return new NextResponse(
      JSON.stringify({ detail: error?.message || error?.toString() || 'Failed to upload resume' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 