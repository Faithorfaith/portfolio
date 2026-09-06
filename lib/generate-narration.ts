let warmWorker: Worker | null = null
let releaseTimer: ReturnType<typeof setTimeout> | null = null
const workerInstance = () => warmWorker ||= new Worker('/narration-worker.js', { type: 'module' })
const terminateWorker = () => { if (releaseTimer) clearTimeout(releaseTimer); releaseTimer = null; warmWorker?.terminate(); warmWorker = null }

export function generateNarrationInWorker(text: string, voice: string, signal: AbortSignal, progress: (message: string) => void): Promise<Blob> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) { reject(new Error('Narration cancelled')); return }
    if (releaseTimer) clearTimeout(releaseTimer)
    const worker = workerInstance()
    let idleTimer: ReturnType<typeof setTimeout>
    const totalTimer = setTimeout(() => fail('Narration took too long. Try a shorter article or preview.', true), 15 * 60 * 1000)
    const cleanup = () => { clearTimeout(idleTimer); clearTimeout(totalTimer); signal.removeEventListener('abort', abort); worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null }
    const fail = (message: string, terminate = false) => { cleanup(); if (terminate) terminateWorker(); reject(new Error(message)) }
    const abort = () => fail('Narration cancelled', true)
    const resetIdle = () => { clearTimeout(idleTimer); idleTimer = setTimeout(() => fail('The voice engine stopped responding. Please retry or use a shorter preview.', true), 120000) }
    signal.addEventListener('abort', abort, { once: true })
    worker.onerror = () => fail('Could not start the voice engine. Check your connection and retry.', true)
    worker.onmessageerror = () => fail('Could not receive the generated audio. Please retry.', true)
    worker.onmessage = ({ data }) => {
      resetIdle()
      if (data.type === 'progress') progress(data.message)
      else if (data.type === 'error') fail(data.message)
      else if (data.type === 'complete') { cleanup(); releaseTimer = setTimeout(terminateWorker, 10 * 60 * 1000); resolve(new Blob([data.buffer], { type: 'audio/wav' })) }
    }
    resetIdle()
    worker.postMessage({ text, voice })
  })
}
