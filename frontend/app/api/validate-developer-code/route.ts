import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// In a real application, you would store these codes in a database
// and validate them against a list of valid codes
const VALID_DEVELOPER_CODES = ['CVPERFECT2024']

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session:', session)

    if (!session?.user) {
      console.log('No session or user found')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await req.json()
    console.log('Request body:', body)
    const { code } = body

    if (!code) {
      console.log('No code provided')
      return NextResponse.json({
        success: false,
        message: 'Developer code is required'
      })
    }

    console.log('Received code:', code)
    console.log('Valid codes:', VALID_DEVELOPER_CODES)
    console.log('Code matches:', VALID_DEVELOPER_CODES.includes(code.toUpperCase()))

    // Check if the code is valid
    if (!VALID_DEVELOPER_CODES.includes(code.toUpperCase())) {
      return NextResponse.json({
        success: false,
        message: 'Invalid developer code'
      })
    }

    // Here you would update your database to grant pro access
    // For example:
    // await db.user.update({
    //   where: { id: session.user.id },
    //   data: {
    //     subscriptionType: 'pro',
    //     subscriptionStatus: 'active',
    //     subscriptionEndDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    //   },
    // })

    return NextResponse.json({
      success: true,
      message: 'Developer code activated successfully'
    })
  } catch (error) {
    console.error('Error validating developer code:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 