import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'

const INVOICE_BUCKET = 'service-invoices'
const INVOICE_MAX_BYTES = 10 * 1024 * 1024

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

    // invoice_url holds a storage object path; legacy http(s) links are returned unchanged.
    async getInvoiceUrl(invoicePath) {
      if (!invoicePath) {
        return null
      }

      if (/^https?:\/\//i.test(invoicePath)) {
        return invoicePath
      }

      this.error = null

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return null
      }

      const { data, error } = await supabase.storage
        .from(INVOICE_BUCKET)
        .createSignedUrl(invoicePath, 3600)

      if (error) {
        this.error = error.message
        return null
      }

      return data.signedUrl
    },

    async uploadInvoice(profileId, autoId, serviceOrderId, file) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!profileId || !autoId || !serviceOrderId || !file) {
          this.error = 'An auto, service order, and invoice file are required to attach an invoice.'
          return null
        }

        if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
          this.error = 'Choose a PDF or image file to attach.'
          return null
        }

        if (file.size > INVOICE_MAX_BYTES) {
          this.error = 'The invoice file must be 10 MB or smaller.'
          return null
        }

        const extension = file.name
          .split('.')
          .pop()
          ?.toLowerCase()
          .replace(/[^a-z0-9]/g, '')
        const invoicePath = `${profileId}/${autoId}/${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
        const { error: uploadError } = await supabase.storage
          .from(INVOICE_BUCKET)
          .upload(invoicePath, file, { contentType: file.type, upsert: false })

        if (uploadError) {
          this.error = uploadError.message
          return null
        }

        const previousPath = this.serviceOrders.find(
          (item) => item.service_order_id === serviceOrderId,
        )?.invoice_url
        const { data, error } = await supabase
          .from('service_order')
          .update({ invoice_url: invoicePath })
          .eq('service_order_id', serviceOrderId)
          .select()
          .single()

        if (error) {
          const { error: cleanupError } = await supabase.storage
            .from(INVOICE_BUCKET)
            .remove([invoicePath])
          this.error = cleanupError
            ? `${error.message} The uploaded invoice could not be cleaned up: ${cleanupError.message}`
            : error.message
          return null
        }

        this.serviceOrders = this.serviceOrders.map((item) =>
          item.service_order_id === serviceOrderId ? data : item,
        )

        if (previousPath && !/^https?:\/\//i.test(previousPath) && previousPath !== invoicePath) {
          const { error: cleanupError } = await supabase.storage
            .from(INVOICE_BUCKET)
            .remove([previousPath])

          if (cleanupError) {
            this.error = `Invoice updated, but the previous file could not be removed: ${cleanupError.message}`
          }
        }

        return data
      } finally {
        this.loading = false
      }
    },

    async deleteInvoice(serviceOrderId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        const { data: current, error: readError } = await supabase
          .from('service_order')
          .select('invoice_url')
          .eq('service_order_id', serviceOrderId)
          .single()

        if (readError) {
          this.error = readError.message
          return null
        }

        const { data, error } = await supabase
          .from('service_order')
          .update({ invoice_url: null })
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

        const path = current?.invoice_url
        if (path && !/^https?:\/\//i.test(path)) {
          const { error: removeError } = await supabase.storage.from(INVOICE_BUCKET).remove([path])
          if (removeError) {
            this.error = `Invoice removed, but the file could not be deleted: ${removeError.message}`
          }
        }

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
