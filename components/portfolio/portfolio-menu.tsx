'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { MovingText } from './portfolio-shelf'

interface MenuPreviews {
  caseStudies: string[]
  caseStudyPreviews?: { src: string; title: string }[]
  playground: string[]
  writing: { title: string; cover: string | null } | null
}

export default function PortfolioMenu({ photos, name }: { photos: string[]; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const destinationsRail = useRef<HTMLElement>(null)
  const transition = useRef<HTMLElement | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const [previews, setPreviews] = useState<MenuPreviews | null>(null)
  const loadingPreviews = useRef(false)

  const loadPreviews = async () => {
    if (previews || loadingPreviews.current) return
    loadingPreviews.current = true
    try {
      const response = await fetch('/api/public/menu-previews')
      if (response.ok) setPreviews(await response.json())
    } catch {
      // Menu links are available while previews load or if the request fails.
    } finally {
      loadingPreviews.current = false
    }
  }

  const clearTransition = () => {
    transition.current?.remove()
    transition.current = null
  }

  useEffect(() => {
    dialog.current?.close()
    clearTransition()
  }, [pathname])

  useEffect(() => {
    const rail = destinationsRail.current
    if (!rail) return
    const scrollCards = (event: WheelEvent) => {
      if (event.ctrlKey || event.shiftKey || Math.abs(event.deltaX) >= Math.abs(event.deltaY) ||
          rail.scrollWidth <= rail.clientWidth || window.matchMedia('(max-width: 640px)').matches) return
      const unit = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rail.clientWidth : 1
      const next = Math.max(0, Math.min(rail.scrollWidth - rail.clientWidth, rail.scrollLeft + event.deltaY * unit))
      if (next === rail.scrollLeft) return
      event.preventDefault()
      rail.scrollLeft = next
    }
    rail.addEventListener('wheel', scrollCards, { passive: false })
    return () => rail.removeEventListener('wheel', scrollCards)
  }, [])

  const openMenu = () => {
    const menu = dialog.current
    if (!menu || menu.open) return
    menu.showModal()
    void loadPreviews()
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
    { label: 'Case Studies', href: '/case-studies', images: previews?.caseStudyPreviews ?? previews?.caseStudies.map(src => ({ src, title: '' })) },
    { label: 'Playground', href: '/playground', images: previews?.playground.map(src => ({ src, title: '' })) },
    { label: 'My Writings', href: '/writing' },
    { label: 'About', href: '/about', images: photos.slice(0, 1).map(src => ({ src, title: '' })) },
  ]

  return (
    <>
      <button type="button" className="portfolio-menu-trigger" aria-haspopup="dialog" onClick={openMenu}><MovingText>Menu</MovingText></button>
      <dialog ref={dialog} className="portfolio-menu-dialog" aria-label="Portfolio menu" onClose={clearTransition} onCancel={event => { event.preventDefault(); closeMenu() }}>
        <div className="portfolio-menu-top">
          <Link href="/" onClick={() => dialog.current?.close()}>Faith Awokunle</Link>
          <button type="button" autoFocus onClick={closeMenu}>Close</button>
        </div>
        <nav ref={destinationsRail} className="portfolio-menu-destinations" aria-label="Portfolio sections">
          {destinations.map(item => (
            <Link key={item.href} href={item.href} onClick={event => void openDestination(event, item.href)}>
              <span className="portfolio-menu-card-header" aria-hidden="true">
                <span>{name}</span>
                <span>Product designer</span>
              </span>
              <span className="portfolio-menu-label"><MovingText>{item.label}</MovingText></span>
              {!!item.images?.length && (
                <span className="portfolio-menu-covers" data-destination={item.href} aria-hidden="true">
                  {item.images.map(({ src, title }) => (
                    <span className="portfolio-menu-cover" key={src}>
                      {title && <span className="portfolio-menu-cover-title">{title}</span>}
                      <span className="portfolio-menu-cover-frame">
                        <Image src={src} fill quality={60} sizes="(max-width: 640px) 250px, 300px" alt="" />
                      </span>
                    </span>
                  ))}
                </span>
              )}
              {item.href === '/writing' && previews?.writing && (
                <span className="portfolio-menu-book" aria-hidden="true">
                  <span className="portfolio-book-front">
                    {previews.writing.cover && (
                      <span className="portfolio-book-art"><Image src={previews.writing.cover} fill quality={60} sizes="90px" alt="" /></span>
                    )}
                    <span className="portfolio-book-copy"><strong>{previews.writing.title}</strong><span>{name}</span></span>
                  </span>
                </span>
              )}
            </Link>
          ))}
        </nav>
      </dialog>
    </>
  )
}
