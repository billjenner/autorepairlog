<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
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

        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between q-mx-md q-mb-md">
            <div class="text-h5">Service Orders</div>
            <q-btn
              color="primary"
              :label="showForm ? 'Cancel' : 'Add Service Order'"
              :disable="!usersStore.currentUser"
              @click="toggleForm"
            />
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
                <div class="col-12 col-sm-4">
                  <q-input v-model.trim="form.invoice_url" label="Invoice URL" filled dense />
                </div>
                <div class="col-12 col-sm-4 flex items-center">
                  <q-toggle v-model="form.is_complete" label="Complete" />
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
                    use-input
                    :filter-options="false"
                    clearable
                    filled
                    dense
                    @filter="(value, update) => filterServices(entry, value, update)"
                    @update:model-value="ensureTrailingEntry"
                  >
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
                  />
                </div>
                <div class="col-12 col-sm-2">
                  <q-input
                    :model-value="formatMoney(entryTotal(entry))"
                    label="Total cost"
                    readonly
                    filled
                    dense
                  />
                </div>
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-3">
                  <q-input v-model.trim="form.invoice_number" label="Invoice number" filled dense />
                </div>
                <div class="col-12 col-sm-3 offset-sm-6">
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
              <div class="row q-col-gutter-md">
                <div class="col-12">
                  <div class="row items-center q-mb-xs">
                    <div class="text-caption text-grey-7">Notes</div>
                    <q-toggle v-model="showNotes" dense class="q-ml-sm" />
                  </div>
                  <notes-editor v-if="showNotes" v-model="form.notes" />
                </div>
              </div>
            </q-card>

            <div class="row justify-end q-gutter-sm">
              <q-btn flat label="Cancel" @click="resetForm" />
              <q-btn
                type="submit"
                color="primary"
                :label="editingOrderId ? 'Update service order' : 'Save service order'"
                :loading="serviceOrderStore.loading"
                :disable="!hasRequiredFields"
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
            no-data-label="No service orders yet."
          >
            <template #body-cell-is_complete="props">
              <q-td :props="props">{{ props.row.is_complete ? 'Yes' : 'No' }}</q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  flat
                  dense
                  color="accent"
                  label="Details"
                  @click="detailsOrder = props.row"
                />
                <q-btn flat dense color="primary" label="Edit" @click="editOrder(props.row)" />
                <q-btn
                  flat
                  dense
                  color="negative"
                  label="Delete"
                  @click="pendingDeleteOrder = props.row"
                />
              </q-td>
            </template>
          </q-table>

          <q-dialog v-model="detailsOpen">
            <q-card style="min-width: 360px; max-width: 600px; width: 100%">
              <q-card-section class="text-h6">
                {{ detailsOrder?.invoice_number || 'Service order details' }}
              </q-card-section>
              <q-card-section class="q-pt-none">
                <div>Shop: {{ detailsOrder?.shop_name || '—' }}</div>
                <div>Mechanic: {{ detailsOrder?.mechanic_name || '—' }}</div>
                <div>Total: {{ formatMoney(detailsOrder?.total_cost) }}</div>
                <div v-if="safeInvoiceUrl">
                  Invoice:
                  <a :href="safeInvoiceUrl" target="_blank" rel="noopener noreferrer"
                    >View invoice</a
                  >
                </div>
              </q-card-section>
              <q-card-section class="q-pt-none">
                <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
                <notes-viewer :notes="detailsOrder?.notes || ''" />
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
import { useServiceOrderStore } from '@/stores/serviceOrder'
import { useServiceStore } from '@/stores/service'
import { useServiceLogStore } from '@/stores/serviceLog'
import { useMileageStore } from '@/stores/mileage'
import { templateAutoLabel } from '@/stores/schedule'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const serviceOrderStore = useServiceOrderStore()
const serviceStore = useServiceStore()
const serviceLogStore = useServiceLogStore()
const mileageStore = useMileageStore()
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const showForm = ref(false)
const showNotes = ref(false)
const editingOrderId = ref(null)
const selectedAutoId = ref(null)
let nextEntryKey = 0
const serviceEntries = ref([])
const autoSelectRef = ref(null)
const pendingDeleteOrder = ref(null)
const detailsOrder = ref(null)
const detailsOpen = computed({
  get: () => Boolean(detailsOrder.value),
  set: (open) => {
    if (!open) {
      detailsOrder.value = null
    }
  },
})
const form = reactive(createEmptyForm())

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`

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
  { name: 'is_complete', label: 'Complete', field: 'is_complete', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'service_order_id', align: 'right' },
]

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const storeError = computed(
  () => serviceOrderStore.error || serviceStore.error || serviceLogStore.error,
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
const visibleOrders = computed(() =>
  selectedAutoId.value
    ? serviceOrderStore.serviceOrders.filter((item) => item.auto_id === selectedAutoId.value)
    : [],
)
const safeInvoiceUrl = computed(() => {
  const url = detailsOrder.value?.invoice_url
  return url && /^https?:\/\//i.test(url) ? url : ''
})
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
  editingOrderId.value = null
  showForm.value = false
}

function createServiceEntry() {
  return { key: nextEntryKey++, service_id: null, search: '', parts: 0, labor: 0 }
}

function resetServiceEntry() {
  serviceEntries.value = [createServiceEntry()]
}

function findService(serviceId) {
  return servicesForAuto.value.find((item) => item.service_id === serviceId)
}

// function serviceType(entry) {
//   const type = findService(entry.service_id)?.type
//   return type ? type.toUpperCase() : ''
// }

function entryTotal(entry) {
  return (Number(entry.parts) || 0) + (Number(entry.labor) || 0)
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
  editingOrderId.value = order.service_order_id
  showForm.value = true
}

async function load() {
  if (!currentUserId.value) {
    serviceOrderStore.serviceOrders = []
    serviceOrderStore.autoOptions = []
    serviceStore.services = []
    serviceStore.scheduleOptions = []
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
}

async function saveServiceOrder() {
  if (!(await autoSelectRef.value?.validate()) || !hasRequiredFields.value) {
    return
  }

  const isEditing = Boolean(editingOrderId.value)
  const saved = isEditing
    ? await serviceOrderStore.updateServiceOrder(editingOrderId.value, form)
    : await serviceOrderStore.createServiceOrder(form)

  if (!saved) {
    return
  }

  // Each selected service is recorded as a service log entry on the saved order.
  const selectedEntries = serviceEntries.value.filter((entry) => findService(entry.service_id))
  for (const entry of selectedEntries) {
    const service = findService(entry.service_id)
    const log = await serviceLogStore.createServiceLog({
      service_order_id: saved.service_order_id,
      type: service.type,
      name: service.name,
      description: service.description,
      parts: entry.parts,
      labor: entry.labor,
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
  resetForm()
}

async function deleteServiceOrder() {
  const order = pendingDeleteOrder.value
  if (!order) {
    return
  }

  if (await serviceOrderStore.deleteServiceOrder(order.service_order_id)) {
    pendingDeleteOrder.value = null
    notifySuccess($q, 'Service order deleted successfully.', { color: 'negative' })
  }
}

watch(
  serviceEntries,
  (entries) => {
    const selected = entries.filter((entry) => findService(entry.service_id))
    if (selected.length) {
      const cents = selected.reduce((sum, entry) => sum + Math.round(entryTotal(entry) * 100), 0)
      form.total_cost = cents / 100
    }
  },
  { deep: true },
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
