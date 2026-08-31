'use client'

import { useState } from 'react'
import Image from 'next/image'
import EmptyState from './empty-state'
import ProgressiveImage from '@/components/progressive-image'
import { playFeedback } from '@/lib/interaction-feedback'

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

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('faithawokunle1@gmail.com')
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
      {/* Doodles */}
      <div className="fixed pointer-events-none z-30 top-16 left-5">
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-YTOZb6UgMNL2WcsNjULSUsbLb1fmjk.png"
          alt="Doodle dinosaur" 
          loading="lazy"
          decoding="async"
          className="w-12 h-12 md:w-14 md:h-14 animate-doodle-shake"
        />
      </div>
      <div className="fixed pointer-events-none z-30 bottom-40 right-5">
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hSQCOVk4FK1TJNrE7ZbEJgsiYal1rr.png"
          alt="Doodle cool character" 
          loading="lazy"
          decoding="async"
          className="w-12 h-12 md:w-14 md:h-14 animate-doodle-shake"
        />
      </div>

      <div className="w-full max-w-2xl mx-auto px-8 py-12 md:py-16 relative z-10">
        {/* One quiet cover reveals the gallery in place. */}
        {galleryImages.length > 0 && (
          <div className="mb-8">
            <button
              type="button"
              onClick={() => {
                playFeedback('tap')
                setGalleryOpen((open) => !open)
              }}
              className="group relative block w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border border-transparent hover:border-foreground/45 focus-visible:border-foreground/60 focus-visible:outline-none transition-colors"
              aria-label={galleryOpen ? 'Hide profile photos' : 'Show profile photos'}
              aria-expanded={galleryOpen}
            >
              <Image src={galleryImages[0]} alt="Profile gallery cover" fill sizes="128px" className="object-cover" priority />
            </button>

            {galleryOpen && (
              <div className="gallery-linear-reveal grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3" aria-label="Profile photos">
                {galleryImages.map((src, index) => (
                  <div
                    key={`${src}-${index}`}
                    className="gallery-photo-reveal relative w-full aspect-[4/5] overflow-hidden bg-foreground/5"
                    style={{ animationDelay: `${120 + index * 55}ms` }}
                  >
                    <Image
                      src={src}
                      alt={`Profile photo ${index + 1}`}
                      fill
                      sizes="(max-width: 640px) 50vw, 150px"
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            )}
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

      {/* Contact CTA - Below Bio */}
      <div className="mb-20 border-t border-border/30 pt-6">
        <p className="text-foreground/70 leading-relaxed flex items-center gap-2 flex-wrap">
          Got something in mind? Reach out at{' '}
          <button
            onClick={handleCopyEmail}
            className="inline-flex items-center gap-1 px-3 py-1 rounded-lg transition-all duration-200 group cursor-pointer"
            style={{ border: '0.5px solid rgba(0,0,0,0.2)' }}
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
        <div className="mt-16">
          <div className="flex items-baseline justify-between mb-8">
            <h2 className="text-foreground">Case studies</h2>
            {caseStudies.length > 1 && <span className="text-xs text-foreground/35">Scroll →</span>}
          </div>

          <div className="flex w-[calc(50vw+50%-2rem)] gap-5 overflow-x-auto snap-x snap-mandatory pb-6 pr-8 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {caseStudies.map((caseStudy) => (
              <a
                key={caseStudy.id}
                href={`/case-studies/${caseStudy.id}`}
                className="group block min-w-[78vw] sm:min-w-[480px] md:min-w-[560px] snap-start"
              >
                {/* Thumbnail */}
                {caseStudy.thumbnail_url && (
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-foreground/5 border border-border/40">
                    <Image
                      src={caseStudy.thumbnail_url}
                      alt={caseStudy.title}
                      fill
                      sizes="(max-width: 640px) 78vw, 560px"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Card Content */}
                <div className="pt-4 px-1">
                  {/* Title */}
                  <h3 className="text-foreground text-lg font-medium mb-2 group-hover:text-foreground/70 transition-colors">
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
        </div>
      )}
      </div>
    </div>
  )
}
