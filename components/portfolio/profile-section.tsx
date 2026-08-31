'use client'

import { useState } from 'react'
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
  const [heroImagesExpanded, setHeroImagesExpanded] = useState(false)

  const handleCopyEmail = () => {
    navigator.clipboard.writeText('faithawokunle1@gmail.com')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Rotate hero images every 5 seconds on hover
  const heroImages = profile ? [profile.hero_image_1, profile.hero_image_2, profile.hero_image_3].filter(Boolean) : []
  
  const handleHeroImageHover = (isHovering: boolean) => {
    if (heroImages.length <= 1) return
    // Use CSS class instead of direct style manipulation for better performance
    const container = document.querySelector('[data-hero-container]')
    if (!container) return
    
    if (isHovering) {
      container.classList.add('hero-expanded')
    } else {
      container.classList.remove('hero-expanded')
    }
  }

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
        {/* Hero Images - Layered stack, hover to spread on desktop, click on mobile */}
        {heroImages.length > 0 && (
          <div className="mb-8">
            {/* Desktop: Hover to spread */}
            <div 
              className="hidden md:block relative cursor-pointer"
              data-hero-container
              style={{ width: '200px', height: '96px' }}
              onMouseEnter={() => handleHeroImageHover(true)}
              onMouseLeave={() => handleHeroImageHover(false)}
            >
              {heroImages[0] && (
                <div className="absolute w-24 h-24 rounded-xl overflow-hidden hero-img-1" style={{ zIndex: 1, border: '0.5px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  <Image src={heroImages[0]} alt="Hero image 1" fill sizes="96px" className="object-cover" priority />
                </div>
              )}
              {heroImages[1] && (
                <div className="absolute w-24 h-24 rounded-xl overflow-hidden hero-img-2" style={{ zIndex: 2, border: '0.5px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.04s' }}>
                  <Image src={heroImages[1]} alt="Hero image 2" fill sizes="96px" className="object-cover" />
                </div>
              )}
              {heroImages[2] && (
                <div className="absolute w-24 h-24 rounded-xl overflow-hidden hero-img-3" style={{ zIndex: 3, border: '0.5px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.45s cubic-bezier(0.34,1.56,0.64,1) 0.08s' }}>
                  <Image src={heroImages[2]} alt="Hero image 3" fill sizes="96px" className="object-cover" />
                </div>
              )}
            </div>

            {/* Mobile: Click to spread */}
            <div 
              className={`md:hidden relative cursor-pointer${heroImagesExpanded ? ' hero-expanded' : ''}`}
              style={{ width: '220px', height: '96px', marginLeft: '20px' }}
              onClick={() => setHeroImagesExpanded(!heroImagesExpanded)}
            >
              {heroImages[0] && (
                <div className="absolute w-20 h-20 rounded-xl overflow-hidden hero-img-1-mobile" style={{ zIndex: 1, border: '0.5px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1)' }}>
                  <Image src={heroImages[0]} alt="Hero image 1" fill sizes="80px" className="object-cover" priority />
                </div>
              )}
              {heroImages[1] && (
                <div className="absolute w-20 h-20 rounded-xl overflow-hidden hero-img-2-mobile" style={{ zIndex: 2, border: '0.5px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.04s' }}>
                  <Image src={heroImages[1]} alt="Hero image 2" fill sizes="80px" className="object-cover" />
                </div>
              )}
              {heroImages[2] && (
                <div className="absolute w-20 h-20 rounded-xl overflow-hidden hero-img-3-mobile" style={{ zIndex: 3, border: '0.5px solid rgba(0,0,0,0.1)', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', transition: 'transform 0.4s cubic-bezier(0.34,1.56,0.64,1) 0.08s' }}>
                  <Image src={heroImages[2]} alt="Hero image 3" fill sizes="80px" className="object-cover" />
                </div>
              )}
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

          {/* Case Studies Grid - 2 columns desktop, 1 on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            {caseStudies.map((caseStudy) => (
              <a
                key={caseStudy.id}
                href={`/case-studies/${caseStudy.id}`}
                className="group block rounded-xl overflow-hidden border border-border/40 hover:border-border/80 transition-all duration-300 hover:shadow-md"
              >
                {/* Thumbnail */}
                {caseStudy.thumbnail_url && (
                  <div className="relative w-full aspect-video rounded-t-lg overflow-hidden bg-foreground/5">
                    <Image
                      src={caseStudy.thumbnail_url}
                      alt={caseStudy.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 50vw"
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                )}

                {/* Card Content */}
                <div className="p-6">
                  {/* Title */}
                  <h3 className="text-foreground font-medium mb-2 group-hover:text-foreground/80 transition-colors">
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
