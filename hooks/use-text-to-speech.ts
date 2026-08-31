'use client'

import { useState, useRef, useCallback } from 'react'

interface UseTextToSpeechOptions {
  onBoundary?: (charIndex: number, charLength: number) => void
  onEnd?: () => void
}

export function useTextToSpeech(options: UseTextToSpeechOptions = {}) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [currentCharIndex, setCurrentCharIndex] = useState(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  const speak = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return

    const synth = window.speechSynthesis
    synth.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.9
    utterance.pitch = 0.8
    utterance.volume = 1

    // Get voices and pick a male one
    const voices = synth.getVoices()
    const maleVoice = voices.find(v => 
      v.name.includes('Male') || 
      v.name === 'Daniel' || 
      v.name === 'Aaron' ||
      v.name === 'Fred'
    ) || voices.find(v => v.lang.startsWith('en')) || voices[0]

    if (maleVoice) utterance.voice = maleVoice

    utterance.onstart = () => {
      setIsPlaying(true)
      setIsPaused(false)
      setCurrentCharIndex(0)
    }

    // Track word boundaries for lyric-style highlighting
    utterance.onboundary = (event) => {
      if (event.name === 'word' || event.name === 'sentence') {
        setCurrentCharIndex(event.charIndex)
        options.onBoundary?.(event.charIndex, event.charLength || 0)
      }
    }

    utterance.onend = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentCharIndex(0)
      options.onEnd?.()
    }

    utterance.onerror = () => {
      setIsPlaying(false)
      setIsPaused(false)
      setCurrentCharIndex(0)
    }

    utteranceRef.current = utterance
    synth.speak(utterance)
  }, [options])

  const pause = useCallback(() => {
    window.speechSynthesis.pause()
    setIsPaused(true)
  }, [])

  const resume = useCallback(() => {
    window.speechSynthesis.resume()
    setIsPaused(false)
  }, [])

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setCurrentCharIndex(0)
  }, [])

  return { isPlaying, isPaused, currentCharIndex, speak, pause, resume, stop }
}

