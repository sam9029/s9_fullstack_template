<template>
  <u-popup
    :show="visiable"
    :style="customStyle"
    mode="bottom"
    closeable
    round
    @close="close"
  >
    <view
      class="select-container u-p-l-14 u-p-r-14 u-p-b-14 u-flex-col u-col-center"
    >
      <u-loading-icon class="select-loading" v-if="loading" vertical
        >加载中...</u-loading-icon
      >
      <template v-else>
        <text class="select-title u-font-bold color-text-black u-font-16">{{
          title
        }}</text>
        <view class="select-box">
          <view
            v-for="item in list"
            :key="item.value"
            class="select-item u-border-radius u-flex-row u-col-center"
            :class="{ active: currentSelect == item.value }"
            @click="_handleSelect(item)"
          >
            <image
              style="width: 40rpx; height: 40rpx"
              :src="item.icon"
              class="u-m-r-8"
            />
            <text class="u-font-13 u-font-bold color-text-black u-line-1">{{
              item.label
            }}</text>
          </view>
        </view>
      </template>
    </view>
  </u-popup>
</template>

<script>
import { throttle } from "@/utils/tools.js";
export default {
  props: {
    list: {
      type: Array,
      default: () => [],
    },
    customStyle: {
      type: String,
      default: "height: 30%",
    },
    title: {
      type: String,
      default: "请选择",
    },
    currentSelect: {
      type: Object,
      default: () => {},
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  data() {
    return {
      visiable: false,
    };
  },
  methods: {
    open(data) {
      this.data = data;
      this.visiable = true;
    },

    close() {
      this.visiable = false;
    },

    _handleSelect: throttle(function funct(item) {
      this.$emit("change", item);
    }, 500),
  },
};
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
      // :deep(.u-image__img) {
      //   border-radius: 5px;
      // }
    }
    .active {
      // border: 1px solid var(--u-primary-color);
      // background-color: var(--u-primary-color-2);
      // text {
      //   color: var(--u-primary-color);
      // }
    }
  }
}
</style>
