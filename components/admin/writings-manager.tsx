'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { slugify } from '@/lib/slugify'
import { useEditorGuard } from '@/hooks/use-editor-guard'
import SafeHtml from '@/components/safe-html'
import ArticleBody from '@/components/article-body'
import DraftTools from './draft-tools'
import DocumentWorkspace from './document-workspace'
import { blocksToDocument } from '@/lib/document-content'
import MediaLibrary from './media-library'
import { generateNarrationInWorker } from '@/lib/generate-narration'

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
  audio_url: string | null
  audio_voice: string | null
  published: boolean
}

const KOKORO_VOICES = [
  { id: 'bf_emma', label: 'Emma · British' },
  { id: 'bf_isabella', label: 'Isabella · British' },
  { id: 'bm_george', label: 'George · British' },
  { id: 'af_heart', label: 'Heart · American' },
  { id: 'af_bella', label: 'Bella · American' },
  { id: 'af_nicole', label: 'Nicole · American' },
] as const

export default function WritingsManager({ onEditorOpenChange }: { onEditorOpenChange?: (open: boolean) => void }) {
  const [writings, setWritings] = useState<Writing[]>([])
  const [editing, setEditing] = useState<Writing | null>(null)
  useEffect(() => { onEditorOpenChange?.(Boolean(editing)); return () => onEditorOpenChange?.(false) }, [Boolean(editing), onEditorOpenChange])
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [listFilter, setListFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false)
  const [narrationProgress, setNarrationProgress] = useState('')
  const narrationController = useRef<AbortController | null>(null)
  useEffect(() => () => { narrationController.current?.abort() }, [])
  useEffect(() => { if (!editing) narrationController.current?.abort() }, [editing])
  const dirty = useEditorGuard(editing)
  const [showPreview, setShowPreview] = useState(false)
  const [previewMobile, setPreviewMobile] = useState(false)
  const [voiceSample, setVoiceSample] = useState<string | null>(null)
  const previousContent = useRef<{ id: string; text: string } | null>(null)
  const [narrationStale, setNarrationStale] = useState(false)
  useEffect(() => {
    if (!editing) { previousContent.current = null; setNarrationStale(false); return }
    const text = JSON.stringify(editing.content)
    if (previousContent.current?.id === editing.id && previousContent.current.text !== text && editing.audio_url) {
      setNarrationStale(true)
      setEditing((value) => value ? { ...value, audio_url: null } : value)
    }
    previousContent.current = { id: editing.id, text }
  }, [editing])
  useEffect(() => () => { if (voiceSample) URL.revokeObjectURL(voiceSample) }, [voiceSample])

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
      audio_url: null,
      audio_voice: 'af_heart',
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
      const slug = slugify(editing.title)
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
          audio_url: editing.audio_url,
          audio_voice: editing.audio_voice,
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

  const generateNarration = async (sampleOnly = false) => {
    if (!editing || narrationController.current) return
    const container = document.createElement('div')
    const text = editing.content
      .filter((block) => block.type !== 'image' && block.type !== 'divider')
      .map((block) => {
        container.innerHTML = block.content || ''
        container.querySelectorAll('p, li, h1, h2, h3, blockquote, br').forEach((node) => node.append(document.createTextNode('\n')))
        return container.textContent?.trim() || ''
      })
      .filter(Boolean)
      .join('\n\n')
    if (!text) { setError('Add article text before generating narration'); return }

    const controller = new AbortController()
    narrationController.current = controller
    setIsGeneratingAudio(true); setError(null); setNarrationProgress('Starting voice engine…')
    try {
      const blob = await generateNarrationInWorker(sampleOnly ? text.split(/\s+/).slice(0, 24).join(' ') : text, editing.audio_voice || 'af_heart', controller.signal, setNarrationProgress)
      if (controller.signal.aborted) return
      if (sampleOnly) { setVoiceSample(URL.createObjectURL(blob)); return }
      setNarrationProgress('Uploading narration…')
      const fileName = `writings/audio/${Date.now()}-${slugify(editing.title || 'article')}.wav`
      const { error: uploadError } = await supabase.storage.from('portfolio-uploads').upload(fileName, blob, { contentType: 'audio/wav', upsert: true })
      if (uploadError) throw uploadError
      if (controller.signal.aborted) return
      const { data: { publicUrl } } = supabase.storage.from('portfolio-uploads').getPublicUrl(fileName)
      setEditing((current) => current && current.id === editing.id && JSON.stringify(current.content) === JSON.stringify(editing.content) ? { ...current, audio_url: publicUrl } : current)
      setNarrationStale(false)
    } catch (generationError) {
      setError(generationError instanceof Error ? generationError.message : 'Narration generation failed')
    } finally {
      narrationController.current = null
      setIsGeneratingAudio(false); setNarrationProgress('')
    }
  }

  if (editing) {
    return <DocumentWorkspace key={editing.id || 'new'} title={editing.title} subtitle={editing.excerpt || ''} html={blocksToDocument(editing.content)} cover={editing.cover_image}
      onTitle={title => setEditing({ ...editing, title })}
      onSubtitle={excerpt => setEditing({ ...editing, excerpt })}
      onCover={cover_image => setEditing({ ...editing, cover_image })}
      onChange={content => setEditing({ ...editing, content: [{ id: 'document', type: 'paragraph', content }] })}
      onBack={() => { if (dirty && !window.confirm('Leave the editor? Unsaved changes are available in recovery.')) return; setEditing(null); setIsCreating(false) }}
      onSave={handleSave} saving={isSaving} dirty={dirty} published={editing.published} busy={isGeneratingAudio}
      onPublished={published => setEditing({ ...editing, published })} error={error}
      recovery={<DraftTools key={editing.id || 'new'} kind="writing" draft={editing} onRestore={setEditing} />}
      settings={<>
        <label className="block text-xs space-y-2"><span>URL slug</span><input className="w-full border rounded p-2" value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} /></label>
        <details><summary>Narration</summary><div className="space-y-3 pt-3">
          <label className="block text-xs">Voice<select className="w-full border rounded p-2" disabled={isGeneratingAudio} value={editing.audio_voice || 'af_heart'} onChange={e => setEditing({ ...editing, audio_voice: e.target.value })}>{KOKORO_VOICES.map(v => <option key={v.id} value={v.id}>{v.label}</option>)}</select></label>
          <div className="flex gap-2"><button type="button" disabled={isGeneratingAudio} onClick={() => generateNarration(true)}>Preview voice</button><button type="button" disabled={isGeneratingAudio} onClick={() => generateNarration()}>Generate narration</button></div>
          {isGeneratingAudio && <><p role="status" className="text-xs">{narrationProgress}</p><button type="button" onClick={() => narrationController.current?.abort()}>Cancel generation</button></>}
          {voiceSample && <audio controls src={voiceSample} className="w-full" />}
          {editing.audio_url && <audio controls src={editing.audio_url} className="w-full" />}
          {narrationStale && <p className="text-xs">Text changed. Generate narration again before publishing.</p>}
          <label className="block text-xs">Or use an existing audio URL<input className="w-full border rounded p-2" value={editing.audio_url || ''} onChange={e => setEditing({ ...editing, audio_url: e.target.value || null })} /></label>
        </div></details>
      </>}
    />
  }

  // ── List View ────────────────────────────────────────────────────────────
  return (
    <div className="max-w-2xl space-y-6">
      <label className="flex gap-3 items-center text-xs">Show<select aria-label="Publication status" value={listFilter} onChange={(event) => setListFilter(event.target.value)} className="border rounded px-3 py-2 bg-background"><option value="all">All content</option><option value="draft">Drafts</option><option value="published">Published</option></select><span role="status">{writings.filter((item) => listFilter === 'all' || item.published === (listFilter === 'published')).length} results</span></label>
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
          {writings.filter((item) => listFilter === 'all' || item.published === (listFilter === 'published')).map((w, idx) => (
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
