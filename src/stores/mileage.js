import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'

export const useMileageStore = defineStore('Mileage', {
  state: () => ({
    mileage: [],
    error: null,
    loading: false,
  }),

  actions: {
    buildPayload(record = {}) {
      return {
        auto_id: record.auto_id,
        miles: Math.trunc(Number(record.miles)),
        date: record.date || null,
      }
    },

    validate(record = {}) {
      if (!record.auto_id) {
        return 'Select an auto.'
      }

      const miles = Number(record.miles)
      if (record.miles === null || record.miles === '' || !Number.isFinite(miles) || miles < 0) {
        return 'Miles must be zero or greater.'
      }

      if (!record.date) {
        return 'Date is required.'
      }

      return null
    },

    async loadMileage(autoIds) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return []
        }

        if (!autoIds?.length) {
          this.mileage = []
          return []
        }

        const { data, error } = await supabase
          .from('mileage')
          .select('*')
          .in('auto_id', autoIds)
          .eq('is_active', true)
          .order('date', { ascending: false, nullsFirst: false })
          .order('created_date', { ascending: false })

        if (error) {
          this.error = error.message
          return []
        }

        this.mileage = data || []
        return this.mileage
      } finally {
        this.loading = false
      }
    },

    async createMileage(record = {}) {
      this.error = null

      const validationError = this.validate(record)
      if (validationError) {
        this.error = validationError
        return null
      }

      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        const { data, error } = await supabase
          .from('mileage')
          .insert(this.buildPayload(record))
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.mileage = [data, ...this.mileage]
        return data
      } finally {
        this.loading = false
      }
    },

    async updateMileage(mileageId, record = {}) {
      this.error = null

      const validationError = this.validate(record)
      if (validationError) {
        this.error = validationError
        return null
      }

      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!mileageId) {
          this.error = 'A mileage record is required to update.'
          return null
        }

        const { data, error } = await supabase
          .from('mileage')
          .update(this.buildPayload(record))
          .eq('mileage_id', mileageId)
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.mileage = this.mileage.map((item) => (item.mileage_id === mileageId ? data : item))
        return data
      } finally {
        this.loading = false
      }
    },

    async deleteMileage(mileageId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return false
        }

        if (!mileageId) {
          this.error = 'A mileage record is required to delete.'
          return false
        }

        const { error } = await supabase.from('mileage').delete().eq('mileage_id', mileageId)

        if (error) {
          this.error = error.message
          return false
        }

        this.mileage = this.mileage.filter((item) => item.mileage_id !== mileageId)
        return true
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useMileageStore, import.meta.hot))
}
