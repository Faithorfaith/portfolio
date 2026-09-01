import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { slugify } from '@/lib/slugify'

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { supabase, user } = auth
    const { id, title, slug, content, excerpt, cover_image, published, isUpdate } = await request.json()

    if (!title?.trim()) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const payload = {
      title,
      slug: slugify(title),
      content,
      excerpt: excerpt || null,
      cover_image: cover_image || null,
      published: published ?? false,
      updated_at: new Date().toISOString(),
    }

    if (isUpdate && id) {
      const { error } = await supabase
        .from('writings')
        .update(payload)
        .eq('id', id)
        .eq('user_id', user.id)

      if (error) throw error
      return NextResponse.json({ success: true })
    } else {
      const { error } = await supabase
        .from('writings')
        .insert({ ...payload, user_id: user.id })

      if (error) throw error
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error('[v0] Error saving writing:', error)
    return NextResponse.json({ error: 'Failed to save writing' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await requireUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { supabase, user } = auth
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 })
    }

    const { error } = await supabase
      .from('writings')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[v0] Error deleting writing:', error)
    return NextResponse.json({ error: 'Failed to delete writing' }, { status: 500 })
  }
}
