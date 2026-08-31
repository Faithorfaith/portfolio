'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Project {
  id: string
  title: string
  year: string
  type: string | null
  link: string | null
  description: string | null
}

export default function ProjectsManager() {
  const [projects, setProjects] = useState<Project[]>([])
  const [formData, setFormData] = useState({
    title: '',
    year: String(new Date().getFullYear()),
    type: '',
    link: '',
    description: '',
  })
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('*')
        .order('year', { ascending: false })
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError
      setProjects(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch projects')
    }
  }

  const handleSave = async () => {
    if (!formData.title.trim()) {
      setError('Project title is required')
      return
    }

    setIsSaving(true)
    setError(null)
    setSuccess(false)

    try {
      const baseSlug = formData.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const slug = `${baseSlug}-${Date.now()}`

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          slug,
          year: formData.year,
          type: formData.type || null,
          link: formData.link || null,
          description: formData.description || null,
        }),
      })

      const result = await res.json()
      if (!res.ok) throw new Error(result.error || 'Failed to save')

      setSuccess(true)
      setFormData({ title: '', year: String(new Date().getFullYear()), type: '', link: '', description: '' })
      setTimeout(() => setSuccess(false), 3000)
      await fetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project')
    } finally {
      setIsSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this project?')) return

    try {
      const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to delete')
      }
      await fetchProjects()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete project')
    }
  }

  const inputCls = "w-full text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground/15 transition-shadow rounded-lg"
  const inputStyle = { padding: '8px 12px', border: '1px solid oklch(0.91 0 0)' }
  const labelCls = "block text-xs font-medium"
  const labelStyle = { color: 'var(--foreground)', opacity: 0.5 }

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="font-semibold text-foreground" style={{ fontSize: '16px', letterSpacing: '-0.02em' }}>Projects</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.45 }}>{projects.length} total</p>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'oklch(0.97 0.01 27)', border: '1px solid oklch(0.92 0.03 27)', color: 'oklch(0.5 0.18 27)' }}>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      {success && (
        <div className="flex items-center gap-2 p-3 rounded-lg text-sm" style={{ background: 'oklch(0.97 0.03 142)', border: '1px solid oklch(0.91 0.06 142)', color: 'oklch(0.45 0.15 142)' }}>
          <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Saved
        </div>
      )}

      {/* Add Project Form */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid oklch(0.91 0 0)', boxShadow: '0 1px 2px oklch(0 0 0 / 0.04)' }}>
        <div className="px-6 py-4 border-b" style={{ borderColor: 'oklch(0.93 0 0)', background: 'oklch(0.985 0 0)' }}>
          <p className="text-sm font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>Add Project</p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.45 }}>Appears in the Projects section of your portfolio</p>
        </div>
        <div className="px-6 py-5 space-y-4" style={{ background: 'oklch(1 0 0)' }}>
          <div className="space-y-1.5">
            <label className={labelCls} style={labelStyle}>Title <span style={{ color: 'oklch(0.6 0.2 27)', opacity: 1 }}>*</span></label>
            <input type="text" placeholder="Project name" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className={labelCls} style={labelStyle}>Year</label>
              <input type="text" placeholder="2026" value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <div className="space-y-1.5">
              <label className={labelCls} style={labelStyle}>Type</label>
              <input type="text" placeholder="e.g. Figma Plugin, Tool" value={formData.type} onChange={(e) => setFormData({ ...formData, type: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className={labelCls} style={labelStyle}>Link <span style={{ opacity: 0.5 }}>(optional)</span></label>
            <input type="url" placeholder="https://example.com" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className={inputCls} style={inputStyle} />
          </div>
          <div className="space-y-1.5">
            <label className={labelCls} style={labelStyle}>Description <span style={{ opacity: 0.5 }}>(optional)</span></label>
            <textarea placeholder="Brief description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={`${inputCls} resize-none`} style={inputStyle} rows={3} />
          </div>
          <div className="flex justify-end pt-1">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              style={{ padding: '7px 16px', background: 'var(--foreground)', fontSize: '12.5px', letterSpacing: '-0.01em' }}
            >
              {isSaving && <div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
              {isSaving ? 'Saving...' : 'Save Project'}
            </button>
          </div>
        </div>
      </div>

      {/* Projects List */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--foreground)', opacity: 0.3, letterSpacing: '0.07em' }}>All Projects</p>
        {projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 rounded-xl text-center" style={{ border: '2px dashed oklch(0.91 0 0)' }}>
            <svg className="w-7 h-7 mb-2" style={{ color: 'var(--foreground)', opacity: 0.2 }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
            <p className="text-sm" style={{ color: 'var(--foreground)', opacity: 0.35 }}>No projects yet</p>
          </div>
        ) : (
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid oklch(0.91 0 0)', boxShadow: '0 1px 2px oklch(0 0 0 / 0.03)' }}>
            {projects.map((project, idx) => (
              <div key={project.id} className="flex items-center gap-4 group transition-colors" style={{ padding: '13px 20px', background: 'oklch(1 0 0)', borderTop: idx > 0 ? '1px solid oklch(0.94 0 0)' : 'none' }}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium text-foreground truncate" style={{ letterSpacing: '-0.01em' }}>{project.title}</p>
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noopener noreferrer" className="shrink-0 transition-opacity" style={{ color: 'var(--foreground)', opacity: 0.25 }}>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                      </a>
                    )}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--foreground)', opacity: 0.4 }}>
                    {project.year}{project.type ? ` · ${project.type}` : ''}
                  </p>
                  {project.description && (
                    <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'var(--foreground)', opacity: 0.45 }}>{project.description}</p>
                  )}
                </div>
                <button
                  onClick={() => handleDelete(project.id)}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all"
                  style={{ border: '1px solid oklch(0.88 0.04 27)', background: 'oklch(0.98 0.01 27)', color: 'oklch(0.5 0.18 27)' }}
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
