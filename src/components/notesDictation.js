import { ref } from 'vue'

export function appendDictatedText(notes, text) {
  const escaped = text
    .trim()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('\n', '<br>')

  return escaped ? `${notes || ''}<p>${escaped}</p>` : notes || ''
}

export function createNotesDictation({ Recognition, language, onTranscript }) {
  const status = ref('idle')
  const error = ref('')
  let recognition = null

  function start() {
    if (!Recognition || status.value !== 'idle') return

    error.value = ''
    try {
      const session = new Recognition()
      recognition = session
      session.continuous = true
      session.interimResults = false
      if (language) session.lang = language
      session.onstart = () => {
        if (recognition === session && status.value === 'starting') status.value = 'listening'
      }
      session.onresult = (event) => {
        if (recognition !== session) return
        const transcripts = []
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) transcripts.push(event.results[i][0].transcript.trim())
        }
        const text = transcripts.filter(Boolean).join(' ')
        if (text) onTranscript(text)
      }
      session.onerror = (event) => {
        if (recognition !== session) return
        const messages = {
          'not-allowed': 'Microphone access was denied. Check your browser permissions.',
          'service-not-allowed': 'Speech recognition is not allowed by your browser.',
          'audio-capture': 'No microphone is available. Check your microphone and try again.',
          network: 'Speech recognition encountered a network error. Check your connection.',
          'no-speech': 'No speech was detected. Try dictating again.',
        }
        error.value =
          messages[event.error] || `Speech recognition failed: ${event.error || 'unknown error'}.`
      }
      session.onend = () => {
        if (recognition !== session) return
        recognition = null
        status.value = 'idle'
      }
      status.value = 'starting'
      session.start()
    } catch (cause) {
      recognition = null
      status.value = 'idle'
      error.value = `Unable to start dictation: ${cause.message || String(cause)}`
    }
  }

  function stop() {
    if (!recognition || status.value === 'stopping') return
    try {
      status.value = 'stopping'
      recognition.stop()
    } catch (cause) {
      error.value = `Unable to stop dictation: ${cause.message || String(cause)}`
      dispose()
    }
  }

  function dispose() {
    if (recognition) {
      const session = recognition
      recognition = null
      session.onstart = null
      session.onresult = null
      session.onerror = null
      session.onend = null
      session.abort()
    }
    status.value = 'idle'
  }

  return { supported: Boolean(Recognition), status, error, start, stop, dispose }
}
