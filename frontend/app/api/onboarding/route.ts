import { NextResponse, NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const onboardingData = await req.json()

    console.log('📝 Onboarding data received:', onboardingData)

    // Get the auth token from Authorization header
    const token = req.headers.get('authorization')?.replace('Bearer ', '')

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'Authentication required' }),
        { status: 401 }
      )
    }

    // Send data to backend
    const backendResponse = await fetch(`${process.env.BACKEND_URL || 'http://localhost:8000'}/api/onboarding`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(onboardingData)
    })

    if (!backendResponse.ok) {
      const errorData = await backendResponse.json()
      console.error('❌ Backend onboarding error:', errorData)
      return new NextResponse(
        JSON.stringify({ message: errorData.detail || 'Failed to save onboarding data' }),
        { status: backendResponse.status }
      )
    }

    const result = await backendResponse.json()
    console.log('✅ Onboarding completed successfully')

    return NextResponse.json({
      success: true,
      message: 'Onboarding completed successfully',
      data: result
    })

  } catch (error: any) {
    console.error('❌ Onboarding error:', error)
    return new NextResponse(
      JSON.stringify({ message: 'An error occurred during onboarding' }),
      { status: 500 }
    )
  }
} 