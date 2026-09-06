'use client'

import { useState, useEffect } from 'react'
import DocumentWorkspace from './document-workspace'
import { sectionsToDocument, documentNavigation } from '@/lib/document-content'
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

  if (editing) {
    return <DocumentWorkspace key={editing.id || 'new'} userId={userId} toc
      title={editing.title} subtitle={editing.excerpt || ''} html={sectionsToDocument(editing.sections)} cover={editing.thumbnail_url}
      onTitle={title => setEditing({ ...editing, title, slug: title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') })}
      onSubtitle={excerpt => setEditing({ ...editing, excerpt })}
      onCover={thumbnail_url => setEditing({ ...editing, thumbnail_url })}
      onChange={body => setEditing({ ...editing, sections: [{ id: 'document', label: '', title: null, toc: null, body, image: null }] })}
      onBack={() => { if (draftDirty && !window.confirm('Leave the editor? Unsaved changes are available in recovery.')) return; setEditing(null); setIsCreating(false) }}
      onSave={handleSave} saving={isSaving} dirty={draftDirty} published={editing.published}
      onPublished={published => setEditing({ ...editing, published })} error={error}
      recovery={<DraftTools key={editing.id || 'new'} kind="case-study" draft={editing} onRestore={setEditing} />}
      settings={<>
        <label className="block text-xs space-y-2"><span>URL slug</span><input className="w-full border rounded p-2" value={editing.slug} onChange={e => setEditing({ ...editing, slug: e.target.value })} /></label>
        <label className="block text-xs space-y-2"><span>Related article</span><select className="w-full border rounded p-2" value={editing.related_article_id || ''} onChange={e => setEditing({ ...editing, related_article_id: e.target.value || null })}><option value="">None</option>{articleOptions.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}</select></label>
        <details><summary>Cover video & project link</summary><div className="space-y-3 pt-3">
          <label className="block text-xs">Cover video URL<input className="w-full border rounded p-2" value={editing.video_url || ''} onChange={e => setEditing({ ...editing, video_url: e.target.value || null, media_type: e.target.value ? 'video' : 'image' })} /></label>
          <label className="block text-xs">Link label<input className="w-full border rounded p-2" value={editing.cta_text || ''} onChange={e => setEditing({ ...editing, cta_text: e.target.value })} /></label>
          <label className="block text-xs">Project URL<input className="w-full border rounded p-2" value={editing.cta_link || ''} onChange={e => setEditing({ ...editing, cta_link: e.target.value })} /></label>
        </div></details>
      </>}
    />
  }

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
