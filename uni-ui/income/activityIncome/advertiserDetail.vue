<template>
  <view class="page-box u-bg-default u-vh-100">
    <view class="top-area">
      <MyNavbar bgColor="transparent">
        <template #navbarData>
          <view class="u-flex-row u-row-center u-col-center">
            <text
              class="u-text-center u-font-32 color-text-black u-font-bold"
              >{{ advertiser_name }}</text
            >
          </view>
        </template>
      </MyNavbar>
      <view class="top-area-data u-bg-f u-m-l-28 u-m-r-28 u-m-t-28">
        <view class="income-info u-flex-row u-p-32">
          <view class="u-flex-1 u-p-r-16">
            <view class="u-font-32 u-font-weight-600 color-text-white u-line-1"
              >{{ projectInfo.count }}
            </view>
            <view class="u-font-24" style="color: #cfe2ff">结算笔数</view>
          </view>
          <view class="u-flex-1">
            <view class="u-font-32 u-font-weight-600 color-text-white u-line-1">
              {{ projectInfo.amount }}
            </view>
            <view class="u-font-24" style="color: #cfe2ff">奖励总额（元）</view>
          </view>
        </view>
      </view>
    </view>
    <view class="u-bg-f u-p-t-28 u-m-l-28 u-m-r-28" :style="{'min-height': list_height}">
      <view v-if="listData.length">
        <view
          v-for="(item, index) in listData"
          :key="item.id"
          class="u-p-l-28 u-p-r-28 u-p-b-32 u-flex-row"
        >
          <u-image
            :src="
              item.advertiser_type_icon ||
              `${static_path}activity_advitiser_empty_icon.png`
            "
            mode="scaleToFill"
            shape="square"
            radius="24rpx"
            width="132rpx"
            height="132rpx"
            style="border: 2rpx solid #eeeeee; border-radius: 24rpx"
          ></u-image>
          <view class="u-flex-1 u-m-r-64 u-m-l-24 u-flex-col u-row-between">
            <view class="u-font-28 u-text-main u-line-1">{{
              item.activity_name
            }}</view>
            <view class="u-flex-row u-col-center">
              <view class="u-font-24 color-text-less-grey">奖励</view>
              <u-line
                class="u-m-l-8 u-m-r-8"
                direction="col"
                length="16rpx"
                color="#C6C6C6"
              ></u-line>
              <view class="u-font-24 u-font-weight color-text-orange">{{ item.amount }}</view>
            </view>
            <view class="u-flex-row u-col-center">
              <view class="u-font-24 color-text-less-grey">结算日期</view>
              <u-line
                class="u-m-l-8 u-m-r-8"
                direction="col"
                length="16rpx"
                color="#C6C6C6"
              ></u-line>
              <view class="u-font-24 color-text-less-grey">{{
                item.date
              }}</view>
            </view>
          </view>
        </view>
      </view>
      <view v-if="!listData.length" style="padding-top: 200rpx;">
        <u-empty text="暂无收益数据" :icon="image.no_data_list"></u-empty>
      </view>


    </view>
    <u-loadmore
      v-if="!loading && listData.length > pagesize"
        :status="status"
        :loading-text="loadingText"
        :loadmore-text="loadmoreText"
        :nomore-text="nomoreText"
      ></u-loadmore>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { getTotalData, getIncomeList } from "../api/activity/detail.js";

import { unitMoney } from "@/utils/tools.js";
import MyNavbar from "@/components/my-navbar/index.vue";
import { mapGetters } from "vuex";
export default {
  components: {
    MyNavbar,
  },
  data() {
    return {
      list_height:'0rpx',
      advertiser_type: null,
      advertiser_name: "",
      isEnd: false,
      page: 1,
      pagesize: 20,
      loading: false,
      site: null,
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",

      switchIndex: 1,
      listData: [],
      projectInfo: {
        advertiser_name: "",
        totalAward: 0,
        settle_num: 0,
        count: 0,
        amount: 0,
      },
    };
  },
  computed: {
    ...mapGetters(["static_path", "image"]),
  },
  methods: {
    init() {
      this.isEnd = false;
      this.getTotalData();
      this.getListData(true);
    },
    getTotalData() {
      let params = {
        advertiser_type: this.advertiser_type,
      };
      getTotalData(params)
        .then((res) => {
          this.projectInfo = res.data;
          let amount = res.data["amount"];
          this.projectInfo["amount"] = unitMoney(amount, false, true);
        })
        .catch((err) => {
          this.mescroll.endErr();
          let message = String(err.message || err || "获取失败");
          this.toastMsg(message, "error");
        });
    },
    getListData(reset = false) {
      if (this.loading) return;
      reset && (this.loading = true);
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
        advertiser_type: this.advertiser_type,
      };
      params.page = this.page;
      this.toastMsg("加载中", "loading", -1);
      getIncomeList(params)
        .then((res) => {
          let list = res.data;
          for (var item of list) {
            item["amount"] = unitMoney(item["amount"], false, true);
          }

          if (reset) this.listData = list;
          else this.listData.push(...list);
          this.site = res.data.site;
          let bool = !(res.data.length < this.pagesize);
          this.isEnd = !bool;
          if (!bool) {
            this.nomoreText = `没有更多了～`;
            this.status = "nomore";
          } else {
            this.loadmoreText = `下拉加载更多`;
            this.status = "loadmore";
          }
          this.$refs.toastRef?.close();

        })
        .catch((err) => {
          let message = String(err.message || err || "获取失败");
          this.toastMsg(message, "error");
        })
        .finally(async () => {
          uni.stopPullDownRefresh();
          this.loading = false;
        });
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration
      });
    },
    async computedHeight() {

      const containBoxRect = await this.$u.getRect(`.page-box`);
      console.log(containBoxRect);
      const topBoxRect = await this.$u.getRect(`.top-area`);
      console.log(topBoxRect);
      this.list_height = (containBoxRect.height - topBoxRect.height - 8) + "px";
      console.log(this.list_height + '');
    },
  },
  onLoad() {
    const { advertiser_name, advertiser_type } = JSON.parse(
      uni.getStorageSync("SET_JUMP_QUERY")
    );
    this.advertiser_name = advertiser_name || "项目名称";
    this.advertiser_type = advertiser_type || null;
    
    this.safe_bottom = uni.$u.sys().safeAreaInsets?.bottom || 0;
  },
  onReady() {
    this.init();
    this.$nextTick(() => {
      this.computedHeight();
    });
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
.page-box {
  .top-area {
    /* #ifdef APP || MP */
    padding-top: 88rpx;
    /* #endif */
    z-index: 999;
    width: 750rpx;
    top: 0;
    position: sticky;
    background: linear-gradient(180deg, #d3edff, #f6f7fb);

    .top-area-data {
      border-top-left-radius: 16rpx;
      border-top-right-radius: 16rpx;

      .income-info {
        background: linear-gradient(
            109.59deg,
            #62a1ff 0%,
            #408cff 59.88%,
            #3677d9 100%
          ),
          linear-gradient(
            0deg,
            rgba(255, 255, 255, 0.05),
            rgba(255, 255, 255, 0.05)
          );
        border-radius: 16rpx;
      }
    }
  }
}
</style>
