'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, type MouseEvent } from 'react'
import { MovingText } from './portfolio-shelf'

export default function PortfolioMenu() {
  const dialog = useRef<HTMLDialogElement>(null)
  const transition = useRef<HTMLElement | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  const clearTransition = () => {
    transition.current?.remove()
    transition.current = null
  }

  useEffect(() => {
    dialog.current?.close()
    clearTransition()
  }, [pathname])

  const openMenu = () => {
    const menu = dialog.current
    if (!menu || menu.open) return
    menu.showModal()
    menu.scrollTop = 0
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const page = menu.closest('main') || document.querySelector('main')
    page?.animate([
      { transform: 'none', opacity: 1 },
      { transform: 'perspective(1100px) translateY(12px) rotateX(8deg) scale(.88)', opacity: .25 },
    ], { duration: 420, easing: 'cubic-bezier(.22,1,.36,1)' })
  }

  const closeMenu = () => {
    const menu = dialog.current
    if (!menu || !menu.open) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || transition.current) {
      menu.close()
      return
    }
    const cards = menu.querySelector('.portfolio-menu-destinations')
    const animation = cards?.animate(
      [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(12px) scale(.94)' }],
      { duration: 180, easing: 'ease-in', fill: 'forwards' },
    )
    if (!animation) { menu.close(); return }
    void animation.finished.then(() => {
      menu.close()
      animation.cancel()
    }).catch(() => undefined)
  }

  const openDestination = async (event: MouseEvent<HTMLAnchorElement>, href: string) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const menu = dialog.current
    if (!menu || href === pathname || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      menu?.close()
      return
    }
    event.preventDefault()
    if (transition.current) return

    const tile = event.currentTarget
    const bounds = tile.getBoundingClientRect()
    const label = tile.querySelector<HTMLElement>('.portfolio-menu-label')
    const labelBounds = label?.getBoundingClientRect() || bounds
    const surface = document.createElement('div')
    surface.className = 'portfolio-menu-expansion'
    surface.setAttribute('aria-hidden', 'true')
    transition.current = surface
    const preview = document.createElement('div')
    preview.className = 'portfolio-menu-expansion-copy'
    preview.textContent = label?.querySelector('.portfolio-moving-text > span')?.textContent || ''
    surface.append(preview)
    menu.append(surface)
    const timing: KeyframeAnimationOptions = { duration: 520, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' }
    preview.animate([
      { left: `${labelBounds.left - bounds.left}px`, top: `${labelBounds.top - bounds.top}px`, fontSize: getComputedStyle(tile).fontSize },
      { left: 'clamp(24px, 4vw, 64px)', top: 'clamp(110px, 19vh, 250px)', fontSize: 'clamp(40px, 7vw, 90px)' },
    ], timing)

    const animation = surface.animate([
      { inset: `${bounds.top}px ${window.innerWidth - bounds.right}px ${window.innerHeight - bounds.bottom}px ${bounds.left}px`, backgroundColor: '#ffffff', borderRadius: '18px' },
      { inset: '0', backgroundColor: '#f5f5f5', borderRadius: '0' },
    ], timing)
    await animation.finished.catch(() => undefined)
    if (!menu.open || transition.current !== surface) return

    // Keep the expanded tile visible while Next replaces the outgoing page.
    surface.dataset.menuDestination = href
    document.body.append(surface)
    transition.current = null
    menu.close()
    router.push(href)
    window.setTimeout(() => surface.remove(), 5000)
  }
  const destinations = [
    { label: 'Case Studies', href: '/case-studies', preview: 'Product design projects, from the problem to the finished experience.' },
    { label: 'Playground', href: '/playground', preview: 'Screens, components, and design explorations.' },
    { label: 'My Writings', href: '/writing', preview: 'Notes on design, technology, and making complex things clear.' },
    { label: 'About', href: '/about', preview: 'Faith Awokunle · Product designer' },
  ]

  return (
    <>
      <button type="button" className="portfolio-menu-trigger" aria-haspopup="dialog" onClick={openMenu}><MovingText>Menu</MovingText></button>
      <dialog ref={dialog} className="portfolio-menu-dialog" aria-label="Portfolio menu" onClose={clearTransition} onCancel={event => { event.preventDefault(); closeMenu() }}>
        <div className="portfolio-menu-top">
          <Link href="/" onClick={() => dialog.current?.close()}>Faith Awokunle</Link>
          <button type="button" autoFocus onClick={closeMenu}>Close</button>
        </div>
        <nav className="portfolio-menu-destinations" aria-label="Portfolio sections">
          {destinations.map(item => (
            <Link key={item.href} href={item.href} onClick={event => void openDestination(event, item.href)}>
              <small aria-hidden="true">Faith<br />Awokunle</small>
              <span className="portfolio-menu-label"><MovingText>{item.label}</MovingText></span>
              <span className="portfolio-menu-preview" aria-hidden="true">{item.preview}</span>
            </Link>
          ))}
        </nav>
      </dialog>
    </>
  )
}
