<template>
  <view class="cover-guide" @click="show=false" v-if="show">
    <u--image
      :src="`${static_path}wechat_install_guide.png`"
      width="100%"
      height="1624rpx"
      mode="aspectFill"
    ></u--image>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      show: false,
    };
  },
  computed: {
    ...mapGetters(["static_path"]),
  },
  methods: {
    open() {
      this.show = true;
    },
  },
};
</script>
<style lang="scss" scoped>
.cover-guide {
  position: fixed;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  top: 0;
  z-index: 99;
}
</style>
