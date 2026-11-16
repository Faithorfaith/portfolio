'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { ComponentProps } from 'react'

export default function CaseStudyTransitionLink({ href, ...props }: Omit<ComponentProps<typeof Link>, 'href' | 'onNavigate'> & { href: string }) {
  const router = useRouter()

  return <Link {...props} href={href} onNavigate={event => {
    const page = document.querySelector('main')
    if (!page || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    event.preventDefault()
    if (page.hasAttribute('data-case-leaving')) return
    page.setAttribute('data-case-leaving', '')
    const exit = page.animate([
      { opacity: 1, translate: '0 0' },
      { opacity: .62, translate: '0 -6px' },
    ], { duration: 160, easing: 'ease-in' })
    void exit.finished.then(() => router.push(href)).catch(() => {}).finally(() => {
      page.removeAttribute('data-case-leaving')
    })
  }} />
}
