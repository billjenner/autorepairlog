<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="q-pa-lg" style="width: min(100%, 420px)">
      <div class="text-h5 text-center q-mb-md">Login</div>

      <q-form @submit.prevent="handleSubmit" class="q-gutter-y-md full-width">
        <q-input
          v-model="email"
          label="Email"
          type="email"
          outlined
          dense
          autocomplete="email"
          :rules="[(val) => !!val || 'Email is required']"
        />

        <q-input
          v-model="password"
          label="Password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          autocomplete="current-password"
          :rules="[(val) => !!val || 'Password is required']"
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <div class="full-width">
          <q-btn
            color="primary"
            label="Log In"
            type="submit"
            class="full-width"
            :loading="submitting"
            :disable="submitting"
          />
        </div>

        <div class="row justify-center q-gutter-sm q-mt-sm full-width">
          <q-btn flat color="secondary" label="Forgot Password" to="/forgot-password" />
          <q-btn flat color="secondary" label="Create User" to="/create-login" />
        </div>
      </q-form>

      <div v-if="message" class="q-mt-md text-center text-caption" :class="messageClass">
        {{ message }}
      </div>
    </q-card>

    <OfflineConnectionCard v-model="showOfflineDialog" />
  </q-page>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore } from 'stores/users'
import OfflineConnectionCard from 'components/OfflineConnectionCard.vue'

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const message = ref('')
const messageClass = ref('text-positive')
const submitting = ref(false)
const showOfflineDialog = ref(false)

const router = useRouter()
const route = useRoute()
const store = useUsersStore()

async function handleSubmit() {
  if (submitting.value) {
    return
  }

  if (!email.value.trim() || !password.value) {
    message.value = 'Please enter email and password.'
    messageClass.value = 'text-negative'
    return
  }

  submitting.value = true
  const result = await store.loginUser(email.value, password.value)

  if (result) {
    message.value = `Logged in as ${store.currentUser?.email}`
    messageClass.value = 'text-positive'
    const redirectPath = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    router.push(redirectPath)
  } else {
    if (store.isOffline) {
      message.value = 'No data connection.'
      showOfflineDialog.value = true
    } else {
      message.value = store.error || 'Unable to log in.'
    }
    messageClass.value = 'text-negative'
  }

  submitting.value = false
}

watch(
  () => store.offlineAttempts,
  (attempts, previous) => {
    if (attempts > previous) {
      showOfflineDialog.value = true
    }
  },
)

watch(
  () => store.isOffline,
  (isOffline) => {
    if (isOffline) {
      showOfflineDialog.value = true
    }
  },
)
</script>
