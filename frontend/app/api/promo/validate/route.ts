import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// This would typically come from your database
const VALID_PROMO_CODES = {
  'DEV2024': {
    type: 'developer',
    maxResumes: 3,
    features: [
      'unlimited_resume_analysis',
      'priority_support',
      'advanced_ai_features',
      'resume_templates',
      'detailed_feedback',
      'job_matching_insights'
    ],
    expiresAt: new Date('2024-12-31').toISOString(),
  },
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { code } = await req.json()

    if (!code) {
      return new NextResponse('Promo code is required', { status: 400 })
    }

    const promoCode = VALID_PROMO_CODES[code as keyof typeof VALID_PROMO_CODES]

    if (!promoCode) {
      return new NextResponse('Invalid promo code', { status: 400 })
    }

    // Here you would typically:
    // 1. Check if the user has already used this code
    // 2. Update the user's subscription in your database
    // 3. Set the resume limit
    // 4. Add the promo code to the user's history

    // For now, we'll just return success
    return NextResponse.json({
      message: 'Promo code applied successfully',
      promoCode,
    })
  } catch (error) {
    console.error('Error validating promo code:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 