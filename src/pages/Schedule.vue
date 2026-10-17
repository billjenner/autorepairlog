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
        />
        <q-card flat bordered class="q-pa-md">
          <div class="row items-center justify-between q-mx-md q-mb-md">
            <div class="text-h5">Schedules</div>
            <q-btn
              color="primary"
              :label="showForm ? 'Cancel' : 'Add Schedule'"
              :disable="!usersStore.currentUser"
              @click="toggleForm"
            />
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
              <q-btn flat label="Cancel" @click="resetForm" />
              <q-btn
                type="submit"
                color="primary"
                :label="editingScheduleId ? 'Update schedule' : 'Save schedule'"
                :loading="scheduleStore.loading"
              />
            </div>
          </q-form>

          <div class="text-subtitle1 q-mt-md">Template schedules</div>
          <q-table
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
              <q-td :props="props">{{ autoDescription(props.row) }}</q-td>
            </template>
            <template #body-cell-created_date="props">
              <q-td :props="props">{{ formatDate(props.row.created_date) }}</q-td>
            </template>
          </q-table>

          <div class="text-subtitle1 q-mt-md">My schedules</div>
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
              <q-td :props="props">{{ autoDescription(props.row) }}</q-td>
            </template>
            <template #body-cell-created_date="props">
              <q-td :props="props">{{ formatDate(props.row.created_date) }}</q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn flat dense color="primary" label="Edit" @click="editSchedule(props.row)" />
                <q-btn
                  flat
                  dense
                  color="negative"
                  label="Delete"
                  @click="pendingDeleteSchedule = props.row"
                />
              </q-td>
            </template>
          </q-table>

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
import NotesEditor from 'components/NotesEditor.vue'
import { templateAutoLabel, useScheduleStore } from 'src/stores/schedule'
import { useUsersStore } from 'stores/users'
import { useProfileStore } from 'stores/profile'
import { notifySuccess } from '../utils/notify'

const $q = useQuasar()
const scheduleStore = useScheduleStore()
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const showForm = ref(false)
const editingScheduleId = ref(null)
const pendingDeleteSchedule = ref(null)
const selectedTemplateScheduleId = ref(null)
const form = reactive({ auto_id: null, notes: '' })

const columns = [
  { name: 'auto', label: 'Auto', field: 'auto_id', align: 'left' },
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

async function load() {
  if (!currentUserId.value) {
    scheduleStore.schedules = []
    scheduleStore.templateSchedules = []
    scheduleStore.templateAutos = []
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
    scheduleStore.loadTemplateSchedules(),
  ])
}

async function saveSchedule() {
  const isEditing = Boolean(editingScheduleId.value)
  const saved = isEditing
    ? await scheduleStore.updateSchedule(editingScheduleId.value, form)
    : await scheduleStore.createSchedule(form)

  if (!saved) {
    return
  }

  notifySuccess($q, `Schedule ${isEditing ? 'updated' : 'saved'} successfully.`, {
    color: 'positive',
  })
  resetForm()
  await load()
}

async function deleteSchedule() {
  const schedule = pendingDeleteSchedule.value
  if (!schedule) {
    return
  }

  if (await scheduleStore.deleteSchedule(schedule.schedule_id)) {
    pendingDeleteSchedule.value = null
    notifySuccess($q, 'Schedule deleted successfully.', { color: 'negative' })
  }
}

watch(currentUserId, load)
onMounted(load)
</script>
