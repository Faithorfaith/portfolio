'use client'

import { memo } from 'react'

interface NumberedNavProps {
  activeTab: 'home' | 'ui-shots' | 'writing'
  onTabChange: (tab: 'home' | 'ui-shots' | 'writing') => void
}

function NumberedNav({ activeTab, onTabChange }: NumberedNavProps) {
  return (
    <>
      {/* Desktop Navigation - Left Side, vertically centered */}
      <nav className="hidden md:flex fixed left-8 flex-col gap-10 z-50" style={{ top: '200px' }}>
        {(['home', 'ui-shots', 'writing'] as const).map((tab) => {
          const label = tab === 'home' ? 'HOME' : tab === 'ui-shots' ? 'PLAYGROUND' : 'WRITING'
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="relative text-sm tracking-widest font-medium text-left group"
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
      <nav className="fixed bottom-0 left-0 right-0 md:hidden flex items-center justify-around bg-background border-t border-foreground/10 py-4 z-50 px-8">
        {(['home', 'ui-shots', 'writing'] as const).map((tab) => {
          const label = tab === 'home' ? 'HOME' : tab === 'ui-shots' ? 'PLAYGROUND' : 'WRITING'
          const isActive = activeTab === tab
          return (
            <button
              key={tab}
              onClick={() => onTabChange(tab)}
              className="relative flex flex-col items-center gap-1"
            >
              <span
                className="text-xs tracking-widest font-medium transition-colors duration-300"
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
    </>
  )
}

export default memo(NumberedNav)
