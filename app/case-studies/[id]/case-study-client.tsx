'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProgressiveImage from '@/components/progressive-image'
import CaseSectionBody from '@/components/case-section-body'
import SafeEmbed from '@/components/safe-embed'
import ViewportVideo from '@/components/viewport-video'
import { slugify } from '@/lib/slugify'

interface Section {
  id: string; label: string; title: string | null; body: string; toc: string | null
  image: string | null; video_url?: string | null; embed_url?: string | null
  media_width?: 'reading' | 'wide' | 'full'
  image_layout?: 'single' | 'feature-split' | 'grid-2' | 'grid-3'
  gallery_images?: string[]
}
interface CaseStudy {
  id: string; title: string; excerpt: string | null; thumbnail_url: string | null
  video_url: string | null; media_type: 'image' | 'video' | null; sections: Section[] | string | null
  slug: string | null; published: boolean; created_at: string; order_index?: number | null
  cta_text: string | null; cta_link: string | null; related_article_id: string | null
}
type CaseStudyLink = Pick<CaseStudy, 'id' | 'title' | 'slug' | 'order_index' | 'created_at'>
interface RelatedArticle { id: string; title: string; slug: string; excerpt: string | null; cover_image: string | null; content: unknown; created_at: string }

export default function CaseStudyClient() {
  const params = useParams()
  const id = params.id as string
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null)
  const [caseStudyLinks, setCaseStudyLinks] = useState<CaseStudyLink[]>([])
  const [relatedArticle, setRelatedArticle] = useState<RelatedArticle | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadPercent, setLoadPercent] = useState(8)
  const [readingProgress, setReadingProgress] = useState(0)
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null)
  const closeButton = useRef<HTMLButtonElement>(null)
  const sections: Section[] = useMemo(() => {
    try { return Array.isArray(caseStudy?.sections) ? caseStudy.sections : typeof caseStudy?.sections === 'string' ? JSON.parse(caseStudy.sections) : [] }
    catch { return [] }
  }, [caseStudy])

  useEffect(() => {
    if (!isLoading) return
    const timer = window.setInterval(() => setLoadPercent(value => Math.min(value + Math.ceil(Math.random() * 9), 92)), 180)
    return () => window.clearInterval(timer)
  }, [isLoading])

  useEffect(() => {
    const fetchCaseStudy = async () => {
      try {
        const supabase = createClient()
        const bySlug = await supabase.from('case_studies').select('*').eq('slug', id).eq('published', true).maybeSingle()
        const byTitle = !bySlug.data && !/^[0-9a-f-]{36}$/i.test(id) ? await supabase.from('case_studies').select('*').eq('published', true) : null
        const titleMatch = byTitle?.data?.find(item => slugify(item.title) === id) || null
        const fallback = !bySlug.data && !titleMatch && /^[0-9a-f-]{36}$/i.test(id) ? await supabase.from('case_studies').select('*').eq('id', id).maybeSingle() : null
        const data = bySlug.data || titleMatch || fallback?.data
        if (!data) return
        setCaseStudy(data as CaseStudy)
        const { data: links } = await supabase.from('case_studies').select('id, title, slug, order_index, created_at').eq('published', true).order('order_index', { ascending: true })
        setCaseStudyLinks((links as CaseStudyLink[] | null) || [])
      } catch (error) { console.error('Error fetching case study:', error) }
      finally { setLoadPercent(100); setIsLoading(false) }
    }
    fetchCaseStudy()
  }, [id])

  useEffect(() => {
    if (!caseStudy?.related_article_id) { setRelatedArticle(null); return }
    createClient().from('writings').select('id, title, slug, excerpt, cover_image, content, created_at').eq('id', caseStudy.related_article_id).eq('published', true).maybeSingle().then(({ data }) => setRelatedArticle((data as RelatedArticle | null) || null))
  }, [caseStudy?.related_article_id])

  useEffect(() => {
    const updateProgress = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight
      setReadingProgress(height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0)
    }
    window.addEventListener('scroll', updateProgress, { passive: true }); updateProgress()
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  useEffect(() => {
    if (!expandedImage) return
    closeButton.current?.focus()
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setExpandedImage(null)
    window.addEventListener('keydown', close)
    return () => window.removeEventListener('keydown', close)
  }, [expandedImage])

  if (isLoading) return <main className="relative min-h-screen bg-background px-6 pt-28" aria-busy="true"><div className="mx-auto max-w-[640px] animate-pulse"><div className="mx-auto h-7 w-2/3 rounded bg-foreground/8" /><div className="mx-auto mt-12 aspect-[3/2] w-full rounded-[28px] bg-foreground/6" /><div className="mx-auto mt-12 h-4 w-4/5 rounded bg-foreground/6" /></div><span className="fixed bottom-6 right-7 text-5xl font-medium tracking-tight tabular-nums text-foreground/65 md:text-7xl" role="status">{loadPercent}%</span></main>
  if (!caseStudy) return <main className="mx-auto max-w-[664px] px-8 py-24"><h1 className="text-[24px]">Case study unavailable</h1><p className="my-4 text-base text-foreground/60">It may have moved, or the connection failed.</p><a href="/" className="inline-flex min-h-11 items-center underline">Back to work</a><button type="button" onClick={() => window.location.reload()} className="ml-6 underline">Retry</button></main>

  const currentIndex = caseStudyLinks.findIndex(item => item.id === caseStudy.id)
  const previous = currentIndex > 0 ? caseStudyLinks[currentIndex - 1] : null
  const next = currentIndex >= 0 && currentIndex < caseStudyLinks.length - 1 ? caseStudyLinks[currentIndex + 1] : null
  const href = (item: CaseStudyLink) => `/case-studies/${encodeURIComponent(item.slug || item.id)}`

  return <main className="case-story min-h-screen bg-background">
    <div className="fixed left-0 top-0 z-[60] h-px bg-foreground/70 transition-[width] duration-100" style={{ width: `${readingProgress}%` }} aria-hidden="true" />
    <a href="/" className="case-story-back" aria-label="Back to homepage">←</a>
    <article>
      <header className="case-story-hero" data-motion-section>
        <h1>{caseStudy.title} <span>({new Date(caseStudy.created_at).getFullYear()})</span></h1>
        {caseStudy.thumbnail_url && caseStudy.media_type !== 'video' && <button type="button" onClick={() => setExpandedImage({ src: caseStudy.thumbnail_url!, alt: caseStudy.title })} className="case-story-cover cursor-zoom-in" aria-label={`Expand ${caseStudy.title} image`}><ProgressiveImage priority sizes="(max-width: 690px) 100vw, 650px" containerClassName="h-full w-full" src={caseStudy.thumbnail_url} alt={caseStudy.title} className="h-full w-full object-cover" /></button>}
        {caseStudy.excerpt && <p className="case-story-intro">{caseStudy.excerpt}</p>}
      </header>

      {caseStudy.media_type === 'video' && caseStudy.video_url && <div className="case-story-media"><div className="case-story-media-inner"><ViewportVideo src={caseStudy.video_url} controls poster={caseStudy.thumbnail_url || undefined} /></div></div>}
      {caseStudy.cta_text && caseStudy.cta_link && <div className="case-story-cta"><a href={caseStudy.cta_link} target="_blank" rel="noopener noreferrer">{caseStudy.cta_text}</a></div>}

      <div className="case-story-sections">
        {sections.map((section, index) => <section key={section.id} id={section.id} className="case-story-section reading-section" data-motion-section>
          {(section.image || section.gallery_images?.length || section.video_url || section.embed_url) && <div className={`case-story-media ${index % 2 ? 'is-soft' : ''}`}><div className="case-story-media-inner">
            {(section.gallery_images?.length || section.image) && <div className={`case-story-gallery case-story-gallery-${section.image_layout || 'single'}`}>{(section.gallery_images?.length ? section.gallery_images : [section.image!]).map((src, imageIndex) => <button key={src} type="button" onClick={() => setExpandedImage({ src, alt: section.title || section.label || 'Section image' })} className={`case-story-image cursor-zoom-in ${imageIndex === 0 ? 'is-feature' : ''}`} aria-label={`Expand ${section.title || section.label || 'section'} image ${imageIndex + 1}`}><ProgressiveImage src={src} alt={section.title || section.label || 'Section image'} className="h-full w-full object-cover" /></button>)}</div>}
            {section.video_url && <div className="case-story-video"><ViewportVideo src={section.video_url} decorative /></div>}
            {section.embed_url && <div className="case-story-embed"><SafeEmbed url={section.embed_url} title={section.title || section.label || 'Embedded content'} /></div>}
          </div></div>}
          <div className="case-story-copy">
            {section.label && <p className="case-story-label">{section.label}</p>}
            {section.title && <h2>{section.title}</h2>}
            <CaseSectionBody html={section.body} />
          </div>
        </section>)}
      </div>

      {relatedArticle && <section className="case-story-related" data-motion-section><p>Related writing</p><a href={`/writing/${encodeURIComponent(slugify(relatedArticle.title))}`}><span>{relatedArticle.title}</span><span>Read note →</span></a></section>}
      <nav className="case-story-pagination" aria-label="Case study navigation">
        {previous ? <a href={href(previous)}>← Prev</a> : <span />}
        {next ? <a href={href(next)}>Next →</a> : <a href="/">Home →</a>}
      </nav>
    </article>

    {expandedImage && <div className="image-lightbox fixed inset-0 z-[90] flex items-center justify-center bg-black/88 p-4 md:p-8" role="dialog" aria-modal="true" aria-label="Expanded case study image" onClick={() => setExpandedImage(null)}><button ref={closeButton} type="button" onClick={() => setExpandedImage(null)} className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close image">×</button><img src={expandedImage.src} alt={expandedImage.alt} className="image-lightbox-media max-h-full max-w-full object-contain" onClick={event => event.stopPropagation()} /></div>}
  </main>
}
