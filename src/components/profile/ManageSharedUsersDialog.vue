<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="saving"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="width: 500px; max-width: 90vw">
      <q-card-section class="text-h6">Manage shared users</q-card-section>
      <q-card-section class="q-pt-none">
        <p>
          Both users must add each other’s verified account email for reciprocal sharing. Sharing
          access is not yet enabled in the app.
        </p>
        <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
          {{ error }}
          <template #action>
            <q-btn flat label="Reload" :disable="saving" @click="load" />
          </template>
        </q-banner>
        <q-form class="row items-start q-col-gutter-sm" @submit.prevent="add">
          <div class="col">
            <q-input
              v-model="email"
              type="email"
              label="Email address"
              filled
              dense
              lazy-rules
              :disable="loading || saving || !!error"
              :rules="[(value) => validateShareEmail(value, ownEmail)]"
            />
          </div>
          <div class="col-auto">
            <q-btn
              type="submit"
              color="primary"
              label="Add"
              :loading="saving && !pendingDelete"
              :disable="loading || saving || !!error"
            />
          </div>
        </q-form>
        <div v-if="loading" class="text-grey-7">Loading shared users...</div>
        <div v-else-if="!items.length && !error" class="text-grey-7">No shared users found.</div>
        <q-list v-else separator>
          <q-item v-for="item in items" :key="item.email">
            <q-item-section>{{ item.email }}</q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                :aria-label="`Remove ${item.email}`"
                :disable="saving || !!error"
                @click="pendingDelete = item"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" :disable="saving" v-close-popup />
      </q-card-actions>
    </q-card>

    <q-dialog :model-value="!!pendingDelete" :persistent="saving" @hide="pendingDelete = null">
      <q-card style="min-width: 320px; max-width: 90vw">
        <q-card-section class="text-h6">Remove shared user?</q-card-section>
        <q-card-section>
          Remove {{ pendingDelete?.email }} from your sharing list? This removes your consent to
          reciprocal sharing; it does not delete vehicle records.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" :disable="saving" v-close-popup />
          <q-btn color="negative" label="Remove" :loading="saving" @click="remove" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { onBeforeUnmount, ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import {
  addProfileShare,
  fetchProfileShares,
  groupActiveShares,
  removeProfileShare,
  validateShareEmail,
} from './profileShares'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  profileId: { type: [Number, String], default: null },
  ownEmail: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue'])
const items = ref([])
const email = ref('')
const error = ref('')
const loading = ref(false)
const saving = ref(false)
const pendingDelete = ref(null)
let requestId = 0

async function load() {
  const request = ++requestId
  const profileId = props.profileId
  loading.value = true
  error.value = ''
  try {
    const rows = await fetchProfileShares(supabase, profileId)
    if (request === requestId) items.value = groupActiveShares(rows)
  } catch (err) {
    if (request === requestId) {
      items.value = []
      error.value = `Unable to load shared users: ${err.message}`
    }
  } finally {
    if (request === requestId) loading.value = false
  }
}

async function add() {
  if (saving.value || loading.value || error.value) return
  const request = requestId
  saving.value = true
  try {
    await addProfileShare(supabase, props.profileId, email.value, props.ownEmail)
    if (request !== requestId) return
    email.value = ''
    await load()
  } catch (err) {
    if (request === requestId) error.value = `Unable to add shared user: ${err.message}`
  } finally {
    saving.value = false
  }
}

async function remove() {
  if (!pendingDelete.value || saving.value) return
  const request = requestId
  saving.value = true
  try {
    await removeProfileShare(supabase, props.profileId, pendingDelete.value)
    if (request !== requestId) return
    pendingDelete.value = null
    await load()
  } catch (err) {
    if (request === requestId) {
      pendingDelete.value = null
      error.value = `Unable to remove shared user: ${err.message}`
    }
  } finally {
    saving.value = false
  }
}

watch(
  () => [props.modelValue, props.profileId],
  ([open]) => {
    requestId++
    items.value = []
    email.value = ''
    error.value = ''
    pendingDelete.value = null
    if (open) load()
    else loading.value = false
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  requestId++
})
</script>
