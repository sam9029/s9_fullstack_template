<template>
  <van-config-provider :theme="theme" :theme-vars="themeVars" theme-vars-scope="global">
    <RouterView />
  </van-config-provider>
</template>

<script setup>
import { computed, reactive, onMounted } from 'vue';
import { useAppStoreWithOut } from '@/store/modules/app';
import { useUserStore } from '@/store/modules/user';
import { colorComputed } from '@/utils/tools/tools';
import './utils/globalThisPolyfills.js' // 兼容 globalThis
import '@/assets/animation.scss';
import '@/assets/public.scss';

const appStore = useAppStoreWithOut();
const userStore = useUserStore();
const theme = computed(() => appStore.getThemeMode);
const themeColor = computed(() => appStore.getThemeColor);

const themeVars = reactive({
  primaryColor: themeColor.value,
});

onMounted(async () => {
  
  // 防止ios的safair浏览器点击输入框自动放大
  const meta = document.createElement('meta');
  meta.name = 'viewport';
  meta.content =
    'initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, width=device-width';
  document.head.appendChild(meta);
  // await userStore.FETCH_USERINFO_ASYNC().catch((err) => {
  //   console.log(err);
  // });
  themeVars.primaryColor = themeColor.value;
  const root = document.documentElement;
  root.style.setProperty('--van-primary-color', themeColor.value);
  root.style.setProperty('--van-primary-color-1', colorComputed(themeColor.value, 0.9));
  root.style.setProperty('--van-primary-color-2', colorComputed(themeColor.value, 0.8));
  root.style.setProperty('--van-primary-color-3', colorComputed(themeColor.value, 0.6));
  root.style.setProperty('--van-primary-color-4', colorComputed(themeColor.value, 0.4));
  root.style.setProperty('--van-primary-color-5', colorComputed(themeColor.value, 0.2));
});
</script>

<style scoped>
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
</style>
