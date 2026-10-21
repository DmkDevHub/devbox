<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="page-shell not-found-page">
    <div class="not-found-code">404</div>
    <div class="section-kicker">PAGE NOT FOUND</div>
    <h1>찾으시는 페이지가<br />여기엔 없어요.</h1>
    <p>주소를 다시 확인하거나 홈으로 돌아가 도구를 찾아보세요.</p>
    <RouterLink to="/" class="primary-button">홈으로 돌아가기 <span aria-hidden="true">↗</span></RouterLink>
  </main>
</template>
