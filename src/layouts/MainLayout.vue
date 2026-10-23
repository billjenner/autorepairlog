<template>
  <q-layout view="lHh Lpr lFf">
    <q-header elevated color="primary">
      <q-toolbar>
        <q-btn
          v-if="$q.screen.lt.md"
          flat
          dense
          round
          icon="menu"
          @click="leftDrawerOpen = !leftDrawerOpen"
        />
        <q-toolbar-title>
          <router-link to="/" class="brand-link row items-center no-wrap">
            <q-img
              src="/icons/favicon-48x48.png"
              alt="Auto Repair Log"
              class="q-mr-sm"
              style="width: 32px; height: 32px; border-radius: 4px"
            />
            <span>Auto Repair Log</span>
          </router-link>
        </q-toolbar-title>

        <template v-if="!$q.screen.lt.md">
          <q-btn
            v-if="usersStore.currentUser && usersStore.currentUser.email"
            flat
            label="Auto"
            to="/auto"
            class="q-mx-sm"
            style="min-width: 135px"
            :style="buttonStyle('/auto')"
            @mouseover="hoveredPath = '/auto'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="usersStore.currentUser && usersStore.currentUser.email"
            flat
            label="Mileage"
            to="/mileage"
            class="q-mx-sm"
            style="min-width: 135px"
            :style="buttonStyle('/mileage')"
            @mouseover="hoveredPath = '/mileage'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="usersStore.currentUser && usersStore.currentUser.email"
            flat
            label="Schedule"
            to="/schedule"
            class="q-mx-sm"
            style="min-width: 135px"
            :style="buttonStyle('/schedule')"
            @mouseover="hoveredPath = '/schedule'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="usersStore.currentUser && usersStore.currentUser.email"
            flat
            label="Service"
            to="/service"
            class="q-mx-sm"
            style="min-width: 135px"
            :style="buttonStyle('/service')"
            @mouseover="hoveredPath = '/service'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="usersStore.currentUser && usersStore.currentUser.email"
            flat
            label="Service Order"
            to="/service-order"
            class="q-mx-sm"
            style="min-width: 135px"
            :style="buttonStyle('/service-order')"
            @mouseover="hoveredPath = '/service-order'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="usersStore.currentUser && usersStore.currentUser.email"
            flat
            label="Service log"
            to="/service-log"
            class="q-mx-sm"
            style="min-width: 135px"
            :style="buttonStyle('/service-log')"
            @mouseover="hoveredPath = '/service-log'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="!(usersStore.currentUser && usersStore.currentUser.email)"
            flat
            label="LOGIN"
            to="/login"
            class="q-mx-sm"
            style="min-width: 135px"
            :style="buttonStyle('/login')"
            @mouseover="hoveredPath = '/login'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-else
            flat
            round
            :label="userInitials"
            aria-label="User menu"
            class="q-mx-sm user-initials-button"
          >
            <q-menu auto-close>
              <q-list style="min-width: 140px">
                <q-item clickable v-close-popup @click="signOut()">
                  <q-item-section>Sign out</q-item-section>
                </q-item>
                <q-separator />
                <q-item clickable v-close-popup @click="router.push('/profile')">
                  <q-item-section>Profile</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" bordered overlay>
      <q-list padding>
        <template v-if="usersStore.currentUser && usersStore.currentUser.email">
          <q-item clickable v-ripple aria-label="Sign out" @click="signOut()">
            <q-item-section avatar>
              <q-avatar color="accent" text-color="white" size="40px">
                {{ userInitials }}
              </q-avatar>
            </q-item-section>
            <q-item-section>Sign out</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="navigateAndClose('/profile')">
            <q-item-section>Profile</q-item-section>
          </q-item>
        </template>
        <q-item clickable v-ripple @click="navigateAndClose('/')">
          <q-item-section>Intro</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="navigateAndClose('/auto')">
          <q-item-section>Auto</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="navigateAndClose('/mileage')">
          <q-item-section>Mileage</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="navigateAndClose('/schedule')">
          <q-item-section>Schedule</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="navigateAndClose('/service')">
          <q-item-section>Service</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="navigateAndClose('/service-order')">
          <q-item-section>Service Order</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="navigateAndClose('/service-log')">
          <q-item-section>Service Log</q-item-section>
        </q-item>
        <q-item clickable v-ripple @click="navigateAndClose('/docs')">
          <q-item-section>Docs</q-item-section>
        </q-item>
        <q-item v-if="isAdmin" clickable v-ripple @click="navigateAndClose('/users')">
          <q-item-section>Users</q-item-section>
        </q-item>
        <q-item v-if="isAdmin" clickable v-ripple @click="navigateAndClose('/feedback')">
          <q-item-section>Feedback</q-item-section>
        </q-item>
        <q-item
          v-if="!(usersStore.currentUser && usersStore.currentUser.email)"
          clickable
          v-ripple
          @click="navigateAndClose('/login')"
        >
          <q-item-section>Login</q-item-section>
        </q-item>
        <q-item v-else clickable v-ripple @click="signOut()">
          <q-item-section>Sign out</q-item-section>
        </q-item>
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view v-slot="{ Component, route: currentRoute }">
        <transition name="screen-fade" mode="out-in">
          <component :is="Component" :key="currentRoute.path" />
        </transition>
      </router-view>
    </q-page-container>
    <q-footer class="bg-primary text-white q-pa-sm">
      <div class="row items-center justify-between">
        <div class="text-caption">V: {{ appVersion }}-{{ appCommit }}</div>
        <div v-if="usersStore.currentUser && usersStore.currentUser.email">
          {{ profileStore.currentProfile?.fname }}
          {{ profileStore.currentProfile?.lname }}
        </div>
        <div v-else class="text-caption">Not logged in</div>
      </div>
    </q-footer>

    <q-dialog v-model="showInstallDialog" persistent>
      <q-card style="min-width: 320px; max-width: 420px">
        <q-card-section>
          <div class="text-h6">Install Auto Repair Log App?</div>
        </q-card-section>

        <q-card-section>
          Install this app on your device for a faster, full-screen experience.
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat color="negative" label="Not now" @click="dismissInstallDialog" />
          <q-btn color="secondary" label="Install" @click="promptInstall" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="showSignOutDialog">
      <q-card style="min-width: 320px; max-width: 420px">
        <q-card-section>
          <div class="text-h6">Sign out?</div>
        </q-card-section>

        <q-card-section>Are you sure you want to sign out?</q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" @click="showSignOutDialog = false" />
          <q-btn color="negative" label="Sign out" @click="confirmSignOut" />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <OfflineConnectionCard v-model="showOfflineDialog" />
  </q-layout>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore } from '@/stores/users'
import { useProfileStore } from '@/stores/profile'
import OfflineConnectionCard from '@/components/OfflineConnectionCard.vue'

const $q = useQuasar()
const route = useRoute()
const hoveredPath = ref(null)
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const router = useRouter()
const leftDrawerOpen = ref(false)
const deferredInstallPrompt = ref(null)
const showInstallDialog = ref(false)
const showSignOutDialog = ref(false)
const showOfflineDialog = ref(false)

const appVersion = import.meta.env.APP_VERSION
const appCommit = import.meta.env.APP_COMMIT

const userInitials = computed(() => {
  const firstInitial = String(profileStore.currentProfile?.fname || '')
    .trim()
    .charAt(0)
  const lastInitial = String(profileStore.currentProfile?.lname || '')
    .trim()
    .charAt(0)

  return `${firstInitial}${lastInitial}`.toUpperCase() || 'U'
})

const isAdmin = computed(() => {
  return Number(profileStore.currentProfile?.admin_level) > 4
})

async function navigate(path) {
  router.push(path)
}

async function signOut() {
  showSignOutDialog.value = true
}

async function confirmSignOut() {
  showSignOutDialog.value = false
  await usersStore.logoutUser()
  router.push('/login')
}

async function navigateAndClose(path) {
  leftDrawerOpen.value = false
  if (path === '/login') {
    router.push(path)
    return
  }

  await navigate(path)
}

function buttonStyle(path) {
  if (route.path === path) {
    return { backgroundColor: 'var(--q-secondary)' }
  }

  if (hoveredPath.value === path) {
    return { backgroundColor: 'var(--q-accent)' }
  }

  return { backgroundColor: 'var(--q-secondary)' }
}

function dismissInstallDialog() {
  showInstallDialog.value = false
}

async function promptInstall() {
  if (!deferredInstallPrompt.value) {
    showInstallDialog.value = false
    return
  }

  deferredInstallPrompt.value.prompt()
  await deferredInstallPrompt.value.userChoice
  deferredInstallPrompt.value = null
  showInstallDialog.value = false
}

function handleBeforeInstallPrompt(event) {
  event.preventDefault()
  deferredInstallPrompt.value = event
  showInstallDialog.value = true
}

function handleAppInstalled() {
  deferredInstallPrompt.value = null
  showInstallDialog.value = false
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)

  if (usersStore.currentUser?.user_id) {
    profileStore.loadCurrentProfile(usersStore.currentUser.user_id)
  }
})

watch(
  () => usersStore.currentUser?.user_id,
  (userId) => {
    if (userId) {
      profileStore.loadCurrentProfile(userId)
    } else {
      profileStore.currentProfile = null
    }
  },
)

watch(
  () => usersStore.offlineAttempts,
  (attempts, previous) => {
    if (attempts > previous) {
      showOfflineDialog.value = true
    }
  },
)

watch(
  () => usersStore.isOffline || profileStore.isOffline,
  (isOffline) => {
    if (isOffline) {
      showOfflineDialog.value = true
    }
  },
)

onBeforeUnmount(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})
</script>

<style scoped>
.screen-fade-enter-active,
.screen-fade-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms ease,
    filter 200ms ease;
}

.screen-fade-enter-from,
.screen-fade-leave-to {
  opacity: 0;
  transform: translateY(18px);
  filter: blur(4px);
}

.screen-fade-enter-to,
.screen-fade-leave-from {
  opacity: 1;
  transform: translateY(0);
  filter: blur(0);
}

.brand-link {
  color: inherit;
  text-decoration: none;
}

.user-initials-button {
  background-color: var(--q-accent);
  min-width: 40px;
  min-height: 40px;
}
</style>
