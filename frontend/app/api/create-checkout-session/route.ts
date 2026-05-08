import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { fetchBackend } from '@/lib/server/backendBaseUrl'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { plan_id } = await request.json()

    if (!plan_id) {
      return new NextResponse('Plan ID is required', { status: 400 })
    }

    // Forward the request to the backend
    const response = await fetchBackend('/api/billing/create-checkout-session', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ plan_id })
    })

    if (!response.ok) {
      const errorData = await response.json()
      return new NextResponse(JSON.stringify(errorData), { 
        status: response.status,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Checkout session error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 