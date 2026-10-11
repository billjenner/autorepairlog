<template>
  <div class="barcode-scanner">
    <div class="scanner-header">
      <!-- Triggers scanner shutdown and emits close event to parent component -->
      <button class="close-button" @click="close">Cancel</button>

      <span>Scan Barcode</span>
    </div>

    <!-- Displays the last scanned string value sequentially -->
    <div v-if="lastBarcode" class="barcode-result">Last scanned barcode: {{ lastBarcode }}</div>

    <!-- The target video hook mount container -->
    <div v-show="!manualMode" class="scanner-container">
      <div id="html5-qr-video-engine" ref="scannerContainer" class="scanner-video"></div>
      <div v-if="scanning" class="scanner-overlay">
        <div class="scanner-target">
          <!-- Animated horizontal framing line guide -->
          <div class="scanner-line"></div>
        </div>
      </div>
    </div>

    <!-- Global engine exceptions and validation display block -->
    <div v-if="error" class="scanner-error">
      {{ error }}
    </div>

    <div v-if="!manualMode" class="scanner-instructions">Position the barcode inside the box</div>

    <q-btn
      v-if="!manualMode"
      class="q-mt-md"
      color="primary"
      outline
      no-caps
      label="Enter Bar Code Manually"
      @click="enterManualMode"
    />

    <div v-if="manualMode" class="manual-entry q-mt-md">
      <q-input
        v-model="manualBarcode"
        label="Bar Code"
        filled
        dense
        inputmode="numeric"
        mask="#############"
        unmask-value
        :rules="[
          (value) => /^\d+$/.test(value || '') || 'Numbers only',
          (value) => (value || '').length >= 12 || 'Minimum 12 digits',
        ]"
        @keyup.enter="lookupManualBarcode"
      />
      <q-btn
        color="primary"
        no-caps
        label="Lookup Bar Code"
        :disable="!manualBarcodeValid"
        @click="lookupManualBarcode"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onBeforeUnmount, nextTick, onMounted } from 'vue'
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode'
import { useRouter } from 'vue-router'

// ============================================================
// EVENTS & EMITS
// ============================================================
const emit = defineEmits(['close', 'detected', 'product-found', 'product-not-found', 'error'])
const router = useRouter()

// ============================================================
// STATE AND REFS CONFIGURATION
// ============================================================
const scannerContainer = ref(null) // Targets layout hook container

const cameras = ref([])
const selectedCameraId = ref('')

const scanning = ref(false)
const product = ref(null)
const productNotFound = ref(false)

// Template mapped state bindings
const lastBarcode = ref('')
const error = ref('')

const statusMessage = ref('')
const statusType = ref('')

let html5QrcodeInstance = null
let processingBarcode = false

// ============================================================
// CAMERA DISCOVERY UTILITIES
// ============================================================
async function getCameras() {
  try {
    const devices = await Html5Qrcode.getCameras()
    cameras.value = devices

    if (devices && devices.length > 0) {
      const rearCamera = devices.find((camera) => {
        const label = camera.label?.toLowerCase() || ''
        return (
          label.includes('back') ||
          label.includes('rear') ||
          label.includes('environment') ||
          label.includes('facing 0') ||
          label.includes('camera 1')
        )
      })
      selectedCameraId.value = rearCamera ? rearCamera.deviceId : ''
    } else {
      selectedCameraId.value = ''
    }
  } catch (err) {
    console.warn('Camera discovery access warning, using high level selectors:', err)
    selectedCameraId.value = ''
  }
}

// ============================================================
// START ENGINE SEQUENCE
// ============================================================
async function startScanner() {
  error.value = ''
  product.value = null
  productNotFound.value = false
  lastBarcode.value = ''
  processingBarcode = false

  try {
    if (!cameras.value.length) {
      await getCameras()
    }

    scanning.value = true
    statusMessage.value = 'Initializing scanner constraints...'
    statusType.value = 'info'

    await nextTick()

    // Pass the hardcoded wrapper element ID string to the underlying hardware constructor
    const elementId = 'html5-qr-video-engine'

    if (!html5QrcodeInstance) {
      html5QrcodeInstance = new Html5Qrcode(elementId, { verbose: false })
    }

    // Force strict hardware backend parameters targeting mobile environments
    const cameraSelector = selectedCameraId.value || { facingMode: 'environment' }

    const config = {
      fps: 20,
      useBarCodeDetectorIfSupported: true, // Swaps to ultra-fast native hardware decoding loop if device supports it
      formatsToSupport: [
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.EAN_8,
      ],
      videoConstraints: {
        facingMode: { ideal: 'environment' },
        width: { min: 1280, ideal: 1920 },
        height: { min: 720, ideal: 1080 },
      },
    }

    await html5QrcodeInstance.start(
      cameraSelector,
      config,
      (decodedText, decodedResult) => {
        if (!processingBarcode) {
          const standardFormat = decodedResult?.result?.format?.formatName || 'UNKNOWN'
          processBarcode(decodedText, standardFormat)
        }
      },
      () => {
        // FRAME FAILURE HANDLER: Ignored intentionally to optimize system thread speed
      },
    )

    console.log('✅ html5-qrcode framework attached smoothly into layout components.')
  } catch (err) {
    console.error('❌ Failed to establish scanning pipeline:', err)
    scanning.value = false
    error.value = err.message || 'Camera stream failed to load.'
    emit('error', err)
  }
}

// ============================================================
// PROCESSING DATA WRAPPERS
// ============================================================
async function processBarcode(barcode, format) {
  if (processingBarcode) return
  processingBarcode = true

  console.log('🔎 LOOKING UP PRODUCT', { barcode, format })
  lastBarcode.value = barcode

  emit('detected', { barcode, format })

  await stopScanner(false)
  await router.push({ path: '/food', query: { barcode, showFoodForm: 'true' } })

  // Food.vue performs the Open Food Facts lookup from the barcode query param
  processingBarcode = false
}

const manualMode = ref(false)
const manualBarcode = ref('')
const manualBarcodeValid = computed(() => /^\d{12,13}$/.test(manualBarcode.value || ''))

async function enterManualMode() {
  manualMode.value = true
  error.value = ''
  await stopScanner()
}

async function lookupManualBarcode() {
  if (!manualBarcodeValid.value) return
  await processBarcode(manualBarcode.value, 'MANUAL')
}

async function close() {
  await stopScanner()
  emit('close')
  await router.push({ path: '/food', query: { showFoodForm: 'true' } })
}

// ============================================================
// STOP PIPELINE ROUTINES
// ============================================================
async function stopScanner(clearStatus = true) {
  scanning.value = false

  if (html5QrcodeInstance) {
    // Delays execution slightly to allow hardware tracks to exit current frame state gracefully
    await new Promise((resolve) => setTimeout(resolve, 100))

    try {
      if (html5QrcodeInstance.isScanning || html5QrcodeInstance.getState() === 2) {
        await html5QrcodeInstance.stop()
      }
      html5QrcodeInstance = null
    } catch (err) {
      console.warn('Passed internal state collision safely:', err.message || err)
    }
  }

  if (clearStatus) {
    statusMessage.value = ''
    statusType.value = ''
  }
}

// ============================================================
// LIFECYCLE MANAGEMENT HOOKS
// ============================================================
onMounted(async () => {
  await startScanner()
})

onBeforeUnmount(async () => {
  await stopScanner(true)
})
</script>

<style scoped>
/* Main component structural layout wrapping frame sizes */
.barcode-scanner {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 500px;
  margin: 0 auto;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  background-color: #f9f9f9;
  border-radius: 16px;
  padding: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
}

.manual-entry {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}

/* Header style elements layout mapping options */
.scanner-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  margin-bottom: 16px;
  font-size: 18px;
  font-weight: 600;
  color: #333333;
}

.close-button {
  background-color: #e0e0e0;
  border: none;
  padding: 8px 14px;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.close-button:hover {
  background-color: #d5d5d5;
}

/* Tracking information log display label elements code blocks */
.barcode-result {
  width: 100%;
  background-color: #e3f2fd;
  color: #0d47a1;
  padding: 10px;
  border-radius: 8px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 500;
  text-align: center;
}

.scanner-video {
  position: absolute;
  inset: 0;
}

/* Camera layer configuration settings viewport box */
.scanner-container {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background-color: #000000;
  border-radius: 12px;
  overflow: hidden;
}

/*
 * DEEP STYLING MODIFIERS: Hides html5-qrcode's auto-generated gray overlay lines,
 * borders, and empty canvas spaces, leaving only your custom visual styles.
 */
.scanner-container :deep(#qr-reader__scan_region) {
  border: none !important;
  background: transparent !important;
}
.scanner-container :deep(canvas) {
  display: none !important;
}
.scanner-container :deep(video) {
  width: 100% !important;
  height: 100% !important;
  object-fit: contain !important;
}

/* Overlay framework layout styling positioning masks */
.scanner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
}

/* Target box frame selector coordinates mapping masks */
.scanner-target {
  position: relative;
  width: 85%;
  height: 40%;
  box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.6); /* Soft dark vignetting outside the boundary lines */
  border: 2px dashed #ffffff; /* Clean dashed visual guide framing target zone area lines */
  border-radius: 6px;
}

/* Custom linear scanning laser configuration setups */
.scanner-line {
  position: absolute;
  left: 5%;
  width: 90%;
  height: 2px;
  background-color: #ff3b30;
  box-shadow:
    0 0 8px #ff3b30,
    0 0 2px #ff3b30;
  animation: laser-animation 2.5s ease-in-out infinite;
}

/* Error message output configurations block */
.scanner-error {
  width: 100%;
  background-color: #ffebee;
  color: #c62828;
  padding: 10px;
  border-radius: 8px;
  margin-top: 12px;
  font-size: 13px;
  text-align: center;
}

/* Operational guidance text string layout block label properties */
.scanner-instructions {
  margin-top: 16px;
  font-size: 14px;
  color: #666666;
  font-weight: 500;
}

/* Smooth laser sweep animation loop updates matching new variable properties */
@keyframes laser-animation {
  0% {
    top: 15%;
  }
  50% {
    top: 85%;
  }
  100% {
    top: 15%;
  }
}
</style>
