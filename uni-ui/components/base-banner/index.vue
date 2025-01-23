<template>
  <view class="base-banner">
    <swiper v-bind="$attrs" v-on="$listeners" :style="bannerStyle">
      <swiper-item
        v-for="(item, index) in list"
        :key="index"
        @click="handleClick(item)"
      >
        <u--image showLoading :width="bannerStyle.width" :height="bannerStyle.height" :src="item.url"></u--image>
      </swiper-item>
    </swiper>
    <u-popup :show="showVideo" round="8" bgColor="#F6F7FB">
      <view class="u-flex-row u-row-between u-col-center u-p-l-28 u-p-r-28 u-p-t-16">
        <text class="u-font-18 u-font-bold">视频</text>
        <u--image @click="closeVideo" :src="`${static_path}close_circle.png`" width="48rpx" height="48rpx"></u--image>  
      </view>
      <view class="u-p-l-28 u-p-r-28 u-p-b-28 u-p-t-28">
        <!-- #ifndef APP -->
        <video
          :src="currentVideo"
          :poster="currentVideoPoster"
          :autoplay="true"
          object-fit="contain"
          controls
          controlslist="nodownload noremoteplayback"
          class="u-border-radius"
          :style="{
            width: '100%',
            height: '400rpx',
          }"
        ></video>
        <!-- #endif -->
        <!-- #ifdef APP -->
        <text class="u-border-radius" v-html="videoSource" style="height: 400rpx;"/>
        <!-- #endif -->
      </view>
      <u-safe-bottom></u-safe-bottom>
    </u-popup>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    list: {
      type: Array,
      default: () => [],
    },
    bannerStyle: {
      type: Object,
      default: () => {
        return {
          width: "100%",
          height: "440rpx",
        };
      },
    },
  },
  data() {
    return {
      currentVideo: "",
      currentVideoPoster: "",
      showVideo: false,
    };
  },
  computed: {
    ...mapGetters(['static_path']),
    videoSource() {
      return `<video src="${this.currentVideo}" poster="${this.currentVideoPoster}" object-fit="cover"  controls controlslist="nodownload noremoteplayback" class="u-border-radius app-video" style="width: 100%; height: 200px;"></video>`;
    },
  },
  watch: {},
  methods: {
    handleClick(item) {
      switch (item.type) {
        case 1:
          if (
            [
              "pages/novel/novel",
              "pages/demand/demand",
              "pages/income/income",
              "pages/mine/mine",
            ].includes(item.content)
          ) {
            uni.switchTab({
              url: item.content,
            });
          } else {
            uni.navigateTo({
              url: item.content,
            });
          }
          break;
        case 2:
          uni.navigateTo({
            url: `/pages/webView/index?url=${item.content}`,
          });
          break;
        case 3:
          this.currentVideo = item.content;
          this.currentVideoPoster = item.url;
          this.showVideo = true;
          break;
        case 4:
          uni.navigateTo({
            url: `/pages/parse/index?id=${item.banner_id}&type=DEFAULT`,
          });
          break;
      }
    },

    closeVideo() {
      this.showVideo = false;
      this.currentVideo = "";
      this.currentVideoPoster = "";
    },
  },
};
</script>

<style lang="scss" scoped>
</style>
