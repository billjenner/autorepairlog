// stripe payment page

<!-- <template>
  <q-page class="q-pa-md flex flex-center">
    <q-card
      class="q-pa-lg"
      style="width: 100%; max-width: 520px"
    >
      <q-card-section>
        <div class="text-h5 text-weight-bold">
          Upgrade to SlimMacros
        </div>

        <div class="text-grey-7 q-mt-sm">
          Get full access to all SlimMacros features.
        </div>
      </q-card-section>

      <q-card-section>
        <q-option-group
          v-model="selectedPlan"
          :options="plans"
          type="radio"
          color="primary"
        />
      </q-card-section>

      <q-card-section>
        <q-btn
          class="full-width"
          color="primary"
          size="lg"
          label="Continue to Secure Payment"
          :loading="loading"
          @click="checkout"
        />
      </q-card-section>

      <q-card-section class="text-center text-caption text-grey-6">
        Secure payment processing by Stripe
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { Notify } from 'quasar'

const selectedPlan = ref('monthly')
const loading = ref(false)

const plans = [
  {
    label: '$9.99 / month',
    value: 'monthly'
  },
  {
    label: '$29.99 / year',
    value: 'annual'
  }
]

async function checkout () {
  loading.value = true

  try {
    const response = await fetch('/api/create-checkout-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        plan: selectedPlan.value
      })
    })

    if (!response.ok) {
      throw new Error('Unable to create checkout session')
    }

    const data = await response.json()

    window.location.href = data.url
  } catch (error) {
    Notify.create({
      type: 'negative',
      message: 'Unable to start payment. Please try again.'
    })
  } finally {
    loading.value = false
  }
}
</script>
 -->
