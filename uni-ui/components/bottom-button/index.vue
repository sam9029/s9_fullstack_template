<template>
  <view
    id="koc-main-bottom"
    :class="classList"
    v-if="list[buttonIndex]"
    class="bottom"
    :style="{ 'background-color': bgColor }"
  >
    <slot name="text"></slot>
    <view class="btl">
      <template v-for="(item, index) in list[buttonIndex]">
        <view :key="index" class="btn u-flex-row u-col-center u-row-center" v-if="item.show">
          <u-button
            v-if="item.btnType == 'button'"
            :disabled="item.disabled || false"
            :hairline="item.hairline || true"
            :loading="item.loading || false"
            :loadingText="item.loading_text || ''"
            :plain="item.plain || false"
            :shape="item.shape || 'circle'"
            :size="item.size || 'normal'"
            :text="item.text || ''"
            :type="item.type || 'info'"
            :openType="item.open_type || ''"
            :icon="item.icon || ''"
            :color="item.color || ''"
            :customStyle="item.customStyle || ''"
            @click="handle(item)"
            @getphonenumber="getphonenumber"
          >
            <slot name="customButtonContent"></slot>
          </u-button>
          <view
            v-else-if="item.btnType == 'icon'"
            class="icon-btn u-flex-col u-col-center u-gap-8"
            :class="{ disabled: item.disabled }"
            @click="handle(item)"
          >
            <u-icon :name="item.name" :color="item.color" size="24"></u-icon>
            <text class="color-text-black u-font-20">{{ item.text }}</text>
          </view>
          <text
            v-else-if="item.btnType == 'text'"
            class="u-font-28"
            :style="{
              color: item.color,
              fontWeight: item.fontWeight,
            }"
            >{{ item.text }}</text
          >
        </view>
      </template>
    </view>
    <view id="koc-safe-bottom">
      <u-safe-bottom></u-safe-bottom>
    </view>
  </view>
</template>

<script>
/**
 * url 传入的跳转地址
 * onClick 点击按钮回调事件
 * auth 权限 字符串
 */
export default {
  options: { styleIsolation: "shared" },
  props: {
    data: {
      type: [Array, Object],
      default: () => [],
    },
    fixed: {
      type: Boolean,
      default: true,
    },
    buttonIndex: {
      type: Number,
      default: 0,
    },
    bgColor: {
      type: String,
      default: '#fff'
    }
  },
  data() {
    return {
      paddingBottom: 1,
    };
  },
  onLoad() {},
  mounted() {
    this.$u.getRect("#koc-safe-bottom").then((res) => {
      this.paddingBottom = res?.height;
      this.$nextTick(() => {
        this.emitHeight();
      });
    });
    this.emitHeight();
  },
  computed: {
    classList() {
      const classList = ["bottom"];
      if (this.paddingBottom <= 5) classList.push("u-p-b-24");
      if (this.fixed) classList.push("fixed");
      return classList;
    },
    list() {
      if (this.data.length == 0 || Object.keys(this.data).length === 0) {
        return [];
      }
      // 深拷贝数据
      let arr = JSON.parse(JSON.stringify(this.data));
      // 处理二维数组的情况
      arr = arr.map((buttonGroup) => {
        // 如果不是数组，直接返回空数组避免报错
        if (!Array.isArray(buttonGroup)) return [];

        return buttonGroup.map((item) => {
          item.show = true;
          if (uni.$u.test.isEmpty(item)) item.show = false;

          if (item.auth) {
            item.show = this.$checkAuthority([item.auth]);
          }
          return item;
        });
      });
      return arr;
    },
  },
  methods: {
    emitHeight() {
      this.$u.getRect("#koc-main-bottom").then((res) => {
        this.$emit("height", res?.height); //单位px
      });
    },
    getphonenumber(val) {
      this.$emit("getphonenumber", val);
    },
    handle(item) {
      if (item.url) {
        uni.navigateTo({
          url: item.url,
        });
      } else if (item.onClick) {
        this.$emit(item.onClick, item);
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.fixed {
  position: fixed;
}
.bottom {
  z-index: 999;
  display: flex;
  bottom: 0px;
  width: 100%;
  padding: 24rpx 0 0 0;
  flex-direction: column;
  .btl {
    display: grid;
    grid-auto-flow: column;
    grid-gap: 28rpx;
    padding: 0 28rpx;
    .btn {
      ::v-deep .u-button--plain {
        color: $u-primary;
        border-color: $u-primary;
      }
    }
  }
}
.disabled {
  opacity: 0.5;
  pointer-events: none;
  cursor: not-allowed;
}
::v-deep .u-button {
  height: 108rpx !important;
  border-radius: 16rpx !important;
  .u-button__text {
    font-size: 32rpx !important;
    font-weight: 500 !important;
  }
}
::v-deep .u-button--hairline {
  border-width: 2rpx !important;
}
</style>
