<template>
  <view class="guide-to-website">
    <u--image :src="`${static_path}wechat_install_guide.png`" width="100%" height="100vh"></u--image>
  </view>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  data() {
    return {
      show: false
    };
  },
  computed: {
    ...mapGetters(['static_path']),
  },
};
</script>

<style>
.guide-to-website {
  position: absolute;
  z-index: 99999;
  width: 100%;
  min-height: 100vh;
  top: 0;
  left: 0;
  overflow: hidden;
}
</style>
