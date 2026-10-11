<template>
  <q-page class="flex flex-center q-pa-md">
    <q-card class="q-pa-lg" style="width: min(100%, 720px)">
      <div class="text-h5 text-center q-mb-md">Feedback</div>

      <div class="text-center q-mb-sm">
        <q-btn color="primary" label="Reload" @click="loadFeedback" />
      </div>

      <div v-if="store.error" class="text-center text-primary q-mb-sm">
        {{ store.error }}
      </div>

      <div v-if="!store.feedbackList.length" class="text-center text-grey-7">
        No feedback submitted yet.
      </div>

      <q-list v-else bordered separator class="rounded-borders">
        <q-item v-for="feedback in store.feedbackList" :key="feedback.id">
          <q-item-section>
            <q-item-label>
              <strong>{{ feedback.subject }}</strong>
              <span class="text-caption text-grey-7"> — {{ feedback.feedback_type }}</span>
            </q-item-label>
            <q-item-label caption>{{ feedback.description }}</q-item-label>
            <q-item-label caption class="text-grey-7">
              {{ formatDate(feedback.created_at) }}
            </q-item-label>
          </q-item-section>
        </q-item>
      </q-list>
    </q-card>
  </q-page>
</template>

<script setup>
import { onMounted } from 'vue'
import { useFeedbackStore } from 'stores/feedback'

const store = useFeedbackStore()

function loadFeedback() {
  store.fetchFeedback()
}

function formatDate(value) {
  if (!value) {
    return ''
  }

  return new Date(value).toLocaleString()
}

onMounted(() => {
  loadFeedback()
})
</script>
