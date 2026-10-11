<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="q-pa-lg" style="width: min(100%, 560px)">
      <div class="text-h5 text-center q-mb-md">Users</div>

      <div class="text-center q-mb-sm">
        <q-btn color="primary" label="Load users" @click="loadUsers" />
      </div>

      <div v-if="store.error" class="text-center text-primary q-mb-sm">
        {{ store.error }}
      </div>

      <OfflineConnectionCard v-model="showOfflineDialog" />

      <div v-if="!store.users.length" class="text-center text-grey-7">
        No users yet. Create one from the login page or click Load users.
      </div>

      <q-list v-else bordered separator class="rounded-borders">
        <q-item v-for="user in store.users" :key="user.id" clickable>
          <q-item-section>
            <q-item-label caption>
              {{ user.fname }} {{ user.lname }} | {{ user.email }} | {{ user.sex }} |
              {{ user.age }} | {{ roundWeight(user.start_weight) }} |
              {{ roundWeight(user.goal_weight) }} |
              {{ formatDate(user.created_at) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>

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
import { onMounted, ref, watch } from 'vue'
import { useUsersStore } from 'stores/users'
import OfflineConnectionCard from 'components/OfflineConnectionCard.vue'

const store = useUsersStore()
const showOfflineDialog = ref(false)

function loadUsers() {
  store.loadUsers()
}

function roundWeight(value) {
  return value === null || value === undefined ? '' : Math.round(value)
}

function formatDate(value) {
  if (!value) {
    return ''
  }
  return new Date(value).toISOString().slice(0, 10)
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
