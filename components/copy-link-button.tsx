'use client'

import AppIcon from '@/components/icons/app-icon'
import { useEffect, useRef, useState } from 'react'
import { playFeedback } from '@/lib/interaction-feedback'

export default function CopyLinkButton({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false)
  const [failed, setFailed] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current) }, [])

  const copyLink = async () => {
    setFailed(false)
    let success = false
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
      success = true
    } catch {
      const input = document.createElement('textarea')
      input.value = url
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      try { success = document.execCommand('copy') } catch { success = false }
      finally { input.remove() }
    }
    if (!success) { setCopied(false); setFailed(true); return }
    playFeedback('success')
    setCopied(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className={`inline-flex shrink-0 items-center justify-center gap-2 min-h-11 min-w-[108px] px-3 rounded-full border border-foreground/12 text-xs text-foreground/65 hover:text-foreground hover:border-foreground/25 transition-colors ${className}`}
      aria-label="Copy page link"
    >
      {copied ? (
        <AppIcon name="Check" className="w-4 h-4" />
      ) : (
        <AppIcon name="Link" className="w-4 h-4" />
      )}
      <span aria-live="polite">{failed ? 'Try again' : copied ? 'Copied' : 'Copy link'}</span>
    </button>
  )
}
