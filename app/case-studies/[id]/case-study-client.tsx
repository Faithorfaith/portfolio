'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ProgressiveImage from '@/components/progressive-image'
import SafeHtml from '@/components/safe-html'
import CaseSectionBody from '@/components/case-section-body'
import CopyLinkButton from '@/components/copy-link-button'
import SafeEmbed from '@/components/safe-embed'
import { slugify } from '@/lib/slugify'
import ViewportVideo from '@/components/viewport-video'
import { playFeedback } from '@/lib/interaction-feedback'

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
}

interface NavItem {
  id: string
  label: string
  toc: string
}

interface CaseStudy {
  id: string
  title: string
  excerpt: string | null
  thumbnail_url: string | null
  video_url: string | null
  media_type: 'image' | 'video' | null
  sections: Section[] | string | null
  nav_items: NavItem[] | string | null
  slug: string | null
  published: boolean
  created_at: string
  cta_text: string | null
  cta_link: string | null
  related_article_id: string | null
}

interface RelatedArticle {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  content: Array<{ content?: string }> | string | null
  created_at: string
}

export default function CaseStudyClient() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null)
  const [readingProgress, setReadingProgress] = useState(0)
  const [relatedArticle, setRelatedArticle] = useState<RelatedArticle | null>(null)
  const [expandedImage, setExpandedImage] = useState<{ src: string; alt: string } | null>(null)
  const sections: Section[] = useMemo(() => Array.isArray(caseStudy?.sections)
    ? caseStudy.sections
    : typeof caseStudy?.sections === 'string'
    ? JSON.parse(caseStudy.sections)
    : [], [caseStudy])
  const navItems: NavItem[] = useMemo(() => Array.isArray(caseStudy?.nav_items)
    ? caseStudy.nav_items
    : typeof caseStudy?.nav_items === 'string'
    ? JSON.parse(caseStudy.nav_items)
    : [], [caseStudy])

  useEffect(() => {
    const closeExpandedImage = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setExpandedImage(null)
    }
    window.addEventListener('keydown', closeExpandedImage)
    return () => window.removeEventListener('keydown', closeExpandedImage)
  }, [])

  useEffect(() => {
    const fetchCaseStudy = async () => {
      try {
        const supabase = createClient()
        const bySlug = await supabase.from('case_studies').select('*').eq('slug', id).maybeSingle()
        const byTitle = !bySlug.data && !/^[0-9a-f-]{36}$/i.test(id)
          ? await supabase.from('case_studies').select('*').eq('published', true)
          : null
        const titleMatch = byTitle?.data?.find((item) => slugify(item.title) === id) || null
        const fallback = !bySlug.data && !titleMatch && /^[0-9a-f-]{36}$/i.test(id)
          ? await supabase.from('case_studies').select('*').eq('id', id).maybeSingle()
          : null
        const data = bySlug.data || titleMatch || fallback?.data
        const error = bySlug.error || byTitle?.error || fallback?.error

        if (error || !data) {
          return
        }

        setCaseStudy(data)
      } catch (error) {
        console.error('Error fetching case study:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchCaseStudy()
  }, [id, router])

  useEffect(() => {
    if (!caseStudy?.related_article_id) {
      setRelatedArticle(null)
      return
    }
    createClient().from('writings')
      .select('id, title, slug, excerpt, cover_image, content, created_at')
      .eq('id', caseStudy.related_article_id)
      .eq('published', true)
      .maybeSingle()
      .then(({ data }) => setRelatedArticle((data as RelatedArticle | null) || null))
  }, [caseStudy?.related_article_id])

  useEffect(() => {
    const updateProgress = () => {
      const height = document.documentElement.scrollHeight - window.innerHeight
      setReadingProgress(height > 0 ? Math.min(100, (window.scrollY / height) * 100) : 0)
    }
    window.addEventListener('scroll', updateProgress, { passive: true })
    updateProgress()
    return () => window.removeEventListener('scroll', updateProgress)
  }, [])

  useEffect(() => {
    if (!caseStudy) return
    const elements = navItems.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[]
    let frame = 0
    const update = () => {
      frame = 0
      let current = elements[0]
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= 110) current = element
      }
      if (current) setActiveNavItem(current.id)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    update()
    return () => { cancelAnimationFrame(frame); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule) }
  }, [caseStudy, navItems.length])

  if (isLoading) {
    return <main className="max-w-[664px] mx-auto px-8 py-24" aria-busy="true"><p role="status" className="text-sm text-foreground/60">Loading case study…</p><div className="mt-8 aspect-video bg-muted rounded animate-pulse" /></main>
  }

  if (!caseStudy) return <main className="max-w-[664px] mx-auto px-8 py-24"><h1 className="text-[18px]">Case study unavailable</h1><p className="text-sm text-foreground/60 my-4">It may have moved, or the connection failed.</p><a href="/" className="underline min-h-11 inline-flex items-center">Back to work</a><button type="button" onClick={() => window.location.reload()} className="ml-6 underline">Retry</button></main>

  const handleNavClick = (sectionId: string) => {
    playFeedback('tap')
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
      window.history.replaceState(null, '', `#${sectionId}`)
      setActiveNavItem(sectionId)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 z-[60] h-px bg-foreground/70 transition-[width] duration-100" style={{ width: `${readingProgress}%` }} aria-hidden="true" />
      <header className="fixed top-0 inset-x-0 z-50 h-[52px] border-b border-foreground/8 bg-background/95 backdrop-blur-xl">
        <div className="h-full max-w-[1440px] mx-auto px-5 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-7 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-foreground/[0.045] text-xs text-foreground/55 hover:text-foreground hover:bg-foreground/[0.075] transition-colors"
            >
              <span aria-hidden="true">‹</span>
              Back
            </button>
            <div className="hidden sm:flex items-center gap-3 text-sm min-w-0">
              {caseStudy.thumbnail_url && (
                <div className="relative size-7 shrink-0 overflow-hidden rounded-sm bg-foreground/5">
                  <img src={caseStudy.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-medium truncate hover:text-foreground/60 transition-colors">{caseStudy.title}</button>
            </div>
          </div>
          <CopyLinkButton className="border-0 bg-foreground/[0.045] hover:bg-foreground/[0.075]" />
        </div>
      </header>

      <div className={`pt-[52px] w-full max-w-[920px] mx-auto px-6 md:px-10 lg:px-12 ${navItems.length > 0 ? 'lg:grid lg:grid-cols-[180px_minmax(0,600px)] lg:gap-10 xl:gap-12' : ''}`}>
        {navItems.length > 0 && (
          <aside className="hidden lg:block min-w-0 pt-8 pb-14">
            <div className="sticky top-[68px] max-h-[calc(100vh-84px)] overflow-y-auto pr-4">
              <nav className="space-y-3" aria-label="Case study sections">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative block min-h-7 text-left text-xs leading-5 w-full transition-[color,font-weight] ${
                      activeNavItem === item.id
                        ? 'text-foreground font-medium'
                        : 'text-foreground/50 font-normal hover:text-foreground/80'
                    }`}
                    aria-current={activeNavItem === item.id ? 'location' : undefined}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>
          </aside>
        )}

        <div className="min-w-0 py-8 md:py-8">
          <div className="w-full max-w-[600px] mx-auto">
          {navItems.length > 0 && (
            <label className="lg:hidden block mb-10">
              <span className="block text-[11px] text-foreground/40 mb-2">Jump to section</span>
              <select
                value={activeNavItem || ''}
                onChange={(event) => handleNavClick(event.target.value)}
                className="w-full h-10 rounded-md border border-foreground/12 bg-background px-3 text-sm"
              >
                <option value="" disabled>Select a section</option>
                {navItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          )}
          <header className="mb-12 w-full max-w-[600px]">
            <h1 className="text-[18px] font-medium tracking-[-0.01em] leading-snug text-foreground">{caseStudy.title}</h1>
            {caseStudy.excerpt && <p className="mt-6 text-sm text-foreground/65 leading-relaxed max-w-2xl">{caseStudy.excerpt}</p>}
          </header>

          {/* Thumbnail */}
          {caseStudy.thumbnail_url && caseStudy.media_type !== 'video' && (
            <button type="button" onClick={() => setExpandedImage({ src: caseStudy.thumbnail_url!, alt: caseStudy.title })} className="group block w-full mb-16 overflow-hidden bg-foreground/4 cursor-zoom-in" aria-label={`Expand ${caseStudy.title} image`}>
              <ProgressiveImage
                src={caseStudy.thumbnail_url}
                alt={caseStudy.title}
                className="w-full h-auto"
              />
              <span className="sr-only">Open full-size image</span>
            </button>
          )}

          {caseStudy.media_type === 'video' && caseStudy.video_url && (
            <div className="mb-16 overflow-hidden bg-black">
              <ViewportVideo
                src={caseStudy.video_url}
                controls
                poster={caseStudy.thumbnail_url || undefined}
              />
            </div>
          )}

          {/* CTA Button - Right after excerpt */}
          {caseStudy.cta_text && caseStudy.cta_link && (
            <div className="mb-12">
              <a
                href={caseStudy.cta_link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-3 bg-foreground text-background rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                {caseStudy.cta_text}
              </a>
            </div>
          )}

          {/* Sections */}
          <div className="w-full max-w-[600px] space-y-20">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-24">
                {section.label && (
                  <p className="text-sm text-foreground/45 mb-3">
                    {section.label}
                  </p>
                )}

                {section.title && (
                  <h2 className="text-[18px] font-medium tracking-[-0.01em] text-foreground mb-6">
                    {section.title}
                  </h2>
                )}

                {section.image && (
                  <button type="button" onClick={() => setExpandedImage({ src: section.image!, alt: section.title || section.label || 'Section image' })} className="block w-full max-w-[600px] mb-10 overflow-hidden bg-foreground/4 cursor-zoom-in" aria-label={`Expand ${section.title || section.label || 'section'} image`}>
                    <ProgressiveImage
                      src={section.image}
                      alt={section.title || section.label || 'Section image'}
                      className="w-full h-auto"
                    />
                  </button>
                )}

                {section.video_url && (
                  <div className="w-full max-w-[600px] mb-10 overflow-hidden bg-black">
                    <ViewportVideo
                      src={section.video_url}
                      decorative
                    />
                  </div>
                )}

                {section.embed_url && (
                  <div className="w-full max-w-[600px] mb-10">
                    <SafeEmbed url={section.embed_url} title={section.title || section.label || 'Embedded content'} />
                  </div>
                )}

                <CaseSectionBody html={section.body} />
              </section>
            ))}
          </div>

          {relatedArticle && (() => {
            const content = typeof relatedArticle.content === 'string' ? JSON.parse(relatedArticle.content) : (relatedArticle.content || [])
            const words = content.reduce((total: number, block: { content?: string }) => total + (block.content?.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length || 0), 0)
            return (
              <section className="w-full max-w-[600px] mt-20 pt-10 border-t border-foreground/8">
                <h2 className="text-[11px] text-foreground/45 font-normal mb-8">Related writing</h2>
                <a href={`/writing/${encodeURIComponent(slugify(relatedArticle.title))}`} className="group grid grid-cols-[112px_1fr_auto] gap-5 items-center">
                  {relatedArticle.cover_image ? <img src={relatedArticle.cover_image} alt="" className="w-28 aspect-[4/3] object-cover" /> : <div className="w-28 aspect-[4/3] bg-foreground/5" />}
                  <div className="min-w-0">
                    <h3 className="text-sm font-normal leading-relaxed text-foreground/70 group-hover:text-foreground transition-colors">{relatedArticle.title}</h3>
                    {relatedArticle.excerpt && <p className="text-sm text-foreground/50 mt-1.5 line-clamp-1">{relatedArticle.excerpt}</p>}
                    <p className="text-[11px] text-foreground/60 mt-2">{Math.max(1, Math.ceil(words / 200))} min · {new Date(relatedArticle.created_at).getFullYear()}</p>
                  </div>
                  <span className="text-xl text-foreground/35 group-hover:translate-x-1 group-hover:text-foreground transition-all" aria-hidden="true">→</span>
                </a>
              </section>
            )
          })()}

          </div>
        </div>
      </div>
      {expandedImage && (
        <div className="fixed inset-0 z-[90] bg-black/88 p-4 md:p-8 flex items-center justify-center" role="dialog" aria-modal="true" aria-label="Expanded case study image" onClick={() => setExpandedImage(null)}>
          <button type="button" onClick={() => setExpandedImage(null)} className="absolute top-4 right-4 size-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20" aria-label="Close image">×</button>
          <img src={expandedImage.src} alt={expandedImage.alt} className="max-w-full max-h-full object-contain" onClick={(event) => event.stopPropagation()} />
        </div>
      )}
    </main>
  )
}
