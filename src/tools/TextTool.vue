<script setup>
import { computed, ref } from 'vue'
import { cleanText, getTextStats } from '../utils/text'

const input = ref('')
const output = ref('')
const error = ref('')
const copied = ref(false)
const stats = computed(() => getTextStats(input.value))
function clean(operation) { output.value = cleanText(input.value, operation); error.value = ''; copied.value = false }
async function copy() {
  try { await navigator.clipboard.writeText(output.value); copied.value = true; error.value = '' }
  catch { error.value = '클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.' }
}
function clear() { input.value = ''; output.value = ''; error.value = ''; copied.value = false }
</script>

<template>
  <section class="tool-workspace" aria-label="Text Tools">
    <label class="tool-field"><span>텍스트 입력</span><textarea v-model="input" placeholder="문자 수를 세거나 정리할 텍스트를 입력하세요." /></label>
    <div class="text-stats" aria-live="polite"><div><strong>{{ stats.characters }}</strong><span>문자 수</span></div><div><strong>{{ stats.withoutWhitespace }}</strong><span>공백 제외</span></div><div><strong>{{ stats.words }}</strong><span>단어 수</span></div><div><strong>{{ stats.lines }}</strong><span>줄 수</span></div></div>
    <p class="tool-hint">문자 수는 JavaScript 문자열 길이(UTF-16 코드 단위) 기준입니다.</p>
    <div class="tool-actions"><button class="primary-button" @click="clean('trim')">앞뒤 공백 제거</button><button class="secondary-button" @click="clean('blank')">빈 줄 제거</button><button class="secondary-button" @click="clean('duplicate')">중복 줄 제거</button><button class="text-button" @click="clear">초기화</button></div>
    <p v-if="error" class="tool-error" role="alert">{{ error }}</p>
    <label class="tool-field"><span>정리 결과</span><textarea :value="output" readonly placeholder="텍스트 정리 결과가 여기에 표시됩니다." /></label>
    <div class="tool-actions tool-actions-end"><span class="tool-hint">중복 줄은 대소문자를 구분하며 처음 나온 순서를 유지합니다.</span><button class="secondary-button" :disabled="!output" @click="copy">{{ copied ? '복사 완료' : '결과 복사' }}</button></div>
  </section>
</template>
