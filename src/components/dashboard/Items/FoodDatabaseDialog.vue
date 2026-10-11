<template>
  <q-dialog :model-value="modelValue" @update:model-value="onDialogToggle">
    <q-card style="width: 500px; max-width: 95vw">
      <q-card-section>
        <div class="text-h6">Get Food</div>
      </q-card-section>

      <q-card-section>
        <q-banner v-if="store.error" class="bg-negative text-white q-mb-md" rounded>
          {{ store.error }}
        </q-banner>

        <q-select
          v-model="selected"
          :options="options"
          option-label="description"
          option-value="food_db_id"
          label="Description"
          class="q-mb-md"
          filled
          dense
          use-input
          hide-selected
          fill-input
          input-debounce="250"
          :loading="store.loading"
          no-option-label="No matching food"
          @filter="filterFoods"
        >
          <template #option="{ itemProps, opt }">
            <q-item v-bind="itemProps">
              <q-item-section>
                <q-item-label>
                  <template v-for="(part, i) in highlightParts(opt.description)" :key="i">
                    <span v-if="part.match" class="text-bold bg-yellow-3">{{ part.text }}</span>
                    <template v-else>{{ part.text }}</template>
                  </template>
                </q-item-label>
              </q-item-section>
            </q-item>
          </template>
          <template #no-option>
            <q-item>
              <q-item-section class="text-grey">No matching food</q-item-section>
            </q-item>
          </template>
        </q-select>

        <div class="row q-col-gutter-md">
          <div class="col-6">
            <q-input
              :model-value="selected?.serving_size"
              label="Serving size"
              filled
              dense
              readonly
            />
          </div>
          <div class="col-6">
            <q-input
              :model-value="selected?.serving_unit"
              label="Serving unit"
              filled
              dense
              readonly
            />
          </div>
          <div class="col-6">
            <q-input :model-value="selected?.protein" label="Protein" filled dense readonly />
          </div>
          <div class="col-6">
            <q-input :model-value="selected?.carb" label="Carbs" filled dense readonly />
          </div>
          <div class="col-6">
            <q-input :model-value="selected?.fat" label="Fat" filled dense readonly />
          </div>
          <div class="col-6">
            <q-input
              :model-value="selected?.calories_extra"
              label="Extra calories"
              filled
              dense
              readonly
            />
          </div>
        </div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" @click="close" />
        <q-btn label="Use food selected" color="primary" :disable="!selected" @click="useFood" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useFoodDatabaseStore } from 'stores/food-database'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'use-food'])

const selected = ref(null)
const options = ref([])
const store = useFoodDatabaseStore()

watch(
  () => props.modelValue,
  (open) => {
    if (open) {
      selected.value = null
      options.value = []
      store.error = null
    }
  },
)

const searchText = ref('')

function highlightParts(text) {
  const term = searchText.value.trim()
  const str = text ?? ''
  if (!term) {
    return [{ text: str, match: false }]
  }
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return str
    .split(new RegExp(`(${escaped})`, 'i'))
    .filter((part) => part !== '')
    .map((part) => ({ text: part, match: part.toLowerCase() === term.toLowerCase() }))
}

async function filterFoods(value, update) {
  searchText.value = value
  const results = await store.searchFoods(value)

  update(() => {
    options.value = results
  })
}

function close() {
  emit('update:modelValue', false)
}

function onDialogToggle(value) {
  emit('update:modelValue', value)
}

function useFood() {
  if (!selected.value) {
    return
  }

  const { description, serving_size, serving_unit, protein, carb, fat, calories_extra } =
    selected.value
  emit('use-food', { description, serving_size, serving_unit, protein, carb, fat, calories_extra })
  close()
}
</script>
