import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    if (!token) {
      return new NextResponse(
        JSON.stringify({ message: 'Not authenticated' }),
        { status: 401 }
      )
    }

    // Fetch real subscription data from backend
    const response = await fetch(`${process.env.BACKEND_URL}/api/auth/subscription-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    if (!response.ok) {
      console.error('Failed to fetch subscription status:', response.status)
      // Return a default free subscription if backend fails
      return NextResponse.json({
        subscription_type: 'FREE',
        subscription_status: 'active',
        can_upload: true,
        uploads_used: 0,
        upload_limit: 1,
        features: {
          resume_uploads: 1,
          ai_analysis: true,
          ai_scans_per_week: 1,
          pdf_export: true,
          docx_export: false,
          resume_templates: 0,
    
          job_matching: false,
          premium_chat: false,
          versioning: false
        }
      })
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('❌ Subscription check failed:', error)
    return new NextResponse(
      JSON.stringify({ message: 'Failed to get subscription info' }),
      { status: 500 }
    )
  }
} 