<template>
  <view class="topup-table-page u-bg-default u-vh-100 u-p-28 u-flex-col">
    <view
      class="contain-box u-border-radius u-border u-bg-f u-flex-1 u-p-24"
      v-if="pageInfo.isLoadComplate"
    >
      <view class="top-box">
        <view class="u-flex-row">
          <u-image
            class="top-box-image"
            :src="drama_cover_url || `${static_path}drama_empty_icon.png`"
            width="104rpx"
            height="104rpx"
            mode="aspectFill"
            radius="16rpx"
          ></u-image>

          <view class="u-m-l-16 u-flex-1 u-flex-col u-row-between">
            <view class="u-flex-row u-row-left u-col-center">
              <u-image
                :src="`${static_path}topup_time_icon.png`"
                width="32rpx"
                height="32rpx"
              ></u-image>
              <text class="u-m-l-8 color-text-less-black u-font-28 u-line-1">{{
                `充值日期：${date}`
              }}</text>
            </view>
            <view class="u-flex-row u-row-left u-col-center">
              <u-image
                :src="`${static_path}topup_money_icon.png`"
                width="32rpx"
                height="32rpx"
              ></u-image>
              <text class="u-m-l-8 color-text-less-black u-font-28 u-line-1">{{
                `充值金额：${charge_amount}`
              }}</text>
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

      <view :style="{ height: list_height }">
        <view v-for="item in listData" :key="item.data_id">
          <view
            class="u-flex-row u-p-t-24 u-text-center u-font-22 color-text-less-grey"
          >
            <text class="u-line-1 u-flex-1">{{ item.pay_time }}</text>
            <text class="u-line-1 u-flex-1">{{ item.charge_amount }}</text>
            <text class="u-line-1 u-flex-1">{{
              `${item.pay_status != "SUCCESS" ? "是" : "否"}`
            }}</text>
          </view>
          <view
            class="u-m-t-24"
            style="background-color: #eee; height: 2rpx"
          ></view>
        </view>
        <view v-if="pageInfo.showLoadMore" key="loadmorekey">
          <u-loadmore
            :status="pageInfo.loadmoreStatus"
            @loadmore="loadMoreData"
          />
        </view>
      </view>
    </view>
    <view class="u-vh-100 u-flex-col u-col-center u-row-center" v-else>
      <u-empty :icon="image.no_data_list" text="数据加载中"> </u-empty>
    </view>
    <base-toast ref=" toastRef"></base-toast>
  </view>
</template>

<script>
import { unitMoney } from "@/utils/tools.js";
import { getPlanIncomeInfo } from "../api/demand/incomeTable.js";
import { mapGetters } from "vuex";
export default {
  components: {},
  data() {
    return {
      currentTab: 0,
      start_date: null,
      end_date: null,
      settle_id: null,
      advertiser_type: null,
      charge_amount: null,
      drama_cover_url: null,
      date: null,
      list_height: "0px",
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

      incomeType: 1, //收益类型， 1：单个项目收益， 2：发布佣金收益， 默认为单个项目收益
      projectInfo: {},
      listData: [],
    };
  },
  computed: {
    unitMoneySettlementAmount() {
      return unitMoney(this.userInfo.settlementAmount, false, true);
    },
    unitMoneyIncome() {
      return unitMoney(this.userInfo.income, false, true);
    },
    ...mapGetters(["static_path", "image"]),
    headerTitles() {
      return ["充值日期", "充值金额", "是否退款"];
    },
  },
  watch: {},
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
        settle_id: this.settle_id,
        advertiser_type: this.advertiser_type,
        start_date: this.start_date,
        end_date: this.end_date,
        currentTab: this.currentTab,
      };

      this.loading = true;
      this.toastMsg("加载中", "loading", -1);
      if (reset) this.pageInfo.page = 1;
      else this.pageInfo.page += 1;
      params.page = this.pageInfo.page;
      if (!reset) {
        this.pageInfo.loadmoreStatus = "loading";
      }
      getPlanIncomeInfo(params)
        .then((res) => {
          this.$refs.toastRef?.close();
          if (res.data.info?.drama_cover_url)
            this.drama_cover_url = res.data.info?.drama_cover_url;
          const list = res.data.list;
          for (let item of list) {
            item["charge_amount"] = unitMoney(
              item["charge_amount"],
              true,
              true
            );
            item.pay_time = item.pay_time?.split(' ').pop() ?? '--';
          }
          if (reset) this.listData = list;
          else this.listData.push(...list);
          const hasNext = list?.length == this.pageInfo.pagesize;
          this.pageInfo.isEnd = !hasNext;
          this.pageInfo.showLoadMore =
            this.listData.length >= this.pageInfo.pagesize;
          this.pageInfo.loadmoreStatus = this.pageInfo.isEnd
            ? "nomore"
            : "loadmore";
        })
        .catch((error) => {
          console.log(error);
          let message = String(err.message || err || "充值明细获取失败");
          this.toastMsg(message, "error");
        })
        .finally(async () => {
          this.loading = false;

          uni.stopPullDownRefresh();
          this.pageInfo.isLoadComplate = true;
          if (this.list_height === "0px") {
            this.$nextTick(() => {
              this.computedHeight();
            });
          }
        });
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
    },
  },
  mounted() {},
  onPullDownRefresh() {
    this.pageInfo.isEnd = false;
    uni.$u.throttle(this.getListData(true), 500);
  },
  onReachBottom() {
    this.loadMoreData();
  },
  onLoad(options) {
    let params = JSON.parse(decodeURIComponent(options.params));

    this.settle_id = params["settle_id"];
    this.advertiser_type = params["advertiser_type"];
    this.charge_amount = params["charge_amount"];
    this.date = params["date"];
    this.currentTab = params["currentTab"] || 0;

    if (params["start_date"]) {
      this.start_date = params["start_date"];
    }
    if (params["end_date"]) {
      this.end_date = params["end_date"];
    }
  },
  onReady() {
    this.$nextTick(() => {
      uni.startPullDownRefresh();
    });
  },
};
</script>

<style lang="scss" scoped>
.top-box-image {
  border: 1px solid #eee;
  border-radius: 16rpx;
}
</style>