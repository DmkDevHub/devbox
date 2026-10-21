<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import ToolCard from '../components/ToolCard.vue'
import { tools } from '../utils/tools'

const searchText = ref('')
const searchInput = ref(null)
const filteredTools = computed(() => {
  const query = searchText.value.trim().toLocaleLowerCase('ko')
  if (!query) return tools

  return tools.filter((tool) =>
    `${tool.title} ${tool.description} ${tool.category}`.toLocaleLowerCase('ko').includes(query),
  )
})

function handleSearchShortcut(event) {
  const target = event.target
  const isTyping = target instanceof HTMLElement && (
    target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)
  )

  if (event.key === '/' && !isTyping && !event.ctrlKey && !event.metaKey && !event.altKey) {
    event.preventDefault()
    searchInput.value?.focus()
  }
}

onMounted(() => window.addEventListener('keydown', handleSearchShortcut))
onBeforeUnmount(() => window.removeEventListener('keydown', handleSearchShortcut))
</script>

<template>
  <main class="page-shell home-page">
    <section class="hero-panel">
      <div class="hero-copy">
        <div class="eyebrow"><span class="status-dot"></span> 개발자를 위한 작은 도구 상자</div>
        <h1>필요한 도구를<br /><span>한 곳에서, 간단하게.</span></h1>
        <p class="hero-description">
          자주 쓰는 개발 도구와 유용한 북마크를 모았어요.<br class="desktop-break" />
          복잡한 설정 없이 바로 시작해 보세요.
        </p>
        <div class="hero-actions">
          <a class="primary-button" href="#tools">도구 둘러보기 <span aria-hidden="true">↓</span></a>
          <RouterLink class="secondary-button" to="/tools/bookmarks">공개 북마크 <span aria-hidden="true">↗</span></RouterLink>
        </div>
        <div class="privacy-note">
          <span class="privacy-icon" aria-hidden="true">◉</span>
          <span>6개 도구는 브라우저에서 처리돼요. 입력 내용은 서버로 전송되지 않습니다.</span>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">
        <div class="art-orbit orbit-one"></div>
        <div class="art-orbit orbit-two"></div>
        <div class="floating-chip chip-code">{ }</div>
        <div class="floating-chip chip-terminal"><span class="terminal-dot"></span><span class="terminal-dot"></span><span class="terminal-dot"></span><b>&gt;_</b></div>
        <div class="art-core"><span class="core-grid"></span><span class="core-spark">✳</span></div>
        <div class="floating-chip chip-sql">SQL <span>↗</span></div>
        <div class="floating-chip chip-time">12:45:08</div>
        <div class="art-caption"><span></span> READY WHEN YOU ARE</div>
      </div>
      <div class="hero-index"><span>01</span> / TOOLKIT</div>
    </section>

    <section id="tools" class="tools-section" aria-labelledby="tools-heading">
      <div class="section-heading">
        <div>
          <div class="section-kicker">YOUR WORKSPACE</div>
          <h2 id="tools-heading">오늘 필요한 도구</h2>
          <p>가볍게 열고, 필요한 일만 빠르게 끝내세요.</p>
        </div>
        <label class="search-box">
          <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
          <span class="sr-only">도구 검색</span>
          <input ref="searchInput" v-model="searchText" type="search" placeholder="도구 검색" />
          <kbd>/</kbd>
        </label>
      </div>

      <div v-if="filteredTools.length" class="tool-grid">
        <ToolCard v-for="tool in filteredTools" :key="tool.id" :tool="tool" />
      </div>
      <div v-else class="empty-search">
        <span aria-hidden="true">⌕</span>
        <p>“{{ searchText }}”에 맞는 도구가 없어요.</p>
        <button type="button" @click="searchText = ''">검색어 지우기</button>
      </div>
    </section>

    <section class="bottom-note">
      <span class="note-mark" aria-hidden="true">✳</span>
      <div><strong>필요한 순간에 꺼내 쓰는 도구.</strong><span>복잡함은 줄이고, 만드는 일에 집중하세요.</span></div>
      <span class="note-count">7 <small>TOOLS</small></span>
    </section>
  </main>
</template>
