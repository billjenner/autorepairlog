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
            v-if="navVisible['/dashboard']"
            flat
            icon="dashboard"
            label="Dashboard"
            to="/dashboard"
            class="q-mx-xs"
            style="min-width: 160px; font-size: 0.8rem"
            :style="buttonStyle('/dashboard')"
            @mouseover="hoveredPath = '/dashboard'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="navVisible['/auto']"
            flat
            icon="directions_car"
            label="Auto"
            to="/auto"
            class="q-mx-xs"
            style="min-width: 160px; font-size: 0.8rem"
            :style="buttonStyle('/auto')"
            @mouseover="hoveredPath = '/auto'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="navVisible['/fuel-log']"
            flat
            icon="local_gas_station"
            label="Fuel"
            to="/fuel-log"
            class="q-mx-xs"
            style="min-width: 110px; font-size: 0.8rem"
            :style="buttonStyle('/fuel-log')"
            @mouseover="hoveredPath = '/fuel-log'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="navVisible['/schedule']"
            flat
            icon="event_available"
            label="Schedule"
            to="/schedule"
            class="q-mx-xs"
            style="min-width: 160px; font-size: 0.8rem"
            :style="buttonStyle('/schedule')"
            @mouseover="hoveredPath = '/schedule'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="navVisible['/service']"
            flat
            icon="build"
            label="Service"
            to="/service"
            class="q-mx-xs"
            style="min-width: 160px; font-size: 0.8rem"
            :style="buttonStyle('/service')"
            @mouseover="hoveredPath = '/service'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="navVisible['/service-order']"
            flat
            icon="receipt_long"
            label="Service Order"
            to="/service-order"
            class="q-mx-xs"
            style="min-width: 160px; font-size: 0.8rem"
            :style="buttonStyle('/service-order')"
            @mouseover="hoveredPath = '/service-order'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="navVisible['/service-log']"
            flat
            icon="history"
            label="Service log"
            to="/service-log"
            class="q-mx-xs"
            style="min-width: 160px; font-size: 0.8rem"
            :style="buttonStyle('/service-log')"
            @mouseover="hoveredPath = '/service-log'"
            @mouseleave="hoveredPath = null"
          />
          <q-btn
            v-if="!(usersStore.currentUser && usersStore.currentUser.email)"
            flat
            label="LOGIN"
            to="/login"
            class="q-mx-xs"
            style="min-width: 110px; font-size: 0.8rem"
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
                <q-item clickable v-close-popup @click="router.push('/change-password')">
                  <q-item-section>Change Password</q-item-section>
                </q-item>
                <q-item clickable v-close-popup @click="router.push('/help')">
                  <q-item-section>Help</q-item-section>
                </q-item>
              </q-list>
            </q-menu>
          </q-btn>
        </template>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" side="left" bordered overlay>
      <q-list padding>
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
        <q-item clickable v-ripple @click="navigateAndClose('/')">
          <q-item-section>Intro</q-item-section>
        </q-item>
        <template v-if="isLoggedIn">
          <q-item
            v-if="navVisible['/dashboard']"
            clickable
            v-ripple
            @click="navigateAndClose('/dashboard')"
          >
            <q-item-section avatar>
              <q-icon name="dashboard" />
            </q-item-section>
            <q-item-section>Dashboard</q-item-section>
          </q-item>
          <q-item v-if="navVisible['/auto']" clickable v-ripple @click="navigateAndClose('/auto')">
            <q-item-section avatar>
              <q-icon name="directions_car" />
            </q-item-section>
            <q-item-section>Auto</q-item-section>
          </q-item>
          <q-item
            v-if="navVisible['/fuel-log']"
            clickable
            v-ripple
            @click="navigateAndClose('/fuel-log')"
          >
            <q-item-section avatar>
              <q-icon name="local_gas_station" />
            </q-item-section>
            <q-item-section>Fuel</q-item-section>
          </q-item>
          <q-item
            v-if="navVisible['/schedule']"
            clickable
            v-ripple
            @click="navigateAndClose('/schedule')"
          >
            <q-item-section avatar>
              <q-icon name="event_available" />
            </q-item-section>
            <q-item-section>Schedule</q-item-section>
          </q-item>
          <q-item
            v-if="navVisible['/service']"
            clickable
            v-ripple
            @click="navigateAndClose('/service')"
          >
            <q-item-section avatar>
              <q-icon name="build" />
            </q-item-section>
            <q-item-section>Service</q-item-section>
          </q-item>
          <q-item
            v-if="navVisible['/service-order']"
            clickable
            v-ripple
            @click="navigateAndClose('/service-order')"
          >
            <q-item-section avatar>
              <q-icon name="receipt_long" />
            </q-item-section>
            <q-item-section>Service Order</q-item-section>
          </q-item>
          <q-item
            v-if="navVisible['/service-log']"
            clickable
            v-ripple
            @click="navigateAndClose('/service-log')"
          >
            <q-item-section avatar>
              <q-icon name="history" />
            </q-item-section>
            <q-item-section>Service Log</q-item-section>
          </q-item>
          <q-item clickable v-ripple @click="navigateAndClose('/help')">
            <q-item-section>Help</q-item-section>
          </q-item>
          <q-item v-if="isAdmin" clickable v-ripple @click="navigateAndClose('/users')">
            <q-item-section>Users</q-item-section>
          </q-item>
          <q-item v-if="isAdmin" clickable v-ripple @click="navigateAndClose('/feedback')">
            <q-item-section>Feedback</q-item-section>
          </q-item>
        </template>
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
import { useServiceStore } from '@/stores/service'
import OfflineConnectionCard from '@/components/OfflineConnectionCard.vue'
import { checkLoginBusinessRules } from '@/utils/rules'
import { checkServiceNotifications } from '@/utils/notifications'
import {
  EMPTY_AVAILABILITY,
  deriveNavVisibility,
  readCachedNavAvailability,
  writeCachedLoginStatus,
  writeCachedNavAvailability,
} from '@/utils/navAvailability'

const $q = useQuasar()
const route = useRoute()
const hoveredPath = ref(null)
const usersStore = useUsersStore()
const profileStore = useProfileStore()
const serviceStore = useServiceStore()
const router = useRouter()
const leftDrawerOpen = ref(false)
const deferredInstallPrompt = ref(null)
const showInstallDialog = ref(false)
const showSignOutDialog = ref(false)
const showOfflineDialog = ref(false)
const navAvailability = ref({ ...EMPTY_AVAILABILITY })
let navCheckId = 0
let navUserId = null

const isLoggedIn = computed(() => Boolean(usersStore.currentUser && usersStore.currentUser.email))
const navVisible = computed(() => deriveNavVisibility(navAvailability.value, isLoggedIn.value))

watch(isLoggedIn, (loggedIn) => writeCachedLoginStatus(loggedIn), { immediate: true })

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
    return { backgroundColor: 'var(--q-accent)' }
  }

  if (hoveredPath.value === path) {
    return { backgroundColor: 'var(--q-warning)' }
  }

  return { backgroundColor: 'var(--q-secondary)' }
}

async function refreshNavAvailability() {
  const checkId = ++navCheckId
  const userId = usersStore.currentUser?.user_id
  const isStale = () => checkId !== navCheckId || usersStore.currentUser?.user_id !== userId

  if (!userId) {
    navAvailability.value = { ...EMPTY_AVAILABILITY }
    navUserId = null
    return
  }

  // Cache first (only when the user changes): show the last known state, then confirm via network.
  if (navUserId !== userId) {
    const cached = await readCachedNavAvailability(userId)
    if (isStale()) {
      return
    }
    navAvailability.value = cached || { ...EMPTY_AVAILABILITY }
    navUserId = userId
  }

  const profile =
    profileStore.currentProfile?.user_id === userId
      ? profileStore.currentProfile
      : await profileStore.loadCurrentProfile(userId)

  if (isStale()) {
    return
  }

  const fresh = await serviceStore.loadNavAvailability({
    isAdmin: Number(profile?.admin_level) > 0,
    profileId: profile?.profile_id,
  })

  if (isStale()) {
    return
  }

  if (fresh) {
    navAvailability.value = fresh
    writeCachedNavAvailability(userId, fresh)
  } else {
    console.error('[MainLayout] nav availability check failed:', serviceStore.error)
    $q.notify({
      type: 'negative',
      message: 'Unable to check menu availability.',
      timeout: 7000,
    })
  }

  await checkServiceNotifications($q, profile)
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

// A user who appears logged in but has no loaded profile (initials fall back to 'U')
// has a stale local login; confirm with Supabase and sign out if the session is gone.
async function verifyLoggedInState() {
  const userId = usersStore.currentUser?.user_id
  if (!userId) {
    return
  }

  const profile = await profileStore.loadCurrentProfile(userId)
  if (profile || profileStore.isOffline || usersStore.currentUser?.user_id !== userId) {
    return
  }

  if (!(await usersStore.hasValidSession())) {
    await usersStore.clearCurrentUser()
    profileStore.currentProfile = null
    router.push('/login')
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'visible' && userInitials.value === 'U') {
    verifyLoggedInState()
  }
}

onMounted(() => {
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.addEventListener('appinstalled', handleAppInstalled)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  if (usersStore.currentUser?.user_id) {
    verifyLoggedInState()
  }
})

watch(
  () => [
    usersStore.currentUser?.user_id,
    profileStore.currentProfile?.profile_id,
    profileStore.currentProfile?.admin_level,
    route.path,
  ],
  refreshNavAvailability,
  { immediate: true },
)

watch(
  () => usersStore.currentUser?.user_id,
  (userId) => {
    if (userId) {
      verifyLoggedInState()
    } else {
      profileStore.currentProfile = null
    }
  },
)

watch(
  () => [route.path, usersStore.loginChecksPending],
  async ([path, pending]) => {
    if (path === '/login' || !pending) {
      return
    }

    usersStore.loginChecksPending = false
    const userId = usersStore.currentUser?.user_id
    if (!userId) {
      return
    }

    const profile = await profileStore.loadCurrentProfile(userId)
    try {
      await checkLoginBusinessRules($q, profile?.profile_id, profileStore.error, router)
    } catch (error) {
      console.error('[MainLayout] business rules check failed:', error)
      $q.notify({
        type: 'negative',
        message: 'Unable to check your setup. Please try again later.',
        timeout: 7000,
      })
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
  document.removeEventListener('visibilitychange', handleVisibilityChange)
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
