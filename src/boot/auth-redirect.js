// auth-redirect.js
import { boot } from 'quasar/wrappers'
import { supabase } from '../lib/supabase'

export default boot(({ router }) => {
  if (!supabase) {
    return
  }

  supabase.auth.onAuthStateChange((event, session) => {
    console.log('[AuthRedirect] Auth event:', event)

    if (event === 'PASSWORD_RECOVERY') {
      console.log('[AuthRedirect] PASSWORD_RECOVERY received')
      console.log('[AuthRedirect] Recovery session:', !!session)

      if (session) {
        router.replace('/reset-password')
      }
    }
  })
})
