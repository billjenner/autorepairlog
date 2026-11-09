<template>
  <div>
    <q-editor
      v-model="content"
      :toolbar="toolbar"
      :definitions="definitions"
      min-height="200px"
      max-height="500px"
      placeholder="Enter notes..."
    />
    <div class="q-mt-sm">
      <q-btn
        outline
        color="primary"
        :icon="dictation.status.value === 'idle' ? 'mic' : 'mic_off'"
        :label="dictation.status.value === 'idle' ? 'Start dictation' : 'Stop dictation'"
        :disable="!dictation.supported || dictation.status.value === 'stopping'"
        @click="toggleDictation"
      />
      <div class="text-caption q-mt-xs" role="status" aria-live="polite">
        <span v-if="dictation.error.value" class="text-negative">{{ dictation.error.value }}</span>
        <span v-else-if="!dictation.supported">
          Voice dictation is not supported in this browser.
        </span>
        <span v-else-if="dictation.status.value === 'starting'">Starting microphone...</span>
        <span v-else-if="dictation.status.value === 'listening'">Listening...</span>
        <span v-else-if="dictation.status.value === 'stopping'">Finishing dictation...</span>
        <span v-else>Dictation appends text to your notes. Speech may be processed by your browser provider.</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount } from 'vue'
import { appendDictatedText, createNotesDictation } from './notesDictation.js'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})
const emit = defineEmits(['update:modelValue'])

const content = computed({
  get: () => props.modelValue || '',
  set: (value) => emit('update:modelValue', value),
})

const dictation = createNotesDictation({
  Recognition:
    typeof window === 'undefined'
      ? undefined
      : window.SpeechRecognition || window.webkitSpeechRecognition,
  language: typeof navigator === 'undefined' ? undefined : navigator.language,
  onTranscript: (text) => {
    content.value = appendDictatedText(content.value, text)
  },
})

function toggleDictation() {
  if (dictation.status.value === 'idle') {
    dictation.start()
  } else {
    dictation.stop()
  }
}

onBeforeUnmount(dictation.dispose)

const toolbar = [
  ['undo', 'redo'],
  ['bold', 'italic', 'underline', 'removeFormat'],
  ['unordered', 'ordered'],
  ['outdent', 'indent'],
  ['p', 'h4', 'h5', 'h6', 'code'],
  ['left', 'center', 'right', 'justify'],
  ['help'],
]

const definitions = {
  p: { label: 'Paragraph', icon: 'notes', tip: 'Paragraph', cmd: 'formatBlock', param: 'P' },
  h3: {
    label: 'Heading 3',
    icon: 'format_size',
    tip: 'Heading 3',
    cmd: 'formatBlock',
    param: 'H3',
  },
  h4: {
    label: 'Heading 4',
    icon: 'format_size',
    tip: 'Heading 4',
    cmd: 'formatBlock',
    param: 'H4',
  },
  code: { label: 'Code', icon: 'code', tip: 'Code block', cmd: 'formatBlock', param: 'PRE' },
}
</script>
