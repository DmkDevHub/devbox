<script setup>
import { ref } from 'vue'
import { formatSql } from '../utils/sql'

const input = ref('')
const output = ref('')
const dialect = ref('postgresql')
const keywordCase = ref('upper')
const tabWidth = ref(2)
const error = ref('')
const copied = ref(false)
function run() {
  try {
    output.value = formatSql(input.value, { dialect: dialect.value, keywordCase: keywordCase.value, tabWidth: tabWidth.value })
    error.value = ''; copied.value = false
  } catch (cause) { output.value = ''; error.value = cause.message || 'SQL을 정렬하지 못했습니다.' }
}
async function copy() {
  try { await navigator.clipboard.writeText(output.value); copied.value = true; error.value = '' }
  catch { error.value = '클립보드에 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.' }
}
function clear() { input.value = ''; output.value = ''; error.value = ''; copied.value = false }
</script>

<template>
  <section class="tool-workspace" aria-label="SQL Formatter">
    <label class="tool-field"><span>SQL 입력</span><textarea v-model="input" spellcheck="false" placeholder="SELECT id, title FROM bookmarks WHERE category = 'Frontend';" /></label>
    <div class="sql-options"><label>SQL 방언<select v-model="dialect"><option value="postgresql">PostgreSQL</option><option value="oracle">Oracle</option></select></label><label>키워드<select v-model="keywordCase"><option value="upper">대문자</option><option value="lower">소문자</option><option value="preserve">유지</option></select></label><label>들여쓰기<select v-model="tabWidth"><option :value="2">2칸</option><option :value="4">4칸</option></select></label></div>
    <div class="tool-actions"><button class="primary-button" @click="run">SQL 정렬하기</button><button class="text-button" @click="clear">초기화</button></div>
    <p v-if="error" class="tool-error" role="alert">{{ error }}</p>
    <label class="tool-field"><span>정렬 결과</span><textarea :value="output" readonly spellcheck="false" placeholder="정렬 결과가 여기에 표시됩니다." /></label>
    <div class="tool-actions tool-actions-end"><span class="tool-hint">SQL은 브라우저에서 정렬만 하며 실행하거나 전송하지 않습니다.</span><button class="secondary-button" :disabled="!output" @click="copy">{{ copied ? '복사 완료' : '결과 복사' }}</button></div>
    <p class="tool-warning">복잡한 저장 프로시저와 동적 SQL은 지원이 제한될 수 있습니다. 포맷 후 실행 의미를 확인하세요.</p>
  </section>
</template>
