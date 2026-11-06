<template>
  <div>
    <AutoHeading :auto-id="autoId" />
    <q-banner v-if="error" class="bg-negative text-white" rounded>{{ error }}</q-banner>
    <div v-else-if="!groups.length && !fuel.logs.length" class="text-grey-7 q-pa-md">
      {{ loading ? 'Loading…' : 'No service or fuel history for this auto.' }}
    </div>
    <div v-else>
      <div class="text-subtitle1 q-mb-md">{{ rangeLabel }}</div>

      <q-card v-if="fuel.logs.length" flat bordered class="q-mb-md">
        <q-card-section class="text-h6 q-pb-none">
          Fuel
          <span class="text-caption text-grey-7">
            · {{ fuel.logs.length }} fill-up{{ fuel.logs.length === 1 ? '' : 's' }}
          </span>
        </q-card-section>
        <q-markup-table flat dense style="table-layout: fixed">
          <colgroup>
            <col style="width: 20%" />
            <col style="width: 20%" />
            <col style="width: 20%" />
            <col style="width: 20%" />
            <col style="width: 20%" />
          </colgroup>
          <thead>
            <tr>
              <th class="text-left">Date</th>
              <th class="text-left">Miles</th>
              <th class="text-right">Gallons</th>
              <th class="text-right">Price/Gal</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in fuel.logs" :key="log.fuel_log_id">
              <td class="text-left">{{ formatDate(log.date) }}</td>
              <td class="text-left">{{ formatNumber(log.mileage) }}</td>
              <td class="text-right">{{ formatGallons(log.gallons) }}</td>
              <td class="text-right">{{ formatPrice(log.price_per_gallon) }}</td>
              <td class="text-right">{{ formatMoney(log.total_cost) }}</td>
            </tr>
            <tr class="text-bold">
              <td colspan="2" class="text-left">Total for Fuel</td>
              <td class="text-right">{{ formatGallons(fuel.gallons) }}</td>
              <td class="text-right"></td>
              <td class="text-right">{{ formatMoney(fuel.total) }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card>

      <q-card v-for="group in groups" :key="group.key" flat bordered class="q-mb-md">
        <q-card-section class="text-h6 q-pb-none">
          {{ group.name }}
          <span class="text-caption text-grey-7">
            · {{ group.logs.length }} time{{ group.logs.length === 1 ? '' : 's' }}
          </span>
        </q-card-section>
        <q-markup-table flat dense style="table-layout: fixed">
          <colgroup>
            <col style="width: 20%" />
            <col style="width: 20%" />
            <col style="width: 20%" />
            <col style="width: 20%" />
            <col style="width: 20%" />
          </colgroup>
          <thead>
            <tr>
              <th class="text-left">Date</th>
              <th class="text-left">Miles</th>
              <th class="text-right">Parts</th>
              <th class="text-right">Labor</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in group.logs" :key="log.service_log_id">
              <td class="text-left">{{ formatDate(log.service_date) }}</td>
              <td class="text-left">{{ formatNumber(log.service_miles) }}</td>
              <td class="text-right">{{ formatMoney(log.parts) }}</td>
              <td class="text-right">{{ formatMoney(log.labor) }}</td>
              <td class="text-right">{{ formatMoney(log.total_cost) }}</td>
            </tr>
            <tr class="text-bold">
              <td colspan="2" class="text-left">Total for {{ group.name }}</td>
              <td class="text-right">{{ formatMoney(group.parts) }}</td>
              <td class="text-right">{{ formatMoney(group.labor) }}</td>
              <td class="text-right">{{ formatMoney(group.total) }}</td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card>

      <div class="row justify-between items-center text-h6 q-pa-md bg-grey-2 rounded-borders">
        <div>Auto total ({{ rangeLabel }})</div>
        <div>{{ formatMoney(autoTotal) }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import AutoHeading from '@/components/AutoHeading.vue'

const props = defineProps({
  autoId: { type: [Number, String], default: null },
})

const groups = ref([])
const fuel = ref({ logs: [], gallons: 0, total: 0 })
const purchaseDate = ref(null)
const loading = ref(false)
const error = ref('')
let requestId = 0

const autoTotal = computed(
  () => groups.value.reduce((sum, group) => sum + group.total, 0) + fuel.value.total,
)
const rangeLabel = computed(
  () =>
    `${purchaseDate.value ? formatDate(purchaseDate.value) : 'Start'} – ${formatDate(new Date())}`,
)

function formatDate(value) {
  if (!value) return '—'
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString()
}

function formatNumber(value) {
  return value === null || value === undefined ? '—' : Number(value).toLocaleString()
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

function formatGallons(value) {
  return value === null || value === undefined ? '—' : Number(value).toFixed(3)
}

function formatPrice(value) {
  return value === null || value === undefined ? '—' : `$${Number(value).toFixed(3)}`
}

// Costs are summed in cents to avoid floating point drift.
function cents(value) {
  return Math.round(Number(value || 0) * 100)
}

async function load() {
  const currentRequest = ++requestId
  error.value = ''
  if (!props.autoId) {
    groups.value = []
    fuel.value = { logs: [], gallons: 0, total: 0 }
    purchaseDate.value = null
    return
  }

  loading.value = true
  try {
    const { data: auto, error: autoError } = await supabase
      .from('auto')
      .select('purchase_date')
      .eq('auto_id', props.autoId)
      .maybeSingle()
    if (autoError) throw autoError

    let query = supabase
      .from('service_log')
      .select(
        'service_log_id, service_id, service_date, service_miles, name, parts, labor, total_cost, service_order!inner(auto_id, is_active)',
      )
      .eq('service_order.auto_id', props.autoId)
      .eq('service_order.is_active', true)
      .lte('service_date', new Date().toISOString())
      .order('service_date', { ascending: true })
    if (auto?.purchase_date) query = query.gte('service_date', auto.purchase_date)

    const { data: logs, error: logError } = await query
    if (logError) throw logError

    let fuelQuery = supabase
      .from('fuel_log')
      .select('fuel_log_id, date, mileage, gallons, price_per_gallon, total_cost')
      .eq('auto_id', props.autoId)
      .lte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true })
    if (auto?.purchase_date) fuelQuery = fuelQuery.gte('date', auto.purchase_date)

    const { data: fuelLogs, error: fuelError } = await fuelQuery
    if (fuelError) throw fuelError

    const fuelSummary = { logs: fuelLogs || [], gallons: 0, total: 0 }
    for (const log of fuelSummary.logs) {
      fuelSummary.gallons += Number(log.gallons || 0)
      fuelSummary.total += cents(log.total_cost) / 100
    }

    const byService = new Map()
    for (const log of logs || []) {
      const group = byService.get(log.service_id) || {
        key: log.service_id,
        name: log.name,
        logs: [],
        parts: 0,
        labor: 0,
        total: 0,
      }
      group.logs.push(log)
      group.parts += cents(log.parts) / 100
      group.labor += cents(log.labor) / 100
      group.total += cents(log.total_cost) / 100
      byService.set(log.service_id, group)
    }

    if (currentRequest !== requestId) return
    purchaseDate.value = auto?.purchase_date || null
    fuel.value = fuelSummary
    groups.value = [...byService.values()].sort((a, b) => a.name.localeCompare(b.name))
  } catch (err) {
    if (currentRequest !== requestId) return
    error.value = err.message || 'Unable to load costs.'
    groups.value = []
    fuel.value = { logs: [], gallons: 0, total: 0 }
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

watch(() => props.autoId, load, { immediate: true })
</script>
