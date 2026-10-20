import { defineRouter } from '#q-app/wrappers'
import {
  createRouter,
  createMemoryHistory,
  createWebHistory,
  createWebHashHistory,
} from 'vue-router'
import routes from './routes'

const defaultSeo = {
  title: 'Auto Repair Log',
  description:
    'Track your Auto records, manage maintenance and repair schedules, and stay ahead with a clear view of upcoming service needs.',
  image: '/icons/icon-512x512.png',
  type: 'website',
  robots: 'index,follow',
  themeColor: '#94a0ac',
}

function applySeoMeta(route) {
  const seo = { ...defaultSeo, ...(route.meta?.seo || {}) }
  const title = seo.title ? `${seo.title} | Auto Repair Log` : defaultSeo.title
  const description = seo.description || defaultSeo.description
  const canonicalPath = seo.canonicalPath || route.path || '/'
  const origin =
    typeof window !== 'undefined' && window.location?.origin
      ? window.location.origin
      : 'https://autorepairlog.com'
  const canonicalUrl = `${origin}${canonicalPath === '/' ? '/' : `/${canonicalPath.replace(/^\/+/, '').replace(/\/+$/, '')}`}`

  document.title = title

  const setMeta = (key, content, attribute = 'name') => {
    let tag = document.head.querySelector(`meta[${attribute}="${key}"]`)

    if (!tag) {
      tag = document.createElement('meta')
      tag.setAttribute(attribute, key)
      document.head.appendChild(tag)
    }

    tag.setAttribute('content', content)
  }

  setMeta('description', description)
  setMeta('robots', seo.robots || defaultSeo.robots)
  setMeta('theme-color', seo.themeColor || defaultSeo.themeColor)
  setMeta('og:title', seo.title || defaultSeo.title, 'property')
  setMeta('og:description', description, 'property')
  setMeta('og:type', seo.type || defaultSeo.type, 'property')
  setMeta('og:image', seo.image || defaultSeo.image, 'property')
  setMeta('og:url', canonicalUrl, 'property')
  setMeta('twitter:card', seo.twitterCard || 'summary_large_image', 'property')
  setMeta('twitter:title', seo.title || defaultSeo.title, 'property')
  setMeta('twitter:description', description, 'property')
  setMeta('twitter:image', seo.image || defaultSeo.image, 'property')

  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.setAttribute('rel', 'canonical')
    document.head.appendChild(canonical)
  }

  canonical.setAttribute('href', canonicalUrl)
}

/*
 * If not building with SSR mode, you can
 * directly export the Router instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Router instance.
 */

export default defineRouter(async (/* { store, ssrContext } */) => {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history'
      ? createWebHistory
      : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in quasar.conf.js instead!
    // quasar.conf.js -> build -> vueRouterMode
    // quasar.conf.js -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE),
  })

  // Navigation guard to protect certain routes when user not logged in
  try {
    const { useUsersStore } = await import('../stores/users')
    const store = useUsersStore()

    Router.beforeEach(async (to) => {
      const requiresAuth = to.matched.some((record) => record.meta?.requiresAuth)
      const requiresAdmin = to.matched.some((record) => record.meta?.requiresAdmin)

      if (requiresAuth) {
        // Always re-validate against Supabase's own session rather than
        // trusting a possibly stale/local currentUser.
        const validatedUser = await store.restoreSessionFromAuth()

        if (!validatedUser) {
          return { path: '/login', query: { redirect: to.fullPath } }
        }
      }

      if (requiresAuth && to.path !== '/profile') {
        const { useProfileStore } = await import('../stores/profile')
        const profileStore = useProfileStore()
        const userId = store.currentUser?.user_id

        if (userId && !profileStore.currentProfile) {
          await profileStore.loadCurrentProfile(userId)
        }

        if (!profileStore.currentProfile) {
          if (profileStore.isOffline) {
            return { path: '/login', query: { redirect: to.fullPath } }
          }

          return { path: '/profile', query: { redirect: to.fullPath } }
        }
      }

      if (requiresAdmin) {
        const { useProfileStore } = await import('../stores/profile')
        const profileStore = useProfileStore()
        const userId = store.currentUser?.user_id

        if (userId && !profileStore.currentProfile) {
          await profileStore.loadCurrentProfile(userId)
        }

        if (!(Number(profileStore.currentProfile?.admin_level) > 0)) {
          return { path: '/' }
        }
      }

      applySeoMeta(to)
      return true
    })
  } catch {
    // If store cannot be loaded, skip adding the guard and rely on UI-level checks
    Router.beforeEach((to, from, next) => {
      applySeoMeta(to)
      return next()
    })
  }

  applySeoMeta(Router.currentRoute.value)

  return Router
})
