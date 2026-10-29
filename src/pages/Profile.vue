<template>
  <component :is="embedded ? 'div' : 'q-page'" :class="!embedded ? 'q-pa-md' : ''">
    <div :class="!embedded ? 'row justify-center' : ''">
      <div :class="!embedded ? 'col-12 col-md-10 col-lg-8' : ''">
        <component
          :is="embedded ? 'div' : 'q-card'"
          :flat="!embedded"
          :bordered="!embedded"
          :class="!embedded ? 'q-pa-md' : ''"
        >
          <div class="row items-center justify-between q-mx-md q-mb-md">
            <div class="text-h5">Profile</div>
            <q-btn to="/change-password" label="Change Password" color="secondary" flat />
          </div>

          <q-banner v-if="store.error" class="bg-negative text-white q-mb-md" rounded>
            {{ store.error }}
          </q-banner>

          <q-banner
            v-else-if="!usersStore.currentUser"
            class="bg-warning text-dark q-mb-md"
            rounded
          >
            Sign in to view or update your profile.
          </q-banner>

          <q-form @submit.prevent="saveProfile" class="q-gutter-md">
            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="text-subtitle1 q-mb-sm">User details</div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-md-6">
                  <q-input
                    v-model.trim="profile.fname"
                    label="First name"
                    filled
                    dense
                    :disable="!usersStore.currentUser"
                    :rules="[(value) => !!value || 'First name is required.']"
                  />
                </div>

                <div class="col-12 col-md-6">
                  <q-input
                    v-model.trim="profile.lname"
                    label="Last name"
                    filled
                    dense
                    :disable="!usersStore.currentUser"
                    :rules="[(value) => !!value || 'Last name is required.']"
                  />
                </div>
              </div>
            </q-card>

            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="text-subtitle1 q-mb-sm">Preferences</div>
              <div class="column">
                <q-toggle
                  v-model="profile.allow_in_app_notifications"
                  label="Allow in-app notifications"
                  :disable="!usersStore.currentUser"
                />
                <q-toggle
                  v-model="profile.allow_sms_notifications"
                  label="Allow SMS notifications"
                  :disable="!usersStore.currentUser"
                />
              </div>
            </q-card>

            <div class="row justify-end q-gutter-sm">
              <q-btn
                flat
                label="Reload"
                color="secondary"
                :loading="loading"
                :disable="!usersStore.currentUser"
                @click="loadProfile"
              />
              <q-btn
                type="submit"
                color="primary"
                label="Save profile"
                :loading="loading"
                :disable="!usersStore.currentUser"
              />
            </div>
          </q-form>
        </component>
      </div>
    </div>
  </component>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'
import { notifySuccess } from '../utils/notify'

defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
})

const usersStore = useUsersStore()
const store = useProfileStore()
const $q = useQuasar()
const loading = ref(false)
const profile = reactive({
  fname: '',
  lname: '',
  allow_in_app_notifications: true,
  allow_sms_notifications: true,
})

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)

function resetProfile() {
  profile.fname = ''
  profile.lname = ''
  profile.allow_in_app_notifications = true
  profile.allow_sms_notifications = true
}

function setProfile(data) {
  profile.fname = data?.fname ?? usersStore.currentUser?.user_metadata?.fname ?? ''
  profile.lname = data?.lname ?? usersStore.currentUser?.user_metadata?.lname ?? ''
  profile.allow_in_app_notifications = data?.allow_in_app_notifications ?? true
  profile.allow_sms_notifications = data?.allow_sms_notifications ?? true
}

async function loadProfile() {
  if (!currentUserId.value) {
    store.currentProfile = null
    resetProfile()
    return
  }

  loading.value = true
  try {
    const data = await store.loadCurrentProfile(currentUserId.value)
    setProfile(data)
  } finally {
    loading.value = false
  }
}

async function saveProfile() {
  if (!currentUserId.value) {
    return
  }

  loading.value = true
  try {
    const savedProfile = await store.saveProfile(currentUserId.value, profile)

    if (savedProfile) {
      setProfile(savedProfile)
      notifySuccess($q, 'Profile saved successfully.', { color: 'positive' })
    }
  } finally {
    loading.value = false
  }
}

watch(
  () => usersStore.currentUser?.user_id,
  (userId, previousUserId) => {
    if (userId !== previousUserId) {
      loadProfile()
    }
  },
)

onMounted(loadProfile)
</script>
