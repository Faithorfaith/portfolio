'use client'

import { useEffect, useRef, useState } from 'react'

/** Track the complete draft, including changes made by upload and toggle controls. */
export function useEditorGuard(draft: { id: string } | null) {
  const snapshot = draft ? JSON.stringify(draft) : null
  const baseline = useRef<string | null>(null)
  const [dirty, setDirty] = useState(false)
  useEffect(() => {
    if (snapshot === null) { baseline.current = null; setDirty(false); return }
    if (baseline.current === null) baseline.current = snapshot
    setDirty(snapshot !== baseline.current)
  }, [snapshot])

  useEffect(() => {
    if (!dirty) return
    const unload = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    const navigate = (event: MouseEvent) => {
      const target = event.target instanceof Element ? event.target : null
      const link = target?.closest('a[href]') as HTMLAnchorElement | null
      const sidebar = target?.closest('.admin-sidebar button')
      if (!sidebar && (!link || link.target === '_blank' || link.getAttribute('href')?.startsWith('#'))) return
      if (!window.confirm('Leave this editor and discard unsaved changes?')) { event.preventDefault(); event.stopImmediatePropagation() }
    }
    window.addEventListener('beforeunload', unload)
    document.addEventListener('click', navigate, true)
    return () => { window.removeEventListener('beforeunload', unload); document.removeEventListener('click', navigate, true) }
  }, [dirty])
  return dirty
}
