'use client'

import { useState } from 'react'
import Link from 'next/link'

interface ProjectRowProps {
  title: string
  slug: string
  type: string | null
  description: string | null
  link: string | null
  date_from: string | null
  is_new: boolean
}

export default function ProjectRow({
  title,
  slug,
  type,
  description,
  link,
  date_from,
  is_new,
}: ProjectRowProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const getViewButtonText = () => {
    if (!type) return 'View'
    const typeMap: Record<string, string> = {
      plugin: 'View Plugin',
      tool: 'View Tool',
      design: 'View Design',
      website: 'Visit Website',
      app: 'View App',
    }
    return typeMap[type.toLowerCase()] || `View ${type}`
  }

  return (
    <div className="border-b border-foreground/5">
      {/* Main row */}
      <div
        className="py-4 flex items-center gap-4 cursor-pointer px-1"
        onClick={() => description && setIsExpanded(!isExpanded)}
      >
        {/* Title + New badge after */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className="text-foreground hover:text-foreground/70 transition-colors">
            {title}
          </span>
          {is_new && (
            <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs font-medium border border-yellow-400/30 text-yellow-400">
              New
            </span>
          )}
        </div>

        {/* Auto-spacing fill */}
        <div className="flex-1" />

        {/* Type on right */}
        {type && (
          <div className="text-foreground/50 text-sm flex-shrink-0">
            {type}
          </div>
        )}

        {/* Date on far right */}
        {date_from && (
          <div className="text-foreground/50 text-sm flex-shrink-0">
            {date_from}
          </div>
        )}
      </div>

      {/* Expandable description with smooth animation */}
      <div
        className="overflow-hidden transition-all duration-1000 ease-in-out"
        style={{
          maxHeight: isExpanded ? '600px' : '0px',
          opacity: isExpanded ? 1 : 0,
          paddingTop: isExpanded ? '0px' : '0px',
        }}
      >
        {description && (
          <div className="px-4 py-4">
            <p className="text-foreground/70 mb-4 leading-relaxed">{description}</p>
            {link && (
              <a
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
              >
                {getViewButtonText()}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
