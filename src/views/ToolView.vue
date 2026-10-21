<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { tools } from '../utils/tools'
import JsonTool from '../tools/JsonTool.vue'
import SqlTool from '../tools/SqlTool.vue'
import Base64Tool from '../tools/Base64Tool.vue'
import DateTool from '../tools/DateTool.vue'
import UuidTool from '../tools/UuidTool.vue'
import TextTool from '../tools/TextTool.vue'
import BookmarkTool from '../tools/BookmarkTool.vue'

const route = useRoute()
const tool = computed(() => tools.find((item) => item.id === route.params.toolId))
const toolComponents = { json: JsonTool, sql: SqlTool, base64: Base64Tool, date: DateTool, uuid: UuidTool, text: TextTool, bookmarks: BookmarkTool }
const activeTool = computed(() => toolComponents[route.params.toolId])
</script>

<template>
  <main v-if="tool" class="page-shell tool-page">
    <nav class="breadcrumbs" aria-label="이동 경로">
      <RouterLink to="/">홈</RouterLink><span aria-hidden="true">/</span><span>{{ tool.title }}</span>
    </nav>
    <section class="tool-intro-card">
      <span class="tool-icon tool-icon-large" :class="`accent-${tool.accent}`" aria-hidden="true">{{ tool.icon }}</span>
      <span class="tool-category">{{ tool.category }}</span>
      <h1>{{ tool.title }}</h1>
      <p>{{ tool.description }}</p>
    </section>
    <component :is="activeTool" v-if="activeTool" />
    <section v-else class="coming-soon-card" aria-labelledby="coming-soon-title">
      <span class="coming-icon" aria-hidden="true">✳</span>
      <div class="section-kicker">ON THE WORKBENCH</div>
      <h2 id="coming-soon-title">도구를 준비하고 있어요</h2>
      <p>공통 화면 구성을 마쳤습니다. 이 도구의 기능은 다음 개발 단계에서 구현할 예정이에요.</p>
      <RouterLink to="/" class="secondary-button">도구 목록으로 <span aria-hidden="true">←</span></RouterLink>
    </section>
  </main>
  <main v-else class="page-shell not-found-page">
    <div class="not-found-code">404</div>
    <div class="section-kicker">PAGE NOT FOUND</div>
    <h1>찾으시는 페이지가<br />여기엔 없어요.</h1>
    <p>주소를 다시 확인하거나 홈으로 돌아가 도구를 찾아보세요.</p>
    <RouterLink to="/" class="primary-button">홈으로 돌아가기 <span aria-hidden="true">↗</span></RouterLink>
  </main>
</template>
