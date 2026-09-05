'use client'

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
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="m5 12 4 4L19 6" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M10 13a5 5 0 007.07.07l2-2a5 5 0 00-7.07-7.07l-1.15 1.15M14 11a5 5 0 00-7.07-.07l-2 2A5 5 0 0012 20l1.15-1.15" />
        </svg>
      )}
      <span aria-live="polite">{failed ? 'Try again' : copied ? 'Copied' : 'Copy link'}</span>
    </button>
  )
}
