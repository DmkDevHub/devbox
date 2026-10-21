<script setup>
import { onMounted, ref, watch } from 'vue'
import AppHeader from './components/AppHeader.vue'
import { tools } from './utils/tools'

const isDark = ref(false)

onMounted(() => {
  const savedTheme = localStorage.getItem('devbox-theme')
  isDark.value = savedTheme ? savedTheme === 'dark' : window.matchMedia('(prefers-color-scheme: dark)').matches
})

watch(isDark, (value) => {
  document.documentElement.classList.toggle('dark', value)
  document.documentElement.style.colorScheme = value ? 'dark' : 'light'
  localStorage.setItem('devbox-theme', value ? 'dark' : 'light')
})
</script>

<template>
  <div class="app-frame">
    <AppHeader :tools="tools" :is-dark="isDark" @toggle-theme="isDark = !isDark" />
    <RouterView />
    <footer class="site-footer">
      <span class="footer-brand">dev<span>box</span></span>
      <span>필요한 도구를, 필요한 순간에.</span>
      <span class="footer-year">DEVELOPER TOOLBOX · 2026</span>
    </footer>
  </div>
</template>
