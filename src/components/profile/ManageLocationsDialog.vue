<template>
  <StationLookupDialog
    :model-value="modelValue"
    :profile-id="profileId"
    field="location"
    label="Location"
    plural-label="Locations"
    other-label="stations"
    @update:model-value="emit('update:modelValue', $event)"
  />
</template>

<script setup>
import StationLookupDialog from './StationLookupDialog.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  profileId: { type: [Number, String], default: null },
})
const emit = defineEmits(['update:modelValue'])
</script>
