<template>
  <view>
    <view id="top-navber-area" class="top-navber-area">
      <BannerComps :list="bannerList"></BannerComps>
    </view>
    <view class="scroll-area">
      <view class="top-content u-relative">
        <view class="top-content--btns">
          <u--image
            class="btns--item"
            :src="`${static_path}xingtu_btn.png`"
            width="100%"
            height="124rpx"
            @click="btnJump('xingtu')"
          ></u--image>
          <u--image
            class="btns--item"
            :src="`${static_path}juxing_btn.png`"
            width="100%"
            height="124rpx"
            @click="btnJump('juxing')"
          ></u--image>
          <u--image
            class="btns--item"
            :src="`${static_path}xingguang_btn.png`"
            width="100%"
            height="124rpx"
            @click="btnJump('xingguang')"
          ></u--image>
        </view>
        <view
          class="top-content--title u-flex-row u-row-between u-col-bottom u-m-t-48 u-p-b-28"
        >
          <text class="u-font-32 color-text-black">推文APP</text>
          <text class="color-text-less-grey u-font-22 u-line-h-40"
            >关键词推广</text
          >
        </view>
      </view>
      <view class="u-p-l-28 u-p-r-28">
        <view v-if="listLoading" class="skeleton-box">
          <BaseSkeleton height="300rpx" round="16rpx"></BaseSkeleton>
          <BaseSkeleton height="300rpx" round="16rpx"></BaseSkeleton>
          <BaseSkeleton height="300rpx" round="16rpx"></BaseSkeleton>
          <BaseSkeleton height="300rpx" round="16rpx"></BaseSkeleton>
          <BaseSkeleton height="300rpx" round="16rpx"></BaseSkeleton>
          <BaseSkeleton height="300rpx" round="16rpx"></BaseSkeleton>
          <BaseSkeleton height="300rpx" round="16rpx"></BaseSkeleton>
          <BaseSkeleton height="300rpx" round="16rpx"></BaseSkeleton>
          <BaseSkeleton height="300rpx" round="16rpx"></BaseSkeleton>
        </view>
        <view v-if="!listLoading && listData.length" class="novel-list u-row-center">
          <view
            v-for="item in listData"
            :key="item.advertiser_id"
            class="novel-list-item u-border-radius"
            @click="goDetail(item)"
          >
            <view
              class="item-top u-flex-col u-col-center u-gap-16 u-p-t-24 u-p-b-16"
            >
              <u--image
                class="item-icon"
                width="38"
                height="38"
                :src="item.icon"
                radius="16rpx"
              ></u--image>
              <text class="u-font-26 u-line-h-44 color-text-black">{{
                item.advertiser_name
              }}</text>
              <view
                class="settle u-flex-row u-row-center u-col-center u-p-x-16"
              >
                <text class="u-font-20 color-text-less-grey u-line-1">{{ item.settle_methods.join(" ") }}</text>
              </view>
            </view>
            <view
              class="item-bottom u-flex-col u-col-center u-gap-4 u-p-t-6 u-p-b-8"
            >
              <text class="u-font-24 color-text-orange u-line-h-40">{{ unitMoney(item.max_income) }}</text>
              <text class="u-font-20 color-text-orange u-line-h-38"
              >最高收益</text>
            </view>
          </view>
        </view>
        <view v-if="!listLoading && !listData.length" class="u-m-t-100">
          <u-empty :icon="image.no_data_list"></u-empty>
        </view>
        <u-loadmore
          v-if="!listLoading &&listData.length > 0"
          :status="status"
          :loading-text="loadingText"
          :loadmore-text="loadmoreText"
          :nomore-text="nomoreText"
        ></u-loadmore>
      </view>
    </view>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { getNovelAppList } from "@/api/pages/novel.js";
import TabPageJumpGateMixin from "@/mixins/tab_page_jump_gate.js";
import BaseSkeleton from '@/components/base-skeleton/index.vue';
import BannerComps from "@/components/base-banner/index.vue";
import { getBanner } from "@/api/public.js";
import { sleep, unitMoney } from '@/utils/tools.js';
import { mapGetters } from "vuex";
export default {
  options: {
    styleIsolation: "shared",
  },
  components: {
    BannerComps,
    BaseSkeleton
  },
  mixins: [TabPageJumpGateMixin],
  data() {
    return {
      modalVisible: true,

      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",
      listLoading: false,
      page: 1,
      pagesize: 20,
      loading: false,
      site: null,
      isEnd: false,

      listData: [],
      bannerList: [],
    };
  },
  computed: {
    ...mapGetters(['static_path', 'image', "theme_color"]),
  },
  methods: {
    unitMoney,
    init() {
      this.queryBanner();
      this.getListData(true);
    },

    getListData(reset = false) {
      if (this.listLoading) return;
      reset && (this.listLoading = true);
      if (!reset && this.isEnd) return;

      if (reset) {
        this.page = 1;
        this.isEnd = false; // 重置时应该允许加载数据
      } else {
        this.page += 1;
      }

      this.loadmoreText = `努力加载中`;
      this.status = "loading";

      let params = {
        pagesize: this.pagesize,
      };
      params.page = this.page;
      getNovelAppList(params)
        .then((res) => {
          const list = res.data.list;
          if (reset) this.listData = list;
          else this.listData.push(...list);
          this.site = res.data.site;
          let bool = !(res.data.list.length < this.pagesize);
          this.isEnd = !bool;
          if (!bool) {
            this.nomoreText = `没有更多了～`;
            this.status = "nomore";
          } else {
            this.loadmoreText = `下拉加载更多`;
            this.status = "loadmore";
          }
          uni.offNetworkStatusChange(this.handleNetworkChange);
        })
        .catch((err) => {
          let message = String(err.message || err || "项目详情获取失败");
          this.toastMsg(message, "error");
        })
        .finally(async () => {
          uni.stopPullDownRefresh();
          await sleep(300);
          this.listLoading = false;
        });
    },

    goLogin() {
      uni.navigateTo({
        url: "/pages/login/login",
      });
    },

    goDetail(row) {
      if (!this.has_login) {
        return uni.showModal({
          title: "登录失效",
          content: "登录失效，请重新登录",
          showCancel: true,
          cancelText: '取消',
          confirmText: "登录",
          confirmColor: this.theme_color,
          success: (res) => {
            if (res.confirm) {
              this.goLogin();
            }
          },
        });
      } else {
        uni.setStorageSync(
          "SET_JUMP_QUERY",
          JSON.stringify({
            advertiser_id: row.advertiser_id,
            advertiser_name: row.advertiser_name,
            platform_name: row.platform_name,
            platform_icon: row.platform_icon,
            platform_id: row.platform_id,
          })
        );
        uni.navigateTo({
          url: `/novel/detail/index`
        });
      }
    },

    onUp() {
      uni.$u.throttle(this.getListData(), 500);
    },

    onDown() {
      this.init();
    },

    btnJump(type) {
      if(!this.has_login) {
        return uni.showModal({
          title: "登录失效",
          content: "登录已过期，请重新登录！",
          showCancel: true,
          cancelText: '取消',
          confirmText: "登录",
          confirmColor: this.theme_color,
          success: (res) => {
            if (res.confirm) {
              this.goLogin();
            }
          },
        });
      }
      switch (type) {
        case "xingtu":
          uni.navigateTo({
            url: `/novel/xtAndJx?pagetype=1`,
          });
          break;
        case "juxing":
          uni.navigateTo({
            url: `/novel/xtAndJx?pagetype=2`,
          });
          break;
        case "xingguang":
          uni.navigateTo({
            url: `/novel/xingguang`,
          });
          break;
      }
    },

    queryBanner() {
      getBanner({ site: 1, channel_id: 1 })
        .then((res) => {
          if (res.code == 0) {
            this.bannerList = res.data;
          }
        })
        .catch((error) => {
          this.toastMsg(error.message || "获取轮播图失败", "error");
        });
    },

    // 提示
    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration
      });
    },
    handleNetworkChange(res) {
			if (this.listData.length > 0 || this.listLoading || res.networkType === "none") {
        return;
      }

			this.init();
    }
  },
  onPullDownRefresh() {
    this.init();
  },

  onReachBottom(e) {
    uni.$u.throttle(this.getListData(false), 500);
  },

  onLoad() {
    this.init();

    uni.onNetworkStatusChange(this.handleNetworkChange);
  },
  onUnload() {
    uni.offNetworkStatusChange(this.handleNetworkChange);
  }
};
</script>

<style lang="scss" scoped>
.scroll-area {
  position: relative;
  top: -40rpx;
  background-color: #f6f8fb;
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
}
.top-content {
  background-color: #f6f8fb;
  padding: 28rpx 28rpx 0 28rpx;
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
  position: sticky;
  z-index: 22;
  top: 0;

  .top-content--btns {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-gap: 32rpx;
  }
}

.skeleton-box {
  padding: 16rpx;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-gap: 16rpx;
}

.skeleton-box {
  display: grid;
  grid-template-columns: repeat(3, 210rpx);
  grid-gap: 16rpx;
}

.novel-list {
  display: grid;
  grid-template-columns: repeat(3, 210rpx);
  grid-gap: 16rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 16rpx;

  .novel-list-item {
    border: 2rpx solid #eeeeee;

    .item-bottom {
      background: linear-gradient(
        180deg,
        #fff8f3 0%,
        rgba(255, 248, 243, 0) 100%
      );
    }
  }
}
</style>
