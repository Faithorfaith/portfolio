'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { normalizeExternalUrl, normalizeWhatsAppUrl } from '@/lib/content-utils'
import PortfolioMenu from './portfolio-menu'
import { MovingText } from './portfolio-shelf'
import type { Profile } from './profile-section'

function LocalTime() {
  const [time, setTime] = useState('')

  useEffect(() => {
    const format = new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    const update = () => setTime(format.format(new Date()))
    update()
    const interval = window.setInterval(update, 1_000)
    return () => window.clearInterval(interval)
  }, [])

  return <div className="portfolio-clock">Local time<time>{time}</time></div>
}

export default function PortfolioHeader({ profile }: {
  profile?: Profile | null
}) {
  const name = profile?.full_name?.trim() || 'Faith Awokunle'
  const [firstName, ...lastName] = name.split(/\s+/)
  const whatsapp = normalizeWhatsAppUrl(profile?.whatsapp_url)
  const social = normalizeExternalUrl(profile?.x_url)
  const photos = [...new Set([
    profile?.avatar_url, profile?.hero_image_1, ...(profile?.gallery_images || []), profile?.hero_image_2,
  ].filter((src): src is string => Boolean(src && /^https?:\/\//i.test(src))))].slice(0, 3)

  return (
    <header className="portfolio-opening-header">
      <Link href="/" className="portfolio-header-name">{firstName}{lastName.length > 0 && <><br />{lastName.join(' ')}</>}</Link>
      <span className="portfolio-opening-role">Product designer</span>
      <nav className="portfolio-opening-nav" aria-label="Portfolio">
        <PortfolioMenu photos={photos} name={name} />
        {(profile?.contact_email || whatsapp || social) && (
          <details>
            <summary><MovingText>Contact</MovingText></summary>
            <div className="portfolio-opening-links">
              {profile?.contact_email && <a href={`mailto:${profile.contact_email}`}>Email</a>}
              {whatsapp && <a href={whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a>}
              {social && <a href={social} target="_blank" rel="noopener noreferrer">X</a>}
            </div>
          </details>
        )}
      </nav>
      <LocalTime />
    </header>
  )
}
