<template>
  <StationLookupDialog
    :model-value="modelValue"
    field="station"
    label="Station"
    plural-label="Stations"
    other-label="locations"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup>
import StationLookupDialog from './StationLookupDialog.vue'

defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])
</script>
