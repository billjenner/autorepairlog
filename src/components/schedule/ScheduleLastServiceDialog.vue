<template>
  <q-dialog
    :model-value="modelValue"
    persistent
    @update:model-value="emit('update:modelValue', $event)"
  >
    <q-card style="min-width: 360px; max-width: 95vw">
      <q-card-section class="text-h6">Enter last service details</q-card-section>
      <q-card-section class="q-pt-none">
        <div class="text-h5 text-bold text-center q-ma-xl">
          Enter either Last Miles or Last Date for every service
          <span v-if="missingCount">({{ missingCount }} remaining)</span>. If never serviced, check
          the "Never" box. If unsure about the last service, check the "I don't know" box - it will
          disable this service alert until updated.
        </div>
        <q-markup-table flat dense>
          <thead>
            <tr>
              <th class="text-left">Name</th>
              <th class="text-right">Miles</th>
              <th class="text-right">Months</th>
              <th class="text-right">Years</th>
              <th class="text-center">Never</th>
              <th class="text-center">I don't know</th>
              <th class="text-left">Last Service Mileage</th>
              <th class="text-left">Last Service Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.service_id">
              <td class="text-left">{{ row.name }}</td>
              <td class="text-right">{{ row.interval_miles ?? '' }}</td>
              <td class="text-right">{{ row.interval_months ?? '' }}</td>
              <td class="text-right">{{ row.interval_years ?? '' }}</td>
              <td class="text-center">
                <q-checkbox v-model="row.never" dense @update:model-value="row.unknown = false" />
              </td>
              <td class="text-center">
                <q-checkbox v-model="row.unknown" dense @update:model-value="row.never = false" />
              </td>
              <td>
                <q-input
                  v-model.number="row.last_miles"
                  type="number"
                  min="0"
                  dense
                  outlined
                  :disable="row.never || row.unknown"
                  :error="!hasValue(row)"
                  hide-bottom-space
                  style="min-width: 110px"
                />
              </td>
              <td>
                <q-input
                  v-model="row.last_date"
                  type="date"
                  dense
                  outlined
                  :disable="row.never || row.unknown"
                  :error="!hasValue(row)"
                  hide-bottom-space
                  style="min-width: 150px"
                />
              </td>
              <td class="text-right">
                <q-btn
                  flat
                  round
                  dense
                  color="negative"
                  icon="delete"
                  :disable="loading"
                  @click="removeRow(row)"
                />
              </td>
            </tr>
          </tbody>
        </q-markup-table>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Skip for now" color="primary" :disable="loading" v-close-popup />
        <q-btn
          label="Save updates"
          color="primary"
          :disable="missingCount > 0"
          :loading="loading"
          @click="save"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed, ref, watch } from 'vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  services: { type: Array, default: () => [] },
  loading: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'save', 'delete'])

const rows = ref([])

function removeRow(row) {
  emit('delete', row.service_id, () => {
    rows.value = rows.value.filter((item) => item.service_id !== row.service_id)
  })
}

watch(
  () => [props.modelValue, props.services],
  ([open]) => {
    if (!open) return
    rows.value = [...props.services]
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
      .map((service) => ({
        ...service,
        never: false,
        unknown: false,
        last_miles: service.last_miles ?? null,
        last_date: service.last_date ? String(service.last_date).slice(0, 10) : null,
      }))
  },
  { immediate: true },
)

function hasValue(row) {
  if (row.never || row.unknown) return true
  const miles = row.last_miles
  return (miles !== null && miles !== '' && !Number.isNaN(Number(miles))) || Boolean(row.last_date)
}

const missingCount = computed(() => rows.value.filter((row) => !hasValue(row)).length)

function save() {
  emit(
    'save',
    rows.value.map((row) => ({
      service_id: row.service_id,
      never: row.never,
      interval_miles: row.interval_miles,
      interval_months: row.interval_months,
      interval_years: row.interval_years,
      last_miles:
        row.never || row.unknown || row.last_miles === '' ? null : (row.last_miles ?? null),
      last_date: row.never || row.unknown ? null : row.last_date || null,
    })),
  )
}
</script>
