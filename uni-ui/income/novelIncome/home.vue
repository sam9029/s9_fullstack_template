<template>
  <view class="demand-income-page">
    <view class="top-area u-p-b-28">
      <MyNavbar bgColor="transparent">
        <template #navbarData>
          <view class="u-flex-row u-row-center u-col-center">
            <text class="u-text-center u-font-32 color-text-black u-font-bold"
              >小说推文收益</text
            >
          </view>
        </template>
      </MyNavbar>
      <view class="income-info u-m-28 u-p-32">
        <view class="u-font-32 color-text-white">收益总览</view>
        <view class="u-flex-row u-m-t-28">
          <view class="u-flex-1 u-m-r-16">
            <view class="u-font-32 color-text-white u-font-bold u-line-h-48">{{
              topCard.advertiser_num
            }}</view>
            <view class="u-font-24 u-line-h-40" style="color: #cfe2ff"
              >推广项目</view
            >
          </view>
          <view class="u-flex-1 u-m-r-16">
            <view class="u-font-32 color-text-white u-font-bold u-line-h-48">{{
              unitMoney(topCard.limit_amount, false, true)
            }}</view>
            <view class="u-font-24 u-line-h-40" style="color: #cfe2ff"
              >可提现</view
            >
          </view>
          <view class="u-flex-1">
            <view class="u-font-32 color-text-white u-font-bold u-line-h-48">{{
              unitMoney(topCard.total_amount, false, true)
            }}</view>
            <view class="u-font-24 u-line-h-40" style="color: #cfe2ff"
              >累计结算收益</view
            >
          </view>
        </view>
      </view>
      <view class="u-m-l-28 u-m-r-28 u-flex-row u-col-center u-row-between">
        <view class="color-text-black u-font-32">收益明细</view>
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
                  'date-tabs--active': value == '3months',
                  'date-tabs--default': value != '3months',
                }"
                style="
                  border-top-right-radius: 100rpx;
                  border-bottom-right-radius: 100rpx;
                "
                @click="setDateValue('3months')"
              >
                <text class="u-font-24 u-line-h-40">近三月</text>
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
                  'date-tabs--active': value == null,
                  'date-tabs--default': value != null,
                }"
                style="
                  border-top-left-radius: 100rpx;
                  border-bottom-left-radius: 100rpx;
                "
                @click="setDateValue(null)"
              >
                <text class="u-font-24 u-line-h-40">全部</text>
              </view>
            </view>
          </template>
        </DatePicker>
      </view>
    </view>
    <view v-if="listData.length" class="u-p-x-28">
      <view
        v-for="(item, index) in listData"
        :key="item.id"
        class="u-m-b-16 u-p-24 u-flex-row u-col-center u-bg-f u-border-radius"
        @click="goDetail(item)"
      >
        <u-image
          :src="item.advertiser_icon"
          radius="24rpx"
          width="132rpx"
          height="132rpx"
        ></u-image>
        <view class="u-flex-1 u-m-r-64 u-m-l-24 u-flex-col u-row-between">
          <view class="u-font-28 u-line-h-44 u-text-main u-line-1">{{
            item.advertiser_name
          }}</view>
          <view class="u-flex-row u-line-h-40 u-col-center">
            <view class="u-font-24 color-text-less-grey">新增收益</view>
            <u-line
              class="u-m-l-8 u-m-r-8"
              direction="col"
              length="16rpx"
              color="#C6C6C6"
            ></u-line>
            <view class="u-font-24 color-text-orange">{{
              unitMoney(item.new_income_amount, false, true)
            }}</view>
          </view>
          <view class="u-flex-row u-col-center u-line-h-40">
            <view class="u-font-24 color-text-less-grey">最新结算日</view>
            <u-line
              class="u-m-l-8 u-m-r-8"
              direction="col"
              length="16rpx"
              color="#C6C6C6"
            ></u-line>
            <view class="u-font-24 color-text-less-grey">{{
              item.new_income_date || "--"
            }}</view>
          </view>
        </view>
        <view class="u-flex-col u-row-between u-col-bottom">
          <u-icon
            label="查看明细"
            name="arrow-right"
            size="24rpx"
            color="#989898"
            labelColor="#989898"
            labelPos="left"
            labelSize="24rpx"
          ></u-icon>
          <view class="u-text-main u-font-32 u-line-h-52 u-font-bold">{{
            unitMoney(item.total_amount, false, true)
          }}</view>
          <view class="u-font-22 u-line-h-40 color-text-less-grey"
            >累计收益</view
          >
        </view>
      </view>
    </view>
    <view v-if="!loading && !listData.length" class="u-m-t-100">
      <u-empty text="暂无收益数据" :icon="image.no_data_list"></u-empty>
    </view>
    <u-loadmore
      v-if="!loading && listData.length > 0"
      :status="status"
      :loading-text="loadingText"
      :loadmore-text="loadmoreText"
      :nomore-text="nomoreText"
    ></u-loadmore>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import DatePicker from "@/components/base-datepicker/index.vue";
import MyNavbar from "@/components/my-navbar/index.vue";
import { mapGetters } from "vuex";
import { unitMoney, sleep } from "@/utils/tools.js";
import {
  getIncomeTotal as totalReq,
  getIncomeList as listReq,
} from "../api/demand/home.js";
export default {
  options: {
    styleIsolation: "shared",
  },
  components: {
    MyNavbar,
    DatePicker,
  },
  data() {
    return {
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
      topCard: {},
    };
  },
  computed: {
    ...mapGetters(["static_path", "image"]),
  },
  methods: {
    unitMoney,
    init() {
      this.toastMsg("加载中", "loading", -1);
      this.isEnd = false;
      this.getTopCard();
      this.getListData();
      this.$refs.toastRef?.close();
      uni.stopPullDownRefresh();
    },

    setDateValue(value) {
      this.$refs.datePickerRef.setDate(value, true);
    },

    getTopCard() {
      totalReq({
        type: 1,
      })
        .then((res) => {
          if (res.code == 0) {
            this.topCard = res.data;
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        });
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
        type: 1,
        start_date: this.date[0],
        end_date: this.date[1],
        pagesize: this.pagesize,
      };
      params.page = this.page;
      listReq(params)
        .then((res) => {
          const list = res.data;
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

    getDate(date) {
      this.date = date;
      this.init();
    },

    changeStatus(index) {
      this.switchIndex = index;
    },

    goDetail(item) {
      uni.setStorageSync(
        "SET_JUMP_QUERY",
        JSON.stringify({
          advertiser_type: item.advertiser_type,
          advertiser_name: item.advertiser_name,
        })
      );
      uni.navigateTo({
        url: `/income/novelIncome/advertiserDetail`,
      });
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

  onReachBottom(e) {
    uni.$u.throttle(this.getListData(), 500);
  },
};
</script>

<style lang="scss" scoped>
.demand-income-page {
  min-height: 100vh;

  .top-area {
    /* #ifdef APP || MP */
    padding-top: 88rpx;
    /* #endif */
    z-index: 100;
    width: 100%;
    position: sticky;
    top: 0;
    background: linear-gradient(180deg, #d3edff, #f6f7fb);

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

  .date-tabs {
    display: grid;
    grid-auto-flow: column;
    background: #fff;
    border-radius: 100rpx;

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
      border-radius: 100rpx;
    }

    &--active {
      color: #fff;
      background: $u-primary;
      border-radius: 100rpx;
    }
  }
}
</style>
