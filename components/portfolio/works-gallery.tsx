'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { fetchWithCache } from '@/lib/cache-utils'
import { StaggerContainer, StaggerItem, ParallaxImage } from '@/components/animations/scroll-animations'
import EmptyState from './empty-state'
import ProgressiveImage from '@/components/progressive-image'
import { playFeedback } from '@/lib/interaction-feedback'
import Link from 'next/link'

export interface Work {
  id: string
  title: string
  description: string | null
  media_url: string | null
  media_type: string | null
  thumbnail_url: string | null
  order_index: number
  created_at: string
  type?: string | null
}

export default function WorksGallery({ onSubPageChange, variant = 'full', initialWorks }: { onSubPageChange?: (v: boolean) => void; variant?: 'preview' | 'full'; initialWorks?: Work[] }) {
  const [works, setWorks] = useState<Work[]>(initialWorks || [])
  const [isLoading, setIsLoading] = useState(!initialWorks)
  const [selectedWork, setSelectedWork] = useState<Work | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const openWork = (work: Work) => {
    playFeedback('tap')
    setSelectedWork(work)
    onSubPageChange?.(true)
    if (variant === 'full') window.history.pushState({ playgroundWork: work.id }, '', `/playground?work=${encodeURIComponent(work.id)}`)
    // Tiny delay so the element mounts before we trigger the transition
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)))
  }
  const closeWork = () => {
    setModalVisible(false)
    if (variant === 'full' && window.location.search) window.history.replaceState(null, '', '/playground')
    setTimeout(() => { setSelectedWork(null); onSubPageChange?.(false) }, 200)
  }

  // ESC key to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeWork() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedWork])

  useEffect(() => {
    if (variant !== 'full') return
    const onPopState = () => {
      const requestedId = new URLSearchParams(window.location.search).get('work')
      if (!requestedId) {
        setModalVisible(false)
        setSelectedWork(null)
        onSubPageChange?.(false)
      }
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [variant, onSubPageChange])

  useEffect(() => {
    if (variant !== 'full' || works.length === 0 || selectedWork) return
    const requestedId = new URLSearchParams(window.location.search).get('work')
    const requestedWork = requestedId ? works.find((work) => work.id === requestedId) : null
    if (!requestedWork) return
    setSelectedWork(requestedWork)
    onSubPageChange?.(true)
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)))
  }, [variant, works, selectedWork, onSubPageChange])

  useEffect(() => {
    if (initialWorks) return
    const fetchWorks = async () => {
      try {
        const data = await fetchWithCache(
          'portfolio_works',
          async () => {
            const supabase = createClient()
            const { data, error } = await supabase
              .from('portfolio_works')
              .select('*')
              .order('created_at', { ascending: false })
            
            if (error) throw error
            return data || []
          },
          10 * 60 * 1000 // 10 minute cache
        )
        
        setWorks(data)
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchWorks()
  }, [initialWorks, variant, onSubPageChange])

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto px-8 py-12 md:py-16">
        <div className="animate-pulse space-y-12">
          <div className="space-y-2">
            <div className="h-5 w-32 bg-foreground/6 rounded-full" />
            <div className="h-3 w-2/3 bg-foreground/5 rounded-full" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {[1,2,3,4].map(i => (
              <div key={i}>
                <div className="aspect-[4/3] rounded-xl bg-foreground/5 mb-4" />
                <div className="h-3 w-3/4 bg-foreground/5 rounded-full mb-2" />
                <div className="h-2.5 w-1/2 bg-foreground/4 rounded-full" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (works.length === 0) {
    return <EmptyState 
      title="Playground"
      description="Coming soon..."
    />
  }

  // Helper to get cover image - use thumbnail, or fallback to media_url if it's an image
  const getCoverImage = (work: Work) => {
    if (work.thumbnail_url) return work.thumbnail_url
    if (work.media_url && work.media_type?.startsWith('image')) return work.media_url
    return null
  }

  // Helper to check if media is video
  const isVideo = (work: Work) => work.media_type?.startsWith('video')

  if (variant === 'preview') {
    return (
      <section id="playground" className="w-full max-w-2xl mx-auto px-5 sm:px-8 py-12 scroll-mt-20" aria-labelledby="playground-preview-title">
        <div className="flex items-baseline justify-between gap-4 mb-8">
          <h2 id="playground-preview-title" className="text-foreground">Playground</h2>
          <Link href="/playground" className="text-[11px] text-foreground/45 hover:text-foreground transition-colors">View all projects →</Link>
        </div>
        <div className="columns-2 sm:columns-3 gap-3" aria-label="Playground preview">
          {works.slice(0, 6).map((work) => {
            const coverImage = getCoverImage(work)
            return (
              <Link
                key={work.id}
                href={`/playground?work=${encodeURIComponent(work.id)}`}
                onClick={() => playFeedback('tap')}
                className="group relative block break-inside-avoid mb-3 overflow-hidden rounded-md bg-foreground/5 ring-1 ring-transparent hover:ring-foreground/25 transition-[box-shadow,filter] hover:brightness-[0.98]"
                aria-label={`View ${work.title} in Playground`}
              >
                {coverImage ? (
                  <img src={coverImage} alt={work.title} className="block w-full h-auto" loading="lazy" />
                ) : isVideo(work) && work.media_url ? (
                  <video src={work.media_url} className="block w-full h-auto" muted playsInline preload="metadata" />
                ) : (
                  <div className="aspect-[4/3] flex items-center justify-center text-[11px] text-foreground/45">{work.title}</div>
                )}
              </Link>
            )
          })}
        </div>
        <Link href="/playground" className="mt-5 inline-flex min-h-9 items-center text-xs text-foreground/50 hover:text-foreground transition-colors">View all Playground projects →</Link>
      </section>
    )
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-8 py-12 md:py-20">
      <div className="flex justify-center">
        <div className="max-w-4xl w-full">
          <Link href="/" className="mb-12 inline-flex min-h-9 items-center text-xs text-foreground/45 hover:text-foreground transition-colors">← Back to portfolio</Link>
          {/* Section Header */}
          <div className="mb-10 max-w-xl">
            <h2 className="text-[18px] tracking-[-0.01em] font-medium text-foreground">Playground</h2>
          </div>

          {/* Grid Layout - 2 cols */}
          <StaggerContainer delay={0.1}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-12">
              {works.map((work) => {
                const coverImage = getCoverImage(work)
                
                return (
                  <StaggerItem key={work.id}>
                    <button
                      onClick={() => openWork(work)}
                      className="group text-left w-full focus-visible:outline-offset-6"
                    >
                      {/* Card */}
                      <div className="relative w-full aspect-[4/3] rounded-md overflow-hidden mb-4 bg-foreground/5 ring-1 ring-transparent group-hover:ring-foreground/25 transition-[box-shadow,filter] duration-200 group-hover:brightness-[0.98]">
                        {coverImage ? (
                          <ProgressiveImage
                            src={coverImage}
                            alt={work.title}
                            fill
                            className="transition-opacity duration-500 ease-out"
                            containerClassName="w-full h-full"
                          />
                        ) : isVideo(work) && work.media_url ? (
                          <video
                            src={work.media_url}
                            className="w-full h-full object-cover"
                            muted
                            playsInline
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/20">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="relative pr-7">
                        {work.type && (
                          <p className="text-foreground/35 text-xs mb-2">
                            {work.type}
                          </p>
                        )}
                        <h3 className="text-foreground font-medium transition-colors line-clamp-1">
                          {work.title}
                        </h3>
                        {work.description && (
                          <p className="text-foreground/45 text-sm mt-1 line-clamp-2 leading-relaxed">
                            {work.description}
                          </p>
                        )}
                        <span className="absolute right-0 top-0 text-foreground/45 group-hover:text-foreground/65 group-hover:translate-x-0.5 transition-all" aria-hidden="true">↗</span>
                      </div>
                    </button>
                  </StaggerItem>
                )
              })}
            </div>
          </StaggerContainer>
        </div>
      </div>

      {/* Modal - Work Detail */}
      {selectedWork && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8 backdrop-blur-md"
          style={{
            background: `rgba(0,0,0,${modalVisible ? 0.32 : 0})`,
            transition: 'background 0.2s ease',
          }}
          onClick={closeWork}
        >
          <div
            className="bg-background rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden relative shadow-2xl shadow-black/10"
            onClick={(e) => e.stopPropagation()}
            style={{
              border: '0.5px solid rgba(0,0,0,0.1)',
              transform: modalVisible ? 'translateY(0)' : 'translateY(10px)',
              opacity: modalVisible ? 1 : 0,
              transition: 'transform 0.28s cubic-bezier(0.22,1,0.36,1), opacity 0.2s ease',
            }}
          >
            <button
              onClick={closeWork}
              className="absolute top-4 right-4 z-10 size-9 flex items-center justify-center bg-background/85 backdrop-blur-md hover:bg-background rounded-full transition-colors"
              aria-label="Close project"
              style={{ border: '0.5px solid rgba(0,0,0,0.1)' }}
            >
              <svg className="w-5 h-5 text-foreground/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col md:flex-row h-full">
              {/* Left - Media (2/3) */}
              <div className="md:w-2/3 bg-foreground/[0.035] flex items-center justify-center p-4 md:p-8 max-h-[50vh] md:max-h-[80vh] overflow-hidden">
                {selectedWork.media_url ? (
                  selectedWork.media_type?.startsWith('image') ? (
                    <ProgressiveImage
                      src={selectedWork.media_url}
                      alt={selectedWork.title}
                      className="max-w-full max-h-full object-contain rounded-lg"
                      containerClassName="max-w-full max-h-full rounded-lg"
                    />
                  ) : (
                    <video
                      src={selectedWork.media_url}
                      controls
                      className="max-w-full max-h-full rounded-lg"
                    />
                  )
                ) : getCoverImage(selectedWork) ? (
                  <ProgressiveImage
                    src={getCoverImage(selectedWork)!}
                    alt={selectedWork.title}
                    className="max-w-full max-h-full object-contain rounded-lg"
                    containerClassName="max-w-full max-h-full rounded-lg"
                  />
                ) : (
                  <div className="text-foreground/20 text-center">
                    <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm">No media</p>
                  </div>
                )}
              </div>

              {/* Right - Details (1/3) */}
              <div className="md:w-1/3 p-6 md:p-8 flex flex-col overflow-y-auto">
                {/* Type */}
                {selectedWork.type && (
                  <span className="text-foreground/35 text-xs mb-3">
                    {selectedWork.type}
                  </span>
                )}

                {/* Title */}
                <h2 className="text-[18px] font-medium tracking-[-0.01em] text-foreground mb-4">
                  {selectedWork.title}
                </h2>

                {/* Description */}
                {selectedWork.description && (
                  <p className="text-foreground/55 leading-relaxed mb-6">
                    {selectedWork.description}
                  </p>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Date */}
                <div className="pt-6 mt-auto" style={{ borderTop: '0.5px solid rgba(0,0,0,0.08)' }}>
                  <span className="text-foreground/40 text-xs">
                    {new Date(selectedWork.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long'
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
