<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 400px; max-width: 600px; width: 100%">
      <q-card-section class="text-h6">Schedule details</q-card-section>
      <q-card-section v-if="schedule" class="q-pt-none">
        <q-list dense>
          <q-item>
            <q-item-section>
              <q-item-label caption>Auto</q-item-label>
              <q-item-label>{{ autoLabel || '—' }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>Services</q-item-label>
              <q-item-label>{{ schedule.service?.length ?? 0 }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>Active</q-item-label>
              <q-item-label>{{ schedule.is_active ? 'Yes' : 'No' }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>Created</q-item-label>
              <q-item-label>{{ createdDate }}</q-item-label>
            </q-item-section>
          </q-item>
          <q-item>
            <q-item-section>
              <q-item-label caption>Notes</q-item-label>
              <div v-if="notesHtml" v-html="notesHtml" />
              <q-item-label v-else>—</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'
import DOMPurify from 'dompurify'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  schedule: { type: Object, default: null },
  autoLabel: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])

const notesHtml = computed(() =>
  props.schedule?.notes ? DOMPurify.sanitize(props.schedule.notes) : '',
)
const createdDate = computed(() =>
  props.schedule?.created_date ? new Date(props.schedule.created_date).toLocaleString() : '—',
)
</script>
