<template>
  <view v-if="show">
    <u-popup :show="show" mode="bottom">
      <view class="to-desktop-box">
        <view class="close-icon" @click="onClose">
          <u-icon
            name="https://koc-img.lizhibj.cn/applet/duolai/close.png"
            size="56rpx"
          />
        </view>
        <view class="to-desktop-box--top u-flex-row u-row-center u-col-center">
          <image
            src="https://wangsu.lizhibj.cn/open-img/duolai/static/add-to-desktop.png?cdn_host=client2"
            class="to-desktop-img"
            :lazy-load="true"
          ></image>
        </view>
        <view class="to-desktop-box--content">
          <text class="u-font-bold u-font-32">温馨提示</text>
          <view class="u-font-28" style="color: rgba(106, 106, 106, 1)">
            下次可从<text style="color: rgba(42, 42, 42, 1)"
              >「侧边栏-小程序-添加桌面」</text
            >找到我哦～
          </view>
          <u-checkbox-group v-model="checkAddToDeskTop">
            <u-checkbox
              activeColor="#564CFF"
              label="不再提示"
              shape="circle"
              name="noTip"
            ></u-checkbox>
          </u-checkbox-group>
        </view>
        <button
          class="to-desktop-box--bottom u-m-b-48"
          open-type="addShortcut"
          @addshortcut="addshortcut"
        >
          <text class="u-font-28 color-text-white">添加到桌面</text>
        </button>
      </view>
    </u-popup>
  </view>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    pageName: {
      // 页面名称 必传
      type: String,
      default: "",
      required: true,
    },
  },
  components: {},
  watch: {},
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      },
    },
  },
  data() {
    return {
      checkAddToDeskTop: [],
    };
  },
  methods: {
    onClose() {
      if (!this.pageName) throw new Error("pageName is required");
      // 选择“不再提示”执行逻辑
      if (this?.checkAddToDeskTop[0] && this.checkAddToDeskTop[0] == "noTip") {
        uni.setStorageSync(`noNeedAddToDesktip`, 1);
        let currentDate = new Date();
        let key = this.$u.timeFormat(currentDate, "yyyy-mm-dd");
        uni?.removeStorageSync(`${this.pageName}_desktop_tip_${key}`);
      }
      this.show = false;
    },

    addshortcut(e) {
      this.show = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.to-desktop-box {
  display: grid;
  justify-items: center;
  grid-gap: 48rpx;
  position: relative;
  .close-icon {
    position: absolute;
    top: 28rpx;
    right: 28rpx;
  }
  .to-desktop-box--top {
    width: 100%;
    height: 436rpx;
    background-color: rgba(249, 249, 249, 1);
    .to-desktop-img {
      width: 632rpx;
      height: 400rpx;
    }
  }
  .to-desktop-box--content {
    width: 100%;
    display: grid;
    grid-gap: 36rpx;
    justify-items: center;
  }
  .to-desktop-box--bottom {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 460rpx;
    height: 84rpx;
    border-radius: 100px;
    background-color: #564cff;
    text {
      color: #fff;
    }
  }
}
</style>
