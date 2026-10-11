<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="q-pa-lg" style="width: min(100%, 420px)">
      <div class="text-h5 text-center q-mb-md">Change Password</div>

      <q-form ref="formRef" @submit.prevent="handleSubmit" class="q-gutter-y-md full-width">
        <q-input
          v-model="currentPassword"
          label="Current Password"
          type="password"
          outlined
          dense
          autocomplete="current-password"
          :rules="[(val) => !!val || 'Current password is required']"
        />

        <q-input
          v-model="newPassword"
          label="New Password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          autocomplete="new-password"
          :rules="[(val) => !!val || 'New password is required']"
        >
          <template #append>
            <q-icon
              :name="showPassword ? 'visibility_off' : 'visibility'"
              class="cursor-pointer"
              @click="showPassword = !showPassword"
            />
          </template>
        </q-input>

        <q-input
          v-model="confirmPassword"
          label="Confirm New Password"
          :type="showPassword ? 'text' : 'password'"
          outlined
          dense
          autocomplete="new-password"
          :rules="[
            (val) => !!val || 'Please confirm your new password',
            (val) => val === newPassword || 'Passwords do not match',
          ]"
        />

        <div class="full-width">
          <q-btn
            color="primary"
            label="Change Password"
            type="submit"
            class="full-width"
            :loading="submitting"
            :disable="submitting"
          />
        </div>
      </q-form>

      <div v-if="message" class="q-mt-md text-center text-caption" :class="messageClass">
        {{ message }}
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { nextTick, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from '../lib/supabase'
import { useUsersStore } from 'stores/users'
import { notifySuccess } from '../utils/notify'

const router = useRouter()
const store = useUsersStore()
const $q = useQuasar()

const formRef = ref(null)
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const message = ref('')
const messageClass = ref('text-positive')
const submitting = ref(false)

async function handleSubmit() {
  if (submitting.value) {
    return
  }

  if (!currentPassword.value || !newPassword.value || newPassword.value !== confirmPassword.value) {
    message.value = 'Please enter matching new passwords.'
    messageClass.value = 'text-negative'
    return
  }

  if (!supabase) {
    message.value = 'Supabase client is not configured.'
    messageClass.value = 'text-negative'
    return
  }

  submitting.value = true
  message.value = ''

  const { data: userData, error: userError } = await supabase.auth.getUser()
  const email = userData?.user?.email || store.currentUser?.email

  if (userError || !email) {
    message.value = userError?.message || 'Unable to identify the current user.'
    messageClass.value = 'text-negative'
    submitting.value = false
    return
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password: currentPassword.value,
  })

  if (signInError) {
    message.value = 'The current password is incorrect.'
    messageClass.value = 'text-negative'
    submitting.value = false
    return
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword.value,
  })

  if (updateError) {
    message.value = updateError.message
    messageClass.value = 'text-negative'
    submitting.value = false
    return
  }

  currentPassword.value = ''
  newPassword.value = ''
  confirmPassword.value = ''
  await nextTick()
  formRef.value?.resetValidation()
  message.value = 'Password changed successfully.'
  messageClass.value = 'text-positive'
  notifySuccess($q, 'Password changed successfully.')
  submitting.value = false
  setTimeout(() => router.push('/login'), 2000)
}
</script>
