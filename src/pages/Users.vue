<template>
  <q-page class="q-pa-md">
    <q-card class="q-pa-lg" style="max-width: 1100px; margin: 0 auto">
      <div class="text-h5 text-center q-mb-md">Users</div>

      <div class="text-center q-mb-sm">
        <q-btn color="primary" label="Load users" @click="loadUsers" />
      </div>

      <div v-if="store.error" class="text-center text-primary q-mb-sm">
        {{ store.error }}
      </div>

      <OfflineConnectionCard v-model="showOfflineDialog" />

      <q-input
        v-model="search"
        dense
        outlined
        clearable
        debounce="200"
        label="Search users"
        class="q-mb-md"
      >
        <template #prepend>
          <q-icon name="search" />
        </template>
      </q-input>

      <q-table
        flat
        bordered
        dense
        row-key="user_id"
        :rows="rows"
        :columns="columns"
        :filter="search"
        :filter-method="filterRows"
        :pagination="{ rowsPerPage: 25, sortBy: 'created_at', descending: true }"
        :rows-per-page-options="[10, 25, 50, 0]"
        no-data-label="No users found."
      />

      <div
        v-if="store.currentUser && !store.isOffline"
        class="q-mt-md text-center text-caption text-positive"
      >
        Current user: {{ store.currentUser.email }}
      </div>
      <div v-else-if="store.currentUser" class="q-mt-md text-center text-caption text-warning">
        Current user: offline
      </div>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useUsersStore } from 'stores/users'
import OfflineConnectionCard from 'components/OfflineConnectionCard.vue'

const store = useUsersStore()
const showOfflineDialog = ref(false)
const search = ref('')

function formatDate(value) {
  if (!value) {
    return ''
  }
  return new Date(value).toISOString().slice(0, 10)
}

function formatDateTime(value) {
  if (!value) {
    return ''
  }
  return new Date(value).toLocaleString()
}

const columns = [
  { name: 'fname', label: 'First name', field: 'fname', align: 'left', sortable: true },
  { name: 'lname', label: 'Last name', field: 'lname', align: 'left', sortable: true },
  {
    name: 'admin_level',
    label: 'Admin level',
    field: (row) => Number(row.admin_level),
    align: 'right',
    sortable: true,
  },
  {
    name: 'is_active',
    label: 'Active',
    field: 'is_active',
    format: (value) => (value ? 'Yes' : 'No'),
    align: 'left',
    sortable: true,
  },
  { name: 'email', label: 'Email', field: 'email', align: 'left', sortable: true },
  {
    name: 'last_logged_in',
    label: 'Last logged in',
    field: 'last_logged_in',
    format: formatDateTime,
    align: 'left',
    sortable: true,
  },
  {
    name: 'created_at',
    label: 'Created',
    field: 'created_at',
    format: formatDate,
    align: 'left',
    sortable: true,
  },
]

const rows = computed(() => store.users)

function filterRows(allRows, terms) {
  const needle = String(terms || '')
    .trim()
    .toLowerCase()
  if (!needle) {
    return allRows
  }

  return allRows.filter((row) =>
    columns.some((col) => {
      const raw = typeof col.field === 'function' ? col.field(row) : row[col.field]
      const shown = col.format ? col.format(raw) : raw
      return String(shown ?? '')
        .toLowerCase()
        .includes(needle)
    }),
  )
}

function loadUsers() {
  store.loadUsers()
}

watch(
  () => store.offlineAttempts,
  (attempts, previous) => {
    if (attempts > previous) {
      showOfflineDialog.value = true
    }
  },
)

watch(
  () => store.isOffline,
  (isOffline) => {
    if (isOffline) {
      showOfflineDialog.value = true
    }
  },
)

onMounted(() => {
  loadUsers()
})
</script>
