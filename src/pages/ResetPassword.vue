<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="q-pa-lg" style="width: min(100%, 460px)">
      <div class="text-h5 text-center q-mb-md">Reset Password</div>

      <!-- Verifying reset link -->
      <div v-if="isLoading" class="text-center q-pa-md">
        <q-spinner color="primary" size="40px" />
        <div class="q-mt-md">Verifying password reset link...</div>
      </div>

      <!-- Invalid / expired reset link -->
      <div v-else-if="errorText" class="text-center">
        <div class="text-negative q-mb-md">
          {{ errorText }}
        </div>

        <q-btn
          color="primary"
          label="Request New Reset Link"
          @click="router.push('/forgot-password')"
        />
      </div>

      <!-- Password reset form -->
      <q-form v-else-if="isReady" class="q-gutter-md" @submit.prevent="handleReset">
        <q-input
          v-model="newPassword"
          label="New password"
          type="password"
          outlined
          dense
          autocomplete="new-password"
          :rules="[
            (val) => !!val || 'Password is required',
            (val) => val.length >= 8 || 'Password must be at least 8 characters',
          ]"
        />

        <q-input
          v-model="confirmPassword"
          label="Confirm password"
          type="password"
          outlined
          dense
          autocomplete="new-password"
          :rules="[
            (val) => !!val || 'Please confirm your password',
            (val) => val === newPassword || 'Passwords do not match',
          ]"
        />

        <q-btn
          color="primary"
          label="Reset Password"
          type="submit"
          class="full-width"
          :loading="isSaving"
        />
      </q-form>

      <!-- Status -->
      <div v-if="statusText" class="q-mt-md text-center" :class="statusClass">
        {{ statusText }}
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { supabase } from '../lib/supabase'

const router = useRouter()
const $q = useQuasar()

const isLoading = ref(true)
const isSaving = ref(false)
const isReady = ref(false)

const newPassword = ref('')
const confirmPassword = ref('')

const errorText = ref('')
const statusText = ref('')
const statusClass = ref('text-positive')

// --------------------------------------------------
// Verify recovery session
// --------------------------------------------------

onMounted(async () => {
  console.log('[ResetPassword] mounted')
  console.log('[ResetPassword] URL:', window.location.href)

  try {
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      throw error
    }

    console.log('[ResetPassword] Session exists:', !!session)

    if (!session) {
      errorText.value =
        'The password reset link could not be verified. Please request a new reset link.'

      return
    }

    // We have a valid Supabase session.
    isReady.value = true
  } catch (err) {
    console.error('[ResetPassword] Recovery initialization failed:', err)

    errorText.value = err?.message || 'Unable to verify the password reset link.'
  } finally {
    isLoading.value = false
  }
})

// --------------------------------------------------
// Update password
// --------------------------------------------------

async function handleReset() {
  statusText.value = ''

  if (!newPassword.value) {
    statusText.value = 'Please enter a new password.'
    statusClass.value = 'text-negative'
    return
  }

  if (newPassword.value.length < 8) {
    statusText.value = 'Password must be at least 8 characters.'
    statusClass.value = 'text-negative'
    return
  }

  if (newPassword.value !== confirmPassword.value) {
    statusText.value = 'Passwords do not match.'
    statusClass.value = 'text-negative'
    return
  }

  isSaving.value = true

  try {
    console.log('[ResetPassword] Updating password...')

    const { error } = await supabase.auth.updateUser({
      password: newPassword.value,
    })

    if (error) {
      throw error
    }

    console.log('[ResetPassword] Password updated successfully')

    statusText.value = 'Your password has been successfully reset.'

    statusClass.value = 'text-positive'

    $q.notify({
      type: 'positive',
      message: 'Password reset successfully!',
    })

    setTimeout(() => {
      router.push('/login')
    }, 1500)
  } catch (err) {
    console.error('[ResetPassword] Password update failed:', err)

    statusText.value =
      err?.message || 'Unable to reset your password. Please request a new reset link.'

    statusClass.value = 'text-negative'
  } finally {
    isSaving.value = false
  }
}
</script>
