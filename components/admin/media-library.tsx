'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { imageFocus } from '@/lib/image-focus'

export default function MediaLibrary({ value, onSelect }: { value: string | null; onSelect: (url: string) => void }) {
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState('')
  const [files, setFiles] = useState<{ name: string; id: string | null }[]>([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const focus = imageFocus(value || '')
  const browse = async (folder: string) => {
    setLoading(true); setError(''); setOpen(true); setPath(folder)
    const { data, error } = await createClient().storage.from('portfolio-uploads').list(folder, { limit: 100, sortBy: { column: 'name', order: 'asc' } })
    setFiles(data || []); setError(error?.message || ''); setLoading(false)
  }
  const choose = (name: string) => {
    const { data } = createClient().storage.from('portfolio-uploads').getPublicUrl([path, name].filter(Boolean).join('/'))
    onSelect(data.publicUrl); setOpen(false)
  }
  return <div className="space-y-3 text-xs">
    <button type="button" className="min-h-9 underline underline-offset-4" onClick={() => open ? setOpen(false) : browse('')}> {open ? 'Close media library' : 'Choose an existing image'}</button>
    {open && <div className="rounded-lg border border-border p-3 space-y-2">
      <div className="flex justify-between items-center"><span>{path || 'Uploads'}</span>{path && <button type="button" onClick={() => browse(path.split('/').slice(0, -1).join('/'))}>↑ Parent folder</button>}</div>
      {loading ? <p role="status">Loading…</p> : <div className="max-h-56 overflow-auto space-y-1">{files.filter((file) => !file.id || /\.(png|jpe?g|webp|gif|avif)$/i.test(file.name)).map((file) => <button type="button" key={file.name} className="block w-full text-left break-all min-h-9 px-2 rounded hover:bg-muted" onClick={() => file.id ? choose(file.name) : browse([path, file.name].filter(Boolean).join('/'))}>{file.id ? '▧' : '▸'} {file.name}</button>)}{!files.length && <p>No files in this folder.</p>}</div>}
      <p className="text-foreground/60">Showing up to 100 entries per folder.</p>
      {error && <p role="alert" className="text-red-600">{error}</p>}
    </div>}
    {value && <details><summary className="cursor-pointer py-2">Adjust cover focal point</summary>
      <div className="aspect-[4/3] overflow-hidden rounded bg-muted mb-3"><img src={focus.src} alt="Cover crop preview" className="w-full h-full object-cover" style={{ objectPosition: focus.position }} /></div>
      {(['x', 'y'] as const).map((axis) => <label key={axis} className="flex items-center gap-3 min-h-9">{axis === 'x' ? 'Horizontal' : 'Vertical'}<input aria-label={`${axis === 'x' ? 'Horizontal' : 'Vertical'} focal point`} type="range" min="0" max="100" value={focus[axis]} onChange={(event) => onSelect(`${focus.src}#focus=${axis === 'x' ? event.target.value : focus.x},${axis === 'y' ? event.target.value : focus.y}`)} className="flex-1 accent-current" /></label>)}
      <button type="button" onClick={() => onSelect(focus.src)} className="min-h-9 underline">Reset to center</button>
    </details>}
  </div>
}
