import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

/**
 * Simple text export for snapshot UI (no PDF engine in BFF).
 * Browser downloads a .txt file; users can rename or open in Word.
 */
export async function POST(req: Request) {
  try {
    const cookieStore = cookies()
    const token = cookieStore.get('auth_token')?.value
    if (!token) {
      return NextResponse.json({ detail: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const content = typeof body?.content === 'string' ? body.content : ''
    const format = body?.format === 'docx' ? 'docx' : 'pdf'

    const filename = format === 'docx' ? 'resume.txt' : 'resume.txt'

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (e) { 
    console.error('resume export:', e)
    return NextResponse.json({ detail: 'Export failed' }, { status: 500 })
  }
}
