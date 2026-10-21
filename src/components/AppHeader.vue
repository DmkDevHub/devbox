<script setup>
import { ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import AppNavigation from './AppNavigation.vue'

defineProps({
  tools: {
    type: Array,
    required: true,
  },
  isDark: {
    type: Boolean,
    required: true,
  },
})

const emit = defineEmits(['toggle-theme'])
const menuOpen = ref(false)
const route = useRoute()

watch(
  () => route.fullPath,
  () => {
    menuOpen.value = false
  },
)
</script>

<template>
  <header class="site-header">
    <div class="header-inner">
      <RouterLink to="/" class="brand" aria-label="DevBox 홈">
        <span class="brand-mark" aria-hidden="true"><span></span><span></span><span></span><span></span></span>
        <span class="brand-name">dev<span>box</span></span>
      </RouterLink>

      <AppNavigation :items="tools" />

      <div class="header-actions">
        <button
          class="theme-toggle"
          type="button"
          :aria-label="isDark ? '라이트 모드로 전환' : '다크 모드로 전환'"
          :title="isDark ? '라이트 모드' : '다크 모드'"
          @click="emit('toggle-theme')"
        >
          <svg v-if="isDark" viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" />
          </svg>
          <svg v-else viewBox="0 0 24 24" aria-hidden="true">
            <path d="M20.2 15.3A8.5 8.5 0 0 1 8.7 3.8 8.6 8.6 0 1 0 20.2 15.3Z" />
          </svg>
        </button>
        <RouterLink to="/tools/bookmarks" class="header-cta">
          북마크 둘러보기 <span aria-hidden="true">↗</span>
        </RouterLink>
        <button
          class="menu-toggle"
          type="button"
          :aria-expanded="menuOpen"
          aria-controls="mobile-navigation"
          :aria-label="menuOpen ? '메뉴 닫기' : '메뉴 열기'"
          @click="menuOpen = !menuOpen"
        >
          <span></span><span></span>
        </button>
      </div>
    </div>

    <div v-if="menuOpen" id="mobile-navigation" class="mobile-menu">
      <AppNavigation :items="tools" mobile @navigate="menuOpen = false" />
      <RouterLink to="/tools/bookmarks" class="mobile-cta" @click="menuOpen = false">
        북마크 둘러보기 <span aria-hidden="true">↗</span>
      </RouterLink>
    </div>
  </header>
</template>
