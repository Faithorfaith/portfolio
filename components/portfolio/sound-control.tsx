'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isSoundEnabled, playFeedback, SOUND_PREFERENCE_KEY } from '@/lib/interaction-feedback'

export default function SoundControl() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => setEnabled(isSoundEnabled()), [])
  if (pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null

  const toggle = () => {
    const next = !enabled
    window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(next))
    setEnabled(next)
    if (next) playFeedback('success')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[70] size-10 rounded-full flex items-center justify-center border shadow-sm transition-colors ${enabled ? 'bg-foreground text-background border-foreground' : 'bg-background/92 backdrop-blur-md text-foreground/50 border-foreground/12 hover:text-foreground hover:border-foreground/25'}`}
      aria-label={enabled ? 'Turn interface sounds off' : 'Turn interface sounds on'}
      title={enabled ? 'Sound on' : 'Sound off'}
    >
      {enabled ? (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/></svg>
      ) : (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 5m0-5-5 5"/></svg>
      )}
    </button>
  )
}
