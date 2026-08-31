import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireUser } from '@/lib/auth'

const MAX_UPLOAD_BYTES = 100 * 1024 * 1024
const SAFE_FOLDER = /^[a-z0-9_-]+$/i

export async function POST(request: NextRequest) {
  try {
    const auth = await requireUser()
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    const userId = formData.get('userId') as string

    if (!file || !folder || !userId || userId !== auth.user.id || !SAFE_FOLDER.test(folder)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ error: 'File exceeds the 100 MB limit' }, { status: 413 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: 'Missing Supabase credentials' },
        { status: 500 }
      )
    }

    // Use service role key to bypass RLS
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate unique filename
    const timestamp = Date.now()
    const ext = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin'
    const fileName = `${timestamp}.${ext}`
    const filePath = `${folder}/${userId}/${fileName}`

    // Convert file to buffer
    const buffer = await file.arrayBuffer()

    // Upload to Supabase Storage - try multiple bucket names
    const bucketNames = ['portfolio-uploads', 'uploads', 'files']
    let uploadError = null
    let uploadData = null
    let successBucket = null

    for (const bucketName of bucketNames) {
      try {
        console.log('[v0] Attempting upload to bucket:', bucketName)
        const { data, error } = await supabase.storage
          .from(bucketName)
          .upload(filePath, buffer, {
            contentType: file.type,
            upsert: true,
          })

        if (!error) {
          uploadData = data
          successBucket = bucketName
          console.log('[v0] Upload successful to bucket:', bucketName)
          break
        }
        uploadError = error
        console.log('[v0] Bucket error, trying next:', error?.message)
      } catch (err) {
        console.log('[v0] Bucket attempt failed:', err)
        continue
      }
    }

    if (!uploadData || !successBucket) {
      console.error('[v0] Upload failed on all buckets:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError?.message || 'No buckets available'}` },
        { status: 400 }
      )
    }

    // Get public URL from the successful bucket
    const {
      data: { publicUrl },
    } = supabase.storage.from(successBucket).getPublicUrl(filePath)

    return NextResponse.json({ 
      success: true,
      url: publicUrl 
    })
  } catch (error) {
    console.error('[v0] Upload catch error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file'
    return NextResponse.json(
      { error: `Server error: ${errorMessage}` },
      { status: 500 }
    )
  }
}
