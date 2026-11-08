import { defineStore, acceptHMRUpdate } from 'pinia'
import { supabase } from '../lib/supabase'
import { milesPerGallon } from '../utils/fuelMileage'
import { fetchStationRows, insertStationRow } from '../lib/stationLookup'

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
    fuelTypes: [],
    stations: [],
    stationRows: [],
    stationProfileId: null,
    stationRequestId: 0,
    stationError: null,
    error: null,
    loading: false,
  }),

  actions: {
    async fetchLatestMileage(autoId) {
      if (!supabase) throw new Error('Supabase client is not configured.')
      const { data, error } = await supabase
        .from('fuel_log')
        .select('mileage')
        .eq('auto_id', autoId)
        .not('mileage', 'is', null)
        .order('date', { ascending: false })
        .order('fuel_log_id', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data?.mileage ?? null
    },

    buildPayload(entry = {}) {
      const gallons = toNullableNumber(entry.gallons, { decimals: 3 })
      const priorMileage = toNullableNumber(entry.prior_mileage, { integer: true })
      const mileage = toNullableNumber(entry.mileage, { integer: true })
      const mpg = milesPerGallon(priorMileage, mileage, gallons)
      const pricePerGallon = toNullableNumber(entry.price_per_gallon, { decimals: 3 })
      let totalCost = toNullableNumber(entry.total_cost, { decimals: 2 })
      if (totalCost === null && gallons !== null && pricePerGallon !== null) {
        totalCost = Number((gallons * pricePerGallon).toFixed(2))
      }

      return {
        auto_id: entry.auto_id || null,
        date: entry.date || null,
        prior_mileage: priorMileage,
        mileage,
        mile_per_gallon: mpg === null ? null : Number(mpg.toFixed(2)),
        gallons,
        price_per_gallon: pricePerGallon,
        total_cost: totalCost,
        fuel_type: entry.fuel_type?.trim() || null,
        station: entry.station?.trim() || null,
        location: entry.location?.trim() || null,
        notes: entry.notes?.trim() || null,
      }
    },

    // Adds fuel type, station and location values to the lookup tables when not already present.
    // Best effort: a lookup failure never fails the fuel log save.
    async syncLookups(payload, profileId) {
      if (this.stationProfileId === profileId) this.stationError = null
      const normalize = (value) =>
        String(value ?? '')
          .trim()
          .toLowerCase()

      try {
        if (payload.fuel_type) {
          const { data, error } = await supabase.from('fuel_type').select('fuel_type')
          if (error) throw error
          const exists = (data || []).some(
            (row) => normalize(row.fuel_type) === normalize(payload.fuel_type),
          )
          if (!exists) {
            const { error: insertError } = await supabase
              .from('fuel_type')
              .insert({ fuel_type: payload.fuel_type })
            if (insertError) throw insertError
            this.fuelTypes = [...this.fuelTypes, payload.fuel_type].sort((a, b) =>
              a.localeCompare(b),
            )
          }
        }

        if (payload.station || payload.location) {
          const data = await fetchStationRows(supabase, profileId)
          const exists = (data || []).some(
            (row) =>
              normalize(row.station) === normalize(payload.station) &&
              normalize(row.location) === normalize(payload.location),
          )
          if (!exists) {
            await insertStationRow(supabase, profileId, payload.station, payload.location)
            if (this.stationProfileId === profileId) {
              this.stationRows = [
                ...this.stationRows,
                { station: payload.station, location: payload.location },
              ]
            }
            if (
              this.stationProfileId === profileId &&
              payload.station &&
              !this.stations.some((name) => normalize(name) === normalize(payload.station))
            ) {
              this.stations = [...this.stations, payload.station].sort((a, b) => a.localeCompare(b))
            }
          }
        }
      } catch (err) {
        console.error('[fuel log lookups] failed:', err.message)
        if (this.stationProfileId === profileId) {
          this.stationError = `Fuel log saved, but lookup values could not be updated: ${err.message}`
        }
      }
    },

    // Station rows plus the distinct, sorted station names from public.station.
    async loadStations(profileId) {
      const requestId = ++this.stationRequestId
      this.stationProfileId = profileId || null
      this.stations = []
      this.stationRows = []
      this.stationError = null
      let data
      try {
        data = await fetchStationRows(supabase, profileId)
      } catch (error) {
        if (this.stationRequestId === requestId) {
          this.stationError = `Unable to load stations: ${error.message}`
        }
        return []
      }
      if (this.stationRequestId !== requestId) return []
      this.stationRows = data
      const unique = new Map()
      for (const row of this.stationRows) {
        const name = String(row.station ?? '').trim()
        if (name && !unique.has(name.toLowerCase())) {
          unique.set(name.toLowerCase(), name)
        }
      }
      this.stations = [...unique.values()].sort((a, b) => a.localeCompare(b))
      return this.stations
    },

    // Distinct, sorted fuel type names from public.fuel_type.
    async loadFuelTypes() {
      if (!supabase) {
        this.fuelTypes = []
        return []
      }

      const { data, error } = await supabase.from('fuel_type').select('fuel_type')
      if (error) {
        console.error('[fuel types] failed:', error.message)
        return this.fuelTypes
      }

      const unique = new Map()
      for (const row of data || []) {
        const name = String(row.fuel_type ?? '').trim()
        if (name && !unique.has(name.toLowerCase())) {
          unique.set(name.toLowerCase(), name)
        }
      }
      this.fuelTypes = [...unique.values()].sort((a, b) => a.localeCompare(b))
      return this.fuelTypes
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

    async createFuelLog(entry = {}, profileId) {
      this.error = null
      this.loading = true

      try {
        if (!supabase) {
          this.error = 'Supabase client is not configured.'
          return null
        }

        const payload = this.buildPayload(entry)
        const { data, error } = await supabase.from('fuel_log').insert(payload).select().single()

        if (error) {
          this.error = error.message
          return null
        }

        await this.syncLookups(payload, profileId)
        this.fuelLogs = [data, ...this.fuelLogs]
        return data
      } finally {
        this.loading = false
      }
    },

    async updateFuelLog(fuelLogId, entry = {}, profileId) {
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

        const payload = this.buildPayload(entry)
        const { data, error } = await supabase
          .from('fuel_log')
          .update(payload)
          .eq('fuel_log_id', fuelLogId)
          .select()
          .single()

        if (error) {
          this.error = error.message
          return null
        }

        await this.syncLookups(payload, profileId)
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
