<template>
  <q-page class="column items-center q-px-md q-py-lg">
    <img
      src="/AutoRepairLog.png"
      alt="Auto Repair Log"
      style="
        border-radius: 12px;
        max-width: 100%;
        width: 40%;
        margin-top: 32px;
        margin-bottom: 12px;
      "
    />

    <h5
      style="
        max-width: 720px;
        width: 60%;
        margin: 32px auto 32px;
        text-align: justify;
        font-size: 1.2rem;
        line-height: 1.6;
      "
    >
      <strong>Auto Repair Log</strong> - Track your Auto records, manage maintenance and repair schedules all in one organized dashboard. Stay ahead with a clear view of upcoming service needs.
    </h5>

    <div class="q-pa-md text-center" style="max-width: 720px; width: 100%">
      <q-btn
        color="secondary"
        label="Let's Go!"
        :loading="routing"
        style="margin-top: 8px"
        @click="handleLetsGo"
      />
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const routing = ref(false)

async function handleLetsGo() {
  routing.value = true
  try {
    await router.push('/setup')
  } finally {
    routing.value = false
  }
}
</script>
