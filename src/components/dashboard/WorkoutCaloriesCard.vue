<template>
  <q-card flat bordered class="q-mb-md">
    <q-expansion-item
      label="Workout calories burned"
      expand-icon="keyboard_arrow_down"
      expanded-icon="keyboard_arrow_up"
      transition-show="jump-down"
      transition-hide="jump-up"
      @after-show="renderWorkoutChart"
    >
      <q-card-section>
        <q-banner v-if="workoutLogsStore.error" class="bg-negative text-white" rounded>
          {{ workoutLogsStore.error }}
        </q-banner>
        <q-banner v-else-if="!usersStore.currentUser" class="bg-warning text-dark" rounded>
          Sign in to view your workout calories.
        </q-banner>
        <q-banner
          v-else-if="!workoutLogsStore.loading && !workoutCaloriesByDay.length"
          class="bg-grey-2"
        >
          Add workout entries to see your daily calories burned.
        </q-banner>
        <div v-else>
          <div class="workout-calories-chart q-mb-md">
            <canvas ref="workoutCaloriesChart"></canvas>
          </div>
          <hr />
          <div class="row justify-between items-center q-mt-md">
            <q-chip class="resize-chip" color="secondary" text-color="white" square>
              1 year ave: {{ aveWorkoutCalories1Year }}
            </q-chip>
            <q-chip class="resize-chip" color="secondary" text-color="white" square>
              30 days ave: {{ aveWorkoutCalories30Days }}
            </q-chip>
            <q-chip class="resize-chip" color="secondary" text-color="white" square>
              7 days ave: {{ aveWorkoutCalories7Days }}
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
import { useWorkoutLogsStore } from 'stores/workout-logs'

const profileStore = useProfileStore()
const usersStore = useUsersStore()
const workoutLogsStore = useWorkoutLogsStore()
const workoutCaloriesChart = ref(null)
let workoutChart = null

const workoutCaloriesByDay = computed(() => {
  const caloriesByDay = (workoutLogsStore.logs || []).reduce((totals, log) => {
    const date = String(log?.date || '').slice(0, 10)
    const caloriesBurned = Number(log?.calories_burned)

    if (!date || !Number.isFinite(caloriesBurned)) {
      return totals
    }

    totals[date] = (totals[date] || 0) + caloriesBurned
    return totals
  }, {})

  return Object.entries(caloriesByDay)
    .map(([date, caloriesBurned]) => ({ date, caloriesBurned }))
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

function calculateAveWorkoutCalories(daysBack) {
  const days = workoutCaloriesByDay.value
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

  const totalCaloriesSum = periodDays.reduce((sum, day) => {
    return sum + (Number(day.caloriesBurned) || 0)
  }, 0)

  const avg = totalCaloriesSum / periodDays.length
  return Math.round(avg)
}

const aveWorkoutCalories1Year = computed(() => calculateAveWorkoutCalories(365))
const aveWorkoutCalories30Days = computed(() => calculateAveWorkoutCalories(30))
const aveWorkoutCalories7Days = computed(() => calculateAveWorkoutCalories(7))

function destroyWorkoutChart() {
  workoutChart?.destroy()
  workoutChart = null
}

async function renderWorkoutChart() {
  await nextTick()
  destroyWorkoutChart()

  if (!workoutCaloriesChart.value || !workoutCaloriesByDay.value.length) {
    return
  }

  const workoutByDate = Object.fromEntries(
    workoutCaloriesByDay.value.map((day) => [day.date, day.caloriesBurned]),
  )
  const startDateString =
    profileStore.currentProfile?.created_at?.substring(0, 10) ?? workoutCaloriesByDay.value[0].date
  const [startYear, startMonth, startDay] = startDateString.split('-').map(Number)
  const currentDate = new Date(startYear, startMonth - 1, startDay)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const labels = []
  const data = []

  while (currentDate <= today) {
    const year = currentDate.getFullYear()
    const month = String(currentDate.getMonth() + 1).padStart(2, '0')
    const day = String(currentDate.getDate()).padStart(2, '0')
    const dateKey = `${year}-${month}-${day}`

    labels.push(dateKey)
    data.push(workoutByDate[dateKey] || 0)
    currentDate.setDate(currentDate.getDate() + 1)
  }

  workoutChart = new Chart(workoutCaloriesChart.value, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'Calories burned',
          data,
          backgroundColor: 'rgba(255, 112, 67, 0.65)',
          borderColor: 'rgba(255, 081, 0, 1)',
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
          title: {
            display: true,
            text: 'Calories burned',
          },
        },
      },
    },
  })
}

watch(workoutCaloriesByDay, renderWorkoutChart)

onBeforeUnmount(destroyWorkoutChart)
</script>

<style scoped>
.workout-calories-chart {
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
