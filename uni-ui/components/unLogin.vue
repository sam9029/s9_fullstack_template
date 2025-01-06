<template>
  <view class="main u-flex-col u-col-center u-row-center">
    <view class="main-img">
      <u-image
        :src="image.premission"
        :lazyLoad="false"
        width="400rpx"
        height="400rpx"
      ></u-image>
    </view>
    <view class="main-text u-flex-col u-col-center u-font-md u-tips-color">
      <view class="text-item" v-for="(item, index) in data.mes" :key="index">{{
        item
      }}</view>
    </view>
    <view class="main-buttons">
      <u-button
        type="primary"
        shape="circle"
        text="登录/注册"
        @click="toLogin"
      ></u-button>
    </view>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    data: {
      type: Object,
      default: () => {
        return {
          img: "",
          mes: [],
        };
      },
    },
  },
  computed: {
    ...mapGetters(["image", "tabar"]),
  },
  data() {
    return {};
  },
  methods: {
    toLogin() {
      uni.redirectTo({
        url: "/pages/login/login",
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.main {
  margin-top: 120rpx;
}
.main-text {
  width: 400rpx;
  margin: 20rpx 0 100rpx;
  .text-item {
    height: 40rpx;
  }
}
.main-buttons {
  width: 400rpx;
}
</style>
