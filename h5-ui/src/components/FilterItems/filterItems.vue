<template>
  <van-popup v-model:show="filterItemsShow" position="bottom" closeable round @close="close">
    <div class="px-[20px] pb-[40px]">
      <span class="title font-bold text-black text-[16px]">{{ title }}</span>
      <div style="overflow-y: auto">
        <!-- First Filter Group -->
        <div class="mt-[40px]">
          <span class="text-[14px] text-black">{{ firstGroupTitle }}</span>
          <div class="tag-box">
            <div
              v-for="item in firstGroupItems"
              :key="item.value"
              class="tag-item flex justify-center items-center rounded"
              :class="{ active: model.firstGroup === item.value }"
              @click="handleTag('firstGroup', item)"
            >
              <span class="line-clamp-1">{{ item.name }}</span>
            </div>
          </div>
        </div>

        <!-- Second Filter Group -->
        <div>
          <span class="text-[14px] text-black">{{ secondGroupTitle }}</span>
          <div class="tag-box">
            <div
              v-for="item in secondGroupItems"
              :key="item.id"
              class="tag-item flex justify-center items-center rounded"
              :class="{ active: model.secondGroup.includes(item.value) }"
              @click="handleTag('secondGroup', item)"
            >
              <span class="line-clamp-1">{{ item.label }}</span>
            </div>
          </div>
        </div>

        <!-- Third Filter Group -->
        <div>
          <span class="text-[14px] text-black">{{ thirdGroupTitle }}</span>
          <div class="tag-box" style="grid-template-columns: repeat(auto-fit, 62px)">
            <div
              v-for="item in thirdGroupItems"
              :key="item.id"
              style="width: 62px"
              class="tag-item flex justify-center items-center rounded"
              :class="{ active: model.thirdGroup.includes(item.id) }"
              @click="handleTag('thirdGroup', item)"
            >
              <span class="line-clamp-1">{{ item.name }}</span>
            </div>
          </div>
        </div>
      </div>
      <div class="bottom-btn flex u-row-around items-center mt-[30px]">
        <span class="text-[16px] text-gray-400 mr-[50px]" @click="reset">重置</span>
        <span class="text-[16px]" @click="_submit" style="color: var(--van-primary-color)">确定</span>
      </div>
    </div>
  </van-popup>
</template>

<script setup>
  import { ref } from 'vue';
  import _ from 'lodash';

  const emits = defineEmits(['update:show', 'data']);
  const props = defineProps({
    filterItemsShow: {
      type: Boolean,
      default: false,
    },
    // 配置项
    title: {
      type: String,
      default: '筛选',
    },
    firstGroupTitle: {
      type: String,
      default: '分组一',
    },
    secondGroupTitle: {
      type: String,
      default: '分组二',
    },
    thirdGroupTitle: {
      type: String,
      default: '分组三',
    },
    // 数据源
    firstGroupItems: {
      type: Array,
      default: () => [],
    },
    secondGroupItems: {
      type: Array,
      default: () => [],
    },
    thirdGroupItems: {
      type: Array,
      default: () => [],
    },
  });

  const filterItemsShow = ref(props.filterItemsShow);
  const model = ref({
    firstGroup: null,
    secondGroup: [],
    thirdGroup: [],
  });

  const secondGroupSet = new Set();
  const thirdGroupSet = new Set();

  // 点击标签
  const handleTag = (type, data) => {
    switch (type) {
      case 'firstGroup':
        model.value.firstGroup = data.value;
        break;
      case 'secondGroup':
        if (secondGroupSet.has(data.value)) {
          secondGroupSet.delete(data.value);
        } else {
          secondGroupSet.add(data.value);
        }
        model.value.secondGroup = secondGroupSet.size !== 0 ? [...secondGroupSet] : [];
        break;
      case 'thirdGroup':
        if (thirdGroupSet.has(data.id)) {
          thirdGroupSet.delete(data.id);
        } else {
          thirdGroupSet.add(data.id);
        }
        model.value.thirdGroup = thirdGroupSet.size !== 0 ? [...thirdGroupSet] : [];
        break;
    }
  };

  const reset = () => {
    model.value.firstGroup = null;
    model.value.secondGroup = [];
    model.value.thirdGroup = [];
    secondGroupSet.clear();
    thirdGroupSet.clear();
  };

  const close = () => {
    emits('update:show', false);
  };

  const submit = () => {
    emits('data', model.value);
    close();
  };

  const _submit = _.throttle(submit, 500);

  defineExpose({ reset });
</script>

<style lang="scss" scoped>
  .van-popup {
    position: relative;
    .title {
      position: absolute;
      top: 15px;
      left: 50%;
      transform: translateX(-50%);
    }
  }
  .tag-box {
    display: grid;
    grid-template-columns: repeat(auto-fit, 80px);
    grid-gap: 10px;
    .tag-item {
      height: 27px;
      background-color: #eeeeee;
      color: #a3a3a3;
      font-size: 12px;
      border: 1px solid transparent;
    }
    .active {
      border: 1px solid var(--van-primary-color);
      background: rgba(101, 27, 255, 0.04);
      color: var(--van-primary-color);
    }
  }
</style>
