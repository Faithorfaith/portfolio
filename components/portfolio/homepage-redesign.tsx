'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { Profile, CaseStudy } from './profile-section'
import type { Project } from './projects-section'
import type { Work } from './works-gallery'
import HomepageGameTrain from './homepage-game-train'
import { normalizeExternalUrl } from '@/lib/content-utils'

type Props = { profile: Profile | null; caseStudies: CaseStudy[]; projects: Project[]; works: Work[] }
const isVideoUrl = (url?: string | null) => Boolean(url && (/\.(mp4|webm|mov)(\?|#|$)/i.test(url) || url.includes('/video/')))
const mediaFor = (work: Work) => work.thumbnail_url || work.media_url
const fallbackWorks: Work[] = Array.from({ length: 6 }, (_, index) => ({ id: `placeholder-work-${index}`, title: `Visual study ${index + 1}`, description: null, media_url: null, media_type: 'image', thumbnail_url: null, order_index: index, created_at: '2026-01-01', type: 'Experiment' }))
const fallbackStudies: CaseStudy[] = Array.from({ length: 6 }, (_, index) => ({ id: `placeholder-study-${index}`, slug: null, title: `Featured project ${index + 1}`, excerpt: 'Project media and details will appear here.', thumbnail_url: null, published: false, order_index: index, created_at: '2026-01-01' }))
const fallbackProjects: Project[] = Array.from({ length: 4 }, (_, index) => ({ id: `placeholder-project-${index}`, title: ['Custom QR generator', 'AuditSharp', 'Billr', 'Time Traveler'][index], year: '2026', type: index ? 'Web app' : 'Figma plugin', link: null, description: 'A compact independent project built to make a useful idea tangible.', created_at: '2026-01-01' }))

function useReveal() {
  useEffect(() => {
    const nodes = Array.from(document.querySelectorAll<HTMLElement>('[data-home-reveal], [data-featured-reveal]'))
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) { nodes.forEach(node => node.dataset.visible = 'true'); return }
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { (entry.target as HTMLElement).dataset.visible = 'true'; observer.unobserve(entry.target) } }), { threshold: .12, rootMargin: '0px 0px -8% 0px' })
    nodes.forEach(node => observer.observe(node))
    return () => observer.disconnect()
  }, [])
}

function useScrollTransitions() {
  useEffect(() => {
    const root = document.documentElement
    const hero = document.querySelector<HTMLElement>('.new-hero')
    const update = () => {
      const heroEnd = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight
      const start = Math.max(0, heroEnd - window.innerHeight * 0.82)
      const distance = Math.max(window.innerHeight * 0.95, heroEnd * 0.35)
      const progress = Math.max(0, Math.min(1, (window.scrollY - start) / distance))
      root.style.setProperty('--veil-progress', progress.toFixed(4))
      document.body.classList.toggle('home-nav-compact', window.scrollY > 32)
    }
    update()
    window.addEventListener('scroll', update, { passive: true })
    window.addEventListener('resize', update)
    return () => { window.removeEventListener('scroll', update); window.removeEventListener('resize', update); document.body.classList.remove('home-nav-compact') }
  }, [])
}

function VideoCard({ work, onOpen }: { work: Work; onOpen: (work: Work) => void }) {
  const video = isVideoUrl(work.media_url)
  return <button className="new-media-card" onClick={() => onOpen(work)} aria-label={`Open ${work.title}`}>
    {video ? <video src={work.media_url || undefined} poster={work.thumbnail_url || undefined} muted playsInline preload="metadata" onMouseEnter={event => void event.currentTarget.play()} onMouseLeave={event => { event.currentTarget.pause(); event.currentTarget.currentTime = 0 }} /> : mediaFor(work) ? <img src={mediaFor(work)!} alt={work.title} loading="lazy" /> : <span>{work.title}</span>}
  </button>
}

export default function HomepageRedesign({ profile, caseStudies, projects, works }: Props) {
  useReveal()
  useScrollTransitions()
  const [viewer, setViewer] = useState<Work | null>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => { if (viewer) dialog.current?.showModal(); else dialog.current?.close() }, [viewer])
  const visibleWorks = works.length ? works : fallbackWorks
  const visibleStudies = caseStudies.length ? caseStudies : fallbackStudies
  const visibleProjects = projects.length ? projects : fallbackProjects
  const videos = useMemo(() => visibleWorks.filter(work => isVideoUrl(work.media_url)), [visibleWorks])
  const beyond = videos.length ? videos : visibleWorks.slice(0, 6)
  const playground = visibleWorks.filter(work => !isVideoUrl(work.media_url)).slice(0, 8)
  const heroMedia = profile?.hero_image_1 || profile?.train_video_1 || null
  const intro = profile?.bio?.split('\n\n')[0] || 'A multidisciplinary designer focused primarily on Product Design, with experience across visual design, graphics, and video production.'
  const supporting = profile?.supporting_statement || 'Four years designing digital products across AI, fitness, SaaS, and marketplaces — turning complex challenges into intuitive experiences and ambitious ideas into products built for real-world impact.'

  return <main id="top" className="figma-home">
    <section className="new-hero" aria-labelledby="hero-title">
      <nav className="new-home-nav" aria-label="Homepage"><a href="#featured">works</a><a href="#top">{profile?.full_name || 'Faith Awokunle'}</a><a href={profile?.contact_email ? `mailto:${profile.contact_email}` : '#footer'}>contact</a></nav>
      <div className="new-hero-grid">
        <h1 id="hero-title" data-home-reveal>hey,<br />I&apos;m Faith</h1>
        <div className="new-hero-media" data-home-reveal>
          {heroMedia ? isVideoUrl(heroMedia) ? <video src={heroMedia} autoPlay loop muted playsInline /> : <img src={heroMedia} alt="Faith Awokunle" /> : <span aria-hidden="true" />}
        </div>
        <p data-home-reveal>{intro.toLowerCase()}</p>
      </div>
      <p className="new-experience" data-home-reveal>{supporting.toLowerCase()}</p>
    </section>

    <section id="featured" className="new-featured" data-featured-reveal>
      <div className="new-featured-copy" data-home-reveal><h2>featured projects</h2><p>A selection of projects where I&apos;ve tackled complex challenges, shaped ideas, and designed experiences that make a difference.</p></div>
      <div className="new-featured-grid">
        {visibleStudies.slice(0, 6).map((study, index) => <article key={study.id} className={`new-featured-card card-${index + 1} is-locked`} data-home-reveal aria-label={`${study.title}, locked case study`}>
          {study.thumbnail_url ? <img src={study.thumbnail_url} alt={study.title} loading={index < 2 ? 'eager' : 'lazy'} /> : <span />}
          <div><small>{String(index + 1).padStart(2, '0')}</small><strong>{study.title}</strong>{study.excerpt && <p>{study.excerpt}</p>}<span className="featured-lock" aria-hidden="true">🔒</span></div>
        </article>)}
      </div>
    </section>

    <section id="frames" className="new-white-section">
      <div className="new-section-intro" data-home-reveal><h2>beyond the frames</h2><p>i don&apos;t just design experiences, i bring ideas to life through video editing, storytelling, and visual direction — creating compelling visuals that capture attention and communicate ideas.</p></div>
      <div className="new-horizontal-gallery" aria-label="Video and visual work">
        {beyond.map(work => <VideoCard key={work.id} work={work} onOpen={setViewer} />)}
      </div>
    </section>

    <section id="archives" className="new-white-section new-archives">
      <div className="new-section-intro" data-home-reveal><h2>my archives</h2><p>A collection of tools, experiments, and side projects I&apos;ve brought to life — turning ideas into things people can actually use.</p></div>
      <div className="new-archive-scroll">
        {Object.entries(visibleProjects.slice(0, 6).reduce<Record<string, Project[]>>((groups, project) => {
          const year = project.year || String(new Date(project.created_at).getFullYear())
          ;(groups[year] ||= []).push(project)
          return groups
        }, {})).map(([year, group]) => <div className="new-archive-group" key={year}>
          <time className="archive-year">{year}</time>
          <div className="new-archive-group-cards">
          {group.map((project, index) => {
          const href = normalizeExternalUrl(project.link)
          const Card = href ? 'a' : 'article'
          return <Card key={project.id} {...(href ? { href, target: '_blank', rel: 'noopener noreferrer' } : {})} className="new-archive-card" data-home-reveal>
            <div className={`archive-art art-${index % 4}`}><span>{project.title.slice(0, 1)}</span></div>
            <small>{project.type || 'Independent project'}</small><h3>{project.title}</h3>{project.description && <p>{project.description}</p>}
          </Card>
          })}
          </div>
        </div>)}
      </div>
    </section>

    <section id="playground" className="new-white-section new-playground">
      <div className="new-section-intro" data-home-reveal><h2>playground</h2><p>Random ideas, creative experiments, and explorations that don&apos;t always need a reason to exist.</p></div>
      <div className="new-horizontal-gallery" aria-label="Playground gallery">
        {playground.map(work => <VideoCard key={work.id} work={work} onOpen={setViewer} />)}
        <Link href="/playground" className="new-gallery-more">View all<br />experiments →</Link>
      </div>
    </section>

    <HomepageGameTrain email={profile?.contact_email} />

    {viewer && <dialog ref={dialog} className="new-media-dialog" onCancel={() => setViewer(null)} onClick={event => event.target === event.currentTarget && setViewer(null)}>
      <div><button onClick={() => setViewer(null)} aria-label="Close media">×</button>{isVideoUrl(viewer.media_url) ? <video src={viewer.media_url || undefined} poster={viewer.thumbnail_url || undefined} controls autoPlay playsInline /> : mediaFor(viewer) && <img src={mediaFor(viewer)!} alt={viewer.title} />}</div>
    </dialog>}
  </main>
}
