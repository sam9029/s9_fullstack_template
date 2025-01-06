<template>
  <div class="min-h-screen flex justify-center items-center bg-white">
    <van-image width="180px" height="180px" :src="$route.query.type == '401' ? error401 : errorPrimary"></van-image>
  </div>
</template>

<script setup>
import { onMounted } from 'vue';
import error401 from '@/assets/image/error-401.png';
import errorPrimary from '@/assets/image/error-primary.png';

onMounted(() => {
  document.title = '小果繁星'
})
</script>