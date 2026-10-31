<template>
  <q-page>
    <div class="row justify-center">
      <div class="col-12">
        <div class="row q-col-gutter-md q-mb-md">
          <div class="col-12 col-sm-6">
            <q-select
              v-model="selectedAutoId"
              :options="autoOptions"
              label="Auto"
              emit-value
              map-options
              clearable
              filled
              dense
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-select
              ref="orderSelectRef"
              v-model="selectedOrderId"
              :options="orderOptions"
              label="Service order"
              emit-value
              map-options
              filled
              dense
              lazy-rules
              :rules="[
                (value) =>
                  !showForm || (!!value && value !== ALL_ORDERS) || 'Select a service order.',
              ]"
            />
          </div>
        </div>
        <q-card flat bordered>
          <div class="row items-center justify-between q-mx-md q-my-md q-col-gutter-sm">
            <div class="col row items-center">
              <div class="text-h5">Service Log</div>
            </div>
            <q-input
              v-model="searchText"
              dense
              outlined
              clearable
              debounce="200"
              placeholder="Search service log"
              class="col-12 col-md-4 service-list-search"
              style="width: 100%; max-width: 400px"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
            <div class="col-auto service-list-action">
              <q-btn
                color="primary"
                :label="showForm ? 'Cancel' : 'Add Service Log'"
                :disable="!usersStore.currentUser"
                @click="toggleForm"
              />
            </div>
          </div>

          <q-banner v-if="serviceLogStore.error" class="bg-negative text-white q-mb-md" rounded>
            {{ serviceLogStore.error }}
          </q-banner>

          <q-banner
            v-else-if="!usersStore.currentUser"
            class="bg-warning text-dark q-mb-md"
            rounded
          >
            Sign in to manage service logs.
          </q-banner>

          <q-form v-if="showForm" @submit.prevent="saveServiceLog" class="q-mt-md q-gutter-md">
            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="text-subtitle1 q-mb-sm">
                {{ editingLogId ? 'Edit service log' : 'Service log details' }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-6">
                  <q-input v-model.trim="form.name" label="Name" filled dense />
                </div>
                <div class="col-12 col-sm-6">
                  <q-input
                    :model-value="selectedOrderLabel"
                    label="Service order"
                    readonly
                    filled
                    dense
                    hint="Change the service order using the selector above."
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.parts"
                    type="number"
                    label="Parts"
                    prefix="$"
                    min="0"
                    step="0.01"
                    filled
                    dense
                    @update:model-value="recalcTotal"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.labor"
                    type="number"
                    label="Labor"
                    prefix="$"
                    min="0"
                    step="0.01"
                    filled
                    dense
                    @update:model-value="recalcTotal"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model="form.total_cost"
                    type="number"
                    label="Total cost"
                    prefix="$"
                    min="0"
                    step="0.01"
                    filled
                    dense
                  />
                </div>
                <div class="col-12 flex items-center">
                  <q-toggle v-model="showNotes" dense label="Notes" />
                </div>
                <div v-if="showNotes" class="col-12">
                  <notes-editor v-model="form.notes" />
                </div>
              </div>
            </q-card>

            <div class="row justify-end q-gutter-sm">
              <q-btn
                v-if="editingLogId"
                flat
                color="negative"
                label="DELETE SERVICE LOG"
                class="q-mr-auto"
                @click="requestDeleteEditedLog"
              />
              <q-btn flat label="Cancel" @click="resetForm" />
              <q-btn
                type="submit"
                color="primary"
                :label="editingLogId ? 'Update service log' : 'Save service log'"
                :loading="serviceLogStore.loading"
                :disable="!hasRequiredFields"
              />
            </div>
          </q-form>

          <q-table
            class="q-mt-md"
            :rows="visibleLogs"
            :columns="columns"
            :loading="serviceLogStore.loading"
            :pagination="{ rowsPerPage: 25 }"
            :rows-per-page-options="[10, 25, 50, 0]"
            row-key="service_log_id"
            flat
            bordered
            dense
            table-header-class="bg-accent text-white"
            no-data-label="No service logs yet."
          >
            <template #body-cell-total_cost="props">
              <q-td :props="props">{{ formatMoney(props.row.total_cost) }}</q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn flat dense color="accent" label="Details" @click="detailsLog = props.row" />
                <q-btn flat dense color="primary" label="Edit" @click="editLog(props.row)" />
              </q-td>
            </template>
          </q-table>

          <ServiceLogDetailsDialog v-model:log="detailsLog" />

          <q-dialog v-model="confirmDeleteOpen">
            <q-card style="min-width: 320px">
              <q-card-section class="text-h6">Delete service log?</q-card-section>
              <q-card-section>
                This permanently removes {{ pendingDeleteLog?.name || 'this service log' }}.
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" @click="pendingDeleteLog = null" />
                <q-btn
                  label="Delete"
                  color="negative"
                  :loading="serviceLogStore.loading"
                  @click="deleteServiceLog"
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
import ServiceLogDetailsDialog from '@/components/ServiceLogDetailsDialog.vue'
import { useServiceLogStore } from '@/stores/serviceLog'
import { templateAutoLabel } from '@/stores/schedule'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const serviceLogStore = useServiceLogStore()
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const showForm = ref(false)
const showNotes = ref(false)
const editingLogId = ref(null)
const ALL_ORDERS = 'all'
const selectedOrderId = ref(ALL_ORDERS)
const selectedAutoId = ref(null)
const orderSelectRef = ref(null)
const pendingDeleteLog = ref(null)
const detailsLog = ref(null)
const form = reactive(createEmptyForm())

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`

const columns = [
  {
    name: 'service_date',
    label: 'Service date',
    field: (row) => row.service_order?.service_date,
    align: 'left',
    sortable: true,
    format: (value) => value || '—',
  },
  {
    name: 'mileage_at_service',
    label: 'Mileage',
    field: (row) => row.service_order?.mileage_at_service,
    align: 'right',
    sortable: true,
    format: (value) => value ?? '—',
  },
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
  {
    name: 'total_cost',
    label: 'Total',
    field: 'total_cost',
    align: 'right',
    sortable: true,
    format: (value) => formatMoney(value),
  },
  { name: 'actions', label: '', field: 'service_log_id', align: 'right' },
]

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const hasRequiredFields = computed(
  () =>
    Boolean(selectedOrderId.value) &&
    selectedOrderId.value !== ALL_ORDERS &&
    Boolean(form.name?.trim()),
)
// Parts/labor changes refill the total, which the user can still overwrite.
function recalcTotal() {
  const parts = Number(form.parts)
  const labor = Number(form.labor)
  const partsInCents = Number.isFinite(parts) && parts > 0 ? Math.round(parts * 100) : 0
  const laborInCents = Number.isFinite(labor) && labor > 0 ? Math.round(labor * 100) : 0

  form.total_cost = (partsInCents + laborInCents) / 100
}
const orderOptions = computed(() => [
  { label: 'All', value: ALL_ORDERS },
  ...serviceLogStore.orderOptions
    .filter((order) => !selectedAutoId.value || order.auto_id === selectedAutoId.value)
    .map((order) => ({
      label: [templateAutoLabel(order.auto), order.service_date, order.invoice_number]
        .filter(Boolean)
        .join(' — '),
      value: order.service_order_id,
    })),
])
// Autos are derived from the loaded service orders, since a log needs an order.
const autoOptions = computed(() => {
  const autos = new Map()
  for (const order of serviceLogStore.orderOptions) {
    if (!autos.has(order.auto_id)) {
      autos.set(order.auto_id, { label: templateAutoLabel(order.auto), value: order.auto_id })
    }
  }
  return [...autos.values()].sort((a, b) => a.label.localeCompare(b.label))
})
const selectedOrderLabel = computed(
  () =>
    serviceLogStore.orderOptions
      .filter((order) => order.service_order_id === selectedOrderId.value)
      .map((order) =>
        [templateAutoLabel(order.auto), order.service_date, order.invoice_number]
          .filter(Boolean)
          .join(' — '),
      )[0] || '—',
)
const searchText = ref('')
const visibleLogs = computed(() => {
  const term = searchText.value.trim().toLowerCase()
  const matchesSearch = (item) =>
    !term ||
    Object.values(item).some(
      (value) =>
        value !== null && typeof value !== 'object' && String(value).toLowerCase().includes(term),
    )

  if (selectedOrderId.value !== ALL_ORDERS) {
    return serviceLogStore.serviceLogs.filter(
      (item) => item.service_order_id === selectedOrderId.value && matchesSearch(item),
    )
  }

  const orderIds = new Set(
    serviceLogStore.orderOptions
      .filter((order) => !selectedAutoId.value || order.auto_id === selectedAutoId.value)
      .map((order) => order.service_order_id),
  )
  return serviceLogStore.serviceLogs.filter(
    (item) => orderIds.has(item.service_order_id) && matchesSearch(item),
  )
})
const confirmDeleteOpen = computed({
  get: () => Boolean(pendingDeleteLog.value),
  set: (open) => {
    if (!open) {
      pendingDeleteLog.value = null
    }
  },
})

function createEmptyForm() {
  return {
    service_order_id: null,
    name: '',
    notes: '',
    parts: 0,
    labor: 0,
    total_cost: 0,
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  editingLogId.value = null
  showNotes.value = false
  showForm.value = false
}

function toggleForm() {
  if (showForm.value) {
    resetForm()
    return
  }

  if (selectedOrderId.value === ALL_ORDERS && orderOptions.value.length === 2) {
    selectedOrderId.value = orderOptions.value[1].value
  }
  Object.assign(form, {
    ...createEmptyForm(),
    service_order_id: selectedOrderId.value === ALL_ORDERS ? null : selectedOrderId.value,
  })
  showForm.value = true
}

function editLog(log) {
  Object.assign(form, {
    service_order_id: log.service_order_id,
    name: log.name || '',
    notes: log.notes || '',
    parts: log.parts ?? 0,
    labor: log.labor ?? 0,
    total_cost: log.total_cost ?? 0,
  })
  selectedOrderId.value = log.service_order_id
  editingLogId.value = log.service_log_id
  showNotes.value = Boolean(log.notes)
  showForm.value = true
}

function requestDeleteEditedLog() {
  if (!editingLogId.value) {
    return
  }

  pendingDeleteLog.value = {
    service_log_id: editingLogId.value,
    name: form.name,
  }
}

async function load() {
  if (!currentUserId.value) {
    serviceLogStore.serviceLogs = []
    serviceLogStore.orderOptions = []
    return
  }

  const profile = await profileStore.loadCurrentProfile(currentUserId.value)
  const isAdmin = Number(profile?.admin_level) > 0
  await serviceLogStore.loadOrderOptions({
    isAdmin,
    profileId: profile?.profile_id,
  })
  await serviceLogStore.loadServiceLogs()
}

async function saveServiceLog() {
  if (!(await orderSelectRef.value?.validate()) || !hasRequiredFields.value) {
    return
  }

  const isEditing = Boolean(editingLogId.value)
  const saved = isEditing
    ? await serviceLogStore.updateServiceLog(editingLogId.value, { ...form, use_total_cost: true })
    : await serviceLogStore.createServiceLog({ ...form, use_total_cost: true })

  if (!saved) {
    return
  }

  notifySuccess($q, `Service log ${isEditing ? 'updated' : 'saved'} successfully.`, {
    color: 'positive',
  })
  resetForm()
}

async function deleteServiceLog() {
  const log = pendingDeleteLog.value
  if (!log) {
    return
  }

  if (await serviceLogStore.deleteServiceLog(log.service_log_id)) {
    pendingDeleteLog.value = null
    if (editingLogId.value === log.service_log_id) {
      resetForm()
    }
    notifySuccess($q, 'Service log deleted successfully.', { color: 'negative' })
  }
}

watch(selectedOrderId, (orderId) => {
  if (showForm.value) {
    form.service_order_id = orderId === ALL_ORDERS ? null : orderId
  }
  const order = serviceLogStore.orderOptions.find((item) => item.service_order_id === orderId)
  if (order && order.auto_id !== selectedAutoId.value) {
    selectedAutoId.value = order.auto_id
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
watch(
  orderOptions,
  (options) => {
    if (!selectedOrderId.value || !options.some((o) => o.value === selectedOrderId.value)) {
      selectedOrderId.value = ALL_ORDERS
    }
  },
  { immediate: true },
)
watch(currentUserId, load)
onMounted(load)
</script>
