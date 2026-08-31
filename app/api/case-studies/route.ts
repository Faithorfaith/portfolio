import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

const slugify = (value: string) => value
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '')

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data }, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch case studies' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { supabase, user } = auth
    const body = await request.json()
    const { id, title, thumbnail_url, video_url, media_type, excerpt, sections, nav_items, published, cta_text, cta_link, blocks, isUpdate } = body
    const slug = slugify(title || '')
    if (!title?.trim() || !slug) return NextResponse.json({ error: 'A valid title is required' }, { status: 400 })

    if (isUpdate && id) {
      const { data, error } = await supabase
        .from('case_studies')
        .update({ title, slug, thumbnail_url, video_url, media_type, excerpt, sections, nav_items, published, cta_text, cta_link, blocks })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      revalidatePath('/')
      return NextResponse.json({ data })
    } else {
      const { data, error } = await supabase
        .from('case_studies')
        .insert([{ user_id: user.id, title, slug, thumbnail_url, video_url, media_type, excerpt, sections, nav_items, published, cta_text, cta_link, blocks }])
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      revalidatePath('/')
      return NextResponse.json({ data })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save case study' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { supabase, user } = auth
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase.from('case_studies').delete().eq('id', id).eq('user_id', user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete case study' }, { status: 500 })
  }
}
