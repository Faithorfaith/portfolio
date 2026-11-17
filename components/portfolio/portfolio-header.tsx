'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
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
  const contactDialog = useRef<HTMLDialogElement>(null)
  const whatsapp = normalizeWhatsAppUrl(profile?.whatsapp_url)
  const social = normalizeExternalUrl(profile?.x_url)
  const contacts = [
    { label: 'Email', href: profile?.contact_email?.trim() ? `mailto:${profile.contact_email.trim()}` : '' },
    { label: 'WhatsApp', href: whatsapp },
    { label: 'X', href: social },
  ].filter(contact => contact.href)
  const photos = [...new Set([
    profile?.avatar_url, profile?.hero_image_1, ...(profile?.gallery_images || []), profile?.hero_image_2,
  ].filter((src): src is string => Boolean(src && /^https?:\/\//i.test(src))))].slice(0, 3)

  return (
    <header className="portfolio-opening-header">
      <Link href="/" className="portfolio-header-name">{firstName}{lastName.length > 0 && <><br />{lastName.join(' ')}</>}</Link>
      <span className="portfolio-opening-role">Product designer</span>
      <nav className="portfolio-opening-nav" aria-label="Portfolio">
        <PortfolioMenu photos={photos} name={name} />
        {contacts.length > 0 && (
          <>
            <button type="button" className="portfolio-contact-trigger" aria-haspopup="dialog" onClick={() => contactDialog.current?.showModal()}>
              <MovingText>Contact</MovingText>
            </button>
            <dialog ref={contactDialog} className="portfolio-menu-dialog portfolio-contact-dialog" aria-label="Contact">
              <div className="portfolio-menu-top">
                <Link href="/" onClick={() => contactDialog.current?.close()}>{name}</Link>
                <button type="button" autoFocus onClick={() => contactDialog.current?.close()}>Close</button>
              </div>
              <div className="portfolio-contact-links">
                {contacts.map(({ label, href }) => (
                  <a key={label} href={href} target={label === 'Email' ? undefined : '_blank'} rel={label === 'Email' ? undefined : 'noopener noreferrer'}>
                    <MovingText>{label}</MovingText>
                  </a>
                ))}
              </div>
              <footer className="portfolio-menu-footer">{name}</footer>
            </dialog>
          </>
        )}
      </nav>
      <LocalTime />
    </header>
  )
}
