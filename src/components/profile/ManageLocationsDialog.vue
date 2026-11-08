<template>
  <StationLookupDialog
    :model-value="modelValue"
    field="location"
    label="Location"
    plural-label="Locations"
    other-label="stations"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup>
import StationLookupDialog from './StationLookupDialog.vue'

defineProps({ modelValue: { type: Boolean, default: false } })
const emit = defineEmits(['update:modelValue'])
</script>
