<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
        <q-select
          ref="orderSelectRef"
          v-model="selectedOrderId"
          :options="orderOptions"
          label="Service order"
          emit-value
          map-options
          clearable
          filled
          dense
          lazy-rules
          :rules="[(value) => !showForm || !!value || 'Select a service order.']"
          class="col-12 col-sm-6"
        />

        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between q-mx-md q-mb-md">
            <div class="text-h5">Service Log</div>
            <q-btn
              color="primary"
              :label="showForm ? 'Cancel' : 'Add Service Log'"
              :disable="!usersStore.currentUser"
              @click="toggleForm"
            />
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
                <div class="col-12">
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
                  <q-select
                    v-model="form.type"
                    :options="typeOptions"
                    label="Type"
                    emit-value
                    map-options
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-5">
                  <q-input v-model.trim="form.name" label="Name" filled dense />
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
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    :model-value="formatMoney(totalCost)"
                    label="Total cost"
                    readonly
                    filled
                    dense
                  />
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
                <div class="col-12">
                  <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
                  <notes-editor v-model="form.notes" />
                </div>
              </div>
            </q-card>

            <div class="row justify-end q-gutter-sm">
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
            no-data-label="No service logs yet."
          >
            <template #body-cell-type="props">
              <q-td :props="props">{{ props.row.type ? props.row.type.toUpperCase() : '—' }}</q-td>
            </template>
            <template #body-cell-total_cost="props">
              <q-td :props="props">{{ formatMoney(props.row.total_cost) }}</q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn flat dense color="accent" label="Details" @click="detailsLog = props.row" />
                <q-btn flat dense color="primary" label="Edit" @click="editLog(props.row)" />
                <q-btn
                  flat
                  dense
                  color="negative"
                  label="Delete"
                  @click="pendingDeleteLog = props.row"
                />
              </q-td>
            </template>
          </q-table>

          <q-dialog v-model="detailsOpen">
            <q-card style="min-width: 360px; max-width: 600px; width: 100%">
              <q-card-section class="text-h6">
                {{ detailsLog?.name || 'Service log details' }}
              </q-card-section>
              <q-card-section class="q-pt-none">
                <div>Parts: {{ formatMoney(detailsLog?.parts) }}</div>
                <div>Labor: {{ formatMoney(detailsLog?.labor) }}</div>
                <div>Total: {{ formatMoney(detailsLog?.total_cost) }}</div>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <q-input
                  :model-value="detailsLog?.description || ''"
                  type="textarea"
                  label="Description"
                  readonly
                  autogrow
                  filled
                />
              </q-card-section>
              <q-card-section class="q-pt-none">
                <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
                <notes-viewer :notes="detailsLog?.notes || ''" />
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Close" color="primary" v-close-popup />
              </q-card-actions>
            </q-card>
          </q-dialog>

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
import NotesViewer from '@/components/NotesViewer.vue'
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
const editingLogId = ref(null)
const selectedOrderId = ref(null)
const orderSelectRef = ref(null)
const pendingDeleteLog = ref(null)
const detailsLog = ref(null)
const detailsOpen = computed({
  get: () => Boolean(detailsLog.value),
  set: (open) => {
    if (!open) {
      detailsLog.value = null
    }
  },
})
const form = reactive(createEmptyForm())

const typeOptions = [
  { label: 'Maintenance', value: 'm' },
  { label: 'Service', value: 's' },
]

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
  { name: 'type', label: 'Type', field: 'type', align: 'left', sortable: true },
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
  () => Boolean(selectedOrderId.value) && Boolean(form.type) && Boolean(form.name?.trim()),
)
const totalCost = computed(() => {
  const parts = Number(form.parts)
  const labor = Number(form.labor)
  const partsInCents =
    Number.isFinite(parts) && parts > 0 ? Math.round(parts * 100) : 0
  const laborInCents =
    Number.isFinite(labor) && labor > 0 ? Math.round(labor * 100) : 0

  return (partsInCents + laborInCents) / 100
})
const orderOptions = computed(() =>
  serviceLogStore.orderOptions.map((order) => ({
    label: [templateAutoLabel(order.auto), order.service_date, order.invoice_number]
      .filter(Boolean)
      .join(' — '),
    value: order.service_order_id,
  })),
)
const selectedOrderLabel = computed(
  () => orderOptions.value.find((option) => option.value === selectedOrderId.value)?.label || '—',
)
const visibleLogs = computed(() =>
  selectedOrderId.value
    ? serviceLogStore.serviceLogs.filter((item) => item.service_order_id === selectedOrderId.value)
    : [],
)
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
    type: 'm',
    name: '',
    description: '',
    notes: '',
    parts: 0,
    labor: 0,
    total_cost: 0,
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  editingLogId.value = null
  showForm.value = false
}

function toggleForm() {
  if (showForm.value) {
    resetForm()
    return
  }

  if (!selectedOrderId.value && orderOptions.value.length === 1) {
    selectedOrderId.value = orderOptions.value[0].value
  }
  Object.assign(form, { ...createEmptyForm(), service_order_id: selectedOrderId.value })
  showForm.value = true
}

function editLog(log) {
  Object.assign(form, {
    service_order_id: log.service_order_id,
    type: log.type,
    name: log.name || '',
    description: log.description || '',
    notes: log.notes || '',
    parts: log.parts ?? 0,
    labor: log.labor ?? 0,
    total_cost: log.total_cost ?? 0,
  })
  selectedOrderId.value = log.service_order_id
  editingLogId.value = log.service_log_id
  showForm.value = true
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
    ? await serviceLogStore.updateServiceLog(editingLogId.value, form)
    : await serviceLogStore.createServiceLog(form)

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
    notifySuccess($q, 'Service log deleted successfully.', { color: 'negative' })
  }
}

watch(selectedOrderId, (orderId) => {
  if (showForm.value) {
    form.service_order_id = orderId
  }
})
watch(
  orderOptions,
  (options) => {
    if (selectedOrderId.value && !options.some((o) => o.value === selectedOrderId.value)) {
      selectedOrderId.value = null
    }
    if (!selectedOrderId.value && options.length === 1) {
      selectedOrderId.value = options[0].value
    }
  },
  { immediate: true },
)
watch(currentUserId, load)
onMounted(load)
</script>
