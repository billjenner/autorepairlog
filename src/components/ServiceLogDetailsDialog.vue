<template>
  <q-dialog :model-value="Boolean(log)" @update:model-value="onDialogUpdate">
    <q-card style="min-width: 360px; max-width: 600px; width: 100%">
      <q-card-section>
        <div class="text-h6">{{ log?.name || 'Service log details' }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="text-subtitle1 text-weight-medium">
          {{ serviceOrderTitle || 'Service order details' }}
        </div>
        <div>Invoice #: {{ serviceOrder?.invoice_number || '—' }}</div>
        <div>Service date: {{ formatDate(serviceOrder?.service_date) }}</div>
        <div>Service mileage: {{ formatMileage(serviceOrder?.mileage_at_service) }}</div>
        <div>Is complete: {{ serviceOrder?.is_complete ? 'Yes' : 'No' }}</div>
        <div>Attachment: {{ serviceOrder?.invoice_url ? 'Available' : 'None' }}</div>
        <a
          v-if="invoiceUrl"
          :href="invoiceUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="block q-mt-xs"
        >
          View attachment
        </a>
        <div v-if="serviceOrder?.invoice_url && !invoiceUrl" class="text-negative text-caption">
          {{ invoiceError || 'Attachment link is unavailable.' }}
        </div>
        <q-btn
          v-if="serviceOrder?.auto_id && serviceOrderSearchTerm"
          flat
          dense
          color="primary"
          label="View service order"
          class="q-mt-sm"
          :to="{
            path: '/service-order',
            query: {
              autoId: serviceOrder.auto_id,
              search: serviceOrderSearchTerm,
            },
          }"
          @click="close"
        />
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div>Parts: {{ formatMoney(log?.parts) }}</div>
        <div>Labor: {{ formatMoney(log?.labor) }}</div>
        <div>Total: {{ formatMoney(log?.total_cost) }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
        <NotesViewer :notes="log?.notes || ''" />
      </q-card-section>
      <q-card-section v-if="serviceOrder?.notes" class="q-pt-none">
        <div class="text-caption text-grey-7 q-mb-xs">Service order notes</div>
        <NotesViewer :notes="serviceOrder.notes" />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" @click="close" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import NotesViewer from '@/components/NotesViewer.vue'
import { useServiceOrderStore } from '@/stores/serviceOrder'

const props = defineProps({
  log: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['update:log'])
const serviceOrderStore = useServiceOrderStore()
const invoiceUrl = ref('')
const invoiceError = ref('')
let invoiceRequestId = 0

const serviceOrder = computed(() => props.log?.service_order || null)
const serviceOrderTitle = computed(() =>
  [serviceOrder.value?.shop_name, serviceOrder.value?.mechanic_name].filter(Boolean).join(' - '),
)
const serviceOrderSearchTerm = computed(
  () =>
    String(serviceOrder.value?.invoice_number || '').trim() ||
    (serviceOrder.value?.service_date ? String(serviceOrder.value.service_date).slice(0, 10) : ''),
)

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`
const formatDate = (value) => (value ? String(value).slice(0, 10) : '—')
const formatMileage = (value) =>
  value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString()

function close() {
  emit('update:log', null)
}

function onDialogUpdate(open) {
  if (!open) {
    close()
  }
}

watch(
  () => serviceOrder.value?.invoice_url,
  async (path) => {
    const requestId = ++invoiceRequestId
    invoiceUrl.value = ''
    invoiceError.value = ''
    if (!path) {
      return
    }

    const url = await serviceOrderStore.getInvoiceUrl(path)
    if (requestId === invoiceRequestId) {
      invoiceUrl.value = url || ''
      invoiceError.value = serviceOrderStore.error || ''
    }
  },
  { immediate: true },
)
</script>
