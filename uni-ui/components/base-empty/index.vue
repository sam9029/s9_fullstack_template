<template>
  <view class="empty" :style="customStyle">
    <u--image :src="image ? image.no_data : ''" :width="width" :height="height">
    </u--image>
    <view
      class="u-line-2 u-font-28"
      :class="{
        'text--dark': theme_mode == 'dark',
        'text--light': theme_mode == 'light',
      }"
      >{{ tip }}</view
    >
  </view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    tip: {
      type: String,
      default: "暂无数据",
    },
    width: {
      type: String,
      default: "192rpx",
    },
    height: {
      type: String,
      default: "224rpx",
    },
  },
  data() {
    return {};
  },
  methods: {},
  computed: {
    ...mapGetters(["image", "theme_mode"]),
  },
};
</script>

<style lang='scss' scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.text--dark {
  color: rgba(255, 255, 255, 0.45);
}
.text--light {
  color: #6a6a6a;
}
</style>