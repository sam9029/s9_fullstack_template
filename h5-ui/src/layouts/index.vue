<template>
  <div class="container">
    <NavHeader />
    <main> <RouterView /> </main>
  </div>
</template>

<script setup>
import NavHeader from "./navHeader.vue";
</script>

<style lang="scss" scoped>
  .container {
    width: 100vw;
    height: 100%;
  }
</style>
