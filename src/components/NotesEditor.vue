<template>
  <q-editor
    v-model="content"
    :toolbar="toolbar"
    :definitions="definitions"
    min-height="200px"
    max-height="500px"
    placeholder="Enter notes..."
  />
</template>

<script setup>
import { computed } from 'vue'
import { useQuasar } from 'quasar'

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})
const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()

const content = computed({
  get: () => props.modelValue || '',
  set: (value) => emit('update:modelValue', value),
})

const toolbar = [
  [
    {
      label: 'Text formatting',
      icon: $q.iconSet.editor.formatting,
      list: 'no-icons',
      options: ['bold', 'italic', 'underline', 'removeFormat'],
    },
  ],
  [
    {
      label: 'Block',
      icon: $q.iconSet.editor.formatting,
      list: 'no-icons',
      options: ['p', 'h3', 'h4', 'code'],
    },
  ],
  [
    {
      label: 'List and indentation',
      icon: $q.iconSet.editor.unorderedList,
      list: 'no-icons',
      options: ['unordered', 'outdent', 'indent'],
    },
  ],
  [
    {
      label: 'Insertion',
      icon: $q.iconSet.editor.insertLink,
      list: 'no-icons',
      options: ['link', 'hr'],
    },
  ],
  [
    {
      label: 'History and view',
      icon: $q.iconSet.editor.undo,
      list: 'no-icons',
      options: ['undo', 'redo'],
    },
  ],
]

const definitions = {
  p: { label: 'Paragraph', icon: 'notes', tip: 'Paragraph', cmd: 'formatBlock', param: 'P' },
  h3: { label: 'Heading 3', icon: 'format_size', tip: 'Heading 3', cmd: 'formatBlock', param: 'H3' },
  h4: { label: 'Heading 4', icon: 'format_size', tip: 'Heading 4', cmd: 'formatBlock', param: 'H4' },
  code: { label: 'Code', icon: 'code', tip: 'Code block', cmd: 'formatBlock', param: 'PRE' },
}
</script>
