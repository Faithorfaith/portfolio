'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ProfileManager from '@/components/admin/profile-manager'
import ProjectsManager from '@/components/admin/projects-manager'
import WorksManager from '@/components/admin/works-manager'
import WritingsManager from '@/components/admin/writings-manager'
import CaseStudiesManager from '@/components/admin/case-studies-manager'

type Tab = 'profile' | 'projects' | 'works' | 'writing' | 'case-studies'

const NAV_ITEMS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: 'profile',
    label: 'Profile',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    id: 'case-studies',
    label: 'Case Studies',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
  },
  {
    id: 'projects',
    label: 'Projects',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
      </svg>
    ),
  },
  {
    id: 'works',
    label: 'Playground',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    id: 'writing',
    label: 'Writing',
    icon: (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
      </svg>
    ),
  },
]

export default function AdminPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('profile')
  const [userId, setUserId] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/admin/check-auth')
        if (!response.ok) {
          router.push('/admin/login')
          return
        }
        const data = await response.json()
        setUserId(data.userId)
        try {
          await fetch('/api/admin/create-bucket', { method: 'POST' })
        } catch (bucketError) {
          console.warn('[v0] Bucket initialization warning:', bucketError)
        }
      } catch (error) {
        router.push('/admin/login')
      } finally {
        setIsLoading(false)
      }
    }
    checkAuth()
  }, [router])

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/')
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', background: 'oklch(0.985 0 0)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
          <div className="w-5 h-5 border-2 border-foreground/15 border-t-foreground rounded-full animate-spin" />
          <p style={{ fontSize: '12px', color: 'var(--foreground)', opacity: 0.35, letterSpacing: '-0.01em' }}>Loading workspace</p>
        </div>
      </div>
    )
  }

  const activeNav = NAV_ITEMS.find(n => n.id === activeTab)

  return (
    <div className="admin-surface admin-shell" style={{ display: 'flex', width: '100%', height: '100%', background: 'oklch(0.985 0 0)' }}>
      {/* Sidebar */}
      <aside className="admin-sidebar" style={{ width: '216px', minWidth: '216px', display: 'flex', flexDirection: 'column', borderRight: '1px solid oklch(0.91 0 0)', background: 'oklch(0.985 0 0)', overflow: 'hidden' }}>
        {/* Brand */}
        <div style={{ padding: '22px 18px 18px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'var(--foreground)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="13" height="13" fill="none" stroke="var(--background)" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--foreground)', lineHeight: 1, letterSpacing: '-0.02em' }}>Studio</p>
              <p style={{ fontSize: '10.5px', color: 'var(--foreground)', opacity: 0.35, marginTop: '3px', letterSpacing: '0' }}>Content Manager</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '4px 10px 8px', overflowY: 'auto' }}>
          <p style={{ fontSize: '9.5px', textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--foreground)', opacity: 0.3, fontWeight: 600, padding: '0 8px', marginBottom: '6px' }}>Content</p>
          {NAV_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '9px',
                padding: '7px 10px',
                borderRadius: '7px',
                fontSize: '13px',
                fontWeight: activeTab === item.id ? 500 : 400,
                background: activeTab === item.id ? 'oklch(0.145 0 0)' : 'transparent',
                color: activeTab === item.id ? 'oklch(1 0 0)' : 'var(--foreground)',
                opacity: activeTab === item.id ? 1 : 0.5,
                border: 'none',
                cursor: 'pointer',
                textAlign: 'left',
                marginBottom: '1px',
                transition: 'all 0.12s ease',
                whiteSpace: 'nowrap',
                letterSpacing: '-0.01em',
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', flexShrink: 0, opacity: activeTab === item.id ? 0.8 : 1 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* Footer */}
        <div style={{ padding: '8px 10px 18px', borderTop: '1px solid oklch(0.91 0 0)', flexShrink: 0 }}>
          <a
            href="/"
            target="_blank"
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 10px', borderRadius: '7px', fontSize: '13px', color: 'var(--foreground)', opacity: 0.4, textDecoration: 'none', marginBottom: '1px', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}
          >
            <svg style={{ flexShrink: 0 }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            <span>View Portfolio</span>
          </a>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 10px', borderRadius: '7px', fontSize: '13px', color: 'var(--foreground)', opacity: 0.4, background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}
          >
            <svg style={{ flexShrink: 0 }} width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Area */}
      <div className="admin-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowY: 'auto', background: 'oklch(1 0 0)' }}>
        {/* Top Bar */}
        <header style={{ height: '50px', flexShrink: 0, borderBottom: '1px solid oklch(0.93 0 0)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', background: 'oklch(1 0 0)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: 'var(--foreground)' }}>
            <span style={{ opacity: 0.35 }}>Workspace</span>
            <span style={{ opacity: 0.2 }}>/</span>
            <span style={{ fontWeight: 500, opacity: 0.8, letterSpacing: '-0.01em' }}>{activeNav?.label}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
            <span style={{ fontSize: '11px', color: 'var(--foreground)', opacity: 0.3, letterSpacing: '0' }}>Live</span>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content" style={{ flex: 1, padding: '36px 40px' }}>
          {userId ? (
            <>
              {activeTab === 'profile' && <ProfileManager userId={userId} />}
              {activeTab === 'projects' && <ProjectsManager />}
              {activeTab === 'works' && <WorksManager userId={userId} />}
              {activeTab === 'writing' && <WritingsManager />}
              {activeTab === 'case-studies' && <CaseStudiesManager userId={userId} />}
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-foreground/40 text-sm">Initializing...</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
