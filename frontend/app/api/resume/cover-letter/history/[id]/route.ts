import { NextRequest, NextResponse } from 'next/server'

async function proxy(request: NextRequest, method: 'PUT' | 'DELETE', id: string) {
  const authHeader = request.headers.get('authorization') || ''
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/resume/cover-letter/history/${id}`
  const init: RequestInit = {
    method,
    headers: {
      Authorization: authHeader,
      'Content-Type': 'application/json'
    }
  }

  if (method === 'PUT') {
    init.body = await request.text()
  }

  const backendResponse = await fetch(backendUrl, init)
  const data = await backendResponse.json().catch(() => ({}))
  return NextResponse.json(data, { status: backendResponse.status })
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    return await proxy(request, 'PUT', params.id)
  } catch (error) {
    console.error('Cover letter update error:', error)
    return NextResponse.json({ error: 'Failed to update cover letter' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    return await proxy(request, 'DELETE', params.id)
  } catch (error) {
    console.error('Cover letter delete error:', error)
    return NextResponse.json({ error: 'Failed to delete cover letter' }, { status: 500 })
  }
}