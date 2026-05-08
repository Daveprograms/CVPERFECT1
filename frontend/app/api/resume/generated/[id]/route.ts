import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

function getToken(request: NextRequest): string | null {
  const cookieStore = cookies()
  const cookieToken = cookieStore.get('auth_token')?.value
  const headerToken = request.headers.get('authorization')?.replace('Bearer ', '') || ''
  return headerToken || cookieToken || null
}

async function proxy(request: NextRequest, id: string, method: 'GET' | 'PUT' | 'DELETE') {
  const token = getToken(request)
  if (!token) {
    return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
  }

  const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'}/api/resume/generated/${id}`
  const init: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  }

  if (method === 'PUT') {
    init.body = await request.text()
  }

  const response = await fetch(backendUrl, init)
  const data = await response.json().catch(() => ({}))
  return NextResponse.json(data, { status: response.status })
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    return await proxy(request, params.id, 'GET')
  } catch (error) {
    console.error('Generated resume get proxy error:', error)
    return NextResponse.json({ detail: 'Failed to fetch generated resume' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    return await proxy(request, params.id, 'PUT')
  } catch (error) {
    console.error('Generated resume update proxy error:', error)
    return NextResponse.json({ detail: 'Failed to update generated resume' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    return await proxy(request, params.id, 'DELETE')
  } catch (error) {
    console.error('Generated resume delete proxy error:', error)
    return NextResponse.json({ detail: 'Failed to delete generated resume' }, { status: 500 })
  }
}
