'use client'

import SafeHtml from './safe-html'
import ProgressiveImage from './progressive-image'

export interface ArticleBlock { id: string; type: string; content: string; level?: 1 | 2 | 3 }

export default function ArticleBody({ blocks }: { blocks: ArticleBlock[] }) {
  return <div className="w-full max-w-[600px] text-sm">
    {blocks.map((block) => {
      if (block.type === 'heading') {
        const Heading = block.level === 1 ? 'h2' : block.level === 2 ? 'h3' : 'h4'
        return <Heading key={block.id} id={`block-${block.id}`} className="scroll-mt-20 text-sm font-medium leading-relaxed tracking-[0.01em] mt-10 mb-4">{block.content.replace(/<[^>]*>/g, '')}</Heading>
      }
      if (block.type === 'image') return block.content ? <figure key={block.id} className="my-10"><ProgressiveImage src={block.content} alt="" className="w-full h-auto" containerClassName="w-full" /></figure> : null
      if (block.type === 'divider') return <hr key={block.id} className="my-10 border-foreground/10" />
      return <SafeHtml key={block.id} as={block.type === 'quote' ? 'blockquote' : 'div'} html={block.content} className={`article-prose ${block.type === 'quote' ? 'pl-5 border-l border-foreground/20 my-8' : 'mb-6'}`} />
    })}
  </div>
}
