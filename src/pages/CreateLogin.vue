<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="q-pa-lg" style="width: min(100%, 460px)">
      <div class="text-h5 text-center q-mb-md">Create User</div>

      <q-form @submit.prevent="handleSubmit" class="q-gutter-y-md full-width">
        <q-input
          v-model="fname"
          label="First name"
          outlined
          dense
          autocomplete="given-name"
          :rules="[(val) => !!val || 'First name is required']"
        />

        <q-input
          v-model="lname"
          label="Last name"
          outlined
          dense
          autocomplete="family-name"
          :rules="[(val) => !!val || 'Last name is required']"
        />

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
          autocomplete="off"
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
            label="Create User"
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
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useUsersStore } from 'stores/users'
import { useProfileStore } from 'stores/profile'
import { notifySuccess } from '../utils/notify'

const router = useRouter()
const store = useUsersStore()
const profileStore = useProfileStore()
const $q = useQuasar()

const fname = ref('')
const lname = ref('')
const email = ref('')
const password = ref('')
const showPassword = ref(false)
const message = ref('')
const messageClass = ref('text-positive')
const submitting = ref(false)

async function handleSubmit() {
  if (submitting.value) {
    return
  }

  if (!fname.value.trim() || !lname.value.trim() || !email.value.trim() || !password.value) {
    message.value = 'Please fill in all required fields.'
    messageClass.value = 'text-negative'
    return
  }

  submitting.value = true
  const result = await store.registerUser(email.value, password.value, {
    fname: fname.value.trim(),
    lname: lname.value.trim(),
  })

  if (result) {
    await profileStore.saveProfile(result.user_id, {
      fname: fname.value.trim(),
      lname: lname.value.trim(),
    })
    message.value = `User created for ${store.currentUser?.email}`
    notifySuccess($q, `User created for ${store.currentUser?.email}`)
    messageClass.value = 'text-positive'
    setTimeout(() => router.push('/login'), 2000)
  } else {
    message.value = store.error || 'Unable to save user.'
    messageClass.value = 'text-negative'
  }

  submitting.value = false
}
</script>
