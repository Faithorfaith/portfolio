'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import EmptyState from './empty-state'
import ProgressiveImage from '@/components/progressive-image'

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

  useEffect(() => {
    if (!galleryOpen) return
    const close = (event: KeyboardEvent) => event.key === 'Escape' && setGalleryOpen(false)
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', close)
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', close) }
  }, [galleryOpen])

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
          className="w-16 h-16 md:w-20 md:h-20 animate-doodle-shake"
        />
      </div>
      <div className="fixed pointer-events-none z-30 bottom-40 right-5">
        <img 
          src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-hSQCOVk4FK1TJNrE7ZbEJgsiYal1rr.png"
          alt="Doodle cool character" 
          loading="lazy"
          decoding="async"
          className="w-16 h-16 md:w-20 md:h-20 animate-doodle-shake"
        />
      </div>

      <div className="w-full max-w-2xl mx-auto px-8 py-12 md:py-16 relative z-10">
        {/* One profile cover opens the full gallery. */}
        {galleryImages.length > 0 && (
          <div className="mb-8">
            <button onClick={() => setGalleryOpen(true)} className="group relative block w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border border-border/60 shadow-sm" aria-label={`Open photo gallery with ${galleryImages.length} images`}>
              <Image src={galleryImages[0]} alt="Profile gallery cover" fill sizes="128px" className="object-cover transition-transform duration-500 group-hover:scale-105" priority />
              <span className="absolute right-2 bottom-2 rounded-full bg-black/65 px-2 py-1 text-[11px] text-white backdrop-blur-sm">{galleryImages.length} photos</span>
            </button>
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
          <h2 className="text-foreground mb-8">
            Case Studies
          </h2>

          <div className="relative left-1/2 w-[calc(100vw-2rem)] -translate-x-1/2 md:w-[calc(100vw-10rem)]">
          <div className="flex gap-5 md:gap-8 overflow-x-auto snap-x snap-mandatory pb-6 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {caseStudies.map((caseStudy) => (
              <a
                key={caseStudy.id}
                href={`/case-studies/${caseStudy.id}`}
                className="group block min-w-[84vw] md:min-w-[560px] lg:min-w-[640px] max-w-[720px] snap-start"
              >
                {/* Thumbnail */}
                {caseStudy.thumbnail_url && (
                  <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-foreground/5 border border-border/40">
                    <Image
                      src={caseStudy.thumbnail_url}
                      alt={caseStudy.title}
                      fill
                      sizes="(max-width: 768px) 84vw, 640px"
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
        </div>
      )}
      </div>

      {galleryOpen && (
        <div className="fixed inset-0 z-[100] bg-background/95 backdrop-blur-xl overflow-y-auto" role="dialog" aria-modal="true" aria-label="Photo gallery">
          <div className="sticky top-0 z-10 flex items-center justify-between px-5 md:px-10 py-5 bg-background/85 backdrop-blur-xl border-b border-border/40">
            <div><p className="font-medium">Photo gallery</p><p className="text-xs text-foreground/45">{galleryImages.length} images</p></div>
            <button onClick={() => setGalleryOpen(false)} className="w-10 h-10 rounded-full border border-border flex items-center justify-center text-xl" aria-label="Close gallery">×</button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 p-4 md:p-10 max-w-7xl mx-auto">
            {galleryImages.map((src, index) => <div key={`${src}-${index}`} className="relative aspect-[4/3] rounded-2xl overflow-hidden bg-foreground/5"><Image src={src} alt={`Gallery image ${index + 1}`} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" /></div>)}
          </div>
        </div>
      )}
    </div>
  )
}
