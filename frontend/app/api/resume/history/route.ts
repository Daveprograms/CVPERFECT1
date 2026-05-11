export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = searchParams.get('page') || '1'
    const limit = searchParams.get('limit') || '10'
    
    // Prefer Authorization header; fall back to cookie (same as /api/auth/me)
    const cookieStore = cookies()
    const cookieToken = cookieStore.get('auth_token')?.value
    const authHeader = request.headers.get('authorization') || (cookieToken ? `Bearer ${cookieToken}` : '')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const response = await fetch(`${BACKEND_URL}/api/resume/history?page=${page}&limit=${limit}`, {
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`)
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error fetching feedback history:', error)
    return NextResponse.json({ error: 'Failed to fetch feedback history' }, { status: 500 })
  }
} 