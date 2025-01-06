<template>
  <view
    class="base-skeleton"
    :style="{
      height: height,
      'border-radius': round,
    }"
  ></view>
</template>

<script>
export default {
  props: {
    height: {
      type: String,
      default: '60rpx',
    },
    round: {
      type: String,
      default: '24rpx',
    },
  },
  data() {
    return {};
  },
};
</script>

<style lang="scss" scoped>
.base-skeleton {
  width: 100%;
  animation: skeleton 2s infinite; // 增加动画时间
  background: linear-gradient(
    125deg,
    rgba(210, 210, 210, 0.7),
    rgba(247, 247, 247, 0.7),
    rgba(180, 180, 180, 0.25),
    rgba(180, 180, 180, 0.25)
  );
  background-size: 200%;
}
@keyframes skeleton {
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
