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

          <q-banner v-if="serviceOrderStore.error" class="bg-negative text-white q-mb-md" rounded>
            {{ serviceOrderStore.error }}
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
                <div class="col-12 col-sm-8">
                  <q-input v-model.trim="form.name" label="Name" filled dense />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model="form.service_date" type="date" label="Service date" filled dense />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model.trim="form.shop_name"
                    label="Shop name"
                    filled
                    dense
                    lazy-rules
                    :rules="[(value) => !!value || 'Enter a shop name.']"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input v-model.trim="form.mechanic_name" label="Mechanic" filled dense />
                </div>
                <div class="col-12 col-sm-4">
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
                <div class="col-12 col-sm-8">
                  <q-input v-model.trim="form.invoice_url" label="Invoice URL" filled dense />
                </div>
                <div class="col-12 col-sm-4">
                  <q-toggle v-model="form.is_complete" label="Complete" />
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
                <q-btn flat dense color="accent" label="Details" @click="detailsOrder = props.row" />
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
                {{ detailsOrder?.name || 'Service order details' }}
              </q-card-section>
              <q-card-section class="q-pt-none">
                <div>Shop: {{ detailsOrder?.shop_name || '—' }}</div>
                <div>Mechanic: {{ detailsOrder?.mechanic_name || '—' }}</div>
                <div>Parts: {{ formatMoney(detailsOrder?.parts) }}</div>
                <div>Labor: {{ formatMoney(detailsOrder?.labor) }}</div>
                <div>Total: {{ formatMoney(detailsOrder?.total_cost) }}</div>
                <div v-if="safeInvoiceUrl">
                  Invoice:
                  <a :href="safeInvoiceUrl" target="_blank" rel="noopener noreferrer">View invoice</a>
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
                {{ pendingDeleteOrder?.name || pendingDeleteOrder?.shop_name || 'this service order' }}
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
import NotesEditor from 'components/NotesEditor.vue'
import NotesViewer from 'components/NotesViewer.vue'
import { useServiceOrderStore } from 'src/stores/serviceOrder'
import { templateAutoLabel } from 'src/stores/schedule'
import { useUsersStore } from 'stores/users'
import { useProfileStore } from 'stores/profile'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const serviceOrderStore = useServiceOrderStore()
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const showForm = ref(false)
const editingOrderId = ref(null)
const selectedAutoId = ref(null)
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
  { name: 'name', label: 'Name', field: 'name', align: 'left', sortable: true },
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
const hasRequiredFields = computed(
  () => Boolean(selectedAutoId.value) && Boolean(form.shop_name?.trim()),
)
const totalCost = computed(() => (Number(form.parts) || 0) + (Number(form.labor) || 0))
const autoOptions = computed(() =>
  serviceOrderStore.autoOptions.map((auto) => ({
    label: templateAutoLabel(auto),
    value: auto.auto_id,
  })),
)
const selectedAutoLabel = computed(
  () => autoOptions.value.find((option) => option.value === selectedAutoId.value)?.label || '—',
)
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
    name: '',
    service_date: new Date().toISOString().slice(0, 10),
    mileage_at_service: '',
    parts: 0,
    labor: 0,
    invoice_url: '',
    notes: '',
    is_complete: true,
  }
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  editingOrderId.value = null
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
  Object.assign(form, { ...createEmptyForm(), auto_id: selectedAutoId.value })
  showForm.value = true
}

function editOrder(order) {
  Object.assign(form, {
    auto_id: order.auto_id,
    shop_name: order.shop_name || '',
    mechanic_name: order.mechanic_name || '',
    name: order.name || '',
    service_date: order.service_date || '',
    mileage_at_service: order.mileage_at_service ?? '',
    parts: order.parts ?? 0,
    labor: order.labor ?? 0,
    invoice_url: order.invoice_url || '',
    notes: order.notes || '',
    is_complete: Boolean(order.is_complete),
  })
  selectedAutoId.value = order.auto_id
  editingOrderId.value = order.service_order_id
  showForm.value = true
}

async function load() {
  if (!currentUserId.value) {
    serviceOrderStore.serviceOrders = []
    serviceOrderStore.autoOptions = []
    return
  }

  const profile = await profileStore.loadCurrentProfile(currentUserId.value)
  const isAdmin = Number(profile?.admin_level) > 0
  await serviceOrderStore.loadAutoOptions({
    isAdmin,
    profileId: profile?.profile_id,
  })
  await serviceOrderStore.loadServiceOrders()
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
