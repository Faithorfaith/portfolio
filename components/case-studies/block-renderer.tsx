'use client'

import SafeHtml from '@/components/safe-html'

interface ContentBlock {
  id: string
  type: 'heading' | 'paragraph' | 'image' | 'quote' | 'divider'
  content: string
  level?: 1 | 2 | 3
}

interface BlockRendererProps {
  blocks: ContentBlock[]
}

export default function BlockRenderer({ blocks }: BlockRendererProps) {
  return (
    <div className="space-y-4">
      {blocks.map((block) => {
        switch (block.type) {
          case 'heading':
            const HeadingTag = block.level === 1 ? 'h1' : block.level === 2 ? 'h2' : 'h3'
            // Extract text from HTML tags (in case Tiptap returns HTML)
            const headingText = block.content.replace(/<[^>]*>/g, '')
            return (
              <HeadingTag
                key={block.id}
                className={`font-medium text-foreground ${
                  block.level === 1 ? 'text-3xl mt-8 mb-2' :
                  block.level === 2 ? 'text-2xl mt-6 mb-2' :
                  'text-xl mt-4 mb-2'
                }`}
              >
                {headingText}
              </HeadingTag>
            )

          case 'paragraph':
            return (
              <SafeHtml
                key={block.id}
                html={block.content}
                className="text-foreground/70 leading-relaxed whitespace-pre-wrap prose prose-sm dark:prose-invert max-w-none"
              />
            )

          case 'quote':
            return (
              <SafeHtml
                key={block.id}
                as="blockquote"
                html={block.content}
                className="border-l-4 border-foreground/30 pl-4 py-2 italic text-foreground/70 prose prose-sm dark:prose-invert max-w-none"
              />
            )

          case 'image':
            return (
              <div key={block.id} className="my-4 rounded-lg overflow-hidden">
                <img
                  src={block.content}
                  alt="Content"
                  className="w-full h-auto"
                />
              </div>
            )

          case 'divider':
            return <hr key={block.id} className="my-4 border-foreground/10" />

          default:
            return null
        }
      })}
    </div>
  )
}
