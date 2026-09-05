export function generateNarrationInWorker(text: string, voice: string, signal: AbortSignal, progress: (message: string) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('Narration cancelled')); return }
    const worker = new Worker('/narration-worker.js', { type: 'module' })
    let idleTimer: ReturnType<typeof setTimeout>
    const totalTimer = setTimeout(() => fail('Narration took too long. Try a shorter article or preview.'), 15 * 60 * 1000)
    const cleanup = () => { clearTimeout(idleTimer); clearTimeout(totalTimer); signal.removeEventListener('abort', abort); worker.terminate() }
    const fail = (message: string) => { cleanup(); reject(new Error(message)) }
    const abort = () => fail('Narration cancelled')
    const resetIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => fail('The voice engine stopped responding. Please retry or use a shorter preview.'), 120000) }
    signal.addEventListener('abort', abort, { once: true })
    worker.onerror = () => fail('Could not start the voice engine. Check your connection and retry.')
    worker.onmessageerror = () => fail('Could not receive the generated audio. Please retry.')
    worker.onmessage = ({ data }) => {
      resetIdle()
      if (data.type === 'progress') progress(data.message)
      else if (data.type === 'error') fail(data.message)
      else if (data.type === 'complete') { cleanup(); resolve(new Blob([data.buffer], { type: 'audio/wav' })) }
    }
    resetIdle()
    worker.postMessage({ text, voice })
  })
}
