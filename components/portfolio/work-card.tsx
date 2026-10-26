'use client'

import AppIcon from '@/components/icons/app-icon'
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
          <AppIcon name="ThumbsUp" className="w-8 h-8 text-foreground/30" />
        </div>
      )}
    </div>
  )
}
