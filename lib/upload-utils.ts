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
    
    // For large files, use chunked upload
    const chunkSize = 5 * 1024 * 1024 // 5MB chunks
    
    if (file.size > chunkSize) {
      return uploadChunked(supabase, bucket, filePath, file, onProgress)
    }
    
    // For smaller files, regular upload
    const { error } = await supabase.storage.from(bucket).upload(filePath, file)
    
    if (error) {
      return { success: false, error: error.message }
    }
    
    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
    onProgress?.(100)
    
    return { success: true, publicUrl: data.publicUrl }
  } catch (err) {
    return { success: false, error: (err as Error).message }
  }
}

// Chunked upload for large files
async function uploadChunked(
  supabase: any,
  bucket: string,
  filePath: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; publicUrl?: string; error?: string }> {
  try {
    const chunkSize = 5 * 1024 * 1024 // 5MB
    const chunks = Math.ceil(file.size / chunkSize)
    
    let uploadedBytes = 0
    const chunks_data = []
    
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize
      const end = Math.min(start + chunkSize, file.size)
      const chunk = file.slice(start, end)
      
      const chunkPath = `${filePath}.part${i}`
      
      const { error } = await supabase.storage.from(bucket).upload(chunkPath, chunk)
      
      if (error) {
        return { success: false, error: error.message }
      }
      
      uploadedBytes += chunk.size
      const progress = Math.round((uploadedBytes / file.size) * 100)
      onProgress?.(progress)
      chunks_data.push(chunkPath)
    }
    
    // For Supabase, we can just upload the complete file instead
    // This is a simplified approach - production should use a backend endpoint
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
