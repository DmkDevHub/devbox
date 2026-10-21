<script setup>
import { ref } from 'vue'
import { generateUuid } from '../utils/uuid'

const count = ref(1)
const values = ref([])
const error = ref('')
const copied = ref('')
function generate() {
  const amount = Number(count.value)
  if (!Number.isInteger(amount) || amount < 1 || amount > 100) { error.value = '생성 개수는 1부터 100 사이의 정수여야 합니다.'; values.value = []; return }
  try { values.value = Array.from({ length: amount }, generateUuid); error.value = ''; copied.value = '' }
  catch (cause) { error.value = cause.message; values.value = [] }
}
async function copy(value, id) {
  try { await navigator.clipboard.writeText(value); copied.value = id; error.value = '' }
  catch { error.value = '클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.' }
}
function clear() { count.value = 1; values.value = []; error.value = ''; copied.value = '' }
</script>

<template>
  <section class="tool-workspace" aria-label="UUID Generator">
    <div class="tool-inline-field"><label for="uuid-count">생성 개수</label><input id="uuid-count" v-model="count" type="number" min="1" max="100" /><span class="tool-hint">1–100개</span></div>
    <div class="tool-actions"><button class="primary-button" @click="generate">UUID v4 생성</button><button class="secondary-button" :disabled="!values.length" @click="copy(values.join('\n'), 'all')">{{ copied === 'all' ? '전체 복사 완료' : '전체 복사' }}</button><button class="text-button" @click="clear">초기화</button></div>
    <p v-if="error" class="tool-error" role="alert">{{ error }}</p>
    <div v-if="values.length" class="uuid-list" aria-label="생성된 UUID 목록"><div v-for="(value, index) in values" :key="value" class="uuid-row"><code>{{ value }}</code><button class="secondary-button" @click="copy(value, String(index))">{{ copied === String(index) ? '복사 완료' : '복사' }}</button></div></div>
    <p v-else class="tool-empty-result">생성된 UUID가 여기에 표시됩니다.</p>
  </section>
</template>
