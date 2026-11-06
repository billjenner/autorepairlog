import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'

function toNullableNumber(value, { integer = false, decimals = null } = {}) {
  if (value === null || value === undefined || value === '') {
    return null
  }

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue) || numericValue < 0) {
    return null
  }

  if (integer) {
    return Math.trunc(numericValue)
  }
  return decimals === null ? numericValue : Number(numericValue.toFixed(decimals))
}

export const useFuelLogStore = defineStore('FuelLog', {
  state: () => ({
    fuelLogs: [],
    error: null,
    loading: false,
  }),

  actions: {
    buildPayload(entry = {}) {
      const gallons = toNullableNumber(entry.gallons, { decimals: 3 })
      const pricePerGallon = toNullableNumber(entry.price_per_gallon, { decimals: 3 })
      let totalCost = toNullableNumber(entry.total_cost, { decimals: 2 })
      if (totalCost === null && gallons !== null && pricePerGallon !== null) {
        totalCost = Number((gallons * pricePerGallon).toFixed(2))
      }

      return {
        auto_id: entry.auto_id || null,
        date: entry.date || null,
        mileage: toNullableNumber(entry.mileage, { integer: true }),
        gallons,
        price_per_gallon: pricePerGallon,
        total_cost: totalCost,
        fuel_type: entry.fuel_type?.trim() || null,
        station: entry.station?.trim() || null,
        location: entry.location?.trim() || null,
        is_full_tank: Boolean(entry.is_full_tank),
        notes: entry.notes?.trim() || null,
      }
    },

    async loadFuelLogs(autoIds = []) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return []
        }

        if (!autoIds.length) {
          this.fuelLogs = []
          return []
        }

        const { data, error } = await supabase
          .from('fuel_log')
          .select('*')
          .in('auto_id', autoIds)
          .order('date', { ascending: false })
          .order('fuel_log_id', { ascending: false })

        if (error) {
          this.error = error.message
          return []
        }

        this.fuelLogs = data || []
        return this.fuelLogs
      } finally {
        this.loading = false
      }
    },

    async createFuelLog(entry = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        const { data, error } = await supabase
          .from('fuel_log')
          .insert(this.buildPayload(entry))
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.fuelLogs = [data, ...this.fuelLogs]
        return data
      } finally {
        this.loading = false
      }
    },

    async updateFuelLog(fuelLogId, entry = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!fuelLogId) {
          this.error = 'A fuel log is required to update.'
          return null
        }

        const { data, error } = await supabase
          .from('fuel_log')
          .update(this.buildPayload(entry))
          .eq('fuel_log_id', fuelLogId)
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.fuelLogs = this.fuelLogs.map((item) => (item.fuel_log_id === fuelLogId ? data : item))
        return data
      } finally {
        this.loading = false
      }
    },

    // fuel_log has no is_active column, so deleting removes the row.
    async deleteFuelLog(fuelLogId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return false
        }

        if (!fuelLogId) {
          this.error = 'A fuel log is required to delete.'
          return false
        }

        const { error } = await supabase.from('fuel_log').delete().eq('fuel_log_id', fuelLogId)

        if (error) {
          this.error = error.message
          return false
        }

        this.fuelLogs = this.fuelLogs.filter((item) => item.fuel_log_id !== fuelLogId)
        return true
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useFuelLogStore, import.meta.hot))
}
