<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 320px; max-width: 600px; width: 100%">
      <q-card-section class="text-h6">Schedule notes</q-card-section>
      <q-card-section class="q-pt-none">
        <div v-html="DOMPurify.sanitize(notes)" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import DOMPurify from 'dompurify'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  notes: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
</script>
