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
      <BaseLoading class="select-loading" v-if="props.loading" />
      <template v-else>
        <span class="select-title font-bold text-black text-[16px]">{{ props.title }}</span>
        <div class="select-composite">
          <div class="select-box-top rounded">
            <div
              v-for="(item, index) in compositeList"
              :key="item.value"
              class="top-item flex justify-center items-center"
              :class="{
                'top-item--active': currentItem.value == item.value,
              }"
              @click="_handleSelect(item)"
            >
              <van-image width="20px" height="20px" :src="item.icon" class="u-m-r-8" />
              <span class="text-[14px] font-bold line-clamp-1 text-black">{{ item.label }}</span>
            </div>
          </div>
          <div class="select-box-bottom mt-[18px]">
            <div
              v-for="(subItem, subIndex) in props.subList"
              :key="subItem.value"
              class="bottom-item flex  justify-between items-center"
              :class="{
                'bottom-item--active': currentSubItem.value == subItem.value,
              }"
              @click="_handleSubSelect(subItem, 'composite')"
            >
              <div class="flex items-center">
                <van-image width="16px" height="16px" :src="subItem.icon" class="u-m-r-8" />
                <span class="text-[12px] font-bold line-clamp-1 text-black">{{ subItem.label }}</span>
              </div>
              <van-icon
                class="right-icon"
                :class="{
                  'right-icon--active': currentSubItem.value == subItem.value,
                }"
                name="success"
              />
            </div>
          </div>
        </div>
      </template>
    </div>
  </van-popup>
</template>

<script setup>
  import { ref } from 'vue';
  import BaseLoading from '../BaseLoading/baseLoading.vue';
  import _ from 'lodash';
  const emits = defineEmits(['update:show', 'changePl', 'changeAd', 'close']);
  const props = defineProps({
    // list: {
    //   // 平台数组
    //   type: Array,
    //   default: () => [],
    // },
    subList: {
      // 小程序数组
      type: Array,
      default: () => [],
    },
    customStyle: {
      // 自定义样式
      type: String,
      default: 'height: 30%',
    },
    title: {
      type: String,
      default: '请选择',
    },
    loading: {
      type: Boolean,
      default: false,
    },
    mode: {
      type: String,
      default: 'default',
    },
  });

  const visiable = ref(props.visiable);
  const currentItem = ref(null);
  const currentSubItem = ref(props.subList[0]);
  const compositeList = ref([
    {
      value: 1,
      label: '抖音',
      icon: 'https://koc-img.lizhibj.cn/xgfx/app/douyin.png',
    },
    {
      value: 2,
      label: '快手',
      icon: 'https://koc-img.lizhibj.cn/xgfx/app/kuaishou.png',
    },
    {
      value: 4,
      label: '视频号',
      icon: 'https://koc-img.lizhibj.cn/xgfx/app/wechat.png',
    },
  ]);

  /**
   * @description: 选择平台
   * @param {Object} item
   * @return {*}
   */
  const handleSelect = (item) => {
    emits('changePl', item);
  };
  const _handleSelect = _.throttle(handleSelect, 500);

  /**
   * @description: 选择小程序
   * @param {Object} item
   * @return {*}
   */
  const handleSubSelect = (item) => {
    currentSubItem.value = item;
    emits('changeAd', item);
    close();
  };
  const _handleSubSelect = _.throttle(handleSubSelect, 500);

  /**
   * @description: 关闭组件
   * @return {Boolean} flag true -> 响应数据 false -> 取消响应数据
   */
  const close = (flag = true) => {
    emits('close', {
      main: currentItem.value,
      sub: currentSubItem.value,
      flag,
    });
    visiable.value = false;
  };

  /**
   * @description: 打开组件
   * @param {Number} main_id
   * @param {Number} sub_type
   * @return {*}
   */
  const open = (main_id, sub_type) => {
    visiable.value = true;
    currentItem.value = compositeList.value?.find((el) => el.value == main_id) ?? {
      value: null,
      label: '',
      icon: '',
    };
    currentSubItem.value = props.subList?.find((el) => el.value == sub_type) ?? {
      value: null,
      label: '',
      icon: '',
    };
  };

  /**
   * @description: 允许外部设置主选项
   * @param {Number} value
   * @return {*}
   */
  const setMain = (value) => {
    currentItem.value = compositeList.value.find((el) => el.value == value);
  };

  /**
   * @description: 允许外部设置次选项
   * @param {Object} obj { value: Number, label: String, icon: String }
   * @return {*}
   */
  const setSub = (obj) => {
    currentSubItem.value = obj;
  };

  defineExpose({ close, open, setMain, setSub });
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
    .select-composite {
      width: 100%;
      margin-top: 55px;
    }
    .select-box {
      overflow-y: auto;
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
    .select-box-top {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      height: 44px;
      background-color: #eee;
      .top-item--active {
        background-color: #fff;
        border: 1px solid #ddd;
        border-radius: 6px;
      }
    }
    .select-box-bottom {
      display: grid;
      grid-gap: 12px;
      .bottom-item {
        padding: 0 20px;
        background-color: #eee;
        border: 1px solid #eee;
        height: 38px;
        border-radius: 6px;
      }
      .right-icon {
        display: none;
      }
      .bottom-item--active {
        border: 1px solid var(--van-primary-color);
        .right-icon--active {
          display: block;
          color: var(--van-primary-color);
        }
      }
    }
  }
</style>
