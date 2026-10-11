<template>
  <q-dialog v-model="isOpen" persistent>
    <q-card style="min-width: 320px; max-width: 420px">
      <q-card-section>
        <div class="text-h6">No data connection</div>
      </q-card-section>

      <q-card-section>
        {{ message }}
      </q-card-section>

      <q-card-actions align="right">
        <q-btn color="primary" label="OK" @click="isOpen = false" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default:
      'Your sign-on status is temporarily offline. Try again when a connection is available.',
  },
})

const emit = defineEmits(['update:modelValue'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})
</script>
