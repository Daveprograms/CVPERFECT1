import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value

    console.log('=== RESUME UPLOAD DEBUG ===')
    console.log('1. Auth token exists:', !!token)
    console.log('2. Request content-type:', req.headers.get('content-type'))

    if (!token) {
      console.log('❌ No auth token found')
      return new NextResponse(JSON.stringify({ detail: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Parse form data to log details
    const formData = await req.formData()
    const file = formData.get('file') as File
    const jobDescription = formData.get('job_description') as string
    const linkedinUrl = formData.get('linkedin_url') as string

    console.log('3. File details:', {
      name: file?.name,
      size: file?.size,
      type: file?.type,
      hasFile: !!file
    })
    console.log('4. Job description length:', jobDescription?.length || 0)
    console.log('5. LinkedIn URL provided:', !!linkedinUrl)

    // Recreate FormData for backend
    const backendFormData = new FormData()
    if (file) backendFormData.append('file', file)
    if (jobDescription) backendFormData.append('job_description', jobDescription)
    if (linkedinUrl) backendFormData.append('linkedin_url', linkedinUrl)

    console.log('6. Sending request to backend...')

    // Forward the request to the backend
    const response = await fetch('http://localhost:8000/api/resume/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: backendFormData
    });

    console.log('7. Backend response status:', response.status)
    console.log('8. Backend response headers:', Object.fromEntries(response.headers.entries()))

    if (!response.ok) {
      const contentType = response.headers.get('content-type')
      let errorDetails
      
      if (contentType && contentType.includes('application/json')) {
        errorDetails = await response.json()
        console.log('❌ Backend JSON error:', JSON.stringify(errorDetails, null, 2))
      } else {
        errorDetails = await response.text()
        console.log('❌ Backend text error:', errorDetails)
      }
      
      throw new Error(errorDetails.detail || errorDetails || 'Failed to upload resume')
    }

    const data = await response.json()
    console.log('✅ Upload successful, response keys:', Object.keys(data))
    console.log('=== END DEBUG ===')
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('❌ Resume upload error:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    return new NextResponse(
      JSON.stringify({ detail: error?.message || error?.toString() || 'Failed to upload resume' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
} 
