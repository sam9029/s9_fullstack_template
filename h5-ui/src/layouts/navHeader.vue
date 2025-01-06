<template>
  <header class="absolute w-full top-0 z-[99] h-[50px] bg-white">
    <div class="header-btn m-[14px] flex justify-between items-center">
      <label class="burger relative w-[20px] h-[15px] bg-transparent cursor-pointer block" for="burger">
        <input type="checkbox" id="burger" v-model="showNavList" />
        <span></span>
        <span></span>
        <span></span>
      </label>
      <span class="text-[16px]">{{ route.meta.name }}</span>
    </div>
    <div
      v-show="showNavList"
      class="header-list relative top-[-4px] p-[14px] w-full h-[120px] bg-white rounded-b-md shadow-md grid"
    >
      <p
        class="text-[18px]"
        :class="{ 'text-blue-500': route.name == 'Home' }"
        @click="jump('Home')"
        >首页</p
      >
      <p
        class="text-[18px]"
        :class="{ 'text-blue-500': route.name == 'Login' }"
        @click="jump('Login')"
        >登录</p
      >
    </div>
  </header>
</template>

<script setup>
  import { ref } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  const router = useRouter();
  const route = useRoute();
  const showNavList = ref(false);
  
  const jump = (name = '') => {
    router.push({ name });
    showNavList.value = false;
  };
</script>

<style lang="scss" scoped>
  header {
    .header-list {
      animation: fromTop 0.3s ease-in-out;
    }

    .burger input {
      display: none;
    }

    .burger span {
      display: block;
      position: absolute;
      height: 2px;
      width: 100%;
      background: black;
      border-radius: 9px;
      opacity: 1;
      left: 0;
      transform: rotate(0deg);
      transition: 0.25s ease-in-out;
    }

    .burger span:nth-of-type(1) {
      top: 0px;
      transform-origin: left center;
    }

    .burger span:nth-of-type(2) {
      top: 50%;
      transform: translateY(-50%);
      transform-origin: left center;
    }

    .burger span:nth-of-type(3) {
      top: 100%;
      transform-origin: left center;
      transform: translateY(-100%);
    }

    .burger input:checked ~ span:nth-of-type(1) {
      transform: rotate(45deg);
      top: 0px;
      left: 2.5px;
    }

    .burger input:checked ~ span:nth-of-type(2) {
      width: 0%;
      opacity: 0;
    }

    .burger input:checked ~ span:nth-of-type(3) {
      transform: rotate(-45deg);
      top: 14px;
      left: 2.5px;
    }
  }
  @keyframes fromTop {
    0% {
      opacity: 0;
      top: -50px;
    }

    100% {
      opacity: 1;
      top: -4px;
    }
  }
</style>
