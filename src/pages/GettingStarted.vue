<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <div class="text-h4 q-mb-sm">Getting started</div>
        <p class="text-body1">
          Complete these steps to get your Auto Repair Log set up. You can revisit them at any time.
        </p>

        <q-banner v-if="loadError" class="bg-negative text-white q-mb-md" rounded>
          {{ loadError }}
          <template #action>
            <q-btn flat color="white" label="Try again" :disable="loading" @click="loadSetup" />
          </template>
        </q-banner>

        <q-stepper v-model="currentStep" vertical color="primary" animated>
          <q-step
            v-for="step in steps"
            :key="step.id"
            :name="step.id"
            :title="step.title"
            :done="step.complete"
          >
            <p class="q-mb-sm">{{ step.description }}</p>
            <div class="row items-center q-gutter-sm">
              <q-icon
                :name="step.complete ? 'check_circle' : 'radio_button_unchecked'"
                :color="step.complete ? 'positive' : 'warning'"
                size="sm"
              />
              <span>{{ step.complete ? 'Complete' : 'Needs attention' }}</span>
            </div>
            <q-btn
              v-if="step.to"
              class="q-mt-md"
              color="primary"
              :label="step.action"
              :to="step.to"
            />
          </q-step>
        </q-stepper>

        <div class="row justify-end q-mt-md">
          <q-btn
            flat
            color="secondary"
            label="Refresh checklist"
            :loading="loading"
            @click="loadSetup"
          />
        </div>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAutoStore } from '@/stores/auto'
import { useMileageStore } from '@/stores/mileage'
import { useProfileStore } from '@/stores/profile'
import { useScheduleStore } from '@/stores/schedule'
import { useServiceStore } from '@/stores/service'
import { useUsersStore } from '@/stores/users'

const autoStore = useAutoStore()
const mileageStore = useMileageStore()
const profileStore = useProfileStore()
const scheduleStore = useScheduleStore()
const serviceStore = useServiceStore()
const usersStore = useUsersStore()

const loading = ref(false)
const loadError = ref('')
const hasAuto = ref(false)
const hasMileage = ref(false)
const hasSchedule = ref(false)
const services = ref([])
const maintenanceEnabled = ref(true)
const currentStep = ref(1)

const steps = computed(() => {
  const setupSteps = [
    {
      id: 1,
      title: 'Set up an auto',
      description:
        'Add an auto to your profile, or make sure an auto shared with you is available here.',
      complete: hasAuto.value,
      to: '/auto',
      action: 'Go to Autos',
    },
    {
      id: 2,
      title: 'Record initial and latest mileage',
      description:
        'At least one associated auto needs an initial mileage and an active latest mileage record.',
      complete: hasMileage.value,
      to: '/auto',
      action: 'Add mileage in Autos',
    },
    {
      id: 3,
      title: 'Choose your tracking preferences',
      description: 'Review your preferences to use fuel tracking, maintenance tracking, or both.',
      complete: true,
      to: '/profile',
      action: 'Review Profile',
    },
  ]

  if (maintenanceEnabled.value) {
    const hasServiceWithLastValue = services.value.some(hasValue)
    const allServicesHaveLastValue = services.value.length > 0 && services.value.every(hasValue)

    setupSteps.push(
      {
        id: 4,
        title: 'Create a schedule',
        description: 'Create at least one schedule for an auto associated with your profile.',
        complete: hasSchedule.value,
        to: '/schedule',
        action: 'Go to Schedules',
      },
      {
        id: 5,
        title: 'Record a last service',
        description: 'Enter the last mileage or date for at least one scheduled service.',
        complete: hasServiceWithLastValue,
        to: '/schedule',
        action: 'Update Last Service',
      },
      {
        id: 6,
        title: 'Complete service history',
        description: 'Enter a last mileage or date for every active scheduled service.',
        complete: allServicesHaveLastValue,
        to: '/schedule',
        action: 'Review Services',
      },
    )
  }

  return setupSteps
})

function hasValue(service) {
  const miles = service.last_miles
  return (
    (miles !== null && miles !== undefined && miles !== '' && !Number.isNaN(Number(miles))) ||
    Boolean(service.last_date)
  )
}

function hasMileageValue(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value))
}

async function loadSetup() {
  const userId = usersStore.currentUser?.user_id
  if (!userId) {
    loadError.value = 'Sign in to check your setup.'
    return
  }

  loading.value = true
  loadError.value = ''
  try {
    const profile =
      profileStore.currentProfile?.user_id === userId
        ? profileStore.currentProfile
        : await profileStore.loadCurrentProfile(userId)
    if (!profile) {
      loadError.value = profileStore.error || 'Unable to load your profile.'
      return
    }

    maintenanceEnabled.value = profile.use_maintenance_tracking !== false
    const autos = await autoStore.loadAuto(profile.profile_id)
    if (autoStore.error) {
      loadError.value = `Unable to load associated autos: ${autoStore.error}`
      return
    }
    hasAuto.value = autos.length > 0

    const autoIds = autos.map((auto) => auto.auto_id)
    const mileageRecords = await mileageStore.loadMileage(autoIds)
    if (mileageStore.error) {
      loadError.value = `Unable to load mileage records: ${mileageStore.error}`
      return
    }
    hasMileage.value = autos.some((auto) => {
      const autoRecords = mileageRecords.filter((record) => record.auto_id === auto.auto_id)
      const hasInitial = hasMileageValue(auto.purchase_mileage) || autoRecords.length > 0
      return hasInitial && autoRecords.length > 0
    })

    hasSchedule.value = false
    services.value = []
    if (maintenanceEnabled.value) {
      const [scheduleOptions, schedules] = await Promise.all([
        serviceStore.loadScheduleOptions({ profileId: profile.profile_id }),
        scheduleStore.loadSchedules({ profileId: profile.profile_id }),
      ])
      if (serviceStore.error) {
        loadError.value = `Unable to load schedules: ${serviceStore.error}`
        return
      }
      if (scheduleStore.error) {
        loadError.value = `Unable to load scheduled services: ${scheduleStore.error}`
        return
      }

      hasSchedule.value = scheduleOptions.length > 0
      const scheduleIds = new Set(scheduleOptions.map((schedule) => String(schedule.schedule_id)))
      services.value = schedules
        .filter((schedule) => scheduleIds.has(String(schedule.schedule_id)))
        .flatMap((schedule) => schedule.service || [])
    }

    const firstIncomplete = steps.value.find((step) => !step.complete)
    currentStep.value = firstIncomplete?.id ?? steps.value[steps.value.length - 1].id
  } finally {
    loading.value = false
  }
}

onMounted(loadSetup)
</script>
