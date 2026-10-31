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
          :rules="[(value) => !showForm || !!value || 'Select an auto.']"
          class="col-12 col-sm-6"
        />

        <q-card flat bordered>
          <div class="row items-center justify-between q-mx-md q-my-md q-col-gutter-sm">
            <div class="col row items-center">
              <div class="text-h5">Service Orders</div>
            </div>
            <q-input
              v-model="searchText"
              dense
              outlined
              clearable
              debounce="200"
              placeholder="Search service orders"
              class="col-12 col-md-4 service-list-search"
              style="width: 100%; max-width: 400px"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
            <div class="col-auto service-list-action">
              <q-btn
                color="primary"
                :label="showForm ? 'Cancel' : 'Add Service Order'"
                :disable="!usersStore.currentUser"
                @click="toggleForm"
              />
            </div>
          </div>

          <q-banner v-if="storeError" class="bg-negative text-white q-mb-md" rounded>
            {{ storeError }}
          </q-banner>

          <q-banner
            v-else-if="!usersStore.currentUser"
            class="bg-warning text-dark q-mb-md"
            rounded
          >
            Sign in to manage service orders.
          </q-banner>

          <q-form v-if="showForm" @submit.prevent="saveServiceOrder" class="q-mt-md q-gutter-md">
            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="text-subtitle1 q-mb-sm">
                {{ editingOrderId ? 'Edit service order' : 'Service order details' }}
              </div>
              <div class="row q-col-gutter-md"></div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-5">
                  <q-input
                    v-model.trim="form.shop_name"
                    label="Shop name"
                    filled
                    dense
                    lazy-rules
                    :rules="[(value) => !!value || 'Enter a shop name.']"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input v-model.trim="form.mechanic_name" label="Mechanic" filled dense />
                </div>
                <div class="col-4">
                  <q-input
                    :model-value="selectedAutoLabel"
                    label="Auto"
                    readonly
                    filled
                    dense
                    hint="Change the auto using the selector above."
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="form.service_date"
                    type="date"
                    label="Service date"
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="form.mileage_at_service"
                    type="number"
                    label="Mileage at service"
                    min="0"
                    step="1"
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input v-model.trim="form.invoice_number" label="Invoice number" filled dense />
                </div>
                <div class="col-12 col-sm-4 offset-sm-2 flex items-center">
                  <q-toggle v-model="form.is_complete" label="Work is Complete" />
                </div>
              </div>
              <div
                v-for="log in existingLogs"
                :key="log.service_log_id"
                class="row q-col-gutter-md q-my-md"
              >
                <div class="col-12 col-sm-6">
                  <q-input :model-value="log.name" label="Service" readonly filled dense>
                    <template #append>
                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        aria-label="Remove service"
                        @click="requestRemoveLog(log)"
                      />
                    </template>
                  </q-input>
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="log.parts"
                    type="number"
                    label="Parts"
                    prefix="$"
                    min="0"
                    step="0.01"
                    filled
                    dense
                    @update:model-value="onExistingLogChange(log, true)"
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="log.labor"
                    type="number"
                    label="Labor"
                    prefix="$"
                    min="0"
                    step="0.01"
                    filled
                    dense
                    @update:model-value="onExistingLogChange(log, true)"
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="log.total_cost"
                    type="number"
                    label="Total cost"
                    prefix="$"
                    min="0"
                    step="0.01"
                    filled
                    dense
                    @update:model-value="onExistingLogChange(log, false)"
                  />
                </div>
              </div>
              <div
                v-for="entry in serviceEntries"
                :key="entry.key"
                class="row q-col-gutter-md q-my-md"
              >
                <div class="col-12 col-sm-6">
                  <q-select
                    v-model="entry.service_id"
                    :options="filteredServices(entry)"
                    label="Select a service"
                    option-label="name"
                    option-value="service_id"
                    emit-value
                    map-options
                    bg-color="warning"
                    use-input
                    :filter-options="false"
                    clearable
                    filled
                    dense
                    @filter="(value, update) => filterServices(entry, value, update)"
                    @update:model-value="ensureTrailingEntry"
                  >
                    <template #append>
                      <q-btn
                        v-if="entry.service_id"
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        aria-label="Remove service"
                        @click.stop="requestRemoveEntry(entry)"
                      />
                    </template>
                    <template #option="scope">
                      <q-item v-bind="scope.itemProps">
                        <q-item-section>
                          <q-item-label>
                            <template
                              v-for="(part, index) in serviceNameParts(scope.opt.name, entry)"
                              :key="index"
                            >
                              <span :class="{ 'bg-yellow-3': part.match }">{{ part.text }}</span>
                            </template>
                          </q-item-label>
                        </q-item-section>
                      </q-item>
                    </template>
                  </q-select>
                </div>
                <!-- <div class="col-12 col-sm-1 flex items-center justify-center text-subtitle1">
                  {{ serviceType(entry) }}
                </div> -->
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="entry.parts"
                    type="number"
                    label="Parts"
                    prefix="$"
                    min="0"
                    step="0.01"
                    filled
                    dense
                    @update:model-value="recalcEntryTotal(entry)"
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="entry.labor"
                    type="number"
                    label="Labor"
                    prefix="$"
                    min="0"
                    step="0.01"
                    filled
                    dense
                    @update:model-value="recalcEntryTotal(entry)"
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="entry.total"
                    type="number"
                    label="Total cost"
                    prefix="$"
                    min="0"
                    step="0.01"
                    filled
                    dense
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-10 flex items-center">
                  <q-toggle v-model="showNotes" dense label="Notes" />
                </div>
                <div class="col-12 col-sm-2">
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
              </div>
              <div v-if="showNotes" class="row q-col-gutter-md q-mt-sm">
                <div class="col-12">
                  <notes-editor v-model="form.notes" />
                </div>
              </div>

              <div class="row q-col-gutter-md q-mt-sm items-center">
                <div class="col-12 col-sm-3 flex items-center">
                  <q-toggle v-model="attachInvoice" dense label="Attach Invoice" />
                </div>
                <template v-if="attachInvoice">
                  <div class="col-12 col-sm-5">
                    <q-file
                      v-model="invoiceFile"
                      label="Invoice (PDF or image)"
                      accept="application/pdf,image/*"
                      max-file-size="10485760"
                      filled
                      dense
                      clearable
                      @rejected="onInvoiceRejected"
                    >
                      <template #prepend>
                        <q-icon name="attach_file" />
                      </template>
                    </q-file>
                  </div>
                  <div class="col-12 col-sm-4">
                    <template v-if="currentInvoiceUrl">
                      <q-btn
                        flat
                        round
                        dense
                        icon="delete"
                        color="negative"
                        aria-label="Delete invoice"
                        @click="confirmDeleteInvoiceOpen = true"
                      />
                      Current invoice:
                      <a :href="currentInvoiceUrl" target="_blank" rel="noopener noreferrer"
                        >View invoice</a
                      >
                      <span v-if="invoiceFile" class="text-grey-7">
                        (replaced when the order is saved)</span
                      >
                    </template>
                  </div>
                </template>
              </div>
            </q-card>

            <div class="row justify-end q-gutter-sm">
              <q-btn
                v-if="editingOrderId"
                flat
                color="negative"
                label="DELETE SERVICE ORDER"
                class="q-mr-auto"
                @click="requestDeleteEditedOrder"
              />
              <q-btn flat label="Cancel" @click="resetForm" />
              <q-btn
                type="submit"
                color="primary"
                :label="editingOrderId ? 'Update service order' : 'Save service order'"
                :loading="serviceOrderStore.loading"
                :disable="!hasRequiredFields || !hasAtLeastOneService"
              />
            </div>
          </q-form>

          <q-table
            class="q-mt-md"
            :rows="visibleOrders"
            :columns="columns"
            :loading="serviceOrderStore.loading"
            :pagination="{ rowsPerPage: 25 }"
            :rows-per-page-options="[10, 25, 50, 0]"
            row-key="service_order_id"
            flat
            bordered
            dense
            table-header-class="bg-accent text-white"
            no-data-label="No service orders yet."
          >
            <template #body-cell-service_logs="props">
              <q-td :props="props" class="text-center">
                <q-btn
                  flat
                  dense
                  color="primary"
                  :label="`{${serviceLogCounts[props.row.service_order_id] ?? 0}}`"
                  @click="serviceLogsOrderId = props.row.service_order_id"
                />
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn flat dense color="accent" label="Details" @click="openDetails(props.row)" />
                <q-btn flat dense color="primary" label="Edit" @click="editOrder(props.row)" />
              </q-td>
            </template>
          </q-table>

          <ServiceOrderLogsDialog v-model:service-order-id="serviceLogsOrderId" />

          <q-dialog v-model="detailsOpen">
            <q-card style="min-width: 360px; max-width: 600px; width: 100%">
              <q-card-section>
                <div class="text-h6">
                  {{
                    [detailsOrder?.shop_name, detailsOrder?.mechanic_name]
                      .filter(Boolean)
                      .join(' - ') || 'Service order details'
                  }}
                </div>
                <div class="text-body2">
                  <span v-if="detailsOrder?.invoice_number">
                    Invoice #: {{ detailsOrder.invoice_number }}
                  </span>
                </div>
                <div class="text-body2">Service date: {{ detailsOrder?.service_date || '—' }}</div>
                <div class="text-body2">
                  Mileage: {{ formatMileage(detailsOrder?.mileage_at_service) }}
                </div>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <q-markup-table flat dense>
                  <thead>
                    <tr>
                      <th class="text-left">Service</th>
                      <th class="text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-if="detailsLogsLoading">
                      <td colspan="2" class="text-center text-grey-7">Loading services...</td>
                    </tr>
                    <tr v-else-if="detailsLogsError">
                      <td colspan="2" class="text-negative">{{ detailsLogsError }}</td>
                    </tr>
                    <tr v-for="(log, index) in detailsLogs" :key="log.service_log_id || index">
                      <td>{{ log.name || 'Service' }}</td>
                      <td class="text-right">{{ formatMoney(log.total_cost) }}</td>
                    </tr>
                    <tr v-if="!detailsLogsLoading && !detailsLogsError && !detailsLogs.length">
                      <td colspan="2" class="text-center text-grey-7">No services recorded.</td>
                    </tr>
                  </tbody>
                  <tfoot>
                    <tr>
                      <th class="text-left">SO total</th>
                      <th class="text-right">{{ formatMoney(detailsOrder?.total_cost) }}</th>
                    </tr>
                  </tfoot>
                </q-markup-table>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <div class="text-body2 q-mb-md">
                  Is complete: {{ detailsOrder?.is_complete ? 'Yes' : 'No' }}
                </div>
                <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
                <notes-viewer :notes="detailsOrder?.notes || ''" />
              </q-card-section>
              <q-card-section class="q-pt-none">
                <div class="text-body2">
                  Attachment: {{ detailsOrder?.invoice_url ? 'Available' : 'None' }}
                </div>
                <a
                  v-if="detailsInvoiceUrl"
                  :href="detailsInvoiceUrl"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View attachment
                </a>
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Close" color="primary" v-close-popup />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <q-dialog v-model="confirmDeleteOpen">
            <q-card style="min-width: 320px">
              <q-card-section class="text-h6">Delete service order?</q-card-section>
              <q-card-section>
                This removes
                {{
                  pendingDeleteOrder?.invoice_number ||
                  pendingDeleteOrder?.shop_name ||
                  'this service order'
                }}
                from your list.
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" @click="pendingDeleteOrder = null" />
                <q-btn
                  label="Delete"
                  color="negative"
                  :loading="serviceOrderStore.loading"
                  @click="deleteServiceOrder"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <q-dialog v-model="confirmDeleteInvoiceOpen">
            <q-card style="min-width: 320px">
              <q-card-section class="text-h6">Delete invoice?</q-card-section>
              <q-card-section>Delete the attached invoice from this service order?</q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="No" color="primary" @click="confirmDeleteInvoiceOpen = false" />
                <q-btn
                  label="Yes"
                  color="negative"
                  :loading="serviceOrderStore.loading"
                  @click="deleteInvoice"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>

          <q-dialog v-model="confirmRemoveOpen">
            <q-card style="min-width: 320px">
              <q-card-section class="text-h6">Remove service?</q-card-section>
              <q-card-section>
                Remove {{ pendingRemoval?.name || 'this service' }} from this service order?
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="No" color="primary" @click="pendingRemoval = null" />
                <q-btn
                  label="Yes"
                  color="negative"
                  :loading="serviceLogStore.loading"
                  @click="confirmRemoval"
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
import NotesEditor from '@/components/NotesEditor.vue'
import NotesViewer from '@/components/NotesViewer.vue'
import ServiceOrderLogsDialog from '@/components/ServiceOrderLogsDialog.vue'
import { useServiceOrderStore } from '@/stores/serviceOrder'
import { useServiceStore } from '@/stores/service'
import { useServiceLogStore } from '@/stores/serviceLog'
import { useMileageStore } from '@/stores/mileage'
import { templateAutoLabel } from '@/stores/schedule'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const route = useRoute()
const serviceOrderStore = useServiceOrderStore()
const serviceStore = useServiceStore()
const serviceLogStore = useServiceLogStore()
const mileageStore = useMileageStore()
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const showForm = ref(false)
const showNotes = ref(false)
const attachInvoice = ref(false)
const invoiceFile = ref(null)
const editingOrderId = ref(null)
const selectedAutoId = ref(null)
let nextEntryKey = 0
const serviceEntries = ref([])
const existingLogs = ref([])
const autoSelectRef = ref(null)
const pendingDeleteOrder = ref(null)
const detailsOrder = ref(null)
const detailsLogs = ref([])
const detailsLogsLoading = ref(false)
const detailsLogsError = ref('')
const serviceLogsOrderId = ref(null)
const serviceLogCounts = ref({})
let detailsRequest = 0
const detailsOpen = computed({
  get: () => Boolean(detailsOrder.value),
  set: (open) => {
    if (!open) {
      detailsRequest += 1
      detailsOrder.value = null
      detailsLogs.value = []
      detailsLogsLoading.value = false
      detailsLogsError.value = ''
    }
  },
})
const form = reactive(createEmptyForm())

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`
const formatMileage = (value) =>
  value === null || value === undefined || value === '' ? '—' : Number(value).toLocaleString()
let serviceLogCountsRequest = 0

async function refreshServiceLogCounts() {
  const request = ++serviceLogCountsRequest
  const orderIds = serviceOrderStore.serviceOrders.map((order) => order.service_order_id)
  const counts = await serviceLogStore.fetchLogCountsForOrders(orderIds)
  if (request === serviceLogCountsRequest && counts) {
    serviceLogCounts.value = counts
  }
}

async function openDetails(order) {
  detailsOrder.value = order
  detailsLogs.value = []
  detailsLogsError.value = ''
  detailsLogsLoading.value = true
  const request = ++detailsRequest

  try {
    const logs = await serviceLogStore.fetchLogsForOrder(order.service_order_id)
    if (request === detailsRequest) {
      detailsLogs.value = logs
      detailsLogsError.value = serviceLogStore.error || ''
    }
  } finally {
    if (request === detailsRequest) {
      detailsLogsLoading.value = false
    }
  }
}

const columns = [
  { name: 'service_date', label: 'Date', field: 'service_date', align: 'left', sortable: true },
  {
    name: 'invoice_number',
    label: 'Invoice #',
    field: 'invoice_number',
    align: 'left',
    sortable: true,
  },
  { name: 'shop_name', label: 'Shop', field: 'shop_name', align: 'left', sortable: true },
  {
    name: 'mileage_at_service',
    label: 'Mileage',
    field: 'mileage_at_service',
    align: 'right',
    sortable: true,
  },
  {
    name: 'total_cost',
    label: 'Total',
    field: 'total_cost',
    align: 'right',
    sortable: true,
    format: (value) => formatMoney(value),
  },
  {
    name: 'service_logs',
    label: 'Services',
    field: (row) => serviceLogCounts.value[row.service_order_id] ?? 0,
    align: 'center',
    sortable: true,
  },
  { name: 'actions', label: '', field: 'service_order_id', align: 'right' },
]

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const storeError = computed(
  () =>
    serviceOrderStore.error || serviceStore.error || serviceLogStore.error || mileageStore.error,
)
const hasRequiredFields = computed(
  () => Boolean(selectedAutoId.value) && Boolean(form.shop_name?.trim()),
)
const autoOptions = computed(() =>
  serviceOrderStore.autoOptions.map((auto) => ({
    label: templateAutoLabel(auto),
    value: auto.auto_id,
  })),
)
const selectedAutoLabel = computed(
  () => autoOptions.value.find((option) => option.value === selectedAutoId.value)?.label || '—',
)
const servicesForAuto = computed(() => {
  const scheduleIds = new Set(
    serviceStore.scheduleOptions
      .filter((schedule) => schedule.auto_id === selectedAutoId.value)
      .map((schedule) => schedule.schedule_id),
  )

  return serviceStore.services
    .filter((service) => service.name && scheduleIds.has(service.schedule_id))
    .sort((left, right) => String(left.name || '').localeCompare(String(right.name || '')))
})
const hasAtLeastOneService = computed(
  () =>
    existingLogs.value.length > 0 ||
    serviceEntries.value.some((entry) => findService(entry.service_id)),
)
const searchText = ref('')
const visibleOrders = computed(() => {
  if (!selectedAutoId.value) {
    return []
  }

  const term = searchText.value.trim().toLowerCase()
  return serviceOrderStore.serviceOrders.filter(
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
const detailsInvoiceUrl = ref('')
const currentInvoiceUrl = ref('')
const confirmDeleteOpen = computed({
  get: () => Boolean(pendingDeleteOrder.value),
  set: (open) => {
    if (!open) {
      pendingDeleteOrder.value = null
    }
  },
})

function createEmptyForm() {
  return {
    auto_id: null,
    shop_name: '',
    mechanic_name: '',
    invoice_number: '',
    service_date: new Date().toISOString().slice(0, 10),
    mileage_at_service: '',
    total_cost: 0,
    invoice_url: '',
    notes: '',
    is_complete: true,
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  resetServiceEntry()
  showNotes.value = false
  attachInvoice.value = false
  invoiceFile.value = null
  currentInvoiceUrl.value = ''
  existingLogs.value = []
  editingOrderId.value = null
  showForm.value = false
}

function createServiceEntry() {
  return { key: nextEntryKey++, service_id: null, search: '', parts: 0, labor: 0, total: 0 }
}

function resetServiceEntry() {
  serviceEntries.value = [createServiceEntry()]
}

function findService(serviceId) {
  return servicesForAuto.value.find((item) => item.service_id === serviceId)
}

function entryTotal(entry) {
  return Number(entry.total) || 0
}

// Parts/labor changes refill the total, which the user can still overwrite.
function recalcEntryTotal(entry) {
  const cents =
    Math.round((Number(entry.parts) || 0) * 100) + Math.round((Number(entry.labor) || 0) * 100)
  entry.total = cents / 100
}

function filteredServices(entry) {
  const search = entry.search.trim().toLocaleLowerCase()
  if (!search) {
    return servicesForAuto.value
  }

  return servicesForAuto.value.filter((service) =>
    service.name.toLocaleLowerCase().includes(search),
  )
}

// Keeps one empty row at the end so more services can be added.
function ensureTrailingEntry() {
  const entries = serviceEntries.value
  if (entries[entries.length - 1]?.service_id) {
    entries.push(createServiceEntry())
  }
}

const confirmDeleteInvoiceOpen = ref(false)

async function deleteInvoice() {
  const updated = await serviceOrderStore.deleteInvoice(editingOrderId.value)
  if (!updated) {
    return
  }

  confirmDeleteInvoiceOpen.value = false
  form.invoice_url = ''
  notifySuccess($q, 'Invoice deleted successfully.', { color: 'negative' })
}

const pendingRemoval = ref(null)
const confirmRemoveOpen = computed({
  get: () => Boolean(pendingRemoval.value),
  set: (open) => {
    if (!open) {
      pendingRemoval.value = null
    }
  },
})

function requestRemoveEntry(entry) {
  pendingRemoval.value = { kind: 'entry', target: entry, name: findService(entry.service_id)?.name }
}

function requestRemoveLog(log) {
  pendingRemoval.value = { kind: 'log', target: log, name: log.name }
}

async function confirmRemoval() {
  const removal = pendingRemoval.value
  if (!removal) {
    return
  }

  if (removal.kind === 'entry') {
    removeEntry(removal.target)
  } else if (!(await removeExistingLog(removal.target))) {
    return
  }
  pendingRemoval.value = null
}

function removeEntry(entry) {
  serviceEntries.value = serviceEntries.value.filter((item) => item !== entry)
  if (!serviceEntries.value.length || serviceEntries.value.at(-1).service_id) {
    serviceEntries.value.push(createServiceEntry())
  }
}

function toggleForm() {
  if (showForm.value) {
    resetForm()
    return
  }

  if (!selectedAutoId.value && autoOptions.value.length === 1) {
    selectedAutoId.value = autoOptions.value[0].value
  }
  Object.assign(form, { ...createEmptyForm(), auto_id: selectedAutoId.value })
  resetServiceEntry()
  showForm.value = true
  prefillMileage()
}

// Fills a blank mileage field for a new order from the auto's latest mileage record.
async function prefillMileage() {
  const autoId = selectedAutoId.value
  if (!autoId || editingOrderId.value) {
    return
  }

  const miles = await mileageStore.fetchLatestMiles(autoId)
  if (
    miles !== null &&
    showForm.value &&
    !editingOrderId.value &&
    selectedAutoId.value === autoId &&
    form.mileage_at_service === ''
  ) {
    form.mileage_at_service = miles
  }
}

function filterServices(entry, value, update) {
  update(() => {
    entry.search = String(value || '')
  })
}

function serviceNameParts(name, entry) {
  const text = String(name || '')
  const search = entry.search.trim()
  if (!search) {
    return [{ text, match: false }]
  }

  const lowerText = text.toLocaleLowerCase()
  const lowerSearch = search.toLocaleLowerCase()
  const parts = []
  let start = 0
  let matchIndex = lowerText.indexOf(lowerSearch, start)

  while (matchIndex !== -1) {
    if (matchIndex > start) {
      parts.push({ text: text.slice(start, matchIndex), match: false })
    }
    parts.push({ text: text.slice(matchIndex, matchIndex + search.length), match: true })
    start = matchIndex + search.length
    matchIndex = lowerText.indexOf(lowerSearch, start)
  }

  if (start < text.length) {
    parts.push({ text: text.slice(start), match: false })
  }
  return parts
}

function editOrder(order) {
  Object.assign(form, {
    auto_id: order.auto_id,
    shop_name: order.shop_name || '',
    mechanic_name: order.mechanic_name || '',
    invoice_number: order.invoice_number || '',
    service_date: order.service_date || '',
    mileage_at_service: order.mileage_at_service ?? '',
    total_cost: order.total_cost ?? 0,
    invoice_url: order.invoice_url || '',
    notes: order.notes || '',
    is_complete: Boolean(order.is_complete),
  })
  selectedAutoId.value = order.auto_id
  resetServiceEntry()
  showNotes.value = Boolean(order.notes)
  attachInvoice.value = Boolean(order.invoice_url)
  invoiceFile.value = null
  existingLogs.value = []
  editingOrderId.value = order.service_order_id
  showForm.value = true
  loadExistingLogs(order.service_order_id)
}

function requestDeleteEditedOrder() {
  if (!editingOrderId.value) {
    return
  }

  pendingDeleteOrder.value = {
    service_order_id: editingOrderId.value,
    invoice_number: form.invoice_number,
    shop_name: form.shop_name,
  }
}

async function loadExistingLogs(serviceOrderId) {
  const logs = await serviceLogStore.fetchLogsForOrder(serviceOrderId)
  if (editingOrderId.value === serviceOrderId) {
    dirtyLogIds.clear()
    existingLogs.value = logs
  }
}

const dirtyLogIds = new Set()

function onExistingLogChange(log, recalc) {
  if (recalc) {
    const cents =
      Math.round((Number(log.parts) || 0) * 100) + Math.round((Number(log.labor) || 0) * 100)
    log.total_cost = cents / 100
  }
  dirtyLogIds.add(log.service_log_id)
}

async function removeExistingLog(log) {
  if (await serviceLogStore.deleteServiceLog(log.service_log_id)) {
    existingLogs.value = existingLogs.value.filter(
      (item) => item.service_log_id !== log.service_log_id,
    )
    await refreshServiceLogCounts()
    return true
  }
  return false
}

function onInvoiceRejected() {
  $q.notify({
    color: 'negative',
    message: 'Choose a PDF or image file that is 10 MB or smaller.',
  })
}

async function load() {
  if (!currentUserId.value) {
    serviceOrderStore.serviceOrders = []
    serviceOrderStore.autoOptions = []
    serviceStore.services = []
    serviceStore.scheduleOptions = []
    serviceLogCounts.value = {}
    return
  }

  const profile = await profileStore.loadCurrentProfile(currentUserId.value)
  const isAdmin = Number(profile?.admin_level) > 0
  await Promise.all([
    serviceOrderStore.loadAutoOptions({
      isAdmin,
      profileId: profile?.profile_id,
    }),
    serviceOrderStore.loadServiceOrders(),
    serviceStore.loadScheduleOptions({
      isAdmin,
      profileId: profile?.profile_id,
    }),
    serviceStore.loadServices(),
  ])
  const requestedAutoId = Number(route.query.autoId)
  if (serviceOrderStore.autoOptions.some((auto) => auto.auto_id === requestedAutoId)) {
    selectedAutoId.value = requestedAutoId
  }
  if (route.query.search) {
    searchText.value = String(route.query.search)
  }
  await refreshServiceLogCounts()
}

async function saveServiceOrder() {
  if (
    !(await autoSelectRef.value?.validate()) ||
    !hasRequiredFields.value ||
    !hasAtLeastOneService.value
  ) {
    return
  }

  const isEditing = Boolean(editingOrderId.value)
  if (!isEditing && form.service_date) {
    const highestPreviousMiles = await mileageStore.fetchHighestMilesBeforeDate(
      selectedAutoId.value,
      form.service_date,
    )

    if (mileageStore.error) {
      $q.notify({
        color: 'negative',
        message: `Could not validate mileage: ${mileageStore.error}`,
      })
      return
    }

    const mileageAtService = Number(form.mileage_at_service)
    if (
      highestPreviousMiles !== null &&
      (form.mileage_at_service === '' ||
        form.mileage_at_service === null ||
        !Number.isFinite(mileageAtService) ||
        mileageAtService <= Number(highestPreviousMiles))
    ) {
      $q.notify({
        color: 'negative',
        message: `Mileage at service must be greater than ${Number(highestPreviousMiles).toLocaleString()} miles recorded before this service date.`,
      })
      return
    }
  }

  const saved = isEditing
    ? await serviceOrderStore.updateServiceOrder(editingOrderId.value, form)
    : await serviceOrderStore.createServiceOrder(form)

  if (!saved) {
    return
  }

  // Keep the saved order in edit mode so a retry after a later failure updates it.
  editingOrderId.value = saved.service_order_id

  if (invoiceFile.value) {
    const auto = serviceOrderStore.autoOptions.find((item) => item.auto_id === saved.auto_id)
    const withInvoice = await serviceOrderStore.uploadInvoice(
      auto?.profile_id,
      saved.auto_id,
      saved.service_order_id,
      invoiceFile.value,
    )
    if (!withInvoice) {
      return
    }
    form.invoice_url = withInvoice.invoice_url || ''
    invoiceFile.value = null
  }
  for (const log of existingLogs.value.filter((item) => dirtyLogIds.has(item.service_log_id))) {
    const updated = await serviceLogStore.updateServiceLog(log.service_log_id, {
      ...log,
      use_total_cost: true,
    })
    if (!updated) {
      return
    }
    dirtyLogIds.delete(log.service_log_id)
  }
  // Each selected service is recorded as a service log entry on the saved order.
  const selectedEntries = serviceEntries.value.filter((entry) => findService(entry.service_id))
  for (const entry of selectedEntries) {
    const service = findService(entry.service_id)
    const log = await serviceLogStore.createServiceLog({
      service_order_id: saved.service_order_id,
      service_id: service.service_id,
      service_date: saved.service_date || form.service_date,
      service_miles: saved.mileage_at_service ?? form.mileage_at_service,
      name: service.name,
      notes: saved.notes ?? form.notes,
      parts: entry.parts,
      labor: entry.labor,
      total_cost: entryTotal(entry),
      use_total_cost: true,
    })
    if (!log) {
      // Drop rows already saved so a retry does not duplicate them.
      serviceEntries.value = serviceEntries.value.filter(
        (item) => selectedEntries.indexOf(item) >= selectedEntries.indexOf(entry),
      )
      ensureTrailingEntry()
      return
    }
  }

  notifySuccess($q, `Service order ${isEditing ? 'updated' : 'saved'} successfully.`, {
    color: 'positive',
  })
  await refreshServiceLogCounts()
  resetForm()
}

async function deleteServiceOrder() {
  const order = pendingDeleteOrder.value
  if (!order) {
    return
  }

  if (await serviceOrderStore.deleteServiceOrder(order.service_order_id)) {
    pendingDeleteOrder.value = null
    if (editingOrderId.value === order.service_order_id) {
      resetForm()
    }
    await refreshServiceLogCounts()
    notifySuccess($q, 'Service order deleted successfully.', { color: 'negative' })
  }
}

watch(
  [serviceEntries, existingLogs],
  ([entries, logs]) => {
    const selected = entries.filter((entry) => findService(entry.service_id))
    if (selected.length || logs.length) {
      const entryCents = selected.reduce(
        (sum, entry) => sum + Math.round(entryTotal(entry) * 100),
        0,
      )
      const logCents = logs.reduce(
        (sum, log) => sum + Math.round(Number(log.total_cost || 0) * 100),
        0,
      )
      form.total_cost = (entryCents + logCents) / 100
    }
  },
  { deep: true },
)
let invoiceUrlRequestId = 0
watch(
  () => form.invoice_url,
  async (path) => {
    const requestId = ++invoiceUrlRequestId
    const url = path ? await serviceOrderStore.getInvoiceUrl(path) : ''
    if (requestId === invoiceUrlRequestId) {
      currentInvoiceUrl.value = url || ''
    }
  },
)
watch(
  () => detailsOrder.value?.invoice_url,
  async (path) => {
    detailsInvoiceUrl.value = ''
    if (!path) {
      return
    }
    const url = await serviceOrderStore.getInvoiceUrl(path)
    if (detailsOrder.value?.invoice_url === path) {
      detailsInvoiceUrl.value = url || ''
    }
  },
)
watch(selectedAutoId, (autoId) => {
  resetServiceEntry()
  if (showForm.value) {
    form.auto_id = autoId
    if (!editingOrderId.value) {
      form.mileage_at_service = ''
      prefillMileage()
    }
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
