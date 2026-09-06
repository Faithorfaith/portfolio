'use client'

import DOMPurify from 'dompurify'
import { createElement } from 'react'
import SafeEmbed from './safe-embed'

type SafeHtmlProps = {
  html: string
  as?: 'div' | 'blockquote' | 'p'
  className?: string
  id?: string
}

export default function SafeHtml({ html, as = 'div', ...props }: SafeHtmlProps) {
  const clean = DOMPurify.sanitize(html, {
    USE_PROFILES: { html: true },
    FORBID_TAGS: ['style', 'script', 'iframe', 'object', 'embed', 'form'],
    FORBID_ATTR: ['style'],
  })

  // Embedded providers go through the same allowlisted renderer as legacy media.
  if (clean.includes('data-embed=') && typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(clean, 'text/html')
    const children = Array.from(doc.body.childNodes).map((node, index) => {
      if (node instanceof Element && node.hasAttribute('data-embed')) {
        return <SafeEmbed key={index} url={node.getAttribute('data-embed') || ''} title="Embedded content" />
      }
      return <div key={index} dangerouslySetInnerHTML={{ __html: node instanceof Element ? node.outerHTML : DOMPurify.sanitize(node.textContent || '') }} />
    })
    return createElement(as, props, children)
  }
  return createElement(as, { ...props, dangerouslySetInnerHTML: { __html: clean } })
}
