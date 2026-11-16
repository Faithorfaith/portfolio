'use client'

import { useLayoutEffect } from 'react'
import { usePathname } from 'next/navigation'

const revealSelector = '.portfolio-deferred, [data-motion-section]'

export default function MotionOrchestrator() {
  const pathname = usePathname()

  useLayoutEffect(() => {
    const expansion = document.querySelector<HTMLElement>('[data-menu-destination]')
    if (expansion?.dataset.menuDestination === pathname) {
      const content = document.querySelector<HTMLElement>('main')
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        expansion.remove()
      } else {
        const reveal = expansion.animate([
          { opacity: 1 },
          { opacity: 0 },
        ], { duration: 320, easing: 'ease-out', fill: 'forwards' })
        content?.animate([
          { opacity: .5, translate: '0 14px' },
          { opacity: 1, translate: 'none' },
        ], { duration: 380, easing: 'cubic-bezier(.22,1,.36,1)' })
        void reveal.finished.then(() => expansion.remove(), () => expansion.remove())
      }
    } else if (expansion) {
      expansion.remove()
    }

    const paper = document.createElement('div')
    paper.className = 'page-paper-transition'
    paper.setAttribute('aria-hidden', 'true')
    if (!/^\/(?:$|about$|archive$|playground$|case-studies(?:\/|$)|writing(?:\/|$))/.test(pathname)) document.body.appendChild(paper)
    requestAnimationFrame(() => paper.classList.add('is-active'))
    const paperTimer = window.setTimeout(() => paper.remove(), 420)
    if (pathname === '/' && sessionStorage.getItem('portfolio-returning') === 'true') {
      const saved = Number(sessionStorage.getItem('portfolio-home-scroll') || 0)
      sessionStorage.removeItem('portfolio-returning')
      requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'instant' }))
    }

    const rememberHomePosition = (event: MouseEvent) => {
      if (pathname !== '/') return
      const link = (event.target as HTMLElement | null)?.closest<HTMLAnchorElement>('a[href]')
      if (!link) return
      const href = link.getAttribute('href') || ''
      if (!/^\/(case-studies|writing|playground|workflows)(\/|\?|$)/.test(href)) return
      sessionStorage.setItem('portfolio-home-scroll', String(window.scrollY))
      sessionStorage.setItem('portfolio-returning', 'true')
    }
    document.addEventListener('click', rememberHomePosition)
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const sections = Array.from(document.querySelectorAll<HTMLElement>(revealSelector))

    if (reduced) {
      sections.forEach((section) => section.classList.add('is-revealed'))
      return
    }

    const main = document.querySelector<HTMLElement>('main')
    if (!expansion && !('startViewTransition' in document) && !/^\/case-studies(?:\/|$)/.test(pathname)) {
      main?.animate(
        [
          { opacity: 0.86, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' },
        ],
        { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' },
      )
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-revealed')
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 })

    sections.forEach((section, index) => {
      section.classList.add('motion-managed')
      section.style.setProperty('--reveal-delay', `${Math.min(index * 36, 144)}ms`)
      if (section.getBoundingClientRect().top < window.innerHeight * 0.9) section.classList.add('is-revealed')
      else observer.observe(section)
    })

    const press = (event: PointerEvent) => {
      const target = (event.target as HTMLElement | null)?.closest<HTMLElement>('a, button')
      if (!target || target.matches(':disabled')) return
      target.classList.add('is-pressing')
      const release = () => target.classList.remove('is-pressing')
      window.addEventListener('pointerup', release, { once: true })
      window.addEventListener('pointercancel', release, { once: true })
    }
    document.addEventListener('pointerdown', press, { passive: true })
    return () => {
      window.clearTimeout(paperTimer)
      paper.remove()
      observer.disconnect()
      document.removeEventListener('pointerdown', press)
      document.removeEventListener('click', rememberHomePosition)
    }
  }, [pathname])

  return null
}
