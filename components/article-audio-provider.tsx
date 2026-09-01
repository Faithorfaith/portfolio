'use client'

import { createContext, useContext, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTextToSpeech } from '@/hooks/use-text-to-speech'

interface ArticleAudioContextValue {
  isPlaying: boolean
  isPaused: boolean
  title: string
  playArticle: (title: string, text: string) => void
  pause: () => void
  resume: () => void
  stop: () => void
}

const ArticleAudioContext = createContext<ArticleAudioContextValue | null>(null)

export function ArticleAudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [title, setTitle] = useState('')
  const { isPlaying, isPaused, speak, pause, resume, stop: stopSpeech } = useTextToSpeech({ onEnd: () => setTitle('') })

  const playArticle = (articleTitle: string, text: string) => {
    setTitle(articleTitle)
    speak(text)
  }
  const stop = () => {
    stopSpeech()
    setTitle('')
  }

  return (
    <ArticleAudioContext.Provider value={{ isPlaying, isPaused, title, playArticle, pause, resume, stop }}>
      {children}
      {isPlaying && !pathname.startsWith('/writing/') && (
        <div className="fixed bottom-4 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-foreground/10 bg-background/95 px-3 py-2.5 shadow-lg shadow-black/8 backdrop-blur-xl">
          <button type="button" onClick={isPaused ? resume : pause} className="size-8 shrink-0 rounded-full bg-foreground text-background flex items-center justify-center" aria-label={isPaused ? 'Resume article' : 'Pause article'}>
            {isPaused ? <span className="ml-0.5 text-xs">▶</span> : <span className="text-xs">Ⅱ</span>}
          </button>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-foreground/40">Now reading</p>
            <p className="truncate text-xs font-medium text-foreground/75">{title}</p>
          </div>
          <button type="button" onClick={stop} className="size-8 shrink-0 rounded-full text-foreground/45 hover:bg-foreground/5 hover:text-foreground transition-colors" aria-label="Close audio player">×</button>
        </div>
      )}
    </ArticleAudioContext.Provider>
  )
}

export function useArticleAudio() {
  const context = useContext(ArticleAudioContext)
  if (!context) throw new Error('useArticleAudio must be used inside ArticleAudioProvider')
  return context
}
