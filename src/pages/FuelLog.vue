<template>
  <q-page>
    <div class="row justify-center">
      <div class="col-12">
        <q-select
          ref="autoSelectRef"
          v-model="selectedAutoId"
          :options="autoOptions"
          label="Auto"
          emit-value
          map-options
          bg-color="warning"
          clearable
          filled
          dense
          lazy-rules
          :disable="showForm"
          :rules="[(value) => !showForm || !!value || 'Select an auto.']"
          class="col-12 col-sm-6"
        />

        <q-card flat bordered>
          <div class="row items-center justify-between q-mx-md q-my-md q-col-gutter-sm">
            <div class="col row items-center">
              <div class="text-h5">Fuel Log</div>
            </div>
            <q-input
              v-model="searchText"
              dense
              outlined
              clearable
              debounce="200"
              placeholder="Search fuel log"
              class="col-12 col-md-4"
              style="width: 100%; max-width: 400px"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
            <div class="col-auto">
              <q-btn
                v-if="!showForm"
                color="primary"
                label="Add Fuel"
                :disable="!usersStore.currentUser"
                @click="toggleForm"
              />
            </div>
          </div>

          <q-banner v-if="fuelLogStore.error" class="bg-negative text-white q-mb-md" rounded>
            {{ fuelLogStore.error }}
          </q-banner>

          <q-banner
            v-else-if="!usersStore.currentUser"
            class="bg-warning text-dark q-mb-md"
            rounded
          >
            Sign in to manage fuel logs.
          </q-banner>

          <q-form v-if="showForm" @submit.prevent="saveFuelLog" class="q-mt-md q-gutter-md">
            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="text-subtitle1 q-mb-sm">
                {{ editingFuelLogId ? 'Edit fuel log' : 'Fuel details' }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-input
                    :model-value="selectedAutoLabel"
                    label="Auto"
                    readonly
                    filled
                    dense
                    hint="Change the auto using the selector above."
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.date"
                    type="date"
                    label="Date"
                    filled
                    dense
                    :rules="[(value) => !!value || 'Enter a date.']"
                    lazy-rules
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.mileage"
                    type="number"
                    label="Mileage"
                    min="0"
                    step="1"
                    clearable
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="form.fuel_type" label="Fuel type" clearable filled dense />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.gallons"
                    type="number"
                    label="Gallons"
                    min="0"
                    step="0.001"
                    clearable
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.price_per_gallon"
                    type="number"
                    label="Price per gallon"
                    min="0"
                    step="0.001"
                    clearable
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.total_cost"
                    type="number"
                    label="Total cost"
                    min="0"
                    step="0.01"
                    clearable
                    filled
                    dense
                    hint="Calculated from gallons and price when left blank."
                  />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="form.station" label="Station" clearable filled dense />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input v-model="form.location" label="Location" clearable filled dense />
                </div>
                <div class="col-12">
                  <q-toggle v-model="form.is_full_tank" dense label="Full tank" />
                </div>
                <div class="col-12">
                  <q-toggle v-model="showNotes" dense label="Notes" />
                </div>
                <div v-if="showNotes" class="col-12">
                  <notes-editor v-model="form.notes" />
                </div>
              </div>
            </q-card>

            <div class="row justify-end q-gutter-sm">
              <q-btn
                v-if="editingFuelLogId"
                flat
                color="negative"
                label="Delete fuel log"
                class="q-mr-auto"
                @click="requestDeleteEditedFuelLog"
              />
              <q-btn flat label="Cancel" @click="resetForm" />
              <q-btn
                type="submit"
                color="primary"
                class="q-mr-md"
                :label="editingFuelLogId ? 'Update fuel log' : 'Save fuel log'"
                :loading="fuelLogStore.loading"
                :disable="!hasRequiredFields"
              />
            </div>
          </q-form>

          <q-table
            class="q-mt-md"
            :rows="visibleFuelLogs"
            :columns="columns"
            :loading="fuelLogStore.loading"
            :pagination="{ rowsPerPage: 25 }"
            :rows-per-page-options="[10, 25, 50, 0]"
            row-key="fuel_log_id"
            flat
            bordered
            dense
            table-header-class="bg-accent text-white"
            no-data-label="No fuel log records yet."
          >
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  flat
                  dense
                  color="accent"
                  label="Notes"
                  :disable="!props.row.notes?.trim()"
                  @click="selectedNotes = props.row.notes"
                />
                <q-btn flat dense color="primary" label="Edit" @click="editFuelLog(props.row)" />
              </q-td>
            </template>
          </q-table>

          <schedule-notes-dialog v-model="notesDialogOpen" :notes="selectedNotes" />

          <q-dialog v-model="confirmDeleteOpen">
            <q-card style="min-width: 320px">
              <q-card-section class="text-h6">Delete fuel log?</q-card-section>
              <q-card-section>This removes the fuel log from your list.</q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" @click="pendingDeleteId = null" />
                <q-btn
                  label="Delete"
                  color="negative"
                  :loading="fuelLogStore.loading"
                  @click="deleteFuelLog"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </q-card>
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import NotesEditor from '@/components/NotesEditor.vue'
import ScheduleNotesDialog from '@/components/schedule/ScheduleNotesDialog.vue'
import { useAutoStore } from '@/stores/auto'
import { useFuelLogStore } from '@/stores/fuelLog'
import { templateAutoLabel } from '@/stores/schedule'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const autoStore = useAutoStore()
const fuelLogStore = useFuelLogStore()
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const showForm = ref(false)
const showNotes = ref(false)
const editingFuelLogId = ref(null)
const selectedAutoId = ref(null)
const autoSelectRef = ref(null)
const pendingDeleteId = ref(null)
const selectedNotes = ref('')
const searchText = ref('')
const form = reactive(createEmptyForm())

const notesDialogOpen = computed({
  get: () => Boolean(selectedNotes.value),
  set: (open) => {
    if (!open) {
      selectedNotes.value = ''
    }
  },
})
const confirmDeleteOpen = computed({
  get: () => Boolean(pendingDeleteId.value),
  set: (open) => {
    if (!open) {
      pendingDeleteId.value = null
    }
  },
})

const money = (value) => (value === null || value === undefined ? '—' : Number(value).toFixed(2))

const columns = [
  {
    name: 'date',
    label: 'Date',
    field: (row) => (row.date ? String(row.date).slice(0, 10) : null),
    format: (value) => value || '—',
    align: 'left',
    sortable: true,
  },
  {
    name: 'mileage',
    label: 'Mileage',
    field: 'mileage',
    format: (value) =>
      value === null || value === undefined ? '—' : Number(value).toLocaleString(),
    align: 'right',
    sortable: true,
  },
  {
    name: 'gallons',
    label: 'Gallons',
    field: 'gallons',
    format: (value) => (value === null || value === undefined ? '—' : Number(value).toFixed(3)),
    align: 'right',
    sortable: true,
  },
  {
    name: 'price_per_gallon',
    label: 'Price/Gal',
    field: 'price_per_gallon',
    format: (value) =>
      value === null || value === undefined ? '—' : `$${Number(value).toFixed(3)}`,
    align: 'right',
    sortable: true,
  },
  {
    name: 'total_cost',
    label: 'Total Cost',
    field: 'total_cost',
    format: (value) => (value === null || value === undefined ? '—' : `$${money(value)}`),
    align: 'right',
    sortable: true,
  },
  {
    name: 'fuel_type',
    label: 'Fuel Type',
    field: 'fuel_type',
    format: (value) => value || '—',
    align: 'left',
    sortable: true,
  },
  {
    name: 'station',
    label: 'Station',
    field: 'station',
    format: (value) => value || '—',
    align: 'left',
    sortable: true,
  },
  {
    name: 'location',
    label: 'Location',
    field: 'location',
    format: (value) => value || '—',
    align: 'left',
    sortable: true,
  },
  {
    name: 'is_full_tank',
    label: 'Full Tank',
    field: 'is_full_tank',
    format: (value) => (value ? 'Yes' : 'No'),
    align: 'left',
    sortable: true,
  },
  { name: 'actions', label: '', field: 'fuel_log_id', align: 'right' },
]

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const autoOptions = computed(() =>
  autoStore.auto.map((auto) => ({
    label: templateAutoLabel(auto),
    value: auto.auto_id,
  })),
)
const selectedAutoLabel = computed(
  () => autoOptions.value.find((option) => option.value === selectedAutoId.value)?.label || '—',
)
const hasRequiredFields = computed(() => Boolean(selectedAutoId.value) && Boolean(form.date))
const visibleFuelLogs = computed(() => {
  if (!selectedAutoId.value) {
    return []
  }

  const term = searchText.value.trim().toLowerCase()
  return fuelLogStore.fuelLogs.filter(
    (item) =>
      item.auto_id === selectedAutoId.value &&
      (!term ||
        Object.values(item).some(
          (value) =>
            value !== null &&
            typeof value !== 'object' &&
            String(value).toLowerCase().includes(term),
        )),
  )
})

function createEmptyForm() {
  return {
    auto_id: null,
    date: new Date().toISOString().slice(0, 10),
    mileage: null,
    gallons: null,
    price_per_gallon: null,
    total_cost: null,
    fuel_type: '',
    station: '',
    location: '',
    is_full_tank: true,
    notes: '',
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  editingFuelLogId.value = null
  showNotes.value = false
  showForm.value = false
}

function toggleForm() {
  if (showForm.value) {
    resetForm()
    return
  }

  if (!selectedAutoId.value && autoOptions.value.length === 1) {
    selectedAutoId.value = autoOptions.value[0].value
  }
  if (!autoOptions.value.some((option) => option.value === selectedAutoId.value)) {
    $q.notify({ type: 'negative', message: 'Select an active auto before adding fuel.' })
    autoSelectRef.value?.validate()
    return
  }
  Object.assign(form, { ...createEmptyForm(), auto_id: selectedAutoId.value })
  showForm.value = true
}

function editFuelLog(entry) {
  Object.assign(form, {
    auto_id: entry.auto_id,
    date: entry.date ? String(entry.date).slice(0, 10) : '',
    mileage: entry.mileage ?? null,
    gallons: entry.gallons ?? null,
    price_per_gallon: entry.price_per_gallon ?? null,
    total_cost: entry.total_cost ?? null,
    fuel_type: entry.fuel_type || '',
    station: entry.station || '',
    location: entry.location || '',
    is_full_tank: Boolean(entry.is_full_tank),
    notes: entry.notes || '',
  })
  selectedAutoId.value = entry.auto_id
  editingFuelLogId.value = entry.fuel_log_id
  showNotes.value = Boolean(entry.notes)
  showForm.value = true
}

function requestDeleteEditedFuelLog() {
  if (editingFuelLogId.value) {
    pendingDeleteId.value = editingFuelLogId.value
  }
}

async function load() {
  if (!currentUserId.value) {
    autoStore.auto = []
    fuelLogStore.fuelLogs = []
    return
  }

  const profile = await profileStore.loadCurrentProfile(currentUserId.value)
  const autos = await autoStore.loadAuto(profile?.profile_id)
  await fuelLogStore.loadFuelLogs(autos.map((auto) => auto.auto_id))
}

async function saveFuelLog() {
  if (!(await autoSelectRef.value?.validate()) || !hasRequiredFields.value) {
    return
  }

  const isEditing = Boolean(editingFuelLogId.value)
  const saved = isEditing
    ? await fuelLogStore.updateFuelLog(editingFuelLogId.value, form)
    : await fuelLogStore.createFuelLog(form)

  if (!saved) {
    return
  }

  notifySuccess($q, `Fuel log ${isEditing ? 'updated' : 'saved'} successfully.`, {
    color: 'positive',
  })
  resetForm()
}

async function deleteFuelLog() {
  const fuelLogId = pendingDeleteId.value
  if (!fuelLogId) {
    return
  }

  if (await fuelLogStore.deleteFuelLog(fuelLogId)) {
    pendingDeleteId.value = null
    if (editingFuelLogId.value === fuelLogId) {
      resetForm()
    }
    notifySuccess($q, 'Fuel log deleted successfully.', { color: 'negative' })
  }
}

watch(selectedAutoId, (autoId) => {
  if (showForm.value) {
    form.auto_id = autoId
  }
})
watch(
  autoOptions,
  (options) => {
    if (selectedAutoId.value && !options.some((o) => o.value === selectedAutoId.value)) {
      selectedAutoId.value = null
    }
    if (!selectedAutoId.value && options.length === 1) {
      selectedAutoId.value = options[0].value
    }
  },
  { immediate: true },
)
watch(currentUserId, load)
onMounted(load)
</script>
