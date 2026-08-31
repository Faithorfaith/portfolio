import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { substackUrl, userId } = await request.json()

    if (!substackUrl || !userId || userId !== auth.user.id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Placeholder: In a real implementation, you would scrape the Substack publication
    // and extract the articles. For now, we'll return a success message.
    
    return NextResponse.json({
      success: true,
      message: 'Writing import initiated. Articles will be imported soon.',
    })
  } catch (error) {
    console.error('[v0] Writing import error:', error)
    return NextResponse.json(
      { error: 'Failed to import writings' },
      { status: 500 }
    )
  }
}
