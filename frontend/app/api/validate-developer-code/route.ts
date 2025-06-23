import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value

    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({
        success: false,
        message: 'Developer code is required'
      })
    }

    // If no token, use a test token for developer code validation
    const authToken = token || 'test-token-for-developer-code'

    // Forward the request to the backend
    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/validate-developer-code`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
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