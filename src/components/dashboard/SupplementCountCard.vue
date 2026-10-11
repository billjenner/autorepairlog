<template>
  <q-card flat bordered class="q-mb-md">
    <q-expansion-item
      label="Daily Supplements"
      expand-icon="keyboard_arrow_down"
      expanded-icon="keyboard_arrow_up"
      transition-show="jump-down"
      transition-hide="jump-up"
      @after-show="renderSupplementChart"
    >
      <q-card-section>
        <q-banner v-if="supplementLogsStore.error" class="bg-negative text-white" rounded>
          {{ supplementLogsStore.error }}
        </q-banner>
        <q-banner v-else-if="!usersStore.currentUser" class="bg-warning text-dark" rounded>
          Sign in to view your daily supplements.
        </q-banner>
        <q-banner
          v-else-if="!supplementLogsStore.loading && !supplementCountsByDay.length"
          class="bg-grey-2"
        >
          Add supplement entries to see your daily supplement count.
        </q-banner>
        <div v-else>
          <div class="supplement-count-chart q-mb-md">
            <canvas ref="supplementCountChart"></canvas>
          </div>
          <hr />
          <div class="row justify-between items-center q-mt-md">
            <q-chip class="resize-chip" color="secondary" text-color="white" square>
              1 year ave: {{ aveSupplementCount1Year }}
            </q-chip>
            <q-chip class="resize-chip" color="secondary" text-color="white" square>
              30 days ave: {{ aveSupplementCount30Days }}
            </q-chip>
            <q-chip class="resize-chip" color="secondary" text-color="white" square>
              7 days ave: {{ aveSupplementCount7Days }}
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
import { usesupplementsLogStore } from 'stores/supplements_log'
import { useUsersStore } from 'stores/users'

const profileStore = useProfileStore()
const supplementLogsStore = usesupplementsLogStore()
const usersStore = useUsersStore()
const supplementCountChart = ref(null)
let supplementChart = null

const supplementCountsByDay = computed(() => {
  const countsByDay = (supplementLogsStore.logs || []).reduce((counts, log) => {
    const date = String(log?.date || '').slice(0, 10)

    if (!date || !log?.supplement_log_id) {
      return counts
    }

    counts[date] = (counts[date] || 0) + 1
    return counts
  }, {})

  return Object.entries(countsByDay)
    .map(([date, supplementCount]) => ({ date, supplementCount }))
    .sort((leftDay, rightDay) => leftDay.date.localeCompare(rightDay.date))
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

function calculateAveSupplementCount(daysBack) {
  const days = supplementCountsByDay.value
  if (!days || !days.length) {
    return '----'
  }

  const todayStr = getCurrentLocalDateString()

  const periodDays = days.filter((day) => {
    const dayDateStr = String(day.date).slice(0, 10)
    const daysFromToday = getDaysBetween(dayDateStr, todayStr)
    return daysFromToday >= 0 && daysFromToday <= daysBack
  })

  if (!periodDays.length) {
    return '----'
  }

  const totalCountSum = periodDays.reduce((sum, day) => {
    return sum + (Number(day.supplementCount) || 0)
  }, 0)

  const avg = totalCountSum / periodDays.length
  return Math.round(avg)
}

const aveSupplementCount1Year = computed(() => calculateAveSupplementCount(365))
const aveSupplementCount30Days = computed(() => calculateAveSupplementCount(30))
const aveSupplementCount7Days = computed(() => calculateAveSupplementCount(7))

function destroySupplementChart() {
  supplementChart?.destroy()
  supplementChart = null
}

async function renderSupplementChart() {
  await nextTick()
  destroySupplementChart()

  if (!supplementCountChart.value || !supplementCountsByDay.value.length) {
    return
  }

  const supplementByDate = Object.fromEntries(
    supplementCountsByDay.value.map((day) => [day.date, day.supplementCount]),
  )
  const firstDate = new Date(profileStore.currentProfile?.created_at)

  if (Number.isNaN(firstDate.getTime())) {
    console.error('Invalid profile creation date:', profileStore.currentProfile?.created_at)
    return
  }

  firstDate.setHours(0, 0, 0, 0)

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const labels = []
  const data = []
  const currentDate = new Date(firstDate)

  while (currentDate <= today) {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`

    labels.push(dateKey)
    data.push(supplementByDate[dateKey] || 0)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  supplementChart = new Chart(supplementCountChart.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Supplement Count',
          data,
          backgroundColor: 'rgba(153, 102, 255, 0.7)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0,
          },
          title: {
            display: true,
            text: 'Supplement Count',
          },
        },
      },
    },
  })
}

watch(supplementCountsByDay, renderSupplementChart)

onBeforeUnmount(destroySupplementChart)
</script>

<style scoped>
.supplement-count-chart {
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
