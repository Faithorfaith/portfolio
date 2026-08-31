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
  gallery_images: string[] | null
  bio_references: BioReference[] | null
  positioning_headline: string | null
  supporting_statement: string | null
  availability_status: string | null
  contact_email: string | null
  linkedin_url: string | null
  resume_url: string | null
  primary_cta_label: string | null
  testimonials: Testimonial[] | null
}

interface BioReference {
  id: string
  label: string
  description: string
  url: string
}

interface Testimonial { id: string; quote: string; name: string; role: string; company: string; url: string }

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
    gallery_images: [] as string[],
    bio_references: [] as BioReference[],
    positioning_headline: '',
    supporting_statement: '',
    availability_status: '',
    contact_email: '',
    linkedin_url: '',
    resume_url: '',
    primary_cta_label: 'Start a project',
    testimonials: [] as Testimonial[],
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
            gallery_images: data.gallery_images?.length
              ? data.gallery_images
              : [data.hero_image_1, data.hero_image_2, data.hero_image_3].filter(Boolean),
            bio_references: Array.isArray(data.bio_references) ? data.bio_references : [],
            positioning_headline: data.positioning_headline || '',
            supporting_statement: data.supporting_statement || '',
            availability_status: data.availability_status || '',
            contact_email: data.contact_email || '',
            linkedin_url: data.linkedin_url || '',
            resume_url: data.resume_url || '',
            primary_cta_label: data.primary_cta_label || 'Start a project',
            testimonials: Array.isArray(data.testimonials) ? data.testimonials : [],
          })
        } else {
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert([{ id: userId, username: 'User', full_name: null, bio: null, hero_image_1: null, hero_image_2: null, hero_image_3: null, gallery_images: [], bio_references: [] }])
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
              gallery_images: newProfile.gallery_images || [],
              bio_references: newProfile.bio_references || [],
              positioning_headline: newProfile.positioning_headline || '',
              supporting_statement: newProfile.supporting_statement || '',
              availability_status: newProfile.availability_status || '',
              contact_email: newProfile.contact_email || '',
              linkedin_url: newProfile.linkedin_url || '',
              resume_url: newProfile.resume_url || '',
              primary_cta_label: newProfile.primary_cta_label || 'Start a project',
              testimonials: newProfile.testimonials || [],
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
  const addGalleryImage = (url: string) => setFormData(prev => ({ ...prev, gallery_images: [...prev.gallery_images, url] }))
  const removeGalleryImage = (index: number) => setFormData(prev => ({ ...prev, gallery_images: prev.gallery_images.filter((_, itemIndex) => itemIndex !== index) }))
  const makeGalleryCover = (index: number) => setFormData(prev => {
    const gallery = [...prev.gallery_images]
    const [cover] = gallery.splice(index, 1)
    return { ...prev, gallery_images: [cover, ...gallery] }
  })

  const handleSave = async () => {
    if (!formData.username.trim()) { setError('Username is required'); return }
    setIsSaving(true); setError(null); setSuccess(false)
    try {
      const response = await fetch('/api/admin/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          full_name: formData.full_name || null,
          bio: formData.bio || null,
          gallery_images: formData.gallery_images,
          hero_image_1: formData.gallery_images[0] || null,
          bio_references: formData.bio_references,
          positioning_headline: formData.positioning_headline || null,
          supporting_statement: formData.supporting_statement || null,
          availability_status: formData.availability_status || null,
          contact_email: formData.contact_email || null,
          linkedin_url: formData.linkedin_url || null,
          resume_url: formData.resume_url || null,
          primary_cta_label: formData.primary_cta_label || 'Start a project',
          testimonials: formData.testimonials,
        }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Failed to save')
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

      <SectionCard title="Client positioning" description="Tell a prospective client what you do, who it is for, and whether you are available.">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="block">Positioning headline</label>
            <textarea value={formData.positioning_headline} onChange={e => set('positioning_headline', e.target.value)} rows={2} placeholder="Product designer helping early-stage teams turn complex products into clear experiences." className="w-full px-3 py-2 resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="block">Supporting statement</label>
            <textarea value={formData.supporting_statement} onChange={e => set('supporting_statement', e.target.value)} rows={2} placeholder="Focused on AI, fintech, developer tools, and infrastructure products." className="w-full px-3 py-2 resize-none" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="block">Availability</label><input value={formData.availability_status} onChange={e => set('availability_status', e.target.value)} placeholder="Available for selected projects · Q4 2026" className="w-full px-3 py-2" /></div>
            <div className="space-y-1.5"><label className="block">Primary button label</label><input value={formData.primary_cta_label} onChange={e => set('primary_cta_label', e.target.value)} placeholder="Start a project" className="w-full px-3 py-2" /></div>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5"><label className="block">Contact email</label><input type="email" value={formData.contact_email} onChange={e => set('contact_email', e.target.value)} placeholder="you@example.com" className="w-full px-3 py-2" /></div>
            <div className="space-y-1.5"><label className="block">LinkedIn URL</label><input type="url" value={formData.linkedin_url} onChange={e => set('linkedin_url', e.target.value)} placeholder="https://linkedin.com/in/..." className="w-full px-3 py-2" /></div>
          </div>
          <div className="space-y-1.5"><label className="block">Résumé URL</label><input type="url" value={formData.resume_url} onChange={e => set('resume_url', e.target.value)} placeholder="https://..." className="w-full px-3 py-2" /></div>
        </div>
      </SectionCard>

      <SectionCard title="Client proof" description="Add up to four concise, genuine testimonials.">
        <div className="space-y-3">
          {formData.testimonials.map((item, index) => (
            <div key={item.id} className="rounded-lg border border-border p-3 space-y-2">
              <textarea value={item.quote} onChange={e => setFormData(current => ({ ...current, testimonials: current.testimonials.map((entry, i) => i === index ? { ...entry, quote: e.target.value } : entry) }))} rows={3} placeholder="Short testimonial" className="w-full px-3 py-2 resize-none" />
              <div className="grid sm:grid-cols-3 gap-2">
                {(['name', 'role', 'company'] as const).map(field => <input key={field} value={item[field]} onChange={e => setFormData(current => ({ ...current, testimonials: current.testimonials.map((entry, i) => i === index ? { ...entry, [field]: e.target.value } : entry) }))} placeholder={field[0].toUpperCase() + field.slice(1)} className="w-full px-3 py-2" />)}
              </div>
              <input type="url" value={item.url} onChange={e => setFormData(current => ({ ...current, testimonials: current.testimonials.map((entry, i) => i === index ? { ...entry, url: e.target.value } : entry) }))} placeholder="Optional profile URL" className="w-full px-3 py-2" />
              <button type="button" onClick={() => setFormData(current => ({ ...current, testimonials: current.testimonials.filter((_, i) => i !== index) }))} className="text-xs text-red-600">Remove</button>
            </div>
          ))}
          {formData.testimonials.length < 4 && <button type="button" onClick={() => setFormData(current => ({ ...current, testimonials: [...current.testimonials, { id: crypto.randomUUID(), quote: '', name: '', role: '', company: '', url: '' }] }))} className="w-full py-2 text-xs font-medium border border-dashed border-border rounded-lg hover:border-foreground/30 transition-colors">+ Add testimonial</button>}
        </div>
      </SectionCard>

      <SectionCard title="Bio references" description="Add companies, roles, tools or tags with a short explanation.">
        <div className="space-y-3">
          {formData.bio_references.map((reference, index) => (
            <div key={reference.id} className="rounded-lg border border-border p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={reference.label}
                  onChange={(event) => setFormData((current) => ({ ...current, bio_references: current.bio_references.map((item, itemIndex) => itemIndex === index ? { ...item, label: event.target.value } : item) }))}
                  placeholder="Company or tag"
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
                />
                <input
                  type="url"
                  value={reference.url}
                  onChange={(event) => setFormData((current) => ({ ...current, bio_references: current.bio_references.map((item, itemIndex) => itemIndex === index ? { ...item, url: event.target.value } : item) }))}
                  placeholder="Optional URL"
                  className="px-3 py-2 text-sm border border-border rounded-lg bg-background"
                />
              </div>
              <textarea
                value={reference.description}
                onChange={(event) => setFormData((current) => ({ ...current, bio_references: current.bio_references.map((item, itemIndex) => itemIndex === index ? { ...item, description: event.target.value } : item) }))}
                placeholder="Short description"
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg bg-background resize-none"
              />
              <button type="button" onClick={() => setFormData((current) => ({ ...current, bio_references: current.bio_references.filter((_, itemIndex) => itemIndex !== index) }))} className="text-xs text-red-600">Remove</button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => setFormData((current) => ({ ...current, bio_references: [...current.bio_references, { id: crypto.randomUUID(), label: '', description: '', url: '' }] }))}
            className="w-full py-2 text-xs font-medium border border-dashed border-border rounded-lg hover:border-foreground/30 transition-colors"
          >
            + Add reference
          </button>
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

      <SectionCard title="Photo Gallery" description="The first image is the homepage cover. Add as many images as you like.">
        {formData.gallery_images.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-5">
            {formData.gallery_images.map((url, index) => (
              <div key={`${url}-${index}`} className="space-y-2">
                <div className="relative aspect-square rounded-xl overflow-hidden border border-border">
                  <img src={url} alt={`Gallery image ${index + 1}`} className="w-full h-full object-cover" />
                  {index === 0 && <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-1 rounded-full">Cover</span>}
                </div>
                <div className="flex gap-2">
                  {index > 0 && <button type="button" onClick={() => makeGalleryCover(index)} className="flex-1 text-[11px] border border-border rounded-md py-1.5">Make cover</button>}
                  <button type="button" onClick={() => removeGalleryImage(index)} className="flex-1 text-[11px] border border-border rounded-md py-1.5 text-red-600">Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
        <FileUpload userId={userId} folder="profile-gallery" onUpload={addGalleryImage} accept="image/*" />
      </SectionCard>
    </div>
  )
}
