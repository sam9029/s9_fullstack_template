<template>
  <view class="base-swiper">
    <view
      v-if="showBanner"
      class="swiper-area"
      :class="showNotice ? 'u-m-b-28' : ''"
    >
      <u-swiper
        :list="bannerList"
        @change="changeBanner"
        @click="clickBanner"
        radius="8"
        :loading="loading"
        height="120"
        indicatorStyle="right: 10px"
      >
        <view slot="indicator" class="indicator u-flex-row u-row-center">
          <template v-for="(item, index) in bannerList">
            <view
              class="indicator__dot"
              v-if="item"
              :key="index"
              :class="[index === curBanner && 'indicator__dot--active']"
            />
          </template>
        </view>
      </u-swiper>
    </view>
    <view class="base-notice" v-if="showNotice">
      <u-notice-bar
        bgColor="#ffffff"
        color="#323232"
        :speed="40"
        :text="noticeObj.url"
        mode="link"
        customStyle="border-radius: 16rpx;"
        @click="clickNotice"
        :icon="'https://koc-img.lizhibj.cn/applet/boyao/extension-bell.png'"
      ></u-notice-bar>
    </view>
    <base-toast ref="toastRef"></base-toast>
    <u-popup :show="showVideo" @close="closeVideo" closeable round="8">
      <view class="vidoe-title u-p-l-28 u-p-t-16 u-font-18 u-font-bold"
        >视频</view
      >
      <view class="u-p-l-28 u-p-r-28 u-p-b-28 u-p-t-28">
        <!-- #ifndef APP -->
        <video
          :src="currentVideo"
          :poster="currentVideoPoster"
          object-fit="cover"
          enable-danmu
          danmu-btn
          controls 
          controlslist="nodownload noremoteplayback"
          class="u-border-radius"
          :style="{
            width: '100%',
          }"
        ></video>
        <!-- #endif -->
        <!-- #ifdef APP -->
        <text class="video-area u-border-radius" v-html="videoSource" />
        <!-- #endif -->
      </view>
      <u-safe-bottom></u-safe-bottom>
    </u-popup>
  </view>
</template>

<script>
import { getBanner } from "@/api/public.js";
export default {
  options: {
    styleIsolation: "shared",
  },
  name: "base-swiper",
  props: {
    params: {
      type: Object,
      default: () => {},
    },
    both: {
      type: Boolean,
      default: false,
    },
    type: {
      type: String,
      default: "BANNER",
    },
  },
  data() {
    return {
      bannerList: [],
      currentVideo: "",
      currentVideoPoster: "",
      loading: false,
      showVideo: false,
      noticeObj: {
        banner_id: null,
        type: null,
        url: "",
        content: null,
      },
      curBanner: 0,
    };
  },
  computed: {
    showBanner() {
      if (this.bannerList.length) {
        return this.both || this.type == "BANNER";
      } else {
        return false;
      }
    },
    showNotice() {
      if (this.noticeObj.banner_id) {
        return this.both || this.type == "NOTICE";
      } else {
        return false;
      }
    },
    videoSource() {
      return `<video src="${this.currentVideo}" poster="${this.currentVideoPoster}" object-fit="cover" enable-danmu  danmu-btn controls controlslist="nodownload noremoteplayback" class="video-area"></video>`;
    },
  },
  methods: {
    // 改变banner
    changeBanner(item) {
      this.curBanner = item.current;
    },

    // 点击banner
    clickBanner(index) {
      let currentBanner = this.bannerList[index];
      switch (currentBanner.type) {
        case 1:
          if (
            currentBanner.content == "pages/main/main" ||
            currentBanner.content.includes("pages/main/main?tab=0") ||
            currentBanner.content.includes("pages/homeDetail/index")
          ) {
            uni.switchTab({
              url: `/pages/homeDetail/index`,
              // success: (res) => {
              //   uni.hideTabBar();
              // },
            });
          } else if (
            currentBanner.content.includes("pages/main/main?tab=1") ||
            currentBanner.content.includes("pages/extension/extension")
          ) {
            uni.switchTab({
              url: `/pages/extension/extension`,
              // success: (res) => {
              //   uni.hideTabBar();
              // },
            });
          } else if (
            currentBanner.content.includes("pages/main/main?tab=2") ||
            currentBanner.content.includes("pages/income/income")
          ) {
            uni.switchTab({
              url: `/pages/income/income`,
              // success: (res) => {
              //   uni.hideTabBar();
              // },
            });
          } else if (
            currentBanner.content.includes("pages/main/main?tab=3") ||
            currentBanner.content.includes("pages/mine/mine")
          ) {
            uni.switchTab({
              url: `/pages/mine/mine`,
              // success: (res) => {
              //   uni.hideTabBar();
              // },
            });
          } else {
            uni.navigateTo({
              url: `/${currentBanner.content}`,
            });
          }
          break;
        case 2:
          uni.navigateTo({
            url: `/pages/webView/index?url=${currentBanner.content}`,
          });
          break;
        case 3:
          this.currentVideo = currentBanner.content;
          this.currentVideoPoster = currentBanner.url;
          this.showVideo = true;
          break;
        case 4:
          uni.navigateTo({
            url: `/pages/parse/index?id=${currentBanner.banner_id}&type=DEFAULT`,
          });
          break;
      }
    },

    clickNotice() {
      uni.navigateTo({
        url: `/extension/notice/notice`,
      });
    },

    async queryBanner(params) {
      try {
        this.loading = true;
        const res = await getBanner(params);
        if (res.code === 0) {
          this.bannerList = res.data || [];
          this.$emit("bannerList", res.data || []);
        }
        this.loading = false;
      } catch (error) {
        this.loading = false;
        this.toastMsg(error.message || error, 'error');
      }
    },

    async queryNotice(params) {
      try {
        const res = await getBanner(params);
        if (res.code === 0) {
          this.noticeObj = res.data[0] || {
            banner_id: null,
            type: null,
            url: "",
            content: null,
          };
        }
      } catch (error) {
        this.toastMsg(error.message || error, 'error');
      }
    },

    closeVideo() {
      this.currentVideo = "";
      this.currentVideoPoster = "";
      this.showVideo = false;
    },

    init() {
      if (this.both) {
        if (
          (!this.params.notice || !this.params.banner) &&
          (typeof this.params.notice != "object" ||
            typeof this.params.banner != "object")
        ) {
          throw new Error(
            "both为true时，params中需传入notice对象请求参数以及banner对象请求参数!"
          );
        } else {
          this.queryNotice(this.params.notice);
          this.queryBanner(this.params.banner);
        }
      } else if (this.type == "BANNER") {
        this.queryBanner(this.params);
      } else if (this.type == "NOTICE") {
        this.queryNotice(this.params);
      }
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration
      });
    },
  },
  mounted() {
    this.init();
  },
};
</script>

<style lang="scss" scoped>
.base-swiper {
  .swiper-area {
    box-shadow: 0px 0px 10px 0px rgba(17, 37, 66, 0.06);
  }
  .indicator {
    &__dot {
      height: 6px;
      width: 6px;
      border-radius: 100px;
      background-color: rgba(255, 255, 255, 0.35);
      margin: 0 5px;
      transition: background-color 0.3s;

      &--active {
        background-color: #ffffff;
      }
    }
  }
  .text-editor {
    height: 500rpx;
  }
  .video-area {
    height: 500rpx;
  }
}

::v-deep .u-notice__left-icon {
  .u-icon__img {
    width: 46rpx !important;
    height: 46rpx !important;
  }
}
</style>
