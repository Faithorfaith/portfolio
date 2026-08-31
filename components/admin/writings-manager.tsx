'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'

const RTFEditor = dynamic(() => import('./rtf-editor'), { ssr: false })

interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'image' | 'quote' | 'divider'
  content: string
  level?: 1 | 2 | 3
}

interface Writing {
  id: string
  title: string
  slug: string
  content: ContentBlock[]
  excerpt: string | null
  cover_image: string | null
  published: boolean
}

export default function WritingsManager() {
  const [writings, setWritings] = useState<Writing[]>([])
  const [editing, setEditing] = useState<Writing | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchWritings()
  }, [])

  const fetchWritings = async () => {
    const { data } = await supabase
      .from('writings')
      .select('*')
      .order('created_at', { ascending: false })

    const parsed = (data || []).map(w => ({
      ...w,
      content: typeof w.content === 'string' ? JSON.parse(w.content) : (w.content || [])
    }))
    setWritings(parsed)
  }

  const createNewWriting = () => {
    setEditing({
      id: '',
      title: '',
      slug: '',
      content: [{ id: crypto.randomUUID(), type: 'heading', content: '', level: 1 }],
      excerpt: null,
      cover_image: null,
      published: false
    })
    setIsCreating(true)
  }

  const addBlock = (type: ContentBlock['type']) => {
    if (!editing) return
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: '',
      ...(type === 'heading' ? { level: 2 } : {})
    }
    setEditing({ ...editing, content: [...editing.content, newBlock] })
  }

  const updateBlock = (blockId: string, updates: Partial<ContentBlock>) => {
    if (!editing) return
    setEditing({
      ...editing,
      content: editing.content.map(block => block.id === blockId ? { ...block, ...updates } : block)
    })
  }

  const deleteBlock = (blockId: string) => {
    if (!editing) return
    setEditing({ ...editing, content: editing.content.filter(block => block.id !== blockId) })
  }

  const moveBlock = (blockId: string, direction: 'up' | 'down') => {
    if (!editing) return
    const index = editing.content.findIndex(b => b.id === blockId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === editing.content.length - 1) return
    const newContent = [...editing.content]
    const swapIndex = direction === 'up' ? index - 1 : index + 1
    ;[newContent[index], newContent[swapIndex]] = [newContent[swapIndex], newContent[index]]
    setEditing({ ...editing, content: newContent })
  }

  const handleSave = async () => {
    if (!editing || !editing.title.trim()) {
      setError('Title is required')
      return
    }
    setIsSaving(true)
    setError(null)
    try {
      const slug = editing.slug || `${editing.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}-${Date.now()}`
      const res = await fetch('/api/writings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          title: editing.title,
          slug,
          content: JSON.stringify(editing.content),
          excerpt: editing.excerpt,
          cover_image: editing.cover_image,
          published: editing.published,
          isUpdate: !isCreating,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save')
      setSuccess(true)
      setEditing(null)
      setIsCreating(false)
      await fetchWritings()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this writing?')) return
    await fetch(`/api/writings?id=${id}`, { method: 'DELETE' })
    await fetchWritings()
  }

  const handleImageUpload = async (blockId: string, file: File) => {
    const fileName = `writings/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('portfolio-uploads').upload(fileName, file)
    if (uploadError) { setError('Failed to upload image'); return }
    const { data: { publicUrl } } = supabase.storage.from('portfolio-uploads').getPublicUrl(fileName)
    updateBlock(blockId, { content: publicUrl })
  }

  const handleCoverUpload = async (file: File) => {
    if (!editing) return
    const fileName = `writings/covers/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from('portfolio-uploads').upload(fileName, file)
    if (uploadError) { setError('Failed to upload cover'); return }
    const { data: { publicUrl } } = supabase.storage.from('portfolio-uploads').getPublicUrl(fileName)
    setEditing({ ...editing, cover_image: publicUrl })
  }

  // ── Editor View ──────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div className="max-w-3xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-3">
            <button
              onClick={() => { setEditing(null); setIsCreating(false) }}
              className="p-1.5 rounded-lg transition-colors"
              style={{ border: '1px solid oklch(0.91 0 0)', background: 'oklch(0.98 0 0)', color: 'var(--foreground)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="font-semibold text-foreground" style={{ fontSize: '16px', letterSpacing: '-0.02em' }}>{isCreating ? 'New Article' : 'Edit Article'}</h2>
              <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.4 }}>{editing.content.length} block{editing.content.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div
              onClick={() => setEditing({ ...editing, published: !editing.published })}
              className="flex items-center gap-2 cursor-pointer select-none"
              style={{ fontSize: '12.5px', color: 'var(--foreground)', opacity: 0.55 }}
            >
              <div
                className="rounded-full transition-colors relative"
                style={{ width: '34px', height: '19px', background: editing.published ? 'var(--foreground)' : 'oklch(0.88 0 0)', cursor: 'pointer' }}
              >
                <div
                  className="absolute rounded-full shadow transition-transform"
                  style={{ top: '2px', width: '15px', height: '15px', background: 'white', transform: editing.published ? 'translateX(17px)' : 'translateX(2px)' }}
                />
              </div>
              {editing.published ? 'Published' : 'Draft'}
            </div>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ padding: '7px 14px', background: 'var(--foreground)', fontSize: '12.5px', letterSpacing: '-0.01em' }}
            >
              {isSaving && <div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'oklch(0.97 0.01 27)', border: '1px solid oklch(0.92 0.03 27)', color: 'oklch(0.5 0.18 27)' }}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'oklch(0.97 0.03 142)', border: '1px solid oklch(0.91 0.06 142)', color: 'oklch(0.45 0.15 142)' }}>
            <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved
          </div>
        )}

        {/* Meta */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid oklch(0.91 0 0)', boxShadow: '0 1px 2px oklch(0 0 0 / 0.04)' }}>
          <div className="px-6 py-4 border-b" style={{ borderColor: 'oklch(0.93 0 0)', background: 'oklch(0.985 0 0)' }}>
            <p className="text-sm font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>Article Details</p>
          </div>
          <div className="px-6 py-5 space-y-4" style={{ background: 'oklch(1 0 0)' }}>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: 'var(--foreground)', opacity: 0.5 }}>Title</label>
              <input
                type="text"
                placeholder="Article title"
                value={editing.title}
                onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                className="w-full text-sm font-medium bg-background focus:outline-none focus:ring-2 focus:ring-foreground/15 transition-shadow rounded-lg"
                style={{ padding: '8px 12px', border: '1px solid oklch(0.91 0 0)', fontSize: '15px' }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: 'var(--foreground)', opacity: 0.5 }}>Slug <span style={{ opacity: 0.6 }}>(auto-generated)</span></label>
              <input
                type="text"
                placeholder="url-slug"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                className="w-full text-sm font-mono bg-background focus:outline-none focus:ring-2 focus:ring-foreground/15 transition-shadow rounded-lg"
                style={{ padding: '8px 12px', border: '1px solid oklch(0.91 0 0)', color: 'var(--foreground)', opacity: 0.6 }}
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium" style={{ color: 'var(--foreground)', opacity: 0.5 }}>Excerpt</label>
              <textarea
                placeholder="Short description shown in listings"
                value={editing.excerpt || ''}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                className="w-full text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground/15 transition-shadow resize-none rounded-lg"
                style={{ padding: '8px 12px', border: '1px solid oklch(0.91 0 0)' }}
                rows={2}
              />
            </div>

            {/* Cover Image */}
            <div className="space-y-1.5 pt-2 border-t border-border">
              <label className="text-xs font-medium text-foreground/60">Cover Image</label>
              {editing.cover_image ? (
                <div className="relative group w-40 h-24 rounded-xl overflow-hidden border border-border">
                  <img src={editing.cover_image} alt="" className="w-full h-full object-cover" />
                  <button
                    onClick={() => setEditing({ ...editing, cover_image: null })}
                    className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                  >
                    <span className="text-white text-xs font-medium">Remove</span>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-40 h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-foreground/40 transition-colors bg-muted/20">
                  <svg className="w-5 h-5 text-foreground/30 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-xs text-foreground/40">Upload cover</span>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCoverUpload(f) }} />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* Block Toolbar */}
        <div className="flex items-center gap-1.5 px-4 py-3 rounded-xl flex-wrap" style={{ border: '1px solid oklch(0.91 0 0)', background: 'oklch(0.985 0 0)' }}>
          <span className="text-xs font-medium mr-1" style={{ color: 'var(--foreground)', opacity: 0.35 }}>Insert:</span>
          {[
            { type: 'heading' as const, label: 'Heading', icon: 'H' },
            { type: 'paragraph' as const, label: 'Text', icon: 'P' },
            { type: 'image' as const, label: 'Image', icon: '↑' },
            { type: 'quote' as const, label: 'Quote', icon: '"' },
            { type: 'divider' as const, label: 'Divider', icon: '—' },
          ].map(({ type, label, icon }) => (
            <button
              key={type}
              onClick={() => addBlock(type)}
              className="flex items-center gap-1.5 text-xs rounded-lg transition-all hover:opacity-80"
              style={{ padding: '5px 10px', border: '1px solid oklch(0.91 0 0)', background: 'oklch(1 0 0)', color: 'var(--foreground)', opacity: 0.65, fontSize: '11.5px' }}
            >
              <span className="font-mono" style={{ opacity: 0.5 }}>{icon}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Content Blocks */}
        <div className="space-y-2.5">
          {editing.content.map((block, index) => (
            <div key={block.id} className="group rounded-xl overflow-hidden" style={{ border: '1px solid oklch(0.91 0 0)', boxShadow: '0 1px 2px oklch(0 0 0 / 0.03)' }}>
              {/* Block top bar */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b" style={{ background: 'oklch(0.985 0 0)', borderColor: 'oklch(0.93 0 0)' }}>
                <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground)', opacity: 0.35, letterSpacing: '0.07em', fontSize: '10px' }}>
                  {block.type}{block.type === 'heading' ? ` H${block.level}` : ''}
                </span>
                {block.type === 'heading' && (
                  <div className="flex gap-0.5 ml-auto">
                    {[1, 2, 3].map((level) => (
                      <button
                        key={level}
                        onClick={() => updateBlock(block.id, { level: level as 1 | 2 | 3 })}
                        className="w-5 h-5 text-xs rounded flex items-center justify-center transition-colors"
                        style={{ background: block.level === level ? 'var(--foreground)' : 'transparent', color: block.level === level ? 'var(--background)' : 'var(--foreground)', opacity: block.level === level ? 1 : 0.4, fontSize: '10px' }}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                )}
                <div className={`flex items-center gap-0.5 ${block.type === 'heading' ? '' : 'ml-auto'}`}>
                  <button onClick={() => moveBlock(block.id, 'up')} disabled={index === 0} className="p-1.5 rounded transition-all disabled:opacity-20" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                  </button>
                  <button onClick={() => moveBlock(block.id, 'down')} disabled={index === editing.content.length - 1} className="p-1.5 rounded transition-all disabled:opacity-20" style={{ color: 'var(--foreground)', opacity: 0.35 }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  <button onClick={() => deleteBlock(block.id)} className="p-1.5 rounded transition-all" style={{ color: 'oklch(0.5 0.18 27)', opacity: 0.6 }}>
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>

              <div className="px-4 py-4">
                {(block.type === 'heading' || block.type === 'paragraph') && (
                  <RTFEditor
                    value={block.content}
                    onChange={(value) => updateBlock(block.id, { content: value })}
                    placeholder={block.type === 'heading' ? 'Heading text...' : 'Write your content...'}
                  />
                )}

                {block.type === 'image' && (
                  block.content ? (
                    <div className="relative group/img">
                      <img src={block.content} alt="" className="w-full rounded-lg" />
                      <button
                        onClick={() => updateBlock(block.id, { content: '' })}
                        className="absolute top-2 right-2 px-3 py-1.5 bg-black/60 text-white text-xs rounded-lg hover:bg-black/80 transition-colors"
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-36 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground/40 transition-colors bg-muted/10">
                      <svg className="w-7 h-7 text-foreground/25 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-sm text-foreground/40">Click to upload image</span>
                      <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageUpload(block.id, f) }} />
                    </label>
                  )
                )}

                {block.type === 'quote' && (
                  <div className="pl-4 border-l-2 border-foreground/20">
                    <RTFEditor
                      value={block.content}
                      onChange={(value) => updateBlock(block.id, { content: value })}
                      placeholder="Quote text..."
                    />
                  </div>
                )}

                {block.type === 'divider' && (
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex-1 border-t border-border" />
                    <span className="text-xs text-foreground/30">divider</span>
                    <div className="flex-1 border-t border-border" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ── List View ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="font-semibold text-foreground" style={{ fontSize: '16px', letterSpacing: '-0.02em' }}>Writing</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.45 }}>{writings.length} total &mdash; {writings.filter(w => w.published).length} published</p>
        </div>
        <button
          onClick={createNewWriting}
          className="flex items-center gap-2 text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
          style={{ padding: '7px 14px', background: 'var(--foreground)', fontSize: '12.5px', letterSpacing: '-0.01em' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Article
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'oklch(0.97 0.01 27)', border: '1px solid oklch(0.92 0.03 27)', color: 'oklch(0.5 0.18 27)' }}>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'oklch(0.97 0.03 142)', border: '1px solid oklch(0.91 0.06 142)', color: 'oklch(0.45 0.15 142)' }}>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </div>
      )}

      {writings.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 rounded-xl text-center" style={{ border: '2px dashed oklch(0.91 0 0)' }}>
          <svg className="w-8 h-8 mb-3" style={{ color: 'var(--foreground)', opacity: 0.18 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: 'var(--foreground)', opacity: 0.35 }}>No articles yet</p>
          <p className="text-xs mt-1" style={{ color: 'var(--foreground)', opacity: 0.25 }}>Write your first article to get started</p>
        </div>
      ) : (
        <div className="rounded-xl overflow-hidden" style={{ border: '1px solid oklch(0.91 0 0)', boxShadow: '0 1px 2px oklch(0 0 0 / 0.03)' }}>
          {writings.map((w, idx) => (
            <div key={w.id} className="flex items-center gap-4 group transition-colors" style={{ padding: '13px 20px', background: 'oklch(1 0 0)', borderTop: idx > 0 ? '1px solid oklch(0.94 0 0)' : 'none' }}>
              {w.cover_image && (
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ border: '1px solid oklch(0.91 0 0)' }}>
                  <img src={w.cover_image} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-sm font-medium text-foreground truncate" style={{ letterSpacing: '-0.01em' }}>{w.title || 'Untitled'}</p>
                  <span className="shrink-0 px-2 py-0.5 text-xs font-medium rounded-full" style={w.published ? { background: 'oklch(0.95 0.07 142)', color: 'oklch(0.4 0.15 142)' } : { background: 'oklch(0.94 0 0)', color: 'var(--foreground)', opacity: 0.5 }}>
                    {w.published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <p className="text-xs truncate" style={{ color: 'var(--foreground)', opacity: 0.4 }}>{w.excerpt || 'No excerpt'}</p>
              </div>
              <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => { setEditing(w); setIsCreating(false) }}
                  className="text-xs rounded-lg transition-colors hover:opacity-80"
                  style={{ padding: '5px 12px', border: '1px solid oklch(0.91 0 0)', background: 'oklch(0.98 0 0)', fontSize: '12px', letterSpacing: '-0.01em' }}
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(w.id)}
                  className="p-1.5 rounded-lg transition-colors"
                  style={{ border: '1px solid oklch(0.88 0.04 27)', background: 'oklch(0.98 0.01 27)', color: 'oklch(0.5 0.18 27)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
