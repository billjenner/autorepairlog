<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 360px; max-width: 600px; width: 100%">
      <q-card-section class="text-h6">
        {{ service?.name || 'Service notes' }}
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
        <NotesViewer :notes="service?.notes || ''" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import NotesViewer from '@/components/NotesViewer.vue'

defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  service: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:modelValue'])
</script>
