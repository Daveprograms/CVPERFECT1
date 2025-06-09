import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST() {
  try {
    const cookieStore = cookies()
    cookieStore.delete('auth_token')

    return new NextResponse(null, { status: 200 })
  } catch (error) {
    console.error('Logout failed:', error)
    return new NextResponse(null, { status: 500 })
  }
} 