'use client'

import DOMPurify from 'dompurify'
import { createElement } from 'react'

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

  return createElement(as, { ...props, dangerouslySetInnerHTML: { __html: clean } })
}
