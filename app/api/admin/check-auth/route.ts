import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const auth = await requireUser()
    if (!auth) {
      return NextResponse.json({ authenticated: false }, { status: 401 })
    }
    return NextResponse.json({ authenticated: true, userId: auth.user.id })
  } catch (error) {
    console.error('[v0] Auth check error:', error)
    return NextResponse.json({ authenticated: false }, { status: 401 })
  }
}
