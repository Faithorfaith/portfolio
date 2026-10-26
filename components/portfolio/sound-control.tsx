'use client'

import AppIcon from '@/components/icons/app-icon'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isSoundEnabled, playFeedback, SOUND_PREFERENCE_EVENT, SOUND_PREFERENCE_KEY } from '@/lib/interaction-feedback'

export default function SoundControl() {
  const pathname = usePathname()
  const [enabled, setEnabled] = useState(false)

  useEffect(() => setEnabled(isSoundEnabled()), [])
  if (pathname === '/' || pathname.startsWith('/admin') || pathname.startsWith('/auth')) return null

  const toggle = () => {
    const next = !enabled
    window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(next))
    setEnabled(next)
    window.dispatchEvent(new CustomEvent(SOUND_PREFERENCE_EVENT, { detail: { enabled: next } }))
    if (next) playFeedback('success')
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`fixed right-5 bottom-[calc(1.25rem+env(safe-area-inset-bottom))] z-[70] size-10 rounded-full flex items-center justify-center border shadow-sm transition-colors ${enabled ? 'bg-foreground text-background border-foreground' : 'bg-background/92 backdrop-blur-md text-foreground/50 border-foreground/12 hover:text-foreground hover:border-foreground/25'}`}
      aria-label={enabled ? 'Mute site sound' : 'Turn site sound on'}
      title={enabled ? 'Sound on' : 'Sound off'}
    >
      {enabled ? (
        <AppIcon name="Volume2" className="size-4" />
      ) : (
        <AppIcon name="VolumeX" className="size-4" />
      )}
    </button>
  )
}
