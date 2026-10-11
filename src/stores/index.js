import { defineStore } from '#q-app/wrappers'
import { createPinia } from 'pinia'

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */
console.log({
  prod: import.meta.env.PROD,
  dev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  nodeEnv: process.env.NODE_ENV,
})

export default defineStore((/* { ssrContext } */) => {
  const pinia = createPinia()

  // You can add Pinia plugins here
  // pinia.use(SomePiniaPlugin)

  return pinia
})
