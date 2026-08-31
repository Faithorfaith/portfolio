import { createClient } from '@supabase/supabase-js'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!supabaseUrl || !supabaseAnonKey) {
      return Response.json({ error: 'Missing Supabase credentials' }, { status: 500 })
    }
    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    const { data, error } = await supabase
      .from('projects')
      .select('id, title, slug, description, link, type, year, date_from, date_to, is_new, order_index, created_at')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[v0] Projects fetch error:', error)
      return Response.json(
        { error: 'Failed to fetch projects', details: error.message },
        { status: 500 }
      )
    }

    return Response.json({ data })
  } catch (error) {
    console.error('[v0] API error:', error)
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
