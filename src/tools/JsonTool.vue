<script setup>
import { ref } from 'vue'
import { formatJson } from '../utils/json'

const input = ref('')
const output = ref('')
const error = ref('')
const copied = ref(false)

function run(compact = false) {
  try { output.value = formatJson(input.value, compact); error.value = ''; copied.value = false }
  catch (cause) { output.value = ''; error.value = cause.message || 'JSON을 처리하지 못했습니다.' }
}
async function copy() {
  if (!output.value) return
  try { await navigator.clipboard.writeText(output.value); copied.value = true; error.value = '' }
  catch { error.value = '클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.' }
}
function clear() { input.value = ''; output.value = ''; error.value = ''; copied.value = false }
</script>

<template>
  <section class="tool-workspace" aria-label="JSON Formatter">
    <label class="tool-field"><span>JSON 입력</span><textarea v-model="input" spellcheck="false" placeholder='{"name":"DevBox","ready":true}' /></label>
    <div class="tool-actions"><button class="primary-button" @click="run(false)">정렬하기</button><button class="secondary-button" @click="run(true)">압축하기</button><button class="text-button" @click="clear">초기화</button></div>
    <p v-if="error" class="tool-error" role="alert">{{ error }}</p>
    <label class="tool-field"><span>결과</span><textarea :value="output" readonly spellcheck="false" placeholder="처리 결과가 여기에 표시됩니다." /></label>
    <div class="tool-actions tool-actions-end"><span class="tool-hint">JSON.parse 문법 검사 · 들여쓰기 2칸</span><button class="secondary-button" :disabled="!output" @click="copy">{{ copied ? '복사 완료' : '결과 복사' }}</button></div>
  </section>
</template>
