'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchWithCache, batchFetch } from '@/lib/cache-utils'
import { useTextToSpeech } from '@/hooks/use-text-to-speech'
import { StaggerContainer, StaggerItem } from '@/components/animations/scroll-animations'
import EmptyState from './empty-state'
import SafeHtml from '@/components/safe-html'
import Doodles from './doodles'
import ProgressiveImage from '@/components/progressive-image'
import { playFeedback } from '@/lib/interaction-feedback'

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
  excerpt: string | null
  cover_image: string | null
  content: ContentBlock[]
  published: boolean
  created_at: string
}

export default function WritingSection({ onSubPageChange }: { onSubPageChange?: (v: boolean) => void }) {
  const [writings, setWritings] = useState<Writing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedWriting, setSelectedWriting] = useState<Writing | null>(null)
  const [userProfile, setUserProfile] = useState<{ full_name: string | null; avatar_url: string | null }>({ full_name: null, avatar_url: null })
  
  const { isPlaying, isPaused, speak, pause, resume, stop } = useTextToSpeech()

  const openWriting = (w: Writing) => { playFeedback('tap'); setSelectedWriting(w); onSubPageChange?.(true) }
  const closeWriting = () => { setSelectedWriting(null); onSubPageChange?.(false); stop() }

  useEffect(() => {
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
          const requestedSlug = new URLSearchParams(window.location.search).get('article')
          const requestedArticle = requestedSlug ? published.find((writing: Writing) => writing.slug === requestedSlug) : null
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
  }, [])

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
      doodleVariant={2}
    />
  }

  // Article View - Medium-style clean layout
  if (selectedWriting) {
    return (
      <div className="w-full max-w-2xl mx-auto px-8 py-12 md:py-20" style={{ animation: 'articleEntrance 0.35s cubic-bezier(0.22,1,0.36,1) both' }}>
        <Doodles />
        {/* Back Button */}
        <button
          onClick={closeWriting}
          className="flex items-center gap-2 text-sm text-foreground/45 hover:text-foreground mb-12 transition-colors group"
        >
          <svg className="w-4 h-4 transition-transform duration-200 group-hover:-translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
          </svg>
          Back to writings
        </button>

        {/* Article Content */}
        <article>
            <header className="mb-14 pb-10 border-b border-foreground/8">
              <h1 className="text-3xl md:text-4xl font-medium tracking-[-0.035em] text-foreground mb-5 leading-[1.08]">
                {selectedWriting.title}
              </h1>
              {selectedWriting.excerpt && (
                <p className="text-foreground/55 leading-7 mb-7 text-sm font-normal">
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
                  <span className="text-sm text-foreground/30">•</span>
                  <span className="text-sm text-foreground/50">
                    {Math.ceil(selectedWriting.content.reduce((acc, block) => acc + (block.content?.split(' ').length || 0), 0) / 200)} min read
                  </span>
                </div>
                
                {/* Audio Reader Button - Medium Style */}
                <button 
                  onClick={() => {
                    if (isPlaying) {
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
                      
                      speak(textToRead)
                    }
                  }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-foreground/12 transition-colors text-sm text-foreground/55 hover:text-foreground hover:border-foreground/25 cursor-pointer"
                >
                  {isPlaying && !isPaused ? (
                    <>
                      <svg className="w-4 h-4 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="4" width="3" height="16" />
                        <rect x="15" y="4" width="3" height="16" />
                      </svg>
                      Pause
                    </>
                  ) : isPlaying && isPaused ? (
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
                <div className="rounded-lg overflow-hidden">
                  <ProgressiveImage
                    src={selectedWriting.cover_image}
                    alt={selectedWriting.title}
                    className="w-full h-48 md:h-72 object-cover"
                    containerClassName="rounded-lg overflow-hidden"
                  />
                </div>
              )}
            </header>

            <div className="prose prose-invert max-w-2xl mx-auto">
              {selectedWriting.content.map((block) => {
                switch (block.type) {
                  case 'heading':
                    const HeadingTag: 'h1' | 'h2' | 'h3' = block.level === 1 ? 'h1' : block.level === 3 ? 'h3' : 'h2'
                    const headingText = block.content.replace(/<[^>]*>/g, '')
                    return (
                      <HeadingTag
                        key={block.id}
                        id={`block-${block.id}`}
                        className={`scroll-mt-8 text-foreground ${
                          block.level === 1 ? 'text-2xl font-medium tracking-[-0.025em] mt-14 mb-5 leading-tight' :
                          block.level === 2 ? 'text-xl font-medium tracking-[-0.02em] mt-12 mb-4 leading-snug' :
                          'text-lg font-medium mt-9 mb-3 leading-snug'
                        }`}
                      >{headingText}</HeadingTag>
                    )
                  case 'paragraph':
                    return (
                      <SafeHtml
                        key={block.id}
                        html={block.content}
                        className="text-foreground/65 leading-7 mb-6 text-sm font-normal [&>p]:mb-5 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-5 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:mb-5 [&>li]:mb-2 [&>strong]:font-medium [&>strong]:text-foreground [&>em]:italic [&_strong]:font-medium [&_strong]:text-foreground"
                      />
                    )
                  case 'image':
                    return block.content ? (
                      <figure key={block.id} className="my-14 -mx-4 md:-mx-16">
                        <ProgressiveImage
                          src={block.content}
                          alt=""
                          className="w-full rounded-lg"
                          containerClassName="w-full rounded-lg overflow-hidden"
                        />
                      </figure>
                    ) : null
                  case 'quote':
                    return (
                      <SafeHtml
                        key={block.id}
                        as="blockquote"
                        html={block.content}
                        className="pl-6 border-l border-foreground/25 text-foreground/60 my-12 text-lg leading-8 font-normal [&>p]:mb-0"
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

  // Writings List - Medium-style card grid
  return (
    <div className="w-full max-w-6xl mx-auto px-8 py-12 md:py-20">
      <Doodles />
      
      {/* Centered Content Container */}
      <div className="flex justify-center">
        <div className="max-w-4xl w-full">
          {/* Section Header */}
          <div className="mb-14 max-w-xl">
            <h2 className="text-3xl md:text-4xl tracking-[-0.035em] font-medium text-foreground mb-4">Writing</h2>
            <p className="text-foreground/55 leading-relaxed">
              Thoughts, insights, and explorations on design, development, and the craft of building things.
            </p>
          </div>

          {/* Cards Grid - 2 columns on desktop */}
          <StaggerContainer delay={0.2}>
            <div className="border-t border-foreground/8">
              {writings.map((writing) => (
                <StaggerItem key={writing.id}>
                  <button
                    onClick={() => openWriting(writing)}
                    className="group text-left grid grid-cols-[96px_1fr] md:grid-cols-[160px_1fr] grid-rows-[auto_auto] gap-x-5 md:gap-x-7 w-full py-6 border-b border-foreground/8 hover:border-foreground/20 transition-colors"
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
              <h3 className="col-start-2 self-end text-lg font-medium tracking-[-0.015em] text-foreground mb-2 leading-snug group-hover:text-foreground/70 transition-colors">
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
                </button>
                </StaggerItem>
              ))}
            </div>
          </StaggerContainer>
        </div>
      </div>
    </div>
  )
}
