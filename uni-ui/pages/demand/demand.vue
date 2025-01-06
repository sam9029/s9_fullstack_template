<template>
  <view class="u-relative">
    <view id="top-navber-area" class="top-navber-area">
      <BannerComps :list="bannerList"></BannerComps>
    </view>
    <view class="scroll-area">
      <view class="top-content">
        <u--image
          class="top-content--bg"
          width="100%"
          height="132rpx"
          :src="`${static_path}demand_top.png`"
          @click="goStack"
        ></u--image>
        <view
          class="top-content--title u-flex-row u-row-between u-col-bottom u-m-t-48 u-p-b-28"
        >
          <text class="u-font-32 color-text-black u-line-h-48">看点小程序</text>
          <text class="color-text-less-grey u-font-22 u-line-h-40"
            >高收益·热门小程序</text
          >
        </view>
      </view>
      <view v-if="listData.length" class="demand-list u-flex-col">
        <view
          v-for="(item, index) in listData"
          :key="item.advertiser_id"
          class="demand-list-item u-flex-row u-row-between u-col-center u-p-24 u-bg-f u-border-radius"
          :class="{ 'u-m-b-16': index !== listData.length - 1 }"
          @click="goDetail(item)"
        >
          <view class="item-left u-flex-row u-col-center">
            <u--image
              class="item-icon u-m-r-24"
              width="100rpx"
              height="100rpx"
              :src="item.icon"
            ></u--image>
            <view class="item-info u-flex-col u-row-between">
              <text class="u-font-28 u-line-h-44 color-text-black">
                {{ item.advertiser_name }}
              </text>
              <view class="u-flex-row u-col-center">
                <view
                  v-if="item.settle_methods"
                  class="item-tag u-tag-default u-m-r-8"
                  >{{ item.settle_methods[0] }}</view
                >
                <text class="color-text-less-grey u-font-22 u-line-h-40">{{
                  `最新结算日 ${item.new_income_date}`
                }}</text>
              </view>
            </view>
          </view>
          <u--image
            class="item-right"
            width="32rpx"
            height="32rpx"
            :src="`${static_path}jump_icon.png`"
          ></u--image>
        </view>
      </view>
      <view v-if="!listLoading && !listData.length" class="u-m-t-100">
        <u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
      </view>
      <u-loadmore
        v-if="!listLoading && listData.length > 0"
        :status="status"
        :loading-text="loadingText"
        :loadmore-text="loadmoreText"
        :nomore-text="nomoreText"
      ></u-loadmore>
    </view>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { getPreAppletList } from "@/api/pages/demand.js";
import TabPageJumpGateMixin from "@/mixins/tab_page_jump_gate.js";
import BannerComps from "@/components/base-banner/index.vue";
import { getBanner } from "@/api/public.js";
import { sleep } from "@/utils/tools.js";
import { mapGetters } from "vuex";
export default {
  options: {
    styleIsolation: "shared",
  },
  components: {
    BannerComps,
  },
  mixins: [TabPageJumpGateMixin],
  data() {
    return {
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",
      page: 1,
      pagesize: 20,
      site: null,
      listLoading: false,
      isEnd: false,

      listData: [],

      bannerList: [],
    };
  },
  computed: {
    ...mapGetters(["static_path", "image", "theme_color"]),
  },
  methods: {
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
      this.toastMsg("加载中", "loading", -1);
      getPreAppletList(params)
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
        })
        .catch((err) => {
          let message = String(err.message || err || "项目详情获取失败");
          this.toastMsg(message, "error");
        })
        .finally(async () => {
          this.$refs.toastRef?.close();
          uni.stopPullDownRefresh();
          await sleep(300);
          this.listLoading = false;
        });
    },

    async computedHeight() {
      const topRect = await this.$u.getRect(`#top-navber-area`);
      this.navbar_height = topRect.height;
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
          cancelText: "取消",
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
            platform_name: row.platform_name,
            platform_icon: row.platform_icon,
            platform_id: row.platform_id,
          })
        );
        uni.navigateTo({
          url: `/demand/index?id=${row.advertiser_id}`,
        });
      }
    },

    goStack() {
      if (!this.has_login) {
        return uni.showModal({
          title: "登录失效",
          content: "登录已过期，请重新登录！",
          showCancel: true,
          cancelText: "取消",
          confirmText: "登录",
          confirmColor: this.theme_color,
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
                url: "/pages/login/login",
              });
            }
          },
        });
      }
      uni.navigateTo({
        url: "/demand/book",
      });
    },

    clickBanner(item) {},

    queryBanner() {
      getBanner({ site: 2, channel_id: 1 })
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
    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
  onLoad() {
    this.init();
  },
  onPullDownRefresh() {
    this.init();
  },

  onReachBottom(e) {
    uni.$u.throttle(this.getListData(), 500);
  },
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
}
.demand-list {
  background-color: #f6f8fb;
  padding: 0 28rpx;
  .demand-list-item {
    .item-left {
      .item-info {
        height: 100rpx;
      }
      ::v-deep .u-image__image {
        border-radius: 24rpx !important;
      }
    }
  }
}
</style>
