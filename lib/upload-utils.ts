/**
 * Optimized file upload utilities with compression and progress tracking
 */

// Validate and optimize video before upload
export function validateAndOptimizeVideo(file: File): { valid: boolean; message: string; optimizedFile?: File } {
  const maxSize = 100 * 1024 * 1024 // 100MB
  const supportedFormats = ['video/mp4', 'video/webm', 'video/quicktime']
  
  if (!supportedFormats.includes(file.type)) {
    return { 
      valid: false, 
      message: 'Unsupported video format. Please upload MP4, WebM, or MOV files.' 
    }
  }
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `Video too large (${formatFileSize(file.size)}). Maximum size is 100MB. Please compress your video before uploading.` 
    }
  }
  
  return { valid: true, message: 'Video is valid', optimizedFile: file }
}

export async function compressVideo(file: File): Promise<File> {
  if (file.size < 20 * 1024 * 1024 || typeof MediaRecorder === 'undefined') return file
  const source = document.createElement('video')
  source.src = URL.createObjectURL(file)
  source.muted = true
  source.playsInline = true
  await new Promise<void>((resolve, reject) => { source.onloadedmetadata = () => resolve(); source.onerror = () => reject(new Error('Could not read video')) })
  const scale = Math.min(1, 720 / source.videoHeight)
  const canvas = document.createElement('canvas'); canvas.width = Math.round(source.videoWidth * scale); canvas.height = Math.round(source.videoHeight * scale)
  const context = canvas.getContext('2d')!
  const stream = canvas.captureStream(30)
  const recorder = new MediaRecorder(stream, { mimeType: MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? 'video/webm;codecs=vp9,opus' : 'video/webm', videoBitsPerSecond: 2_500_000 })
  const chunks: Blob[] = []
  recorder.ondataavailable = event => { if (event.data.size) chunks.push(event.data) }
  const finished = new Promise<File>((resolve) => { recorder.onstop = () => { const blob = new Blob(chunks, { type: recorder.mimeType }); resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.webm'), { type: recorder.mimeType })) } })
  recorder.start(250); await source.play()
  const draw = () => { if (source.ended) { recorder.stop(); URL.revokeObjectURL(source.src); return }; context.drawImage(source, 0, 0, canvas.width, canvas.height); requestAnimationFrame(draw) }; draw()
  return finished
}

export async function generateVideoThumbnail(file: File): Promise<Blob | null> {
  const video = document.createElement('video'); video.src = URL.createObjectURL(file); video.muted = true; video.playsInline = true
  await new Promise<void>((resolve, reject) => { video.onloadeddata = () => { video.currentTime = 0.1 }; video.onseeked = () => resolve(); video.onerror = () => reject(new Error('Could not generate video cover')) })
  const scale = Math.min(1, 720 / video.videoHeight); const canvas = document.createElement('canvas'); canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale); canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height); URL.revokeObjectURL(video.src)
  return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.78))
}

// Compress image before upload
export async function compressImage(
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let { width, height } = img
        
        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width)
            width = maxWidth
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height)
            height = maxHeight
          }
        }
        
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')!
        ctx.drawImage(img, 0, 0, width, height)
        
        canvas.toBlob(
          (blob) => {
            const compressedFile = new File([blob!], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }
      img.src = e.target?.result as string
    }
    
    reader.readAsDataURL(file)
  })
}

// Upload with progress tracking
export async function uploadFileWithProgress(
  supabase: any,
  bucket: string,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    // Validate video files before uploading
    if (file.type.startsWith('video/')) {
      const validation = validateAndOptimizeVideo(file)
      if (!validation.valid) {
        return { success: false, error: validation.message }
      }
    }
    
    const uploadFile = file.type.startsWith('video/') ? await compressVideo(file) : file
    const { data: { session } } = await supabase.auth.getSession()
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (!session?.access_token || !supabaseUrl) return { success: false, error: 'Your session expired. Please sign in again.' }

    // Supabase's fetch upload has no progress events. Use the storage REST
    // endpoint so the browser can report real bytes uploaded.
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${filePath}`)
      xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`)
      xhr.setRequestHeader('apikey', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '')
      xhr.setRequestHeader('x-upsert', 'true')
      xhr.setRequestHeader('cache-control', '3600')
      xhr.setRequestHeader('content-type', file.type || 'application/octet-stream')
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) onProgress?.(Math.max(1, Math.round((event.loaded / event.total) * 100)))
      }
      xhr.onerror = () => reject(new Error('Network error while uploading'))
      xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(xhr.responseText || `Upload failed (${xhr.status})`))
      xhr.send(uploadFile)
    })
    
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    onProgress?.(100)
    
    return { success: true, publicUrl: data.publicUrl }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// Get file size in readable format
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}
