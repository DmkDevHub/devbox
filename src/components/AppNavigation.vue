<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  items: {
    type: Array,
    required: true,
  },
  mobile: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['navigate'])
</script>

<template>
  <nav :class="mobile ? 'mobile-nav' : 'desktop-nav'" aria-label="주 메뉴">
    <RouterLink
      to="/"
      class="nav-link"
      :class="{ 'nav-link-mobile': mobile }"
      @click="emit('navigate')"
    >
      홈
    </RouterLink>
    <RouterLink
      v-for="item in items"
      :key="item.id"
      :to="`/tools/${item.id}`"
      class="nav-link"
      :class="{ 'nav-link-mobile': mobile }"
      @click="emit('navigate')"
    >
      {{ item.title }}
    </RouterLink>
  </nav>
</template>
