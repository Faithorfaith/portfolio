'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import ProgressiveImage from '@/components/progressive-image'
import SafeHtml from '@/components/safe-html'
import DetailPageHeader from '@/components/detail-page-header'

interface Section {
  id: string
  label: string
  title: string | null
  body: string
  toc: string | null
  image: string | null
  video_url?: string | null
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
}

export default function CaseStudyClient() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const [caseStudy, setCaseStudy] = useState<CaseStudy | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeNavItem, setActiveNavItem] = useState<string | null>(null)

  useEffect(() => {
    const fetchCaseStudy = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('case_studies')
          .select('*')
          .eq('id', id)
          .single()

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

  if (isLoading) {
    return null
  }

  if (!caseStudy) return null

  // Parse sections and nav_items if they're strings
  const sections: Section[] = Array.isArray(caseStudy.sections)
    ? caseStudy.sections
    : typeof caseStudy.sections === 'string'
    ? JSON.parse(caseStudy.sections)
    : []

  const navItems: NavItem[] = Array.isArray(caseStudy.nav_items)
    ? caseStudy.nav_items
    : typeof caseStudy.nav_items === 'string'
    ? JSON.parse(caseStudy.nav_items)
    : []

  const handleNavClick = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
      setActiveNavItem(sectionId)
    }
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="flex">
        {/* A quiet sticky contents rail on larger screens. */}
        {navItems.length > 0 && (
          <aside className="hidden lg:block w-56 shrink-0">
            <div className="sticky top-0 h-screen overflow-y-auto border-r border-foreground/8 px-7 py-20">
              <p className="text-xs text-foreground/35 mb-4">Contents</p>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`block text-left text-sm py-2 px-2 w-full transition-colors ${
                      activeNavItem === item.id
                        ? 'text-foreground font-medium'
                        : 'text-foreground/60 hover:text-foreground/80'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        <div className="flex-1 min-w-0 px-8 lg:px-14 py-12 md:py-20 flex justify-center">
          <div className="w-full max-w-4xl">
          <DetailPageHeader
            title={caseStudy.title}
            eyebrow="Case study"
            description={caseStudy.excerpt}
          />

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
              <video
                src={caseStudy.video_url}
                controls
                playsInline
                preload="metadata"
                poster={caseStudy.thumbnail_url || undefined}
                className="w-full h-auto"
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
          <div className="max-w-2xl space-y-20">
            {sections.map((section) => (
              <section key={section.id} id={section.id} className="scroll-mt-20">
                {section.label && (
                  <p className="text-sm text-foreground/40 mb-2">
                    {section.label}
                  </p>
                )}

                {section.title && (
                  <h2 className="text-2xl md:text-3xl font-medium tracking-[-0.025em] text-foreground mb-5">
                    {section.title}
                  </h2>
                )}

                {section.image && (
                  <div className="mb-8 overflow-hidden bg-foreground/4">
                    <ProgressiveImage
                      src={section.image}
                      alt={section.title || section.label || 'Section image'}
                      className="w-full h-auto"
                    />
                  </div>
                )}

                {section.video_url && (
                  <div className="mb-6 rounded-xl overflow-hidden bg-black">
                    <video
                      src={section.video_url}
                      autoPlay
                      muted
                      loop
                      className="w-full h-auto"
                      preload="metadata"
                    />
                  </div>
                )}

                <SafeHtml
                  html={section.body}
                  className="[&_p]:text-foreground/70 [&_p]:leading-relaxed [&_p]:mb-4 [&_li]:text-foreground/70 [&_li]:leading-relaxed [&_strong]:text-foreground [&_a]:text-foreground/70 [&_a]:underline max-w-none"
                />
              </section>
            ))}
          </div>
          </div>
        </div>
      </div>
    </main>
  )
}
