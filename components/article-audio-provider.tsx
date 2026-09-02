'use client'

import { createContext, useContext, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useTextToSpeech } from '@/hooks/use-text-to-speech'

interface ArticleAudioContextValue {
  isPlaying: boolean
  isPaused: boolean
  title: string
  playArticle: (title: string, text: string, audioUrl?: string | null, coverImage?: string | null) => void
  pause: () => void
  resume: () => void
  stop: () => void
}

const ArticleAudioContext = createContext<ArticleAudioContextValue | null>(null)

export function ArticleAudioProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [title, setTitle] = useState('')
  const [coverImage, setCoverImage] = useState<string | null>(null)
  const [usesGeneratedAudio, setUsesGeneratedAudio] = useState(false)
  const [generatedPlaying, setGeneratedPlaying] = useState(false)
  const [generatedPaused, setGeneratedPaused] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const speech = useTextToSpeech({ onEnd: () => setTitle('') })

  const isPlaying = usesGeneratedAudio ? generatedPlaying : speech.isPlaying
  const isPaused = usesGeneratedAudio ? generatedPaused : speech.isPaused

  const stop = () => {
    speech.stop()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    setGeneratedPlaying(false); setGeneratedPaused(false); setUsesGeneratedAudio(false); setTitle(''); setCoverImage(null)
  }

  const playArticle = (articleTitle: string, text: string, audioUrl?: string | null, articleCover?: string | null) => {
    stop()
    setTitle(articleTitle); setCoverImage(articleCover || null)
    if (audioUrl) {
      const audio = new Audio(audioUrl)
      audioRef.current = audio
      setUsesGeneratedAudio(true); setGeneratedPlaying(true); setGeneratedPaused(false)
      audio.addEventListener('ended', stop, { once: true })
      audio.play().catch(() => { setGeneratedPlaying(false); setTitle('') })
      return
    }
    speech.speak(text)
  }

  const pause = () => {
    if (usesGeneratedAudio && audioRef.current) { audioRef.current.pause(); setGeneratedPaused(true) }
    else speech.pause()
  }
  const resume = () => {
    if (usesGeneratedAudio && audioRef.current) { void audioRef.current.play(); setGeneratedPaused(false) }
    else speech.resume()
  }

  return (
    <ArticleAudioContext.Provider value={{ isPlaying, isPaused, title, playArticle, pause, resume, stop }}>
      {children}
      {isPlaying && !pathname.startsWith('/writing/') && (
        <div className="fixed bottom-4 left-1/2 z-[90] flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-foreground/10 bg-background/95 px-3 py-2.5 shadow-lg shadow-black/8 backdrop-blur-xl">
          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
            {coverImage ? <img src={coverImage} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-foreground/30">♪</div>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] text-foreground/40">Now reading</p>
            <p className="truncate text-xs font-medium text-foreground/75">{title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={isPaused ? resume : pause} className="size-8 rounded-full text-foreground/55 hover:bg-foreground/5 hover:text-foreground transition-colors" aria-label={isPaused ? 'Resume article' : 'Pause article'}>{isPaused ? <span className="ml-0.5 text-xs">▶</span> : <span className="text-xs">Ⅱ</span>}</button>
            <button type="button" onClick={stop} className="size-8 rounded-full text-foreground/45 hover:bg-foreground/5 hover:text-foreground transition-colors" aria-label="Close audio player">×</button>
          </div>
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
