<template>
  <q-dialog :model-value="Boolean(serviceOrderId)" @update:model-value="onDialogUpdate">
    <q-card style="min-width: 360px; max-width: 800px; width: 100%">
      <q-card-section class="text-h6">Service records</q-card-section>
      <q-card-section class="q-pt-none">
        <div v-if="loading" class="text-center q-pa-md">Loading service records...</div>
        <q-banner v-else-if="error" class="bg-negative text-white" rounded>
          {{ error }}
        </q-banner>
        <div v-else-if="!logs.length" class="text-grey-7 q-pa-md">
          No service records for this order.
        </div>
        <q-list v-else bordered separator>
          <q-item v-for="(log, index) in logs" :key="log.service_log_id || index" class="q-py-md">
            <q-item-section>
              <q-item-label class="text-weight-medium">
                {{ log.name || 'Service' }}
              </q-item-label>
              <q-item-label caption>
                Date: {{ formatDate(log.service_date) }} · Mileage:
                {{ formatMileage(log.service_miles) }}
              </q-item-label>
              <q-item-label caption>
                Parts: {{ formatMoney(log.parts) }} · Labor: {{ formatMoney(log.labor) }} · Total:
                {{ formatMoney(log.total_cost) }}
              </q-item-label>
              <q-item-label v-if="log.notes" caption class="q-mt-sm">
                {{ log.notes }}
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useServiceLogStore } from '@/stores/serviceLog'

const props = defineProps({
  serviceOrderId: {
    type: [Number, String],
    default: null,
  },
})

const emit = defineEmits(['update:serviceOrderId'])
const serviceLogStore = useServiceLogStore()
const logs = ref([])
const loading = ref(false)
const error = ref('')
let requestId = 0

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`
const formatDate = (value) => (value ? String(value).slice(0, 10) : '—')
const formatMileage = (value) =>
  value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString()

function close() {
  emit('update:serviceOrderId', null)
}

function onDialogUpdate(open) {
  if (!open) {
    close()
  }
}

watch(
  () => props.serviceOrderId,
  async (serviceOrderId) => {
    const request = ++requestId
    logs.value = []
    error.value = ''

    if (!serviceOrderId) {
      loading.value = false
      return
    }

    loading.value = true
    try {
      const records = await serviceLogStore.fetchLogsForOrder(serviceOrderId)
      if (request === requestId) {
        logs.value = records
        error.value = serviceLogStore.error || ''
      }
    } catch (loadError) {
      if (request === requestId) {
        error.value =
          loadError instanceof Error ? loadError.message : 'Unable to load service records.'
      }
    } finally {
      if (request === requestId) {
        loading.value = false
      }
    }
  },
  { immediate: true },
)
</script>
