import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    if (!(await requireUser())) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    const supabase = await createClient()

    // Get all profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')

    console.log('[v0] Debug: All profiles:', { profiles, profilesError })

    // Try to fetch first profile
    if (profiles && profiles.length > 0) {
      return NextResponse.json({
        success: true,
        totalProfiles: profiles.length,
        firstProfile: profiles[0],
        allProfiles: profiles,
      })
    } else {
      return NextResponse.json({
        success: false,
        message: 'No profiles found',
        error: profilesError,
      })
    }
  } catch (error) {
    console.error('[v0] Debug endpoint error:', error)
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    )
  }
}
