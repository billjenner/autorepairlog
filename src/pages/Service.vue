<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between q-mx-md q-mb-md">
            <div class="text-h5">Services</div>
            <q-btn
              color="primary"
              :label="showForm ? 'Cancel' : 'Add Service'"
              :disable="!usersStore.currentUser"
              @click="toggleForm"
            />
          </div>

          <q-banner v-if="serviceStore.error" class="bg-negative text-white q-mb-md" rounded>
            {{ serviceStore.error }}
          </q-banner>

          <q-banner
            v-else-if="!usersStore.currentUser"
            class="bg-warning text-dark q-mb-md"
            rounded
          >
            Sign in to manage services.
          </q-banner>

          <q-form v-if="showForm" @submit.prevent="saveService" class="q-gutter-md">
            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="text-subtitle1 q-mb-sm">
                {{ editingServiceId ? 'Edit service' : 'Service details' }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <q-select
                    v-model="form.schedule_id"
                    :options="scheduleOptions"
                    label="Schedule (template auto)"
                    emit-value
                    map-options
                    clearable
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-select
                    v-model="form.type"
                    :options="typeOptions"
                    label="Type"
                    emit-value
                    map-options
                    clearable
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-8">
                  <q-input v-model.trim="form.name" label="Name" filled dense />
                </div>
                <div class="col-12">
                  <q-input
                    v-model.trim="form.description"
                    type="textarea"
                    label="Description"
                    autogrow
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.interval_miles"
                    type="number"
                    label="Interval (miles)"
                    min="0"
                    step="1"
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.interval_months"
                    type="number"
                    label="Interval (months)"
                    min="0"
                    step="1"
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.interval_years"
                    type="number"
                    label="Interval (years)"
                    min="0"
                    step="1"
                    filled
                    dense
                  />
                </div>
                <div class="col-12">
                  <q-input
                    v-model.trim="form.notes"
                    type="textarea"
                    label="Notes"
                    autogrow
                    filled
                    dense
                  />
                </div>
              </div>
            </q-card>

            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" @click="resetForm" />
              <q-btn
                type="submit"
                color="primary"
                :label="editingServiceId ? 'Update service' : 'Save service'"
                :loading="serviceStore.loading"
              />
            </div>
          </q-form>

          <q-table
            class="q-mt-md"
            :rows="serviceStore.services"
            :columns="columns"
            :loading="serviceStore.loading"
            :pagination="{ rowsPerPage: 25 }"
            :rows-per-page-options="[10, 25, 50, 0]"
            row-key="service_id"
            flat
            bordered
            dense
            no-data-label="No service records yet."
          >
            <template #body-cell-schedule="props">
              <q-td :props="props">{{ scheduleDescription(props.row.schedule_id) }}</q-td>
            </template>
            <template #body-cell-type="props">
              <q-td :props="props">{{ props.row.type ? props.row.type.toUpperCase() : '—' }}</q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  flat
                  dense
                  color="secondary"
                  label="Details"
                  @click="detailsService = props.row"
                />
                <q-btn flat dense color="primary" label="Edit" @click="editService(props.row)" />
                <q-btn
                  flat
                  dense
                  color="negative"
                  label="Delete"
                  @click="pendingDeleteService = props.row"
                />
              </q-td>
            </template>
          </q-table>

          <q-dialog v-model="detailsOpen">
            <q-card style="min-width: 360px; max-width: 600px; width: 100%">
              <q-card-section class="text-h6">
                {{ detailsService?.name || 'Service details' }}
              </q-card-section>
              <q-card-section class="q-pt-none">
                <q-input
                  :model-value="detailsService?.description || ''"
                  type="textarea"
                  label="Description"
                  readonly
                  autogrow
                  filled
                />
              </q-card-section>
              <q-card-section class="q-pt-none">
                <q-input
                  :model-value="detailsService?.notes || ''"
                  type="textarea"
                  label="Details"
                  readonly
                  autogrow
                  filled
                />
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Close" color="primary" v-close-popup />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <q-dialog v-model="confirmDeleteOpen">
            <q-card style="min-width: 320px">
              <q-card-section class="text-h6">Delete service?</q-card-section>
              <q-card-section>
                This removes {{ pendingDeleteService?.name || 'this service' }} from your list.
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" @click="pendingDeleteService = null" />
                <q-btn
                  label="Delete"
                  color="negative"
                  :loading="serviceStore.loading"
                  @click="deleteService"
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
import { useServiceStore } from 'src/stores/service'
import { templateAutoLabel } from 'src/stores/schedule'
import { useUsersStore } from 'stores/users'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const serviceStore = useServiceStore()
const usersStore = useUsersStore()
const showForm = ref(false)
const editingServiceId = ref(null)
const pendingDeleteService = ref(null)
const detailsService = ref(null)
const detailsOpen = computed({
  get: () => Boolean(detailsService.value),
  set: (open) => {
    if (!open) {
      detailsService.value = null
    }
  },
})
const form = reactive(createEmptyForm())

const typeOptions = [
  { label: 'Maintenance', value: 'm' },
  { label: 'Service', value: 's' },
]

const columns = [
  { name: 'schedule', label: 'Schedule', field: 'schedule_id', align: 'left' },
  { name: 'type', label: 'Type', field: 'type', align: 'left', sortable: true },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  {
    name: 'interval_miles',
    label: 'Miles',
    field: 'interval_miles',
    align: 'right',
    sortable: true,
  },
  {
    name: 'interval_months',
    label: 'Months',
    field: 'interval_months',
    align: 'right',
    sortable: true,
  },
  {
    name: 'interval_years',
    label: 'Years',
    field: 'interval_years',
    align: 'right',
    sortable: true,
  },
  { name: 'actions', label: '', field: 'service_id', align: 'right' },
]

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const scheduleOptions = computed(() =>
  serviceStore.scheduleOptions.map((schedule) => ({
    label: templateAutoLabel(schedule.auto),
    value: schedule.schedule_id,
  })),
)
const confirmDeleteOpen = computed({
  get: () => Boolean(pendingDeleteService.value),
  set: (open) => {
    if (!open) {
      pendingDeleteService.value = null
    }
  },
})

function createEmptyForm() {
  return {
    schedule_id: null,
    type: null,
    name: '',
    description: '',
    notes: '',
    interval_miles: 0,
    interval_months: 0,
    interval_years: 0,
  }
}

function scheduleDescription(scheduleId) {
  return scheduleOptions.value.find((option) => option.value === scheduleId)?.label || '—'
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  editingServiceId.value = null
  showForm.value = false
}

function toggleForm() {
  if (showForm.value) {
    resetForm()
  } else {
    showForm.value = true
  }
}

function editService(service) {
  Object.assign(form, {
    schedule_id: service.schedule_id,
    type: service.type,
    name: service.name || '',
    description: service.description || '',
    notes: service.notes || '',
    interval_miles: service.interval_miles ?? 0,
    interval_months: service.interval_months ?? 0,
    interval_years: service.interval_years ?? 0,
  })
  editingServiceId.value = service.service_id
  showForm.value = true
}

async function load() {
  if (!currentUserId.value) {
    serviceStore.services = []
    return
  }

  await serviceStore.loadScheduleOptions()
  await serviceStore.loadServices()
}

async function saveService() {
  const isEditing = Boolean(editingServiceId.value)
  const saved = isEditing
    ? await serviceStore.updateService(editingServiceId.value, form)
    : await serviceStore.createService(form)

  if (!saved) {
    return
  }

  notifySuccess($q, `Service ${isEditing ? 'updated' : 'saved'} successfully.`, {
    color: 'positive',
  })
  resetForm()
}

async function deleteService() {
  const service = pendingDeleteService.value
  if (!service) {
    return
  }

  if (await serviceStore.deleteService(service.service_id)) {
    pendingDeleteService.value = null
    notifySuccess($q, 'Service deleted successfully.', { color: 'negative' })
  }
}

watch(currentUserId, load)
onMounted(load)
</script>
