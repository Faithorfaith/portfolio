'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type Draft = { id: string; title: string }
type Revision<T> = { at: string; draft: T }

export default function DraftTools<T extends Draft>({ kind, draft, onRestore }: {
  kind: string; draft: T; onRestore: (draft: T) => void
}) {
  const [key, setKey] = useState<string | null>(null)
  const [recovery, setRecovery] = useState<T | null>(null)
  const [history, setHistory] = useState<Revision<T>[]>([])
  const [message, setMessage] = useState('Preparing draft recovery…')
  const [checking, setChecking] = useState(false)
  const [issues, setIssues] = useState<string[]>([])
  const [historyOpen, setHistoryOpen] = useState(false)
  const [cloudHistory, setCloudHistory] = useState<Revision<T>[]>([])
  const [cloudMessage, setCloudMessage] = useState('')
  const [compare, setCompare] = useState<T | null>(null)
  const initial = useRef(draft)
  const current = useRef(draft)
  current.current = draft

  useEffect(() => {
    let cancelled = false
    createClient().auth.getUser().then(async ({ data }) => {
      if (cancelled || !data.user) { if (!cancelled) setMessage('Sign in to enable local recovery'); return }
      const storageKey = `portfolio-draft:${data.user.id}:${kind}:${initial.current.id || 'new'}`
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || 'null')
        if (saved?.draft && JSON.stringify(saved.draft) !== JSON.stringify(initial.current)) setRecovery(saved.draft)
        const revisions = JSON.parse(localStorage.getItem(`${storageKey}:history`) || '[]')
        setHistory(Array.isArray(revisions) ? revisions.slice(0, 20) : [])
        setKey(storageKey)
        setMessage('Recovery ready · this browser only')
        if (initial.current.id) {
          const { data: rows, error } = await createClient().from('content_revisions').select('draft, created_at').eq('kind', kind).eq('entity_id', initial.current.id).order('created_at', { ascending: false }).limit(50)
          if (cancelled) return
          if (error) setCloudMessage('Cloud history unavailable. Run migration 09 to enable it; local recovery still works.')
          else { setCloudHistory((rows || []).map((row) => ({ at: row.created_at, draft: row.draft as T }))); setCloudMessage('Cloud history · latest 50 saved versions') }
        }
      } catch { setMessage('Local recovery is unavailable in this browser') }
    })
    return () => { cancelled = true }
  }, [kind])

  useEffect(() => {
    if (!key || recovery) return
    const persist = () => {
      try {
        localStorage.setItem(key, JSON.stringify({ at: new Date().toISOString(), draft: current.current }))
        setMessage('Draft backed up · this browser only')
      } catch { setMessage('Could not back up draft; browser storage may be full') }
    }
    const timer = setTimeout(persist, 700)
    window.addEventListener('pagehide', persist)
    return () => { clearTimeout(timer); window.removeEventListener('pagehide', persist) }
  }, [draft, key, recovery])

  const checkpoint = () => {
    if (!key) return
    const next = [{ at: new Date().toISOString(), draft }, ...history].slice(0, 20)
    try { localStorage.setItem(`${key}:history`, JSON.stringify(next)); setHistory(next); setMessage('Revision saved · this browser only') }
    catch { setMessage('Could not save revision; browser storage may be full') }
  }

  const restore = (version: T) => {
    checkpoint()
    const restored = { ...version, id: draft.id } as T & Record<string, unknown>
    for (const field of ['content', 'sections', 'nav_items']) {
      if (typeof restored[field] === 'string') {
        try { (restored as Record<string, unknown>)[field] = JSON.parse(restored[field] as string) }
        catch { setMessage('This revision has invalid content and cannot be restored'); return }
      }
    }
    onRestore(restored); setRecovery(null); setCompare(null); setMessage('Revision restored as an unsaved draft. Save to publish it.')
  }

  const check = async () => {
    setChecking(true)
    const found: string[] = []
    const urls = new Set<string>()
    const inspect = (value: unknown, name = '') => {
      if (typeof value === 'string') {
        if (/url|link|image|cover|thumbnail/.test(name) && value.trim()) urls.add(value.trim())
        if (value.includes('<')) {
          const doc = new DOMParser().parseFromString(value, 'text/html')
          doc.querySelectorAll('a').forEach((link) => { const href = link.getAttribute('href'); if (!href) found.push('A text link has no destination'); else urls.add(href) })
          doc.querySelectorAll('img').forEach((image) => { const src = image.getAttribute('src'); if (!src) found.push('An embedded image has no source'); else urls.add(src) })
        }
      } else if (Array.isArray(value)) value.forEach((item) => inspect(item, name))
      else if (value && typeof value === 'object') Object.entries(value).forEach(([field, item]) => inspect(item, field))
    }
    if (!draft.title.trim()) found.push('Add a title')
    const mediaDraft = draft as T & { cover_image?: string; thumbnail_url?: string }
    if (!mediaDraft.cover_image && !mediaDraft.thumbnail_url) found.push('Add a cover image')
    inspect(draft)
    // Inspect in the browser: no server fetch of arbitrary/private addresses.
    for (const value of urls) {
      if (/^(mailto:|tel:|#)/i.test(value)) continue
      let url: URL
      try { url = new URL(value, window.location.origin) } catch { found.push(`Invalid URL: ${value}`); continue }
      if (!['http:', 'https:'].includes(url.protocol)) { found.push(`Unsupported URL: ${value}`); continue }
      if (!/^https?:\/\//i.test(value) && !value.startsWith('/')) { found.push(`Add https:// to ${value}`); continue }
      try {
        const response = await fetch(url.href, { method: 'HEAD', credentials: 'omit', signal: AbortSignal.timeout(4000) })
        if (!response.ok) found.push(`${response.status === 405 ? 'Manual check required' : `Returned ${response.status}`}: ${value}`)
      } catch { found.push(`Could not verify (may block browser checks): ${value}`) }
    }
    setIssues([...new Set(found)])
    setChecking(false)
    setMessage(found.length ? 'Review the checks below before publishing' : 'Checks passed for the URLs inspected')
  }

  return <section className="rounded-lg border border-border p-3 space-y-3 text-xs" aria-label="Draft tools">
    <div className="flex flex-wrap items-center gap-2">
      <p role="status" className="flex-1 min-w-40 text-foreground/65">{message}</p>
      <button type="button" onClick={checkpoint} disabled={!key} className="px-2 min-h-9 hover:bg-muted rounded">Save revision</button>
      <button type="button" onClick={() => setHistoryOpen(!historyOpen)} aria-expanded={historyOpen} className="px-2 min-h-9 hover:bg-muted rounded">History ({history.length})</button>
      <button type="button" onClick={check} disabled={checking} className="px-2 min-h-9 hover:bg-muted rounded">{checking ? 'Checking…' : 'Check before publishing'}</button>
    </div>
    {recovery && <div className="flex flex-wrap items-center gap-3 p-3 bg-muted rounded">
      <span>A different local draft is available.</span>
      <button type="button" onClick={() => { onRestore(recovery); setRecovery(null) }} className="underline">Recover draft</button>
      <button type="button" onClick={() => setRecovery(null)} className="underline">Keep current version</button>
    </div>}
    {historyOpen && <div className="space-y-2 max-h-48 overflow-auto">
      <p className="text-foreground/60">{cloudMessage}</p>
      {cloudHistory.map((revision, index) => <div key={`cloud-${index}`} className="flex gap-3 items-center"><span className="flex-1">{new Date(revision.at).toLocaleString()}</span><button type="button" onClick={() => setCompare(revision.draft)}>Compare</button><button type="button" onClick={() => restore(revision.draft)}>Restore</button></div>)}
      <p className="text-foreground/60">Up to 20 manually saved revisions, stored in this browser.</p>
      {history.map((revision, index) => <button type="button" key={`${revision.at}-${index}`} className="block w-full text-left p-2 rounded hover:bg-muted" onClick={() => { checkpoint(); onRestore(revision.draft); setRecovery(null); setMessage('Revision restored as an unsaved draft') }}>{revision.draft.title || 'Untitled'} · {new Date(revision.at).toLocaleString()} · Restore</button>)}
    </div>}
    {compare && <div className="rounded border p-3 space-y-2"><p className="font-medium">Changes from selected revision to current draft</p>{Object.keys(draft).filter((field) => !['id', 'user_id', 'created_at', 'updated_at'].includes(field) && JSON.stringify((draft as Record<string, unknown>)[field]) !== JSON.stringify((compare as Record<string, unknown>)[field])).map((field) => <details key={field}><summary className="cursor-pointer py-1">{field.replaceAll('_', ' ')} changed</summary><div className="grid sm:grid-cols-2 gap-3"><pre className="whitespace-pre-wrap break-all max-h-48 overflow-auto">Before: {JSON.stringify((compare as Record<string, unknown>)[field], null, 2)}</pre><pre className="whitespace-pre-wrap break-all max-h-48 overflow-auto">Current: {JSON.stringify((draft as Record<string, unknown>)[field], null, 2)}</pre></div></details>)}<button type="button" onClick={() => setCompare(null)} className="underline">Close comparison</button></div>}
    {issues.length > 0 && <ul className="list-disc pl-5 space-y-1 break-words text-amber-700">{issues.map((issue) => <li key={issue}>{issue}</li>)}</ul>}
  </section>
}
