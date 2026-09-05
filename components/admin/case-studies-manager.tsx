'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { compressImage, uploadFileWithProgress, formatFileSize } from '@/lib/upload-utils'
import ProgressiveImage from '@/components/progressive-image'
import ButtonBlockBuilder from './button-block-builder'
import SafeEmbed from '@/components/safe-embed'
import SafeHtml from '@/components/safe-html'
import CaseSectionBody from '@/components/case-section-body'
import { useEditorGuard } from '@/hooks/use-editor-guard'
import DraftTools from './draft-tools'
import MediaLibrary from './media-library'

const RTFEditor = dynamic(() => import('./rtf-editor'), { ssr: false })

interface ButtonItem {
  id: string
  text: string
  link: string
  variant: 'primary' | 'secondary' | 'outline'
}

interface ContentBlock {
  id: string
  type: 'paragraph' | 'buttons' | 'image' | 'video' | 'divider'
  content?: string
  buttons?: ButtonItem[]
  imageUrl?: string
  alignment?: 'left' | 'center' | 'right'
}

interface Section {
  id: string
  label: string
  title: string | null
  body: string
  toc: string | null
  image: string | null
  video_url?: string | null
  embed_url?: string | null
  media_width?: 'reading' | 'wide' | 'full'
  blocks?: ContentBlock[]
}

interface CaseStudy {
  id: string
  title: string
  slug: string
  thumbnail_url: string | null
  video_url: string | null
  media_type: 'image' | 'video'
  excerpt: string | null
  sections: Section[]
  blocks?: ContentBlock[]
  published: boolean
  cta_text: string | null
  cta_link: string | null
  order_index: number
  related_article_id: string | null
}

interface RelatedArticleOption {
  id: string
  title: string
  excerpt: string | null
  cover_image: string | null
  published: boolean
}

interface CaseStudiesManagerProps {
  userId: string
  onEditorOpenChange?: (open: boolean) => void
}

const refreshList = async () => {
  const supabase = createClient()
  const { data } = await supabase
    .from('case_studies')
    .select('*')
    .order('created_at', { ascending: false })
  return (data || []).map(cs => ({
    ...cs,
    sections: Array.isArray(cs.sections) ? cs.sections : [],
  })) as CaseStudy[]
}

export default function CaseStudiesManager({ userId, onEditorOpenChange }: CaseStudiesManagerProps) {
  const [caseStudies, setCaseStudies] = useState<CaseStudy[]>([])
  const [editing, setEditing] = useState<CaseStudy | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [listFilter, setListFilter] = useState('all')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [draggedSectionId, setDraggedSectionId] = useState<string | null>(null)
  const [articleOptions, setArticleOptions] = useState<RelatedArticleOption[]>([])
  const draftDirty = useEditorGuard(editing)
  const [showPreview, setShowPreview] = useState(false)
  const [previewMobile, setPreviewMobile] = useState(false)
  useEffect(() => { setHasUnsavedChanges(draftDirty) }, [draftDirty])

  useEffect(() => {
    onEditorOpenChange?.(Boolean(editing))
    return () => onEditorOpenChange?.(false)
  }, [editing, onEditorOpenChange])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) return
      event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [hasUnsavedChanges])

  useEffect(() => {
    refreshList().then(setCaseStudies)
    createClient().from('writings').select('id, title, excerpt, cover_image, published').order('created_at', { ascending: false })
      .then(({ data }) => setArticleOptions((data || []) as RelatedArticleOption[]))
  }, [])

  const createNewCaseStudy = () => {
    const firstSectionId = crypto.randomUUID()
    setEditing({
      id: '',
      title: '',
      slug: '',
      thumbnail_url: null,
      video_url: null,
      media_type: 'image',
      excerpt: null,
      sections: [{ id: firstSectionId, label: '', title: null, body: '', toc: null, image: null, embed_url: null, media_width: 'wide', blocks: [] }],
      blocks: [],
      published: false,
      cta_text: null,
      cta_link: null,
      order_index: caseStudies.length,
      related_article_id: null,
    })
    setSelectedSectionId(firstSectionId)
    setIsCreating(true)
  }

  const addSection = () => {
    if (!editing) return
    const newSection: Section = {
      id: crypto.randomUUID(),
      label: '',
      title: null,
      body: '',
      toc: null,
      image: null,
      embed_url: null,
      media_width: 'wide',
      blocks: []
    }
    setEditing({
      ...editing,
      sections: [...editing.sections, newSection]
    })
    setSelectedSectionId(newSection.id)
  }

  const updateSection = (sectionId: string, updates: Partial<Section>) => {
    if (!editing) return
    setHasUnsavedChanges(true)
    if (selectedSectionId === sectionId) {
      setSelectedSectionId(editing.sections.find((section) => section.id !== sectionId)?.id || null)
    }
    setEditing({
      ...editing,
      sections: editing.sections.map(s => s.id === sectionId ? { ...s, ...updates } : s),
    })
  }

  const deleteSection = (sectionId: string) => {
    if (!editing) return
    setEditing({
      ...editing,
      sections: editing.sections.filter(s => s.id !== sectionId),
    })
    setHasUnsavedChanges(true)
  }

  const moveSection = (sectionId: string, direction: 'up' | 'down') => {
    if (!editing) return
    const index = editing.sections.findIndex(s => s.id === sectionId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === editing.sections.length - 1) return
    const next = [...editing.sections]
    const swap = direction === 'up' ? index - 1 : index + 1
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setEditing({ ...editing, sections: next })
    setHasUnsavedChanges(true)
  }

  const reorderSection = (sourceId: string, targetId: string) => {
    if (!editing || sourceId === targetId) return
    const next = [...editing.sections]
    const sourceIndex = next.findIndex((section) => section.id === sourceId)
    const targetIndex = next.findIndex((section) => section.id === targetId)
    if (sourceIndex < 0 || targetIndex < 0) return
    const [moved] = next.splice(sourceIndex, 1)
    next.splice(targetIndex, 0, moved)
    setEditing({ ...editing, sections: next })
    setHasUnsavedChanges(true)
  }

  const generateNavItems = (sections: Section[]) =>
    sections.filter(s => s.toc).map(s => ({ id: s.id, label: s.toc!, toc: s.toc! }))

  const handleThumbnailUpload = async (file: File) => {
    if (!editing) return
    
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    
    try {
      // Compress image first
      const compressedFile = await compressImage(file, 1920, 1080, 0.8)
      
      const supabase = createClient()
      const fileName = `case-studies/thumbnails/${Date.now()}-${file.name}`
      
      const result = await uploadFileWithProgress(
        supabase,
        'portfolio-uploads',
        fileName,
        compressedFile,
        (progress) => setUploadProgress(progress)
      )
      
      if (!result.success) {
        setError(result.error || 'Upload failed')
        return
      }
      
      setEditing({ ...editing, thumbnail_url: result.publicUrl ?? null })
      setUploadProgress(0)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleVideoUpload = async (file: File) => {
    if (!editing) return
    
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    
    try {
      const supabase = createClient()
      const fileName = `case-studies/videos/${Date.now()}-${file.name}`
      
      const result = await uploadFileWithProgress(
        supabase,
        'portfolio-uploads',
        fileName,
        file,
        (progress) => setUploadProgress(progress)
      )
      
      if (!result.success) {
        setError(result.error || 'Upload failed')
        return
      }
      
      setEditing({ ...editing, video_url: result.publicUrl ?? null })
      setUploadProgress(0)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSectionImageUpload = async (sectionId: string, file: File) => {
    if (!editing) return
    
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    
    try {
      // Compress image first
      const compressedFile = await compressImage(file, 1920, 1080, 0.8)
      
      const supabase = createClient()
      const fileName = `case-studies/sections/${Date.now()}-${file.name}`
      
      const result = await uploadFileWithProgress(
        supabase,
        'portfolio-uploads',
        fileName,
        compressedFile,
        (progress) => setUploadProgress(progress)
      )
      
      if (!result.success) {
        setError(result.error || 'Upload failed')
        return
      }
      
      updateSection(sectionId, { image: result.publicUrl })
      setUploadProgress(0)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUploading(false)
    }
  }

  const handleSectionVideoUpload = async (sectionId: string, file: File) => {
    if (!editing) return
    
    setIsUploading(true)
    setUploadProgress(0)
    setError(null)
    
    try {
      const supabase = createClient()
      const fileName = `case-studies/sections/videos/${Date.now()}-${file.name}`
      
      const result = await uploadFileWithProgress(
        supabase,
        'portfolio-uploads',
        fileName,
        file,
        (progress) => setUploadProgress(progress)
      )
      
      if (!result.success) {
        setError(result.error || 'Upload failed')
        return
      }
      
      updateSection(sectionId, { video_url: result.publicUrl })
      setUploadProgress(0)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setIsUploading(false)
    }
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
      const res = await fetch('/api/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          title: editing.title,
          slug,
          thumbnail_url: editing.thumbnail_url,
          video_url: editing.video_url,
          media_type: editing.media_type,
          excerpt: editing.excerpt,
          sections: editing.sections,
          nav_items: generateNavItems(editing.sections),
          published: editing.published,
          cta_text: editing.cta_text,
          cta_link: editing.cta_link,
          related_article_id: editing.related_article_id,
          isUpdate: !isCreating,
        }),
      })
      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save')
      setHasUnsavedChanges(false)
      setSuccess(true)
      setEditing(null)
      setIsCreating(false)
      setCaseStudies(await refreshList())
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this case study?')) return
    await fetch(`/api/case-studies?id=${id}`, { method: 'DELETE' })
    setCaseStudies(await refreshList())
  }

  // ── Upload Progress Banner ───────────────────────────────────────────────
  const UploadProgress = () => isUploading ? (
    <div className="flex items-center gap-3 p-3 bg-foreground/5 border border-border rounded-lg">
      <div className="w-4 h-4 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-foreground/60">Uploading...</span>
          <span className="text-xs text-foreground/60">{uploadProgress}%</span>
        </div>
        <div className="w-full bg-foreground/10 rounded-full h-1">
          <div className="bg-foreground h-1 rounded-full transition-all" style={{ width: `${uploadProgress}%` }} />
        </div>
      </div>
    </div>
  ) : null

  // ── Editor View ──────────────────────────────────────────────────────────
  if (editing) {
    const selectedSection = editing.sections.find((section) => section.id === selectedSectionId) || editing.sections[0] || null
    const validationIssues = [
      !editing.title.trim() ? 'Add a project title' : null,
      !editing.excerpt?.trim() ? 'Add a short summary' : null,
      !editing.thumbnail_url ? 'Add a cover thumbnail' : null,
      editing.sections.length === 0 ? 'Add at least one section' : null,
      editing.sections.some((section) => !section.label.trim() && !section.title?.trim()) ? 'Name every section' : null,
      editing.sections.some((section) => !section.body.trim() && !section.image && !section.video_url && !section.embed_url) ? 'Some sections have no content' : null,
    ].filter(Boolean) as string[]
    return (
      <div className="max-w-none space-y-5" onInput={() => setHasUnsavedChanges(true)}>
        <DraftTools key={editing.id || 'new'} kind="case-study" draft={editing} onRestore={setEditing} />
        {/* Header */}
        <div className="sticky top-0 z-20 flex items-center justify-between py-3 px-1 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                if (hasUnsavedChanges && !window.confirm('Discard unsaved changes?')) return
                setHasUnsavedChanges(false)
                setEditing(null)
                setIsCreating(false)
              }}
              className="p-1.5 rounded-lg hover:bg-foreground/5 transition-colors text-foreground/50 hover:text-foreground"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h2 className="text-base font-semibold text-foreground">{isCreating ? 'New case study' : 'Edit case study'}</h2>
              <p role="status" className="text-xs text-foreground/60 mt-0.5">{isSaving ? 'Saving…' : hasUnsavedChanges ? 'Unsaved changes' : isCreating ? 'New draft' : 'No unsaved changes'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="min-h-9 px-3 text-xs rounded-lg hover:bg-muted" aria-expanded={showPreview} onClick={() => setShowPreview(!showPreview)}>{showPreview ? 'Hide preview' : 'Preview'}</button>
            <label className="flex items-center gap-2 text-sm text-foreground/60 cursor-pointer select-none">
              <div
                onClick={() => setEditing({ ...editing, published: !editing.published })}
                className={`w-9 h-5 rounded-full transition-colors relative cursor-pointer ${editing.published ? 'bg-foreground' : 'bg-foreground/20'}`}
              >
                <div className={`absolute top-0.5 w-4 h-4 bg-background rounded-full shadow transition-transform ${editing.published ? 'translate-x-4' : 'translate-x-0.5'}`} />
              </div>
              {editing.published ? 'Published' : 'Draft'}
            </label>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-foreground text-background text-sm font-medium rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
            >
              {isSaving && <div className="w-3.5 h-3.5 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
              {isSaving ? 'Saving...' : editing.published ? 'Save changes' : 'Save draft'}
            </button>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-destructive/8 border border-destructive/20 rounded-lg text-sm text-destructive">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}
        {success && (
          <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Saved successfully
          </div>
        )}

        <UploadProgress />

        <div className="w-full max-w-3xl mx-auto">
          <aside className="hidden">
            <div className="px-3 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Sections</p>
                <p className="text-[11px] text-foreground/40 mt-0.5">Drag order with arrows</p>
              </div>
              <button type="button" onClick={addSection} className="size-7 rounded-md border border-border hover:bg-foreground/5" aria-label="Add section">+</button>
            </div>
            <nav className="p-2 space-y-1 max-h-[calc(100vh-180px)] overflow-y-auto" aria-label="Case study sections">
              {editing.sections.map((section, index) => (
                <button
                  type="button"
                  draggable
                  key={section.id}
                  onClick={() => setSelectedSectionId(section.id)}
                  onDragStart={() => setDraggedSectionId(section.id)}
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={() => {
                    if (draggedSectionId) reorderSection(draggedSectionId, section.id)
                    setDraggedSectionId(null)
                  }}
                  onDragEnd={() => setDraggedSectionId(null)}
                  className={`w-full text-left px-2.5 py-2 rounded-lg transition-colors ${selectedSection?.id === section.id ? 'bg-foreground text-background' : 'hover:bg-foreground/5 text-foreground/60'}`}
                >
                  <span className="block text-[10px] opacity-50 tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                  <span className="block text-xs font-medium truncate mt-0.5">{section.label || section.title || 'Untitled section'}</span>
                </button>
              ))}
            </nav>
          </aside>

          <div className="space-y-5 min-w-0">

        {/* Meta */}
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border bg-muted/30">
            <p className="text-sm font-medium text-foreground">Details</p>
            <p className="text-xs text-foreground/50 mt-0.5">Basic info and cover media</p>
            <MediaLibrary value={editing.thumbnail_url} onSelect={(url) => setEditing({ ...editing, thumbnail_url: url })} />
          </div>
          <div className="px-6 py-5 space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="case-study-name" className="text-xs font-medium text-foreground/60">Case study name</label>
              <input
                id="case-study-name"
                aria-invalid={error === 'Title is required'}
                aria-describedby={error === 'Title is required' ? 'case-name-error' : undefined}
                type="text"
                placeholder="Case study title"
                value={editing.title}
                onChange={(e) => {
                  const title = e.target.value
                  const slug = title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
                  setEditing({ ...editing, title, slug })
                }}
                className="w-full px-3 py-2.5 text-base font-medium border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
              />
              {error === 'Title is required' && <p id="case-name-error" role="alert" className="text-xs text-red-600">Enter a case study name before saving.</p>}
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/60">Slug <span className="text-foreground/30">(auto-generated)</span></label>
              <input
                type="text"
                placeholder="url-slug"
                value={editing.slug}
                readOnly
                className="w-full px-3 py-2 text-sm font-mono border border-border rounded-lg bg-muted/30 text-foreground/50 cursor-not-allowed"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground/60">Excerpt</label>
              <textarea
                placeholder="Short description shown in previews"
                value={editing.excerpt || ''}
                onChange={(e) => setEditing({ ...editing, excerpt: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow resize-none"
                rows={3}
              />
            </div>

            {/* Cover Media */}
            <div className="space-y-3 pt-2 border-t border-border">
              <div>
                <p className="text-xs font-medium text-foreground/60 mb-2">Cover Media Type</p>
                <div className="inline-flex rounded-lg border border-border overflow-hidden">
                  <button
                    onClick={() => setEditing({ ...editing, media_type: 'image' })}
                    className={`px-4 py-1.5 text-xs font-medium transition-colors ${editing.media_type === 'image' ? 'bg-foreground text-background' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}
                  >
                    Image
                  </button>
                  <button
                    onClick={() => setEditing({ ...editing, media_type: 'video' })}
                    className={`px-4 py-1.5 text-xs font-medium transition-colors border-l border-border ${editing.media_type === 'video' ? 'bg-foreground text-background' : 'text-foreground/60 hover:text-foreground hover:bg-foreground/5'}`}
                  >
                    Video
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div>
                  <p className="text-xs text-foreground/50 mb-2">Thumbnail</p>
                  {editing.thumbnail_url ? (
                    <div className="relative group w-32 h-24 rounded-xl overflow-hidden border border-border">
                      <img src={editing.thumbnail_url} alt="" className="w-full h-full object-cover" />
                      <button
                        onClick={() => setEditing({ ...editing, thumbnail_url: null })}
                        disabled={isUploading}
                        className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        <span className="text-white text-xs font-medium">Remove</span>
                      </button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-32 h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-foreground/40 transition-colors bg-muted/20" style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.5 : 1 }}>
                      <svg className="w-5 h-5 text-foreground/30 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-xs text-foreground/40">Upload</span>
                      <input type="file" accept="image/*" className="hidden" disabled={isUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleThumbnailUpload(f) }} />
                    </label>
                  )}
                </div>

                {/* Video */}
                {editing.media_type === 'video' && (
                  <div>
                    <p className="text-xs text-foreground/50 mb-2">Cover Video</p>
                    {editing.video_url ? (
                      <div className="relative group w-32 h-24 rounded-xl overflow-hidden border border-border bg-black">
                        <video src={editing.video_url} className="w-full h-full object-cover" />
                        <button
                          onClick={() => setEditing({ ...editing, video_url: null })}
                          disabled={isUploading}
                          className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        >
                          <span className="text-white text-xs font-medium">Remove</span>
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-32 h-24 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-foreground/40 transition-colors bg-muted/20" style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.5 : 1 }}>
                        <svg className="w-5 h-5 text-foreground/30 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-foreground/40">Upload Video</span>
                        <input type="file" accept="video/*" className="hidden" disabled={isUploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) handleVideoUpload(f) }} />
                      </label>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Optional project link */}
            <details className="group pt-2 border-t border-border">
              <summary className="cursor-pointer list-none text-xs font-medium text-foreground/55 hover:text-foreground transition-colors">
                Add an optional project link
              </summary>
            <div className="grid grid-cols-2 gap-3 pt-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/60">CTA Button Label</label>
                <input
                  type="text"
                  placeholder="View Project"
                  value={editing.cta_text || ''}
                  onChange={(e) => setEditing({ ...editing, cta_text: e.target.value || null })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground/60">CTA URL</label>
                <input
                  type="url"
                  placeholder="https://example.com"
                  value={editing.cta_link || ''}
                  onChange={(e) => setEditing({ ...editing, cta_link: e.target.value || null })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
                />
              </div>
            </div>
            </details>
          </div>
        </div>

        {/* Sections */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-medium text-foreground">Article content</p>
              <p className="text-xs text-foreground/40 mt-0.5">Write naturally. Add a section for each chapter.</p>
            </div>
            <button
              onClick={addSection}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-foreground/5 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add section
            </button>
          </div>

          <div className="space-y-3">
            {editing.sections.map((section) => {
              const index = editing.sections.findIndex((item) => item.id === section.id)
              return (
              <div key={section.id} className="border border-border rounded-xl overflow-hidden">
                {/* Section top bar */}
                <div className="flex items-center gap-3 px-4 py-3 bg-muted/30 border-b border-border">
                  <span className="text-xs font-medium text-foreground/40 bg-background border border-border px-2 py-0.5 rounded-md tabular-nums">{String(index + 1).padStart(2, '0')}</span>
                  <input
                    type="text"
                    placeholder="Section label (e.g., The Problem)"
                    value={section.label}
                    onChange={(e) => {
                      const label = e.target.value
                      updateSection(section.id, {
                        label,
                        toc: !section.toc || section.toc === section.label ? label : section.toc,
                      })
                    }}
                    className="flex-1 text-sm font-medium bg-transparent border-0 focus:outline-none text-foreground placeholder:text-foreground/30"
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCollapsedSections((current) => {
                        const next = new Set(current)
                        if (next.has(section.id)) next.delete(section.id)
                        else next.add(section.id)
                        return next
                      })}
                      className="p-1.5 rounded-md text-foreground/40 hover:text-foreground hover:bg-background transition-all"
                      aria-label={collapsedSections.has(section.id) ? 'Expand section' : 'Collapse section'}
                    >
                      <span className="block transition-transform" style={{ transform: collapsedSections.has(section.id) ? 'rotate(-90deg)' : 'rotate(0deg)' }}>⌄</span>
                    </button>
                    <button
                      onClick={() => moveSection(section.id, 'up')}
                      disabled={index === 0}
                      className="p-1.5 rounded-md text-foreground/30 hover:text-foreground hover:bg-background disabled:opacity-20 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      onClick={() => moveSection(section.id, 'down')}
                      disabled={index === editing.sections.length - 1}
                      className="p-1.5 rounded-md text-foreground/30 hover:text-foreground hover:bg-background disabled:opacity-20 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    <button
                      onClick={() => deleteSection(section.id)}
                      className="p-1.5 rounded-md text-foreground/30 hover:text-red-500 hover:bg-red-50 transition-all"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                    </button>
                  </div>
                </div>

                {!collapsedSections.has(section.id) && <div className="px-5 py-5 space-y-4">
                  <div className="space-y-1.5">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground/50">Section heading <span className="text-foreground/30">(optional)</span></label>
                      <input
                        type="text"
                        placeholder="Displayed as heading"
                        value={section.title || ''}
                        onChange={(e) => updateSection(section.id, { title: e.target.value || null })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
                      />
                    </div>
                    <details className="group">
                      <summary className="cursor-pointer list-none text-xs text-foreground/40 hover:text-foreground transition-colors">Navigation label</summary>
                    <div className="space-y-1.5 pt-2">
                      <label className="text-xs font-medium text-foreground/50">Table of contents label <span className="text-foreground/30">(leave blank to hide)</span></label>
                      <input
                        type="text"
                        placeholder="Table of contents label"
                        value={section.toc || ''}
                        onChange={(e) => updateSection(section.id, { toc: e.target.value || null })}
                        className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
                      />
                    </div>
                    </details>
                  </div>

                  {/* Body */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground/50">Content</label>
                    <RTFEditor
                      value={section.body}
                      onChange={(value) => updateSection(section.id, { body: value })}
                      placeholder="Start writing..."
                    />
                  </div>

                  {/* Media row */}
                  <div className="flex gap-4">
                    {/* Image */}
                    <div>
                      <p className="text-xs font-medium text-foreground/50 mb-1.5">Image</p>
                      {section.image ? (
                        <div className="relative group w-28 h-20 rounded-lg overflow-hidden border border-border">
                          <img src={section.image} alt="" className="w-full h-full object-cover" />
                          <button onClick={() => updateSection(section.id, { image: null })} disabled={isUploading} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs">Remove</span>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-28 h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground/40 transition-colors bg-muted/20 text-foreground/30" style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.5 : 1 }}>
                          <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>
                          <span className="text-xs">Image</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSectionImageUpload(section.id, f) }} />
                        </label>
                      )}
                    </div>
                    {/* Video */}
                    <div>
                      <p className="text-xs font-medium text-foreground/50 mb-1.5">Video</p>
                      {section.video_url ? (
                        <div className="relative group w-28 h-20 rounded-lg overflow-hidden border border-border bg-black">
                          <video src={section.video_url} className="w-full h-full object-cover" />
                          <button onClick={() => updateSection(section.id, { video_url: null })} disabled={isUploading} className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-white text-xs">Remove</span>
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-28 h-20 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-foreground/40 transition-colors bg-muted/20 text-foreground/30" style={{ pointerEvents: isUploading ? 'none' : 'auto', opacity: isUploading ? 0.5 : 1 }}>
                          <svg className="w-4 h-4 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                          <span className="text-xs">Video</span>
                          <input type="file" accept="video/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleSectionVideoUpload(section.id, f) }} />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="hidden">
                    <label className="text-xs font-medium text-foreground/50">Media width</label>
                    <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted/40 p-1">
                      {(['reading', 'wide', 'full'] as const).map((width) => (
                        <button
                          type="button"
                          key={width}
                          onClick={() => updateSection(section.id, { media_width: width })}
                          className={`px-2 py-1.5 rounded-md text-xs capitalize transition-colors ${(section.media_width || 'wide') === width ? 'bg-background shadow-sm text-foreground' : 'text-foreground/45 hover:text-foreground'}`}
                        >
                          {width}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Safe external embed */}
                  <details className="group pt-3 border-t border-border">
                    <summary className="cursor-pointer list-none text-xs font-medium text-foreground/55 hover:text-foreground transition-colors">Embed YouTube, Vimeo or Figma</summary>
                  <div className="space-y-1.5 pt-3">
                    <label className="text-xs font-medium text-foreground/50">Embed link</label>
                    <input
                      type="url"
                      placeholder="Paste a YouTube, Vimeo or Figma link"
                      value={section.embed_url || ''}
                      onChange={(e) => updateSection(section.id, { embed_url: e.target.value || null })}
                      className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20 transition-shadow"
                    />
                    <p className="text-xs text-foreground/35">Paste the link. The embedded content appears in this section.</p>
                    {section.embed_url && <SafeEmbed url={section.embed_url} title={`${section.label || 'Section'} embed preview`} />}
                  </div>
                  </details>

                  {/* Buttons */}
                  <details className="group pt-3 border-t border-border">
                    <summary className="cursor-pointer list-none text-xs font-medium text-foreground/55 hover:text-foreground transition-colors">Add buttons</summary>
                  <div className="pt-3">
                    <ButtonBlockBuilder
                      buttons={section.blocks?.filter(b => b.type === 'buttons')[0]?.buttons || []}
                      onChange={(updatedButtons) => {
                        const otherBlocks = section.blocks?.filter(b => b.type !== 'buttons') || []
                        const buttonBlock: ContentBlock = { id: crypto.randomUUID(), type: 'buttons', buttons: updatedButtons }
                        updateSection(section.id, { blocks: updatedButtons.length > 0 ? [...otherBlocks, buttonBlock] : otherBlocks })
                      }}
                    />
                  </div>
                  </details>
                </div>}
              </div>
            )})}
          </div>
        </div>

        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-border bg-muted/30">
            <p className="text-sm font-medium">Related article</p>
            <p className="text-xs text-foreground/45 mt-0.5">Shown beneath the finished case study</p>
          </div>
          <div className="p-5 space-y-3">
            <select
              value={editing.related_article_id || ''}
              onChange={(event) => {
                setEditing({ ...editing, related_article_id: event.target.value || null })
                setHasUnsavedChanges(true)
              }}
              className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-foreground/20"
            >
              <option value="">No related article</option>
              {articleOptions.map((article) => <option key={article.id} value={article.id}>{article.title}{article.published ? '' : ' (Draft)'}</option>)}
            </select>
            {editing.related_article_id && (() => {
              const article = articleOptions.find((item) => item.id === editing.related_article_id)
              return article ? (
                <div className="flex gap-3 items-center p-3 rounded-lg bg-muted/30">
                  {article.cover_image && <img src={article.cover_image} alt="" className="w-16 h-12 object-cover rounded-md" />}
                  <div className="min-w-0"><p className="text-sm font-medium truncate">{article.title}</p><p className="text-xs text-foreground/45 truncate mt-0.5">{article.excerpt || 'No summary'}</p></div>
                </div>
              ) : null
            })()}
          </div>
        </div>

        <div className="rounded-xl bg-muted/30 px-5 py-4">
          <p className="text-xs font-medium mb-2">Before publishing</p>
          {validationIssues.length === 0 ? (
            <p className="text-xs text-green-600">Everything looks ready.</p>
          ) : (
            <ul className="space-y-1.5">
              {validationIssues.map((issue) => <li key={issue} className="text-xs text-amber-700">• {issue}</li>)}
            </ul>
          )}
        </div>
          </div>

          <aside style={{ maxWidth: previewMobile ? 375 : 600 }} className={showPreview ? 'w-full mx-auto rounded-lg border border-border' : 'hidden'}>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">Live preview</p>
                <p className="text-[11px] text-foreground/40 mt-0.5">Selected section</p>
              </div>
              <button type="button" className="text-xs underline" onClick={() => setPreviewMobile(!previewMobile)}>{previewMobile ? 'Mobile · switch' : 'Desktop · switch'}</button>
            </div>
            <div className="p-5 max-h-[calc(100vh-180px)] overflow-y-auto">
              {selectedSection ? (
                <article>
                  {selectedSection.label && <p className="text-[11px] text-foreground/40 mb-2">{selectedSection.label}</p>}
                  {selectedSection.title && <h3 className="text-[18px] font-medium tracking-[-0.01em] mb-4">{selectedSection.title}</h3>}
                  {selectedSection.image && <img src={selectedSection.image} alt="" className="w-full h-auto mb-4" />}
                  {selectedSection.video_url && <video src={selectedSection.video_url} controls className="w-full h-auto mb-4 bg-black" />}
                  {selectedSection.embed_url && <div className="mb-4"><SafeEmbed url={selectedSection.embed_url} title="Embed preview" /></div>}
                <CaseSectionBody html={selectedSection.body} />
                </article>
              ) : <p className="text-xs text-foreground/40">Add a section to begin.</p>}

              <div className="mt-6 pt-5 border-t border-border">
                <p className="text-xs font-medium mb-2">Pre-publish check</p>
                {validationIssues.length === 0 ? (
                  <p className="text-xs text-green-600">Ready to publish</p>
                ) : (
                  <ul className="space-y-1.5">
                    {validationIssues.map((issue) => <li key={issue} className="text-[11px] text-amber-700">• {issue}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </aside>
        </div>
      </div>
    )
  }

  // ── List View ────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <label className="flex gap-3 items-center text-xs">Show<select aria-label="Publication status" value={listFilter} onChange={(event) => setListFilter(event.target.value)} className="border rounded px-3 py-2 bg-background"><option value="all">All content</option><option value="draft">Drafts</option><option value="published">Published</option></select><span role="status">{caseStudies.filter((item) => listFilter === 'all' || item.published === (listFilter === 'published')).length} results</span></label>
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Case Studies</h2>
          <p className="text-sm text-foreground/50 mt-0.5">{caseStudies.length} total &mdash; {caseStudies.filter(c => c.published).length} published</p>
        </div>
        <button
          onClick={createNewCaseStudy}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          New Case Study
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/8 border border-destructive/20 rounded-lg text-sm text-destructive">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
          Saved successfully
        </div>
      )}

      {caseStudies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl text-center">
          <svg className="w-10 h-10 text-foreground/20 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <p className="text-sm font-medium text-foreground/40">No case studies yet</p>
          <p className="text-xs text-foreground/30 mt-1">Create your first one to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {caseStudies.filter((item) => listFilter === 'all' || item.published === (listFilter === 'published')).map((cs, index) => (
            <div key={cs.id} className="group border border-border rounded-xl overflow-hidden hover:border-foreground/20 transition-all bg-background">
              {/* Thumbnail */}
              <div className="aspect-[16/9] bg-muted/30 relative overflow-hidden">
                {cs.thumbnail_url ? (
                  <ProgressiveImage
                    src={cs.thumbnail_url}
                    alt={cs.title}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-500"
                    containerClassName="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/15">
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cs.published ? 'bg-green-500 text-white' : 'bg-foreground/60 text-background'}`}>
                    {cs.published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <div className="absolute top-2.5 left-2.5">
                  <span className="text-xs bg-black/30 text-white px-2 py-0.5 rounded-full tabular-nums">#{index + 1}</span>
                </div>
              </div>

              {/* Info */}
              <div className="p-4">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground leading-tight">{cs.title || 'Untitled'}</h4>
                </div>
                <p className="text-xs text-foreground/50 line-clamp-2 mb-4 leading-relaxed">{cs.excerpt || 'No description added'}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(cs)
                      setSelectedSectionId(cs.sections[0]?.id || null)
                      setHasUnsavedChanges(false)
                      setIsCreating(false)
                    }}
                    className="flex-1 px-3 py-1.5 text-xs font-medium border border-border rounded-lg hover:bg-foreground/5 transition-colors"
                  >
                    Edit
                  </button>
                  <a
                    href={`/case-studies/${cs.slug || cs.id}`}
                    target="_blank"
                    className="p-1.5 border border-border rounded-lg hover:bg-foreground/5 transition-colors text-foreground/50 hover:text-foreground"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                  </a>
                  <button
                    onClick={() => handleDelete(cs.id)}
                    className="p-1.5 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-red-500"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
