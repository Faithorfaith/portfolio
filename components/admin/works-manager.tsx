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

const newestFirst = (items: Work[]) => [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

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
    type: '',
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
        setWorks(newestFirst(data || []))
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
    setFormData((prev) => ({ ...prev, media_url: url, title: prev.title || decodeURIComponent(url.split('/').pop()?.split('?')[0] || 'Untitled').replace(/\.[^.]+$/, '') }))
  }

  const handleBulkMediaUpload = async (urls: string[]) => {
    if (urls.length < 2) return
    const supabase = createClient()
    const rows = urls.map((media_url) => ({
      user_id: userId,
      title: 'Untitled playground study',
      media_url,
      media_type: formData.media_type,
      order_index: 0,
    }))
    const { error: insertError } = await supabase.from('portfolio_works').insert(rows)
    if (insertError) { setError(insertError.message); return }
    const { data } = await supabase.from('portfolio_works').select('*').eq('user_id', userId)
    setWorks(newestFirst(data || []))
    setSuccess(true)
    window.setTimeout(() => setSuccess(false), 3000)
  }

  const handleMediaTypeChange = (type: 'image' | 'video') => {
    setFormData(prev => ({ ...prev, media_url: '', media_type: type }))
  }

  const handleSave = async () => {
    if (!formData.media_url.trim()) {
      setError('Please upload media')
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
          title: formData.title || 'Untitled playground study',
          description: formData.description || null,
          media_url: formData.media_url,
          media_type: formData.media_type,
          thumbnail_url: formData.thumbnail_url || null,
          type: formData.type || null,
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
      setWorks(newestFirst(works || []))

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
    if (!editingId) {
      setError('No work selected')
      return
    }

    setError(null)
    try {
      const supabase = createClient()
      const { error: updateError } = await supabase
        .from('portfolio_works')
        .update({
          title: formData.title || 'Untitled playground study',
          description: formData.description || null,
          media_url: formData.media_url,
          media_type: formData.media_type,
          thumbnail_url: formData.thumbnail_url || null,
          type: formData.type || null,
          order_index: formData.order_index,
        })
        .eq('id', editingId)

      if (updateError) throw updateError

      const { data } = await supabase
        .from('portfolio_works')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })

      setWorks(newestFirst(data || []))
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
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/40">Media library</p>
          <h2 className="mt-2 text-2xl font-medium tracking-tight text-foreground">Playground</h2>
          <p className="mt-1 text-sm text-foreground/50">A visual archive of experiments, interfaces, and small ideas.</p>
        </div>
        {!isAdding && <Button onClick={() => setIsAdding(true)} className="rounded-full px-5">Add media <span className="ml-1 text-base">＋</span></Button>}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[['Items', works.length], ['Images', works.filter(work => work.media_type !== 'video').length], ['Videos', works.filter(work => work.media_type === 'video').length], ['Latest', works[0] ? new Date(works[0].created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : '—']].map(([label, value]) => (
          <div key={String(label)} className="rounded-2xl border border-border/70 bg-foreground/[0.025] px-4 py-3">
            <p className="text-[11px] text-foreground/45">{label}</p><p className="mt-1 text-lg font-medium text-foreground">{value}</p>
          </div>
        ))}
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
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-foreground/25 p-4 backdrop-blur-md" onMouseDown={(event) => { if (event.target === event.currentTarget) resetForm() }}>
        <div className="max-h-[82dvh] w-full max-w-lg overflow-y-auto rounded-[28px] border border-border/70 bg-background p-5 shadow-2xl sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div><p className="text-[10px] uppercase tracking-[0.18em] text-foreground/40">{editingId ? 'Update item' : 'New upload'}</p><h3 className="mt-1 text-xl font-medium tracking-tight text-foreground">{editingId ? 'Edit Playground media' : 'Add Playground media'}</h3></div>
            <button type="button" onClick={resetForm} aria-label="Close upload dialog" className="grid size-8 place-items-center rounded-full text-lg text-foreground/45 transition-colors hover:bg-foreground/[0.06] hover:text-foreground">×</button>
          </div>

          <div className="space-y-4">
            {/* Media Type */}
            <div>
              <label className="mb-2 block text-xs font-medium text-foreground/70">
                Media Type
              </label>
              <div className="inline-flex rounded-full bg-foreground/[0.045] p-1">
                <Button
                  type="button"
                  variant={formData.media_type === 'image' ? 'default' : 'ghost'}
                  onClick={() => handleMediaTypeChange('image')}
                >
                  Image
                </Button>
                <Button
                  type="button"
                  variant={formData.media_type === 'video' ? 'default' : 'ghost'}
                  onClick={() => handleMediaTypeChange('video')}
                >
                  Video
                </Button>
              </div>
            </div>

            {/* Media Upload */}
            <div>
              <label className="mb-2 block text-xs font-medium text-foreground/70">
                {formData.media_type === 'image' ? 'Image files' : 'Video files'}
              </label>
              {formData.media_url && (
                <p className="text-sm text-foreground/60 mb-2">
                  File: {formData.media_url.split('/').pop()}
                </p>
              )}
              <div className="rounded-2xl border border-dashed border-foreground/20 bg-foreground/[0.02] p-4">
              <FileUpload
                userId={userId}
                folder={formData.media_type === 'image' ? 'portfolio-images' : 'portfolio-videos'}
                onUpload={handleMediaUpload}
                onUploadMany={handleBulkMediaUpload}
                multiple
                accept={formData.media_type === 'image' ? 'image/*' : 'video/*'}
              />
              <p className="mt-3 text-center text-[10px] text-foreground/40">Select multiple files or drag them here · newest first</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <Button onClick={editingId ? handleUpdate : handleSave} className="rounded-full px-5">
                {editingId ? 'Save changes' : 'Save media'}
              </Button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Works List */}
      <div>
        <div className="mb-4 flex items-center justify-between"><h3 className="text-sm font-medium text-foreground">All media</h3><span className="text-xs text-foreground/40">Newest first</span></div>
        {works.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-border p-12 text-center"><p className="text-sm text-foreground/50">Your Playground is empty.</p><button type="button" onClick={() => setIsAdding(true)} className="mt-3 text-xs underline underline-offset-4">Upload your first experiment</button></div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {works.map((work) => (
            <div
              key={work.id}
              className="group relative aspect-square overflow-hidden rounded-2xl border border-border/70 bg-foreground/[0.04]"
            >
              {/* Media Preview */}
              {work.media_type === 'image' && work.media_url && (
                <ProgressiveImage
                  src={work.media_url}
                  alt="Portfolio work"
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  containerClassName="h-full w-full"
                />
              )}
              {work.media_type === 'video' && (
                <div className="flex h-full w-full items-center justify-center bg-foreground/[0.06]">
                  <svg
                    className="w-6 h-6 text-foreground/50"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/65 to-transparent p-3 pt-10 opacity-0 transition-opacity group-hover:opacity-100">
                <span className="text-[10px] text-white/75">{new Date(work.created_at).toLocaleDateString()}</span>
                <div className="flex gap-1.5">
                  <button type="button" onClick={() => startEdit(work)} className="rounded-full bg-white/90 px-2.5 py-1 text-[10px] text-black">Edit</button>
                  <button type="button" onClick={() => handleDelete(work.id)} className="rounded-full bg-red-500/90 px-2.5 py-1 text-[10px] text-white">Delete</button>
                </div>
              </div>

              {/* Action Buttons */}
            </div>
          ))}
          </div>
        )}
      </div>
    </div>
  )
}
