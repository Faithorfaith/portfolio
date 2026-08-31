'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { uploadFileWithProgress } from '@/lib/upload-utils'

interface FileUploadProps {
  userId: string
  folder: string
  onUpload: (url: string) => void
  accept?: string
}

export default function FileUpload({
  userId,
  folder,
  onUpload,
  accept = '*',
}: FileUploadProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const uploadFile = async (file?: File) => {
    if (!file) return

    setIsLoading(true)
    setProgress(0)
    setError(null)

    try {
      // Videos upload straight to Storage so they do not hit Vercel's request
      // body limit. Images continue through the authenticated server route.
      if (file.type.startsWith('video/')) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
        const filePath = `${folder}/${userId}/${Date.now()}-${safeName}`
        const result = await uploadFileWithProgress(
          createClient(),
          'portfolio-uploads',
          filePath,
          file,
          (value) => setProgress(value),
        )
        if (!result.success || !result.publicUrl) throw new Error(result.error || 'Video upload failed')
        onUpload(result.publicUrl)
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      formData.append('userId', userId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      setProgress(75)

      if (!response.ok) {
        let errorMsg = 'Upload failed'
        try {
          const errorData = await response.json()
          errorMsg = errorData.error || errorMsg
        } catch (e) {
          const text = await response.text()
          console.error('[v0] Response text:', text)
        }
        throw new Error(errorMsg)
      }

      const data = await response.json()
      if (data.url) {
        onUpload(data.url)
        setProgress(100)
      } else {
        throw new Error('No URL returned from upload')
      }

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      console.error('[v0] Upload error:', err)
      const errorMsg = err instanceof Error ? err.message : 'Failed to upload file'
      setError(errorMsg)
    } finally {
      setIsLoading(false)
      window.setTimeout(() => setProgress(0), 500)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    await uploadFile(e.target.files?.[0])
  }

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        disabled={isLoading}
        className="hidden"
        aria-label="Upload file"
      />

      <button
        type="button"
        disabled={isLoading}
        onClick={() => fileInputRef.current?.click()}
        onDragEnter={(event) => { event.preventDefault(); setIsDragging(true) }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setIsDragging(false)
          void uploadFile(event.dataTransfer.files?.[0])
        }}
        className={`relative w-full min-h-24 overflow-hidden rounded-lg border border-dashed px-4 py-5 text-center transition-colors ${isDragging ? 'border-foreground/55 bg-foreground/[0.045]' : 'border-foreground/15 bg-foreground/[0.018] hover:border-foreground/35 hover:bg-foreground/[0.03]'}`}
      >
        <span className="block text-xs font-medium text-foreground/70">{isLoading ? `Uploading ${Math.round(progress)}%` : 'Drop a file or click to browse'}</span>
        <span className="mt-1 block text-[11px] text-foreground/35">{accept === '*' ? 'Images and videos supported' : accept}</span>
        {isLoading && <span className="absolute inset-x-0 bottom-0 h-0.5 bg-foreground/8"><span className="block h-full bg-foreground transition-[width]" style={{ width: `${progress}%` }} /></span>}
      </button>

      {error && <p role="alert" className="text-xs text-red-600">{error}</p>}
    </div>
  )
}
