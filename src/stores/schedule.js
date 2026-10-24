import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'

const SCHEDULE_SELECT =
  '*, auto:auto!inner(profile_id, year, make, model, color), ' +
  'service(service_id, name, interval_miles, interval_months, interval_years, last_date, last_miles)'

export function templateAutoLabel(auto) {
  if (!auto) {
    return ''
  }

  const yearMake = [auto.year, auto.make].filter((part) => part !== null && part !== '').join('-')
  return [yearMake, auto.model, auto.color].filter(Boolean).join('_')
}

export const useScheduleStore = defineStore('Schedule', {
  state: () => ({
    schedules: [],
    templateSchedules: [],
    templateAutos: [],
    error: null,
    loading: false,
  }),

  actions: {
    async loadTemplateAutos({ isAdmin = false, profileId = null } = {}) {
      this.error = null
      this.templateAutos = []

      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return []
      }

      if (!isAdmin && !profileId) {
        return []
      }

      let query = supabase
        .from('auto')
        .select('auto_id, year, make, model, color')
        .eq('is_active', true)

      // Level 0 users get all of their own autos; admins get the shared templates.
      query = isAdmin ? query.eq('isTemplate', true) : query.eq('profile_id', profileId)

      const { data, error } = await query
        .order('make', { ascending: true })
        .order('model', { ascending: true })

      if (error) {
        this.error = error.message
        return []
      }

      this.templateAutos = data || []
      return this.templateAutos
    },

    // Non-template schedules. Users with admin_level 0 only see schedules for their own autos.
    async loadSchedules({ isAdmin = false, profileId = null } = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return []
        }

        if (!isAdmin && !profileId) {
          this.schedules = []
          return []
        }

        let query = supabase
          .from('schedule')
          .select(SCHEDULE_SELECT)
          .eq('is_active', true)
          .eq('service.is_active', true)
          .eq('auto.isTemplate', false)

        if (!isAdmin) {
          query = query.eq('auto.profile_id', profileId)
        }

        const { data, error } = await query.order('created_date', { ascending: false })

        if (error) {
          this.error = error.message
          return []
        }

        this.schedules = data || []
        return this.schedules
      } finally {
        this.loading = false
      }
    },

    // Admins see every active schedule (template or not); others only template schedules.
    async loadTemplateSchedules({ isAdmin = false } = {}) {
      if (!supabase) {
        this.error = 'Supabase client is not configured.'
        return []
      }

      let query = supabase
        .from('schedule')
        .select(SCHEDULE_SELECT)
        .eq('is_active', true)
        .eq('service.is_active', true)

      if (!isAdmin) {
        query = query.eq('auto.isTemplate', true)
      }

      const { data, error } = await query.order('created_date', { ascending: false })

      if (error) {
        this.error = error.message
        return []
      }

      this.templateSchedules = data || []
      return this.templateSchedules
    },

    async createSchedule(schedule = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        const { data, error } = await supabase
          .from('schedule')
          .insert({ auto_id: schedule.auto_id || null, notes: schedule.notes?.trim() || null })
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        if (schedule.template_schedule_id) {
          const copied = await this.copyServices(schedule.template_schedule_id, data.schedule_id)
          if (!copied) {
            await supabase.from('schedule').delete().eq('schedule_id', data.schedule_id)
            return null
          }
        }

        this.schedules = [data, ...this.schedules]
        return data
      } finally {
        this.loading = false
      }
    },

    // Copies the active services of a template schedule onto another schedule.
    async copyServices(sourceScheduleId, targetScheduleId) {
      const { data: source, error: selectError } = await supabase
        .from('service')
        .select('name, notes, interval_miles, interval_months, interval_years')
        .eq('schedule_id', sourceScheduleId)
        .eq('is_active', true)

      if (selectError) {
        this.error = selectError.message
        return false
      }

      if (!source?.length) {
        return true
      }

      const { error: insertError } = await supabase
        .from('service')
        .insert(source.map((service) => ({ ...service, schedule_id: targetScheduleId })))

      if (insertError) {
        this.error = insertError.message
        return false
      }
      return true
    },

    async updateSchedule(scheduleId, schedule = {}) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        if (!scheduleId) {
          this.error = 'A schedule is required to update.'
          return null
        }

        const { data, error } = await supabase
          .from('schedule')
          .update({ auto_id: schedule.auto_id || null, notes: schedule.notes?.trim() || null })
          .eq('schedule_id', scheduleId)
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        this.schedules = this.schedules.map((item) =>
          item.schedule_id === scheduleId ? data : item,
        )
        return data
      } finally {
        this.loading = false
      }
    },

    async deleteSchedule(scheduleId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return false
        }

        if (!scheduleId) {
          this.error = 'A schedule is required to delete.'
          return false
        }

        const { error } = await supabase
          .from('schedule')
          .update({ is_active: false })
          .eq('schedule_id', scheduleId)

        if (error) {
          this.error = error.message
          return false
        }

        this.schedules = this.schedules.filter((item) => item.schedule_id !== scheduleId)
        return true
      } finally {
        this.loading = false
      }
    },
  },
})

if (import.meta.hot) {
  import.meta.hot.accept(acceptHMRUpdate(useScheduleStore, import.meta.hot))
}
