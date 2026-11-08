<template>
  <q-dialog
    :model-value="modelValue"
    :persistent="deleting"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="width: 500px; max-width: 90vw">
      <q-card-section class="text-h6">Manage {{ pluralLabel }}</q-card-section>
      <q-card-section>
        <q-banner v-if="error" class="bg-negative text-white q-mb-md" rounded>
          {{ error }}
          <template #action>
            <q-btn flat label="Reload" :disable="deleting" @click="load" />
          </template>
        </q-banner>
        <div v-if="loading" class="text-grey-7">Loading {{ pluralLabel.toLowerCase() }}...</div>
        <div v-else-if="!items.length && !error" class="text-grey-7">
          No {{ pluralLabel.toLowerCase() }} found.
        </div>
        <q-list v-else separator>
          <q-item v-for="item in items" :key="item.name">
            <q-item-section>{{ item.name }}</q-item-section>
            <q-item-section side>
              <q-btn
                flat
                round
                dense
                color="negative"
                icon="delete"
                :aria-label="`Delete ${label.toLowerCase()} ${item.name}`"
                :disable="deleting || !!error"
                @click="pendingDelete = item"
              />
            </q-item-section>
          </q-item>
        </q-list>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Close" :disable="deleting" v-close-popup />
      </q-card-actions>
    </q-card>

    <q-dialog :model-value="!!pendingDelete" :persistent="deleting" @hide="pendingDelete = null">
      <q-card style="min-width: 320px">
        <q-card-section class="text-h6">Delete {{ label.toLowerCase() }}?</q-card-section>
        <q-card-section>
          Remove {{ pendingDelete?.name }} from all matching shared lookup entries for all users?
          Associated {{ otherLabel }} and existing fuel logs will be preserved.
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Cancel" :disable="deleting" v-close-popup />
          <q-btn color="negative" label="Delete" :loading="deleting" @click="remove" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'
import { groupStationValues } from './stationLookup'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  field: { type: String, required: true },
  label: { type: String, required: true },
  pluralLabel: { type: String, required: true },
  otherLabel: { type: String, required: true },
})
const emit = defineEmits(['update:modelValue'])
const items = ref([])
const loading = ref(false)
const deleting = ref(false)
const error = ref('')
const pendingDelete = ref(null)
let requestId = 0

async function load() {
  const request = ++requestId
  loading.value = true
  error.value = ''
  try {
    if (!supabase) throw new Error('Supabase client is not configured.')
    const { data, error: queryError } = await supabase
      .from('station')
      .select('station_id, station, location')
    if (queryError) throw queryError
    if (request === requestId) items.value = groupStationValues(data || [], props.field)
  } catch (err) {
    if (request === requestId) {
      items.value = []
      error.value = `Unable to load ${props.pluralLabel.toLowerCase()}: ${err.message}`
    }
  } finally {
    if (request === requestId) loading.value = false
  }
}

async function remove() {
  if (!pendingDelete.value || deleting.value) return
  deleting.value = true
  error.value = ''
  try {
    if (!supabase) throw new Error('Supabase client is not configured.')
    const ids = pendingDelete.value.ids
    const { data, error: updateError } = await supabase
      .from('station')
      .update({ [props.field]: null })
      .in('station_id', ids)
      .in(props.field, pendingDelete.value.values)
      .select('station_id')
    if (updateError) throw updateError
    if ((data || []).length !== ids.length) {
      throw new Error('Some matching entries could not be updated. Reload and try again.')
    }
    pendingDelete.value = null
    await load()
  } catch (err) {
    pendingDelete.value = null
    error.value = `Unable to delete ${props.label.toLowerCase()}: ${err.message}`
  } finally {
    deleting.value = false
  }
}

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      load()
    } else {
      requestId++
      loading.value = false
      pendingDelete.value = null
      items.value = []
      error.value = ''
    }
  },
  { immediate: true },
)
</script>
