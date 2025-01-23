<template>
  <view class="activity-income-page">
    <view class="top-area">
      <MyNavbar bgColor="transparent">
        <template #navbarData>
          <view class="u-flex-row u-row-center u-col-center">
            <text class="u-text-center u-font-32 color-text-black u-font-bold"
              >活动奖励</text
            >
          </view>
        </template>
      </MyNavbar>
      <view class="income-info u-m-28 u-p-32">
        <view class="u-font-32 color-text-white">收益总览</view>
        <view class="u-flex-row u-m-t-28">
          <view
            class="u-flex-1"
            :class="{ 'u-m-r-16': index < topCarData.length - 1 }"
            v-for="(item, index) in topCarData"
            :key="index"
          >
            <view class="u-font-32 u-font-weight-600 color-text-white u-line-1">{{
              item.data
            }}</view>
            <view class="u-font-24" style="color: #cfe2ff">{{
              item.title
            }}</view>
          </view>
        </view>
      </view>
      <view class="u-p-x-28 u-p-b-28 u-flex-row u-col-center u-row-between">
        <view class="color-text-black u-font-32">活动项目</view>
        <DatePicker
          ref="datePickerRef"
          title="请选择查询时间段"
          :showBottomBtns="true"
          :type="['custom']"
          :baseBtn="false"
          @submit="getDate"
          @reset="resetDate"
        >
          <template #default="{ label, value }">
            <view class="switch-bg">
              <text
                class="switch-item"
                :class="{ 'switch-item-active': switchIndex === 4 }"
                @click="changeStatus(4, '3months')"
                >近三月</text
              >
              <text
                class="switch-item"
                :class="{ 'switch-item-active': switchIndex === 3 }"
                @click="changeStatus(3, '6months')"
                >近半年</text
              >
              <text
                class="switch-item"
                :class="{ 'switch-item-active': switchIndex === 2 }"
                @click="changeStatus(2, '12months')"
                >近一年</text
              >
              <view
                class="switch-space"
                v-show="switchIndex == 3 || switchIndex == 4"
              ></view>
              <text
                class="switch-item"
                :class="{ 'switch-item-active': switchIndex === 1 }"
                @click="changeStatus(1, '')"
                >自定义</text
              >
            </view>
          </template>
        </DatePicker>
      </view>
      <view
        class="u-m-l-28 u-m-r-28 u-m-t-16 u-m-b-16 u-flex-row u-row-between color-text-less-grey u-font-24"
        v-show="switchIndex == 1"
      >
        <text>查询时间段</text>
        <text class="u-text-right u-flex-1">{{ date.join("-") }}</text>
      </view>
    </view>

    <view class="u-p-l-28 u-p-r-28">
      <view v-if="listData.length">
        <view
          v-for="(item, index) in listData"
          :key="item.advertiser_type"
          class="card-bg u-m-b-16 u-flex-row"
          @click="goDetail(item)"
        >
          <u-image
            :src="
              item.advertiser_icon ||
              `${static_path}activity_advitiser_empty_icon.png`
            "
            mode="scaleToFill"
            shape="square"
            radius="24rpx"
            width="132rpx"
            height="132rpx"
            style="border-radius: 24rpx"
          ></u-image>
          <view class="u-flex-1 u-m-r-32 u-m-l-24 u-flex-col u-row-between">
            <view class="u-font-28 u-text-main u-line-1">{{
              item.advertiser_name
            }}</view>
            <view class="u-flex-row u-col-center">
              <view
                class="u-line-1 u-font-24 color-text-less-grey"
                style="flex-shrink: 0"
                >新增入账
              </view>
              <u-line
                class="u-m-l-8 u-m-r-8"
                direction="col"
                length="16rpx"
                color="#C6C6C6"
              ></u-line>
              <view class="u-font-24 u-font-weight color-text-orange">{{
                item.new_income_amount
              }}</view>
            </view>
            <view class="u-flex-row u-col-center">
              <view
                class="u-line-1 u-font-24 color-text-less-grey"
                style="flex-shrink: 0"
                >最新结算日
              </view>
              <u-line
                class="u-m-l-8 u-m-r-8"
                direction="col"
                length="16rpx"
                color="#C6C6C6"
              ></u-line>
              <view class="u-font-24 color-text-less-grey">{{
                `${item.new_income_date || '--'}`
              }}</view>
            </view>
          </view>
          <view
            class="u-flex-col u-row-between u-col-bottom"
            style="max-width: 200rpx"
          >
            <u-icon
              label="查看明细"
              name="arrow-right"
			  labelSize="24rpx"
              size="28rpx"
              color="#989898"
              labelColor="#989898"
              labelPos="left"
            ></u-icon>
            <view class="u-line-1 u-text-main u-font-32 u-font-weight">{{
              item.total_amount
            }}</view>
            <view class="u-font-22 color-text-less-grey">累计入账</view>
          </view>
        </view>
      </view>
      <view v-if="!listData.length" style="margin-top: 200rpx">
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
import { getTotalIncomeData, getIncomeList } from "../api/activity/home.js";
import DatePicker from "@/components/base-datepicker/index.vue";
import MyNavbar from "@/components/my-navbar/index.vue";
import { unitMoney } from "@/utils/tools.js";
import { mapGetters } from "vuex";
export default {
  props: {},
  options: {
    styleIsolation: "shared",
  },
  components: {
    MyNavbar,
    DatePicker,
  },
  data() {
    return {
      isEnd: false,
      page: 1,
      pagesize: 20,
      loading: false,
      site: null,
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",

      switchIndex: 4,
      willSwitchIndex: 4,
      listData: [],
      date: [],
      topCarData: [
        {
          title: "参与项目",
          data: "0",
        },
        {
          title: "可提现",
          data: unitMoney(0, false, true),
        },
        {
          title: "累计入账收益",
          data: unitMoney(0, false, true),
        },
      ],
    };
  },
  computed: {
    ...mapGetters(["static_path", "image"]),
  },
  methods: {
    changeStatus(index, value) {
      this.willSwitchIndex = index;
      if (index == 1) {
        this.$refs.datePickerRef.switchComps();
      } else {
        this.$refs.datePickerRef.setDate(value, true);
      }
    },
    getDate(date) {
      this.date = date;
      this.switchIndex = this.willSwitchIndex;
      if(date.length) this.init();
    },
    resetDate() {
      this.changeStatus(4, "3months");
    },
    goDetail(item) {
      uni.setStorageSync(
        "SET_JUMP_QUERY",
        JSON.stringify({
          advertiser_type: item.advertiser_type + "",
          advertiser_name: item.advertiser_name,
        })
      );
      uni.navigateTo({
        url: `/income/activityIncome/advertiserDetail`,
      });
    },
    getTotalData() {
      if (this.loading) return;
      let params = {
        type: 5,
      };
      getTotalIncomeData(params)
        .then((res) => {
          this.topCarData = [
            {
              title: "参与项目",
              data: res.data["advertiser_num"],
            },
            {
              title: "可提现",
              data: unitMoney(res.data["amount_cash_out"], false, true),
            },
            {
              title: "累计结算收益",
              data: unitMoney(res.data["total_amount"], false, true),
            },
          ];
        })
        .catch((error) => {
          this.mescroll.endErr();
          let message = String(err.message || err || "获取失败");
          this.toastMsg(message, "error"); 
        }); 
    },

    init() {
      this.isEnd = false;
      this.getTotalData();
      this.getListData(true);
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
        type: 5,
        pagesize: this.pagesize,
        start_date: this.date[0],
        end_date: this.date[1],
      };
      params.page = this.page;
      this.toastMsg("加载中", "loading", -1);
      getIncomeList(params)
        .then((res) => {
          const list = res.data;
          for (let item of list) {
            item["new_income_amount"] = unitMoney(
              item["new_income_amount"],
              false,
              true
            );
            item["total_amount"] = unitMoney(item["total_amount"], false, true);
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
  },
  onPullDownRefresh() {

    this.init(); 
  },
  onReachBottom(e) {
    uni.$u.throttle(this.getListData(), 500);
  },
  onReady() {
    this.changeStatus(4, "3months");
  },
};
</script>

<style lang="scss" scoped>
.activity-income-page {
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

  .switch-bg {
    width: 456rpx;
    height: 56rpx;
    background: #ffffff;
    border-radius: 100rpx;
    display: flex;
    font-size: 24rpx;
    text-align: center;

    .switch-space {
      width: 2rpx;
      height: 16rpx;
      align-self: center;
      background-color: #c6c6c6;
      border-radius: 2rpx;
    }

    %switch-base {
      flex: 1;
      display: flex;
      height: 100%;
      justify-content: center;
      align-items: center;
    }

    .switch-item {
      @extend %switch-base;
      color: #989898;
      background: transparent;
    }

    .switch-item-active {
      @extend %switch-base;
      color: #ffffff;
      background: #408cff;
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
