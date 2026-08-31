'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import FileUpload from './file-upload'

interface Profile {
  id: string
  username: string
  full_name: string | null
  bio: string | null
  hero_image_1: string | null
  hero_image_2: string | null
  hero_image_3: string | null
}

interface ProfileManagerProps {
  userId: string
}

function SectionCard({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid oklch(0.91 0 0)', background: 'oklch(1 0 0)', boxShadow: '0 1px 2px oklch(0 0 0 / 0.04)' }}>
      <div className="px-6 py-4 border-b" style={{ borderColor: 'oklch(0.93 0 0)', background: 'oklch(0.985 0 0)' }}>
        <p className="text-sm font-semibold text-foreground" style={{ letterSpacing: '-0.01em' }}>{title}</p>
        {description && <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.45 }}>{description}</p>}
      </div>
      <div className="px-6 py-5">{children}</div>
    </div>
  )
}

function ImageSlot({ label, url, onUpload, onRemove, userId, folder }: {
  label: string
  url: string
  onUpload: (url: string) => void
  onRemove: () => void
  userId: string
  folder: string
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-foreground/50 font-medium">{label}</p>
      {url ? (
        <div className="relative group w-full aspect-square rounded-xl overflow-hidden border border-border">
          <img src={url} alt={label} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <button
              onClick={onRemove}
              className="px-3 py-1.5 bg-white text-black text-xs font-medium rounded-lg"
            >
              Remove
            </button>
          </div>
        </div>
      ) : (
        <div className="w-full aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-foreground/30">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
          </svg>
          <p className="text-xs">Upload</p>
        </div>
      )}
      <FileUpload userId={userId} folder={folder} onUpload={onUpload} accept="image/*" />
    </div>
  )
}

export default function ProfileManager({ userId }: ProfileManagerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    full_name: '',
    bio: '',
    hero_image_1: '',
    hero_image_2: '',
    hero_image_3: '',
  })
  const supabase = createClient()

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single()

        if (fetchError && fetchError.code !== 'PGRST116') throw fetchError

        if (data) {
          setFormData({
            username: data.username || '',
            full_name: data.full_name || '',
            bio: data.bio || '',
            hero_image_1: data.hero_image_1 || '',
            hero_image_2: data.hero_image_2 || '',
            hero_image_3: data.hero_image_3 || '',
          })
        } else {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, username: 'User', full_name: null, bio: null, hero_image_1: null, hero_image_2: null, hero_image_3: null }])
            .select()
            .single()
          if (createError) throw createError
          if (newProfile) {
            setFormData({
              username: newProfile.username || '',
              full_name: newProfile.full_name || '',
              bio: newProfile.bio || '',
              hero_image_1: newProfile.hero_image_1 || '',
              hero_image_2: newProfile.hero_image_2 || '',
              hero_image_3: newProfile.hero_image_3 || '',
            })
          }
        }
      } catch (err) {
        setError('Failed to load profile')
      } finally {
        setIsLoading(false)
      }
    }
    if (userId) fetchProfile()
  }, [userId])

  const set = (key: string, value: string) => setFormData(prev => ({ ...prev, [key]: value }))

  const handleSave = async () => {
    if (!formData.username.trim()) { setError('Username is required'); return }
    setIsSaving(true); setError(null); setSuccess(false)
    try {
      const { error: upsertError } = await supabase.from('profiles').upsert({
        id: userId,
        username: formData.username,
        full_name: formData.full_name || null,
        bio: formData.bio || null,
        hero_image_1: formData.hero_image_1 || null,
        hero_image_2: formData.hero_image_2 || null,
        hero_image_3: formData.hero_image_3 || null,
      }).select().single()
      if (upsertError) throw new Error(upsertError.message)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-5">
      {/* Page Header */}
      <div className="flex items-center justify-between pb-1">
        <div>
          <h2 className="font-semibold text-foreground" style={{ fontSize: '16px', letterSpacing: '-0.02em' }}>Profile</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--foreground)', opacity: 0.45 }}>Your public identity and bio</p>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 text-background rounded-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          style={{ padding: '7px 14px', background: 'var(--foreground)', fontSize: '12.5px', letterSpacing: '-0.01em' }}
        >
          {isSaving && <div className="w-3 h-3 border-2 border-background/30 border-t-background rounded-full animate-spin" />}
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
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
          Saved successfully
        </div>
      )}

      {/* Identity */}
      <SectionCard title="Identity" description="Your name and username shown publicly">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: 'var(--foreground)', opacity: 0.5 }}>Full Name</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={e => set('full_name', e.target.value)}
              placeholder="Your name"
              className="w-full text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground/15 transition-shadow rounded-lg"
              style={{ padding: '8px 12px', border: '1px solid oklch(0.91 0 0)' }}
            />
          </div>
          <div className="space-y-1.5">
            <label className="block text-xs font-medium" style={{ color: 'var(--foreground)', opacity: 0.5 }}>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={e => set('username', e.target.value)}
              placeholder="username"
              className="w-full text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground/15 transition-shadow rounded-lg"
              style={{ padding: '8px 12px', border: '1px solid oklch(0.91 0 0)' }}
            />
          </div>
        </div>
      </SectionCard>

      {/* Bio */}
      <SectionCard title="Bio" description="Separate paragraphs with a blank line">
        <textarea
          value={formData.bio}
          onChange={e => set('bio', e.target.value)}
          placeholder={"Paragraph 1\n\nParagraph 2\n\nParagraph 3"}
          rows={6}
          className="w-full text-sm bg-background focus:outline-none focus:ring-2 focus:ring-foreground/15 transition-shadow resize-none font-mono rounded-lg"
          style={{ padding: '8px 12px', border: '1px solid oklch(0.91 0 0)' }}
        />
        {formData.bio && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <p className="text-xs text-foreground/40 uppercase tracking-wider font-medium">Preview</p>
            {formData.bio.split('\n\n').map((para, idx) => (
              <p key={idx} className="text-sm text-foreground/70 leading-relaxed">{para}</p>
            ))}
          </div>
        )}
      </SectionCard>

      {/* Hero Images */}
      <SectionCard title="Hero Images" description="Three images shown in the hero fan on your portfolio">
        <div className="grid grid-cols-3 gap-4">
          <ImageSlot label="Image 1" url={formData.hero_image_1} onUpload={url => set('hero_image_1', url)} onRemove={() => set('hero_image_1', '')} userId={userId} folder="hero-images" />
          <ImageSlot label="Image 2" url={formData.hero_image_2} onUpload={url => set('hero_image_2', url)} onRemove={() => set('hero_image_2', '')} userId={userId} folder="hero-images" />
          <ImageSlot label="Image 3" url={formData.hero_image_3} onUpload={url => set('hero_image_3', url)} onRemove={() => set('hero_image_3', '')} userId={userId} folder="hero-images" />
        </div>
      </SectionCard>
    </div>
  )
}
