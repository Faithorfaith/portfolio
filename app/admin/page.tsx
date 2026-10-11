'use client'

import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import AdminOverview from '@/components/admin/admin-overview'
import ProfileManager from '@/components/admin/profile-manager'
import ProjectsManager from '@/components/admin/projects-manager'
import WorksManager from '@/components/admin/works-manager'
import WritingsManager from '@/components/admin/writings-manager'
import CaseStudiesManager from '@/components/admin/case-studies-manager'
import WorkflowFilesManager from '@/components/admin/workflow-files-manager'

type Tab = 'overview' | 'profile' | 'case-studies' | 'projects' | 'works' | 'writing' | 'workflow-files'
type NavItem = { id: Tab; label: string; eyebrow: string; icon: ReactNode }

const icon = (path: string) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true"><path d={path} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', eyebrow: 'Start here', icon: icon('M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z') },
  { id: 'profile', label: 'Profile', eyebrow: 'Identity', icon: icon('M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm7 8a7 7 0 0 0-14 0') },
  { id: 'case-studies', label: 'Case studies', eyebrow: 'Featured work', icon: icon('M6 3h9l4 4v14H6zM15 3v5h4M9 13h7M9 17h7') },
  { id: 'works', label: 'Playground', eyebrow: 'Visual archive', icon: icon('M4 19V5h16v14H4Zm2-3 4-4 3 3 2-2 3 3M16 9h.01') },
  { id: 'projects', label: 'Archives', eyebrow: 'Built things', icon: icon('M4 7h16M6 4h12l2 3v13H4V7l2-3Zm2 7h8M8 15h5') },
  { id: 'writing', label: 'Writing', eyebrow: 'Editorial', icon: icon('M5 19h4L19 9l-4-4L5 15v4Zm8-12 4 4M5 15l4 4') },
  { id: 'workflow-files', label: 'Workflow files', eyebrow: 'Downloads', icon: icon('M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6') },
]

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [userId, setUserId] = useState<string | null>(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth')
        if (!response.ok) { router.push('/admin/login'); return }
        const data = await response.json()
        setUserId(data.userId)
        fetch('/api/admin/create-bucket', { method: 'POST' }).catch(() => undefined)
      } catch { router.push('/admin/login') }
      finally { setIsLoading(false) }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => { await fetch('/api/admin/logout', { method: 'POST' }); router.push('/') }
  const handleEditorOpenChange = useCallback((open: boolean) => setIsEditorOpen(open), [])
  const activeNav = NAV_ITEMS.find(item => item.id === activeTab) || NAV_ITEMS[0]

  if (isLoading) return <div className="admin-loading"><span /><p>Opening your studio</p></div>

  return <div className={`admin-surface admin-shell-v2 ${isEditorOpen ? 'has-editor' : ''}`}>
    <aside className="admin-sidebar-v2">
      <a href="/admin" className="admin-brand" onClick={event => { event.preventDefault(); setActiveTab('overview') }}><span>FA</span><div><strong>Faith’s Studio</strong><small>Portfolio editor</small></div></a>
      <nav aria-label="Admin navigation">
        {NAV_ITEMS.map(item => <button type="button" key={item.id} onClick={() => setActiveTab(item.id)} aria-current={activeTab === item.id ? 'page' : undefined}>
          <span className="admin-nav-icon">{item.icon}</span><span><small>{item.eyebrow}</small><strong>{item.label}</strong></span><i>↗</i>
        </button>)}
      </nav>
      <div className="admin-sidebar-footer"><a href="/" target="_blank" rel="noreferrer">View portfolio <span>↗</span></a><button type="button" onClick={handleLogout}>Sign out</button></div>
    </aside>

    <section className="admin-workspace-v2">
      {!isEditorOpen && <header className="admin-topbar-v2"><div><span>Content Studio</span><i>/</i><strong>{activeNav.label}</strong></div><div className="admin-live"><i />Synced</div></header>}
      <nav className="admin-mobile-nav-v2" aria-label="Admin sections">{NAV_ITEMS.map(item => <button type="button" key={item.id} onClick={() => setActiveTab(item.id)} className={activeTab === item.id ? 'is-active' : ''}>{item.label}</button>)}</nav>
      <main className="admin-content-v2">
        {userId ? <>
          {activeTab === 'overview' && <AdminOverview userId={userId} onOpen={setActiveTab} />}
          {activeTab === 'profile' && <ProfileManager userId={userId} />}
          {activeTab === 'projects' && <ProjectsManager />}
          {activeTab === 'works' && <WorksManager userId={userId} />}
          {activeTab === 'writing' && <WritingsManager onEditorOpenChange={handleEditorOpenChange} />}
          {activeTab === 'workflow-files' && <WorkflowFilesManager userId={userId} />}
          {activeTab === 'case-studies' && <CaseStudiesManager userId={userId} onEditorOpenChange={handleEditorOpenChange} />}
        </> : <p className="admin-empty">Initializing your workspace…</p>}
      </main>
    </section>
  </div>
}
