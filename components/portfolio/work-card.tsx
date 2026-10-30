'use client'

import ProgressiveImage from '@/components/progressive-image'

interface WorkCardProps {
  work: {
    id: string
    title: string
    description: string | null
    media_url: string
    media_type: 'image' | 'video'
    thumbnail_url: string | null
  }
}

export default function WorkCard({ work }: WorkCardProps) {
  const mediaUrl = work.thumbnail_url || work.media_url

  return (
    <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
      {/* Media */}
      {work.media_type === 'image' ? (
        <ProgressiveImage
          src={mediaUrl}
          alt={work.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-foreground/5 to-foreground/10 flex items-center justify-center">
          <svg className="w-8 h-8 text-foreground/30" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14 10h4.764a2 2 0 0 1 1.789 2.894l-3.646 7.12A2 2 0 0 1 14.764 21H6a2 2 0 0 1-2-2v-4.333a2 2 0 0 1 .97-1.766l5.03-3.022A2 2 0 0 1 12 9v1m0 0V7a2 2 0 1 0-4 0v2m4 0h-4" />
          </svg>
        </div>
      )}
    </div>
  )
}
