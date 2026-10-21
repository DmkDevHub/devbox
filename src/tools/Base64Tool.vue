<script setup>
import { ref } from 'vue'
import { decodeBase64, encodeBase64 } from '../utils/base64'

const input = ref('')
const output = ref('')
const error = ref('')
const copied = ref(false)
function run(direction) {
  try { output.value = direction === 'encode' ? encodeBase64(input.value) : decodeBase64(input.value); error.value = ''; copied.value = false }
  catch (cause) { output.value = ''; error.value = cause.message }
}
async function copy() {
  try { await navigator.clipboard.writeText(output.value); copied.value = true; error.value = '' }
  catch { error.value = '클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.' }
}
function clear() { input.value = ''; output.value = ''; error.value = ''; copied.value = false }
</script>

<template>
  <section class="tool-workspace" aria-label="Base64 Converter">
    <label class="tool-field"><span>텍스트 또는 Base64 입력</span><textarea v-model="input" spellcheck="false" placeholder="한글과 이모지를 포함한 텍스트를 입력하세요." /></label>
    <div class="tool-actions"><button class="primary-button" @click="run('encode')">텍스트 → Base64</button><button class="secondary-button" @click="run('decode')">Base64 → 텍스트</button><button class="text-button" @click="clear">초기화</button></div>
    <p v-if="error" class="tool-error" role="alert">{{ error }}</p>
    <label class="tool-field"><span>결과</span><textarea :value="output" readonly spellcheck="false" placeholder="변환 결과가 여기에 표시됩니다." /></label>
    <div class="tool-actions tool-actions-end"><span class="tool-hint">UTF-8 텍스트만 변환하며 파일은 처리하지 않습니다.</span><button class="secondary-button" :disabled="!output" @click="copy">{{ copied ? '복사 완료' : '결과 복사' }}</button></div>
  </section>
</template>
