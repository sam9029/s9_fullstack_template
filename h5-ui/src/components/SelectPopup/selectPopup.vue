<template>
  <van-popup
    v-model:show="visiable"
    :style="props.customStyle"
    position="bottom"
    closeable
    round
    @close="close"
  >
    <div class="select-container px-[14px] pb-[14px] flex flex-col items-center">
      <van-loading class="select-loading" v-if="props.loading" vertical
      >加载中...</van-loading>
      <template v-else>
        <span class="select-title font-bold text-black text-[16px]">{{ props.title }}</span>
        <div class="select-box">
          <div
            v-for="item in props.list"
            :key="item.value"
            class="select-item rounded flex flex-col items-center"
            :class="{ active: props.currentSelect.value == item.value }"
            @click="_handleSelect(item)"
          >
            <van-image width="20px" height="20px" :src="item.icon" class="u-m-r-8" />
            <span class="text-[13px] font-bold text-black line-clamp-1">{{ item.label }}</span>
          </div>
        </div>
      </template>
    </div>
  </van-popup>
</template>

<script setup>
  import { ref } from 'vue';
  import _ from 'lodash';
  const emits = defineEmits(['update:show', 'change']);
  const props = defineProps({
    list: {
      type: Array,
      default: () => [],
    },
    visiable: {
      type: Boolean,
      default: false,
    },
    customStyle: {
      type: String,
      default: 'height: 30%'
    },
    title: {
      type: String,
      default: '请选择',
    },
    currentSelect: {
      type: Object,
      default: () => {},
    },
    loading: {
      type: Boolean,
      default: false,
    },
  });

  const visiable = ref(props.visiable);

  // 选择渠道
  const handleSelect = (item) => {
    emits('change', item);
  };
  const _handleSelect = _.throttle(handleSelect, 500);

  const close = () => {
    emits('update:show', false);
  };

  defineExpose({ close });
</script>

<style lang="scss" scoped>
  .select-container {
    position: relative;
    height: 100%;
    .select-title {
      position: absolute;
      top: 15px;
      left: 15px;
    }
    .select-loading {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }
    .select-box {
      overflow-y: auto;
      margin-top: 55px;
      display: grid;
      grid-template-columns: repeat(2, 166px);
      grid-gap: 12px;

      .select-item {
        padding: 12px 20px;
        background-color: #eeeeee;
        color: #a3a3a3;
        font-size: 12px;
        border: 1px solid transparent;
        :deep(.van-image__img) {
          border-radius: 5px;
        }
      }
      .active {
        border: 1px solid var(--van-primary-color);
        background-color: var(--van-primary-color-2);
        span {
          color: var(--van-primary-color);
        }
      }
    }
  }
</style>
