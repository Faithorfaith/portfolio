'use client'

import { playFeedback } from '@/lib/interaction-feedback'

const links = [
  ['Work', 'work'],
  ['Projects', 'projects'],
  ['Writing', 'writing'],
  ['Playground', 'playground'],
] as const

export default function PortfolioHeader() {
  const goTo = (id: string) => {
    playFeedback('tap')
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    window.history.replaceState(null, '', `/#${id}`)
  }

  return (
    <header className="fixed top-0 inset-x-0 z-50 h-[52px] border-b border-foreground/[0.06] bg-background/92 backdrop-blur-xl">
      <div className="h-full max-w-2xl mx-auto px-5 sm:px-8 flex items-center justify-between gap-4">
        <button type="button" onClick={() => { window.scrollTo({ top: 0, behavior: 'smooth' }); window.history.replaceState(null, '', '/') }} className="min-h-10 text-xs font-medium text-foreground">Faith</button>
        <nav className="flex items-center gap-1 sm:gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Portfolio sections">
          {links.map(([label, id]) => (
            <button key={id} type="button" onClick={() => goTo(id)} className="min-h-10 px-1.5 text-[11px] whitespace-nowrap text-foreground/48 hover:text-foreground transition-colors">{label}</button>
          ))}
        </nav>
      </div>
    </header>
  )
}
