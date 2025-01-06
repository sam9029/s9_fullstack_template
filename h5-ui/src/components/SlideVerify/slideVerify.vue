<template>
  <div class="slide-verify">
    <div v-if="loading" class="slider-loading">
      <BaseLoading />
    </div>
    <div v-else class="slide-verify">
      <div
        class="img-container"
        :style="{
          width: bgWidth + 'PX',
          height: bgHeight + 'PX',
          'background-image': `url(${verifyData.background})`,
        }"
        ref="imgContainerRef"
      >
        <div
          class="block"
          ref="blockRef"
          :style="{
            'background-image': `url(${verifyData.front})`,
            width: blWidth + 'PX',
            height: bgHeight + 'PX',
          }"
        />
        <van-icon name="replay" @click="_refresh" />
      </div>
      <div class="slider-container mt-1">
        <span class="slider-tips">滑动滑块以完成拼图</span>
        <input
          class="slider-range"
          type="range"
          step="0.5"
          min="0"
          :max="bgWidth"
          v-model="moveX"
          @touchend="_end"
          @mouseup="_end"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
  import { getSlideCode } from '@/api/login';
  import { showNotify } from 'vant';
  import { ref, watch, onMounted } from 'vue';
  import BaseLoading from '../BaseLoading/baseLoading.vue';
  import _ from 'lodash';
  const props = defineProps({
    rate: {
      // 缩放倍率
      type: Number,
      default: 0.5,
    },
  });
  const emits = defineEmits(['diff']);
  const blockRef = ref(null);
  const imgContainerRef = ref(null);

  const rate = ref(props.rate);

  const loading = ref(false);
  const verifyData = ref({
    front: '',
    background: '',
    yield: 0,
  });

  const bgWidth = ref(679); // 背景宽
  const bgHeight = ref(382); // 背景高
  const blWidth = ref(90); // 滑块宽
  const blHeight = ref(90); // 滑块高
  const moveX = ref(0);
  const status = ref(0); // 0 默认 1 成功 2 错误
  const rootFontSize = ref(null);

  watch(moveX, (newVal) => {
    const rato = (bgWidth.value - blWidth.value) / bgWidth.value;
    if (newVal && newVal < bgWidth.value) {
      blockRef.value.style.transform = `translateX(${newVal * rato}PX)`;
    }
  });

  onMounted(() => {
    rootFontSize.value = Number(
      document.querySelector(':root').style.fontSize.replace(/[^0-9]/gi, ''),
    );
  });

  // 获取滑动验证图片
  const getVerifyImgs = async () => {
    loading.value = true;
    try {
      const res = await getSlideCode();
      if (res && res.code === 0) {
        loading.value = false;
        verifyData.value = res.data;
        handleImgsSize(res.data);
      }
    } catch (error) {
      loading.value = false;
      showNotify({
        type: 'danger',
        message: error.message || error || '获取滑动验证图片错误',
      });
    }
  };

  // 计算图片比例
  const handleImgsSize = (data) => {
    bgWidth.value = (data.background.w || 679) * rate.value;
    bgHeight.value = (data.background.h || 382) * rate.value;
    blWidth.value = (data.front.w || 90) * rate.value;
    blHeight.value = (data.front.h || 90) * rate.value;
    setTimeout(() => {
      loading.value = false;
    }, 300);
  };

  const open = () => {
    getVerifyImgs();
  };
  const _open = _.throttle(open, 500);

  // 重置验证
  const refresh = (flag = true) => {
    moveX.value = 0;
    loading.value = false;
    status.value = 0;
    if (flag) getVerifyImgs();
  };
  const _refresh = _.throttle(refresh, 500);

  // 获取验证状态
  const getStatus = (val = 0) => {
    status.value = val;
  };

  const end = () => {
    const rate = (bgWidth.value - blWidth.value) / bgWidth.value;
    loading.value = true;
    emits('diff', Math.floor(Number(moveX.value) * 2 * rate));
  };
  const _end = _.throttle(end, 500);

  defineExpose({ close, getStatus, _refresh, _open });
</script>

<style lang="scss" scoped>
  $blue: #3fa4f4;
  .slide-verify {
    .img-container {
      position: relative;
      background-size: contain;
      background-repeat: no-repeat;
      z-index: 9999;
      .block {
        position: absolute;
        left: 0;
        background-size: cover;
        transform: translateX(0px);
      }
      .van-icon-replay {
        position: absolute;
        right: 10px;
        top: 10px;
        cursor: pointer;
        font-size: 30px;
        color: #ffffff;
      }
    }
  }

  .slider-loading {
    width: 100%;
    height: 236px;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .slider-container {
    height: 45px;
    position: relative;
  }
  .slider-tips {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    font-size: 12px;
    color: var(--van-gray-7);
    z-index: 1;
  }

  .slider-bar {
    position: absolute;
    height: 45px;
    background: var(--van-primary-color);
    left: 0;
    bottom: 50%;
    transform: translateY(50%);
    pointer-events: none;
    z-index: 2;
  }
  .slider-range {
    top: -9px;
    -webkit-appearance: none;
    position: relative;
    appearance: none;
    width: 339.5px;
    vertical-align: bottom;
    margin: 0;
    height: 45px;
    cursor: pointer;
    transition: all ease-in 0.25s;
    border: 0;
    &::-webkit-slider-thumb {
      -webkit-appearance: none;
      appearance: none;
      border-radius: 0;
      border: 0;
      position: relative;
      bottom: 0px;
      width: 45px;
      height: 45px;
      background-image: url('@/assets/image/slider.png');
      background-size: 100%;
      transition: all 0.3s ease-in-out;
      z-index: 3;
    }
    &::-moz-range-thumb {
      -moz-appearance: none;
      appearance: none;
      border-radius: 0;
      border: 0;
      position: relative;
      bottom: 0px;
      width: 45px;
      height: 45px;
      background-image: url('@/assets/image/slider.png');
      background-size: 100%;
      transition: all 0.3s ease-in-out;
      z-index: 3;
    }
    &::-webkit-slider-runnable-track {
      -webkit-appearance: none;
      appearance: none;
      height: 45px;
      background: #e5e5e5;
    }
    &::-moz-range-track {
      -webkit-appearance: none;
      appearance: none;
      height: 45px;
      background: #e5e5e5;
    }
  }
</style>
