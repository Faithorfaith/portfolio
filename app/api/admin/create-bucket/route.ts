import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireUser } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    if (!(await requireUser())) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Create the portfolio-uploads bucket
    const { data, error } = await supabase.storage.createBucket('portfolio-uploads', {
      public: true,
      fileSizeLimit: 100 * 1024 * 1024,
      allowedMimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime'],
    })

    if (error) {
      // If bucket already exists, that's fine
      if (error.message?.includes('already exists')) {
        const { error: updateError } = await supabase.storage.updateBucket('portfolio-uploads', {
          public: true,
          fileSizeLimit: 100 * 1024 * 1024,
          allowedMimeTypes: ['image/*', 'video/mp4', 'video/webm', 'video/quicktime'],
        })
        if (updateError) {
          return NextResponse.json({ error: `Failed to configure bucket: ${updateError.message}` }, { status: 400 })
        }
        return NextResponse.json({
          success: true,
          message: 'Bucket already exists',
        })
      }
      console.error('[v0] Bucket creation error:', error)
      return NextResponse.json(
        { error: `Failed to create bucket: ${error.message}` },
        { status: 400 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Bucket created successfully',
      data,
    })
  } catch (error) {
    console.error('[v0] Bucket creation error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to create bucket'
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
