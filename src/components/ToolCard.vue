<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  tool: {
    type: Object,
    required: true,
  },
})
</script>

<template>
  <RouterLink :to="`/tools/${tool.id}`" class="tool-card group">
    <div class="tool-card-top">
      <span class="tool-icon" :class="`accent-${tool.accent}`" aria-hidden="true">{{ tool.icon }}</span>
      <span class="card-arrow" aria-hidden="true">↗</span>
    </div>
    <div class="tool-card-copy">
      <span class="tool-category">{{ tool.category }}</span>
      <h3>{{ tool.title }}</h3>
      <p>{{ tool.description }}</p>
    </div>
  </RouterLink>
</template>
