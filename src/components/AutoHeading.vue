<template>
  <div v-if="title" class="q-mb-md text-center">
    <div class="text-h5">{{ title }}</div>
    <div v-if="vin" class="text-subtitle2 text-grey-7">VIN: {{ vin }}</div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { supabase } from '@/lib/supabase'

const props = defineProps({
  autoId: { type: [Number, String], default: null },
})
const emit = defineEmits(['loaded'])

const title = ref('')
const vin = ref('')
let requestId = 0

async function load() {
  const currentRequest = ++requestId
  let nextTitle = ''
  let nextVin = ''
  if (props.autoId) {
    const { data: auto } = await supabase
      .from('auto')
      .select('year, make, model, color, vin')
      .eq('auto_id', props.autoId)
      .maybeSingle()
    if (auto) {
      nextTitle = [auto.year, auto.make, auto.model, auto.color].filter(Boolean).join(' ')
      nextVin = auto.vin?.trim() || ''
    }
  }
  if (currentRequest !== requestId) return
  title.value = nextTitle
  vin.value = nextVin
  emit('loaded', { title: nextTitle, vin: nextVin })
}

watch(() => props.autoId, load, { immediate: true })
</script>
