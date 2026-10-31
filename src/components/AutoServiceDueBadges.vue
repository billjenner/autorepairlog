<template>
  <div class="row justify-between items-center full-width">
    <q-badge
      v-for="bucket in buckets"
      :key="bucket.key"
      :color="bucket.color"
      :text-color="bucket.textColor"
      class="q-pa-sm q-mx-md q-my-md cursor-pointer"
      :label="`${bucket.label} (${bucket.count})`"
      @click="openBucket(bucket)"
    />
    <q-dialog v-model="dialogOpen">
      <q-card style="min-width: 380px">
        <q-card-section class="text-h6">
          {{ activeBucket?.label }} ({{ activeBucket?.services.length }})
        </q-card-section>
        <q-list separator>
          <q-item v-for="service in activeBucket?.services" :key="service.service_id">
            <q-item-section>
              <q-item-label>{{ service.name }}</q-item-label>
              <q-item-label caption>
                Due {{ String(service.next_date).slice(0, 10) }}
                <template v-if="service.next_miles != null">
                  · {{ Number(service.next_miles).toLocaleString() }} mi
                </template>
              </q-item-label>
            </q-item-section>
          </q-item>
          <q-item v-if="!activeBucket?.services.length">
            <q-item-section class="text-grey">No services.</q-item-section>
          </q-item>
        </q-list>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>

<script setup>
import { computed, ref, watch } from 'vue'
import { predictFutureServices } from '@/utils/rules'

const props = defineProps({
  profileId: { type: [Number, String], default: null },
  autoId: { type: [Number, String], required: true },
})

const emptyGroups = () => ({ overdue: [], d30: [], d90: [], year: [] })
const groups = ref(emptyGroups())
const dialogOpen = ref(false)
const activeKey = ref('overdue')
let requestId = 0

const buckets = computed(() =>
  [
    { key: 'overdue', label: 'Overdue', color: 'negative' },
    { key: 'd30', label: '30 days', color: 'warning', textColor: 'dark' },
    { key: 'd90', label: '90 days', color: 'info' },
    { key: 'year', label: '1 year', color: 'positive' },
  ].map((bucket) => ({
    ...bucket,
    services: groups.value[bucket.key],
    count: groups.value[bucket.key].length,
  })),
)
const activeBucket = computed(() => buckets.value.find((b) => b.key === activeKey.value))

function openBucket(bucket) {
  activeKey.value = bucket.key
  dialogOpen.value = true
}

function daysUntil(date) {
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((Date.parse(`${String(date).slice(0, 10)}T00:00:00Z`) - today) / 86400000)
}

async function load() {
  const currentRequest = ++requestId
  const next = emptyGroups()
  try {
    const autos = props.profileId ? await predictFutureServices(props.profileId) : []
    const auto = autos.find((item) => String(item.auto_id) === String(props.autoId))
    for (const service of auto?.services || []) {
      if (!service.next_date) continue
      const days = daysUntil(service.next_date)
      if (Number.isNaN(days)) continue
      if (days < 0) next.overdue.push(service)
      else if (days <= 30) next.d30.push(service)
      else if (days <= 90) next.d90.push(service)
      else if (days <= 365) next.year.push(service)
    }
  } catch {
    // Leave groups empty when predictions are unavailable.
  }
  if (currentRequest === requestId) groups.value = next
}

watch(() => [props.profileId, props.autoId], load, { immediate: true })
</script>
