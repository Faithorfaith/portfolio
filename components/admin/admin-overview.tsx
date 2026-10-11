'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Destination = 'profile' | 'case-studies' | 'projects' | 'works' | 'writing' | 'workflow-files'
type Counts = Record<Destination, number>

const initialCounts: Counts = { profile: 0, 'case-studies': 0, projects: 0, works: 0, writing: 0, 'workflow-files': 0 }
const cards: { id: Destination; label: string; eyebrow: string; description: string }[] = [
  { id: 'case-studies', label: 'Case studies', eyebrow: 'Featured work', description: 'Build the long-form stories shown in the black portfolio section.' },
  { id: 'works', label: 'Playground', eyebrow: 'Beyond the frames', description: 'Upload visual experiments, motion work, and gallery pieces.' },
  { id: 'projects', label: 'Archives', eyebrow: 'Things you built', description: 'Maintain the compact tools and side-project directory.' },
  { id: 'writing', label: 'Writing', eyebrow: 'Notes from your desk', description: 'Write, style, narrate, and publish editorial pieces.' },
  { id: 'workflow-files', label: 'Workflow files', eyebrow: 'Downloads', description: 'Version and publish the files visitors can take with them.' },
  { id: 'profile', label: 'Profile & train', eyebrow: 'Homepage identity', description: 'Edit your introduction, gallery, contact details, and train media.' },
]

export default function AdminOverview({ userId, onOpen }: { userId: string; onOpen: (destination: Destination) => void }) {
  const [counts, setCounts] = useState(initialCounts)
  const [recent, setRecent] = useState<{ title: string; published: boolean; created_at: string }[]>([])

  useEffect(() => {
    const load = async () => {
      const supabase = createClient()
      const [profile, caseStudies, projects, works, writings, workflows, latest] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('id', userId),
        supabase.from('case_studies').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('portfolio_works').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('writings').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('workflow_files').select('id', { count: 'exact', head: true }).eq('user_id', userId),
        supabase.from('case_studies').select('title, published, created_at').eq('user_id', userId).order('updated_at', { ascending: false }).limit(4),
      ])
      setCounts({ profile: profile.count || 0, 'case-studies': caseStudies.count || 0, projects: projects.count || 0, works: works.count || 0, writing: writings.count || 0, 'workflow-files': workflows.count || 0 })
      setRecent((latest.data || []) as { title: string; published: boolean; created_at: string }[])
    }
    load()
  }, [userId])

  const total = counts['case-studies'] + counts.projects + counts.works + counts.writing + counts['workflow-files']
  return <div className="admin-overview">
    <header className="admin-overview-hero">
      <p>Portfolio control room</p>
      <h1>Everything that makes<br />your corner of the internet.</h1>
      <span>{total} saved pieces across the portfolio.</span>
    </header>
    <div className="admin-overview-grid">
      {cards.map(card => <button type="button" key={card.id} onClick={() => onOpen(card.id)} className="admin-overview-card">
        <span>{card.eyebrow}</span><strong>{card.label}</strong><p>{card.description}</p><small>{counts[card.id]} item{counts[card.id] === 1 ? '' : 's'} <i>→</i></small>
      </button>)}
    </div>
    <section className="admin-recent">
      <div><p>Recently edited</p><span>Case studies</span></div>
      {recent.length ? recent.map(item => <button type="button" key={`${item.title}-${item.created_at}`} onClick={() => onOpen('case-studies')}><span>{item.title}</span><small>{item.published ? 'Live' : 'Draft'}</small></button>) : <p className="admin-empty">Your latest case studies will appear here.</p>}
    </section>
  </div>
}
