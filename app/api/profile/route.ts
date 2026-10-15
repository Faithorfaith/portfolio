import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import { normalizeExternalUrl, normalizeWhatsAppUrl } from '@/lib/content-utils'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(data)
}

export async function PUT(request: NextRequest) {
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
    .from('profiles')
    .update({
      username: body.username,
      full_name: body.full_name,
      bio: body.bio,
      avatar_url: body.avatar_url,
      hero_image_1: body.hero_image_1 || null,
      hero_image_2: body.hero_image_2 || null,
      hero_image_3: body.hero_image_3 || null,
      gallery_images: Array.isArray(body.gallery_images) ? body.gallery_images : [],
      bio_references: Array.isArray(body.bio_references) ? body.bio_references : [],
      positioning_headline: body.positioning_headline || null,
      supporting_statement: body.supporting_statement || null,
      availability_status: body.availability_status || null,
      contact_email: body.contact_email || null,
      whatsapp_url: normalizeWhatsAppUrl(body.whatsapp_url) || null,
      x_url: normalizeExternalUrl(body.x_url) || null,
      linkedin_url: body.linkedin_url || null,
      resume_url: body.resume_url || null,
      primary_cta_label: body.primary_cta_label || 'Start a project',
      testimonials: Array.isArray(body.testimonials) ? body.testimonials : [],
      train_music_url: body.train_music_url || null,
      train_video_1: body.train_video_1 || null,
      train_video_2: body.train_video_2 || null,
      train_video_3: body.train_video_3 || null,
      train_video_4: body.train_video_4 || null,
      button_text: body.button_text,
      button_url: body.button_url,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }

  return NextResponse.json(data)
}
