import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'

export const useServiceStore = defineStore('Service', {
  state: () => ({
    services: [],
    scheduleOptions: [],
    error: null,
    loading: false,
  }),

  actions: {
    buildPayload(service = {}) {
      return {
        schedule_id: service.schedule_id || null,
        name: service.name?.trim() || null,
        notes: service.notes?.trim() || null,
        interval_miles: this.toNonNegativeInteger(service.interval_miles),
        interval_months: this.toNonNegativeInteger(service.interval_months),
        interval_years: this.toNonNegativeInteger(service.interval_years),
        last_date: service.last_date || null,
        last_miles:
          service.last_miles === null ||
          service.last_miles === undefined ||
          service.last_miles === ''
            ? null
            : this.toNonNegativeInteger(service.last_miles),
        allow_notifications: Boolean(service.allow_notifications),
      }
    },

    toNonNegativeInteger(value) {
      const numericValue = Number(value)
      return Number.isFinite(numericValue) && numericValue > 0 ? Math.trunc(numericValue) : 0
    },

    // Active schedules for all autos when admin, otherwise only the user's autos.
    async loadScheduleOptions({ isAdmin = false, profileId = null } = {}) {
      this.error = null
      this.scheduleOptions = []

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return []
      }

      if (!isAdmin && !profileId) {
        return []
      }

      let query = supabase
        .from('schedule')
        .select('schedule_id, auto_id, auto:auto_id!inner(profile_id, year, make, model, color)')
        .eq('is_active', true)
        .eq('auto.is_active', true)

      if (!isAdmin) {
        query = query.eq('auto.profile_id', profileId)
      }

      const { data, error } = await query

      if (error) {
        this.error = error.message
        return []
      }

      this.scheduleOptions = data || []
      return this.scheduleOptions
    },

    // Returns { hasAuto, hasSchedule, hasDashboard }, or null if any check failed.
    async loadNavAvailability({ isAdmin = false, profileId = null } = {}) {
      this.error = null

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return null
      }

      if (!isAdmin && !profileId) {
        return { hasAuto: false, hasSchedule: false, hasDashboard: false }
      }

      let autoQuery = supabase
        .from('auto')
        .select('auto_id', { count: 'exact', head: true })
        .eq('is_active', true)
      let scheduleQuery = supabase
        .from('schedule')
        .select('schedule_id, auto:auto_id!inner(profile_id)', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('auto.is_active', true)

      if (!isAdmin) {
        autoQuery = autoQuery.eq('profile_id', profileId)
        scheduleQuery = scheduleQuery.eq('auto.profile_id', profileId)
      }

      const [autoResult, scheduleResult, dashboardSchedules] = await Promise.all([
        autoQuery,
        scheduleQuery,
        this.loadDashboardScheduleOptions({ isAdmin, profileId }),
      ])

      const failure = autoResult.error || scheduleResult.error
      if (failure) {
        this.error = failure.message
        return null
      }
      if (dashboardSchedules === null) {
        return null
      }

      return {
        hasAuto: (autoResult.count || 0) > 0,
        hasSchedule: (scheduleResult.count || 0) > 0,
        hasDashboard: dashboardSchedules.length > 0,
      }
    },

    async loadDashboardScheduleOptions({ isAdmin = false, profileId = null } = {}) {
      this.error = null

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return null
      }

      if (!isAdmin && !profileId) {
        return []
      }

      let query = supabase
        .from('schedule')
        .select(
          'schedule_id, auto_id, auto:auto_id!inner(profile_id, year, make, model, color, is_active), service!inner(service_id, is_active)',
        )
        .eq('is_active', true)
        .eq('auto.is_active', true)
        .eq('service.is_active', true)

      if (!isAdmin) {
        query = query.eq('auto.profile_id', profileId)
      }

      const { data, error } = await query

      if (error) {
        this.error = error.message
        return null
      }

      return data || []
    },

    async loadServices() {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return []
        }

        const { data, error } = await supabase
          .from('service')
          .select('*')
          .eq('is_active', true)
          .order('created_date', { ascending: false })

        if (error) {
          this.error = error.message
          return []
        }

        this.services = data || []
        return this.services
      } finally {
        this.loading = false
      }
    },

    async createService(service = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        const { data, error } = await supabase
          .from('service')
          .insert(this.buildPayload(service))
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.services = [data, ...this.services]
        return data
      } finally {
        this.loading = false
      }
    },

    async updateService(serviceId, service = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!serviceId) {
          this.error = 'A service is required to update.'
          return null
        }

        const { data, error } = await supabase
          .from('service')
          .update(this.buildPayload(service))
          .eq('service_id', serviceId)
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.services = this.services.map((item) => (item.service_id === serviceId ? data : item))
        return data
      } finally {
        this.loading = false
      }
    },

    async deleteService(serviceId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return false
        }

        if (!serviceId) {
          this.error = 'A service is required to delete.'
          return false
        }

        const { error } = await supabase
          .from('service')
          .update({ is_active: false })
          .eq('service_id', serviceId)

        if (error) {
          this.error = error.message
          return false
        }

        this.services = this.services.filter((item) => item.service_id !== serviceId)
        return true
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useServiceStore, import.meta.hot))
}
