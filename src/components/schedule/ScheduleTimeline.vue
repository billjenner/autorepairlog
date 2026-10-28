<template>
  <div>
    <div class="text-subtitle1 q-mb-sm q-ml-md">Service history and upcoming services</div>

    <q-banner v-if="error" class="bg-negative text-white q-mb-sm" rounded>{{ error }}</q-banner>

    <q-markup-table flat bordered dense>
      <thead>
        <tr class="bg-accent text-white">
          <th class="text-left cursor-pointer" @click="descending = !descending">
            Date
            <q-icon :name="descending ? 'arrow_downward' : 'arrow_upward'" size="16px" />
          </th>
          <th class="text-left">Name</th>
          <th class="text-right">Interval miles</th>
          <th class="text-right">Interval months</th>
          <th class="text-right">Interval years</th>
          <th class="text-right">Cost</th>
          <th class="text-right">Miles</th>
          <th class="text-right">Alert</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="8" class="text-center text-grey-7">Loading...</td>
        </tr>
        <tr v-else-if="!logRows.length && !upcomingRows.length">
          <td colspan="8" class="text-center text-grey-7">
            No service history or predictions yet.
          </td>
        </tr>
        <template v-else>
          <tr v-for="row in firstRows" :key="row.key" :class="{ 'text-italic': descending }">
            <td class="text-left">{{ row.date || '—' }}</td>
            <td class="text-left">{{ row.name }}</td>
            <td class="text-right">{{ formatNumber(row.interval_miles) }}</td>
            <td class="text-right">{{ formatNumber(row.interval_months) }}</td>
            <td class="text-right">{{ formatNumber(row.interval_years) }}</td>
            <td class="text-right">{{ descending ? '—' : formatCost(row.cost) }}</td>
            <td class="text-right">{{ formatNumber(row.miles) }}</td>
            <td class="text-right" :class="alertClass(row)">{{ alertText(row) }}</td>
          </tr>
          <tr class="timeline-divider">
            <td colspan="8" class="text-subtitle1 bg-secondary text-center text-black">
              {{
                descending ? 'Predicted future services above' : 'Predicted future services below'
              }}
            </td>
          </tr>
          <tr v-for="row in secondRows" :key="row.key" :class="{ 'text-italic': !descending }">
            <td class="text-left">{{ row.date || '—' }}</td>
            <td class="text-left">{{ row.name }}</td>
            <td class="text-right">{{ formatNumber(row.interval_miles) }}</td>
            <td class="text-right">{{ formatNumber(row.interval_months) }}</td>
            <td class="text-right">{{ formatNumber(row.interval_years) }}</td>
            <td class="text-right">{{ descending ? formatCost(row.cost) : '—' }}</td>
            <td class="text-right">{{ formatNumber(row.miles) }}</td>
            <td class="text-right" :class="alertClass(row)">{{ alertText(row) }}</td>
          </tr>
        </template>
      </tbody>
    </q-markup-table>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { predictFutureServices } from '@/utils/rules'

const props = defineProps({
  profileId: { type: [Number, String], default: null },
  refreshKey: { type: null, default: null },
})

const logRows = ref([])
const upcomingRows = ref([])
const loading = ref(false)
const descending = ref(false)

// Rows with no date always sort last; a descending sort also puts predictions above history.
function sortRows(rows) {
  const sorted = [...rows].sort(byDate)
  if (!descending.value) return sorted
  const dated = sorted.filter((row) => row.date).reverse()
  return [...dated, ...sorted.filter((row) => !row.date)]
}

const sortedLogRows = computed(() => sortRows(logRows.value))
const sortedUpcomingRows = computed(() => sortRows(upcomingRows.value))
const firstRows = computed(() =>
  descending.value ? sortedUpcomingRows.value : sortedLogRows.value,
)
const secondRows = computed(() =>
  descending.value ? sortedLogRows.value : sortedUpcomingRows.value,
)
const error = ref('')
let requestId = 0

function byDate(a, b) {
  if (a.date === b.date) return 0
  if (!a.date) return 1
  if (!b.date) return -1
  return a.date.localeCompare(b.date)
}

// Days from today to the predicted date (negative when overdue); service log rows have no alert.
function alertDays(row) {
  if (row.key.startsWith('log-') || !row.date) return null
  const now = new Date()
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((Date.parse(`${row.date}T00:00:00Z`) - today) / 86400000)
}

function alertText(row) {
  const days = alertDays(row)
  return days === null ? '' : `${days} day${Math.abs(days) === 1 ? '' : 's'}`
}

function alertClass(row) {
  const days = alertDays(row)
  if (days === null) return ''
  return days < 0 ? 'text-negative text-bold' : days <= 30 ? 'text-warning text-bold' : ''
}

function formatNumber(value) {
  return value === null || value === undefined ? '—' : Number(value).toLocaleString()
}

function formatCost(value) {
  return value === null || value === undefined
    ? '—'
    : Number(value).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

async function load() {
  const currentRequest = ++requestId
  error.value = ''

  if (!props.profileId) {
    logRows.value = []
    upcomingRows.value = []
    return
  }

  loading.value = true
  try {
    const autos = await predictFutureServices(props.profileId)
    const autoIds = autos.map((auto) => auto.auto_id)
    const intervalsByService = new Map()
    const upcoming = []

    for (const auto of autos) {
      for (const service of auto.services) {
        intervalsByService.set(`${auto.auto_id}:${service.service_id}`, service)
        upcoming.push({
          key: `service-${auto.auto_id}-${service.service_id}`,
          date: service.next_date,
          auto: auto.label,
          name: service.name,
          miles: service.next_miles,
          interval_miles: service.interval_miles,
          interval_months: service.interval_months,
          interval_years: service.interval_years,
        })
      }
    }

    let logs = []
    if (autoIds.length) {
      const { data, error: logError } = await supabase
        .from('service_log')
        .select(
          'service_log_id, service_id, service_date, service_miles, name, total_cost, service_order!inner(auto_id, is_active)',
        )
        .in('service_order.auto_id', autoIds)
        .eq('service_order.is_active', true)
      if (logError) throw logError
      logs = data || []
    }

    const autoLabels = new Map(autos.map((auto) => [auto.auto_id, auto.label]))
    const history = logs.map((log) => {
      const autoId = log.service_order?.auto_id
      const service = intervalsByService.get(`${autoId}:${log.service_id}`)
      return {
        key: `log-${log.service_log_id}`,
        date: log.service_date ? String(log.service_date).slice(0, 10) : null,
        auto: autoLabels.get(autoId) || '',
        name: log.name || service?.name || '',
        miles: log.service_miles,
        interval_miles: service?.interval_miles ?? null,
        interval_months: service?.interval_months ?? null,
        interval_years: service?.interval_years ?? null,
        cost: log.total_cost,
      }
    })

    if (currentRequest !== requestId) return
    logRows.value = history.sort(byDate)
    upcomingRows.value = upcoming.sort(byDate)
  } catch (err) {
    if (currentRequest !== requestId) return
    error.value = err.message || 'Unable to load service history.'
    logRows.value = []
    upcomingRows.value = []
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

watch(() => [props.profileId, props.refreshKey], load, { immediate: true })
</script>

<style scoped>
.timeline-divider td {
  border-top: 2px solid var(--q-secondary);
}
</style>
