<template>
  <drag-button-follow :style.sync="style" className="drag-button" class="drag-button" drag follow="right">
    <view class="wrapper u-bg-f">
      <!-- <view class="tip-text" :class="tipClass" @click="">
        <text class="tip-offset u-primary">点击联系在线客服</text>
      </view> -->

      <view class="tip-text" :class="tipClass">
        <u-button
          plain
          type="primary"
          text="有疑问联系客服"
          openType="contact"
          class="custom-style"
          :customStyle="{
            border: 'unset',
            height: 'unset',
            width: '120px',
            flexShrink: 0,
            backgroundColor: 'transparent',
            padding: '0 0 0 0px',
          }"
        ></u-button>
      </view>

      <view @click="toggleStatus" class="icon-wrapper">
        <u-icon name="server-man" color="primary" size="28"></u-icon>
      </view>
    </view>
  </drag-button-follow>
</template>


<script>
export default {
  data() {
    return {
      status: 0, // 0--收起 1--展开
      style: "",
      //
    };
  },
  computed: {
    tipClass() {
      return this.status == 0 ? "tip-hide" : "tip-show";
    },
  },
  methods: {
    toggleStatus() {
      this.status = this.status ^ 1;
    },
    expand() {
      this.status = 1;
    },
    hide() {
      this.status = 0;
    },
  },
};
</script>


<style lang="scss" scoped>
$size: 44px;
$radius: 22px;
.drag-button {
  color: #000000;
  position: fixed;
  right: 10rpx;
  bottom: 188rpx;
  z-index: 2;
}
.wrapper {
  display: flex;
  flex-direction: row;
  border-radius: $radius;
}
.icon-wrapper {
  height: $size;
  width: $size;
  border-radius: $radius;
  // border: 0.5px solid #e4e7ed;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2.5px 5px 0 rgba(0,0,0,0.08);
}
.tip-text {
  display: flex;
  overflow: hidden;
  word-break: keep-all;
  font-size: 14px;
  line-height: $size;
  transition: width 0.5s;
}
.tip-offset {
  padding-left: 11px;
}
.tip-show {
  width: 120px;
}
.tip-hide {
  width: 0;
}
</style>