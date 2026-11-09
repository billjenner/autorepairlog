import { test } from 'node:test'
import assert from 'node:assert/strict'
import { appendDictatedText, createNotesDictation } from './notesDictation.js'

class FakeRecognition {
  static instances = []

  constructor() {
    FakeRecognition.instances.push(this)
  }

  start() {
    this.started = true
  }

  stop() {
    this.stopped = true
  }

  abort() {
    this.aborted = true
  }
}

function result(transcript, isFinal = true) {
  return Object.assign([{ transcript }], { isFinal })
}

test('dictation appends escaped text without replacing existing notes', () => {
  assert.equal(
    appendDictatedText('<p>Existing</p>', '  Oil & <filter>\nchanged  '),
    '<p>Existing</p><p>Oil &amp; &lt;filter&gt;<br>changed</p>',
  )
  assert.equal(appendDictatedText('existing', '  '), 'existing')
})

test('recognition handles final results, stopping, and restarting', () => {
  const transcripts = []
  const dictation = createNotesDictation({
    Recognition: FakeRecognition,
    language: 'en-US',
    onTranscript: (text) => transcripts.push(text),
  })

  dictation.start()
  const session = FakeRecognition.instances.at(-1)
  assert.equal(dictation.status.value, 'starting')
  assert.equal(session.lang, 'en-US')
  assert.equal(session.continuous, true)
  assert.equal(session.started, true)
  dictation.start()
  assert.equal(FakeRecognition.instances.at(-1), session)
  session.onstart()
  assert.equal(dictation.status.value, 'listening')
  session.onresult({
    resultIndex: 1,
    results: [result('old'), result('oil'), result('filter'), result('interim', false)],
  })
  assert.deepEqual(transcripts, ['oil filter'])
  dictation.stop()
  assert.equal(session.stopped, true)
  assert.equal(dictation.status.value, 'stopping')
  session.onresult({ resultIndex: 0, results: [result('changed')] })
  assert.deepEqual(transcripts, ['oil filter', 'changed'])
  session.onend()
  assert.equal(dictation.status.value, 'idle')
  dictation.start()
  assert.notEqual(FakeRecognition.instances.at(-1), session)
  dictation.dispose()
})

test('reports browser and recognition errors and can retry', () => {
  const unsupported = createNotesDictation({ onTranscript: () => {} })
  assert.equal(unsupported.supported, false)
  unsupported.start()
  assert.equal(unsupported.status.value, 'idle')

  const dictation = createNotesDictation({ Recognition: FakeRecognition, onTranscript: () => {} })
  dictation.start()
  const session = FakeRecognition.instances.at(-1)
  session.onerror({ error: 'not-allowed' })
  assert.match(dictation.error.value, /denied/)
  session.onend()
  dictation.start()
  assert.equal(dictation.error.value, '')
  dictation.dispose()

  class FailingRecognition {
    start() {
      throw new Error('microphone unavailable')
    }
  }
  const failing = createNotesDictation({ Recognition: FailingRecognition, onTranscript: () => {} })
  failing.start()
  assert.equal(failing.status.value, 'idle')
  assert.match(failing.error.value, /microphone unavailable/)
})

test('disposal aborts listening and ignores late events', () => {
  const transcripts = []
  const dictation = createNotesDictation({
    Recognition: FakeRecognition,
    onTranscript: (text) => transcripts.push(text),
  })
  dictation.start()
  const session = FakeRecognition.instances.at(-1)
  const lateResult = session.onresult
  dictation.dispose()
  assert.equal(session.aborted, true)
  assert.equal(dictation.status.value, 'idle')
  lateResult({ resultIndex: 0, results: [result('late')] })
  assert.deepEqual(transcripts, [])
})
