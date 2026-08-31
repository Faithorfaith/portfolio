'use client'

import { useState } from 'react'

export default function CopyLinkButton({ className = '' }: { className?: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const input = document.createElement('textarea')
      input.value = url
      input.style.position = 'fixed'
      input.style.opacity = '0'
      document.body.appendChild(input)
      input.select()
      document.execCommand('copy')
      input.remove()
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <button
      type="button"
      onClick={copyLink}
      className={`inline-flex items-center gap-2 h-9 px-3 rounded-full border border-border text-xs text-foreground/60 hover:text-foreground hover:bg-foreground/5 transition-colors ${className}`}
      aria-label="Copy page link"
    >
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.7} d="M10 13a5 5 0 007.07.07l2-2a5 5 0 00-7.07-7.07l-1.15 1.15M14 11a5 5 0 00-7.07-.07l-2 2A5 5 0 0012 20l1.15-1.15" />
      </svg>
      <span aria-live="polite">{copied ? 'Copied' : 'Copy link'}</span>
    </button>
  )
}
