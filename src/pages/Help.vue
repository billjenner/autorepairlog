<template>
  <q-page class="help-page">
    <div class="help-content">
      <q-card flat bordered class="q-mb-md">
        <q-expansion-item
          expand-icon="keyboard_arrow_down"
          expanded-icon="keyboard_arrow_up"
          transition-show="jump-down"
          transition-hide="jump-up"
        >
          <template v-slot:header>
            <q-item-section class="text-center">
              <div class="text-h4">About</div>
            </q-item-section>
          </template>
          <div class="row q-col-gutter-md q-pa-md">
            <div class="col-12 flex justify-center">
              <q-card style="width: 100%; max-width: 800px">
                <q-card-section class="bg-secondary text-white text-center">
                  Auto Repair Log
                </q-card-section>
                <q-card-section>
                  <p>
                    Auto Repair Log helps organize vehicle records and maintenance history. It uses
                    your records and mileage- and calendar-based intervals to help estimate future
                    service needs. Estimates depend on the information you enter.
                  </p>

                  <div class="text-h6 q-mt-md">What you can do</div>
                  <div class="q-mt-sm">
                    <div class="text-subtitle1 text-weight-medium">Maintenance and repairs</div>
                    <p>
                      Record service history and costs, manage recurring maintenance schedules, and
                      attach invoices or warranty documents as PDF or image files.
                    </p>
                  </div>
                  <div class="q-mt-md">
                    <div class="text-subtitle1 text-weight-medium">
                      Fuel tracking and expense reporting
                    </div>
                    <p>
                      Track fuel consumption, monitor expenses, and generate reports to better
                      understand vehicle operating costs.
                    </p>
                  </div>
                  <div class="q-mt-md">
                    <div class="text-subtitle1 text-weight-medium">Scheduling and predictions</div>
                    <p>
                      Set mileage- and time-based service intervals, estimate upcoming maintenance,
                      identify overdue services, and reuse schedule templates.
                    </p>
                  </div>
                  <div class="q-mt-md">
                    <div class="text-subtitle1 text-weight-medium">
                      Vehicle records and insights
                    </div>
                    <p>
                      Manage multiple vehicles, track mileage history and driving trends, and review
                      maintenance status and expenses. Dashboard exports include fuel and service
                      records in CSV or PDF format.
                    </p>
                  </div>
                  <div class="q-mt-md">
                    <div class="text-subtitle1 text-weight-medium">Alerts and notifications</div>
                    <p>
                      View estimated service intervals in Dashboard Alerts. When maintenance
                      tracking and in-app notifications are enabled, the app can notify you about
                      past-due services whose notifications are enabled.
                    </p>
                  </div>
                  <div class="q-mt-md">
                    <div class="text-subtitle1 text-weight-medium">Notes and dictation</div>
                    <p class="q-mb-none">
                      Enter notes or use voice dictation in supported browsers. Dictated text is
                      appended to existing notes, and speech may be processed by your browser
                      provider.
                    </p>
                  </div>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-expansion-item>
      </q-card>

      <q-card flat bordered class="q-mb-md">
        <q-expansion-item
          expand-icon="keyboard_arrow_down"
          expanded-icon="keyboard_arrow_up"
          transition-show="jump-down"
          transition-hide="jump-up"
        >
          <template v-slot:header>
            <q-item-section class="text-center">
              <div class="text-h4">Instructions</div>
            </q-item-section>
          </template>
          <div class="row q-col-gutter-md q-pa-md">
            <div class="col-12 flex justify-center">
              <q-card style="width: 100%">
                <q-card-section class="bg-secondary text-white text-center">
                  <router-link to="/setup" class="text-white">
                    Getting Started with Auto Repair Log
                  </router-link>
                </q-card-section>
                <q-card-section>
                  <p>
                    Use these steps to set up your autos, mileage, tracking preferences, and service
                    schedules. Maintenance steps appear only when maintenance tracking is enabled.
                  </p>
                  <ol class="q-pl-md">
                    <li class="q-mb-md">
                      <strong>Set up an auto.</strong> Add an auto to your profile or use one shared
                      with you.
                    </li>
                    <li class="q-mb-md">
                      <strong>Record initial and latest mileage.</strong> For at least one
                      associated auto, record its initial mileage and an active latest mileage
                      reading.
                    </li>
                    <li class="q-mb-md">
                      <strong>Choose your tracking preferences.</strong> In Profile, review whether
                      to use fuel tracking, maintenance tracking, or both. This checklist step is
                      automatically complete.
                    </li>
                    <li class="q-mb-md">
                      <strong>Create a schedule.</strong> If maintenance tracking is enabled, create
                      at least one schedule for an auto associated with your profile.
                    </li>
                    <li class="q-mb-md">
                      <strong>Record a last service.</strong> Enter the last mileage or date for at
                      least one scheduled service.
                    </li>
                    <li>
                      <strong>Complete service history.</strong> Enter the last mileage or date for
                      every active scheduled service.
                    </li>
                  </ol>
                  <p>
                    <q-btn flat color="primary" label="Open setup checklist" to="/setup" />
                  </p>
                </q-card-section>
              </q-card>
            </div>
          </div>
        </q-expansion-item>
      </q-card>
    </div>

    <!-- Feedback Dialog -->
    <q-dialog v-model="showFeedbackDialog" persistent>
      <q-card style="min-width: 320px; max-width: 1024px; width: 90vw">
        <template v-slot:header>
          <q-item-section class="text-center">
            <div class="text-h4">Contact</div>
          </q-item-section>
        </template>
        <div class="row q-col-gutter-md q-pa-md">
          <div class="col-12 flex justify-center">
            <q-card style="width: 100%">
              <q-card-section class="bg-secondary text-white text-center">
                Feedback
              </q-card-section>

              <q-card-section>
                <q-banner
                  v-if="!usersStore.currentUser?.email"
                  class="bg-warning text-white q-mb-md"
                >
                  Please log in to submit feedback.
                </q-banner>

                <q-banner v-if="submitLimitReached" class="bg-warning text-white q-mb-md">
                  You've reached the limit of {{ RECENT_SUBMISSION_LIMIT }} feedback submissions in
                  the last {{ RECENT_SUBMISSION_WINDOW_DAYS }} days. Please try again later.
                </q-banner>

                <q-form
                  ref="feedbackFormRef"
                  greedy
                  class="q-gutter-md"
                  @submit.prevent="handleFeedbackSubmit"
                >
                  <q-select
                    v-model="feedbackForm.feedback_type"
                    :options="feedbackTypeOptions"
                    label="Feedback Type"
                    multiple
                    outlined
                    dense
                    use-chips
                    lazy-rules="ondemand"
                    :rules="[(val) => (val && val.length > 0) || 'Select at least one type']"
                  />

                  <q-input
                    v-model="feedbackForm.subject"
                    label="Subject"
                    outlined
                    dense
                    lazy-rules="ondemand"
                    :rules="[(val) => !!val?.trim() || 'Subject is required']"
                  />

                  <q-input
                    v-model="feedbackForm.description"
                    label="Description"
                    type="textarea"
                    outlined
                    dense
                    lazy-rules="ondemand"
                    :rules="[(val) => !!val?.trim() || 'Description is required']"
                  />

                  <q-input
                    v-model="feedbackForm.contact"
                    label="Contact (optional)"
                    outlined
                    dense
                  />

                  <q-input
                    v-model="feedbackForm.email"
                    label="Email (optional)"
                    type="email"
                    outlined
                    dense
                  />

                  <q-checkbox
                    v-model="feedbackForm.allow_contact"
                    label="You may contact me about this feedback"
                  />

                  <div class="row justify-between q-gutter-sm">
                    <q-btn
                      color="primary"
                      label="Cancel"
                      type="button"
                      @click="showFeedbackDialog = false"
                      :disable="submitting"
                    />
                    <q-btn
                      color="primary"
                      label="Submit Feedback"
                      type="submit"
                      :disable="!usersStore.currentUser?.email || submitLimitReached || submitting"
                      :loading="submitting"
                    />
                  </div>
                </q-form>
              </q-card-section>
            </q-card>
          </div>
        </div>
      </q-card>
    </q-dialog>
    <div class="feedback-link">
      <q-btn flat no-caps label="Give Feedback" @click="showFeedbackDialog = true" />
    </div>
  </q-page>
</template>

<script setup>
import { reactive, ref, watch } from 'vue'
import { useQuasar } from 'quasar'
import { useUsersStore } from '@/stores/users'
import { useFeedbackStore } from '@/stores/feedback'
import { sanitizeInput } from '../utils/sanitize'
import { notifySuccess } from '../utils/notify'

const RECENT_SUBMISSION_LIMIT = 3
const RECENT_SUBMISSION_WINDOW_DAYS = 7

const feedbackTypeOptions = [
  'Bug',
  'Feature Request',
  'Suggestion',
  'Question',
  'Compliment',
  'Other',
]

const $q = useQuasar()
const usersStore = useUsersStore()
const feedbackStore = useFeedbackStore()

const feedbackFormRef = ref(null)
const submitting = ref(false)
const submitLimitReached = ref(false)
const showFeedbackDialog = ref(false)

const feedbackForm = reactive({
  feedback_type: [],
  subject: '',
  description: '',
  contact: '',
  email: '',
  allow_contact: false,
})

function resetFeedbackForm() {
  feedbackForm.feedback_type = []
  feedbackForm.subject = ''
  feedbackForm.description = ''
  feedbackForm.contact = ''
  feedbackForm.email = ''
  feedbackForm.allow_contact = false
}

watch(
  () => usersStore.currentUser?.user_id,
  async (userId) => {
    submitLimitReached.value = userId
      ? await feedbackStore.hasReachedRecentSubmissionLimit(userId)
      : false
  },
  { immediate: true },
)

async function sendFeedbackEmail(feedback) {
  const formSubmitRecipient = import.meta.env.VITE_FORMSUBMIT_RECIPIENT || 'bill.jenner@gmail.com'
  const formSubmitUrl =
    import.meta.env.VITE_FORMSUBMIT_URL || `https://formsubmit.co/ajax/${formSubmitRecipient}`

  await fetch(formSubmitUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      feedback_type: feedback.feedback_type,
      subject: feedback.subject,
      description: feedback.description,
      contact: feedback.contact,
      email: feedback.email,
      allow_contact: feedback.allow_contact,
      _subject: `Auto Repair Log Feedback: ${feedback.subject}`,
      _captcha: 'false',
    }),
  })
}

async function handleFeedbackSubmit() {
  const userId = usersStore.currentUser?.user_id

  if (!userId) {
    $q.notify({ color: 'negative', message: 'Please log in to submit feedback.' })
    return
  }

  submitting.value = true

  try {
    submitLimitReached.value = await feedbackStore.hasReachedRecentSubmissionLimit(userId)
    if (submitLimitReached.value) {
      $q.notify({
        color: 'negative',
        message: `You've reached the limit of ${RECENT_SUBMISSION_LIMIT} feedback submissions in the last ${RECENT_SUBMISSION_WINDOW_DAYS} days.`,
      })
      return
    }

    const sanitizedFeedback = {
      feedback_type: feedbackForm.feedback_type.join(', '),
      subject: sanitizeInput(feedbackForm.subject),
      description: sanitizeInput(feedbackForm.description),
      contact: sanitizeInput(feedbackForm.contact),
      email: sanitizeInput(feedbackForm.email),
      allow_contact: feedbackForm.allow_contact,
    }

    const result = await feedbackStore.createFeedback(userId, sanitizedFeedback)

    if (!result) {
      throw new Error(feedbackStore.error || 'Unable to submit feedback right now.')
    }

    try {
      await sendFeedbackEmail(sanitizedFeedback)
    } catch (emailError) {
      console.error('Feedback email notification failed:', emailError)
    }

    notifySuccess($q, 'Thank you for your feedback!')
    resetFeedbackForm()
    feedbackFormRef.value?.resetValidation()
    submitLimitReached.value = await feedbackStore.hasReachedRecentSubmissionLimit(userId)
  } catch (error) {
    console.error('Feedback submission failed:', error)
    $q.notify({ color: 'negative', message: error?.message || 'Unable to submit feedback.' })
  } finally {
    showFeedbackDialog.value = false
    submitting.value = false
  }
}
</script>

<style scoped>
.help-page {
  display: flex;
  flex-direction: column;
  padding: 16px;
}

.help-content {
  flex: 1 0 auto;
}

.feedback-link {
  margin-top: auto;
  padding: 24px;
  text-align: center;
}
</style>
