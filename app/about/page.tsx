import Image from 'next/image'
import AboutScrollLayout from '@/components/portfolio/about-scroll-layout'
import PortfolioHeader from '@/components/portfolio/portfolio-header'
import { normalizeExternalUrl, normalizeWhatsAppUrl, replaceEmDashes } from '@/lib/content-utils'
import { getPublicProfile } from '@/lib/public-portfolio-data'
import styles from './about.module.css'

export const metadata = { title: 'About - Faith Awokunle' }

const experience = [
  { company: 'Ape Born', role: 'Multidisciplinary Product Designer', period: 'Aug 2025 – Present' },
  { company: 'Techminte', role: 'UI Designer', period: 'Feb 2025 – Jul 2026' },
  { company: 'Lucy’s Circle', role: 'Product Designer', period: 'Apr – Jul 2025' },
  { company: 'Synergy Developers', role: 'Product Designer', period: 'Jul – Oct 2024' },
  { company: '2geda.net', role: 'Product Designer', period: 'Jul 2023 – Jul 2024' },
  { company: 'Televerse', role: 'Product Designer', period: 'May 2023 – Mar 2024' },
]

export default async function AboutPage() {
  const profile = await getPublicProfile()
  const name = profile?.full_name?.trim() || 'Faith Awokunle'
  const [firstName, ...surname] = name.split(/\s+/)
  const bio = profile?.bio?.trim() || 'I’m a product designer working across digital products, visual design, and motion.'
  const headline = profile?.positioning_headline?.trim() || 'I design digital products that make complex ideas feel clear.'
  const paragraphs = bio.split(/\n\s*\n/).map(replaceEmDashes)
  paragraphs.splice(1, 1, 'Outside work, I love playing video games, watching documentaries, and listening to music. I also like getting outdoors and making time for the gym.')
  const video = profile?.train_video_1?.trim()
  const photos = [...new Set([
    profile?.avatar_url,
    profile?.hero_image_1,
    ...(profile?.gallery_images || []),
    profile?.hero_image_2,
    profile?.hero_image_3,
  ].filter((src): src is string => Boolean(src && /^https?:\/\//i.test(src))))].slice(0, 3)

  const socials = [
    { label: 'LinkedIn', href: normalizeExternalUrl(profile?.linkedin_url) },
    { label: 'X', href: normalizeExternalUrl(profile?.x_url) },
  ].filter(({ href }) => href)
  const email = profile?.contact_email?.trim()
  const whatsapp = normalizeWhatsAppUrl(profile?.whatsapp_url)
  const contact = email ? `mailto:${email}` : whatsapp || socials[0]?.href

  return (
    <main className={`min-h-screen ${styles.page}`}>
      <PortfolioHeader profile={profile} />
      <section className={styles.hero} aria-labelledby="about-title">
        <h1 className={styles.name} id="about-title" aria-label={name}>
          <span>{firstName}</span>
          {photos[0] && (
            <span className={styles.heroMedia} aria-hidden="true">
              <Image src={photos[0]} fill sizes="(max-width: 640px) 14vw, 202px" alt="" />
            </span>
          )}
          {surname.length > 0 && <span>{surname.join(' ')}</span>}
        </h1>
        <p className={styles.headline}>{replaceEmDashes(headline)}</p>
      </section>

      <div className={styles.story}>
        <AboutScrollLayout photos={photos} video={video} name={name}>
          <section className={styles.bio} aria-label="About me">
            {paragraphs.map((paragraph, index) => <p key={index} data-about-panel>{paragraph}</p>)}
          </section>
          <section className={styles.experience} aria-labelledby="experience-title">
            <h2 id="experience-title">Experience</h2>
            <ul>
              {experience.map(({ company, role, period }) => (
                <li key={company}>
                  <div>
                    <h3>{company}</h3>
                    {role && <p>{role}</p>}
                  </div>
                  <span>{period}</span>
                </li>
              ))}
            </ul>
          </section>
          {(socials.length > 0 || contact) && (
            <section className={styles.social} aria-label="Social and contact">
              {socials.length > 0 && (
                <>
                  <h2>Social</h2>
                  <ul>
                    {socials.map(({ label, href }) => (
                      <li key={label}><a href={href} target="_blank" rel="noreferrer">{label}</a></li>
                    ))}
                  </ul>
                </>
              )}
              {contact && (
                <a className={styles.contactLink} href={contact}>
                  <Image src="/images/about/contact-arrow.svg" width={36} height={31} alt="" />
                  Get in touch
                </a>
              )}
            </section>
          )}
        </AboutScrollLayout>
      </div>

      <footer className={styles.footer}>
        <p>© {new Date().getFullYear()} {name}</p>
        {(email || whatsapp) && (
          <div>
            <h2 className={styles.label}>[ Contact ]</h2>
            {email && <a href={`mailto:${email}`}>{email}</a>}
            {whatsapp && <a href={whatsapp} target="_blank" rel="noreferrer">WhatsApp</a>}
          </div>
        )}
      </footer>
    </main>
  )
}
