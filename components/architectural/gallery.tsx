'use client'

import { useEffect, useRef, useState } from 'react'
import { SocialLinks } from '@/components/portfolio/social-contact'
import type { GalleryData } from '@/lib/architectural/data'

export default function ArchitecturalGallery({ profile, document }: { profile: GalleryData['profile']; document: string }) {
  const frame = useRef<HTMLIFrameElement>(null)
  const dropdown = useRef<HTMLDivElement>(null)
  const [contactOpen, setContactOpen] = useState(false)
  const close = () => {
    setContactOpen(false)
    frame.current?.contentWindow?.postMessage({ type: 'portfolio:contact-close' }, window.location.origin)
  }
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return
      if (event.data?.type === 'portfolio:contact') setContactOpen(open => !open)
      if (event.data?.type === 'portfolio:contact-close') setContactOpen(false)
    }
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close() }
    const outside = (event: PointerEvent) => { if (!dropdown.current?.contains(event.target as Node)) close() }
    window.addEventListener('message', receive)
    window.addEventListener('keydown', escape)
    window.addEventListener('pointerdown', outside)
    return () => { window.removeEventListener('message', receive);window.removeEventListener('keydown', escape);window.removeEventListener('pointerdown', outside) }
  }, [])
  useEffect(() => { frame.current?.contentWindow?.postMessage({type:'portfolio:contact-state',open:contactOpen},window.location.origin) }, [contactOpen])
  return <div style={{ position: 'fixed', inset: 0, background: '#111', zIndex: 80, fontFamily: 'Manrope, sans-serif' }}>
    <iframe ref={frame} srcDoc={document} title="Faith Awokunle — portfolio" allow="xr-spatial-tracking; fullscreen" allowFullScreen style={{ width: '100%', height: '100%', border: 0 }} />
    {contactOpen && <div ref={dropdown} className="creator-glass-dropdown" role="region" aria-label="Creator contact links">
      <span className="creator-glass-eyebrow">LET’S CONNECT</span><h2>{profile.name}</h2><p>Designer &amp; Video Editor</p><nav aria-label="Social and contact links"><SocialLinks profile={profile} /></nav>
    </div>}
  </div>
}
