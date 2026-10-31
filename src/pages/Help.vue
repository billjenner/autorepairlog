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
                    Auto Repair Log helps simplify vehicle ownership by making maintenance history
                    accessible and future service needs predictable. It combines your past records
                    with mileage-based and calendar-based estimates so you can plan maintenance,
                    keep vehicle information organized, and stay ahead of upcoming service needs.
                  </p>

                  <div class="text-h6 q-mt-md">What you can do</div>
                  <div class="q-mt-sm">
                    <div class="text-subtitle1 text-weight-medium">Maintenance and repairs</div>
                    <p>
                      Record service history and costs, manage recurring maintenance schedules, and
                      keep records available for future reference, warranty documentation, or
                      resale.
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
                      Manage multiple vehicles, track mileage history and driving trends, review
                      maintenance status and expenses, and export your records.
                    </p>
                  </div>
                  <div class="q-mt-md">
                    <div class="text-subtitle1 text-weight-medium">Reminders</div>
                    <p class="q-mb-none">
                      Keep upcoming maintenance in view and reduce the chance of missing a service
                      interval.
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
            <div class="col-12 col-sm-6 col-md-6 col-lg-6 flex justify-center">
              <q-card style="width: 95%">
                <q-card-section class="bg-secondary text-white text-center">
                  supplements
                </q-card-section>

                <q-expansion-item
                  expand-icon="keyboard_arrow_down"
                  expanded-icon="keyboard_arrow_up"
                  transition-show="jump-down"
                  transition-hide="jump-up"
                >
                  <template v-slot:header>
                    <q-chip>Supplement Suggestions</q-chip>
                  </template>

                  <q-card-section>
                    <td style="padding: 20px">
                      <p>
                        <strong>NOTE -</strong> These Supplement Suggestions are not based on
                        medical advice and should be used at your own discretion. Please consult
                        with a healthcare professional before starting any new supplement regimen.
                      </p>
                    </td>
                    <table style="width: 100%; border-collapse: collapse">
                      <thead>
                        <tr>
                          <th
                            style="text-align: left; padding: 12px; border-bottom: 2px solid #ccc"
                          >
                            Supplement
                          </th>
                          <th
                            style="text-align: left; padding: 12px; border-bottom: 2px solid #ccc"
                          >
                            Purpose / Benefits
                          </th>
                        </tr>
                      </thead>

                      <tbody>
                        <tr>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <strong>Water</strong>
                            <p><span style="color: #666">64 oz minimum/day</span></p>
                          </td>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            Breaking down stored fat requires several biochemical reactions that
                            occur in a hydrated environment.
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <strong>Protein Powder</strong>
                            <p><span style="color: #666">As needed to keep protein up.</span></p>
                          </td>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            Makes it easier to reach your protein target while dieting.
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <strong>Creatine Monohydrate</strong>
                            <p><span style="color: #666">5 g/day</span></p>
                          </td>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            Helps maintain strength and muscle during a calorie deficit.
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <strong>Omega-3 (Fish Oil)</strong>
                            <p><span style="color: #666">2 g/day EPA + DHA</span></p>
                          </td>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            Provides EPA and DHA; useful when you're not eating fish.
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <strong>Krill Oil</strong><br />
                            <p><span style="color: #666">500 mg/day</span></p>
                            <span style="color: #666">(Ocean crustaceans)</span>
                          </td>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            EPA + DHA, antioxidant properties, and phospholipids that help form cell
                            membranes and transport fats.
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <strong>Multivitamin</strong><br />
                          </td>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            Some popular multivitamin options include:
                            <ul style="margin: 8px 0 0 20px; padding: 0">
                              <li>AG1</li>
                              <li>Huel Daily Greens</li>
                              <li>Live It Up Super Greenst</li>
                              <li>Thorne Daily Greens Plus</li>
                              <li>IM8 Daily Essentials</li>
                              <li>Amazing Grass Greens Blend</li>
                              <li>Nested Naturals Super Greens</li>
                            </ul>
                            <hr />
                            <ul style="margin: 8px 0 0 20px; padding: 0">
                              <li>Vitamins &amp; minerals — nutritional support</li>
                              <li>Prebiotics &amp; probiotics — digestive/gut support</li>
                              <li>Plant extracts and greens — various phytonutrients</li>
                              <li>Antioxidant compounds</li>
                              <li>Adaptogen-type ingredients</li>
                              <li>Digestive enzymes</li>
                            </ul>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <strong>D3 + K2</strong><br />
                            <p><span style="color: #666">D3 (cholecalciferol)</span></p>
                            <p><span style="color: #666">500 UI, 100 MCG</span></p>
                          </td>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <ul style="margin: 8px 0 0 20px; padding: 0">
                              <li>D3 &amp; increases calcium absorption</li>
                              <li>K2 &amp; helps activate calcium-regulating proteins</li>
                            </ul>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <strong>Magnesium</strong><br />
                            <span style="color: #666">(Magnesium glycinate)</span>
                          </td>
                          <td style="padding: 12px; border-bottom: 1px solid #eee">
                            <ul style="margin: 8px 0 0 20px; padding: 0">
                              <li>Supports muscle and nerve function</li>
                              <li>Helps produce energy and helps with recovery</li>
                              <li>Supports muscle contraction and relaxation</li>
                              <li>Helps maintain electrolyte balance</li>
                            </ul>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding: 12px">
                            <strong>Electrolytes</strong>
                          </td>
                          <td style="padding: 12px">
                            Maintain fluid balance, nerve function, muscle function, and blood
                            pressure.
                            <br /><br />

                            <strong>
                              Avoid electrolytes with Sucralose, Aspartame, and even Stevia.
                            </strong>
                            These not only fool your tongue but also your body and increase cortisol
                            and make you hungrier.
                            <br /><br />

                            <strong>Some options:</strong>
                            Redmond Re-Lyte Unflavored, Hydrant Unflavored, SALTT Clean Slate
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </q-card-section>
                </q-expansion-item>
                <q-expansion-item
                  expand-icon="keyboard_arrow_down"
                  expanded-icon="keyboard_arrow_up"
                  transition-show="jump-down"
                  transition-hide="jump-up"
                >
                  <template v-slot:header>
                    <q-chip>Fat Burning Morning Drink</q-chip>
                  </template>

                  <q-card-section>
                    <td style="padding: 20px">
                      <p>
                        <strong>NOTE -</strong> These Supplement Suggestions are not based on
                        medical advice and should be used at your own discretion. Please consult
                        with a healthcare professional before starting any new supplement regimen.
                      </p>
                    </td>
                    <q-chip color="accent" text-color="white"
                      >Apple Cider Vinegar Fat-Burning Drink (Spicy).</q-chip
                    >
                    <ul>
                      <li>Best first thing in the morningin the morning.</li>
                    </ul>
                    <ul>
                      <li>
                        Apple Cider Vinegar (ACV) — 2 Tbsp (Bragg's or other unfiltered brands)
                      </li>
                      <li>Cayenne pepper</li>
                      <li>Turmeric — ¼ tsp</li>
                      <li>Lemon juice — ¼ tsp</li>
                      <li>Ginger — ¼ tsp</li>
                      <li>Water — 2 cups</li>
                      <li>
                        Optional:
                        <ul>
                          <li>Cinnamon</li>
                          <li>A small amount of honey</li>
                        </ul>
                      </li>
                    </ul>
                  </q-card-section>
                </q-expansion-item>
                <q-expansion-item
                  expand-icon="keyboard_arrow_down"
                  expanded-icon="keyboard_arrow_up"
                  transition-show="jump-down"
                  transition-hide="jump-up"
                >
                  <template v-slot:header>
                    <q-chip>Fasting Supplements</q-chip>
                  </template>

                  <q-card-section>
                    <td style="padding: 20px">
                      <p>
                        <strong>NOTE -</strong> These Supplement Suggestions are not based on
                        medical advice and should be used at your own discretion. Please consult
                        with a healthcare professional before starting any new supplement regimen.
                      </p>
                    </td>
                    <q-chip color="accent" text-color="white">Bone Broth</q-chip>
                    <ul>
                      <li>
                        Fluid and electrolytes — sodium, potassium, and sometimes magnesium can help
                        with headaches, weakness, and that “flat” feeling during fasting.
                      </li>
                      <li>
                        Some protein — collagen/gelatin can reduce hunger and may make a longer fast
                        more comfortable.
                      </li>
                      <li>
                        Warmth and satiety — a cup of broth can psychologically make a fast much
                        easier to stick with.
                      </li>
                      <li>
                        Very few calories — depending on the broth, often roughly 30–60 calories per
                        cup.
                      </li>
                    </ul>
                    <hr />
                    <q-chip color="accent" text-color="white">Coconut Oil</q-chip>
                    <p style="padding: 20px">
                      Coconut oil is almost entirely fat, particularly medium-chain triglycerides
                      (MCTs). MCTs are rapidly absorbed and can increase ketone production, which
                      may: Reduce hunger for some people, Provide readily available energy, reduce
                      the “low energy” feeling, and make it easier to fast longer.
                    </p>
                    <ul>
                      <li>Useful when fasting Useful on a empty stomic.</li>
                      <li>
                        Useful taken in the morning on an empty stomach before coffee or water
                      </li>
                      <li>May make it easier to sleep if taken before bed while fasting.</li>
                    </ul>
                    <p style="padding-left: 1.5rem">
                      Up to 1 tablespoon coconut oil Why: MCTs are rapidly delivered to and
                      metabolized by the liver, where they can be converted to energy and ketones.
                      In moderation, they will not trigger Cortisol.
                    </p>
                    <p style="padding-left: 1.5rem">
                      One tablespoon has approximately 120 calories, so use cautiously with in your
                      calorie budget.
                    </p>
                  </q-card-section>
                </q-expansion-item>
              </q-card>
            </div>

            <div class="col-12 col-md-4">
              <q-card flat bordered style="width: 90%; max-width: 90%; margin: 0 auto">
                <q-expansion-item
                  expand-icon="keyboard_arrow_down"
                  expanded-icon="keyboard_arrow_up"
                  transition-show="jump-down"
                  transition-hide="jump-up"
                >
                  <template v-slot:header>
                    <q-chip>Related Resources</q-chip>
                  </template>
                  <q-card-section>
                    <div class="text-weight-bold">More to come here</div>
                    <a href="https://google.com" target="_blank" rel="noopener noreferrer">
                      Google
                    </a>
                  </q-card-section>
                </q-expansion-item>
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
