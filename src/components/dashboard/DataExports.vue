<template>
  <q-card flat bordered class="q-mb-md">
    <q-expansion-item
      label="Data Exports"
      expand-icon="keyboard_arrow_down"
      expanded-icon="keyboard_arrow_up"
      transition-show="jump-down"
      transition-hide="jump-up"
    >
      <q-card-section>
        <q-banner v-if="!usersStore.currentUser" class="bg-warning text-dark" rounded>
          Sign in to Export Your Data
        </q-banner>

        <template v-else>
          <div class="row q-col-gutter-md justify-center q-mx-md">
            <div class="col-auto">
              <q-input
                v-model="startDate"
                type="date"
                label="Start Date"
                class="export-date"
                filled
                dense
                style="width: 140px"
              />
            </div>

            <div class="col-auto">
              <q-input
                v-model="endDate"
                type="date"
                label="End Date"
                class="export-date"
                filled
                dense
                style="width: 140px"
              />
            </div>
          </div>
          <div class="row q-col-gutter-md justify-center q-mx-md">
            <div class="text-center text-italic text-bold q-mt-md text-grey-7">
              Note: Exports may only work on desktop
            </div>
          </div>
          <q-separator class="q-my-md" />
          <div class="row items-center justify-between q-mt-md">
            <q-toggle
              v-model="includeFoodLog"
              label="Food Log"
              @update:model-value="setActiveExport('food', $event)"
            />
            <div class="row q-gutter-sm">
              <q-btn
                color="secondary"
                label="Export CSV"
                class="export-btn"
                dense
                :loading="exportingFoodCsv"
                :disable="!includeFoodLog"
                @click="exportFoodCsv"
              />

              <q-btn
                color="secondary"
                label="Export PDF"
                class="export-btn"
                dense
                :loading="exportingFoodPdf"
                :disable="!includeFoodLog"
                @click="exportFoodPdf"
              />
            </div>
          </div>

          <q-separator class="q-my-md" />
          <div class="row items-center justify-between q-mt-md">
            <q-toggle
              v-model="includeWorkoutLog"
              label="Workout Log"
              @update:model-value="setActiveExport('workout', $event)"
            />
            <div class="row q-gutter-sm">
              <q-btn
                color="secondary"
                label="Export CSV"
                class="export-btn"
                dense
                :loading="exportingWorkoutCsv"
                :disable="!includeWorkoutLog"
                @click="exportWorkoutCsv"
              />

              <q-btn
                color="secondary"
                label="Export PDF"
                class="export-btn"
                dense
                :loading="exportingWorkoutPdf"
                :disable="!includeWorkoutLog"
                @click="exportWorkoutPdf"
              />
            </div>
          </div>

          <q-separator class="q-my-md" />
          <div class="row items-center justify-between q-mt-md">
            <q-toggle
              v-model="includeSupplementLog"
              label="Supplement Log"
              @update:model-value="setActiveExport('supplement', $event)"
            />
            <div class="row q-gutter-sm">
              <q-btn
                color="secondary"
                label="Export CSV"
                class="export-btn"
                dense
                :loading="exportingSupplimentLogCsv"
                :disable="!includeSupplementLog"
                @click="exportSupplimentCsv"
              />

              <q-btn
                color="secondary"
                label="Export PDF"
                class="export-btn"
                dense
                :loading="exportingPdf"
                :disable="!includeSupplementLog"
                @click="exportSupplimentPdf"
              />
            </div>
          </div>

          <q-separator class="q-my-md" />
          <div class="row items-center justify-between q-mt-md">
            <q-toggle
              v-model="includeWeightLog"
              label="Weight Log"
              @update:model-value="setActiveExport('weight', $event)"
            />
            <div class="row q-gutter-sm">
              <q-btn
                color="secondary"
                label="Export CSV"
                class="export-btn"
                dense
                :loading="exportingWeightCsv"
                :disable="!includeWeightLog"
                @click="exportWeightCsv"
              />

              <q-btn
                color="secondary"
                label="Export PDF"
                class="export-btn"
                dense
                :loading="exportingWeightPdf"
                :disable="!includeWeightLog"
                @click="exportWeightPdf"
              />
            </div>
          </div>
        </template>
      </q-card-section>
    </q-expansion-item>
  </q-card>
</template>

<script setup>
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { ref } from 'vue'
import { useQuasar } from 'quasar'
import { useProfileStore } from 'stores/profile'
import { usesupplementsLogStore } from 'stores/supplements_log'
import { useWeightLogsStore } from 'stores/weight-logs'
import { useWorkoutLogsStore } from 'stores/workout-logs'
import { useFoodLogsStore } from 'stores/food-logs'
import { useUsersStore } from 'stores/users'

const profileStore = useProfileStore()
const supplementLogsStore = usesupplementsLogStore()
const weightLogsStore = useWeightLogsStore()
const workoutLogsStore = useWorkoutLogsStore()
const foodLogsStore = useFoodLogsStore()
const usersStore = useUsersStore()
const $q = useQuasar()

const includeSupplementLog = ref(false)
const includeWeightLog = ref(false)
const includeWorkoutLog = ref(false)
const includeFoodLog = ref(false)

const exportingSupplimentLogCsv = ref(false)
const exportingPdf = ref(false)
const exportingWeightCsv = ref(false)
const exportingWeightPdf = ref(false)
const exportingWorkoutCsv = ref(false)
const exportingWorkoutPdf = ref(false)
const exportingFoodCsv = ref(false)
const exportingFoodPdf = ref(false)

function resetExportSelections() {
  includeFoodLog.value = false
  includeWorkoutLog.value = false
  includeSupplementLog.value = false
  includeWeightLog.value = false
}

function setActiveExport(exportType, enabled) {
  if (!enabled) {
    return
  }

  resetExportSelections()

  const selections = {
    food: includeFoodLog,
    workout: includeWorkoutLog,
    supplement: includeSupplementLog,
    weight: includeWeightLog,
  }

  selections[exportType].value = true
}

async function NotifyUser() {
  $q.notify({
    color: 'positive',
    textColor: 'white',
    message: 'Export Completed',
  })
}

function formatDate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

function currentDate() {
  return formatDate(new Date())
}

function daysAgo(days) {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return formatDate(date)
}

// Default to a 30-day window so the export isn't empty when opened.
const startDate = ref(daysAgo(90))
const endDate = ref(currentDate())

function properCase(value) {
  const text = String(value || '').trim()

  return text ? text.charAt(0).toUpperCase() + text.slice(1).toLowerCase() : ''
}

function timestampForFilename() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate(),
  )}-${pad(now.getHours())}-${pad(now.getMinutes())}`
}

// Quotes fields that contain a comma, quote, or newline per CSV rules.
function toCsvField(value) {
  const text = String(value ?? '')

  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

function formatDateOnly(value) {
  return value ? String(value).slice(0, 10) : ''
}

function formatDateTime(value) {
  if (!value) {
    return ''
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return String(value)
  }

  const pad = (part) => String(part).padStart(2, '0')

  return `${parsed.getFullYear()}-${pad(parsed.getMonth() + 1)}-${pad(parsed.getDate())} ${pad(
    parsed.getHours(),
  )}:${pad(parsed.getMinutes())}`
}

function computeFoodLogValues(row) {
  const food = row.food || {}
  const servings = Number(row.servings) || 0
  const protein = servings * (Number(food.protein) || 0) * 4
  const carb = servings * (Number(food.carb) || 0) * 4
  const fat = servings * (Number(food.fat) || 0) * 9
  const caloriesExtra = Number(food.calories_extra) || 0
  const calories = protein + carb + fat + caloriesExtra

  return {
    description: food.description || '',
    servings,
    servingSize: `${food.serving_unit || ''}(${food.serving_size ?? ''})`,
    calories,
    protein,
    carb,
    fat,
    datetime: formatDateTime(row.datetime),
  }
}

function buildFoodLogCsv(rows) {
  const lines = [
    'DESCRIPTION, SERVINGS, SERV. SIZE, CALORIES, PROTEIN (g), CARBS (g), FAT (g), Date Time',
  ]

  for (const row of rows) {
    const values = computeFoodLogValues(row)

    lines.push(
      [
        toCsvField(values.description),
        toCsvField(values.servings.toFixed(2)),
        toCsvField(values.servingSize),
        toCsvField(values.calories.toFixed(2)),
        toCsvField(values.protein.toFixed(2)),
        toCsvField(values.carb.toFixed(2)),
        toCsvField(values.fat.toFixed(2)),
        toCsvField(values.datetime),
      ].join(','),
    )
  }

  return lines.join('\n')
}

async function exportFoodCsv() {
  if (!usersStore.currentUser?.user_id) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      message: 'No current user is available.',
    })

    return
  }

  if (!includeFoodLog.value) {
    return
  }

  exportingFoodCsv.value = true

  try {
    const rows = await foodLogsStore.fetchFoodLogsForExport(
      usersStore.currentUser.user_id,
      startDate.value,
      endDate.value,
    )

    if (foodLogsStore.error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        message: foodLogsStore.error,
      })

      return
    }

    const fname = properCase(profileStore.currentProfile?.fname)
    const lname = properCase(profileStore.currentProfile?.lname)

    const filename = `${fname}${lname}_FoodLogs_${timestampForFilename()}.csv`

    downloadCsv(filename, buildFoodLogCsv(rows))
  } finally {
    exportingFoodCsv.value = false
    resetExportSelections()
    await NotifyUser()
  }
}

async function exportFoodPdf() {
  if (!usersStore.currentUser?.user_id) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      message: 'No current user is available.',
    })
    return
  }

  if (!includeFoodLog.value) {
    return
  }

  exportingFoodPdf.value = true

  try {
    const rows = await foodLogsStore.fetchFoodLogsForExport(
      usersStore.currentUser.user_id,
      startDate.value,
      endDate.value,
    )

    if (foodLogsStore.error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        message: foodLogsStore.error,
      })
      return
    }

    const fname = properCase(profileStore.currentProfile?.fname)
    const lname = properCase(profileStore.currentProfile?.lname)

    const filename = `${fname}${lname}_FoodLogs_${timestampForFilename()}.pdf`

    const doc = new jsPDF({
      orientation: 'landscape',
      unit: 'mm',
      format: 'letter',
    })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`${fname} ${lname}`, 14, 18)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Food Log', 14, 26)

    doc.setFontSize(10)
    doc.text(`Date Range: ${startDate.value} through ${endDate.value}`, 14, 33)

    const tableRows = rows.map((row) => {
      const values = computeFoodLogValues(row)

      return [
        values.description,
        values.servings.toFixed(2),
        values.servingSize,
        values.calories.toFixed(2),
        values.protein.toFixed(2),
        values.carb.toFixed(2),
        values.fat.toFixed(2),
        values.datetime,
      ]
    })

    autoTable(doc, {
      startY: 40,

      head: [
        [
          'DESCRIPTION',
          'SERVINGS',
          'SERV. SIZE',
          'CALORIES',
          'PROTEIN (g)',
          'CARBS (g)',
          'FAT (g)',
          'DATE TIME',
        ],
      ],

      body: tableRows,

      theme: 'grid',

      styles: {
        fontSize: 9,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold',
      },

      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 22, halign: 'right' },
        2: { cellWidth: 25, halign: 'right' },
        3: { cellWidth: 25, halign: 'right' },
        4: { cellWidth: 28, halign: 'right' },
        5: { cellWidth: 25, halign: 'right' },
        6: { cellWidth: 22, halign: 'right' },
        7: { cellWidth: 40 },
      },

      margin: {
        left: 14,
        right: 14,
      },
    })

    doc.save(filename)
  } finally {
    exportingFoodPdf.value = false
    resetExportSelections()
    await NotifyUser()
  }
}

function buildWorkoutLogCsv(rows) {
  const lines = ['DESCRIPTION, W. O. TIME, CALORIES BURNED, DATE']

  for (const row of rows) {
    const description = row.workout?.type || ''
    const workoutTime = Number(row.workout_time) || 0
    const caloriesBurned = Number(row.calories_burned) || 0
    const date = formatDateOnly(row.date)

    lines.push(
      [
        toCsvField(description),
        toCsvField(workoutTime),
        toCsvField(caloriesBurned),
        toCsvField(date),
      ].join(','),
    )
  }

  return lines.join('\n')
}

async function exportWorkoutCsv() {
  if (!usersStore.currentUser?.user_id) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      message: 'No current user is available.',
    })

    return
  }

  if (!includeWorkoutLog.value) {
    return
  }

  exportingWorkoutCsv.value = true

  try {
    const rows = await workoutLogsStore.fetchWorkoutLogsForExport(
      usersStore.currentUser.user_id,
      startDate.value,
      endDate.value,
    )

    if (workoutLogsStore.error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        message: workoutLogsStore.error,
      })

      return
    }

    const fname = properCase(profileStore.currentProfile?.fname)
    const lname = properCase(profileStore.currentProfile?.lname)

    const filename = `${fname}${lname}_WorkoutLogs_${timestampForFilename()}.csv`

    downloadCsv(filename, buildWorkoutLogCsv(rows))
  } finally {
    exportingWorkoutCsv.value = false
    resetExportSelections()
    await NotifyUser()
  }
}

async function exportWorkoutPdf() {
  if (!usersStore.currentUser?.user_id) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      message: 'No current user is available.',
    })
    return
  }

  if (!includeWorkoutLog.value) {
    return
  }

  exportingWorkoutPdf.value = true

  try {
    const rows = await workoutLogsStore.fetchWorkoutLogsForExport(
      usersStore.currentUser.user_id,
      startDate.value,
      endDate.value,
    )

    if (workoutLogsStore.error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        message: workoutLogsStore.error,
      })
      return
    }

    const fname = properCase(profileStore.currentProfile?.fname)
    const lname = properCase(profileStore.currentProfile?.lname)

    const filename = `${fname}${lname}_WorkoutLogs_${timestampForFilename()}.pdf`

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`${fname} ${lname}`, 14, 18)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Workout Log', 14, 26)

    doc.setFontSize(10)
    doc.text(`Date Range: ${startDate.value} through ${endDate.value}`, 14, 33)

    const tableRows = rows.map((row) => {
      const description = row.workout?.type || ''
      const workoutTime = Number(row.workout_time) || 0
      const caloriesBurned = Number(row.calories_burned) || 0
      const date = formatDateOnly(row.date)

      return [description, workoutTime, caloriesBurned, date]
    })

    autoTable(doc, {
      startY: 40,

      head: [['DESCRIPTION', 'W. O. TIME', 'CALORIES BURNED', 'DATE']],

      body: tableRows,

      theme: 'grid',

      styles: {
        fontSize: 9,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold',
      },

      columnStyles: {
        0: {
          cellWidth: 65,
        },
        1: {
          cellWidth: 35,
          halign: 'right',
        },
        2: {
          cellWidth: 45,
          halign: 'right',
        },
        3: {
          cellWidth: 40,
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    })

    doc.save(filename)
  } finally {
    exportingWorkoutPdf.value = false
    resetExportSelections()
    await NotifyUser()
  }
}

function buildSupplementLogCsv(rows) {
  const lines = ['DESCRIPTION, SERVINGS, SERV. TYPE, DATE']

  for (const row of rows) {
    const description = row.supplement?.description || ''
    const servings = Number(row.servings) || 0
    const servingUnit = row.supplement?.serving_unit || ''
    const date = formatDateOnly(row.date)

    lines.push(
      [
        toCsvField(description),
        toCsvField(servings.toFixed(2)),
        toCsvField(servingUnit),
        toCsvField(date),
      ].join(','),
    )
  }

  return lines.join('\n')
}

function downloadCsv(filename, content) {
  const blob = new Blob([content], {
    type: 'text/csv;charset=utf-8;',
  })

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = filename
  link.click()

  setTimeout(() => {
    URL.revokeObjectURL(url)
  }, 1000)
}

async function exportSupplimentCsv() {
  if (!usersStore.currentUser?.user_id) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      message: 'No current user is available.',
    })

    return
  }

  if (!includeSupplementLog.value) {
    return
  }

  exportingSupplimentLogCsv.value = true

  try {
    const rows = await supplementLogsStore.fetchSupplementLogsForExport(
      usersStore.currentUser.user_id,
      startDate.value,
      endDate.value,
    )

    if (supplementLogsStore.error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        message: supplementLogsStore.error,
      })

      return
    }

    const fname = properCase(profileStore.currentProfile?.fname)
    const lname = properCase(profileStore.currentProfile?.lname)

    const filename = `${fname}${lname}_SupplementLogs_${timestampForFilename()}.csv`

    downloadCsv(filename, buildSupplementLogCsv(rows))
  } finally {
    exportingSupplimentLogCsv.value = false
    resetExportSelections()
    await NotifyUser()
  }
}

async function exportSupplimentPdf() {
  if (!usersStore.currentUser?.user_id) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      message: 'No current user is available.',
    })
    return
  }

  if (!includeSupplementLog.value) {
    return
  }

  exportingPdf.value = true

  try {
    const rows = await supplementLogsStore.fetchSupplementLogsForExport(
      usersStore.currentUser.user_id,
      startDate.value,
      endDate.value,
    )

    if (supplementLogsStore.error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        message: supplementLogsStore.error,
      })
      return
    }

    const fname = properCase(profileStore.currentProfile?.fname)
    const lname = properCase(profileStore.currentProfile?.lname)

    const filename = `${fname}${lname}_SupplementLogs_${timestampForFilename()}.pdf`

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    })

    // Title
    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`${fname} ${lname}`, 14, 18)

    // Report title
    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Supplement Log', 14, 26)

    // Date range
    doc.setFontSize(10)
    doc.text(`Date Range: ${startDate.value} through ${endDate.value}`, 14, 33)

    // Prepare table data
    const tableRows = rows.map((row) => {
      const description = row.supplement?.description || ''
      const servings = Number(row.servings) || 0
      const servingUnit = row.supplement?.serving_unit || ''
      const date = formatDateOnly(row.date)

      return [description, servings.toFixed(2), servingUnit, date]
    })

    // Generate table
    autoTable(doc, {
      startY: 40,

      head: [['DESCRIPTION', 'SERVINGS', 'SERV. TYPE', 'DATE']],

      body: tableRows,

      theme: 'grid',

      styles: {
        fontSize: 9,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold',
      },

      columnStyles: {
        0: {
          cellWidth: 75,
        },
        1: {
          cellWidth: 25,
          halign: 'right',
        },
        2: {
          cellWidth: 35,
        },
        3: {
          cellWidth: 40,
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    })

    // Download
    doc.save(filename)
  } finally {
    exportingPdf.value = false
    resetExportSelections()
    await NotifyUser()
  }
}

function buildWeightLogCsv(rows) {
  const lines = ['WEIGHT, BMI, DATE']

  for (const row of rows) {
    const weight = Number(row.weight) || 0
    const bmi = Number(row.bmi) || 0
    const date = formatDateOnly(row.date)

    lines.push(
      [toCsvField(weight.toFixed(2)), toCsvField(bmi.toFixed(2)), toCsvField(date)].join(','),
    )
  }

  return lines.join('\n')
}

async function exportWeightCsv() {
  if (!usersStore.currentUser?.user_id) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      message: 'No current user is available.',
    })

    return
  }

  if (!includeWeightLog.value) {
    return
  }

  exportingWeightCsv.value = true

  try {
    const rows = await weightLogsStore.fetchWeightLogsForExport(
      usersStore.currentUser.user_id,
      startDate.value,
      endDate.value,
    )

    if (weightLogsStore.error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        message: weightLogsStore.error,
      })

      return
    }

    const fname = properCase(profileStore.currentProfile?.fname)
    const lname = properCase(profileStore.currentProfile?.lname)

    const filename = `${fname}${lname}_WeightLogs_${timestampForFilename()}.csv`

    downloadCsv(filename, buildWeightLogCsv(rows))
  } finally {
    exportingWeightCsv.value = false
    resetExportSelections()
    await NotifyUser()
  }
}

async function exportWeightPdf() {
  if (!usersStore.currentUser?.user_id) {
    $q.notify({
      color: 'negative',
      textColor: 'white',
      message: 'No current user is available.',
    })
    return
  }

  if (!includeWeightLog.value) {
    return
  }

  exportingWeightPdf.value = true

  try {
    const rows = await weightLogsStore.fetchWeightLogsForExport(
      usersStore.currentUser.user_id,
      startDate.value,
      endDate.value,
    )

    if (weightLogsStore.error) {
      $q.notify({
        color: 'negative',
        textColor: 'white',
        message: weightLogsStore.error,
      })
      return
    }

    const fname = properCase(profileStore.currentProfile?.fname)
    const lname = properCase(profileStore.currentProfile?.lname)

    const filename = `${fname}${lname}_WeightLogs_${timestampForFilename()}.pdf`

    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'letter',
    })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'bold')
    doc.text(`${fname} ${lname}`, 14, 18)

    doc.setFontSize(12)
    doc.setFont('helvetica', 'normal')
    doc.text('Weight Log', 14, 26)

    doc.setFontSize(10)
    doc.text(`Date Range: ${startDate.value} through ${endDate.value}`, 14, 33)

    const tableRows = rows.map((row) => {
      const weight = Number(row.weight) || 0
      const bmi = Number(row.bmi) || 0
      const date = formatDateOnly(row.date)

      return [weight.toFixed(2), bmi.toFixed(2), date]
    })

    autoTable(doc, {
      startY: 40,

      head: [['WEIGHT', 'BMI', 'DATE']],

      body: tableRows,

      theme: 'grid',

      styles: {
        fontSize: 9,
        cellPadding: 3,
      },

      headStyles: {
        fillColor: [25, 118, 210],
        textColor: 255,
        fontStyle: 'bold',
      },

      columnStyles: {
        0: {
          cellWidth: 40,
          halign: 'right',
        },
        1: {
          cellWidth: 40,
          halign: 'right',
        },
        2: {
          cellWidth: 40,
        },
      },

      margin: {
        left: 14,
        right: 14,
      },
    })

    doc.save(filename)
  } finally {
    exportingWeightPdf.value = false
    resetExportSelections()
    await NotifyUser()
  }
}
</script>
<style scoped>
.export-btn {
  font-size: 12px;
}
.export-date {
  font-size: 12px;
}
</style>
