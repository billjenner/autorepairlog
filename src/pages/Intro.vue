<template>
  <q-page class="column items-center q-px-md q-py-lg">
    <img
      src="/AutoRepairLog.png"
      alt="Auto Repair Log"
      style="
        border-radius: 12px;
        max-width: 100%;
        width: 25%;
        margin-top: 16px;
        margin-bottom: 16px;
      "
    />

    <h5
      style="
        max-width: 720px;
        width: 75%;
        margin: 12px auto 16px;
        text-align: justify;
        font-size: 1.05rem;
        line-height: 1.6;
      "
    >
      Auto Repair Log - Track your Auto records, manage maintenance and repair schedules, and stay
      ahead with a clear view of upcoming service needs.
    </h5>

    <div class="q-pa-md text-center" style="max-width: 720px; width: 100%">
      <q-btn color="secondary" label="Let's Go!" to="/log" style="margin-top: 8px" />
    </div>
  </q-page>
</template>
