<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 360px; max-width: 600px; width: 100%">
      <q-card-section>
        <div class="text-h6">
          {{
            [order?.shop_name, order?.mechanic_name].filter(Boolean).join(' - ') ||
            'Service order details'
          }}
        </div>
        <div class="text-body2">
          <span v-if="order?.invoice_number">Invoice #: {{ order.invoice_number }}</span>
        </div>
        <div class="text-body2">Service date: {{ order?.service_date || '—' }}</div>
        <div class="text-body2">Mileage: {{ formatMileage(order?.mileage_at_service) }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-markup-table flat dense>
          <thead>
            <tr>
              <th class="text-left">Service</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading">
              <td colspan="2" class="text-center text-grey-7">Loading services...</td>
            </tr>
            <tr v-else-if="error">
              <td colspan="2" class="text-negative">{{ error }}</td>
            </tr>
            <tr v-for="(log, index) in logs" :key="log.service_log_id || index">
              <td>{{ log.name || 'Service' }}</td>
              <td class="text-right">{{ formatMoney(log.total_cost) }}</td>
            </tr>
            <tr v-if="!loading && !error && !logs.length">
              <td colspan="2" class="text-center text-grey-7">No services recorded.</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th class="text-left">SO total</th>
              <th class="text-right">{{ formatMoney(order?.total_cost) }}</th>
            </tr>
          </tfoot>
        </q-markup-table>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="text-body2 q-mb-md">Is complete: {{ order?.is_complete ? 'Yes' : 'No' }}</div>
        <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
        <NotesViewer :notes="order?.notes || ''" />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="text-body2">Attachment: {{ order?.invoice_url ? 'Available' : 'None' }}</div>
        <a v-if="invoiceUrl" :href="invoiceUrl" target="_blank" rel="noopener noreferrer">
          View attachment
        </a>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import NotesViewer from '@/components/NotesViewer.vue'
import { useServiceOrderStore } from '@/stores/serviceOrder'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  order: {
    type: Object,
    default: null,
  },
  logs: {
    type: Array,
    default: () => [],
  },
  loading: {
    type: Boolean,
    default: false,
  },
  error: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:modelValue'])
const serviceOrderStore = useServiceOrderStore()
const invoiceUrl = ref('')
let invoiceUrlRequestId = 0

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`
const formatMileage = (value) =>
  value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString()

watch(
  () => props.order?.invoice_url,
  async (path) => {
    const requestId = ++invoiceUrlRequestId
    invoiceUrl.value = ''
    if (!path) {
      return
    }

    const url = await serviceOrderStore.getInvoiceUrl(path)
    if (requestId === invoiceUrlRequestId) {
      invoiceUrl.value = url || ''
    }
  },
  { immediate: true },
)
</script>
