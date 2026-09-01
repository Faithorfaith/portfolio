'use client'

import { useRef, useState } from 'react'
import Image from 'next/image'
import EmptyState from './empty-state'
import ProgressiveImage from '@/components/progressive-image'
import { playFeedback } from '@/lib/interaction-feedback'
import { slugify } from '@/lib/slugify'
import { track } from '@vercel/analytics'

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
  testimonials?: Testimonial[] | null
}

interface Testimonial { id: string; quote: string; name: string; role: string; company: string; url: string }

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

  const contactEmail = profile?.contact_email || 'faithawokunle1@gmail.com'
  const handleCopyEmail = () => {
    navigator.clipboard.writeText(contactEmail)
    track('contact_email_copied', { location: 'homepage' })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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

            {galleryOpen && (
              <div className="gallery-linear-reveal flex gap-2.5 mt-3 overflow-x-auto snap-x snap-mandatory pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Profile photos">
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
                      sizes="(max-width: 640px) 72vw, 150px"
                      className="object-cover transition-[filter,opacity] duration-300 group-hover/photo:brightness-[0.96]"
                    />
                  </div>
                ))}
              </div>
            )}
            <div
              ref={galleryCursorLabelRef}
              className="fixed top-0 left-0 z-[80] pointer-events-none opacity-0 px-2.5 py-1.5 rounded-full bg-foreground text-background text-[11px] whitespace-nowrap transition-opacity duration-150 shadow-sm"
              aria-hidden="true"
            >
              View gallery
            </div>
          </div>
        )}

        {/* Name - Left Aligned */}
        <h1 className="font-medium text-foreground">
          {profile.full_name || profile.username}
        </h1>

      {profile.positioning_headline && (
        <p className="mt-2 max-w-xl text-[18px] leading-[1.45] tracking-[-0.01em] text-foreground">
          {profile.positioning_headline}
        </p>
      )}
      {profile.supporting_statement && <p className="mt-2 max-w-xl text-sm leading-relaxed text-foreground/55">{profile.supporting_statement}</p>}
      {profile.availability_status && (
        <p className="mt-5 inline-flex items-center gap-2 text-[11px] text-foreground/50">
          <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden="true" />
          {profile.availability_status}
        </p>
      )}

      {(profile.linkedin_url || profile.resume_url) && (
        <div className="mt-3 mb-4 flex flex-wrap items-center gap-2">
          {profile.linkedin_url && <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center pr-3 text-xs text-foreground/55 hover:text-foreground transition-colors">LinkedIn ↗</a>}
          {profile.resume_url && <a href={profile.resume_url} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-9 items-center px-3 text-xs text-foreground/55 hover:text-foreground transition-colors">Résumé ↗</a>}
        </div>
      )}

      {/* Bio - Display as paragraphs */}
      {profile.bio && (
        <div className="mt-2 mb-6">
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
            const content = (
              <>
                {reference.description && <span className="text-foreground/55">{reference.description}</span>}
                <span className="font-medium text-foreground/75">{reference.label}</span>
                {reference.url && <span className="text-foreground/40 group-hover:text-foreground/65 transition-colors">↗</span>}
              </>
            )
            const classes = 'group inline-flex max-w-full flex-wrap items-baseline gap-x-1.5 gap-y-0.5 px-2.5 py-1.5 rounded-full bg-foreground/[0.045] text-xs leading-relaxed text-foreground/70 hover:bg-foreground/[0.075] transition-colors whitespace-normal'
            return reference.url ? <a key={reference.id} href={reference.url} target="_blank" rel="noopener noreferrer" className={classes}>{content}</a> : <span key={reference.id} className={classes}>{content}</span>
          })}
        </div>
      )}

      {profile.testimonials && profile.testimonials.filter((item) => item.quote.trim()).length > 0 && (
        <section className="mb-16" aria-labelledby="client-proof-title">
          <h2 id="client-proof-title" className="text-[11px] text-foreground/40 mb-6">What collaborators say</h2>
          <div className="grid gap-8 sm:grid-cols-2">
            {profile.testimonials.filter((item) => item.quote.trim()).slice(0, 4).map((item) => (
              <figure key={item.id} className="space-y-3">
                <blockquote className="text-sm leading-relaxed text-foreground/75">“{item.quote}”</blockquote>
                <figcaption className="text-[11px] leading-relaxed text-foreground/42">
                  {item.url ? <a href={item.url} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{item.name} ↗</a> : item.name}
                  {(item.role || item.company) && <span> · {[item.role, item.company].filter(Boolean).join(', ')}</span>}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      {/* Contact CTA - Below Bio */}
      <div className="mb-20 pt-2">
        <p className="text-foreground/70 leading-relaxed flex items-center gap-2 flex-wrap">
          Got something in mind? Reach out at{' '}
          <button
            onClick={handleCopyEmail}
            className="inline-flex min-h-9 items-center gap-1 px-2 py-1 rounded-md bg-foreground/[0.045] hover:bg-foreground/[0.075] transition-colors group cursor-pointer"
            title="Click to copy email"
          >
            <span className="font-medium text-foreground/70">
              {copied ? 'Email copied' : 'Copy email'}
            </span>
            {!copied && (
              <svg className="w-4 h-4 text-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
          {' '}— I&apos;d love to hear from you
        </p>
      </div>



      {/* Case Studies Section */}
      {caseStudies.length > 0 && (
        <div id="work" className="mt-16 scroll-mt-20">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-sm font-normal leading-relaxed tracking-[0.01em] text-foreground">My work</h2>
            {caseStudies.length > 1 && <span className="text-xs text-foreground/35">Scroll →</span>}
          </div>

          <div
            ref={railRef}
            tabIndex={0}
            aria-label="Case studies. Scroll horizontally to browse."
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') railRef.current?.scrollBy({ left: 320, behavior: 'smooth' })
              if (event.key === 'ArrowLeft') railRef.current?.scrollBy({ left: -320, behavior: 'smooth' })
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
                className="case-study-rail-card group block shrink-0 snap-start"
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
                  <div className="relative w-full aspect-[4/3] rounded-lg overflow-hidden bg-foreground/5">
                    <Image
                      src={caseStudy.thumbnail_url}
                      alt={caseStudy.title}
                      fill
                      sizes="(max-width: 640px) 72vw, 36vw"
                      className="object-cover"
                    />
                  </div>
                )}

                {/* Card Content */}
                <div className="pt-3 pr-1">
                  {/* Title */}
                  <h3 className="text-foreground text-sm font-medium mb-1.5 group-hover:text-foreground/70 transition-colors">
                    {caseStudy.title}
                  </h3>

                  {/* Excerpt */}
                  {caseStudy.excerpt && (
                    <p className="text-foreground/45 text-sm leading-relaxed line-clamp-2">
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
