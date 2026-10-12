<template>
  <div v-if="html" class="notes-viewer q-pa-md bg-grey-2 rounded-borders" v-html="html" />
  <div v-else class="text-grey-6">No notes.</div>
</template>

<script setup>
import { computed } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps({
  notes: {
    type: String,
    default: '',
  },
})

const html = computed(() => (props.notes ? DOMPurify.sanitize(props.notes) : ''))
</script>

<style scoped>
.notes-viewer {
  max-height: 400px;
  overflow: auto;
  overflow-wrap: anywhere;
}
.notes-viewer :deep(pre) {
  white-space: pre-wrap;
}
</style>
