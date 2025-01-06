<template>
  <view>
    <u--image
      :src="`${static_path}wechat_install_guide.png`"
			width="100%"
			height="1624rpx"
      mode="aspectFill"
    ></u--image>
  </view>
</template>

<script>
import { mapGetters } from 'vuex';
export default {
  data() {
    return {};
  },
  computed: {
    ...mapGetters(['static_path']),
  },
};
</script>

<style>
</style>
