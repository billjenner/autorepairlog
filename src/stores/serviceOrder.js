import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'

const toNumber = (value) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) && numericValue > 0 ? numericValue : 0
}

export const useServiceOrderStore = defineStore('ServiceOrder', {
  state: () => ({
    serviceOrders: [],
    autoOptions: [],
    error: null,
    loading: false,
  }),

  actions: {
    buildPayload(order = {}) {
      const mileage = Number(order.mileage_at_service)

      return {
        auto_id: order.auto_id || null,
        shop_name: order.shop_name?.trim() || null,
        mechanic_name: order.mechanic_name?.trim() || null,
        invoice_number: order.invoice_number?.trim() || null,
        service_date: order.service_date || null,
        mileage_at_service:
          order.mileage_at_service !== '' && order.mileage_at_service !== null && mileage >= 0
            ? Math.trunc(mileage)
            : null,
        total_cost: Math.round(toNumber(order.total_cost) * 100) / 100,
        invoice_url: order.invoice_url?.trim() || null,
        notes: order.notes?.trim() || null,
        is_complete: Boolean(order.is_complete),
      }
    },

    // Active autos for all users when admin, otherwise only the user's autos.
    async loadAutoOptions({ isAdmin = false, profileId = null } = {}) {
      this.error = null
      this.autoOptions = []

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return []
      }

      if (!isAdmin && !profileId) {
        return []
      }

      let query = supabase
        .from('auto')
        .select('auto_id, profile_id, year, make, model, color')
        .eq('is_active', true)

      if (!isAdmin) {
        query = query.eq('profile_id', profileId)
      }

      const { data, error } = await query
        .order('make', { ascending: true })
        .order('model', { ascending: true })

      if (error) {
        this.error = error.message
        return []
      }

      this.autoOptions = data || []
      return this.autoOptions
    },

    async loadServiceOrders() {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return []
        }

        const { data, error } = await supabase
          .from('service_order')
          .select('*')
          .eq('is_active', true)
          .order('service_date', { ascending: false, nullsFirst: false })

        if (error) {
          this.error = error.message
          return []
        }

        this.serviceOrders = data || []
        return this.serviceOrders
      } finally {
        this.loading = false
      }
    },

    async createServiceOrder(order = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        const { data, error } = await supabase
          .from('service_order')
          .insert(this.buildPayload(order))
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.serviceOrders = [data, ...this.serviceOrders]
        return data
      } finally {
        this.loading = false
      }
    },

    async updateServiceOrder(serviceOrderId, order = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!serviceOrderId) {
          this.error = 'A service order is required to update.'
          return null
        }

        const { data, error } = await supabase
          .from('service_order')
          .update(this.buildPayload(order))
          .eq('service_order_id', serviceOrderId)
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.serviceOrders = this.serviceOrders.map((item) =>
          item.service_order_id === serviceOrderId ? data : item,
        )
        return data
      } finally {
        this.loading = false
      }
    },

    async deleteServiceOrder(serviceOrderId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return false
        }

        if (!serviceOrderId) {
          this.error = 'A service order is required to delete.'
          return false
        }

        const { error } = await supabase
          .from('service_order')
          .update({ is_active: false })
          .eq('service_order_id', serviceOrderId)

        if (error) {
          this.error = error.message
          return false
        }

        this.serviceOrders = this.serviceOrders.filter(
          (item) => item.service_order_id !== serviceOrderId,
        )
        return true
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useServiceOrderStore, import.meta.hot))
}
