'use client'

import { useState, useRef, useCallback } from 'react'

interface UseTextToSpeechOptions {
  onBoundary?: (charIndex: number, charLength: number) => void
  onEnd?: () => void
}

function naturalEnglishVoice(voices: SpeechSynthesisVoice[]) {
  const preferredNames = [
    'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Sonia', 'Microsoft Ryan',
    'Ava', 'Samantha', 'Serena', 'Daniel', 'Zoe',
    'Google UK English Female', 'Google UK English Male', 'Google US English',
  ]
  const englishVoices = voices.filter((voice) => /^en[-_]/i.test(voice.lang))
  const score = (voice: SpeechSynthesisVoice) => {
    const name = voice.name.toLowerCase()
    let value = voice.localService ? 4 : 0
    const preferredIndex = preferredNames.findIndex((preferred) => name.includes(preferred.toLowerCase()))
    if (preferredIndex >= 0) value += 100 - preferredIndex
    if (/natural|neural|premium|enhanced/.test(name)) value += 30
    if (/compact|whisper|novelty|organ|bells|zarvox/.test(name)) value -= 100
    if (/^en-(gb|us|ng)/i.test(voice.lang)) value += 8
    return value
  }
  return englishVoices.sort((a, b) => score(b) - score(a))[0] || voices[0]
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
    utterance.rate = 0.96
    utterance.pitch = 1
    utterance.volume = 1

    const voices = synth.getVoices()
    const selectedVoice = naturalEnglishVoice(voices)
    if (selectedVoice) {
      utterance.voice = selectedVoice
      utterance.lang = selectedVoice.lang
    } else {
      utterance.lang = 'en-GB'
    }

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
