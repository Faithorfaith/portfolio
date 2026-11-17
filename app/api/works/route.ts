import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { revalidatePath, revalidateTag } from 'next/cache'

const ITEMS_PER_PAGE = 12

function refreshPublicWorks() {
  revalidateTag('public-works', { expire: 0 })
  revalidatePath('/')
  revalidatePath('/playground')
  revalidatePath('/api/public/menu-previews')
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { searchParams } = new URL(request.url)
  const page = parseInt(searchParams.get('page') || '0')
  const userId = searchParams.get('userId')

  let query = supabase
    .from('portfolio_works')
    .select('*')
    .order('created_at', { ascending: false })
    .range(page * ITEMS_PER_PAGE, (page + 1) * ITEMS_PER_PAGE - 1)

  if (userId) {
    query = query.eq('user_id', userId)
  }

  const { data, error } = await query

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(data, {
    headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const body = await request.json()
  
  const { data, error } = await supabase
    .from('portfolio_works')
    .insert({
      user_id: user.id,
      title: body.title,
      description: body.description,
      media_url: body.media_url,
      media_type: body.media_type,
      thumbnail_url: body.thumbnail_url,
      type: body.type || 'Design',
      order_index: Number.isFinite(body.order_index) ? body.order_index : 0,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  refreshPublicWorks()
  return NextResponse.json(data)
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => null)
  const ids: unknown = body?.ids
  if (!Array.isArray(ids) || !ids.length || !ids.every(id => typeof id === 'string' && id.length > 0)) {
    return NextResponse.json({ error: 'Select at least one media item' }, { status: 400 })
  }

  const { error } = await supabase.from('portfolio_works').delete().in('id', ids).eq('user_id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  refreshPublicWorks()
  return NextResponse.json({ success: true })
}
