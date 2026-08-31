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
      className="text-xs text-foreground/30 hover:text-foreground transition-colors"
      aria-label={soundEnabled ? 'Turn interface sounds off' : 'Turn interface sounds on'}
      title={soundEnabled ? 'Sound on' : 'Sound off'}
    >
      {soundEnabled ? 'Sound on' : 'Sound off'}
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
              className="relative text-sm font-normal text-left group"
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
        <div className="pt-2">{soundToggle}</div>
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
        {soundToggle}
      </nav>
    </>
  )
}

export default memo(NumberedNav)
