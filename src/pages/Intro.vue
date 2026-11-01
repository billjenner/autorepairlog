<template>
  <q-page class="column items-center q-px-md q-py-lg">
    <img
      src="/AutoRepairLog.png"
      alt="Auto Repair Log"
      style="
        border-radius: 12px;
        max-width: 100%;
        width: 40%;
        margin-top: 32px;
        margin-bottom: 12px;
      "
    />

    <h5
      style="
        max-width: 720px;
        width: 60%;
        margin: 32px auto 32px;
        text-align: justify;
        font-size: 1.2rem;
        line-height: 1.6;
      "
    >
      <strong>Auto Repair Log</strong> - Track your Auto records, manage maintenance and repair schedules all in one organized dashboard. Stay ahead with a clear view of upcoming service needs.
    </h5>

    <div class="q-pa-md text-center" style="max-width: 720px; width: 100%">
      <q-btn
        color="secondary"
        label="Let's Go!"
        :loading="routing"
        style="margin-top: 8px"
        @click="handleLetsGo"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useRouter } from 'vue-router'
import { useProfileStore } from '@/stores/profile'
import { useServiceStore } from '@/stores/service'
import { useUsersStore } from '@/stores/users'

const $q = useQuasar()
const router = useRouter()
const profileStore = useProfileStore()
const serviceStore = useServiceStore()
const usersStore = useUsersStore()
const routing = ref(false)

async function handleLetsGo() {
  if (!usersStore.currentUser?.email) {
    await router.push('/login')
    return
  }

  routing.value = true
  try {
    const userId = usersStore.currentUser.user_id
    const profile =
      profileStore.currentProfile?.user_id === userId
        ? profileStore.currentProfile
        : await profileStore.loadCurrentProfile(userId)
    const schedules = await serviceStore.loadDashboardScheduleOptions({
      isAdmin: Number(profile?.admin_level) > 0,
      profileId: profile?.profile_id,
    })

    if (schedules === null) {
      console.error('[Intro] dashboard availability check failed:', serviceStore.error)
      $q.notify({
        type: 'negative',
        message: 'Unable to check Dashboard availability. Continuing to Auto.',
        timeout: 7000,
      })
    }

    await router.push(schedules?.length ? '/dashboard' : '/auto')
  } finally {
    routing.value = false
  }
}
</script>
