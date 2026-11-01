<template>
  <div>
    <AutoHeading :auto-id="autoId" @loaded="onAutoLoaded" />
    <q-banner v-if="error" class="bg-negative text-white" rounded>{{ error }}</q-banner>
    <div v-else-if="!rows.length" class="text-grey-7 q-pa-md">
      {{ loading ? 'Loading…' : 'No service log entries for this auto.' }}
    </div>
    <div v-else>
      <div class="text-h5 text-center q-mb-md">Service Log</div>
      <q-markup-table flat bordered dense>
        <thead>
          <tr>
            <th class="text-left">Service</th>
            <th class="text-left">Attachment</th>
            <th class="text-left">Date</th>
            <th class="text-right">Miles</th>
            <th class="text-right">Parts</th>
            <th class="text-right">Labor</th>
            <th class="text-right">Total</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.service_log_id">
            <td class="text-left">{{ row.name }}</td>
            <td class="text-left">
              <a
                v-if="row.invoiceUrl"
                :href="row.invoiceUrl"
                target="_blank"
                rel="noopener noreferrer"
              >
                View attachment
              </a>
            </td>
            <td class="text-left">{{ formatDate(row.service_date) }}</td>
            <td class="text-right">{{ formatNumber(row.service_miles) }}</td>
            <td class="text-right">{{ formatMoney(row.parts) }}</td>
            <td class="text-right">{{ formatMoney(row.labor) }}</td>
            <td class="text-right">{{ formatMoney(row.total_cost) }}</td>
          </tr>
        </tbody>
      </q-markup-table>

      <div v-if="noteRows.length" class="q-mt-lg">
        <div class="text-h6 q-mb-sm">Notes</div>
        <q-markup-table flat bordered dense class="notes-table">
          <colgroup>
            <col style="width: 33.3333%" />
            <col style="width: 33.3333%" />
            <col style="width: 33.3333%" />
          </colgroup>
          <thead>
            <tr>
              <th class="text-left">Service</th>
              <th class="text-left">Date</th>
              <th class="text-left">Source</th>
            </tr>
          </thead>
          <tbody>
            <template v-for="note in noteRows" :key="note.key">
              <tr>
                <td class="text-left">{{ note.name }}</td>
                <td class="text-left">{{ formatDate(note.date) }}</td>
                <td class="text-left">{{ note.source }}</td>
              </tr>
              <tr>
                <td colspan="3" class="text-left" style="white-space: normal">
                  <div class="text-caption text-weight-medium q-mb-xs">Notes</div>
                  <NotesViewer :notes="note.notes" />
                </td>
              </tr>
            </template>
          </tbody>
        </q-markup-table>
      </div>

      <q-separator class="q-my-md" />
      <div class="row items-center justify-between q-mt-md">
        <q-toggle
          v-model="includeNotes"
          dense
          :label="`Include notes: ${includeNotes ? 'Yes' : 'No'}`"
        />
        <div class="row q-gutter-sm">
          <q-btn color="secondary" label="Export CSV" dense @click="exportCsv" />
          <q-btn color="secondary" label="Export PDF" dense @click="exportPdf" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import { computed, ref, watch } from 'vue'
import NotesViewer from '@/components/NotesViewer.vue'
import AutoHeading from '@/components/AutoHeading.vue'
import { supabase } from '@/lib/supabase'
import { useServiceOrderStore } from '@/stores/serviceOrder'

const props = defineProps({
  autoId: { type: [Number, String], default: null },
})

const serviceOrderStore = useServiceOrderStore()
const rows = ref([])
const loading = ref(false)
const autoTitle = ref('')
const autoVin = ref('')
const autoPrefix = computed(() => autoTitle.value.replace(/[^A-Za-z0-9]/g, ''))

function onAutoLoaded({ title, vin }) {
  autoTitle.value = title
  autoVin.value = vin
}
const exportFilename = (extension) =>
  `${autoPrefix.value ? `${autoPrefix.value}_` : ''}ServiceLog_${timestampForFilename()}.${extension}`
const error = ref('')
const includeNotes = ref(false)
let requestId = 0

const stripHtml = (value) =>
  String(value || '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

function timestampForFilename() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}-${pad(
    now.getHours(),
  )}-${pad(now.getMinutes())}`
}

// Quotes fields that contain a comma, quote, or newline per CSV rules.
function toCsvField(value) {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

const exportHead = ['SERVICE', 'DATE', 'MILES', 'PARTS', 'LABOR', 'TOTAL', 'ATTACHMENT']

function exportBody() {
  return rows.value.map((row) => [
    row.name || '',
    formatDate(row.service_date),
    row.service_miles ?? '',
    Number(row.parts || 0).toFixed(2),
    Number(row.labor || 0).toFixed(2),
    Number(row.total_cost || 0).toFixed(2),
    row.invoiceUrl ? 'Yes' : 'No',
  ])
}

function exportNotes() {
  return noteRows.value.map((note) => [
    note.name || '',
    formatDate(note.date),
    note.source,
    stripHtml(note.notes),
  ])
}

function exportCsv() {
  const lines = []
  if (autoTitle.value) lines.push(toCsvField(autoTitle.value))
  if (autoTitle.value) lines.push(autoVin.value ? toCsvField(`VIN: ${autoVin.value}`) : '')
  lines.push(exportHead.join(','))
  for (const values of exportBody()) lines.push(values.map(toCsvField).join(','))

  if (includeNotes.value && noteRows.value.length) {
    lines.push('', 'NOTES', 'SERVICE,DATE,SOURCE,NOTES')
    for (const values of exportNotes()) lines.push(values.map(toCsvField).join(','))
  }

  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = exportFilename('csv')
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function exportPdf() {
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'letter' })
  const headStyles = { fillColor: [25, 118, 210], textColor: 255, fontStyle: 'bold' }

  doc.setFontSize(16)
  doc.setFont('helvetica', 'bold')
  const pageWidth = doc.internal.pageSize.getWidth()
  let tableStartY = 24
  if (autoTitle.value) {
    doc.text(autoTitle.value, pageWidth / 2, 18, { align: 'center' })
    if (autoVin.value) {
      doc.setFontSize(11)
      doc.setFont('helvetica', 'normal')
      doc.text(`VIN: ${autoVin.value}`, pageWidth / 2, 25, { align: 'center' })
    }
    tableStartY = 32
  }

  autoTable(doc, {
    startY: tableStartY,
    head: [exportHead],
    body: exportBody(),
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles,
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { cellWidth: 25 },
    },
    margin: { left: 14, right: 14 },
  })

  if (includeNotes.value && noteRows.value.length) {
    const startY = doc.lastAutoTable.finalY + 12
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Notes', 14, startY)
    autoTable(doc, {
      startY: startY + 4,
      head: [['SERVICE', 'DATE', 'SOURCE', 'NOTES']],
      body: exportNotes(),
      theme: 'grid',
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles,
      columnStyles: { 3: { cellWidth: 140 } },
      margin: { left: 14, right: 14 },
    })
  }

  doc.save(exportFilename('pdf'))
}

const hasText = (value) => Boolean(String(value || '').replace(/<[^>]*>/g, '').trim())

// One entry per non-empty note; order notes and log notes are listed separately.
const noteRows = computed(() =>
  rows.value.flatMap((row) => {
    const entries = []
    if (hasText(row.service_order?.notes)) {
      entries.push({
        key: `order-${row.service_log_id}`,
        name: row.name,
        date: row.service_date,
        source: 'Service order',
        notes: row.service_order.notes,
      })
    }
    if (hasText(row.notes)) {
      entries.push({
        key: `log-${row.service_log_id}`,
        name: row.name,
        date: row.service_date,
        source: 'Service log',
        notes: row.notes,
      })
    }
    return entries
  }),
)

function formatDate(value) {
  return value ? String(value).slice(0, 10) : '—'
}

function formatNumber(value) {
  return value === null || value === undefined ? '—' : Number(value).toLocaleString()
}

function formatMoney(value) {
  return Number(value || 0).toLocaleString(undefined, { style: 'currency', currency: 'USD' })
}

async function load() {
  const currentRequest = ++requestId
  error.value = ''
  if (!props.autoId) {
    rows.value = []
    return
  }

  loading.value = true
  try {
    const { data, error: logError } = await supabase
      .from('service_log')
      .select(
        'service_log_id, service_id, service_date, service_miles, name, notes, parts, labor, total_cost, service_order!inner(service_order_id, auto_id, is_active, invoice_url, notes)',
      )
      .eq('service_order.auto_id', props.autoId)
      .eq('service_order.is_active', true)
    if (logError) throw logError

    const sorted = (data || []).sort(
      (a, b) =>
        String(a.name || '').localeCompare(String(b.name || '')) ||
        String(a.service_date || '').localeCompare(String(b.service_date || '')),
    )

    // Resolve each distinct attachment once.
    const urls = new Map()
    const paths = new Set(sorted.map((log) => log.service_order?.invoice_url).filter(Boolean))
    await Promise.all(
      [...paths].map(async (path) => urls.set(path, await serviceOrderStore.getInvoiceUrl(path))),
    )

    if (currentRequest !== requestId) return
    rows.value = sorted.map((log) => ({
      ...log,
      invoiceUrl: urls.get(log.service_order?.invoice_url) || '',
    }))
  } catch (err) {
    if (currentRequest !== requestId) return
    error.value = err.message || 'Unable to load exports.'
    rows.value = []
  } finally {
    if (currentRequest === requestId) loading.value = false
  }
}

watch(() => props.autoId, load, { immediate: true })
</script>

<style scoped>
.notes-table :deep(table) {
  table-layout: fixed;
  width: 100%;
}
</style>
