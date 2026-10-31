<template>
  <q-page>
    <div class="row justify-center">
      <div class="col-12">
        <q-select
          ref="autoSelectRef"
          v-model="selectedAutoId"
          :options="autoOptions"
          label="Auto"
          emit-value
          map-options
          clearable
          filled
          dense
          lazy-rules
          :rules="[(value) => !showForm || !!value || 'Select an auto.']"
          class="col-12 col-sm-6"
        />

        <MileageContent
          v-model:selected-auto-id="selectedAutoId"
          v-model:show-form="showForm"
          :auto-options="autoOptions"
          :validate-auto-select="validateAutoSelect"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { computed, ref } from 'vue'
import MileageContent from '@/components/MileageContent.vue'
import { useAutoStore } from '@/stores/auto'

const autoStore = useAutoStore()
const autoSelectRef = ref(null)
const selectedAutoId = ref(null)
const showForm = ref(false)
const autoOptions = computed(() =>
  autoStore.auto.map((auto) => ({
    label: [auto.year, auto.make, auto.model].filter(Boolean).join(' ') || 'Unnamed auto',
    value: auto.auto_id,
  })),
)

async function validateAutoSelect() {
  return (await autoSelectRef.value?.validate()) ?? false
}
</script>
