<template>
  <div class="base-loading flex flex-col items-center justify-center">
    <div class="loader relative w-[35px] h-[35px]"></div>
    <div class="loader-text text-[14px] mt-1 text-[#007bff] text-center">加载中...</div>
  </div>
</template>

<script setup></script>

<style lang="scss" scoped>
  .loader:before {
    content: '';
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 3px solid #007bff;
    position: absolute;
    top: 0;
    left: 0;
    animation: pulse 1s ease-in-out infinite;
  }

  .loader:after {
    content: '';
    width: 35px;
    height: 35px;
    border-radius: 50%;
    border: 3px solid transparent;
    border-top-color: #007bff;
    position: absolute;
    top: 0;
    left: 0;
    animation: spin 2s linear infinite;
  }

  @keyframes pulse {
    0% {
      transform: scale(0.6);
      opacity: 1;
    }
    50% {
      transform: scale(1.2);
      opacity: 0;
    }
    100% {
      transform: scale(0.6);
      opacity: 1;
    }
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
