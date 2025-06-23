import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { plan_id, subscription_type } = await request.json()

    // Support both plan_id (structured) and subscription_type (direct) upgrades
    if (!plan_id && !subscription_type) {
      return new NextResponse('Plan ID or subscription type is required', { status: 400 })
    }

    // Use the super free upgrade endpoint if subscription_type is provided
    const endpoint = subscription_type ? '/billing/upgrade-free' : '/billing/upgrade'
    const body = subscription_type ? { subscription_type } : { plan_id }

    // Forward the request to the backend
    const response = await fetch(`${process.env.BACKEND_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
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
    console.error('Upgrade error:', error)
    return new NextResponse('Internal server error', { status: 500 })
  }
} 