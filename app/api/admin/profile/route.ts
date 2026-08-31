import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    console.log('[v0] Auth check - user:', user?.id, 'error:', userError)
    
    if (userError || !user) {
      console.error('[v0] Auth failed:', userError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[v0] Profile save request - user:', user.id, 'body:', body)

    // Upsert profile with server-side auth context
    const { data, error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: body.username,
        full_name: body.full_name || null,
        bio: body.bio || null,
        avatar_url: body.avatar_url || null,
        hero_image_1: body.hero_image_1 || null,
        hero_image_2: body.hero_image_2 || null,
        hero_image_3: body.hero_image_3 || null,
        gallery_images: Array.isArray(body.gallery_images) ? body.gallery_images : [],
      })
      .select()
      .single()

    console.log('[v0] Upsert response:', { data, upsertError })

    if (upsertError) {
      console.error('[v0] Profile upsert error:', upsertError)
      return NextResponse.json(
        { error: upsertError.message || 'Failed to save profile' },
        { status: 400 }
      )
    }

    revalidatePath('/')
    return NextResponse.json({ data })
  } catch (error) {
    console.error('[v0] Profile save error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
