<template>
  <div class="home-page min-h-screen relative flex flex-col justify-center items-center">
    <BaseLoading v-show="showLoading" :class="{ 'loading-ani': !showLoading }" />
    <p v-show="!showLoading" class="title text-sm">欢迎来到项目首页🍟</p>
    <p class="text-[16px] text-center mt-2">组件使用请阅读目录下的README.md</p>
    <BottomButton 
      v-show="!showLoading" 
      :data="bottomBtnData" 
      @goLogin="goLogin"
    ></BottomButton>
  </div>
</template>

<script setup>
  import { ref } from 'vue';
  import { sleep } from '@/utils/tools/tools.js';
  import BaseLoading from '@/components/BaseLoading/baseLoading.vue';
  import BottomButton from '@/components/BottomButton/bottomButton.vue';
  import { useRoute, useRouter } from 'vue-router';
  import { getUserInfo } from '@/api/public.js';

  const router = useRouter();
  const route = useRoute();

  const bottomBtnData = ref([
    [
      {
        text: '登录',
        type: 'primary',
        onClick: 'goLogin',
      },
    ],
  ]);

  const showLoading = ref(true);
  const init = async () => {
    await sleep(2000);
    showLoading.value = false;
  };
  init();

  const goLogin = () => {
    router.push({ name: 'Login' });
  };

  const queryUser = () => {
    getUserInfo().then(res => {
      console.log(res)
    }).catch(error => {})
  }
  queryUser()
</script>

<style lang="scss" scoped>
  .home-page {
    animation: bg 3s infinite;
    background: linear-gradient(125deg, #ffffff, #dffdff, #dfefff, #fff1f1);
    background-size: 200%;
  }
  .loading-ani {
    animation: outToTop 1s ease-in-out;
  }
  .title {
    animation: moveFromBottom 1s ease-in-out;
  }
  .bottom-btn-ani {
    animation: moveFromTop 1s ease-in-out;
  }
  @keyframes bg {
    0% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
    100% {
      background-position: 0% 50%;
    }
  }
</style>
