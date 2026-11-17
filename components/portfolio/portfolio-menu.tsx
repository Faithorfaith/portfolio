'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { MovingText } from './portfolio-shelf'
import { replaceEmDashes } from '@/lib/content-utils'

interface MenuPreviews {
  caseStudies: string[]
  playground: string[]
  writing: { title: string; cover: string | null } | null
  books?: { title: string; cover: string | null }[]
}

export default function PortfolioMenu({ photos, name }: { photos: string[]; name: string }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const transition = useRef<Animation | null>(null)
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
    transition.current?.cancel()
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
    void loadPreviews()
    menu.querySelector('.portfolio-menu-destinations')?.scrollTo(0, 0)
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
    const availableWidth = tile.parentElement?.clientWidth || window.innerWidth
    const scale = Math.max(1, Math.min(1.5, availableWidth / bounds.width))

    tile.setAttribute('data-expanding', '')
    const animation = tile.animate(
      [{ scale: '1' }, { scale: String(scale) }],
      { duration: 320, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' },
    )
    transition.current = animation

    try {
      await animation.finished
      if (menu.open && transition.current === animation) {
        menu.close()
        router.push(href)
      }
    } catch {
      // Closing the menu cancels the tile animation.
    } finally {
      if (transition.current === animation) transition.current = null
      animation.cancel()
      tile.removeAttribute('data-expanding')
    }
  }
  const destinations = [
    { label: 'Case Studies', href: '/case-studies', images: previews?.caseStudies },
    { label: 'Playground', href: '/playground', images: previews?.playground },
    { label: 'My Writings', href: '/writing' },
    { label: 'About', href: '/about', images: photos },
  ]

  const books = previews?.books ?? (previews?.writing ? [previews.writing] : [])

  return (
    <>
      <button type="button" className="portfolio-menu-trigger" aria-haspopup="dialog" onClick={openMenu}><MovingText>Menu</MovingText></button>
      <dialog ref={dialog} className="portfolio-menu-dialog" aria-label="Portfolio menu" onClose={clearTransition} onCancel={event => { event.preventDefault(); closeMenu() }}>
        <div className="portfolio-menu-top">
          <Link href="/" onClick={() => dialog.current?.close()}>{name}</Link>
          <button type="button" autoFocus onClick={closeMenu}>Close</button>
        </div>
        <nav className="portfolio-menu-destinations" aria-label="Portfolio sections">
          {destinations.map(item => (
            <Link key={item.href} href={item.href} onClick={event => void openDestination(event, item.href)}>
              <span className="portfolio-menu-label"><MovingText>{item.label}</MovingText></span>
              {!previews && item.href !== '/about' && (
                <span className="portfolio-menu-covers" aria-hidden="true">
                  {[0, 1].map(slot => (
                    <span className="portfolio-menu-cover" key={slot}>
                      <span className="portfolio-menu-cover-frame" />
                    </span>
                  ))}
                </span>
              )}
              {!!item.images?.length && (
                <span className="portfolio-menu-covers" data-destination={item.href} aria-hidden="true">
                  {item.images.map(src => (
                    <span className="portfolio-menu-cover" key={src}>
                      <span className="portfolio-menu-cover-frame">
                        <Image src={src} fill quality={60} sizes="(max-width: 640px) 250px, 300px" alt="" />
                      </span>
                    </span>
                  ))}
                </span>
              )}
              {item.href === '/writing' && books.length > 0 && (
                <span className="portfolio-menu-covers" aria-hidden="true">
                  {books.map(book => (
                    <span className="portfolio-menu-book" key={book.title}>
                      <span className="portfolio-book-front">
                        {book.cover && (
                          <span className="portfolio-book-art"><Image src={book.cover} fill quality={60} sizes="90px" alt="" /></span>
                        )}
                        <span className="portfolio-book-copy"><strong>{replaceEmDashes(book.title)}</strong><span>{name}</span></span>
                      </span>
                    </span>
                  ))}
                </span>
              )}
            </Link>
          ))}
        </nav>
        <footer className="portfolio-menu-footer">{name}</footer>
      </dialog>
    </>
  )
}
