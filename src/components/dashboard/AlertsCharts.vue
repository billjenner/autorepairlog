<template>
  <div>
    <AutoHeading :auto-id="autoId" />
    <q-banner v-if="error" class="bg-negative text-white" rounded>{{ error }}</q-banner>
    <div v-else-if="!charts.length" class="text-grey-7 q-pa-md">
      {{ loading ? 'Loading…' : 'No services to chart for this auto.' }}
    </div>
    <div v-else class="row q-col-gutter-md">
      <div
        v-for="chart in charts"
        :key="chart.service_id"
        class="col-12 col-sm-4 col-md-2 column items-center"
      >
        <div class="text-caption text-grey-7 text-center q-mb-sm">{{ chart.title }}</div>
        <div style="width: 100%; max-width: 180px; height: 150px">
          <Pie :data="chart.data" :options="chartOptions" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { Pie } from 'vue-chartjs'
import { ArcElement, Chart as ChartJS, Legend, Tooltip } from 'chart.js'
import { supabase } from '@/lib/supabase'
import AutoHeading from '@/components/AutoHeading.vue'
import { calculateCurrentMileage, predictFutureServices } from '@/utils/rules'

ChartJS.register(ArcElement, Tooltip, Legend)

const props = defineProps({
  profileId: { type: [Number, String], default: null },
  autoId: { type: [Number, String], default: null },
  scheduleId: { type: [Number, String], default: null },
})

const MS_PER_DAY = 24 * 60 * 60 * 1000
const charts = ref([])
const loading = ref(false)
const error = ref('')
let requestId = 0

const chartOptions = { responsive: true, maintainAspectRatio: false }

function usage(service, milesPerDay) {
  const lastDate = service.last_date || service.estimated_last_date
  const ratios = []
  const remainingDays = []

  // Date based: days since last service / days in the month or year interval.
  const intervalMonths = (service.interval_months || 0) + (service.interval_years || 0) * 12
  if (lastDate && intervalMonths > 0) {
    const last = Date.parse(`${lastDate}T00:00:00Z`)
    const daysSince = (Date.now() - last) / MS_PER_DAY
    const intervalDays = (intervalMonths * 365.25) / 12
    ratios.push(daysSince / intervalDays)
    remainingDays.push(intervalDays - daysSince)
  }

  // Mileage based: estimated current miles - last service miles / mileage interval.
  if (service.interval_miles > 0 && service.last_miles !== null && lastDate) {
    const current = calculateCurrentMileage(service.last_miles, lastDate, milesPerDay)
    if (current !== null) {
      const driven = current - service.last_miles
      ratios.push(driven / service.interval_miles)
      if (milesPerDay > 0) remainingDays.push((service.interval_miles - driven) / milesPerDay)
    }
  }

  if (!ratios.length) return null
  return {
    used: Math.max(0, Math.max(...ratios)),
    remainingDays: remainingDays.length ? Math.min(...remainingDays) : Infinity,
  }
}

function buildChart(service, milesPerDay) {
  const usageInfo = usage(service, milesPerDay)
  if (usageInfo === null) return null
  const { used, remainingDays } = usageInfo
  const percent = Math.round(used * 100)
  const color = used >= 1 ? '#f44336' : used >= 0.9 ? '#ff9800' : '#4caf50'
  return {
    service_id: service.service_id,
    remainingDays,
    title: `${service.name} (${percent}%)`,
    data: {
      labels: ['Interval Used', 'Remaining'],
      datasets: [
        {
          data: [Math.min(used, 1) * 100, Math.max(0, 1 - used) * 100],
          backgroundColor: [color, '#E0E0E0'],
          borderWidth: 2,
          borderColor: '#fff',
        },
      ],
    },
  }
}

async function load() {
  const currentRequest = ++requestId
  error.value = ''
  if (!props.profileId || !props.autoId || !props.scheduleId) {
    charts.value = []
    return
  }

  loading.value = true
  try {
    const [{ data: rows, error: serviceError }, autos] = await Promise.all([
      supabase
        .from('service')
        .select('service_id')
        .eq('schedule_id', props.scheduleId)
        .eq('is_active', true),
      predictFutureServices(props.profileId),
    ])
    if (serviceError) throw serviceError

    const ids = new Set((rows || []).map((row) => row.service_id))
    const auto = autos.find((item) => String(item.auto_id) === String(props.autoId))
    const next = (auto?.services || [])
      .filter((service) => ids.has(service.service_id))
      .map((service) => buildChart(service, auto.miles_per_day))
      .filter(Boolean)
      .sort((a, b) => a.remainingDays - b.remainingDays || 0)

    if (currentRequest === requestId) charts.value = next
  } catch (err) {
    if (currentRequest !== requestId) return
    error.value = err.message || 'Unable to load alerts.'
    charts.value = []
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

watch(() => [props.profileId, props.autoId, props.scheduleId], load, { immediate: true })
</script>
