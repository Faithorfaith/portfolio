'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchWithCache, batchFetch } from '@/lib/cache-utils'
import { useArticleAudio } from '@/components/article-audio-provider'
import { StaggerContainer, StaggerItem } from '@/components/animations/scroll-animations'
import EmptyState from './empty-state'
import { DetailNavigation } from '@/components/detail-page-header'
import SafeHtml from '@/components/safe-html'
import ProgressiveImage from '@/components/progressive-image'
import { playFeedback } from '@/lib/interaction-feedback'
import Link from 'next/link'
import { slugify } from '@/lib/slugify'

interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'image' | 'quote' | 'divider'
  content: string
  level?: 1 | 2 | 3
}

export interface Writing {
  id: string
  title: string
  slug: string
  excerpt: string | null
  cover_image: string | null
  audio_url?: string | null
  audio_voice?: string | null
  content: ContentBlock[]
  published: boolean
  created_at: string
}

export default function WritingSection({ onSubPageChange, variant = 'full', initialSlug, initialWritings }: { onSubPageChange?: (v: boolean) => void; variant?: 'home' | 'full'; initialSlug?: string; initialWritings?: Writing[] }) {
  const [writings, setWritings] = useState<Writing[]>(initialWritings || [])
  const [isLoading, setIsLoading] = useState(!initialWritings)
  const [selectedWriting, setSelectedWriting] = useState<Writing | null>(() => initialSlug ? initialWritings?.find((writing) => writing.slug === initialSlug || slugify(writing.title) === initialSlug) || null : null)
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({ full_name: null, avatar_url: null })
  
  const articleCursorRef = useRef<HTMLDivElement>(null)
  const { isPlaying, isPaused, title: audioTitle, playArticle, pause, resume } = useArticleAudio()

  const openWriting = (w: Writing) => { playFeedback('tap'); setSelectedWriting(w); onSubPageChange?.(true) }
  const closeWriting = () => { setSelectedWriting(null); onSubPageChange?.(false) }
  const showArticleCursor = (event: React.MouseEvent) => {
    if (!articleCursorRef.current || window.matchMedia('(hover: none)').matches) return
    articleCursorRef.current.style.opacity = '1'
    articleCursorRef.current.style.transform = `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`
  }
  const moveArticleCursor = (event: React.MouseEvent) => {
    if (!articleCursorRef.current) return
    articleCursorRef.current.style.transform = `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`
  }
  const hideArticleCursor = () => {
    if (articleCursorRef.current) articleCursorRef.current.style.opacity = '0'
  }

  useEffect(() => {
    if (initialWritings) {
      if (initialSlug) {
        const requested = initialWritings.find((writing) => writing.slug === initialSlug || slugify(writing.title) === initialSlug)
        if (requested) setSelectedWriting(requested)
      }
      return
    }
    const fetchWritings = async () => {
      try {
        // Batch fetch profile + writings with caching
        const [profileData, writingsData] = await batchFetch([
          { key: 'profile', table: 'profiles', select: 'full_name, avatar_url' },
          { key: 'writings', table: 'writings', select: '*' }
        ])

        if (profileData?.length > 0) {
          setUserProfile(profileData[0] as unknown as { full_name: string | null; avatar_url: string | null })
        }

        if (writingsData) {
          const parsed = writingsData.map((w: any) => {
            try {
              return {
                ...w,
                content: typeof w.content === 'string' ? JSON.parse(w.content) : (w.content || [])
              }
            } catch (parseError) {
              console.error('[v0] Error parsing content for writing:', w.id, parseError)
              return { ...w, content: [] }
            }
          })
          // Filter published and sort
          const published = parsed.filter((w: any) => w.published).sort((a: any, b: any) => 
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
          )
          setWritings(published)
          const requestedSlug = initialSlug || new URLSearchParams(window.location.search).get('article')
          const requestedArticle = requestedSlug ? published.find((writing: Writing) => writing.slug === requestedSlug || slugify(writing.title) === requestedSlug) : null
          if (requestedArticle) {
            setSelectedWriting(requestedArticle)
            onSubPageChange?.(true)
          }
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWritings()
  }, [initialSlug, initialWritings, onSubPageChange])

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 py-12 md:py-16 animate-pulse">
        <div className="space-y-2 mb-12">
          <div className="h-5 w-24 bg-foreground/6 rounded-full" />
          <div className="h-3 w-1/2 bg-foreground/5 rounded-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-8">
          {[1,2,3,4].map(i => (
            <div key={i}>
              <div className="aspect-video rounded-lg bg-foreground/5 mb-4" />
              <div className="h-4 w-4/5 bg-foreground/6 rounded-full mb-3" />
              <div className="h-2.5 w-1/3 bg-foreground/4 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (writings.length === 0) {
    return <EmptyState 
      title="Writing"
      description="Coming soon..."
    />
  }

  // Article View - Medium-style clean layout
  if (selectedWriting) {
    return (
      <div id="top" className="w-full max-w-[664px] mx-auto px-5 sm:px-8 pt-[84px] pb-12 md:pb-20" style={{ animation: 'articleEntrance 0.35s cubic-bezier(0.22,1,0.36,1) both' }}>
        <DetailNavigation title={selectedWriting.title} backHref={initialSlug ? '/writing' : '/#writing'} />

        {/* Article Content */}
        <article>
            <header className="mb-8 pb-6 border-b border-foreground/8">
              <h1 className="text-[18px] font-medium tracking-[-0.01em] text-foreground mb-5 leading-snug">
                {selectedWriting.title}
              </h1>
              {selectedWriting.excerpt && (
                <p className="text-foreground/60 leading-relaxed mb-7 text-sm font-normal">
                  {selectedWriting.excerpt}
                </p>
              )}
              
              {/* Metadata and Audio Reader Row */}
              <div className="flex items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <time className="text-sm text-foreground/50">
                    {new Date(selectedWriting.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </time>
                  <span className="text-sm text-foreground/45">•</span>
                  <span className="text-sm text-foreground/50">
                    {Math.ceil(selectedWriting.content.reduce((acc, block) => acc + (block.content?.split(' ').length || 0), 0) / 200)} min read
                  </span>
                </div>
                
                {/* Audio Reader Button - Medium Style */}
                <button 
                  onClick={() => {
                    if (isPlaying && audioTitle === selectedWriting.title) {
                      if (isPaused) {
                        resume()
                      } else {
                        pause()
                      }
                    } else {
                      // Strip HTML tags for clean TTS reading
                      const stripHtml = (html: string) => {
                        const tmp = document.createElement('div')
                        tmp.innerHTML = html
                        return tmp.textContent || tmp.innerText || ''
                      }
                      const textToRead = selectedWriting.content
                        .filter(b => b.type !== 'image' && b.type !== 'divider')
                        .map(block => stripHtml(block.content || ''))
                        .join(' ')
                      
                      playArticle(selectedWriting.title, textToRead, selectedWriting.audio_url, selectedWriting.cover_image)
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-foreground/12 transition-colors text-sm text-foreground/55 hover:text-foreground hover:border-foreground/25 cursor-pointer"
                >
                  {isPlaying && audioTitle === selectedWriting.title && !isPaused ? (
                    <>
                      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="3" height="16" />
                        <rect x="15" y="4" width="3" height="16" />
                      </svg>
                      Pause
                    </>
                  ) : isPlaying && audioTitle === selectedWriting.title && isPaused ? (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Resume
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                      Listen
                    </>
                  )}
                </button>
              </div>

              {/* Thumbnail Image - After metadata */}
              {selectedWriting.cover_image && (
                <div className="w-full max-w-[600px] overflow-hidden">
                  <ProgressiveImage
                    src={selectedWriting.cover_image}
                    alt={selectedWriting.title}
                    className="w-full aspect-video object-cover"
                    containerClassName="w-full overflow-hidden"
                  />
                </div>
              )}
            </header>

            <div className="w-full max-w-[600px] mx-auto">
              {selectedWriting.content.map((block) => {
                switch (block.type) {
                  case 'heading':
                    const HeadingTag: 'h1' | 'h2' | 'h3' = block.level === 1 ? 'h1' : block.level === 3 ? 'h3' : 'h2'
                    const headingText = block.content.replace(/<[^>]*>/g, '')
                    return (
                      <HeadingTag
                        key={block.id}
                        id={`block-${block.id}`}
                        className={`scroll-mt-20 text-sm leading-relaxed tracking-[0.01em] ${
                          block.level === 1 ? 'font-medium text-foreground mt-14 mb-5' :
                          block.level === 2 ? 'font-normal text-foreground mt-12 mb-4' :
                          'font-normal text-foreground/70 mt-9 mb-3'
                        }`}
                      >{headingText}</HeadingTag>
                    )
                  case 'paragraph':
                    return (
                      <SafeHtml
                        key={block.id}
                        html={block.content}
                        className="text-foreground/70 leading-relaxed mb-6 text-sm font-normal [&>p]:mb-5 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-5 [&>li]:mb-2 [&>strong]:font-medium [&>strong]:text-foreground [&>em]:italic [&_strong]:font-medium [&_strong]:text-foreground"
                      />
                    )
                  case 'image':
                    return block.content ? (
                      <figure key={block.id} className="w-full max-w-[600px] my-12">
                        <ProgressiveImage
                          src={block.content}
                          alt=""
                          className="w-full"
                          containerClassName="w-full overflow-hidden"
                        />
                      </figure>
                    ) : null
                  case 'quote':
                    return (
                      <SafeHtml
                        key={block.id}
                        as="blockquote"
                        html={block.content}
                        className="pl-5 border-l border-foreground/20 text-foreground/70 my-10 text-sm leading-relaxed font-normal [&>p]:mb-0"
                      />
                    )
                  case 'divider':
                    return <hr key={block.id} className="my-14 border-foreground/10" />
                  default:
                    return null
                }
              })}
            </div>
          </article>
      </div>
    )
  }

  if (variant === 'home') {
    return (
      <section id="writing" className="w-full max-w-2xl mx-auto px-5 sm:px-8 py-12 scroll-mt-20" aria-labelledby="home-writing-title">
        <h2 id="home-writing-title" className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground mb-8">My articles</h2>
        <div className="space-y-2">
          {writings.slice(0, 4).map((writing) => {
            const wordCount = writing.content.reduce((total, block) => total + (block.content?.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length || 0), 0)
            return (
              <Link
                key={writing.id}
                href={`/writing/${encodeURIComponent(slugify(writing.title))}`}
                onClick={() => playFeedback('tap')}
                onMouseEnter={showArticleCursor}
                onMouseMove={moveArticleCursor}
                onMouseLeave={hideArticleCursor}
                className="group grid w-full grid-cols-[88px_minmax(0,1fr)_20px] md:grid-cols-[112px_minmax(0,1fr)_24px] gap-4 md:gap-5 items-center py-3 text-left"
              >
                {writing.cover_image ? (
                  <div className="relative aspect-[4/3] overflow-hidden bg-foreground/5">
                    <ProgressiveImage src={writing.cover_image} alt="" fill containerClassName="w-full h-full" />
                  </div>
                ) : <div className="aspect-[4/3] bg-foreground/5" />}
                <div className="min-w-0">
                  <h3 className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground/70 group-hover:text-foreground transition-colors">{writing.title}</h3>
                  {writing.excerpt && <p className="mt-1.5 text-sm leading-relaxed text-foreground/60 line-clamp-2">{writing.excerpt}</p>}
                  <p className="mt-2 text-[11px] text-foreground/60 tabular-nums">{Math.max(1, Math.ceil(wordCount / 200))} min · {new Date(writing.created_at).getFullYear()}</p>
                </div>
                <span className="text-lg text-foreground/45 transition-transform group-hover:translate-x-1" aria-hidden="true">↗</span>
              </Link>
            )
          })}
        </div>
        <div ref={articleCursorRef} className="fixed top-0 left-0 z-[80] pointer-events-none opacity-0 px-2.5 py-1.5 rounded-full bg-foreground text-background text-[11px] whitespace-nowrap transition-opacity duration-150 shadow-sm" aria-hidden="true">Read article</div>
        {writings.length > 4 && <Link href="/writing" className="mt-5 inline-flex min-h-9 items-center text-xs text-foreground/50 hover:text-foreground transition-colors">View all writing →</Link>}
      </section>
    )
  }

  // Writings List - Medium-style card grid
  return (
    <div id="top" className="w-full max-w-2xl mx-auto px-5 sm:px-8 pt-[84px] pb-12 md:pb-20">
      <DetailNavigation title="Writing" showCopy={false} />
      {/* Centered Content Container */}
      <div className="flex justify-center">
        <div className="max-w-4xl w-full">
          {/* Section Header */}
          <div className="mb-10 max-w-xl">
            <h2 className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground">Writing</h2>
          </div>

          {/* Cards Grid - 2 columns on desktop */}
          <StaggerContainer delay={0.2}>
            <div className="border-t border-foreground/8">
              {writings.map((writing) => (
                <StaggerItem key={writing.id}>
                  <Link
                    href={`/writing/${encodeURIComponent(slugify(writing.title))}`}
                    onClick={() => playFeedback('tap')}
                    onMouseEnter={showArticleCursor}
                    onMouseMove={moveArticleCursor}
                    onMouseLeave={hideArticleCursor}
                    className="group text-left grid grid-cols-[88px_1fr] md:grid-cols-[112px_1fr] grid-rows-[auto_auto] gap-x-4 md:gap-x-5 w-full py-5 border-b border-foreground/8 hover:border-foreground/20 transition-colors"
                  >
              {/* Cover Image */}
              {writing.cover_image && (
                <div className="col-start-1 row-span-2 aspect-[4/3] rounded-md overflow-hidden bg-foreground/5 relative">
                  <ProgressiveImage
                    src={writing.cover_image}
                    alt={writing.title}
                    fill
                    className="transition-opacity duration-500"
                    containerClassName="w-full h-full rounded-md overflow-hidden"
                  />
                </div>
              )}

              {/* Title */}
              <h3 className="col-start-2 self-end text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground/70 mb-2 group-hover:text-foreground transition-colors">
                {writing.title}
              </h3>

              {/* Date and Read Time */}
              <p className="col-start-2 self-start text-xs text-foreground/40">
                {new Date(writing.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })} • {Math.ceil(writing.content.reduce((acc, block) => acc + (block.content?.split(' ').length || 0), 0) / 200)} min read
              </p>
                </Link>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
          <div ref={articleCursorRef} className="fixed top-0 left-0 z-[80] pointer-events-none opacity-0 px-2.5 py-1.5 rounded-full bg-foreground text-background text-[11px] whitespace-nowrap transition-opacity duration-150 shadow-sm" aria-hidden="true">Read article</div>
        </div>
      </div>
    </div>
  )
}
