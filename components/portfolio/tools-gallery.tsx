'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Tool {
  id: string
  name: string
  short_bio: string | null
  icon_url: string | null
  link: string | null
  order_index: number
  created_at: string
}

export default function ToolsGallery() {
  const [tools, setTools] = useState<Tool[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchTools = async () => {
      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('portfolio_tools')
          .select('*')
          .order('order_index', { ascending: true })
          .order('created_at', { ascending: false })

        if (error) {
          console.error('Error fetching tools:', error)
        } else if (data) {
          setTools(data)
        }
      } catch (error) {
        console.error('Error:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTools()
  }, [])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-foreground/50 animate-pulse">Loading tools...</p>
      </div>
    )
  }

  return (
    <div className="w-full bg-background">
      <div className="p-6 md:p-8 max-w-2xl">
        {tools.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-foreground/50">No tools yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {tools.map((tool) => (
              <div
                key={tool.id}
                className="group border-b border-border pb-6 last:border-b-0"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-foreground font-medium mb-2">
                      {tool.name}
                    </h3>
                    {tool.short_bio && (
                      <p className="text-foreground/70 text-sm leading-relaxed">
                        {tool.short_bio}
                      </p>
                    )}
                    {tool.link && (
                      <a
                        href={tool.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-3 text-sm text-foreground hover:text-foreground/70 transition-colors underline"
                      >
                        View Tool →
                      </a>
                    )}
                  </div>

                  {/* Icon Preview on Hover */}
                  {tool.icon_url && (
                    <div className="flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border border-gray-400 shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <img
                        src={tool.icon_url}
                        alt={tool.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
