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
  const [elapsed, setElapsed] = useState(0)
  const [duration, setDuration] = useState(0)
  const [speed, setSpeed] = useState(1)
  const [audioError, setAudioError] = useState(false)
  const [buffering, setBuffering] = useState(false)
  const formatTime = (value: number) => `${Math.floor(value / 60)}:${Math.floor(value % 60).toString().padStart(2, '0')}`
  const speech = useTextToSpeech({ onEnd: () => setTitle('') })

  const isPlaying = usesGeneratedAudio ? generatedPlaying : speech.isPlaying
  const isPaused = usesGeneratedAudio ? generatedPaused : speech.isPaused

  const stop = () => {
    speech.stop()
    setElapsed(0); setDuration(0); setAudioError(false); setBuffering(false)
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
      setBuffering(true)
      audio.addEventListener('waiting', () => { if (audioRef.current === audio) setBuffering(true) })
      audio.addEventListener('playing', () => { if (audioRef.current === audio) setBuffering(false) })
      audio.addEventListener('canplay', () => { if (audioRef.current === audio) setBuffering(false) })
      audio.playbackRate = speed
      const positionKey = `article-position:${audioUrl}`
      let lastSaved = -1
      audio.addEventListener('timeupdate', () => {
        const bucket = Math.floor(audio.currentTime / 5)
        if (bucket === lastSaved || audioRef.current !== audio) return
        lastSaved = bucket
        try { localStorage.setItem(positionKey, String(audio.currentTime)) } catch {}
      })
      audio.addEventListener('loadedmetadata', () => {
        try { const saved = Number(localStorage.getItem(positionKey)); if (saved > 0 && saved < audio.duration - 3) audio.currentTime = saved } catch {}
      }, { once: true })
      audio.addEventListener('timeupdate', () => { if (audioRef.current === audio) setElapsed(audio.currentTime) })
      audio.addEventListener('loadedmetadata', () => { if (audioRef.current === audio) setDuration(Number.isFinite(audio.duration) ? audio.duration : 0) })
      audio.addEventListener('error', () => { if (audioRef.current === audio) { setAudioError(true); setGeneratedPaused(true) } })
      setUsesGeneratedAudio(true); setGeneratedPlaying(true); setGeneratedPaused(false)
      audio.addEventListener('ended', stop, { once: true })
      audio.play().catch(() => { if (audioRef.current === audio) { setAudioError(true); setGeneratedPaused(true) } })
      return
    }
    speech.speak(text)
  }

  const pause = () => {
    if (usesGeneratedAudio && audioRef.current) { audioRef.current.pause(); setGeneratedPaused(true) }
    else speech.pause()
  }
  const resume = () => {
    if (usesGeneratedAudio && audioRef.current) {
      const audio = audioRef.current
      if (audioError) audio.load()
      void audio.play().then(() => { if (audioRef.current === audio) { setGeneratedPaused(false); setAudioError(false) } }).catch(() => setAudioError(true))
    }
    else speech.resume()
  }

  return (
    <ArticleAudioContext.Provider value={{ isPlaying, isPaused, title, playArticle, pause, resume, stop }}>
      {children}
      {isPlaying && (
        <div role="region" aria-label="Article audio player" className="fixed bottom-4 left-1/2 z-[90] flex flex-wrap w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center gap-3 rounded-xl border border-foreground/10 bg-background/95 px-3 py-2.5 shadow-lg shadow-black/8 backdrop-blur-xl">
          <div className="size-10 shrink-0 overflow-hidden rounded-lg bg-foreground/5">
            {coverImage ? <img src={coverImage} alt="" className="h-full w-full object-cover" /> : <div className="h-full w-full grid place-items-center text-foreground/30">♪</div>}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] text-foreground/60" role="status">{audioError ? 'Playback failed · press play to retry' : isPaused ? 'Paused' : buffering ? 'Loading audio…' : 'Now reading'}</p>
            <p className="truncate text-xs font-medium text-foreground/75">{title}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <button type="button" onClick={isPaused ? resume : pause} className="size-11 rounded-full text-foreground/65 hover:bg-foreground/5 hover:text-foreground transition-colors" aria-label={isPaused ? 'Resume article' : 'Pause article'}>{isPaused ? <span className="ml-0.5 text-xs">▶</span> : <span className="text-xs">Ⅱ</span>}</button>
            <button type="button" onClick={stop} className="size-11 rounded-full text-foreground/65 hover:bg-foreground/5 hover:text-foreground transition-colors" aria-label="Close audio player">×</button>
          </div>
          {usesGeneratedAudio && (
            <div className="flex w-full items-center gap-2 text-[11px] text-foreground/65 tabular-nums">
              <span>{formatTime(elapsed)}</span>
              <input type="range" aria-label="Seek article audio" aria-valuetext={`${formatTime(elapsed)} of ${formatTime(duration)}`} min={0} max={duration || 1} step={0.1} value={Math.min(elapsed, duration || 1)} disabled={!duration} onChange={(event) => { const value = Number(event.target.value); if (audioRef.current) audioRef.current.currentTime = value; setElapsed(value) }} className="min-w-0 flex-1 h-8 accent-current" />
              <span>{formatTime(duration)}</span>
              <select aria-label="Playback speed" value={speed} onChange={(event) => { const value = Number(event.target.value); setSpeed(value); if (audioRef.current) audioRef.current.playbackRate = value }} className="h-9 bg-transparent rounded px-1">
                {[0.75, 1, 1.25, 1.5, 2].map((value) => <option key={value} value={value}>{value}×</option>)}
              </select>
            </div>
          )}
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
