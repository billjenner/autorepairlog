<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between q-mx-md q-mb-md">
            <div class="text-h5">Mileage</div>
            <q-btn
              color="primary"
              :label="showForm ? 'Cancel' : 'Add Mileage'"
              :disable="!autoOptions.length"
              @click="toggleForm"
            />
          </div>

          <div class="row q-mx-md q-mb-md">
            <q-select
              ref="autoSelectRef"
              v-model="selectedAutoId"
              :options="autoOptions"
              label="Auto"
              emit-value
              map-options
              clearable
              filled
              dense
              lazy-rules
              :rules="[(value) => !showForm || !!value || 'Select an auto.']"
              class="col-12 col-sm-6"
            />
          </div>

          <q-banner v-if="errorMessage" class="bg-negative text-white q-mb-md" rounded>
            {{ errorMessage }}
          </q-banner>

          <q-banner
            v-else-if="!usersStore.currentUser"
            class="bg-warning text-dark q-mb-md"
            rounded
          >
            Sign in to manage mileage.
          </q-banner>

          <q-banner v-else-if="!profileId" class="bg-warning text-dark q-mb-md" rounded>
            Create your profile before adding mileage.
            <q-btn flat dense label="Go to Profile" to="/profile" class="q-ml-sm" />
          </q-banner>

          <q-banner
            v-else-if="!autoStore.loading && !autoOptions.length"
            class="bg-warning text-dark q-mb-md"
            rounded
          >
            Add an auto before recording mileage.
            <q-btn flat dense label="Go to Auto" to="/auto" class="q-ml-sm" />
          </q-banner>

          <q-form v-if="showForm" @submit.prevent="saveMileage" class="q-gutter-md">
            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="text-subtitle1 q-mb-sm">
                {{ editingMileageId ? 'Edit mileage' : 'Mileage details' }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-5">
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
                  <q-input
                    v-model="form.miles"
                    type="number"
                    label="Miles"
                    filled
                    dense
                    min="0"
                    step="1"
                    :rules="[
                      (value) =>
                        (value !== null && value !== '' && Number(value) >= 0) ||
                        'Enter miles of zero or more.',
                    ]"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.date"
                    type="date"
                    label="Date"
                    filled
                    dense
                    :rules="[(value) => !!value || 'Date is required.']"
                  />
                </div>
              </div>
            </q-card>

            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" @click="resetForm" />
              <q-btn
                type="submit"
                color="primary"
                :label="editingMileageId ? 'Update mileage' : 'Save mileage'"
                :loading="mileageStore.loading"
              />
            </div>
          </q-form>

          <q-table
            class="q-mt-md"
            :rows="visibleMileage"
            :columns="columns"
            :loading="mileageStore.loading || autoStore.loading"
            v-model:pagination="pagination"
            :sort-method="sortRows"
            :rows-per-page-options="[10, 25, 50, 0]"
            row-key="mileage_id"
            flat
            bordered
            dense
            :no-data-label="
              selectedAutoId ? 'No mileage records yet.' : 'Select an auto to view its mileage.'
            "
          >
            <template #body-cell-miles="props">
              <q-td :props="props">
                {{
                  props.row.miles === null || props.row.miles === undefined
                    ? '—'
                    : Number(props.row.miles).toLocaleString()
                }}
              </q-td>
            </template>
            <template #body-cell-date="props">
              <q-td :props="props">
                {{ props.row.date || '—' }}
                <q-badge v-if="props.row.fromAuto" color="grey-7" class="q-ml-sm">
                  Auto record
                </q-badge>
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <template v-if="!props.row.fromAuto">
                  <q-btn flat dense color="primary" label="Edit" @click="editMileage(props.row)" />
                  <q-btn
                    flat
                    dense
                    color="negative"
                    label="Delete"
                    @click="pendingDeleteMileage = props.row"
                  />
                </template>
              </q-td>
            </template>
          </q-table>

          <q-dialog v-model="confirmDeleteOpen">
            <q-card style="min-width: 320px">
              <q-card-section class="text-h6">Delete mileage?</q-card-section>
              <q-card-section>
                This permanently deletes the
                {{
                  pendingDeleteMileage ? Number(pendingDeleteMileage.miles).toLocaleString() : ''
                }}
                mile record for {{ autoLabelById(pendingDeleteMileage?.auto_id) }}.
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" @click="pendingDeleteMileage = null" />
                <q-btn
                  label="Delete"
                  color="negative"
                  :loading="mileageStore.loading"
                  @click="deleteMileage"
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
import { useRoute } from 'vue-router'
import { useAutoStore } from 'stores/auto'
import { useMileageStore } from 'stores/mileage'
import { useProfileStore } from 'stores/profile'
import { useUsersStore } from 'stores/users'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const route = useRoute()
const autoStore = useAutoStore()
const mileageStore = useMileageStore()
const profileStore = useProfileStore()
const usersStore = useUsersStore()
const showForm = ref(false)
const editingMileageId = ref(null)
const selectedAutoId = ref(null)
const pagination = ref({ sortBy: 'date', descending: true, rowsPerPage: 25 })
const autoSelectRef = ref(null)
const pendingDeleteMileage = ref(null)
const form = reactive(createEmptyForm())

const columns = [
  {
    name: 'auto',
    label: 'Auto',
    field: (row) => autoLabelById(row.auto_id),
    align: 'left',
    sortable: true,
  },
  { name: 'miles', label: 'Miles', field: 'miles', align: 'right', sortable: true },
  { name: 'date', label: 'Date', field: 'date', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'mileage_id', align: 'right' },
]

// Keeps the read-only auto record first regardless of the active sort.
function sortRows(rows, sortBy, descending) {
  const pinned = rows.filter((row) => row.fromAuto)
  const rest = rows.filter((row) => !row.fromAuto)
  const column = columns.find((col) => col.name === sortBy)

  if (column) {
    const getValue = (row) =>
      typeof column.field === 'function' ? column.field(row) : row[column.field]
    const direction = descending ? -1 : 1

    rest.sort((a, b) => {
      const left = getValue(a)
      const right = getValue(b)

      if (left === right) return 0
      if (left === null || left === undefined) return 1
      if (right === null || right === undefined) return -1

      return (left > right ? 1 : -1) * direction
    })
  }

  return [...pinned, ...rest]
}

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const profileId = computed(() => profileStore.currentProfile?.profile_id || null)
const errorMessage = computed(() => mileageStore.error || autoStore.error)
const autoOptions = computed(() =>
  autoStore.auto.map((auto) => ({ label: autoLabel(auto), value: auto.auto_id })),
)
const selectedAutoLabel = computed(() => autoLabelById(selectedAutoId.value))
const visibleMileage = computed(() => {
  if (!selectedAutoId.value) {
    return []
  }

  const rows = mileageStore.mileage.filter((item) => item.auto_id === selectedAutoId.value)
  const auto = autoStore.auto.find((item) => item.auto_id === selectedAutoId.value)

  // Read-only row built from the auto's own purchase date and last recorded mileage.
  if (auto && (auto.purchase_date || auto.last_recorded_mileage !== null)) {
    rows.push({
      mileage_id: `auto-${auto.auto_id}`,
      auto_id: auto.auto_id,
      miles: auto.last_recorded_mileage,
      date: auto.purchase_date,
      fromAuto: true,
    })
  }

  return rows
})
const confirmDeleteOpen = computed({
  get: () => Boolean(pendingDeleteMileage.value),
  set: (open) => {
    if (!open) {
      pendingDeleteMileage.value = null
    }
  },
})

function createEmptyForm() {
  return { auto_id: null, miles: null, date: null }
}

function autoLabel(auto) {
  return [auto.year, auto.make, auto.model].filter(Boolean).join(' ') || 'Unnamed auto'
}

function autoLabelById(autoId) {
  const auto = autoStore.auto.find((item) => item.auto_id === autoId)
  return auto ? autoLabel(auto) : ''
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  editingMileageId.value = null
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
  form.auto_id = selectedAutoId.value
  showForm.value = true
}

function editMileage(record) {
  Object.assign(form, {
    auto_id: record.auto_id,
    miles: record.miles,
    date: record.date || null,
  })
  selectedAutoId.value = record.auto_id
  editingMileageId.value = record.mileage_id
  showForm.value = true
}

async function loadAll() {
  mileageStore.error = null

  if (!currentUserId.value) {
    autoStore.auto = []
    mileageStore.mileage = []
    return
  }

  const profile = await profileStore.loadCurrentProfile(currentUserId.value)
  if (!profile?.profile_id) {
    autoStore.auto = []
    mileageStore.mileage = []
    if (profileStore.error) {
      autoStore.error = profileStore.error
    }
    return
  }

  const autos = await autoStore.loadAuto(profile.profile_id)
  await mileageStore.loadMileage(autos.map((auto) => auto.auto_id))
}

async function saveMileage() {
  if (!(await autoSelectRef.value?.validate())) {
    return
  }

  const isEditing = Boolean(editingMileageId.value)
  const saved = isEditing
    ? await mileageStore.updateMileage(editingMileageId.value, form)
    : await mileageStore.createMileage(form)

  if (!saved) {
    return
  }

  notifySuccess($q, `Mileage ${isEditing ? 'updated' : 'saved'} successfully.`, {
    color: 'positive',
  })
  resetForm()
}

async function deleteMileage() {
  const record = pendingDeleteMileage.value
  if (!record) {
    return
  }

  const deleted = await mileageStore.deleteMileage(record.mileage_id)
  if (deleted) {
    pendingDeleteMileage.value = null
    notifySuccess($q, 'Mileage deleted successfully.', { color: 'negative' })
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

    const requestedAutoId = Number(route.query.autoId)
    if (!selectedAutoId.value && options.some((o) => o.value === requestedAutoId)) {
      selectedAutoId.value = requestedAutoId
    }
    if (!selectedAutoId.value && options.length === 1) {
      selectedAutoId.value = options[0].value
    }
  },
  { immediate: true },
)
watch(currentUserId, loadAll)
onMounted(loadAll)
</script>
