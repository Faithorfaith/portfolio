'use client'

import { memo, useEffect, useState } from 'react'
import { isSoundEnabled, playFeedback, SOUND_PREFERENCE_KEY } from '@/lib/interaction-feedback'

interface NumberedNavProps {
  activeTab: 'home' | 'ui-shots' | 'writing'
  onTabChange: (tab: 'home' | 'ui-shots' | 'writing') => void
}

function NumberedNav({ activeTab, onTabChange }: NumberedNavProps) {
  const [soundEnabled, setSoundEnabled] = useState(false)

  useEffect(() => setSoundEnabled(isSoundEnabled()), [])

  const changeTab = (tab: NumberedNavProps['activeTab']) => {
    playFeedback('tap')
    onTabChange(tab)
  }

  const toggleSound = () => {
    const nextValue = !soundEnabled
    window.localStorage.setItem(SOUND_PREFERENCE_KEY, String(nextValue))
    setSoundEnabled(nextValue)
    if (nextValue) window.setTimeout(() => playFeedback('success'), 0)
  }

  const soundToggle = (
    <button
      type="button"
      onClick={toggleSound}
      className={`fixed right-5 md:right-7 bottom-20 md:bottom-7 z-[70] size-11 rounded-full flex items-center justify-center shadow-lg shadow-black/10 border transition-all ${soundEnabled ? 'bg-foreground text-background border-foreground' : 'bg-background text-foreground/55 border-foreground/12 hover:text-foreground hover:border-foreground/25'}`}
      aria-label={soundEnabled ? 'Turn interface sounds off' : 'Turn interface sounds on'}
      title={soundEnabled ? 'Sound on' : 'Sound off'}
    >
      {soundEnabled ? (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M18 6a8.5 8.5 0 0 1 0 12"/></svg>
      ) : (
        <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4V5Z"/><path d="m16 9 5 5m0-5-5 5"/></svg>
      )}
    </button>
  )

  return (
    <>
      {/* Desktop Navigation - Left Side, vertically centered */}
      <nav className="hidden md:flex fixed left-8 flex-col gap-7 z-50" style={{ top: '200px' }} aria-label="Portfolio sections">
        {(['home', 'ui-shots', 'writing'] as const).map((tab) => {
          const label = tab === 'home' ? 'Home' : tab === 'ui-shots' ? 'Playground' : 'Writing'
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => changeTab(tab)}
              className="relative text-sm font-normal text-left group active:translate-y-px"
              style={{
                color: isActive ? 'var(--foreground)' : undefined,
                transition: 'color 0.25s ease',
              }}
            >
              <span
                className="transition-colors duration-300"
                style={{ color: isActive ? 'var(--foreground)' : 'oklch(0.145 0 0 / 0.3)' }}
              >
                {label}
              </span>
              {/* Active dot indicator */}
              <span
                className="absolute -left-3 top-1/2 -translate-y-1/2 w-1 h-1 rounded-full bg-foreground transition-all duration-300"
                style={{ opacity: isActive ? 1 : 0, transform: `translateY(-50%) scale(${isActive ? 1 : 0})` }}
              />
            </button>
          )
        })}
      </nav>

      {/* Mobile Navigation - Bottom bar */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around bg-background/95 backdrop-blur-md border-t border-foreground/8 py-4 z-50 px-8" aria-label="Portfolio sections">
        {(['home', 'ui-shots', 'writing'] as const).map((tab) => {
          const label = tab === 'home' ? 'Home' : tab === 'ui-shots' ? 'Playground' : 'Writing'
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => changeTab(tab)}
              className="relative flex flex-col items-center gap-1"
            >
              <span
                className="text-xs font-normal transition-colors duration-300"
                style={{ color: isActive ? 'var(--foreground)' : 'oklch(0.145 0 0 / 0.3)' }}
              >
                {label}
              </span>
              {/* Active underline */}
              <span
                className="h-px rounded-full bg-foreground transition-all duration-300"
                style={{ width: isActive ? '100%' : '0%', opacity: isActive ? 1 : 0 }}
              />
            </button>
          )
        })}
      </nav>
      {soundToggle}
    </>
  )
}

export default memo(NumberedNav)
