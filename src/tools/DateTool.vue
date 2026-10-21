<script setup>
import { computed, ref } from 'vue'
import { dateToTimestamp, timestampToDate } from '../utils/date'

const mode = ref('date')
const dateInput = ref('')
const timestampInput = ref('')
const unit = ref('seconds')
const error = ref('')
const copied = ref(false)
const resultDate = ref(null)
const timestamp = computed(() => resultDate.value ? resultDate.value.getTime() : null)

function convertDate() {
  try { resultDate.value = dateToTimestamp(dateInput.value); error.value = ''; copied.value = false }
  catch (cause) { resultDate.value = null; error.value = cause.message }
}
function convertTimestamp() {
  try { resultDate.value = timestampToDate(timestampInput.value, unit.value); error.value = ''; copied.value = false }
  catch (cause) { resultDate.value = null; error.value = cause.message }
}
function useNow() {
  const now = new Date()
  dateInput.value = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
  convertDate()
}
async function copy() {
  if (timestamp.value === null) return
  const copyValue = mode.value === 'timestamp' && unit.value === 'milliseconds' ? timestamp.value : Math.floor(timestamp.value / 1000)
  try { await navigator.clipboard.writeText(String(copyValue)); copied.value = true; error.value = '' }
  catch { error.value = '클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.' }
}
function clear() { dateInput.value = ''; timestampInput.value = ''; resultDate.value = null; error.value = ''; copied.value = false }
</script>

<template>
  <section class="tool-workspace" aria-label="Date Converter">
    <div class="tool-tabs" role="tablist" aria-label="변환 방향">
      <button role="tab" :aria-selected="mode === 'date'" :class="{ active: mode === 'date' }" @click="mode = 'date'; error = ''">날짜 → Timestamp</button>
      <button role="tab" :aria-selected="mode === 'timestamp'" :class="{ active: mode === 'timestamp' }" @click="mode = 'timestamp'; error = ''">Timestamp → 날짜</button>
    </div>
    <div v-if="mode === 'date'" class="tool-field"><label for="date-input">날짜와 시간</label><div class="tool-input-row"><input id="date-input" v-model="dateInput" type="datetime-local" /><button class="secondary-button" @click="useNow">현재 시간</button></div><span class="tool-hint">날짜 입력은 이 기기의 로컬 시간대로 해석합니다.</span></div>
    <div v-else class="tool-field"><label for="timestamp-input">Unix Timestamp</label><div class="tool-input-row"><input id="timestamp-input" v-model="timestampInput" inputmode="decimal" placeholder="예: 1735689600" /><select v-model="unit" aria-label="Timestamp 단위"><option value="seconds">초</option><option value="milliseconds">밀리초</option></select></div></div>
    <div class="tool-actions"><button class="primary-button" @click="mode === 'date' ? convertDate() : convertTimestamp()">변환하기</button><button class="text-button" @click="clear">초기화</button></div>
    <p v-if="error" class="tool-error" role="alert">{{ error }}</p>
    <div v-if="resultDate" class="date-result" aria-live="polite">
      <div class="date-result-grid"><div><span>Unix Timestamp (초)</span><code>{{ Math.floor(timestamp / 1000) }}</code></div><div><span>Unix Timestamp (밀리초)</span><code>{{ timestamp }}</code></div><div><span>UTC</span><code>{{ resultDate.toISOString() }}</code></div><div><span>로컬 시간</span><code>{{ resultDate.toLocaleString() }}</code></div></div>
    </div>
    <p v-else class="tool-empty-result">변환 결과가 여기에 표시됩니다.</p>
    <div class="tool-actions tool-actions-end"><span class="tool-hint">결과 날짜는 UTC와 브라우저 로컬 시간대를 함께 표시합니다.</span><button class="secondary-button" :disabled="timestamp === null" @click="copy">{{ copied ? '복사 완료' : 'Timestamp 복사' }}</button></div>
  </section>
</template>
