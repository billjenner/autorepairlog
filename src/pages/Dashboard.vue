<template>
  <q-page>
    <div class="row justify-center">
      <div class="col-12">
        <q-select
          v-model="selectedScheduleId"
          :options="scheduleOptions"
          label="Auto"
          emit-value
          map-options
          bg-color="warning"
          clearable
          filled
          dense
          class="col-12 col-sm-6"
        />

        <div class="row justify-between items-center q-my-md" style="max-width: 60%; margin-inline: auto">
          <q-btn
            flat
            :color="activeSection === 'alerts' ? 'white' : 'accent'"
            label="Alerts"
            no-caps
            class="text-h6"
            :class="activeSection === 'alerts' ? 'bg-accent' : 'bg-white'"
            @click="activeSection = 'alerts'"
          />
          <q-btn
            flat
            :color="activeSection === 'costs' ? 'white' : 'accent'"
            label="Costs"
            no-caps
            class="text-h6"
            :class="activeSection === 'costs' ? 'bg-accent' : 'bg-white'"
            @click="activeSection = 'costs'"
          />
          <q-btn
            flat
            :color="activeSection === 'exports' ? 'white' : 'accent'"
            label="Exports"
            no-caps
            class="text-h6"
            :class="activeSection === 'exports' ? 'bg-accent' : 'bg-white'"
            @click="activeSection = 'exports'"
          />
        </div>

        <CostsSummary
          v-if="activeSection === 'costs' && selectedSchedule"
          class="q-pa-md"
          :auto-id="selectedSchedule.auto_id"
        />

        <AlertsCharts
          v-if="activeSection === 'alerts' && selectedSchedule"
          class="q-pa-md"
          :profile-id="selectedSchedule.auto?.profile_id"
          :auto-id="selectedSchedule.auto_id"
          :schedule-id="selectedSchedule.schedule_id"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import AlertsCharts from '@/components/AlertsCharts.vue'
import CostsSummary from '@/components/CostsSummary.vue'
import { useServiceStore } from '@/stores/service'
import { templateAutoLabel } from '@/stores/schedule'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'

const serviceStore = useServiceStore()
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const selectedScheduleId = ref(null)
const activeSection = ref('alerts')
const selectedSchedule = computed(() =>
  serviceStore.scheduleOptions.find((s) => s.schedule_id === selectedScheduleId.value),
)

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const scheduleOptions = computed(() =>
  serviceStore.scheduleOptions.map((schedule) => ({
    label: templateAutoLabel(schedule.auto),
    value: schedule.schedule_id,
  })),
)

async function load() {
  if (!currentUserId.value) {
    serviceStore.scheduleOptions = []
    return
  }
  const profile = await profileStore.loadCurrentProfile(currentUserId.value)
  await serviceStore.loadScheduleOptions({
    isAdmin: Number(profile?.admin_level) > 0,
    profileId: profile?.profile_id,
  })
}

watch(
  scheduleOptions,
  (options) => {
    if (selectedScheduleId.value && !options.some((o) => o.value === selectedScheduleId.value)) {
      selectedScheduleId.value = null
    }
    if (!selectedScheduleId.value && options.length === 1) {
      selectedScheduleId.value = options[0].value
    }
  },
  { immediate: true },
)

onMounted(load)
</script>
