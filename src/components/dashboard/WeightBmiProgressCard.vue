<template>
  <q-card flat bordered class="q-mb-md">
    <q-expansion-item
      label="Weight and BMI progress"
      expand-icon="keyboard_arrow_down"
      expanded-icon="keyboard_arrow_up"
      transition-show="jump-down"
      transition-hide="jump-up"
      @after-show="renderWeightChart"
    >
      <q-card-section>
        <q-banner v-if="weightLogsStore.error" class="bg-negative text-white" rounded>
          {{ weightLogsStore.error }}
        </q-banner>
        <q-banner v-else-if="!usersStore.currentUser" class="bg-warning text-dark" rounded>
          Sign in to view your weight and BMI progress.
        </q-banner>
        <q-banner v-else-if="!weightLogsStore.loading && !weightChartLogs.length" class="bg-grey-2">
          Add weight entries to see your progress chart.
        </q-banner>
        <div v-else>
          <div class="weight-log-chart q-mb-md">
            <canvas ref="weightLogChart"></canvas>
          </div>
          <hr />
          <div class="row justify-between items-center q-mt-md">
            <q-chip class="resize-chip" color="secondary" text-color="white" square>
              1 year ave: {{ aveWeightLoss1Year }}
            </q-chip>
            <q-chip class="resize-chip" color="secondary" text-color="white" square>
              30 days ave: {{ aveWeightLoss30Days }}
            </q-chip>
            <q-chip class="resize-chip" color="secondary" text-color="white" square>
              7 days ave: {{ aveWeightLoss7Days }}
            </q-chip>
          </div>
        </div>
      </q-card-section>
    </q-expansion-item>
  </q-card>
</template>

<script setup>
import { Chart } from 'chart.js/auto'
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useProfileStore } from 'stores/profile'
import { useUsersStore } from 'stores/users'
import { useWeightLogsStore } from 'stores/weight-logs'

const profileStore = useProfileStore()
const usersStore = useUsersStore()
const weightLogsStore = useWeightLogsStore()
const weightLogChart = ref(null)
let weightChart = null

const weightChartLogs = computed(() => {
  return [...(weightLogsStore.logs || [])]
    .filter((log) => log?.date && Number.isFinite(Number(log?.weight)))
    .sort((leftLog, rightLog) => String(leftLog.date).localeCompare(String(rightLog.date)))
})

function getDaysBetween(dateString1, dateString2) {
  if (!dateString1 || !dateString2) return 0
  const [y1, m1, d1] = String(dateString1).slice(0, 10).split('-').map(Number)
  const [y2, m2, d2] = String(dateString2).slice(0, 10).split('-').map(Number)
  if (!y1 || !m1 || !d1 || !y2 || !m2 || !d2) return 0
  const date1 = Date.UTC(y1, m1 - 1, d1)
  const date2 = Date.UTC(y2, m2 - 1, d2)
  return Math.round((date2 - date1) / (1000 * 60 * 60 * 24))
}

function getCurrentLocalDateString() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function calculateAveWeightLoss(daysBack) {
  const logs = weightChartLogs.value
  if (!logs || !logs.length) {
    return '----'
  }

  const todayStr = getCurrentLocalDateString()
  const latestLog = logs[logs.length - 1]
  const latestWeight = Number(latestLog.weight)
  const latestDateStr = String(latestLog.date).slice(0, 10)

  const periodLogs = logs.filter((log) => {
    const logDateStr = String(log.date).slice(0, 10)
    const daysFromToday = getDaysBetween(logDateStr, todayStr)
    return daysFromToday >= 0 && daysFromToday <= daysBack
  })

  if (!periodLogs.length) {
    return '----'
  }

  const oldestLog = periodLogs[0]
  const oldestWeight = Number(oldestLog.weight)
  const oldestDateStr = String(oldestLog.date).slice(0, 10)

  const endDateStr = latestDateStr === todayStr ? latestDateStr : todayStr
  const daysInBetween = getDaysBetween(oldestDateStr, endDateStr)

  if (daysInBetween <= 0) {
    return '----'
  }

  const diff = latestWeight - oldestWeight
  const avg = diff / daysInBetween
  return avg.toFixed(2)
}

const aveWeightLoss1Year = computed(() => calculateAveWeightLoss(365))
const aveWeightLoss30Days = computed(() => calculateAveWeightLoss(30))
const aveWeightLoss7Days = computed(() => calculateAveWeightLoss(7))

const weightAxisBounds = computed(() => {
  const min = Number(profileStore.currentProfile?.goal_weight)
  const startWeight = Number(profileStore.currentProfile?.start_weight)
  const max = startWeight + 5

  if (!Number.isFinite(min) || !Number.isFinite(max) || min >= max) {
    return {}
  }

  return { min, max }
})

function destroyWeightChart() {
  weightChart?.destroy()
  weightChart = null
}

async function renderWeightChart() {
  await nextTick()
  destroyWeightChart()

  if (!weightLogChart.value || !weightChartLogs.value.length) {
    return
  }

  weightChart = new Chart(weightLogChart.value, {
    type: 'line',
    data: {
      labels: weightChartLogs.value.map((log) => log.date),
      datasets: [
        {
          label: 'Weight',
          data: weightChartLogs.value.map((log) => Number(log.weight)),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: false,
          tension: 0.3,
          yAxisID: 'yWeight',
        },
        {
          label: 'BMI',
          data: weightChartLogs.value.map((log) => {
            const bmi = Number(log.bmi)
            return Number.isFinite(bmi) ? bmi : null
          }),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: false,
          tension: 0.3,
          spanGaps: true,
          yAxisID: 'yBMI',
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        yWeight: {
          type: 'linear',
          position: 'left',
          ...weightAxisBounds.value,
          title: {
            display: true,
            text: 'Weight (lbs)',
          },
        },
        yBMI: {
          type: 'linear',
          position: 'right',
          title: {
            display: true,
            text: 'BMI',
          },
          grid: {
            drawOnChartArea: false,
          },
        },
      },
    },
  })
}

watch(weightChartLogs, renderWeightChart)
watch(weightAxisBounds, renderWeightChart)

onBeforeUnmount(destroyWeightChart)
</script>

<style scoped>
.weight-log-chart {
  height: 320px;
}

.resize-chip {
  /* normal size */
}

@media (max-width: 780px) {
  .resize-chip {
    /* styles for small screens */
    font-size: 10px;
    line-height: 1.2;
    padding: 0 8px;
    min-height: 22px;
  }
}
</style>
