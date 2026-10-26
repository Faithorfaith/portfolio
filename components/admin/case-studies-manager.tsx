'use client'

import AppIcon from '@/components/icons/app-icon'
import { useState, useEffect } from 'react'
import { documentNavigation } from '@/lib/document-content'
import { createClient } from '@/lib/supabase/client'
import dynamic from 'next/dynamic'
import { compressImage, uploadFileWithProgress } from '@/lib/upload-utils'
import ProgressiveImage from '@/components/progressive-image'
import { useEditorGuard } from '@/hooks/use-editor-guard'
import DraftTools from './draft-tools'
import CaseMedia from '@/components/case-media'

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
  image_layout?: 'single' | 'feature-split' | 'grid-2' | 'grid-3'
  gallery_images?: string[]
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
    .order('order_index', { ascending: true })
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
  const [draggedCaseStudyId, setDraggedCaseStudyId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
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
      sections: [{ id: firstSectionId, label: '', title: null, body: '', toc: null, image: null, embed_url: null, media_width: 'wide', image_layout: 'single', gallery_images: [], blocks: [] }],
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
      image_layout: 'single',
      gallery_images: [],
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
    sections.flatMap(s => [...(s.toc ? [{ id: s.id, label: s.toc, toc: s.toc }] : []), ...documentNavigation(s.body)])

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

  const handleSectionGalleryUpload = async (sectionId: string, files: FileList) => {
    if (!editing || !files.length) return
    setIsUploading(true); setUploadProgress(0); setError(null)
    try {
      const supabase = createClient()
      const urls: string[] = []
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const compressed = /^image\/(jpeg|png|webp)$/.test(file.type) ? await compressImage(file, 2400, 1800, 0.86) : file
        const result = await uploadFileWithProgress(supabase, 'portfolio-uploads', `case-studies/sections/gallery/${Date.now()}-${i}-${file.name}`, compressed, progress => setUploadProgress(Math.round(((i + progress / 100) / files.length) * 100)))
        if (!result.success || !result.publicUrl) throw new Error(result.error || 'Upload failed')
        urls.push(result.publicUrl)
      }
      const section = editing.sections.find(item => item.id === sectionId)
      updateSection(sectionId, { gallery_images: [...(section?.gallery_images || []), ...urls], image: null })
    } catch (err) { setError((err as Error).message) }
    finally { setIsUploading(false); setUploadProgress(0) }
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
      const firstSectionImage = editing.sections.flatMap(section => section.gallery_images || []).find(Boolean) || editing.sections.map(section => section.image).find(Boolean)
      const res = await fetch('/api/case-studies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editing.id,
          title: editing.title,
          slug,
          thumbnail_url: editing.thumbnail_url || firstSectionImage,
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

  const toggleLocked = async (caseStudy: CaseStudy) => {
    const nextPublished = !caseStudy.published
    const response = await fetch('/api/case-studies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...caseStudy, published: nextPublished, isUpdate: true }) })
    if (!response.ok) { setError('Could not update project access'); return }
    setCaseStudies(await refreshList())
  }

  const moveCaseStudy = (draggedId: string, targetId: string) => {
    if (draggedId === targetId || listFilter !== 'all' || isReordering) return
    setCaseStudies((current) => {
      const from = current.findIndex((item) => item.id === draggedId)
      const to = current.findIndex((item) => item.id === targetId)
      if (from < 0 || to < 0) return current
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved)
      return next.map((item, order_index) => ({ ...item, order_index }))
    })
  }

  const saveCaseStudyOrder = async () => {
    if (!draggedCaseStudyId || listFilter !== 'all') return
    const previous = await refreshList()
    setDraggedCaseStudyId(null)
    setIsReordering(true)
    setError(null)
    try {
      const response = await fetch('/api/case-studies', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderedIds: caseStudies.map((item) => item.id) }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to save order')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
    } catch (reorderError) {
      setCaseStudies(previous)
      setError(reorderError instanceof Error ? reorderError.message : 'Failed to save order')
    } finally {
      setIsReordering(false)
    }
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

  if (editing) {
    const closeEditor = () => { if (draftDirty && !window.confirm('Leave the editor? Unsaved changes are available in recovery.')) return; setEditing(null); setIsCreating(false) }
    return <div className="case-admin-editor">
      <header className="case-admin-toolbar"><button type="button" onClick={closeEditor}><AppIcon name="ArrowLeft" /> All case studies</button><span>{draftDirty ? 'Unsaved changes' : 'All changes saved'}</span><a href={editing.id ? `/case-studies/${editing.slug || editing.id}` : '#'} target="_blank" aria-disabled={!editing.id}>Preview <AppIcon name="ArrowUpRight" /></a><button type="button" className="case-admin-save" disabled={isSaving || isUploading} onClick={handleSave}>{isSaving ? 'Saving…' : editing.published ? 'Save & publish' : 'Save draft'}</button></header>
      {error && <p className="case-admin-error" role="alert">{error}</p>}
      <div className="case-admin-layout">
        <div className="case-admin-story">
          <section className="case-admin-hero-card">
            <p>Opening</p>
            <input className="case-admin-title" value={editing.title} onChange={e => setEditing({ ...editing, title: e.target.value, slug: e.target.value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') })} placeholder="Case study title" />
            <div className="case-admin-cover">
              {editing.thumbnail_url ? <><img src={editing.thumbnail_url} alt="" /><button type="button" onClick={() => setEditing({ ...editing, thumbnail_url: null })}>Remove cover</button></> : <label><span>Add cover image</span><small>Recommended 1600 × 1067 or larger</small><input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleThumbnailUpload(e.target.files[0])} /></label>}
            </div>
            <textarea value={editing.excerpt || ''} onChange={e => setEditing({ ...editing, excerpt: e.target.value })} placeholder="Introduce the problem, the work, and the outcome in one clear paragraph." rows={5} />
          </section>

          <div className="case-admin-chapters">
            {editing.sections.map((section, index) => <section className="case-admin-chapter" key={section.id}>
              <header><div><span>{String(index + 1).padStart(2, '0')}</span><strong>Story chapter</strong></div><div><button aria-label="Move up" type="button" disabled={index === 0} onClick={() => moveSection(section.id, 'up')}><AppIcon name="ArrowUp" /></button><button aria-label="Move down" type="button" disabled={index === editing.sections.length - 1} onClick={() => moveSection(section.id, 'down')}><AppIcon name="ArrowDown" /></button><button type="button" onClick={() => deleteSection(section.id)}>Remove</button></div></header>
              <div className="case-admin-chapter-fields">
                <input value={section.label} onChange={e => updateSection(section.id, { label: e.target.value })} placeholder="Small label (optional)" />
                <input value={section.title || ''} onChange={e => updateSection(section.id, { title: e.target.value || null })} placeholder="Chapter title" />
              </div>
              <div className="case-admin-media-stage">
                <div className="case-layout-options" role="group" aria-label="Media layout">{(['single', 'feature-split', 'grid-2', 'grid-3'] as const).map(layout => <button type="button" key={layout} aria-pressed={(section.image_layout || 'single') === layout} onClick={() => updateSection(section.id, { image_layout: layout })}><span className={`case-layout-diagram layout-${layout}`}>{Array.from({ length: layout === 'single' ? 1 : layout === 'grid-2' ? 2 : 3 }, (_, i) => <i key={i} />)}</span>{({ single: 'Single', 'feature-split': 'Feature + two', 'grid-2': 'Two columns', 'grid-3': 'Three columns' })[layout]}</button>)}</div>
                <label>Add media<input type="file" multiple onChange={e => e.target.files && handleSectionGalleryUpload(section.id, e.target.files)} /></label>
                {(section.image_layout || 'single') === 'single' && !!section.gallery_images?.length && <div className="case-admin-gallery-preview">{section.gallery_images.map((src, i) => <div key={src}><CaseMedia src={src} /><button type="button" onClick={() => updateSection(section.id, { gallery_images: section.gallery_images?.filter((_, n) => n !== i) })}>Remove</button></div>)}</div>}
                {(section.image_layout && section.image_layout !== 'single') ? <>
                  <div className={`case-admin-gallery-preview case-layout-preview-${section.image_layout}`}>
                    {Array.from({ length: Math.max(section.gallery_images?.length || 0, section.image_layout === 'grid-2' ? 2 : 3) }, (_, imageIndex) => {
                      const src = section.gallery_images?.[imageIndex]
                      return <div key={`${imageIndex}-${src || 'empty'}`} className="case-canvas-slot">{src ? <><CaseMedia src={src} /><button type="button" onClick={() => updateSection(section.id, { gallery_images: (section.gallery_images || []).filter((_, i) => i !== imageIndex) })}>Remove</button></> : <div className="case-canvas-placeholder"><strong>{section.image_layout === 'feature-split' && imageIndex === 0 ? 'Full-width media' : `Media ${imageIndex + 1}`}</strong><span>Upload media to fill this space</span></div>}</div>
                    })}
                  </div>
                  <small>Media fills these spaces in upload order.</small>
                </> : section.image ? <><img src={section.image} alt="" /><button type="button" onClick={() => updateSection(section.id, { image: null })}>Remove image</button></> : section.video_url ? <><video src={section.video_url} controls /><button type="button" onClick={() => updateSection(section.id, { video_url: null })}>Remove video</button></> : <div><p>Full-width visual stage</p><span>Upload the image or video shown before this chapter’s text.</span><label>Image<input type="file" accept="image/*" onChange={e => e.target.files?.[0] && handleSectionImageUpload(section.id, e.target.files[0])} /></label><label>Video<input type="file" accept="video/*" onChange={e => e.target.files?.[0] && handleSectionVideoUpload(section.id, e.target.files[0])} /></label></div>}
              </div>
              <div className="case-admin-richtext"><RTFEditor value={section.body} onChange={body => updateSection(section.id, { body })} userId={userId} /></div>
            </section>)}
            <button type="button" className="case-admin-add" onClick={addSection}>＋ Add another visual chapter</button>
          </div>
        </div>

        <aside className="case-admin-settings">
          <div><p>Publishing</p><label className="case-admin-switch"><input type="checkbox" checked={editing.published} onChange={e => setEditing({ ...editing, published: e.target.checked })} /><span>{editing.published ? 'Published' : 'Draft'}</span></label></div>
          <div><p>Page details</p><label>URL slug<input value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} /></label><label>Related article<select value={editing.related_article_id || ''} onChange={e => setEditing({ ...editing, related_article_id: e.target.value || null })}><option value="">None</option>{articleOptions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label></div>
          <div><p>Optional project link</p><label>Button label<input value={editing.cta_text || ''} onChange={e => setEditing({ ...editing, cta_text: e.target.value })} placeholder="View live project" /></label><label>Destination URL<input value={editing.cta_link || ''} onChange={e => setEditing({ ...editing, cta_link: e.target.value })} placeholder="https://" /></label></div>
          <div><p>Cover video</p>{editing.video_url ? <button type="button" onClick={() => setEditing({ ...editing, video_url: null, media_type: 'image' })}>Remove uploaded video</button> : <label className="case-admin-upload">Upload cover video<input type="file" accept="video/*" onChange={e => e.target.files?.[0] && handleVideoUpload(e.target.files[0])} /></label>}</div>
          <details><summary>Recovery & versions</summary><DraftTools key={editing.id || 'new'} kind="case-study" draft={editing} onRestore={setEditing} /></details>
          <UploadProgress />
        </aside>
      </div>
    </div>
  }

  return (
    <div className="space-y-6">
      <label className="flex gap-3 items-center text-xs">Show<select aria-label="Publication status" value={listFilter} onChange={(event) => setListFilter(event.target.value)} className="border rounded px-3 py-2 bg-background"><option value="all">All content</option><option value="draft">Drafts</option><option value="published">Published</option></select><span role="status">{caseStudies.filter((item) => listFilter === 'all' || item.published === (listFilter === 'published')).length} results</span></label>
      <div className="flex items-center justify-between pb-2">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Case Studies</h2>
          <p className="text-sm text-foreground/50 mt-0.5">{caseStudies.length} total &mdash; {caseStudies.filter(c => c.published).length} published</p>
          <p className="hidden md:block text-xs text-foreground/40 mt-1">{listFilter === 'all' ? 'Drag the handle to change the public display order.' : 'Choose All content to reorder.'}</p>
        </div>
        <button
          onClick={createNewCaseStudy}
          className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
        >
          <AppIcon name="Plus" className="w-4 h-4" />
          New Case Study
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/8 border border-destructive/20 rounded-lg text-sm text-destructive">
          <AppIcon name="CircleAlert" className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
          <AppIcon name="Check" className="w-4 h-4 shrink-0" />
          Saved successfully
        </div>
      )}

      {caseStudies.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-border rounded-xl text-center">
          <AppIcon name="FileText" className="w-10 h-10 text-foreground/20 mb-3" />
          <p className="text-sm font-medium text-foreground/40">No case studies yet</p>
          <p className="text-xs text-foreground/30 mt-1">Create your first one to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-3">
          {caseStudies.filter((item) => listFilter === 'all' || item.published === (listFilter === 'published')).map((cs, index) => (
            <div
              key={cs.id}
              draggable={listFilter === 'all' && !isReordering}
              onDragStart={(event) => {
                setDraggedCaseStudyId(cs.id)
                event.dataTransfer.effectAllowed = 'move'
                event.dataTransfer.setData('text/plain', cs.id)
              }}
              onDragOver={(event) => {
                if (!draggedCaseStudyId || listFilter !== 'all') return
                event.preventDefault()
                event.dataTransfer.dropEffect = 'move'
                moveCaseStudy(draggedCaseStudyId, cs.id)
              }}
              onDragEnd={saveCaseStudyOrder}
              className={`group border rounded-lg overflow-hidden transition-all bg-background ${draggedCaseStudyId === cs.id ? 'border-foreground/40 opacity-55 scale-[0.99]' : 'border-border hover:border-foreground/25'}`}
            >
              {/* Thumbnail */}
              <div className="aspect-[2/1] bg-muted/30 relative overflow-hidden">
                {cs.thumbnail_url ? (
                  <ProgressiveImage
                    src={cs.thumbnail_url}
                    alt={cs.title}
                    className="w-full h-full object-cover group-hover:scale-[1.015] transition-transform duration-300"
                    containerClassName="w-full h-full"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-foreground/15">
                    <AppIcon name="Image" className="w-10 h-10" />
                  </div>
                )}
                <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cs.published ? 'bg-green-500 text-white' : 'bg-foreground/60 text-background'}`}>
                    {cs.published ? 'Live' : 'Draft'}
                  </span>
                </div>
                <div className="absolute top-2.5 left-2.5">
                  <span className="hidden md:inline-flex cursor-grab active:cursor-grabbing items-center gap-1.5 text-xs bg-black/55 text-white px-2 py-1 rounded-full tabular-nums" title="Drag to reorder">
                    <AppIcon name="GripVertical" className="h-3 w-3" />
                    {index + 1}
                  </span>
                </div>
              </div>

              {/* Info */}
              <div className="p-3">
                <div className="flex items-start justify-between gap-2 mb-1">
                  <h4 className="text-sm font-semibold text-foreground leading-tight">{cs.title || 'Untitled'}</h4>
                </div>
                <p className="text-xs text-foreground/50 line-clamp-1 mb-3 leading-relaxed">{cs.excerpt || 'No description added'}</p>
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
                    <AppIcon name="ArrowUpRight" className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={() => toggleLocked(cs)}
                    className={`p-1.5 border rounded-lg transition-colors ${cs.published ? 'border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100'}`}
                    aria-label={cs.published ? 'Lock project' : 'Unlock project'}
                    title={cs.published ? 'Lock project' : 'Unlock project'}
                  >
                    <AppIcon name="LockKeyhole" className="w-3.5 h-3.5" />
                  </button>
                  <button aria-label="Delete"
                    onClick={() => handleDelete(cs.id)}
                    className="p-1.5 border border-red-200 bg-red-50 rounded-lg hover:bg-red-100 transition-colors text-red-500"
                  >
                    <AppIcon name="Trash2" className="w-3.5 h-3.5" />
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
