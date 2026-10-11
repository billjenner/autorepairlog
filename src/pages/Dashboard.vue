<template>
  <q-page class="q-pt-md">
    <div class="text-h4 text-center q-mb-md">Dashboard</div>
    <weight-bmi-progress-card />
    <food-calories-card />
    <workout-calories-card />
    <supplement-count-card />
    <hr />
    <data-exports />
  </q-page>
</template>

<script setup>
import { watch } from 'vue'
import { useUsersStore } from 'stores/users'
import { useFoodLogsStore } from 'stores/food-logs'
import { useProfileStore } from 'stores/profile'
import { usesupplementsLogStore } from 'stores/supplements_log'
import { useWorkoutLogsStore } from 'stores/workout-logs'
import { useWeightLogsStore } from 'stores/weight-logs'
import FoodCaloriesCard from 'src/components/dashboard/FoodCaloriesCard.vue'
import SupplementCountCard from 'src/components/dashboard/SupplementCountCard.vue'
import WeightBmiProgressCard from 'src/components/dashboard/WeightBmiProgressCard.vue'
import WorkoutCaloriesCard from 'src/components/dashboard/WorkoutCaloriesCard.vue'
import DataExports from 'src/components/dashboard/DataExports.vue'

const usersStore = useUsersStore()
const foodLogsStore = useFoodLogsStore()
const profileStore = useProfileStore()
const supplementLogsStore = usesupplementsLogStore()
const workoutLogsStore = useWorkoutLogsStore()
const weightLogsStore = useWeightLogsStore()

watch(
  () => usersStore.currentUser?.user_id,
  async (userId) => {
    if (!userId) {
      weightLogsStore.logs = []
      foodLogsStore.logs = []
      workoutLogsStore.logs = []
      supplementLogsStore.logs = []
      profileStore.currentProfile = null
      return
    }

    await Promise.all([
      weightLogsStore.loadWeightLogs(userId),
      foodLogsStore.loadFoodLogs(userId),
      workoutLogsStore.loadWorkoutLogs(userId),
      supplementLogsStore.loadSupplementLogs(userId),
      profileStore.loadCurrentProfile(userId),
    ])
  },
  { immediate: true },
)
</script>
<style scoped>
.data-exports-spacing {
  margin-top: 1rem;
}
hr {
  width: 60%;
  margin-top: 2rem;
  margin-bottom: 2rem;
}
</style>
