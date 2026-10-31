<template>
  <component :is="embedded ? 'div' : 'q-page'" :class="!embedded ? 'q-pa-lg' : ''">
    <div :class="!embedded ? 'row justify-center' : ''">
      <div :class="!embedded ? 'col-12' : ''">
        <component
          :is="embedded ? 'div' : 'q-card'"
          :flat="!embedded"
          :bordered="!embedded"
          :class="!embedded ? 'q-pa-md' : ''"
        >
          <div class="row items-center justify-between q-mx-md q-mb-md">
            <div class="text-h5">Autos</div>
            <q-input
              v-if="canSearchAutos"
              v-model="searchText"
              dense
              outlined
              clearable
              debounce="200"
              placeholder="Search autos"
              class="col-grow q-mx-md"
              style="max-width: 400px"
            >
              <template #prepend><q-icon name="search" /></template>
            </q-input>
            <q-btn
              color="primary"
              :label="showForm ? 'Cancel' : 'Add Auto'"
              :disable="!profileId"
              @click="toggleForm"
            />
          </div>

          <q-banner v-if="autoStore.error" class="bg-negative text-white q-mb-md" rounded>
            {{ autoStore.error }}
          </q-banner>

          <q-banner
            v-else-if="!usersStore.currentUser"
            class="bg-warning text-dark q-mb-md"
            rounded
          >
            Sign in to manage autos.
          </q-banner>

          <q-banner v-else-if="!profileId" class="bg-warning text-dark q-mb-md" rounded>
            Create your profile before adding a auto.
            <q-btn flat dense label="Go to Profile" to="/profile" class="q-ml-sm" />
          </q-banner>

          <q-form
            v-if="showForm && profileId"
            @submit.prevent="saveAuto"
            class="q-gutter-md"
            style="margin-top: 0"
          >
            <q-card flat bordered class="q-pa-md bg-grey-1">
              <div class="text-subtitle1 q-mb-sm">
                {{ editingAutoId ? 'Edit auto' : 'Auto details' }}
              </div>
              <div class="row q-col-gutter-md">
                <div class="col-12 col-sm-2">
                  <q-input
                    v-model="form.year"
                    type="number"
                    label="Year"
                    filled
                    dense
                    min="1886"
                    step="1"
                    :rules="[
                      (value) =>
                        !value ||
                        (Number(value) >= 1886 && Number(value) <= new Date().getFullYear() + 1) ||
                        'Enter a valid auto year.',
                    ]"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model.trim="form.make"
                    label="Make"
                    filled
                    dense
                    :rules="[(value) => !!value || 'Make is required.']"
                  />
                </div>
                <div class="col-12 col-sm-4">
                  <q-input
                    v-model.trim="form.model"
                    label="Model"
                    filled
                    dense
                    :rules="[(value) => !!value || 'Model is required.']"
                  />
                </div>

                <div class="col-12 col-sm-2">
                  <q-input v-model.trim="form.color" label="Color" filled dense />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model.trim="form.vin"
                    label="VIN"
                    filled
                    dense
                    maxlength="17"
                    :rules="[
                      (value) => !value || value.length === 17 || 'VIN must contain 17 characters.',
                    ]"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model="form.purchase_amount"
                    type="number"
                    label="Purchase amount"
                    prefix="$"
                    filled
                    dense
                    min="0"
                    step="1"
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model="form.purchase_date"
                    type="date"
                    label="Purchase date"
                    filled
                    dense
                  />
                </div>

                <div class="col-12 col-sm-3">
                  <q-input
                    v-model="form.purchase_mileage"
                    type="number"
                    label="Purchase mileage"
                    filled
                    dense
                    min="0"
                    step="1"
                  />
                </div>
                <div class="col-12 col-sm-3 offset-sm-6">
                  <q-input
                    v-model="form.latest_mileage_date"
                    type="date"
                    label="Latest mileage date"
                    filled
                    dense
                  />
                </div>
                <div class="col-12 col-sm-3">
                  <q-input
                    v-model="form.latest_mileage"
                    type="number"
                    label="Latest mileage"
                    filled
                    dense
                    min="0"
                    step="1"
                  />
                </div>

                <div class="col-12 row items-center no-wrap q-gutter-sm">
                  <q-file
                    v-model="photoFile"
                    label="Auto photo"
                    accept="image/*"
                    max-file-size="10485760"
                    filled
                    dense
                    clearable
                    class="col"
                    @rejected="onPhotoRejected"
                  />
                  <q-btn
                    v-if="attachedPhotoPath"
                    flat
                    round
                    dense
                    color="negative"
                    icon="delete"
                    aria-label="Delete auto photo"
                    :disable="autoStore.loading"
                    @click="removeAutoPhoto"
                  >
                    <q-tooltip>Delete auto photo</q-tooltip>
                  </q-btn>
                </div>
                <div v-if="photoPreviewUrl" class="col-12">
                  <q-img
                    :src="photoPreviewUrl"
                    alt="Current auto photo"
                    fit="contain"
                    style="max-width: 320px; max-height: 220px"
                  />
                </div>
                <div v-if="canUseAutoTemplates" class="col-12">
                  <q-toggle v-model="form.isTemplate" label="Use as a auto template" />
                </div>
              </div>
            </q-card>

            <div class="row justify-end q-gutter-sm">
              <q-btn
                v-if="editingAutoId"
                flat
                color="negative"
                label="Delete Auto"
                class="q-mr-auto"
                @click="requestDeleteEditedAuto"
              />
              <q-btn flat label="Cancel" @click="resetForm" />
              <q-btn
                type="submit"
                color="primary"
                :label="editingAutoId ? 'Update auto' : 'Save auto'"
                :loading="autoStore.loading"
              />
            </div>
          </q-form>

          <q-table
            class="q-mt-md"
            :rows="activeAutos"
            :columns="columns"
            :loading="autoStore.loading"
            v-model:selected="selectedAutos"
            selection="single"
            :pagination="{ rowsPerPage: 25 }"
            :rows-per-page-options="[10, 25, 50, 0]"
            row-key="auto_id"
            flat
            bordered
            dense
            table-header-class="bg-accent text-white"
            no-data-label="No auto records yet."
          >
            <template #body-cell-photo="props">
              <q-td :props="props">
                <q-img
                  v-if="autoPhotoUrls[props.row.auto_id]"
                  :src="autoPhotoUrls[props.row.auto_id]"
                  :alt="`${autoLabel(props.row)} photo`"
                  width="48px"
                  height="48px"
                  fit="cover"
                  class="rounded-borders"
                />
              </q-td>
            </template>
            <template #body-cell-auto="props">
              <q-td :props="props">
                {{ autoLabel(props.row) }}
              </q-td>
            </template>
            <template #body-cell-purchase_date="props">
              <q-td :props="props">
                {{ props.row.purchase_date || '—' }}
              </q-td>
            </template>
            <template #body-cell-actions="props">
              <q-td :props="props" class="text-right">
                <q-btn
                  flat
                  dense
                  color="accent"
                  label="Record Milage"
                  :to="{ path: '/mileage', query: { autoId: props.row.auto_id } }"
                />
                <q-btn flat dense color="primary" label="Edit" @click="editAuto(props.row)" />
              </q-td>
            </template>
          </q-table>

          <MileageContent
            v-if="selectedActiveAuto"
            :key="selectedActiveAuto.auto_id"
            class="q-mt-md"
            v-model:selected-auto-id="selectedAutoId"
            v-model:show-form="showMileageForm"
            :auto-options="autoOptions"
          />

          <q-dialog v-model="confirmDeleteOpen">
            <q-card style="min-width: 320px">
              <q-card-section class="text-h6">Delete auto?</q-card-section>
              <q-card-section>
                This removes {{ autoLabel(pendingDeleteAuto) }} from your autos.
              </q-card-section>
              <q-card-actions align="right">
                <q-btn flat label="Cancel" color="primary" @click="pendingDeleteAuto = null" />
                <q-btn
                  label="Delete"
                  color="negative"
                  :loading="autoStore.loading"
                  @click="deleteAuto"
                />
              </q-card-actions>
            </q-card>
          </q-dialog>
        </component>
      </div>
    </div>
  </component>
</template>

<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import MileageContent from '@/components/MileageContent.vue'
import { useAutoStore } from '@/stores/auto'
import { useMileageStore } from '@/stores/mileage'
import { useProfileStore } from '@/stores/profile'
import { useUsersStore } from '@/stores/users'
import { notifySuccess } from '../utils/notify'

defineProps({
  embedded: {
    type: Boolean,
    default: false,
  },
})

const $q = useQuasar()
const autoStore = useAutoStore()
const mileageStore = useMileageStore()
const profileStore = useProfileStore()
const usersStore = useUsersStore()
const showForm = ref(false)
const editingAutoId = ref(null)
const selectedAutos = ref([])
const showMileageForm = ref(false)
const pendingDeleteAuto = ref(null)
const photoFile = ref(null)
const photoPreviewUrl = ref(null)
const attachedPhotoPath = ref(null)
const autoPhotoUrls = ref({})
let photoUrlRequestId = 0
let loadedLatest = null
const form = reactive(createEmptyForm())

const columns = [
  { name: 'photo', label: 'Photo', field: 'photo_url', align: 'left' },
  { name: 'auto', label: 'Auto', field: 'model', align: 'left', sortable: true },
  { name: 'color', label: 'Color', field: 'color', align: 'left', sortable: true },
  { name: 'vin', label: 'VIN', field: 'vin', align: 'left' },
  {
    name: 'purchase_date',
    label: 'Purchased',
    field: 'purchase_date',
    align: 'left',
    sortable: true,
  },
  {
    name: 'purchase_mileage',
    label: 'Purchase Mileage',
    field: 'purchase_mileage',
    align: 'right',
    sortable: true,
  },
  { name: 'actions', label: '', field: 'auto_id', align: 'right' },
]

const currentUserId = computed(() => usersStore.currentUser?.user_id || null)
const searchText = ref('')
const canSearchAutos = computed(() => Number(profileStore.currentProfile?.admin_level) > 0)
const activeAutos = computed(() => {
  const active = autoStore.auto.filter((auto) => auto.is_active)
  const term = canSearchAutos.value ? searchText.value?.trim().toLowerCase() : ''
  if (!term) {
    return active
  }

  return active.filter((auto) =>
    Object.values(auto).some(
      (value) =>
        value !== null && typeof value !== 'object' && String(value).toLowerCase().includes(term),
    ),
  )
})
const selectedAutoId = computed({
  get: () => selectedAutos.value[0]?.auto_id ?? null,
  set: (autoId) => {
    const auto = activeAutos.value.find((item) => item.auto_id === autoId)
    selectedAutos.value = auto ? [auto] : []
  },
})
const selectedActiveAuto = computed(
  () => activeAutos.value.find((auto) => auto.auto_id === selectedAutoId.value) || null,
)
const autoOptions = computed(() =>
  activeAutos.value.map((auto) => ({
    label: autoLabel(auto),
    value: auto.auto_id,
  })),
)
const profileId = computed(() => profileStore.currentProfile?.profile_id || null)
const canUseAutoTemplates = computed(() => Number(profileStore.currentProfile?.admin_level) >= 5)
const confirmDeleteOpen = computed({
  get: () => Boolean(pendingDeleteAuto.value),
  set: (open) => {
    if (!open) {
      pendingDeleteAuto.value = null
    }
  },
})

function createEmptyForm() {
  return {
    year: null,
    make: '',
    model: '',
    color: '',
    vin: '',
    purchase_date: null,
    purchase_amount: null,
    purchase_mileage: null,
    latest_mileage_date: todayString(),
    latest_mileage: null,
    isTemplate: true,
  }
}

function todayString() {
  const today = new Date()
  return [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
}

function resetForm() {
  Object.assign(form, createEmptyForm())
  loadedLatest = null
  editingAutoId.value = null
  photoFile.value = null
  photoPreviewUrl.value = null
  attachedPhotoPath.value = null
  showForm.value = false
}

function toggleForm() {
  if (showForm.value) {
    resetForm()
  } else {
    showForm.value = true
  }
}

function autoLabel(auto) {
  if (!auto) {
    return ''
  }

  return [auto.year, auto.make, auto.model].filter(Boolean).join(' ') || 'Unnamed auto'
}

function onPhotoRejected() {
  $q.notify({
    color: 'negative',
    message: 'Auto photo must be 10 MB or smaller.',
  })
}

async function editAuto(auto) {
  selectedAutos.value = [auto]
  Object.assign(form, {
    year: auto.year,
    make: auto.make || '',
    model: auto.model || '',
    color: auto.color || '',
    vin: auto.vin || '',
    purchase_date: auto.purchase_date || null,
    purchase_amount: auto.purchase_amount,
    purchase_mileage: auto.purchase_mileage,
    latest_mileage_date: todayString(),
    latest_mileage: null,
    isTemplate: auto.isTemplate,
  })
  editingAutoId.value = auto.auto_id
  const latest = await mileageStore.fetchLatestRecord(auto.auto_id)
  if (latest) {
    form.latest_mileage = latest.miles
    form.latest_mileage_date = latest.date || todayString()
    loadedLatest = { miles: latest.miles, date: latest.date || todayString() }
  } else {
    loadedLatest = null
  }
  photoFile.value = null
  attachedPhotoPath.value = auto.photo_url || null
  photoPreviewUrl.value = auto.photo_url ? await autoStore.getAutoPhotoUrl(auto.photo_url) : null
  showForm.value = true
}

async function removeAutoPhoto() {
  if (!profileId.value || !editingAutoId.value || !attachedPhotoPath.value) {
    return
  }

  const updatedAuto = await autoStore.removeAutoPhoto(profileId.value, editingAutoId.value)
  if (!updatedAuto) {
    return
  }

  attachedPhotoPath.value = null
  photoPreviewUrl.value = null
  if (!autoStore.error) {
    notifySuccess($q, 'Auto photo removed successfully.', { color: 'positive' })
  }
}

function requestDeleteEditedAuto() {
  if (!editingAutoId.value) {
    return
  }

  pendingDeleteAuto.value = {
    auto_id: editingAutoId.value,
    year: form.year,
    make: form.make,
    model: form.model,
  }
}

async function loadAuto() {
  if (!currentUserId.value) {
    autoStore.auto = []
    return
  }

  const profile = await profileStore.loadCurrentProfile(currentUserId.value)
  if (profile?.profile_id) {
    await autoStore.loadAuto(profile.profile_id)
  } else {
    autoStore.auto = []
    if (profileStore.error) {
      autoStore.error = profileStore.error
    }
  }
}

async function saveAuto() {
  const isEditing = Boolean(editingAutoId.value)
  let savedAuto = isEditing
    ? await autoStore.updateAuto(profileId.value, editingAutoId.value, form)
    : await autoStore.createAuto(profileId.value, form)

  if (!savedAuto) {
    return
  }

  if (!isEditing) {
    editingAutoId.value = savedAuto.auto_id
  }

  if (photoFile.value) {
    savedAuto = await autoStore.uploadAutoPhoto(profileId.value, savedAuto.auto_id, photoFile.value)
    if (!savedAuto) {
      return
    }
  }

  const hasLatestMileage = form.latest_mileage !== null && form.latest_mileage !== ''
  const unchangedLatest =
    loadedLatest &&
    Number(form.latest_mileage) === Number(loadedLatest.miles) &&
    form.latest_mileage_date === loadedLatest.date
  if (hasLatestMileage && form.latest_mileage_date && !unchangedLatest) {
    const mileage = await mileageStore.createMileage({
      auto_id: savedAuto.auto_id,
      miles: form.latest_mileage,
      date: form.latest_mileage_date,
    })
    if (!mileage) {
      $q.notify({ color: 'negative', message: mileageStore.error || 'Unable to save mileage.' })
      return
    }
  }

  notifySuccess($q, `Auto ${isEditing ? 'updated' : 'saved'} successfully.`, {
    color: 'positive',
  })
  resetForm()
}

async function deleteAuto() {
  const auto = pendingDeleteAuto.value
  if (!auto) {
    return
  }

  const deleted = await autoStore.deleteAuto(profileId.value, auto.auto_id)
  if (deleted) {
    pendingDeleteAuto.value = null
    if (editingAutoId.value === auto.auto_id) {
      resetForm()
    }
    notifySuccess($q, 'Auto deleted successfully.', { color: 'negative' })
  }
}

watch(currentUserId, loadAuto)
watch(
  () => autoStore.auto.map((auto) => `${auto.auto_id}:${auto.photo_url || ''}`).join('|'),
  async () => {
    const requestId = ++photoUrlRequestId
    const autosWithPhotos = autoStore.auto.filter((auto) => auto.photo_url)
    const urls = await Promise.all(
      autosWithPhotos.map(async (auto) => [
        auto.auto_id,
        await autoStore.getAutoPhotoUrl(auto.photo_url),
      ]),
    )

    if (requestId === photoUrlRequestId) {
      autoPhotoUrls.value = Object.fromEntries(urls.filter(([, url]) => url))
    }
  },
  { immediate: true },
)
onMounted(loadAuto)
</script>
