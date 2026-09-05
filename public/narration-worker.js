// Runs model download, phonemization, inference and WAV encoding off the UI thread.
self.onmessage = async ({ data }) => {
  try {
    const { text, voice } = data
    if (typeof text !== 'string' || !text.trim() || text.length > 30000) throw new Error('Use between 1 and 30,000 characters per narration.')
    self.postMessage({ type: 'progress', message: 'Loading voice engine…' })
    const { KokoroTTS, TextSplitterStream } = await import('https://cdn.jsdelivr.net/npm/kokoro-js@1.2.1/dist/kokoro.web.js')
    const model = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8', device: 'wasm',
      progress_callback: (progress) => {
        self.postMessage({ type: 'progress', message: typeof progress.progress === 'number' ? `Downloading voice model: ${Math.round(progress.progress)}%` : 'Preparing voice model…' })
      },
    })
    const splitter = new TextSplitterStream()
    splitter.push(text)
    splitter.close()
    const parts = []
    for await (const sentence of splitter) {
      const words = sentence.split(/\s+/)
      for (let index = 0; index < words.length; index += 45) parts.push(words.slice(index, index + 45).join(' '))
    }
    const chunks = []
    let count = 0
    for (let index = 0; index < parts.length; index++) {
      self.postMessage({ type: 'progress', message: `Reading passage ${index + 1} of ${parts.length}…` })
      const audio = await model.generate(parts[index], { voice, speed: 0.96 })
      count += audio.audio.length
      if (count > 24000 * 60 * 30) throw new Error('Narration exceeds 30 minutes. Split this article into shorter parts.')
      chunks.push(audio.audio)
    }
    if (!count) throw new Error('The voice engine returned no audio.')
    self.postMessage({ type: 'progress', message: 'Preparing audio file…' })
    const buffer = new ArrayBuffer(44 + count * 2)
    const view = new DataView(buffer)
    const write = (offset, value) => [...value].forEach((char, index) => view.setUint8(offset + index, char.charCodeAt(0)))
    write(0, 'RIFF'); view.setUint32(4, 36 + count * 2, true); write(8, 'WAVE'); write(12, 'fmt ')
    view.setUint32(16, 16, true); view.setUint16(20, 1, true); view.setUint16(22, 1, true)
    view.setUint32(24, 24000, true); view.setUint32(28, 48000, true); view.setUint16(32, 2, true); view.setUint16(34, 16, true)
    write(36, 'data'); view.setUint32(40, count * 2, true)
    let offset = 44
    for (const chunk of chunks) for (const sample of chunk) { view.setInt16(offset, Math.max(-1, Math.min(1, sample)) * 0x7fff, true); offset += 2 }
    self.postMessage({ type: 'complete', buffer }, [buffer])
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'Narration failed. Please retry.' })
  }
}
