import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({
        success: false,
        message: 'Developer code is required'
      })
    }

    if (!token) {
      return NextResponse.json({ success: false, message: 'Authentication required' }, { status: 401 })
    }

    const response = await fetchBackend('/api/auth/validate-developer-code', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ code })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return NextResponse.json({
        success: false,
        message: errorData.detail || 'Failed to validate developer code'
      })
    }

    const data = await response.json()
    
    // If user wasn't logged in but developer code was valid, 
    // add a message to prompt them to sign in
    if (!token && data.success) {
      data.message = data.message + ' Please sign in to access your upgraded account.'
      data.requiresSignIn = true
    }
    
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error validating developer code:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 