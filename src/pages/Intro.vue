<template>
  <q-page class="column items-center q-px-md q-py-lg">
    <img
      src="/AutoRepairLog.png"
      alt="Auto Repair Log"
      style="
        border-radius: 12px;
        max-width: 100%;
        width: 32%;
        margin-top: 32px;
        margin-bottom: 32px;
      "
    />

    <h5
      style="
        max-width: 720px;
        width: 60%;
        margin: 40px auto 40px;
        text-align: justify;
        font-size: 1.05rem;
        line-height: 1.6;
      "
    >
      <strong>Auto Repair Log</strong> - Track your Auto records, manage maintenance and repair
      schedules, and stay ahead with a clear view of upcoming service needs.
    </h5>

    <div class="q-pa-md text-center" style="max-width: 720px; width: 100%">
      <q-btn color="secondary" label="Let's Go!" to="/login" style="margin-top: 8px" />
    </div>
  </q-page>
</template>
