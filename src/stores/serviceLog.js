import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'

const LOG_SELECT = '*, service_order:service_order_id(service_date, mileage_at_service)'

export const useServiceLogStore = defineStore('ServiceLog', {
  state: () => ({
    serviceLogs: [],
    orderOptions: [],
    error: null,
    loading: false,
  }),

  actions: {
    buildPayload(log = {}) {
      const cost = Number(log.cost)

      return {
        service_order_id: log.service_order_id || null,
        type: log.type || null,
        name: log.name?.trim() || null,
        description: log.description?.trim() || null,
        notes: log.notes?.trim() || null,
        cost: Number.isFinite(cost) && cost > 0 ? Math.round(cost * 100) / 100 : 0,
      }
    },

    // Active service orders for all autos when admin, otherwise only the user's autos.
    async loadOrderOptions({ isAdmin = false, profileId = null } = {}) {
      this.error = null
      this.orderOptions = []

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return []
      }

      if (!isAdmin && !profileId) {
        return []
      }

      let query = supabase
        .from('service_order')
        .select(
          'service_order_id, name, service_date, auto:auto_id!inner(profile_id, year, make, model, color)',
        )
        .eq('is_active', true)
        .eq('auto.is_active', true)

      if (!isAdmin) {
        query = query.eq('auto.profile_id', profileId)
      }

      const { data, error } = await query.order('service_date', {
        ascending: false,
        nullsFirst: false,
      })

      if (error) {
        this.error = error.message
        return []
      }

      this.orderOptions = data || []
      return this.orderOptions
    },

    async loadServiceLogs() {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return []
        }

        const { data, error } = await supabase
          .from('service_log')
          .select(LOG_SELECT)
          .order('created_date', { ascending: false })

        if (error) {
          this.error = error.message
          return []
        }

        this.serviceLogs = data || []
        return this.serviceLogs
      } finally {
        this.loading = false
      }
    },

    async createServiceLog(log = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        const { data, error } = await supabase
          .from('service_log')
          .insert(this.buildPayload(log))
          .select(LOG_SELECT)
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.serviceLogs = [data, ...this.serviceLogs]
        return data
      } finally {
        this.loading = false
      }
    },

    async updateServiceLog(serviceLogId, log = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!serviceLogId) {
          this.error = 'A service log is required to update.'
          return null
        }

        const { data, error } = await supabase
          .from('service_log')
          .update(this.buildPayload(log))
          .eq('service_log_id', serviceLogId)
          .select(LOG_SELECT)
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.serviceLogs = this.serviceLogs.map((item) =>
          item.service_log_id === serviceLogId ? data : item,
        )
        return data
      } finally {
        this.loading = false
      }
    },

    // service_log has no is_active column, so deletes are permanent.
    async deleteServiceLog(serviceLogId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return false
        }

        if (!serviceLogId) {
          this.error = 'A service log is required to delete.'
          return false
        }

        const { error } = await supabase
          .from('service_log')
          .delete()
          .eq('service_log_id', serviceLogId)

        if (error) {
          this.error = error.message
          return false
        }

        this.serviceLogs = this.serviceLogs.filter((item) => item.service_log_id !== serviceLogId)
        return true
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useServiceLogStore, import.meta.hot))
}
