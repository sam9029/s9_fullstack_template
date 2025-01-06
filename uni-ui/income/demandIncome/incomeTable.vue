<template>
  <view class="income-table-page u-bg-default u-vh-100 u-p-28 u-flex-col">
    <view
      class="contain-box u-border-radius u-border u-bg-f u-flex-1 u-p-24"
      :class="{ 'contain-box-no-scroll': isShowPop }"
      v-if="pageInfo.isLoadComplate && projectInfo && listData.length"
    >
      <view class="top-box">
        <view class="project-header u-flex-row" v-if="incomeType == 1">
          <u-image
            class="u-m-r-16"
            lazyLoad
            radius="16rpx"
            width="104rpx"
            height="104rpx"
            :src="
              projectInfo.drama_cover_url ||
              `${static_path}drama_empty_icon.png`
            "
          ></u-image>
          <view class="u-flex-col u-flex-1 u-row-between">
            <view class="u-flex-row u-row-center">
              <view
                class="u-flex-col u-row-center u-p-l-6 u-p-r-6 u-p-t-2 u-p-b-2 u-m-r-4 u-bg-primary"
                style="border-radius: 8rpx"
              >
                <text class="color-text-white u-font-22">计划</text>
              </view>
              <text
                class="u-flex-1 u-font-28 u-font-weight color-text-black u-line-1"
                >{{ projectInfo.plan_name }}</text
              >
            </view>
            <view class="u-flex-row u-row-center">
              <u-image
                class="u-m-r-4"
                lazyLoad
                radius="8rpx"
                width="36rpx"
                height="36rpx"
                :src="projectInfo.advertiser_icon"
              ></u-image>
              <text
                class="u-flex-1 u-font-28 u-line-1"
                style="color: #3c3c3c"
                >{{ projectInfo.drama_name }}</text
              >
            </view>
          </view>
        </view>
        <view class="user-header u-flex-row" v-else>
          <view class="u-flex-col u-m-r-16 u-col-center">
            <view class="user-header-icon u-flex-col u-col-center u-row-center">
              <u-image :src="income_img" width="60rpx" height="60rpx"></u-image>
            </view>
            <text class="color-text-black u-font-24 u-font-weight u-m-t-8"
              >发布佣金</text
            >
          </view>
          <view class="u-flex-1 u-flex-col">
            <view class="u-flex-row u-row-left u-col-center">
              <text
                class="color-text-black u-font-28 u-font-weight u-line-1"
                style="max-width: 260rpx"
                >{{ userInfo.blogger_name }}</text
              >
              <text class="u-font-24 color-text-less-grey u-line-1">{{
                `(ID:${userInfo.blogger_id})`
              }}</text>
            </view>
            <view
              class="user-header-data u-flex-1 u-m-t-16 u-flex-row u-col-center u-border-radius u-bg-default u-p-l-16 u-p-r-16 u-p-t-8 u-p-b-8"
            >
              <view class="user-header-data-item u-flex-col u-row-between">
                <text
                  class="user-header-data-text u-font-28 color-text-black u-font-weight"
                  >{{ userInfo.order_num }}</text
                >
                <text class="color-text-less-grey u-font-22">剧集</text>
              </view>
              <view class="user-header-data-space u-m-l-8 u-m-r-8"></view>
              <view
                class="user-header-data-item u-flex-col u-row-between u-col-center"
              >
                <text
                  class="user-header-data-text u-font-28 color-text-black u-font-weight"
                  style="text-align: center"
                  >{{ userInfo.blogger_amount }}</text
                >
                <text class="color-text-less-grey u-font-22">结算金额</text>
              </view>
              <view class="user-header-data-space u-m-l-8 u-m-r-8"></view>
              <view
                class="user-header-data-item u-flex-col u-row-between u-col-bottom"
              >
                <text
                  class="user-header-data-text u-font-28 color-text-black u-font-weight"
                  style="text-align: right"
                  >{{ userInfo.total_amount }}</text
                >
                <text class="color-text-less-grey u-font-22">我的收益</text>
              </view>
            </view>
          </view>
        </view>
        <view
          class="u-m-t-24"
          style="background-color: #eee; height: 2rpx"
        ></view>
        <view class="top-title u-flex-row color-text-black u-font-24 u-p-t-24">
          <text
            class="u-flex-1"
            style="text-align: center; line-height: 40rpx"
            v-for="(item, index) in headerTitles"
            :key="index"
            >{{ item }}</text
          >
        </view>
      </view>

      <u-list :style="{ height: list_height }" @scrolltolower="loadMoreData">
        <u-list-item
          class="income-item"
          v-for="item in listData"
          :key="item.id"
        >
          <view class="u-flex-row u-p-t-24 u-text-center">
            <text
              class="income-item-text u-m-r-16 u-font-22 color-text-less-grey"
              >{{ item.date }}</text
            >
            <text
              class="income-item-text income-item-text-click u-font-22 color-text-primary"
              v-if="incomeType == 1"
              @click="showTopupData(item)"
              >{{ item.charge_amount }}</text
            >
            <text
              class="income-item-text u-font-22 color-text-less-grey"
              v-else
              >{{ item.drama_name }}</text
            >
            <text
              class="income-item-text u-font-22 color-text-less-grey u-m-l-16 u-m-r-16"
              >{{
                `${incomeType == 1 ? item.order_num : item.blogger_amount}`
              }}</text
            >
            <text
              class="income-item-text income-item-text-click u-font-22 color-text-primary"
              @click="showMyIncomeData(item)"
              >{{ item.total_amount }}</text
            >
          </view>
          <view
            class="u-m-t-24"
            style="background-color: #eee; height: 2rpx"
          ></view>
        </u-list-item>
        <u-list-item v-if="pageInfo.showLoadMore" key="loadmorekey">
          <u-loadmore
            :status="pageInfo.loadmoreStatus"
            @loadmore="loadMoreData"
          />
        </u-list-item>
      </u-list>
    </view>
    <view class="u-vh-100 u-flex-col u-col-center u-row-center" v-else>
      <u-empty
        :icon="image.no_data_list"
        :text="`${pageInfo.isLoadComplate ? '暂无数据' : '数据加载中'}`"
      >
      </u-empty>
    </view>
    <base-toast ref="toastRef"></base-toast>
    <incomeDetailsPopup
      ref="detailsPopup"
      @close="closePopup"
    ></incomeDetailsPopup>
  </view>
</template>

<script>
import { unitMoney } from "@/utils/tools.js";
import incomeDetailsPopup from "./components/incomeDetailsPopup.vue";
import topupOrderDetailsVue from "./topupOrderDetails.vue";
import {
  getBloggerIncomeTable,
  getIncomeTable,
} from "../api/demand/incomeTable.js";
import { mapGetters } from "vuex";
export default {
  components: {
    incomeDetailsPopup,
  },
  data() {
    return {
      list_height: "0px",
      start_date: null,
      end_date: null,
      pageInfo: {
        isLoadComplate: false,
        isEnd: false,
        page: 1,
        pagesize: 20,
        loading: false,
        site: null,
        showLoadMore: false,
        loadmoreStatus: "loadmore",
      },
      isShowPop: false,
      incomeType: 1, //收益类型， 1：单个项目收益， 2：发布佣金收益， 默认为单个项目收益
      planId: 0,
      advertiserType: 0,
      bloggerId: 0,

      projectInfo: {},
      userInfo: {},
      listData: [],
    };
  },
  computed: {
		...mapGetters(["static_path", "image"]),
    unitMoneySettlementAmount() {
      return unitMoney(this.userInfo.settlementAmount, false, true);
    },
    unitMoneyIncome() {
      return unitMoney(this.userInfo.income, false, true);
    },
    income_img() {
      return this.static_path + "money_Icon.png";
    },
    headerTitles() {
      return this.incomeType == 1
        ? ["日期", "充值金额", "支付订单", "我的收益"]
        : ["日期", "剧名", "达人收益", "我的收益"];
    },
  },
  methods: {
    async computedHeight() {
      const containBoxRect = await this.$u.getRect(`.contain-box`);

      const topBoxRect = await this.$u.getRect(`.top-box`);

      this.list_height = containBoxRect.height - topBoxRect.height - 28 + "px";
    },
    loadMoreData() {
      uni.$u.throttle(this.getListData(false), 500);
    },
    getListData(reset = true) {
      if (this.pageInfo.loading || this.pageInfo.isEnd) return;

      let params = {
        pagesize: this.pageInfo.pagesize,
        start_date: this.start_date,
        end_date: this.end_date,
      };
      params.advertiser_type = this.advertiserType;
      if (this.incomeType == 2) {
        params.blogger_id = this.bloggerId;
      } else {
        params.plan_id = this.planId;
      }

      this.loading = true;
      this.toastMsg("加载中", "loading", -1);
      if (reset) this.pageInfo.page = 1;
      else this.pageInfo.page += 1;
      params.page = this.pageInfo.page;
      if (!reset) {
        this.pageInfo.loadmoreStatus = "loading";
      }

      let func = this.incomeType == 1 ? getIncomeTable : getBloggerIncomeTable;
      func(params)
        .then((res) => {
          const list = res.data.list;

          if (this.incomeType == 1) {
            this.projectInfo = res.data.info;
            for (let item of list) {
              item.id = item.settle_id;
              let charge_amount = item["charge_amount"];
              item["charge_amount"] = unitMoney(charge_amount, false, true);

              let total_amount = item["total_amount"];
              item["total_amount"] = unitMoney(total_amount, false, true);
            }
          } else {
            this.userInfo = res.data.info;
            let userTotalIncom = res.data.info["total_amount"];
            this.userInfo["total_amount"] = unitMoney(
              userTotalIncom,
              false,
              true
            );
            let userBloggerAmount = res.data.info["blogger_amount"];
            this.userInfo["blogger_amount"] = unitMoney(
              userBloggerAmount,
              false,
              true
            );

            for (var i = 0; i < list.length; i++) {
              let item = list[i];
              item.id = (this.pageInfo.page - 1) * this.pageInfo.pagesize + i;
              let blogger_amount = item["blogger_amount"];
              item["blogger_amount"] = unitMoney(blogger_amount, false, true);

              let total_amount = item["total_amount"];
              item["total_amount"] = unitMoney(total_amount, false, true);
            }
          }

          if (reset) this.listData = list;
          else this.listData.push(...list);
          const hasNext = list?.length == this.pageInfo.pagesize;
          this.pageInfo.isEnd = !hasNext;

          this.$refs.toastRef?.close();

          this.pageInfo.showLoadMore =
            this.listData.length >= this.pageInfo.pagesize;
          this.pageInfo.loadmoreStatus = this.pageInfo.isEnd
            ? "nomore"
            : "loadmore";
        })
        .catch((error) => {
          let message = String(err.message || err || "收益明细获取失败");
          this.toastMsg(message, "error");
        })
        .finally(async () => {
          this.pageInfo.loading = false;
          uni.stopPullDownRefresh();
          this.pageInfo.isLoadComplate = true;
          if (this.list_height === "0px") {
            this.$nextTick(() => {
              this.computedHeight();
            });
          }
        });
    },

    showTopupData(item) {
      let params = {
        settle_id: item.settle_id,
        advertiser_type: this.advertiserType,
        charge_amount: item.charge_amount,
        date: item.date,
        drama_cover_url: this.projectInfo.drama_cover_url,
        start_date: this.start_date,
        end_date: this.end_date,
      };
      uni.navigateTo({
        url: `/income/demandIncome/topupOrderDetails?params=${encodeURIComponent(
          JSON.stringify(params)
        )}`,
      });
    },
    showMyIncomeData(item) {
      this.isShowPop = true;

      this.$refs.detailsPopup.openPopup(item.id, item, this.incomeType);
    },
    closePopup() {
      this.isShowPop = false;
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
  mounted() {},
  onPullDownRefresh() {
    this.pageInfo.isEnd = false;
    uni.$u.throttle(this.getListData(true), 500);
  },

  onLoad(options) {
    this.incomeType = parseInt(options.incomeType);
    this.advertiserType = options.advertiserType;
    this.planId = options.planId;
    this.bloggerId = options.bloggerId;
    this.start_date = options.start_date;
    this.end_date = options.end_date;
  },
  onReady() {
    this.$nextTick(() => {
      uni.startPullDownRefresh();
    });
  },
};
</script>

<style lang="scss" scoped>
.income-table-page {
  .contain-box {
    .user-header {
      .user-header-icon {
        border-radius: 20rpx;
        border: 1rpx solid #ffe0ad;
        background: linear-gradient(
          to bottom,
          rgba(255, 241, 215, 0.1),
          #ffe0ad
        );
        width: 104rpx;
        height: 104rpx;
      }

      .user-header-data {
        .user-header-data-space {
          background-color: #c6c6c6;
          width: 2rpx;
          height: 16rpx;
          border-radius: 2rpx;
        }

        .user-header-data-item {
          flex: 1;
          width: 0;

          .user-header-data-text {
            width: 100%;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
        }
      }
    }

    .income-item {
      .income-item-text {
        flex: 1;
        overflow: hidden;
        white-space: nowrap;
        text-overflow: ellipsis;
      }

      .income-item-text-click {
        text-decoration-line: underline;
        text-decoration-style: solid;
        text-decoration-skip-ink: none;
      }
    }
  }

  .contain-box-no-scroll {
    overflow-y: hidden;
  }
}
</style>
