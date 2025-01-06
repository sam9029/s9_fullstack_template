<template>
  <view class="promote-popup">
    <u-popup :show="show" mode="bottom" round="24rpx">
      <view class="u-p-28">
        <view class="popup-top u-flex-row u-row-between u-col-center u-m-b-32">
          <text class="u-font-32 u-line-h-48 color-text-black u-font-bold"
            >推广说明</text
          >
          <u-icon
            @click="close"
            :name="`${static_path}close_circle_grey.png`"
            size="24"
          ></u-icon>
        </view>
        <view class="popup-content">
          <view class="u-m-b-24 u-flex-col">
            <text class="color-text-black u-font-28 u-line-h-40 u-font-bold"
              >推广方式:关键词推广</text
            >
            <text class="color-text-less-black u-font-24 u-line-h-40"
            >达人在“抖音、快手、小红书等”媒体平台发布作品推厂知乎上面的任意一本小说，引导用户或粉丝注册知乎APP的推广方式。通过抓取搜索别名的相关数据来统计推广效果，每带来一个用户，即完成一个任务。</text>
          </view>
          <view class="u-m-b-24 u-flex-col">
            <text class="color-text-black u-font-28 u-line-h-40 u-font-bold"
              >结算方式</text
            >
            <text class="color-text-less-black u-font-24 u-line-h-40"
            >按照拉新人数订单结算</text>
          </view>
          <view class="u-flex-col">
            <text class="color-text-black u-font-28 u-line-h-40 u-font-bold"
              >订单更新时间</text
            >
            <text class="color-text-less-black u-font-24 u-line-h-40"
            >1-10个工作日</text>
          </view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      show: false,
      list: [],
    };
  },
  computed: {
    ...mapGetters(['static_path']),
  },
  methods: {
    open() {
      this.show = true;
    },

    close() {
      this.show = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.popup-content {
  border: 2rpx solid #eee;
  border-radius: 16rpx;
  padding: 24rpx;
  height: 716rpx;
}
</style>
