<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-8">
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
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between q-mx-md q-mb-md">
            <div class="text-h5">Schedules</div>
          </div>

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
            class="q-mt-sm"
            :rows="scheduleStore.templateSchedules"
            :columns="templateColumns"
            :pagination="{ rowsPerPage: 10 }"
            :rows-per-page-options="[10, 25, 50, 0]"
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
                <a href="#" @click.prevent="openDetails(props.row)">
                  {{ autoDescription(props.row) }}
                </a>
              </q-td>
            </template>
            <template #body-cell-count="props">
              <q-td :props="props">
                <a v-if="props.value > 0" href="#" @click.prevent="openServices(props.row)">
                  {{ props.value }}
                </a>
                <span v-else>{{ props.value }}</span>
              </q-td>
            </template>
            <template #body-cell-notes="props">
              <q-td :props="props">
                <div v-if="props.row.notes" v-html="sanitizeNotes(props.row.notes)" />
              </q-td>
            </template>
            <template #body-cell-created_date="props">
              <q-td :props="props">{{ formatDate(props.row.created_date) }}</q-td>
            </template>
          </q-table>

          <div class="row items-center justify-between q-mt-md">
            <div class="text-subtitle1">My schedules</div>
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

          <div v-if="!hideTemplateTools && !hasSelectedTemplate" class="text-caption text-negative">
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
            :pagination="{ rowsPerPage: 25 }"
            :rows-per-page-options="[10, 25, 50, 0]"
            row-key="schedule_id"
            flat
            bordered
            dense
            no-data-label="No schedule records yet."
          >
            <template #body-cell-auto="props">
              <q-td :props="props">
                <a href="#" @click.prevent="openDetails(props.row)">
                  {{ autoDescription(props.row) }}
                </a>
              </q-td>
            </template>
            <template #body-cell-count="props">
              <q-td :props="props">
                <a v-if="props.value > 0" href="#" @click.prevent="openServices(props.row)">
                  {{ props.value }}
                </a>
                <span v-else>{{ props.value }}</span>
              </q-td>
            </template>
            <template #body-cell-notes="props">
              <q-td :props="props">
                <div v-if="props.row.notes" v-html="sanitizeNotes(props.row.notes)" />
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
                  color="primary"
                  label="Services"
                  @click="
                    router.push({ path: '/service', query: { schedule_id: props.row.schedule_id } })
                  "
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
          />
          <schedule-details-dialog
            v-model="detailsDialogOpen"
            :schedule="detailsSchedule"
            :auto-label="detailsSchedule ? autoDescription(detailsSchedule) : ''"
          />

          <q-dialog v-model="confirmDeleteOpen">
            <q-card style="min-width: 320px">
              <q-card-section class="text-h6">Delete schedule?</q-card-section>
              <q-card-section>This removes the schedule from your list.</q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" @click="pendingDeleteSchedule = null" />
                <q-btn
                  label="Delete"
                  color="negative"
                  :loading="scheduleStore.loading"
                  @click="deleteSchedule"
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
import { useRouter } from 'vue-router'
import DOMPurify from 'dompurify'
import NotesEditor from '@/components/NotesEditor.vue'
import ScheduleServicesDialog from '@/components/schedule/ScheduleServicesDialog.vue'
import ScheduleLastServiceDialog from '@/components/schedule/ScheduleLastServiceDialog.vue'
import ScheduleDetailsDialog from '@/components/schedule/ScheduleDetailsDialog.vue'
import { templateAutoLabel, useScheduleStore } from '@/stores/schedule'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const router = useRouter()
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
const form = reactive({ auto_id: null, notes: '' })
// Level 0 users who already have a non-template schedule can't add or use templates.
const hideTemplateTools = computed(() => !isAdminUser.value && scheduleStore.schedules.length > 0)

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

const templateColumns = [
  { name: 'select', label: '', field: 'schedule_id', align: 'left' },
  ...columns.filter((col) => col.name !== 'actions'),
]

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
const detailsDialogOpen = ref(false)
const lastServiceDialogOpen = ref(false)
const newScheduleServices = ref([])
const detailsSchedule = ref(null)

function openDetails(schedule) {
  detailsSchedule.value = schedule
  detailsDialogOpen.value = true
}
const servicesForDialog = ref([])

function openServices(schedule) {
  servicesForDialog.value = schedule.service || []
  servicesDialogOpen.value = true
}

function autoDescription(schedule) {
  if (schedule.auto) {
    return templateAutoLabel(schedule.auto) || '—'
  }
  const auto = scheduleStore.templateAutos.find((item) => item.auto_id === schedule.auto_id)
  return auto ? templateAutoLabel(auto) : '—'
}

function sanitizeNotes(notes, maxChars = 10) {
  const container = document.createElement('div')
  container.innerHTML = DOMPurify.sanitize(notes)

  let remaining = maxChars
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT)
  const textNodes = []
  while (walker.nextNode()) textNodes.push(walker.currentNode)

  for (const node of textNodes) {
    const text = node.textContent
    if (remaining <= 0) {
      node.remove()
    } else if (text.length > remaining) {
      node.textContent = text.slice(0, remaining) + '…'
      remaining = 0
    } else {
      remaining -= text.length
    }
  }

  return container.innerHTML
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
  if (!currentUserId.value) {
    scheduleStore.schedules = []
    scheduleStore.templateSchedules = []
    scheduleStore.templateAutos = []
    isAdminUser.value = false
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

  if (!form.auto_id && autoOptions.value.length === 1) {
    form.auto_id = autoOptions.value[0].value
  }
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
      lastServiceDialogOpen.value = true
    }
  }
}

async function saveLastServiceValues(updates) {
  if (await scheduleStore.updateServiceLastValues(updates)) {
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
