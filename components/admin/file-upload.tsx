'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'

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
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsLoading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', folder)
      formData.append('userId', userId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

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
    }
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

      <Button
        type="button"
        variant="outline"
        disabled={isLoading}
        onClick={() => fileInputRef.current?.click()}
        className="w-full"
      >
        {isLoading ? 'Uploading...' : 'Choose File'}
      </Button>

      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  )
}
