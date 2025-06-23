import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('🔍 DOWNLOAD API DEBUG START')
  console.log('📥 Request URL:', request.url)
  console.log('📥 Params:', JSON.stringify(params, null, 2))
  
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('access_token')?.value
    
    console.log('🍪 Access token found:', !!token)
    console.log('🍪 Token preview:', token ? `${token.substring(0, 20)}...` : 'null')

    if (!token) {
      console.log('❌ No access token - returning 401')
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'pdf'
    const resumeId = params.id
    
    console.log('📄 Format requested:', format)
    console.log('🔗 Search params:', JSON.stringify(Object.fromEntries(searchParams.entries()), null, 2))

    const backendUrl = `${process.env.BACKEND_URL}/resumes/download/${resumeId}?format=${format}`
    console.log('🌐 Backend URL:', backendUrl)
    console.log('🌐 Environment BACKEND_URL:', process.env.BACKEND_URL)

    console.log('📤 Making request to backend...')
    const response = await fetch(backendUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log('📨 Backend response status:', response.status)
    console.log('📨 Backend response headers:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2))

    if (!response.ok) {
      if (response.status === 404) {
        console.log('❌ Resume not found - returning 404')
        return new NextResponse('Resume not found', { status: 404 })
      }
      const errorText = await response.text()
      console.log('❌ Backend error response:', errorText)
      console.log('❌ Backend error status:', response.status)
      return new NextResponse('Failed to download report', { status: 500 })
    }

    // Get the content and headers from the backend response
    console.log('📥 Getting content from backend...')
    const content = await response.arrayBuffer()
    console.log('📥 Content size:', content.byteLength, 'bytes')
    
    const contentDisposition = response.headers.get('Content-Disposition') || `attachment; filename="resume_analysis_${resumeId.slice(0, 8)}.${format}"`
    const contentType = response.headers.get('Content-Type') || 'application/octet-stream'
    
    console.log('📄 Content-Disposition:', contentDisposition)
    console.log('📄 Content-Type:', contentType)

    const responseHeaders = {
      'Content-Type': contentType,
      'Content-Disposition': contentDisposition,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
    
    console.log('📤 Response headers to send:', JSON.stringify(responseHeaders, null, 2))
    console.log('✅ DOWNLOAD API SUCCESS - sending file')

    // Return the file with proper headers
    return new NextResponse(content, {
      status: 200,
      headers: responseHeaders
    })
  } catch (error: any) {
    console.log('❌ DOWNLOAD API ERROR:', error)
    console.log('❌ Error message:', error.message)
    console.log('❌ Error stack:', error.stack)
    console.log('❌ Error object:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2))
    return new NextResponse('Internal server error', { status: 500 })
  }
} 