export const SOUND_PREFERENCE_KEY = 'portfolio-sound-enabled'

type FeedbackTone = 'tap' | 'success'
let sharedContext: AudioContext | null = null

export function isSoundEnabled() {
  return typeof window !== 'undefined' && window.localStorage.getItem(SOUND_PREFERENCE_KEY) === 'true'
}

function getAudioContext() {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return null
  if (!sharedContext || sharedContext.state === 'closed') sharedContext = new AudioContextClass()
  if (sharedContext.state === 'suspended') void sharedContext.resume()
  return sharedContext
}

function playNote(context: AudioContext, frequency: number, startsAt: number, duration: number, volume: number) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(frequency, startsAt)
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.92, startsAt + duration)
  gain.gain.setValueAtTime(0.0001, startsAt)
  gain.gain.exponentialRampToValueAtTime(volume, startsAt + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, startsAt + duration)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(startsAt)
  oscillator.stop(startsAt + duration + 0.01)
}

export function playFeedback(tone: FeedbackTone = 'tap') {
  if (typeof window === 'undefined') return

  if ('vibrate' in navigator) {
    navigator.vibrate(tone === 'success' ? [24, 28, 34] : 22)
  }
  if (!isSoundEnabled()) return

  const context = getAudioContext()
  if (!context) return
  const now = context.currentTime

  if (tone === 'success') {
    playNote(context, 620, now, 0.11, 0.075)
    playNote(context, 880, now + 0.065, 0.14, 0.065)
  } else {
    playNote(context, 520, now, 0.085, 0.065)
  }
}
