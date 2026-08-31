'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ProgressiveImage from '@/components/progressive-image'
import SafeHtml from '@/components/safe-html'
import CopyLinkButton from '@/components/copy-link-button'
import SafeEmbed from '@/components/safe-embed'
import { slugify } from '@/lib/slugify'
import ViewportVideo from '@/components/viewport-video'
import { track } from '@vercel/analytics'

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
  const [contactEmail, setContactEmail] = useState('faithawokunle1@gmail.com')
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
    createClient().from('profiles').select('contact_email').limit(1).maybeSingle()
      .then(({ data }) => { if (data?.contact_email) setContactEmail(data.contact_email) })
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
          router.push('/404')
          return
        }

        setCaseStudy(data)
      } catch (error) {
        console.error('Error fetching case study:', error)
        router.push('/404')
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
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
      if (visible) setActiveNavItem(visible.target.id)
    }, { rootMargin: '-20% 0px -65% 0px' })
    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [caseStudy, navItems.length])

  if (isLoading) {
    return null
  }

  if (!caseStudy) return null

  const handleNavClick = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveNavItem(sectionId)
    }
  }

  return (
    <main className="min-h-screen bg-background" style={{ animation: 'articleEntrance 320ms cubic-bezier(0.22,1,0.36,1) both' }}>
      <div className="fixed top-0 left-0 z-[60] h-px bg-foreground/70 transition-[width] duration-100" style={{ width: `${readingProgress}%` }} aria-hidden="true" />
      <header className="fixed top-0 inset-x-0 z-50 h-[72px] border-b border-foreground/8 bg-background/88 backdrop-blur-xl">
        <div className="h-full max-w-[1440px] mx-auto px-5 md:px-8 flex items-center justify-between">
          <div className="flex items-center gap-4 md:gap-7 min-w-0">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 h-10 px-3.5 rounded-xl bg-foreground/[0.045] text-sm text-foreground/55 hover:text-foreground hover:bg-foreground/[0.075] transition-colors"
            >
              <span aria-hidden="true">‹</span>
              Back
            </button>
            <div className="hidden sm:flex items-center gap-3 text-sm min-w-0">
              {caseStudy.thumbnail_url && (
                <div className="relative size-9 shrink-0 overflow-hidden rounded-md bg-foreground/5">
                  <img src={caseStudy.thumbnail_url} alt="" className="w-full h-full object-cover" />
                </div>
              )}
              <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="font-medium truncate hover:text-foreground/60 transition-colors">{caseStudy.title}</button>
            </div>
          </div>
          <CopyLinkButton className="size-9 p-0 justify-center border-0 [&_span]:hidden" />
        </div>
      </header>

      <div className="flex pt-[72px]">
        {navItems.length > 0 && (
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-[72px] h-[calc(100vh-72px)] overflow-y-auto border-r border-foreground/8 px-8 py-14">
              <nav className="space-y-2" aria-label="Case study sections">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`relative block text-left text-sm py-1.5 w-full transition-[color,font-weight] ${
                      activeNavItem === item.id
                        ? 'text-foreground font-semibold'
                        : 'text-foreground/48 font-normal hover:text-foreground/75'
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

        <div className="flex-1 min-w-0 px-6 md:px-10 lg:px-16 py-14 md:py-20 flex justify-center">
          <div className="w-full max-w-4xl">
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
          <header className="mb-14 md:mb-20 max-w-3xl">
            <h1 className="text-[18px] font-medium tracking-[-0.01em] leading-snug text-foreground">{caseStudy.title}</h1>
            {caseStudy.excerpt && <p className="mt-6 text-sm text-foreground/65 leading-relaxed max-w-2xl">{caseStudy.excerpt}</p>}
          </header>

          {/* Thumbnail */}
          {caseStudy.thumbnail_url && caseStudy.media_type !== 'video' && (
            <div className="mb-16 overflow-hidden bg-foreground/4">
              <ProgressiveImage
                src={caseStudy.thumbnail_url}
                alt={caseStudy.title}
                className="w-full h-auto"
              />
            </div>
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
          <div className="max-w-3xl space-y-24">
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
                  <div className={`mb-10 overflow-hidden bg-foreground/4 ${section.media_width === 'reading' ? '' : section.media_width === 'full' ? 'lg:w-[calc(100%+14rem)]' : 'lg:w-[calc(100%+8rem)]'}`}>
                    <ProgressiveImage
                      src={section.image}
                      alt={section.title || section.label || 'Section image'}
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {section.video_url && (
                  <div className={`mb-10 overflow-hidden bg-black ${section.media_width === 'reading' ? '' : section.media_width === 'full' ? 'lg:w-[calc(100%+14rem)]' : 'lg:w-[calc(100%+8rem)]'}`}>
                    <ViewportVideo
                      src={section.video_url}
                      decorative
                    />
                  </div>
                )}

                {section.embed_url && (
                  <div className={`mb-10 ${section.media_width === 'reading' ? '' : section.media_width === 'full' ? 'lg:w-[calc(100%+14rem)]' : 'lg:w-[calc(100%+8rem)]'}`}>
                    <SafeEmbed url={section.embed_url} title={section.title || section.label || 'Embedded content'} />
                  </div>
                )}

                <SafeHtml
                  html={section.body}
                  className="text-sm [&_p]:text-foreground/90 [&_p]:leading-[1.85] [&_p]:mb-7 [&_ul]:list-disc [&_ul]:pl-7 [&_ul]:my-7 [&_ol]:list-decimal [&_ol]:pl-7 [&_ol]:my-7 [&_li]:text-foreground/90 [&_li]:leading-[1.8] [&_li]:mb-3 [&_strong]:text-foreground [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4 max-w-none"
                />
              </section>
            ))}
          </div>

          {relatedArticle && (() => {
            const content = typeof relatedArticle.content === 'string' ? JSON.parse(relatedArticle.content) : (relatedArticle.content || [])
            const words = content.reduce((total: number, block: { content?: string }) => total + (block.content?.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length || 0), 0)
            return (
              <section className="max-w-3xl mt-24 pt-12 border-t border-foreground/8">
                <h2 className="text-[11px] text-foreground/45 font-normal mb-8">Related writing</h2>
                <a href={`/?article=${encodeURIComponent(relatedArticle.slug)}`} className="group grid grid-cols-[112px_1fr_auto] gap-5 items-center">
                  {relatedArticle.cover_image ? <img src={relatedArticle.cover_image} alt="" className="w-28 aspect-[4/3] object-cover" /> : <div className="w-28 aspect-[4/3] bg-foreground/5" />}
                  <div className="min-w-0">
                    <h3 className="text-base font-medium text-foreground group-hover:text-foreground/65 transition-colors">{relatedArticle.title}</h3>
                    {relatedArticle.excerpt && <p className="text-sm text-foreground/50 mt-1.5 line-clamp-1">{relatedArticle.excerpt}</p>}
                    <p className="text-xs text-foreground/35 mt-2">{Math.max(1, Math.ceil(words / 200))} min · {new Date(relatedArticle.created_at).getFullYear()}</p>
                  </div>
                  <span className="text-xl text-foreground/35 group-hover:translate-x-1 group-hover:text-foreground transition-all" aria-hidden="true">→</span>
                </a>
              </section>
            )
          })()}

          <section className="max-w-3xl mt-24 pt-12 border-t border-foreground/8">
            <p className="text-[11px] text-foreground/40 mb-3">Have a complex product that needs clarity?</p>
            <h2 className="text-[18px] font-medium tracking-[-0.01em] text-foreground max-w-xl">Let&apos;s turn it into something people can understand and use.</h2>
            <div className="mt-6 flex flex-wrap gap-2">
              <a onClick={() => track('project_enquiry_started', { location: 'case-study', caseStudy: caseStudy.title })} href={`mailto:${contactEmail}?subject=Project%20enquiry`} className="inline-flex min-h-10 items-center rounded-md bg-foreground px-4 text-xs font-medium text-background hover:opacity-85 transition-opacity">Discuss a project</a>
              <button onClick={() => router.push('/')} className="inline-flex min-h-10 items-center px-3 text-xs text-foreground/55 hover:text-foreground transition-colors">Back to My Work</button>
            </div>
          </section>
          </div>
        </div>
      </div>
    </main>
  )
}
