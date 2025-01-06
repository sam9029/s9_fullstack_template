<template>
  <view class="create-income-page">
    <view class="navbar-box">
      <view
        class="navbar u-p-x-28 u-p-y-16 widthAll u-relative"
        style="background: transparent"
      >
        <u-icon name="arrow-left" size="48rpx" @click="goBack"></u-icon>
        <view class="color-text-black u-font-32 u-line-h-48 u-position-center"
          >承制收益</view
        >
      </view>
    </view>
    <view class="create-price-card u-p-x-28 u-m-t-28">
      <view class="u-bg-f u-border-radius u-p-24">
        <view class="color-text-less-grey u-font-24 u-line-h-40 u-m-b-8"
          >待入帐</view
        >
        <BaseSkeleton v-if="cardLoading" height="120rpx" round="16rpx"/>
        <view v-else class="un-posted u-border-radius u-p-x-24 u-p-y-16">
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.will_income.order_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >充值金额</text
            >
          </view>
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              detailObj.will_income.order_num
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >支付订单</text
            >
          </view>
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.will_income.account_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >预估收益</text
            >
          </view>
        </view>
        <view
          class="u-flex-row u-row-between u-col-center color-text-less-grey u-font-24 u-line-h-40 u-m-t-24 u-m-b-8"
        >
          <text>已结算</text>
          <text v-if="detailObj.settled_income && detailObj.settled_income.settle_date">{{ detailObj.settled_income.settle_date }}</text>
        </view>
        <BaseSkeleton v-if="cardLoading" height="120rpx" round="16rpx"/>
        <view v-else class="un-posted u-border-radius u-p-x-24 u-p-y-16">
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.settled_income.order_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >充值金额</text
            >
          </view>
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              detailObj.settled_income.order_num
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >支付订单</text
            >
          </view>
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.settled_income.account_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
            >累计收益</text>
          </view>
        </view>
      </view>
    </view>
    <view
      class="list-top u-p-28 u-flex-row u-row-between u-col-center"
      style="background: #f6f7fb"
    >
      <text class="u-font-bold u-font-32 u-line-h-48">收益明细</text>
      <DatePicker
        ref="datePickerRef"
        title="请选择查询时间段"
        :type="['list']"
        :baseBtn="false"
        @submit="getDate"
      >
        <template #default="{ label, value }">
          <view class="date-tabs">
            <view
              class="date-tabs--item"
              :class="{
                'date-tabs--active': value == null,
                'date-tabs--default': value != null,
              }"
              style="
                border-top-left-radius: 100px;
                border-bottom-left-radius: 100px;
              "
              @click="setDateValue(null)"
            >
              <text class="u-font-24 u-line-h-40">全部</text>
            </view>
            <view
              class="date-tabs--item"
              :class="{
                'date-tabs--active': value == '12months',
                'date-tabs--default': value != '12months',
              }"
              @click="setDateValue('12months')"
            >
              <text class="u-font-24 u-line-h-40">近一年</text>
            </view>
            <view
              class="date-tabs--item"
              :class="{
                'date-tabs--active': value == '6months',
                'date-tabs--default': value != '6months',
              }"
              @click="setDateValue('6months')"
            >
              <text class="u-font-24 u-line-h-40">近半年</text>
            </view>
            <view
              class="date-tabs--item"
              :class="{
                'date-tabs--active': value == '3months',
                'date-tabs--default': value != '3months',
              }"
              style="
                border-top-right-radius: 100px;
                border-bottom-right-radius: 100px;
              "
              @click="setDateValue('3months')"
            >
              <text class="u-font-24 u-line-h-40">近三月</text>
            </view>
          </view>
        </template>
      </DatePicker>
    </view>
    <view class="u-p-x-28">
      <view v-if="listData.length" class="list-content">
        <view
          v-for="(item, index) in listData"
          :key="item.id"
          class="list-content--item u-p-24 u-border-radius u-m-b-28 u-flex-row u-col-center"
          @click="goDetail(item)"
        >
          <u--image
            :src="item.collection_cover_url"
            width="124rpx"
            height="176rpx"
            radius="16rpx"
          ></u--image>
          <view class="u-m-l-16 u-flex-col u-row-between widthAll">
            <view class="u-flex-row u-row-between u-col-center u-m-b-16">
              <text class="u-line-1 color-text-black u-font-28 u-line-h-44">{{
                item.collection_name || "--"
              }}</text>
              <u-icon name="arrow-right" color="#3c3c3c" size="32rpx"></u-icon>
            </view>
            <view class="list-item-price-card u-border-radius">
              <view class="u-flex-col u-col-center">
                <text class="color-text-black u-font-28 u-line-h-44">{{
                  item.order_num || "--"
                }}</text>
                <text class="color-text-less-grey u-font-22 u-line-h-40"
                  >支付订单</text
                >
              </view>
              <view class="u-flex-col u-col-center price-border">
                <text class="color-text-black u-font-28 u-line-h-44">{{
                  unitMoney(item.order_amount, false, true)
                }}</text>
                <text class="color-text-less-grey u-font-22 u-line-h-40"
                  >充值金额</text
                >
              </view>
              <view class="u-flex-col u-col-center">
                <text class="color-text-black u-font-28 u-line-h-44">{{
                  unitMoney(item.account_amount, false, true)
                }}</text>
                <text class="color-text-less-grey u-font-22 u-line-h-40"
                  >我的收益</text
                >
              </view>
            </view>
          </view>
        </view>
      </view>
      <view v-if="!loading && !listData.length" class="u-m-t-100">
        <u-empty text="暂无收益数据" :icon="image.no_data_list"></u-empty>
      </view>
      <view v-if="!loading && listData.length > 0" class="u-p-b-48">
        <u-loadmore
          :status="status"
          :loading-text="loadingText"
          :loadmore-text="loadmoreText"
          :nomore-text="nomoreText"
        ></u-loadmore>
      </view>
      <u-loadmore
        v-if="!loading && listData.length > 0"
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
import { unitMoney, sleep } from "@/utils/tools.js";
import { getCreateList, getCreateTotal } from "../api/create/index.js";
import BaseSkeleton from "@/components/base-skeleton/index.vue";
import DatePicker from "@/components/base-datepicker/index.vue";
import { mapGetters } from "vuex";
export default {
  props: {},
  components: {
    DatePicker,
    BaseSkeleton,
  },
  data() {
    return {
      detailObj: {},
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",
      page: 1,
      pagesize: 20,
      site: null,
      loading: false,
      isEnd: false,
      listData: [],
      date: [],
    };
  },
  computed: {
    ...mapGetters(['static_path', 'image']),
  },
  methods: {
    unitMoney,
    setDateValue(value) {
      this.$refs.datePickerRef.setDate(value, true);
    },

    goBack() {
      uni.navigateBack(-1)
    },

    getDate(date) {
      this.date = date;
      this.isEnd = false;
      this.toastMsg("加载中", "loading", -1);
      uni.$u.throttle(this.getListData(), 500);
      this.$refs.toastRef?.close();
    },

    init() {
      this.toastMsg("加载中", "loading", -1);
      this.isEnd = false;
      this.getTopCard();
      this.getListData();
      this.$refs.toastRef?.close();
      uni.stopPullDownRefresh();
    },

    getTopCard() {
      this.cardLoading = true;
      getCreateTotal()
        .then(res => {
          if(res.code == 0) {
            this.detailObj = res.data;
          }
        })
        .catch(error => {
          this.toastMsg(error, "error")
        })
        .finally(async() => {
          await sleep(300);
          this.cardLoading = false;
        })
    },

    getListData(reset = true) {
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
        start_date: this.date[0],
        end_date: this.date[1],
      };
      params.page = this.page;
      getCreateList(params)
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
          await sleep(300);
          this.loading = false;
        });
    },

    goDetail(item) {
      uni.navigateTo({
        url: `/income/createIncome/detail?collection_id=${item.collection_id}`
      })
    },

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
  onReachBottom() {
    uni.$u.throttle(this.getListData(false), 500);
  },
};
</script>

<style lang="scss" scoped>
uni-page-body {
  background: transparent;
}
.create-income-page {
  min-height: 100vh;
  position: relative;
  background: linear-gradient(180deg, #d3edff 0%, #f6f7fb 35%);
  .navbar-box {
    background: #D3EDFF;
    position: sticky;
    top: 0;
    z-index: 100;
    /* #ifdef APP || MP */
    padding-top: 88rpx;
    /* #endif */
    .navbar {
      display: flex;
      align-items: center;
      height: 88rpx;
    }
  }  
  .list-top {
    position: sticky;
    z-index: 99;
    /* #ifdef APP || MP */
    top: 168rpx;
    /* #endif */
    /* #ifdef H5 */
    top: 86rpx;
    /* #endif */
  }
  .list-content--item {
    background: #fff;
  }
  .list-item-price-card {
    padding: 8rpx 16rpx;
    border: 1px solid #eeeeee;
    background: #f6f6f6;
    display: grid;
    grid-template-columns: repeat(3, 3fr);
  }
  .price-border {
    position: relative;
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 8rpx;
      width: 1rpx;
      height: 16rpx;
      background: #c6c6c6;
    }
    &::before {
      content: "";
      position: absolute;
      top: 50%;
      right: 8rpx;
      width: 1rpx;
      height: 16rpx;
      background: #c6c6c6;
    }
  }
  .date-tabs {
    display: grid;
    grid-auto-flow: column;
    background: #fff;
    border-radius: 100px;
    .date-tabs--item {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 96rpx;
      height: 56rpx;
    }
    &--default {
      color: $u-grey-7;
      background: #fff;
    }
    &--active {
      color: #fff;
      background: $u-primary;
      border-radius: 100px;
    }
  }
  .un-posted {
    background: #f6f6f6;
    display: grid;
    grid-auto-flow: column;
    align-items: center;
  }
}
</style>
