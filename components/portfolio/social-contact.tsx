'use client'
import { Mail, MessageCircle, ArrowUpRight, Linkedin } from 'lucide-react'
import { normalizeExternalUrl, normalizeWhatsAppUrl } from '@/lib/content-utils'
export type SocialProfile = { contact_email?: string | null; whatsapp_url?: string | null; x_url?: string | null; linkedin_url?: string | null }
export function SocialLinks({ profile, menu = false }: { profile: SocialProfile; menu?: boolean }) {
  const links = [
    { label: 'Email', href: profile.contact_email ? `mailto:${profile.contact_email}` : '', Icon: Mail },
    { label: 'WhatsApp', href: normalizeWhatsAppUrl(profile.whatsapp_url), Icon: MessageCircle },
    { label: 'X', href: normalizeExternalUrl(profile.x_url), Icon: ArrowUpRight },
    { label: 'LinkedIn', href: normalizeExternalUrl(profile.linkedin_url), Icon: Linkedin },
  ].filter(link => link.href)
  return <>{links.map(({ label, href, Icon }) => <a key={label} role={menu ? 'menuitem' : undefined} href={href} {...(!href.startsWith('mailto:') ? { target: '_blank', rel: 'noopener noreferrer' } : {})}><Icon size={20} strokeWidth={1.75} aria-hidden="true" />{label}<ArrowUpRight size={20} strokeWidth={1.75} aria-hidden="true" /></a>)}{!links.length && <span>Contact links coming soon.</span>}</>
}
export default function SocialContact({ profile }: { profile: SocialProfile }) {
  return <div className="home-contact nav-contact"><button type="button" aria-label="Show contact links">contact</button><div className="home-contact-popover" role="menu"><SocialLinks profile={profile} menu /></div></div>
}
