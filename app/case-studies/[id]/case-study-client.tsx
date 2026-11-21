'use client'

import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import CaseStudyTransitionLink from '@/components/portfolio/case-study-transition-link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import ProgressiveImage from '@/components/progressive-image'
import CaseSectionBody from '@/components/case-section-body'
import SafeEmbed from '@/components/safe-embed'
import ViewportVideo from '@/components/viewport-video'
import { slugify } from '@/lib/slugify'
import { replaceEmDashes } from '@/lib/content-utils'
import CaseMedia from '@/components/case-media'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import { MovingText } from '@/components/portfolio/portfolio-shelf'
import type { Profile } from '@/components/portfolio/profile-section'
import CaseStudyLoading from './loading'

interface Section {
  id: string; label: string; title: string | null; body: string; toc: string | null
  image: string | null; video_url?: string | null; embed_url?: string | null
  media_width?: 'reading' | 'wide' | 'full'
  layout?: 'media-first' | 'text-first' | 'media-left' | 'media-right'
  placement?: 'left' | 'center' | 'right'
  image_layout?: 'single' | 'feature-split' | 'grid-2' | 'grid-3'
  gallery_images?: string[]
}
export interface CaseStudy {
  id: string; title: string; excerpt: string | null; thumbnail_url: string | null
  video_url: string | null; media_type: 'image' | 'video' | null; sections: Section[] | string | null
  slug: string | null; published: boolean; created_at: string; order_index?: number | null
  cta_text: string | null; cta_link: string | null; related_article_id: string | null
}
interface RelatedArticle { id: string; title: string; slug: string; excerpt: string | null; cover_image: string | null; content: unknown; created_at: string }

export default function CaseStudyClient({ initialCaseStudy, profile }: { initialCaseStudy?: CaseStudy | null; profile?: Profile | null }) {
  const params = useParams()
  const id = params.id as string
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(initialCaseStudy || null)
  const [relatedArticle, setRelatedArticle] = useState<RelatedArticle | null>(null)
  const [isLoading, setIsLoading] = useState(!initialCaseStudy)
  const sections: Section[] = useMemo(() => {
    try { return Array.isArray(caseStudy?.sections) ? caseStudy.sections : typeof caseStudy?.sections === 'string' ? JSON.parse(caseStudy.sections) : [] }
    catch { return [] }
  }, [caseStudy])

  useEffect(() => {
    if (initialCaseStudy) return
    const fetchCaseStudy = async () => {
      try {
        const supabase = createClient()
        const bySlug = await supabase.from('case_studies').select('*').eq('slug', id).eq('published', true).maybeSingle()
        const byTitle = !bySlug.data && !/^[0-9a-f-]{36}$/i.test(id) ? await supabase.from('case_studies').select('*').eq('published', true) : null
        const titleMatch = byTitle?.data?.find(item => slugify(item.title) === id) || null
        const fallback = !bySlug.data && !titleMatch && /^[0-9a-f-]{36}$/i.test(id) ? await supabase.from('case_studies').select('*').eq('id', id).eq('published', true).maybeSingle() : null
        const data = bySlug.data || titleMatch || fallback?.data
        if (!data) return
        setCaseStudy(data as CaseStudy)
      } catch (error) { console.error('Error fetching case study:', error) }
      finally { setIsLoading(false) }
    }
    fetchCaseStudy()
  }, [id, initialCaseStudy])

  useEffect(() => {
    if (!caseStudy?.related_article_id) { setRelatedArticle(null); return }
    createClient().from('writings').select('id, title, slug, excerpt, cover_image, content, created_at').eq('id', caseStudy.related_article_id).eq('published', true).maybeSingle().then(({ data }) => setRelatedArticle((data as RelatedArticle | null) || null))
  }, [caseStudy?.related_article_id])

  if (isLoading) return <CaseStudyLoading />
  if (!caseStudy) return <main className="mx-auto max-w-[664px] px-8 py-24"><h1 className="text-[24px]">Case study unavailable</h1><p className="my-4 text-base text-foreground/60">It may have moved, or the connection failed.</p><a href="/" className="inline-flex min-h-11 items-center underline">Back to work</a><button type="button" onClick={() => window.location.reload()} className="ml-6 underline">Retry</button></main>


  return <main className="case-story min-h-screen bg-background">
    <PortfolioHeader profile={profile} />
    <CaseStudyTransitionLink href="/case-studies" className="case-study-back" aria-label="Back to case studies">
      <ArrowLeft size={20} strokeWidth={1.75} aria-hidden="true" />
    </CaseStudyTransitionLink>
    <article className="case-study-content">
      <header className="case-story-opening">
        <div className="case-story-introduction">
          <div className="case-story-heading">
            <h1>{replaceEmDashes(caseStudy.title)}</h1>
          </div>
          {(caseStudy.excerpt || (caseStudy.cta_text && caseStudy.cta_link)) && (
            <div className="case-story-summary">
              {caseStudy.excerpt && <p>{replaceEmDashes(caseStudy.excerpt)}</p>}
              {caseStudy.cta_text && caseStudy.cta_link && (
                <a className="case-story-detail-link" href={caseStudy.cta_link} target="_blank" rel="noopener noreferrer">
                  <MovingText>{replaceEmDashes(caseStudy.cta_text)}</MovingText>
                </a>
              )}
            </div>
          )}
        </div>
        {(caseStudy.thumbnail_url || (caseStudy.media_type === 'video' && caseStudy.video_url)) && (
          <div className="case-story-cover relative">
            {caseStudy.thumbnail_url ? (
              <ProgressiveImage priority sizes="(max-width: 640px) 92vw, 40vw" containerClassName="h-full w-full" src={caseStudy.thumbnail_url} alt={caseStudy.title} className="h-full w-full object-contain" />
            ) : caseStudy.video_url && <ViewportVideo src={caseStudy.video_url} controls className="h-full w-full object-contain" />}
          </div>
        )}
      </header>

      {caseStudy.media_type === 'video' && caseStudy.video_url && caseStudy.thumbnail_url && (
        <div className="case-story-media"><div className="case-story-media-inner"><ViewportVideo src={caseStudy.video_url} controls poster={caseStudy.thumbnail_url} /></div></div>
      )}


      {sections.filter(section => section.label && section.title).length > 2 && (
        <nav className="case-story-contents" aria-label="On this page">
          <span>On this page</span>
          {sections.filter(section => section.label && section.title).map(section => (
            <a key={section.id} href={`#${section.id}`} onClick={event => {
              if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
              event.preventDefault()
              document.getElementById(section.id)?.scrollIntoView({ block: 'start', behavior: 'instant' })
              window.history.replaceState(null, '', `#${section.id}`)
            }}>{replaceEmDashes(section.label)}</a>
          ))}
        </nav>
      )}
      <div className="case-story-sections">
        {sections.map((section, index) => <section key={section.id} id={section.id} className="case-story-section reading-section" data-layout={section.layout || 'media-first'} data-width={section.media_width || 'wide'} data-placement={section.placement || 'center'}>
          {(section.image || section.gallery_images?.length || section.video_url || section.embed_url) && <div data-motion-section className={`case-story-media motion-media ${index % 2 ? 'is-soft' : ''}`}><div className="case-story-media-inner">
            {(section.gallery_images?.length || section.image) && <div className={`case-story-gallery case-story-gallery-${section.image_layout || 'single'}`}>{(section.gallery_images?.length ? section.gallery_images : [section.image!]).map((src, imageIndex) => /\.(mp4|webm|mov|m4v|mp3|wav|ogg|m4a|aac|flac|pdf|zip)([?#]|$)/i.test(src) ? <div key={src} className={`case-story-image ${imageIndex === 0 ? 'is-feature' : ''}`}><CaseMedia src={src} /></div> : <div key={src} className={`case-story-image ${imageIndex === 0 ? 'is-feature' : ''}`}><ProgressiveImage src={src} alt={section.title || section.label || 'Section image'} quality={90} sizes="(max-width: 640px) 100vw, (max-width: 1296px) 96vw, 1248px" className="h-full w-full object-cover" /></div>)}</div>}
            {section.video_url && <div className="case-story-video"><ViewportVideo src={section.video_url} decorative /></div>}
            {section.embed_url && <div className="case-story-embed"><SafeEmbed url={section.embed_url} title={section.title || section.label || 'Embedded content'} /></div>}
          </div></div>}
          {(section.label || section.title || section.body?.replace(/<[^>]*>|&nbsp;/g, '').trim() || section.body?.includes('data-embed=') || section.body?.includes('<img')) && <div className="case-story-copy">
            {section.label && <p className="case-story-label">{replaceEmDashes(section.label)}</p>}
            {section.title && <h2>{replaceEmDashes(section.title)}</h2>}
            <CaseSectionBody html={section.body || ''} />
          </div>}
        </section>)}
      </div>

      {relatedArticle && <section className="case-story-related" data-motion-section><p>Related writing</p><a href={`/writing/${encodeURIComponent(slugify(relatedArticle.title))}`}><span>{replaceEmDashes(relatedArticle.title)}</span><span>Read note →</span></a></section>}
    </article>
  </main>
}
