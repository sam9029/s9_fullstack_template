<template>
  <view class="u-relative my-navbar" :style="{ background: bgColor }">
    <!-- #ifdef MP -->
    <view
      class="mp-grid u-p-l-20 u-p-r-20 u-flex u-col-top"
      :class="{
        'u-row-between': isButton,
        'is-fixed': isFixed,
        'u-absolute': !isFixed,
        navbar: bgShow,
        'navbar-bg-show': !bgShow,
      }"
      :style="{
        paddingTop: menuButtonInfo.top + 'px',
        paddingBottom: 10 + 'px',
      }"
    >
      <template v-if="!isButton">
        <view
          class="custom-area"
          :style="{
            minHeight: !isButton ? menuButtonInfo.height + 'px' : '',
            width: '100%',
          }"
        >
          <u-icon
            v-if="backShow"
            :name="leftIcon || 'arrow-left'"
            :size="buttonData.backSize || 24"
            color="#1a1a1a"
            @click="goBack"
          ></u-icon>
          <slot name="navbarData"> </slot>
        </view>
      </template>
      <template v-else>
        <view
          class="u-flex"
          :style="{
            minHeight: menuButtonInfo.height + 'px',
            width: '100%',
          }"
        >
          <u-icon
            v-if="backShow"
            :name="leftIcon || 'arrow-left'"
            :size="buttonData.backSize || 24"
            color="#1a1a1a"
            @click="goBack"
          ></u-icon>
          <slot name="navbarData"> </slot>
        </view>
        <view
          v-if="buttonShow"
          class="video-teaching u-absolute"
          :style="{
            height: menuButtonInfo.height + 'px',
            right: menuButtonInfo.width + 20 + 'px',
          }"
        >
          <u-button
            @click="mpRightClick"
            class="u-font-bold"
            :text="buttonData.buttonText"
            :iconColor="buttonData.buttonIconColor"
            shape="circle"
            size="small"
            :icon="buttonData.buttonIcon"
            :disabled="buttonData.buttonDisabled"
          ></u-button>
        </view>
      </template>
    </view>
    <view
      class="u-p-20"
      :style="{
        height: menuButtonInfo.height + menuButtonInfo.top + 10 + 'px',
      }"
    ></view>
    <!-- #endif -->
    <!-- #ifndef MP -->
    <view
      class="app-grid u-p-b-u-flex u-col-top"
      :class="{
        'u-row-between': isButton,
        'is-fixed': isFixed,
        'u-absolute': !isFixed,
        navbar: bgShow,
        'navbar-bg-show': !bgShow,
      }"
      :style="{
        background: bgColor,
        height: '100rpx',
        'grid-template-columns': appGridType,
      }"
    >
      <view v-if="backShow" class="grid--left">
        <u-icon
          :name="leftIcon || 'arrow-left'"
          :size="buttonData.backSize || 24"
          color="#1a1a1a"
          @click="goBack"
        ></u-icon>
      </view>
      <view class="grid--center">
        <slot name="navbarData"> </slot>
      </view>
      <view v-if="closeShow" class="grid--right">
        <u-icon
          :name="rightIcon"
          :size="buttonData.closeSize || 24"
          color="#1a1a1a"
          @click="goBack"
        ></u-icon>
      </view>
      <view v-if="rightBtn" class="grid--right" @click="rightClick">
        <template v-if="rightCustom">
          <slot name="rightBtn"></slot>
        </template> 
        <view class="grid--right--default" v-else>
          <u-icon :name="rightIcon" size="28rpx"></u-icon>
          <text class="u-font-24 u-line-h-40 u-nowrap u-m-l-8">{{ rightBtnText }}</text>
        </view class="grid--right--default">
      </view>
    </view>
    <view
      class="u-p-20"
      :style="{
        height: 100 + 'rpx',
      }"
    ></view>
    <!-- #endif -->
  </view>
</template>

<script>
import { extensionLeftIcon } from "@/static/icon.js";
export default {
  options: {
    styleIsolation: "shared",
  },
  name: "my-navbar",
  props: {
    // 是否有背景 false 无背景：true：带默认背景
    bgShow: {
      type: Boolean,
      default: false,
    },
    // 是否按钮模式
    isButton: {
      type: Boolean,
      default: false,
    },
    // 是否展示回退按钮
    backShow: {
      type: Boolean,
      default: true,
    },
    backDelta: {
      type: Number,
      default: 1, 
    },
    // 是否展示关闭按钮
    closeShow: {
      type: Boolean,
      default: false,
    },
    rightBtn: {
      type: Boolean,
      default: false,
    },
    // 按钮模式下 是否展示右侧按钮
    buttonShow: {
      type: Boolean,
      default: true,
    },
    buttonData: {
      type: Object,
      default: () => {
        return {};
      },
      // {
      // 	backIcon : extensionLeftIcon,
      // buttonText : '视频教学',
      // buttonIcon : extensionVideoBgIcon,
      // buttonDisabled: true,
      // }
    },
    isFixed: {
      type: Boolean,
      default: true,
    },
    leftIcon: {
      type: String,
      default: "arrow-left",
    },
    rightIcon: {
      type: String,
      default: "",
    },
    rightBtnText: {
      type: String,
      default: "按钮",
    },
    routerMode: {
      type: String,
      default: "back",
    },
    targetUrl: {
      type: String,
      default: "",
    },
    rightCustom: {
      type: Boolean,
      default: false,
    },
    rightClick: {
      type: Function,
      default: () => {},
    },
    bgColor: {
      type: String,
      default: "#F6F7FB"
    }
  },
  data() {
    return {
      extensionLeftIcon,
      menuButtonInfo: {
        height: "0px",
        top: "0px",
      },
    };
  },
  computed: {
    appGridType() {
      if (this.backShow) {
        if (this.rightBtn) {
          return "68rpx 1fr 200rpx";
        }
        return "68rpx 1fr 68rpx";
      } else if(!this.closeShow && !this.rightBtn) {
        return "1fr";
      } else {
        return "1fr 68rpx";
      }
    },
  },
  methods: {
    // 返回上一页
    goBack() {
      switch (this.routerMode) {
        case "back":
          uni.navigateBack({
            delta: this.backDelta,
          });
          break;
        case "redirect":
          if (!this.targetUrl) {
            throw new Error("请设置targetUrl属性");
          } else {
            uni.redirectTo({
              url: this.targetUrl,
            });
          }
          break;
        case "switch":
          if (!this.targetUrl) {
            throw new Error("请设置targetUrl属性");
          } else {
            uni.switchTab({
              url: this.targetUrl,
            });
          }
          break;
      }
    },
    mpRightClick() {
      this.$emit("rightClick");
    },
  },
  created() {
    // #ifdef MP
    let menuButtonInfo = uni.getMenuButtonBoundingClientRect();
    this.menuButtonInfo = menuButtonInfo;
    // #endif
  },
};
</script>

<style lang="scss" scoped>
.is-fixed {
  position: fixed;
  /* #ifdef H5 */
  top: 0;
  /* #endif */
  /* #ifndef H5 */
  top: 88rpx;
  /* #endif */
}
::v-deep .navbar-bg-show {
  width: 100%;
  z-index: 999;

  // #ifdef MP
  .u-button--circle {
    height: 100% !important;
    border: 1px solid #f0f0f0 !important;
  }
  // #endif
}
::v-deep .navbar {
  width: 100%;
  background: url("https://koc-img.lizhibj.cn/applet/boyao/home_navbar_bg_tow.png");
  background-size: 100%;
  background-repeat: no-repeat;
  background-color: #ffffff00;
  backdrop-filter: saturate(50%) blur(4px);
  z-index: 999;

  // #ifdef MP
  .u-button--circle {
    height: 100% !important;
    border: 1px solid #f0f0f0 !important;
  }
  // #endif
}
.app-grid,
.mp-grid {
  display: grid;
  align-items: center;
  .grid--left {
    position: relative;
    left: 28rpx;
  }
  .grid--right {
    &--default {
      display: flex;
      justify-content: center;
      align-items: center;
      width: 172rpx;
      height: 56rpx;
      padding: 8rpx 20rpx;
      border-radius: 100px;
      background: #fff;
      color: #3c3c3c;
    }
  }
}
</style>
