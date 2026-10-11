<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="q-pa-lg" style="width: min(100%, 460px)">
      <div class="text-h5 text-center q-mb-md">Forgot Password</div>

      <q-form @submit.prevent="handleSubmit" class="q-gutter-md">
        <q-input
          v-model="email"
          label="Enter email"
          type="email"
          outlined
          dense
          autocomplete="email"
          :rules="[(val) => !!val || 'Email is required']"
        />

        <q-btn color="primary" label="Send Reset Link" type="submit" class="full-width" />
      </q-form>

      <div v-if="message" class="q-mt-md text-center" :class="messageClass">
        {{ message }}
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUsersStore } from 'stores/users'
import { notifySuccess } from '../utils/notify'

const router = useRouter()
const store = useUsersStore()
const $q = useQuasar()

const email = ref('')
const message = ref('')
const messageClass = ref('text-positive')

async function handleSubmit() {
  if (!email.value.trim()) {
    message.value = 'Please enter your email.'
    messageClass.value = 'text-negative'
    return
  }

  const result = await store.recoverPassword(email.value)

  if (!result) {
    message.value = store.error || 'Unable to send password reset email right now.'
    messageClass.value = 'text-negative'
    return
  }

  notifySuccess($q, `A password reset link was sent to ${result.email}`, {
    timeout: 30000,
    actions: [
      {
        label: 'X',
        color: 'white',
        handler: () => {},
      },
    ],
  })
  setTimeout(() => router.push('/login'), 2000)
}
</script>
