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
              class="col-12 col-md-4 service-list-search"
              style="width: 100%; max-width: 400px"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
            <div class="col-auto service-list-action">
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
            v-if="!fuelLogStore.error && !usersStore.currentUser"
            class="bg-warning text-dark q-mb-md"
            rounded
          >
            Sign in to manage fuel logs.
          </q-banner>
          <q-banner v-if="fuelLogStore.stationError" class="bg-warning text-dark q-mb-md" rounded>
            {{ fuelLogStore.stationError }}
          </q-banner>

          <q-form v-if="showForm" @submit.prevent="saveFuelLog" class="q-mt-md q-gutter-md">
            <q-banner v-if="priorMileageError" class="bg-negative text-white" rounded>
              {{ priorMileageError }}
              <template #action>
                <q-btn flat label="Retry" @click="prefillPriorMileage" />
              </template>
            </q-banner>
            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="text-subtitle1 q-mb-sm">
                {{ editingFuelLogId ? 'Edit fuel log' : 'Fuel details' }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-4">
                  <q-input
                    :model-value="selectedAutoLabel"
                    label="Auto"
                    readonly
                    filled
                    dense
                    hint="Change the auto using the selector above."
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    :model-value="form.station"
                    :options="stationOptions"
                    label="Station"
                    use-input
                    hide-selected
                    fill-input
                    clearable
                    filled
                    dense
                    input-debounce="0"
                    new-value-mode="add"
                    @filter="filterStations"
                    @input-value="(value) => (form.station = value)"
                    @update:model-value="(value) => (form.station = value || '')"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>
                            <template
                              v-for="(part, index) in highlightParts(scope.opt, form.station)"
                              :key="index"
                            >
                              <span v-if="part.match" class="text-weight-bold bg-yellow-4">{{
                                part.text
                              }}</span>
                              <template v-else>{{ part.text }}</template>
                            </template>
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No matches. Press Enter to add a new station.
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    :model-value="form.location"
                    :options="locationOptions"
                    label="Location"
                    use-input
                    hide-selected
                    fill-input
                    clearable
                    filled
                    dense
                    input-debounce="0"
                    new-value-mode="add"
                    @filter="filterLocations"
                    @input-value="(value) => (form.location = value)"
                    @update:model-value="(value) => (form.location = value || '')"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>
                            <template
                              v-for="(part, index) in highlightParts(scope.opt, form.location)"
                              :key="index"
                            >
                              <span v-if="part.match" class="text-weight-bold bg-yellow-4">{{
                                part.text
                              }}</span>
                              <template v-else>{{ part.text }}</template>
                            </template>
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No matches. Press Enter to add a new location.
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-sm-2">
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
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model="form.prior_mileage"
                    type="number"
                    label="Prior mileage"
                    min="0"
                    step="1"
                    clearable
                    filled
                    dense
                    :rules="[validOdometer]"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model="form.mileage"
                    type="number"
                    label="Mileage"
                    min="0"
                    step="1"
                    clearable
                    filled
                    dense
                    :rules="[validOdometer, validCurrentMileage]"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    :model-value="calculatedMpg === null ? '' : calculatedMpg.toFixed(2)"
                    label="Miles per gallon"
                    readonly
                    tabindex="-1"
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-select
                    :model-value="form.fuel_type"
                    :options="fuelTypeOptions"
                    label="Fuel type"
                    use-input
                    hide-selected
                    fill-input
                    clearable
                    filled
                    dense
                    input-debounce="0"
                    new-value-mode="add"
                    @filter="filterFuelTypes"
                    @input-value="(value) => (form.fuel_type = value)"
                    @update:model-value="(value) => (form.fuel_type = value || '')"
                  >
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>
                            <template
                              v-for="(part, index) in highlightParts(scope.opt, form.fuel_type)"
                              :key="index"
                            >
                              <span v-if="part.match" class="text-weight-bold bg-yellow-4">{{
                                part.text
                              }}</span>
                              <template v-else>{{ part.text }}</template>
                            </template>
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                    <template #no-option>
                      <q-item>
                        <q-item-section class="text-grey">
                          No matches. Press Enter to add a new fuel type.
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <div class="col-12 col-sm-2">
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
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="form.price_per_gallon"
                    type="number"
                    label="Price per gallon"
                    readonly
                    tabindex="-1"
                    filled
                    dense
                    hint="Calculated from total cost and gallons."
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    :model-value="form.total_cost"
                    type="number"
                    label="Total cost"
                    min="0"
                    step="0.01"
                    clearable
                    filled
                    dense
                    @update:model-value="limitTotalCostDecimals"
                  />
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
                :disable="saving"
                @click="requestDeleteEditedFuelLog"
              />
              <q-btn flat label="Cancel" :disable="saving" @click="resetForm" />
              <q-btn
                type="submit"
                color="primary"
                class="q-mr-md"
                :label="editingFuelLogId ? 'Update fuel log' : 'Save fuel log'"
                :loading="fuelLogStore.loading || saving"
                :disable="!hasRequiredFields || loadingPriorMileage || !!priorMileageError"
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
                <q-btn
                  flat
                  dense
                  color="primary"
                  label="Edit"
                  :disable="saving"
                  @click="editFuelLog(props.row)"
                />
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
import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import NotesEditor from '@/components/NotesEditor.vue'
import ScheduleNotesDialog from '@/components/schedule/ScheduleNotesDialog.vue'
import { useAutoStore } from '@/stores/auto'
import { useFuelLogStore } from '@/stores/fuelLog'
import { useMileageStore } from '@/stores/mileage'
import { templateAutoLabel } from '@/stores/schedule'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'
import { notifySuccess } from '../utils/notify'
import { formatMpg, mileageDifference, milesPerGallon } from '../utils/fuelMileage'

const $q = useQuasar()
const autoStore = useAutoStore()
const fuelLogStore = useFuelLogStore()
const mileageStore = useMileageStore()
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
const fuelTypeOptions = ref([])
const stationOptions = ref([])
const locationOptions = ref([])
const loadingPriorMileage = ref(false)
const priorMileageError = ref('')
const saving = ref(false)
let prefillRequest = 0
let loadRequest = 0

// When the entered station matches a public.station row, only that station's locations are offered.
function locationNamesForStation() {
  const station = form.station?.trim().toLowerCase()
  const rows = fuelLogStore.stationRows
  const stationMatches = station
    ? rows.filter(
        (row) =>
          String(row.station ?? '')
            .trim()
            .toLowerCase() === station,
      )
    : []
  const source = stationMatches.length ? stationMatches : rows

  const unique = new Map()
  for (const row of source) {
    const name = String(row.location ?? '').trim()
    if (name && !unique.has(name.toLowerCase())) {
      unique.set(name.toLowerCase(), name)
    }
  }
  return [...unique.values()].sort((a, b) => a.localeCompare(b))
}

function filterLocations(value, update) {
  update(() => {
    const term = value.trim().toLowerCase()
    const names = locationNamesForStation()
    locationOptions.value = term ? names.filter((name) => name.toLowerCase().includes(term)) : names
  })
}

function filterStations(value, update) {
  update(() => {
    const term = value.trim().toLowerCase()
    stationOptions.value = term
      ? fuelLogStore.stations.filter((name) => name.toLowerCase().includes(term))
      : [...fuelLogStore.stations]
  })
}

function filterFuelTypes(value, update) {
  update(() => {
    const term = value.trim().toLowerCase()
    fuelTypeOptions.value = term
      ? fuelLogStore.fuelTypes.filter((name) => name.toLowerCase().includes(term))
      : [...fuelLogStore.fuelTypes]
  })
}

// Splits text into segments so the matching part can be highlighted without v-html.
function highlightParts(text, term) {
  const value = String(text ?? '')
  const needle = String(term ?? '').trim()
  if (!needle) {
    return [{ text: value, match: false }]
  }

  const start = value.toLowerCase().indexOf(needle.toLowerCase())
  if (start === -1) {
    return [{ text: value, match: false }]
  }

  const end = start + needle.length
  return [
    { text: value.slice(0, start), match: false },
    { text: value.slice(start, end), match: true },
    { text: value.slice(end), match: false },
  ].filter((part) => part.text)
}
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
const formatMileage = (value) =>
  value === null || value === undefined ? '—' : Number(value).toLocaleString()
const calculatedMpg = computed(() => milesPerGallon(form.prior_mileage, form.mileage, form.gallons))

function validOdometer(value) {
  if (value === null || value === undefined || value === '') return true
  const number = Number(value)
  return (
    (Number.isSafeInteger(number) && number >= 0 && number <= 2147483647) ||
    'Enter a whole number between 0 and 2,147,483,647.'
  )
}

function validCurrentMileage(value) {
  if (
    value === null ||
    value === undefined ||
    value === '' ||
    form.prior_mileage === null ||
    form.prior_mileage === ''
  )
    return true
  return Number(value) > Number(form.prior_mileage) || 'Mileage must be greater than prior mileage.'
}

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
    name: 'mile_per_gallon',
    label: 'Miles per Gallon',
    field: 'mile_per_gallon',
    format: formatMpg,
    align: 'right',
    sortable: true,
  },
  {
    name: 'miles_per_refill',
    label: 'Miles per refill',
    field: (row) => mileageDifference(row.prior_mileage, row.mileage),
    format: formatMileage,
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
  { name: 'actions', label: '', field: 'fuel_log_id', align: 'right' },
]

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const currentProfileId = computed(() =>
  profileStore.currentProfile?.user_id === currentUserId.value
    ? profileStore.currentProfile?.profile_id
    : null,
)
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
    prior_mileage: null,
    mileage: null,
    gallons: null,
    price_per_gallon: null,
    total_cost: null,
    fuel_type: '',
    station: '',
    location: '',
    notes: '',
  }
}

function resetForm() {
  prefillRequest++
  loadingPriorMileage.value = false
  priorMileageError.value = ''
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
  prefillPriorMileage()
}

async function prefillPriorMileage() {
  const autoId = selectedAutoId.value
  const request = ++prefillRequest
  loadingPriorMileage.value = true
  priorMileageError.value = ''
  try {
    let miles = await fuelLogStore.fetchLatestMileage(autoId)
    if (miles === null) miles = await mileageStore.fetchLatestMilesChecked(autoId)
    if (request === prefillRequest && showForm.value && !editingFuelLogId.value) {
      if (form.prior_mileage === null || form.prior_mileage === '') form.prior_mileage = miles
    }
  } catch (error) {
    if (request === prefillRequest) {
      priorMileageError.value = `Unable to load prior mileage: ${error.message}`
      $q.notify({ type: 'negative', message: priorMileageError.value })
    }
  } finally {
    if (request === prefillRequest) loadingPriorMileage.value = false
  }
}

function editFuelLog(entry) {
  prefillRequest++
  loadingPriorMileage.value = false
  priorMileageError.value = ''
  Object.assign(form, {
    auto_id: entry.auto_id,
    date: entry.date ? String(entry.date).slice(0, 10) : '',
    prior_mileage: entry.prior_mileage ?? null,
    mileage: entry.mileage ?? null,
    gallons: entry.gallons ?? null,
    price_per_gallon: entry.price_per_gallon ?? null,
    total_cost: entry.total_cost ?? null,
    fuel_type: entry.fuel_type || '',
    station: entry.station || '',
    location: entry.location || '',
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
  const request = ++loadRequest
  fuelLogStore.stationRequestId++
  fuelLogStore.stationProfileId = null
  fuelLogStore.stationRows = []
  fuelLogStore.stations = []
  fuelLogStore.stationError = null
  if (!currentUserId.value) {
    autoStore.auto = []
    fuelLogStore.fuelLogs = []
    return
  }

  const userId = currentUserId.value
  const profile = await profileStore.loadCurrentProfile(userId)
  if (request !== loadRequest || currentUserId.value !== userId) return
  if (!profile?.profile_id) {
    fuelLogStore.error = profileStore.error || 'A current profile is required to load fuel logs.'
    return
  }
  const autos = await autoStore.loadAuto(profile?.profile_id)
  if (request !== loadRequest) return
  await fuelLogStore.loadFuelLogs(autos.map((auto) => auto.auto_id))
  if (request !== loadRequest) return
  await fuelLogStore.loadFuelTypes()
  if (request !== loadRequest) return
  await fuelLogStore.loadStations(profile.profile_id)
}

// Keeps at most two decimal places while typing, without rounding the digits entered.
function limitTotalCostDecimals(value) {
  const text = value === null || value === undefined ? '' : String(value)
  const [whole, decimals] = text.split('.')
  form.total_cost = value
  if (decimals !== undefined && decimals.length > 2) {
    // Assign the raw value first so the input re-renders even when the trimmed value is unchanged.
    nextTick(() => {
      form.total_cost = `${whole}.${decimals.slice(0, 2)}`
    })
  }
}

async function saveFuelLog() {
  if (
    saving.value ||
    loadingPriorMileage.value ||
    priorMileageError.value ||
    !(await autoSelectRef.value?.validate()) ||
    !hasRequiredFields.value
  ) {
    return
  }

  const isEditing = Boolean(editingFuelLogId.value)
  const fuelLogId = editingFuelLogId.value
  const entry = { ...form }
  const profileId = currentProfileId.value
  if (!profileId) {
    $q.notify({ type: 'negative', message: 'A current profile is required to save fuel logs.' })
    return
  }
  saving.value = true
  let fuelSaved = false
  try {
    const hasMileage = entry.mileage !== null && entry.mileage !== ''
    const latest = hasMileage ? await mileageStore.fetchLatestMilesChecked(entry.auto_id) : null
    const saved = isEditing
      ? await fuelLogStore.updateFuelLog(fuelLogId, entry, profileId)
      : await fuelLogStore.createFuelLog(entry, profileId)
    if (!saved) return
    fuelSaved = true
    editingFuelLogId.value = saved.fuel_log_id

    if (hasMileage && (latest === null || Number(saved.mileage) > Number(latest))) {
      const mileageSaved = await mileageStore.createMileage({
        auto_id: saved.auto_id,
        miles: saved.mileage,
        date: saved.date,
      })
      if (!mileageSaved) {
        $q.notify({
          type: 'negative',
          message: `Fuel log saved, but mileage history was not updated: ${mileageStore.error}`,
        })
        return
      }
    }
    notifySuccess($q, `Fuel log ${isEditing ? 'updated' : 'saved'} successfully.`, {
      color: 'positive',
    })
    resetForm()
  } catch (error) {
    $q.notify({
      type: 'negative',
      message: fuelSaved
        ? `Fuel log saved, but mileage history was not updated: ${error.message}`
        : `Unable to save fuel log: ${error.message}`,
    })
  } finally {
    saving.value = false
  }
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

// Price per gallon is read-only and derived from total cost and gallons.
watch(
  () => [form.gallons, form.total_cost],
  ([gallons, totalCost]) => {
    const hasValues = gallons !== null && gallons !== '' && totalCost !== null && totalCost !== ''
    form.price_per_gallon =
      hasValues && Number(gallons) > 0
        ? Number((Number(totalCost) / Number(gallons)).toFixed(3))
        : null
  },
)
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
