import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth'
import { revalidatePath } from 'next/cache'
import { slugify } from '@/lib/slugify'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('case_studies')
      .select('*')
      .order('order_index', { ascending: true })
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
    const { id, title, thumbnail_url, video_url, media_type, excerpt, sections, nav_items, published, cta_text, cta_link, blocks, related_article_id, isUpdate } = body
    const slug = slugify(title || '')
    if (!title?.trim() || !slug) return NextResponse.json({ error: 'A valid title is required' }, { status: 400 })

    if (isUpdate && id) {
      const { data, error } = await supabase
        .from('case_studies')
        .update({ title, slug, thumbnail_url, video_url, media_type, excerpt, sections, nav_items, published, cta_text, cta_link, blocks, related_article_id: related_article_id || null })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      revalidatePath('/')
      return NextResponse.json({ data })
    } else {
      const { data: lastCaseStudy } = await supabase
        .from('case_studies')
        .select('order_index')
        .eq('user_id', user.id)
        .order('order_index', { ascending: false })
        .limit(1)
        .maybeSingle()
      const order_index = (lastCaseStudy?.order_index ?? -1) + 1
      const { data, error } = await supabase
        .from('case_studies')
        .insert([{ user_id: user.id, title, slug, thumbnail_url, video_url, media_type, excerpt, sections, nav_items, published, cta_text, cta_link, blocks, related_article_id: related_article_id || null, order_index }])
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

export async function PATCH(request: Request) {
  try {
    const auth = await requireUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { supabase, user } = auth
    const { orderedIds } = await request.json()
    if (!Array.isArray(orderedIds) || orderedIds.some((id) => typeof id !== 'string')) {
      return NextResponse.json({ error: 'A valid orderedIds list is required' }, { status: 400 })
    }

    const { data: ownedCaseStudies, error: ownershipError } = await supabase
      .from('case_studies')
      .select('id')
      .eq('user_id', user.id)
    if (ownershipError) return NextResponse.json({ error: ownershipError.message }, { status: 400 })
    const ownedIds = new Set((ownedCaseStudies || []).map((item) => item.id))
    if (orderedIds.length !== ownedIds.size || new Set(orderedIds).size !== ownedIds.size || orderedIds.some((id) => !ownedIds.has(id))) {
      return NextResponse.json({ error: 'The order must include every case study exactly once' }, { status: 400 })
    }

    const updates = await Promise.all(orderedIds.map((id, order_index) =>
      supabase.from('case_studies').update({ order_index }).eq('id', id).eq('user_id', user.id)
    ))
    const failedUpdate = updates.find(({ error }) => error)
    if (failedUpdate?.error) return NextResponse.json({ error: failedUpdate.error.message }, { status: 400 })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to reorder case studies' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const auth = await requireUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const { supabase } = auth
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

    const { error } = await supabase.from('case_studies').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    revalidatePath('/')
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete case study' }, { status: 500 })
  }
}
