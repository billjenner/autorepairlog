import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'

const AUTO_PHOTO_BUCKET = 'auto-photos'

export const useAutoStore = defineStore('Auto', {
  state: () => ({
    auto: [],
    error: null,
    loading: false,
  }),

  actions: {
    toNullableNonNegativeInteger(value) {
      if (value === null || value === undefined || value === '') {
        return null
      }

      const numericValue = Number(value)
      if (!Number.isFinite(numericValue) || numericValue < 0) {
        return null
      }

      return Math.trunc(numericValue)
    },

    buildAutoPayload(profileId, auto = {}) {
      return {
        profile_id: profileId,
        isTemplate: Boolean(auto.isTemplate),
        year: this.toNullableNonNegativeInteger(auto.year),
        make: auto.make?.trim() || null,
        model: auto.model?.trim() || null,
        color: auto.color?.trim() || null,
        vin: auto.vin?.trim() || null,
        purchase_date: auto.purchase_date || null,
        purchase_amount: this.toNullableNonNegativeInteger(auto.purchase_amount),
        last_recorded_mileage: this.toNullableNonNegativeInteger(auto.last_recorded_mileage),
      }
    },

    async loadAuto(profileId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return []
        }

        if (!profileId) {
          this.auto = []
          this.error = 'Create a profile before managing auto.'
          return []
        }

        const { data, error } = await supabase
          .from('auto')
          .select('*')
          .eq('profile_id', profileId)
          .eq('is_active', true)
          .order('created_date', { ascending: false })

        if (error) {
          this.error = error.message
          return []
        }

        this.auto = data || []
        return this.auto
      } finally {
        this.loading = false
      }
    },

    async createAuto(profileId, auto = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!profileId) {
          this.error = 'Create a profile before adding a auto.'
          return null
        }

        const { data, error } = await supabase
          .from('auto')
          .insert(this.buildAutoPayload(profileId, auto))
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.auto = [data, ...this.auto]
        return data
      } finally {
        this.loading = false
      }
    },

    async updateAuto(profileId, autoId, auto = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!profileId || !autoId) {
          this.error = 'A profile and auto are required to update a auto.'
          return null
        }

        const payload = this.buildAutoPayload(profileId, auto)
        delete payload.profile_id

        const { data, error } = await supabase
          .from('auto')
          .update(payload)
          .eq('auto_id', autoId)
          .eq('profile_id', profileId)
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.auto = this.auto.map((item) => (item.auto_id === autoId ? data : item))
        return data
      } finally {
        this.loading = false
      }
    },

    async getAutoPhotoUrl(photoPath) {
      this.error = null

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return null
      }

      if (!photoPath) {
        return null
      }

      const { data, error } = await supabase.storage
        .from(AUTO_PHOTO_BUCKET)
        .createSignedUrl(photoPath, 3600)

      if (error) {
        this.error = error.message
        return null
      }

      return data.signedUrl
    },

    async uploadAutoPhoto(profileId, autoId, file) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!profileId || !autoId || !file) {
          this.error = 'A profile, auto, and photo are required to upload an auto photo.'
          return null
        }

        if (!file.type.startsWith('image/')) {
          this.error = 'Choose an image file to upload.'
          return null
        }

        const extension = file.name
          .split('.')
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, '')
        const photoPath = `${profileId}/${autoId}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
        const { error: uploadError } = await supabase.storage
          .from(AUTO_PHOTO_BUCKET)
          .upload(photoPath, file, { contentType: file.type, upsert: false })

        if (uploadError) {
          this.error = uploadError.message
          return null
        }

        const previousPhotoPath = this.auto.find((item) => item.auto_id === autoId)?.photo_url
        const { data, error } = await supabase
          .from('auto')
          .update({ photo_url: photoPath })
          .eq('auto_id', autoId)
          .eq('profile_id', profileId)
          .select()
          .single()

        if (error) {
          const { error: cleanupError } = await supabase.storage
            .from(AUTO_PHOTO_BUCKET)
            .remove([photoPath])
          this.error = cleanupError
            ? `${error.message} The uploaded photo could not be cleaned up: ${cleanupError.message}`
            : error.message
          return null
        }

        this.auto = this.auto.map((item) => (item.auto_id === autoId ? data : item))

        if (previousPhotoPath && previousPhotoPath !== photoPath) {
          const { error: cleanupError } = await supabase.storage
            .from(AUTO_PHOTO_BUCKET)
            .remove([previousPhotoPath])

          if (cleanupError) {
            this.error = `Photo updated, but the previous photo could not be removed: ${cleanupError.message}`
          }
        }

        return data
      } finally {
        this.loading = false
      }
    },

    async deleteAuto(profileId, autoId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return false
        }

        if (!profileId || !autoId) {
          this.error = 'A profile and auto are required to delete a auto.'
          return false
        }

        const { error } = await supabase
          .from('auto')
          .update({ is_active: false })
          .eq('auto_id', autoId)
          .eq('profile_id', profileId)

        if (error) {
          this.error = error.message
          return false
        }

        this.auto = this.auto.filter((item) => item.auto_id !== autoId)
        return true
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useAutoStore, import.meta.hot))
}
