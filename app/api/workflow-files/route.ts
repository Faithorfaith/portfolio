import { NextRequest, NextResponse } from 'next/server'
import { requireUser } from '@/lib/auth'
import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'

const refresh = () => { revalidatePath('/'); revalidatePath('/workflows') }

export async function GET(request: NextRequest) {
  const admin = new URL(request.url).searchParams.get('admin') === '1'
  if (admin) {
    const auth = await requireUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data, error } = await auth.supabase.from('workflow_files').select('*, workflow_file_versions(*)').eq('user_id', auth.user.id).order('updated_at', { ascending: false })
    return error ? NextResponse.json({ error: error.message }, { status: 400 }) : NextResponse.json(data || [])
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return NextResponse.json([])
  const client = createClient(url, key, { auth: { persistSession: false } })
  const { data, error } = await client.from('workflow_files').select('*, workflow_file_versions(*)').eq('published', true).order('updated_at', { ascending: false })
  return error ? NextResponse.json([]) : NextResponse.json(data || [], { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}

export async function POST(request: NextRequest) {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await request.json()
  if (body.action === 'create') {
    const { data, error } = await auth.supabase.from('workflow_files').insert({ user_id: auth.user.id, name: body.name, description: body.description || null, published: Boolean(body.published) }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    refresh(); return NextResponse.json(data)
  }
  if (body.action === 'update') {
    const { error } = await auth.supabase.from('workflow_files').update({ name: body.name, description: body.description || null, published: Boolean(body.published), updated_at: new Date().toISOString() }).eq('id', body.id).eq('user_id', auth.user.id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    refresh(); return NextResponse.json({ success: true })
  }
  if (body.action === 'version') {
    const { data: versions } = await auth.supabase.from('workflow_file_versions').select('version_number').eq('workflow_file_id', body.id).eq('user_id', auth.user.id).order('version_number', { ascending: false }).limit(1)
    const versionNumber = (versions?.[0]?.version_number || 0) + 1
    const { error } = await auth.supabase.from('workflow_file_versions').insert({ workflow_file_id: body.id, user_id: auth.user.id, version_number: versionNumber, file_name: body.fileName, file_url: body.fileUrl, notes: body.notes || null })
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await auth.supabase.from('workflow_files').update({ updated_at: new Date().toISOString() }).eq('id', body.id).eq('user_id', auth.user.id)
    refresh(); return NextResponse.json({ success: true, versionNumber })
  }
  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(request: NextRequest) {
  const auth = await requireUser()
  if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing file ID' }, { status: 400 })
  const { error } = await auth.supabase.from('workflow_files').delete().eq('id', id).eq('user_id', auth.user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  refresh(); return NextResponse.json({ success: true })
}
