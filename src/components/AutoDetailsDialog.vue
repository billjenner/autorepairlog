<template>
  <q-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)">
    <q-card style="min-width: 360px; max-width: 600px; width: 100%">
      <q-card-section>
        <div class="text-h6">{{ autoDetailsTitle(auto) }}</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <q-img
          v-if="auto && photoUrl"
          :src="photoUrl"
          :alt="`${autoDetailsTitle(auto)} photo`"
          fit="contain"
          style="max-height: 240px"
          class="q-mb-md"
        />
        <q-markup-table flat dense>
          <tbody>
            <tr>
              <td class="text-weight-medium">VIN</td>
              <td>{{ auto?.vin || '—' }}</td>
            </tr>
            <tr>
              <td class="text-weight-medium">Purchase date</td>
              <td>{{ auto?.purchase_date || '—' }}</td>
            </tr>
            <tr>
              <td class="text-weight-medium">Purchase amount</td>
              <td>{{ formatPurchaseAmount(auto?.purchase_amount) }}</td>
            </tr>
            <tr>
              <td class="text-weight-medium">Purchase mileage</td>
              <td>{{ formatMileage(auto?.purchase_mileage) }}</td>
            </tr>
            <tr>
              <td class="text-weight-medium">Latest Mileage Date</td>
              <td>{{ latestMileageLoading ? 'Loading...' : latestMileage?.date || '—' }}</td>
            </tr>
            <tr>
              <td class="text-weight-medium">Latest Mileage</td>
              <td>
                {{ latestMileageLoading ? 'Loading...' : formatMileage(latestMileage?.miles) }}
              </td>
            </tr>
            <template v-if="canViewMetadata">
              <tr>
                <td class="text-weight-medium">Template</td>
                <td>{{ auto?.isTemplate ? 'Yes' : 'No' }}</td>
              </tr>
              <tr>
                <td class="text-weight-medium">Created</td>
                <td>{{ auto?.created_date || '—' }}</td>
              </tr>
            </template>
          </tbody>
        </q-markup-table>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useMileageStore } from '@/stores/mileage'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  auto: {
    type: Object,
    default: null,
  },
  photoUrl: {
    type: String,
    default: '',
  },
  canViewMetadata: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue'])
const $q = useQuasar()
const mileageStore = useMileageStore()
const latestMileage = ref(null)
const latestMileageLoading = ref(false)
let mileageRequestId = 0

function autoDetailsTitle(auto) {
  if (!auto) {
    return 'Auto details'
  }

  const identity = [auto.year, auto.make, auto.model].filter(Boolean).join(' ')
  return [identity || 'Unnamed auto', auto.color].filter(Boolean).join(' · ')
}

function formatPurchaseAmount(amount) {
  if (amount === null || amount === undefined || amount === '') {
    return '—'
  }

  return `$${Number(amount).toLocaleString()}`
}

function formatMileage(miles) {
  return miles === null || miles === undefined || miles === ''
    ? '—'
    : Number(miles).toLocaleString()
}

watch(
  () => [props.modelValue, props.auto?.auto_id],
  async ([isOpen, autoId]) => {
    const requestId = ++mileageRequestId
    latestMileage.value = null
    latestMileageLoading.value = Boolean(isOpen && autoId)
    if (!isOpen || !autoId) {
      return
    }

    try {
      const record = await mileageStore.fetchLatestRecord(autoId)
      if (requestId === mileageRequestId) {
        latestMileage.value = record
      }
    } catch (error) {
      if (requestId === mileageRequestId) {
        $q.notify({
          color: 'negative',
          message: error instanceof Error ? error.message : 'Unable to load latest mileage.',
        })
      }
    } finally {
      if (requestId === mileageRequestId) {
        latestMileageLoading.value = false
      }
    }
  },
  { immediate: true },
)
</script>
