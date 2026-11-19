<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 320px; max-width: 600px; width: 100%">
      <q-card-section class="text-h6">Schedule notes</q-card-section>
      <q-card-section class="q-pt-none">
        <div v-if="notes" v-html="DOMPurify.sanitize(notes)" />
        <div v-else class="text-grey-6">No notes.</div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn v-if="editable" flat label="Edit notes" color="primary" @click="emit('edit')" />
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
  editable: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'edit'])
</script>
