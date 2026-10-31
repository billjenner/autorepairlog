<template>
  <q-page>
    <div class="row justify-center">
      <div class="col-12">
        <q-select
          v-model="form.auto_id"
          :options="autoOptions"
          label="Auto template"
          emit-value
          map-options
          clearable
          filled
          dense
          class="q-mb-md"
        />
        <q-card flat bordered>
          <q-expansion-item
            v-model="scheduleExpanded"
            expand-icon="keyboard_arrow_down"
            expanded-icon="keyboard_arrow_up"
            transition-show="jump-down"
            transition-hide="jump-up"
          >
            <template #header>
              <q-item-section>
                <div class="text-h5">Schedules</div>
              </q-item-section>
            </template>

            <q-banner v-if="scheduleStore.error" class="bg-negative text-white q-mb-md" rounded>
              {{ scheduleStore.error }}
            </q-banner>

            <q-banner
              v-else-if="!usersStore.currentUser"
              class="bg-warning text-dark q-mb-md"
              rounded
            >
              Sign in to manage schedules.
            </q-banner>

            <div v-if="!hideTemplateTools" class="text-subtitle1 q-mt-md">Template schedules</div>
            <q-table
              v-if="!hideTemplateTools"
              ref="templateTableRef"
              class="q-mt-sm"
              :rows="scheduleStore.templateSchedules"
              :columns="templateColumns"
              v-model:pagination="templatePagination"
              :table-row-class-fn="templateRowClass"
              :rows-per-page-options="[0]"
              row-key="schedule_id"
              flat
              bordered
              dense
              no-data-label="No template schedules."
            >
              <template #body-cell-select="props">
                <q-td :props="props" auto-width>
                  <q-btn
                    dense
                    :flat="selectedTemplateScheduleId !== props.row.schedule_id"
                    color="accent"
                    :label="
                      selectedTemplateScheduleId === props.row.schedule_id ? 'Selected' : 'Select'
                    "
                    @click="selectedTemplateScheduleId = props.row.schedule_id"
                  />
                </q-td>
              </template>
              <template #body-cell-auto="props">
                <q-td :props="props">
                  {{ autoDescription(props.row) }}
                </q-td>
              </template>
              <template #body-cell-count="props">
                <q-td :props="props">
                  <q-btn
                    v-if="props.value > 0"
                    flat
                    dense
                    color="primary"
                    :label="String(props.value)"
                    @click="openServices(props.row)"
                  />
                  <span v-else>{{ props.value }}</span>
                </q-td>
              </template>
              <template #body-cell-notes="props">
                <q-td :props="props">
                  <q-btn
                    v-if="props.row.notes"
                    flat
                    dense
                    color="primary"
                    label="View notes"
                    @click="openNotes(props.row.notes)"
                  />
                </q-td>
              </template>
              <template #body-cell-created_date="props">
                <q-td :props="props">{{ formatDate(props.row.created_date) }}</q-td>
              </template>
            </q-table>

            <div class="row items-center justify-between q-ml-md q-mt-md">
              <q-btn
                v-if="!hideTemplateTools"
                color="primary"
                :label="showForm ? 'Cancel' : 'Add Schedule'"
                :disable="!usersStore.currentUser || (!showForm && !hasSelectedTemplate)"
                @click="toggleForm"
              >
                <q-tooltip v-if="!hasSelectedTemplate && !showForm">{{
                  selectTemplateMessage
                }}</q-tooltip>
              </q-btn>
            </div>

            <div
              v-if="!hideTemplateTools && !hasSelectedTemplate"
              class="text-caption text-negative"
            >
              {{ selectTemplateMessage }}
            </div>
            <q-form v-if="showForm" @submit.prevent="saveSchedule" class="q-mt-md q-gutter-md">
              <q-card flat bordered class="q-pa-md bg-grey-1">
                <div class="text-subtitle1 q-mb-sm">
                  {{ editingScheduleId ? 'Edit schedule' : 'Schedule details' }}
                </div>

                <div class="q-mt-md">
                  <div class="text-caption text-grey-7 q-mb-xs">Notes</div>
                  <notes-editor v-model="form.notes" />
                </div>
              </q-card>

              <div class="row justify-end q-gutter-sm">
                <q-btn
                  v-if="editingScheduleId"
                  flat
                  color="negative"
                  label="Delete schedule"
                  class="q-mr-auto"
                  @click="requestDeleteEditedSchedule"
                />
                <q-btn flat label="Cancel" @click="resetForm" />
                <q-btn
                  type="submit"
                  color="primary"
                  :label="editingScheduleId ? 'Update schedule' : 'Save schedule'"
                  :loading="scheduleStore.loading"
                  :disable="!editingScheduleId && !hasSelectedTemplate"
                />
              </div>
            </q-form>

            <q-table
              class="q-mt-sm"
              :rows="scheduleStore.schedules"
              :columns="columns"
              :loading="scheduleStore.loading"
              :pagination="{ rowsPerPage: 0 }"
              :rows-per-page-options="[0]"
              hide-pagination
              row-key="schedule_id"
              flat
              bordered
              dense
              table-header-class="bg-accent text-white"
              no-data-label="No schedule records yet."
            >
              <template #body-cell-auto="props">
                <q-td :props="props">
                  {{ autoDescription(props.row) }}
                </q-td>
              </template>
              <template #body-cell-count="props">
                <q-td :props="props">
                  <q-btn
                    v-if="props.value > 0"
                    flat
                    dense
                    color="primary"
                    :label="String(props.value)"
                    @click="openServices(props.row)"
                  />
                  <span v-else>{{ props.value }}</span>
                </q-td>
              </template>
              <template #body-cell-notes="props">
                <q-td :props="props">
                  <q-btn
                    v-if="props.row.notes"
                    flat
                    dense
                    color="primary"
                    label="View notes"
                    @click="openNotes(props.row.notes)"
                  />
                </q-td>
              </template>
              <template #body-cell-created_date="props">
                <q-td :props="props">{{ formatDate(props.row.created_date) }}</q-td>
              </template>
              <template #body-cell-actions="props">
                <q-td :props="props" class="text-right">
                  <q-btn
                    flat
                    dense
                    color="accent"
                    label="Last service Dates"
                    @click="editLastService(props.row)"
                  />
                  <q-btn flat dense color="primary" label="Edit" @click="editSchedule(props.row)" />
                </q-td>
              </template>
            </q-table>

            <schedule-services-dialog v-model="servicesDialogOpen" :services="servicesForDialog" />
            <schedule-last-service-dialog
              v-model="lastServiceDialogOpen"
              :services="newScheduleServices"
              :loading="scheduleStore.loading"
              @save="saveLastServiceValues"
              @delete="deleteNewService"
            />
            <q-dialog v-model="notesDialogOpen">
              <q-card style="min-width: 320px; max-width: 600px; width: 100%">
                <q-card-section class="text-h6">Schedule notes</q-card-section>
                <q-card-section class="q-pt-none">
                  <div v-html="DOMPurify.sanitize(selectedNotes)" />
                </q-card-section>
                <q-card-actions align="right">
                  <q-btn flat label="Close" color="primary" v-close-popup />
                </q-card-actions>
              </q-card>
            </q-dialog>
            <q-dialog v-model="confirmDeleteOpen">
              <q-card style="min-width: 320px">
                <q-card-section class="text-h6">Delete schedule?</q-card-section>
                <q-card-section>This removes the schedule from your list.</q-card-section>
                <q-card-actions align="right">
                  <q-btn
                    flat
                    label="Cancel"
                    color="primary"
                    @click="pendingDeleteSchedule = null"
                  />
                  <q-btn
                    label="Delete"
                    color="negative"
                    :loading="scheduleStore.loading"
                    @click="deleteSchedule"
                  />
                </q-card-actions>
              </q-card>
            </q-dialog>
          </q-expansion-item>
        </q-card>
        <schedule-timeline
          class="q-mt-lg"
          :profile-id="profileStore.currentProfile?.profile_id || null"
          :refresh-key="scheduleStore.schedules"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute } from 'vue-router'
import DOMPurify from 'dompurify'
import NotesEditor from '@/components/NotesEditor.vue'
import ScheduleServicesDialog from '@/components/schedule/ScheduleServicesDialog.vue'
import ScheduleLastServiceDialog from '@/components/schedule/ScheduleLastServiceDialog.vue'
import ScheduleTimeline from '@/components/schedule/ScheduleTimeline.vue'
import { templateAutoLabel, useScheduleStore } from '@/stores/schedule'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const route = useRoute()
const scheduleStore = useScheduleStore()
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const showForm = ref(false)
const editingScheduleId = ref(null)
const pendingDeleteSchedule = ref(null)
const selectedTemplateScheduleId = ref(null)
const hasSelectedTemplate = computed(() => Boolean(selectedTemplateScheduleId.value))
const selectTemplateMessage = 'You must select a template schedule to start with.'
const isAdminUser = ref(false)
const scheduleExpandedOverride = ref(null)
const scheduleDataLoaded = ref(false)
const form = reactive({ auto_id: null, notes: '' })
// Level 0 users who already have a non-template schedule can't add or use templates.
const hideTemplateTools = computed(() => !isAdminUser.value && scheduleStore.schedules.length > 0)
const hasActiveAutoListed = computed(() =>
  [...scheduleStore.schedules, ...scheduleStore.templateSchedules].some(
    (schedule) => schedule.auto?.is_active,
  ),
)
const scheduleExpanded = computed({
  get: () =>
    scheduleExpandedOverride.value ??
    (scheduleDataLoaded.value ? !hasActiveAutoListed.value : false),
  set: (expanded) => {
    scheduleExpandedOverride.value = expanded
  },
})

const columns = [
  { name: 'auto', label: 'Auto', field: 'auto_id', align: 'left' },
  {
    name: 'count',
    label: 'Services',
    field: (row) => row.service?.length ?? 0,
    align: 'left',
    sortable: true,
  },
  { name: 'notes', label: 'Notes', field: 'notes', align: 'left' },
  { name: 'created_date', label: 'Created', field: 'created_date', align: 'left', sortable: true },
  { name: 'actions', label: '', field: 'schedule_id', align: 'right' },
]

const templateColumns = computed(() => [
  { name: 'select', label: '', field: 'schedule_id', align: 'left' },
  ...(isAdminUser.value
    ? [
        {
          name: 'is_template',
          label: 'Is Template',
          field: (row) => Boolean(row.auto?.isTemplate),
          format: (value) => String(value),
          align: 'left',
          sortable: true,
        },
        {
          name: 'schedule_id',
          label: 'Schedule ID',
          field: 'schedule_id',
          align: 'left',
          sortable: true,
        },
        {
          name: 'auto_id',
          label: 'Auto ID',
          field: 'auto_id',
          align: 'left',
          sortable: true,
        },
      ]
    : []),
  ...columns.filter((col) => col.name !== 'actions'),
])
const templatePagination = ref({ sortBy: 'is_template', descending: true, rowsPerPage: 0 })
const templateTableRef = ref(null)

// Marks the row after which the Is Template value changes, in the table's displayed order.
function templateRowClass(row) {
  if (!isAdminUser.value) {
    return ''
  }

  const rows = templateTableRef.value?.computedRows
  const index = rows ? rows.findIndex((item) => item.schedule_id === row.schedule_id) : -1
  const next = index >= 0 ? rows[index + 1] : null
  return next && Boolean(next.auto?.isTemplate) !== Boolean(row.auto?.isTemplate)
    ? 'template-boundary'
    : ''
}

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const autoOptions = computed(() =>
  scheduleStore.templateAutos.map((auto) => ({
    label: templateAutoLabel(auto),
    value: auto.auto_id,
  })),
)
const confirmDeleteOpen = computed({
  get: () => Boolean(pendingDeleteSchedule.value),
  set: (open) => {
    if (!open) {
      pendingDeleteSchedule.value = null
    }
  },
})

const servicesDialogOpen = ref(false)
const lastServiceDialogOpen = ref(false)
const notesDialogOpen = ref(false)
const selectedNotes = ref('')
const newScheduleServices = ref([])
const newScheduleAutoId = ref(null)
const servicesForDialog = ref([])

function openServices(schedule) {
  servicesForDialog.value = schedule.service || []
  servicesDialogOpen.value = true
}

function openNotes(notes) {
  selectedNotes.value = notes
  notesDialogOpen.value = true
}

function autoDescription(schedule) {
  if (schedule.auto) {
    return templateAutoLabel(schedule.auto) || '—'
  }
  const auto = scheduleStore.templateAutos.find((item) => item.auto_id === schedule.auto_id)
  return auto ? templateAutoLabel(auto) : '—'
}

function formatDate(value) {
  return value ? new Date(value).toLocaleDateString() : '—'
}

function resetForm() {
  form.auto_id = null
  form.notes = ''
  editingScheduleId.value = null
  showForm.value = false
}

function toggleForm() {
  if (showForm.value) {
    resetForm()
  } else {
    showForm.value = true
  }
}

function editSchedule(schedule) {
  form.auto_id = schedule.auto_id
  form.notes = schedule.notes || ''
  editingScheduleId.value = schedule.schedule_id
  showForm.value = true
}

function requestDeleteEditedSchedule() {
  if (!editingScheduleId.value) {
    return
  }

  pendingDeleteSchedule.value = {
    schedule_id: editingScheduleId.value,
  }
}

async function load() {
  scheduleDataLoaded.value = false

  if (!currentUserId.value) {
    scheduleStore.schedules = []
    scheduleStore.templateSchedules = []
    scheduleStore.templateAutos = []
    isAdminUser.value = false
    scheduleDataLoaded.value = true
    return
  }

  const profile = await profileStore.loadCurrentProfile(currentUserId.value)
  const isAdmin = Number(profile?.admin_level) > 0
  await scheduleStore.loadTemplateAutos({
    isAdmin,
    profileId: profile?.profile_id,
  })
  await Promise.all([
    scheduleStore.loadSchedules({
      isAdmin,
      profileId: profile?.profile_id,
    }),
    scheduleStore.loadTemplateSchedules({ isAdmin }),
  ])
  isAdminUser.value = isAdmin
  scheduleDataLoaded.value = true

  const requestedAutoId = Number(route.query.autoId)
  if (autoOptions.value.some((auto) => auto.value === requestedAutoId)) {
    form.auto_id = requestedAutoId
  } else if (!form.auto_id && autoOptions.value.length === 1) {
    form.auto_id = autoOptions.value[0].value
  }
}

async function editLastService(schedule) {
  const services = await scheduleStore.loadServices(schedule.schedule_id)
  if (scheduleStore.error) {
    $q.notify({
      type: 'negative',
      message: `Unable to load services: ${scheduleStore.error}`,
    })
    return
  }
  if (!services.length) {
    $q.notify({ type: 'warning', message: 'This schedule has no active services to update.' })
    return
  }

  newScheduleServices.value = services
  newScheduleAutoId.value = schedule.auto_id
  lastServiceDialogOpen.value = true
}

async function saveSchedule() {
  const isEditing = Boolean(editingScheduleId.value)
  const saved = isEditing
    ? await scheduleStore.updateSchedule(editingScheduleId.value, form)
    : await scheduleStore.createSchedule({
        ...form,
        template_schedule_id: selectedTemplateScheduleId.value,
      })

  if (!saved) {
    return
  }

  notifySuccess($q, `Schedule ${isEditing ? 'updated' : 'saved'} successfully.`, {
    color: 'positive',
  })
  const templateId = selectedTemplateScheduleId.value
  resetForm()
  await load()

  if (!isEditing && templateId) {
    const services = await scheduleStore.loadServices(saved.schedule_id)
    if (services.length) {
      newScheduleServices.value = services
      newScheduleAutoId.value = saved.auto_id
      lastServiceDialogOpen.value = true
    }
  }
}

async function deleteNewService(serviceId, removeRow) {
  if (await scheduleStore.deleteService(serviceId)) {
    removeRow()
    await load()
  }
}

async function saveLastServiceValues(updates) {
  const hasValue = (value) => Number(value) > 0
  let startDate = null
  let startDateLoaded = false
  const resolved = []

  for (const { never, interval_miles, interval_months, interval_years, ...values } of updates) {
    if (never) {
      if (hasValue(interval_miles) || (!hasValue(interval_months) && !hasValue(interval_years))) {
        values.last_miles = 0
      } else {
        if (!startDateLoaded) {
          startDate = await scheduleStore.fetchAutoStartDate(newScheduleAutoId.value)
          startDateLoaded = true
        }
        values.last_date = startDate
      }
    }
    resolved.push(values)
  }

  if (await scheduleStore.updateServiceLastValues(resolved)) {
    lastServiceDialogOpen.value = false
    notifySuccess($q, 'Services updated successfully.', { color: 'positive' })
    await load()
  }
}

async function deleteSchedule() {
  const schedule = pendingDeleteSchedule.value
  if (!schedule) {
    return
  }

  if (await scheduleStore.deleteSchedule(schedule.schedule_id)) {
    pendingDeleteSchedule.value = null
    if (editingScheduleId.value === schedule.schedule_id) {
      resetForm()
    }
    notifySuccess($q, 'Schedule deleted successfully.', { color: 'negative' })
  }
}

watch(currentUserId, load)
onMounted(load)
</script>

<style scoped>
:deep(.template-boundary td) {
  border-bottom: 3px solid var(--q-primary);
}
</style>
