import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'

export const useProfileStore = defineStore('Profile', {
  state: () => ({
    profile: [],
    currentProfile: null,
    error: null,
    loading: false,
    isOffline: false,
  }),

  actions: {
    buildProfilePayload(userId, profile = {}) {
      const payload = {
        user_id: userId,
        fname: profile.fname?.trim() || '',
        lname: profile.lname?.trim() || '',
      }

      // Only send email when provided so profile edits don't overwrite it with ''.
      const email = profile.email?.trim().toLowerCase()
      if (email) {
        payload.email = email
      }

      return payload
    },

    async loadProfile() {
      this.error = null
      this.loading = true

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        this.isOffline = true
        this.loading = false
        return []
      }

      try {
        const { data, error } = await supabase.from('profile').select('*').order('created_at', {
          ascending: false,
        })

        if (error) {
          this.error = error.message
          this.isOffline = true
          this.loading = false
          return []
        }

        this.isOffline = false
        this.profile = data || []
        this.loading = false
        return this.profile
      } catch (error) {
        this.error = error?.message || 'Unable to connect to Supabase.'
        this.isOffline = true
        this.loading = false
        return []
      }
    },

    async loadCurrentProfile(userId) {
      this.error = null

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        this.isOffline = true
        return null
      }

      if (!userId) {
        this.error = 'No current user is available.'
        this.currentProfile = null
        return null
      }

      try {
        const { data, error } = await supabase
          .from('profile')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle()

        if (error) {
          this.error = error.message
          this.isOffline = true
          return null
        }

        this.isOffline = false
        this.currentProfile = data || null
        return this.currentProfile
      } catch (error) {
        this.error = error?.message || 'Unable to connect to Supabase.'
        this.isOffline = true
        return null
      }
    },

    async saveProfile(userId, profile = {}) {
      this.error = null

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return null
      }

      if (!userId) {
        this.error = 'No current user is available.'
        return null
      }

      const payload = this.buildProfilePayload(userId, profile)
      const { data, error } = await supabase
        .from('profile')
        .upsert(payload, { onConflict: 'user_id' })
        .select()
        .single()

      if (error) {
        this.error = error.message
        return null
      }

      this.currentProfile = data
      this.profile = this.profile.filter((item) => item.user_id !== userId)
      this.profile.unshift(data)
      return data
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useProfileStore, import.meta.hot))
}
