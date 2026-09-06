'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import EmptyState from './empty-state'
import ProgressiveImage from '@/components/progressive-image'
import { playFeedback } from '@/lib/interaction-feedback'
import { slugify } from '@/lib/slugify'
import { track } from '@vercel/analytics'
import { cleanInlineText, normalizeExternalUrl } from '@/lib/content-utils'
import { imageFocus } from '@/lib/image-focus'

export interface Profile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  avatar_url: string | null
  hero_image_1: string | null
  hero_image_2: string | null
  hero_image_3: string | null
  gallery_images?: string[] | null
  bio_references?: BioReference[] | null
  positioning_headline?: string | null
  supporting_statement?: string | null
  availability_status?: string | null
  contact_email?: string | null
  linkedin_url?: string | null
  resume_url?: string | null
  primary_cta_label?: string | null
}

interface BioReference {
  id: string
  label: string
  description: string
  url: string
}

interface Project {
  id: string
  title: string
  description: string | null
  media_url: string | null
  media_type: string | null
  thumbnail_url: string | null
  type: string | null
  order_index: number
  created_at: string
}

export interface CaseStudy {
  id: string
  slug: string | null
  title: string
  excerpt: string | null
  thumbnail_url: string | null
  published: boolean
  created_at: string
}

export default function ProfileSection({
  profile,
  caseStudies,
}: {
  profile: Profile | null
  caseStudies: CaseStudy[]
}) {
  const [copied, setCopied] = useState(false)
  const [galleryOpen, setGalleryOpen] = useState(false)
  const railRef = useRef<HTMLDivElement>(null)
  const cursorLabelRef = useRef<HTMLDivElement>(null)
  const galleryCursorLabelRef = useRef<HTMLDivElement>(null)
  const dragState = useRef({ active: false, moved: false, x: 0, scrollLeft: 0 })
  const [railEdges, setRailEdges] = useState({ start: true, end: true })

  useEffect(() => {
    const rail = railRef.current
    if (!rail) return
    const update = () => setRailEdges({ start: rail.scrollLeft < 2, end: rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 2 })
    update()
    const observer = new ResizeObserver(update)
    observer.observe(rail)
    rail.addEventListener('scroll', update, { passive: true })
    return () => { observer.disconnect(); rail.removeEventListener('scroll', update) }
  }, [caseStudies, profile])

  const browseWork = (direction: number) => {
    const rail = railRef.current
    if (!rail) return
    const card = rail.querySelector<HTMLElement>('.case-study-rail-card')
    const gap = parseFloat(getComputedStyle(rail).columnGap) || 16
    rail.scrollBy({ left: direction * ((card?.offsetWidth || 240) + gap), behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' })
  }

  const contactEmail = profile?.contact_email || 'faithawokunle1@gmail.com'
  const handleCopyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contactEmail)
      track('contact_email_copied', { location: 'homepage' })
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Keep this a copy-only interaction; never redirect to an email app.
      setCopied(false)
    }
  }

  const legacyImages = [profile?.hero_image_1, profile?.hero_image_2, profile?.hero_image_3].filter(Boolean) as string[]
  const galleryImages = profile?.gallery_images?.length ? profile.gallery_images : legacyImages

  if (!profile) {
    return (
      <div className="flex items-center justify-center w-full h-full">
        <p className="text-foreground/50">No profile found</p>
      </div>
    )
  }

  return (
    <div className="relative w-full">
      <div className="w-full max-w-2xl mx-auto px-5 sm:px-8 py-12 md:py-16 relative z-10">
        {/* One quiet cover reveals the gallery in place. */}
        {galleryImages.length > 0 && (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => {
                playFeedback('tap')
                setGalleryOpen((open) => !open)
              }}
              onMouseEnter={(event) => {
                if (!galleryCursorLabelRef.current || window.matchMedia('(hover: none)').matches) return
                galleryCursorLabelRef.current.style.opacity = '1'
                galleryCursorLabelRef.current.style.transform = `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`
              }}
              onMouseMove={(event) => {
                if (galleryCursorLabelRef.current) galleryCursorLabelRef.current.style.transform = `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`
              }}
              onMouseLeave={() => { if (galleryCursorLabelRef.current) galleryCursorLabelRef.current.style.opacity = '0' }}
              className="group relative block w-28 h-28 md:w-32 md:h-32 rounded-lg overflow-hidden border border-transparent hover:border-foreground/40 focus-visible:border-foreground/50 transition-[border-color,opacity] hover:opacity-95"
              aria-label={galleryOpen ? 'Hide profile photos' : 'Show profile photos'}
              aria-expanded={galleryOpen}
              aria-controls="profile-photos"
            >
              <Image
                src={galleryImages[0]}
                alt="Profile gallery cover"
                fill
                sizes="128px"
                className={`object-cover transition-[filter] duration-300 ${galleryOpen ? 'grayscale-0' : 'grayscale'}`}
                priority
              />
            </button>

            <div className="grid transition-[grid-template-rows,opacity] duration-300" style={{ gridTemplateRows: galleryOpen ? '1fr' : '0fr', opacity: galleryOpen ? 1 : 0 }} inert={!galleryOpen} aria-hidden={!galleryOpen}>
              <div className="min-h-0 overflow-hidden">
              <div id="profile-photos" tabIndex={galleryOpen ? 0 : -1} className="flex gap-2.5 mt-3 overflow-x-auto snap-x snap-proximity pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Profile photos">
                {galleryImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="gallery-photo-card gallery-photo-reveal group/photo relative shrink-0 aspect-[4/5] overflow-hidden bg-foreground/5 snap-start"
                    style={{ animationDelay: `${120 + index * 55}ms` }}
                  >
                    <Image
                      src={src}
                      alt={`Profile photo ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 45vw, 150px"
                      className="object-cover transition-[filter,opacity] duration-300 group-hover/photo:brightness-[0.96]"
                    />
                  </div>
                ))}
              </div>
              </div>
            </div>
            <div
              ref={galleryCursorLabelRef}
              className="fixed top-0 left-0 z-[80] pointer-events-none opacity-0 px-2.5 py-1.5 rounded-full bg-foreground text-background text-[11px] whitespace-nowrap transition-opacity duration-150 shadow-sm"
              aria-hidden="true"
            >
              {galleryOpen ? 'Close gallery' : 'View gallery'}
            </div>
          </div>
        )}

        {/* Name - Left Aligned */}
        <h1 className="font-medium text-foreground mb-1">
          {profile.full_name || profile.username}
        </h1>

      {/* Bio - Display as paragraphs */}
      {profile.bio && (
        <div className="mb-6">
          <div className="space-y-4">
            {profile.bio.split('\n\n').map((paragraph, index) => (
              <p
                key={index}
                className="text-foreground/70 leading-relaxed"
              >
                {paragraph}
              </p>
            ))}
          </div>
        </div>
      )}

      {profile.bio_references && profile.bio_references.length > 0 && (
        <div className="flex flex-wrap items-start gap-2 mb-8">
          {profile.bio_references.filter((reference) => reference.label.trim()).map((reference) => {
            const label = cleanInlineText(reference.label)
            const description = cleanInlineText(reference.description)
            const url = normalizeExternalUrl(reference.url)
            const content = (
              <>
                {description && <span className="text-foreground/55">{description}</span>}
                <span className="font-medium text-foreground/75">{label}</span>
                {url && <span className="text-foreground/40 group-hover:text-foreground/65 transition-colors">↗</span>}
              </>
            )
            const classes = 'group inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-0.5 px-2.5 py-1.5 rounded-full bg-foreground/[0.045] text-xs leading-relaxed text-foreground/70 hover:bg-foreground/[0.075] transition-colors whitespace-normal'
            return url ? <a key={reference.id} href={url} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a> : <span key={reference.id} className={classes}>{content}</span>
          })}
        </div>
      )}

      <div className="mb-20 pt-2">
        <p className="flex flex-wrap items-center gap-2 text-sm leading-relaxed text-foreground/70">
          <span>Got something in mind? Reach out at</span>
          <button
            type="button"
            onClick={handleCopyEmail}
            className="inline-flex h-9 min-h-9 items-center gap-1.5 rounded-lg border border-foreground/15 px-3 text-xs font-medium text-foreground/70 transition-colors hover:border-foreground/30 hover:bg-foreground/[0.035]"
            aria-live="polite"
            title="Copy email address"
          >
            {copied ? 'Email copied' : 'Copy email'}
            {!copied && (
              <svg className="size-3.5 text-foreground/45" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          <span>— I&apos;d love to hear from you</span>
        </p>
      </div>


      {/* Case Studies Section */}
      {caseStudies.length > 0 && (
        <div id="work" className="mt-16 scroll-mt-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground">My work</h2>
            {caseStudies.length > 1 && (
              <div className="flex items-center gap-1" aria-label="Browse work">
                <button type="button" aria-label="Previous work" aria-controls="work-rail" disabled={railEdges.start} onClick={() => browseWork(-1)} className="rail-control">←</button>
                <button type="button" aria-label="Next work" aria-controls="work-rail" disabled={railEdges.end} onClick={() => browseWork(1)} className="rail-control">→</button>
              </div>
            )}
          </div>

          <div
            ref={railRef}
            id="work-rail"
            role="region"
            tabIndex={0}
            aria-label="Case studies. Scroll horizontally to browse."
            onKeyDown={(event) => {
              if (event.target !== event.currentTarget) return
              if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
                event.preventDefault()
                browseWork(event.key === 'ArrowRight' ? 1 : -1)
              }
            }}
            onPointerDown={(event) => {
              if (event.pointerType === 'touch') return
              dragState.current = { active: true, moved: false, x: event.clientX, scrollLeft: railRef.current?.scrollLeft || 0 }
            }}
            onPointerMove={(event) => {
              if (!dragState.current.active || !railRef.current) return
              if (Math.abs(event.clientX - dragState.current.x) > 5 && !dragState.current.moved) {
                dragState.current.moved = true
                event.currentTarget.setPointerCapture(event.pointerId)
              }
              if (!dragState.current.moved) return
              railRef.current.scrollLeft = dragState.current.scrollLeft - (event.clientX - dragState.current.x)
            }}
            onPointerUp={(event) => {
              dragState.current.active = false
              if (event.currentTarget.hasPointerCapture(event.pointerId)) {
                event.currentTarget.releasePointerCapture(event.pointerId)
              }
            }}
            onPointerCancel={() => { dragState.current.active = false; dragState.current.moved = false }}
            onClickCapture={(event) => {
              if (!dragState.current.moved) return
              event.preventDefault()
              event.stopPropagation()
              dragState.current.moved = false
            }}
            className="case-study-rail flex w-[calc(50vw+50%-2rem)] gap-4 md:gap-5 overflow-x-auto snap-x snap-mandatory pb-6 pr-8 cursor-grab active:cursor-grabbing select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {caseStudies.map((caseStudy) => (
              <a
                key={caseStudy.id}
                href={`/case-studies/${slugify(caseStudy.title) || caseStudy.slug || caseStudy.id}`}
                onClick={() => { playFeedback('tap'); track('case_study_opened', { title: caseStudy.title }) }}
                className="case-study-rail-card group relative block shrink-0 snap-start"
                onMouseEnter={(event) => {
                  if (!cursorLabelRef.current || window.matchMedia('(hover: none)').matches) return
                  cursorLabelRef.current.style.opacity = '1'
                  cursorLabelRef.current.style.transform = `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`
                }}
                onMouseMove={(event) => {
                  if (!cursorLabelRef.current || dragState.current.active) return
                  cursorLabelRef.current.style.transform = `translate3d(${event.clientX + 14}px, ${event.clientY + 14}px, 0)`
                }}
                onMouseLeave={() => {
                  if (cursorLabelRef.current) cursorLabelRef.current.style.opacity = '0'
                }}
              >
                {/* Thumbnail */}
                {caseStudy.thumbnail_url && (
                  <div className="relative w-full aspect-[4/3] overflow-hidden bg-foreground/5">
                    <Image
                      src={imageFocus(caseStudy.thumbnail_url).src}
                      style={{ objectPosition: imageFocus(caseStudy.thumbnail_url).position }}
                      alt={caseStudy.title}
                      fill
                      sizes="(max-width: 640px) 72vw, 36vw"
                      className="object-cover"
                    />
                    <span className="work-action-label absolute bottom-2 right-2 rounded-full bg-background/95 px-2.5 py-1.5 text-[11px]">View case study ↗</span>
                  </div>
                )}

                {/* Card Content */}
                <div className="pt-3 pr-1">
                  {/* Title */}
                  <h3 className="text-foreground/85 text-sm font-normal leading-relaxed tracking-[0.01em] mb-1.5 group-hover:text-foreground transition-colors">
                    {caseStudy.title}
                  </h3>

                  {/* Excerpt */}
                  {caseStudy.excerpt && (
                    <p className="text-foreground/60 text-sm leading-relaxed line-clamp-2">
                      {caseStudy.excerpt}
                    </p>
                  )}
                </div>
              </a>
            ))}
          </div>
          <div
            ref={cursorLabelRef}
            className="fixed top-0 left-0 z-[80] pointer-events-none opacity-0 px-2.5 py-1.5 rounded-full bg-foreground text-background text-[11px] whitespace-nowrap transition-opacity duration-150 shadow-sm"
            aria-hidden="true"
          >
            View case study
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
