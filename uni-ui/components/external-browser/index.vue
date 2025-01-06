<template>
  <view>
    <view>
      <slot></slot>
    </view>
    <view class="u-vh-100 fix-tip" v-if="show"  @click="close">
      <image style="width: 100%; height: 100%;" :src="src"></image>
    </view>
  </view>
</template>

<script>
export default {
  props: ["show"],
  data() {
    return {
      src: "https://koc-img.lizhibj.cn/applet/wx_browser.png",
    };
  },
  methods: {
    close() {
      this.$emit('update:show', false)
    },
  },
};
</script>

<style lang="scss" scoped>
.fix-tip {
  width: 100%;
  position: fixed;
  background-color: rgba(0,0,0,0.55);
  top: 0;
  left: 0;
  z-index: 999;
}
</style>