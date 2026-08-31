'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import FileUpload from './file-upload'
import ProgressiveImage from '@/components/progressive-image'

interface Work {
  id: string
  title: string
  description: string | null
  media_url: string | null
  media_type: string | null
  thumbnail_url: string | null
  type: string | null
  order_index: number
  created_at: string
}

interface WorksManagerProps {
  userId: string
}

export default function WorksManager({ userId }: WorksManagerProps) {
  const [works, setWorks] = useState<Work[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isAdding, setIsAdding] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    media_url: '',
    media_type: 'image',
    thumbnail_url: '',
    type: 'Animation',
    order_index: 0,
  })

  // Fetch works
  useEffect(() => {
    const fetchWorks = async () => {
      try {
        const supabase = createClient()
        const { data, error: fetchError } = await supabase
          .from('portfolio_works')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })

        if (fetchError) throw fetchError
        setWorks(data || [])
      } catch (err) {
        console.error('Error fetching works:', err)
        setError('Failed to load works')
      } finally {
        setIsLoading(false)
      }
    }

    if (userId) fetchWorks()
  }, [userId])

  const handleMediaUpload = (url: string) => {
    setFormData((prev) => ({ ...prev, media_url: url }))
  }

  const handleMediaTypeChange = (type: 'image' | 'video') => {
    setFormData(prev => ({ ...prev, media_url: '', media_type: type }))
  }

  const handleSave = async () => {
    if (!formData.title.trim() || !formData.media_url.trim()) {
      setError('Please fill in title and upload media')
      return
    }

    setError(null)
    setSuccess(false)

    try {
      const supabase = createClient()
      const { data, error: insertError } = await supabase
        .from('portfolio_works')
        .insert([{
          user_id: userId,
          title: formData.title,
          description: formData.description || null,
          media_url: formData.media_url,
          media_type: formData.media_type,
          thumbnail_url: formData.thumbnail_url || null,
          type: formData.type,
          order_index: formData.order_index,
        }])
        .select()

      if (insertError) throw insertError

      // Refresh works list
      const { data: works, error: fetchError } = await supabase
        .from('portfolio_works')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setWorks(works || [])

      setSuccess(true)
      resetForm()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('[v0] Error saving work:', err)
      setError(err instanceof Error ? err.message : 'Failed to save work')
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this work?')) return

    try {
      const supabase = createClient()
      const { error: deleteError } = await supabase
        .from('portfolio_works')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      setWorks((prev) => prev.filter((work) => work.id !== id))
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      console.error('Error deleting work:', err)
      setError('Failed to delete work')
    }
  }

  const startEdit = (work: Work) => {
    setEditingId(work.id)
    setFormData({
      title: work.title,
      description: work.description || '',
      media_url: work.media_url || '',
      media_type: work.media_type || 'image',
      thumbnail_url: work.thumbnail_url || '',
      type: work.type || 'Animation',
      order_index: work.order_index,
    })
    setIsAdding(true)
  }

  const handleUpdate = async () => {
    if (!editingId || !formData.title.trim()) {
      setError('Please fill in the title')
      return
    }

    setError(null)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('portfolio_works')
        .update({
          title: formData.title,
          description: formData.description || null,
          media_url: formData.media_url,
          media_type: formData.media_type,
          thumbnail_url: formData.thumbnail_url || null,
          type: formData.type,
          order_index: formData.order_index,
        })
        .eq('id', editingId)

      if (updateError) throw updateError

      const { data } = await supabase
        .from('portfolio_works')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      setWorks(data || [])
      setSuccess(true)
      resetForm()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update work')
    }
  }

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      media_url: '',
      media_type: 'image',
      thumbnail_url: '',
      type: 'Animation',
      order_index: 0,
    })
    setIsAdding(false)
    setEditingId(null)
  }

  if (isLoading) {
    return <div className="animate-pulse text-foreground/50">Loading...</div>
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">Portfolio Works</h2>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)}>Add Work</Button>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded text-red-600 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded text-green-600 text-sm">
          Work saved successfully!
        </div>
      )}

      {/* Add Form */}
      {isAdding && (
        <div className="max-w-2xl border border-border rounded-lg p-6 bg-background/50">
          <h3 className="text-lg font-semibold text-foreground mb-4">{editingId ? 'Edit Portfolio Work' : 'Add Portfolio Work'}</h3>

          <div className="space-y-4">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Title *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Dynamic Island Streak"
                className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Type
              </label>
              <input
                type="text"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                placeholder="e.g., Animation, UI, Interaction"
                className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Description
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the work"
                className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20 min-h-20"
              />
            </div>

            {/* Media Type */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Media Type
              </label>
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant={formData.media_type === 'image' ? 'default' : 'outline'}
                  onClick={() => handleMediaTypeChange('image')}
                >
                  Image
                </Button>
                <Button
                  type="button"
                  variant={formData.media_type === 'video' ? 'default' : 'outline'}
                  onClick={() => handleMediaTypeChange('video')}
                >
                  Video
                </Button>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                {formData.media_type === 'image' ? 'Upload Image' : 'Upload Video'} *
              </label>
              {formData.media_url && (
                <p className="text-sm text-foreground/60 mb-2">
                  File: {formData.media_url.split('/').pop()}
                </p>
              )}
              <FileUpload
                userId={userId}
                folder={formData.media_type === 'image' ? 'portfolio-images' : 'portfolio-videos'}
                onUpload={handleMediaUpload}
                accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
              />
            </div>

            {/* Thumbnail Upload */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Thumbnail Image (Square)
              </label>
              {formData.thumbnail_url && (
                <p className="text-sm text-foreground/60 mb-2">
                  File: {formData.thumbnail_url.split('/').pop()}
                </p>
              )}
              <FileUpload
                userId={userId}
                folder="portfolio-thumbnails"
                onUpload={(url) => setFormData({ ...formData, thumbnail_url: url })}
                accept="image/*"
              />
            </div>

            {/* Order Index */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Display Order
              </label>
              <input
                type="number"
                value={formData.order_index}
                onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded border border-border bg-background text-foreground placeholder-foreground/40 focus:outline-none focus:ring-2 focus:ring-foreground/20"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button onClick={editingId ? handleUpdate : handleSave} className="flex-1">
                {editingId ? 'Update Work' : 'Save Work'}
              </Button>
              <Button onClick={resetForm} variant="outline" className="flex-1">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Works List */}
      <div className="space-y-3">
        {works.length === 0 ? (
          <p className="text-foreground/50 text-center py-8">No works yet</p>
        ) : (
          works.map((work) => (
            <div
              key={work.id}
              className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-background/50 transition-colors"
            >
              {/* Media Preview */}
              {work.media_type === 'image' && work.media_url && (
                <ProgressiveImage
                  src={work.media_url}
                  alt="Portfolio work"
                  className="w-16 h-16 rounded object-cover flex-shrink-0"
                  containerClassName="w-16 h-16 rounded overflow-hidden flex-shrink-0"
                />
              )}
              {work.media_type === 'video' && (
                <div className="w-16 h-16 rounded bg-muted flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-6 h-6 text-foreground/50"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground/60">
                  {new Date(work.created_at).toLocaleDateString()}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => startEdit(work)}
                >
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(work.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
