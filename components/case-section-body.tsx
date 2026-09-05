'use client'
import SafeHtml from './safe-html'

export default function CaseSectionBody({ html }: { html: string }) {
  return <SafeHtml html={html} className="article-prose" />
}
