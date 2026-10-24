<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 360px">
      <q-card-section class="text-h6">Services</q-card-section>
      <q-card-section class="q-pt-none">
        <q-list dense>
          <q-item v-for="service in sortedServices" :key="service.service_id">
            <q-item-section>{{ serviceLabel(service) }}</q-item-section>
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

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  services: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue'])

const sortedServices = computed(() =>
  [...props.services].sort((a, b) => (a.name || '').localeCompare(b.name || '')),
)

function serviceLabel(service) {
  const parts = []
  if (service.interval_miles > 0) parts.push(`Miles-${service.interval_miles}`)
  if (service.interval_months > 0) parts.push(`Months-${service.interval_months}`)
  if (service.interval_years > 0) parts.push(`Years-${service.interval_years}`)
  return `${service.name || ''}${parts.length ? ` (${parts.join(', ')})` : ''}`
}
</script>
