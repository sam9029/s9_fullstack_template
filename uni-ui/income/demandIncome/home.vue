<template>
  <view class="demand-income-page">
    <view class="top-area">
      <MyNavbar bgColor="transparent">
        <template #navbarData>
          <view class="u-flex-row u-row-center u-col-center">
            <text class="u-text-center u-font-32 color-text-black u-font-bold"
              >看点推广收益</text
            >
          </view>
        </template>
      </MyNavbar>
      <view class="income-info u-m-28 u-p-32">
        <view class="u-font-32 color-text-white">收益总览</view>
        <view class="u-flex-row u-m-t-28">
          <view class="u-flex-1 u-m-r-16">
            <view class="u-font-32 color-text-white u-line-1 u-font-weight-600">{{
              totalData.advertiser_num
            }}</view>
            <view class="u-font-24" style="color: #cfe2ff">推广小程序</view>
          </view>
          <view class="u-flex-1 u-m-r-16">
            <view class="u-font-32 color-text-white u-line-1 u-font-weight-600">
              {{ unitMoney(totalData.be_credited_amount, false, true) }}
            </view>
            <view class="u-font-24" style="color: #cfe2ff">待入账</view>
          </view>
          <view class="u-flex-1">
            <view class="u-font-32 color-text-white u-line-1 u-font-weight-600">
              {{ unitMoney(totalData.total_amount, false, true) }}
            </view>
            <view class="u-font-24" style="color: #cfe2ff">累计入账收益</view>
          </view>
        </view>
      </view>
      <view class="u-p-x-28 u-p-b-20 u-flex-row u-col-center u-row-between">
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
                @click="setDateValue(null)"
              >
                <text class="u-font-24 u-line-h-40">全部</text>
              </view>
            </view>
          </template>
        </DatePicker>
      </view>
    </view>
    <view class="u-p-l-28 u-p-r-28">
      <view v-if="listData.length">
        <view
          v-for="(item, index) in listData"
          :key="item.id"
          class="card-bg u-m-b-16 u-flex-row"
          @click="goDetail(item)"
        >
          <u-image
            :src="item.advertiser_icon"
            mode="scaleToFill"
            shape="square"
            radius="24rpx"
            width="132rpx"
            height="132rpx"
            style="border-radius: 24rpx"
          ></u-image>
          <view class="u-flex-1 u-m-r-64 u-m-l-24 u-flex-col u-row-between">
            <view class="u-font-28 u-font-bold u-text-main u-line-1 u-font-weight">{{
              item.advertiser_name
            }}</view>
            <view class="u-flex-row u-col-center">
              <view class="u-font-24 color-text-less-grey">待入账</view>
              <u-line
                class="u-m-l-8 u-m-r-8"
                direction="col"
                length="16rpx"
                color="#C6C6C6"
              ></u-line>
              <view class="u-font-24 color-text-orange u-font-bold">{{
                unitMoney(item.be_credited_amount, false, true)
              }}</view>
            </view>
            <view class="u-flex-row u-col-center">
              <view class="u-font-24 color-text-less-grey">最新结算日</view>
              <u-line
                class="u-m-l-8 u-m-r-8"
                direction="col"
                length="16rpx"
                color="#C6C6C6"
              ></u-line>
              <view class="u-font-24 color-text-less-grey">{{
                item.new_income_date
              }}</view>
            </view>
          </view>
          <view class="u-flex-col u-row-between u-col-bottom">
            <u-icon
              label="查看明细"
              name="arrow-right"
			  labelSize="24rpx"
              size="28rpx"
              color="#989898"
              labelColor="#989898"
              labelPos="left"
            ></u-icon>
            <view class="u-text-main u-font-32 u-font-weight-600">{{
              unitMoney(item.total_amount, false, true)
            }}</view>
            <view class="u-font-22 color-text-less-grey">已入账</view>
          </view>
        </view>
      </view>
      <view v-else="!listData.length" class="u-m-t-100">
        <u-empty text="暂无收益数据" :icon="image.no_data_list"></u-empty>
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
import MyNavbar from "@/components/my-navbar/index.vue";
import { mapGetters } from "vuex";
import { unitMoney } from "@/utils/tools.js";
import { getIncomeTotal, getIncomeList } from "../api/demand/home.js";
import DatePicker from "@/components/base-datepicker/index.vue";
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
      totalData: {},
      isEnd: false,
      page: 1,
      pagesize: 20,
      startDate: "",
      endDate: "",
      loading: false,

      date: [],
      listData: [],
    };
  },
  computed: {
    ...mapGetters(["static_path", "image"]),
  },
  watch: {},
  methods: {
    unitMoney,

    setDateValue(value) {
      this.$refs.datePickerRef.setDate(value, true);
    },

    init() {
      this.isEnd = false;
			this.fetchDTotalData();
      this.getListData(true);
    },

    fetchDTotalData() {
      let params = {
        type: 2,
      };
      getIncomeTotal(params)
        .then((res) => {
          if (res.code === 0) {
            this.totalData = res.data;
          }
        })
        .catch((err) => {
          let message = String(err.message || err || "数据获取失败");
          this.toastMsg(message, "error");
        })
    },
    getDate(date) {
      this.date = date;
      this.init();
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
        url: `/income/demandIncome/advertiserDetail`,
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
        type: 2,
        pagesize: this.pagesize,
        start_date: this.date[0],
        end_date: this.date[1],
      };
      params.page = this.page;
      getIncomeList(params)
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
          this.$refs.toastRef.close()
        })
        .catch((err) => {
          let message = String(err.message || err || "数据获取失败");
          this.toastMsg(message, "error");
        })
        .finally(() => {
          uni.stopPullDownRefresh();
          this.loading = false;
        });
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
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
    z-index: 999;
    width: 750rpx;
    top: 0;
    position: sticky;
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
    display: flex;
    background: #fff;
    border-radius: 100rpx;

    .date-tabs--item {
      display: flex;
      align-items: center;
      justify-content: center;
      padding-left: 24rpx;
      padding-right: 24rpx;
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

  .card-bg {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
  }
}
</style>
