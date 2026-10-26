'use client'

import AppIcon from '@/components/icons/app-icon'
import { useCallback, useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import AdminOverview from '@/components/admin/admin-overview'
import ProfileManager from '@/components/admin/profile-manager'
import ProjectsManager from '@/components/admin/projects-manager'
import WorksManager from '@/components/admin/works-manager'
import WritingsManager from '@/components/admin/writings-manager'
import CaseStudiesManager from '@/components/admin/case-studies-manager'
import WorkflowFilesManager from '@/components/admin/workflow-files-manager'

type Tab = 'overview' | 'profile' | 'case-studies' | 'projects' | 'works' | 'beyond' | 'writing' | 'workflow-files'
type NavItem = { id: Tab; label: string; eyebrow: string; icon: ReactNode }

const NAV_ITEMS: NavItem[] = [
  { id: 'overview', label: 'Overview', eyebrow: 'Start here', icon: <AppIcon name="LayoutGrid" /> },
  { id: 'profile', label: 'Profile', eyebrow: 'Identity', icon: <AppIcon name="UserRound" /> },
  { id: 'case-studies', label: 'Case studies', eyebrow: 'Featured work', icon: <AppIcon name="FileText" /> },
  { id: 'works', label: 'Playground', eyebrow: 'Visual archive', icon: <AppIcon name="Images" /> },
  { id: 'beyond', label: 'Beyond the frames', eyebrow: 'Video work', icon: <AppIcon name="Video" /> },
  { id: 'projects', label: 'Archives', eyebrow: 'Built things', icon: <AppIcon name="Archive" /> },
  { id: 'writing', label: 'Writing', eyebrow: 'Editorial', icon: <AppIcon name="SquarePen" /> },
  { id: 'workflow-files', label: 'Workflow files', eyebrow: 'Downloads', icon: <AppIcon name="Download" /> },
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
      <label className="admin-sidebar-search"><span><AppIcon name="Search" /></span><input aria-label="Search admin" placeholder="Search" /></label>
      <nav aria-label="Admin navigation">
        {NAV_ITEMS.map(item => <button type="button" key={item.id} onClick={() => setActiveTab(item.id)} aria-current={activeTab === item.id ? 'page' : undefined}>
          <span className="admin-nav-icon">{item.icon}</span><span><small>{item.eyebrow}</small><strong>{item.label}</strong></span><i><AppIcon name="ArrowUpRight" /></i>
        </button>)}
      </nav>
      <div className="admin-sidebar-footer"><a href="/" target="_blank" rel="noreferrer">View portfolio <span><AppIcon name="ArrowUpRight" /></span></a><button type="button" onClick={handleLogout}>Sign out</button></div>
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
          {activeTab === 'beyond' && <WorksManager userId={userId} mode="beyond" />}
          {activeTab === 'writing' && <WritingsManager onEditorOpenChange={handleEditorOpenChange} />}
          {activeTab === 'workflow-files' && <WorkflowFilesManager userId={userId} />}
          {activeTab === 'case-studies' && <CaseStudiesManager userId={userId} onEditorOpenChange={handleEditorOpenChange} />}
        </> : <p className="admin-empty">Initializing your workspace…</p>}
      </main>
    </section>
  </div>
}
