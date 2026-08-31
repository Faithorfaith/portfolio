export const SOUND_PREFERENCE_KEY = 'portfolio-sound-enabled'

export function isSoundEnabled() {
  return typeof window !== 'undefined' && window.localStorage.getItem(SOUND_PREFERENCE_KEY) === 'true'
}

export function playFeedback(tone: 'tap' | 'success' = 'tap') {
  if (typeof window === 'undefined') return

  if ('vibrate' in navigator) navigator.vibrate(tone === 'success' ? 18 : 10)
  if (!isSoundEnabled() || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
  if (!AudioContextClass) return

  const context = new AudioContextClass()
  const oscillator = context.createOscillator()
  const gain = context.createGain()
  const now = context.currentTime

  oscillator.type = 'sine'
  oscillator.frequency.setValueAtTime(tone === 'success' ? 660 : 480, now)
  gain.gain.setValueAtTime(0.0001, now)
  gain.gain.exponentialRampToValueAtTime(0.025, now + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055)
  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(now)
  oscillator.stop(now + 0.06)
  oscillator.addEventListener('ended', () => void context.close())
}
