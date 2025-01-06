<template>
  <view class="advertiser-price-card u-p-x-28 u-m-t-28">
    <view class="u-bg-f u-border-radius u-p-24 u-m-b-24">
      <view class="u-flex-row u-row-between u-rol-top">
        <BaseSkeleton v-if="loading" height="48rpx" round="8rpx" />
        <view v-else class="u-font-bold u-font-32 u-line-h-48">{{
          `总收益(元): ${unitMoney(detailObj.total_amount, false, true)}`
        }}</view>
        <DatePicker
          :showBottomBtns="false"
          :type="['list']"
          btnHeight="56rpx"
          class="u-m-l-32"
          @submit="getCardDatePicker"
        />
      </view>
      <template v-if="account_type == 1">
        <view class="u-flex-row u-col-center u-m-t-12">
          <view
            class="u-flex-col u-row-center u-m-r-24"
            style="min-width: 182rpx"
          >
            <text class="color-text-less-grey u-font-24 u-line-h-40 u-m-b-8"
              >待入帐</text
            >
            <BaseSkeleton v-if="loading" height="88rpx" round="8rpx" />
            <view
              v-else
              class="price-container u-p-y-16 u-p-x-24 u-border-radius u-flex-col u-row-center"
            >
              <text class="u-font-bold u-font-32 u-line-h-48">{{
                unitMoney(detailObj.be_credited_amount, false, true)
              }}</text>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >预估发布收益</text
              >
            </view>
          </view>
          <view class="u-flex-col u-row-center widthAll">
            <text class="color-text-less-grey u-font-24 u-line-h-40 u-m-b-8"
              >新增收益</text
            >
            <view
              class="price-container u-p-y-16 u-p-x-24 u-flex-row u-col-center u-border-radius"
            >
              <view class="u-flex-col u-row-center u-m-r-32">
                <text class="u-font-bold u-font-32 u-line-h-48">{{
                  unitMoney(detailObj.new_income_publish_amount, false, true)
                }}</text>
                <text class="color-text-less-grey u-font-22 u-line-h-40"
                  >新增发布收益</text
                >
              </view>
              <view class="u-flex-col u-row-center">
                <text class="u-font-bold u-font-32 u-line-h-48">{{
                  unitMoney(detailObj.new_income_service_amount, false, true)
                }}</text>
                <text class="color-text-less-grey u-font-22 u-line-h-40"
                  >新增发布佣金</text
                >
              </view>
            </view>
          </view>
        </view>
        <view class="u-m-t-24">
          <text class="color-text-less-grey u-font-24 u-line-h-40"
            >累计结算</text
          >
          <view
            class="price-container--grid u-border-radius u-p-y-16 u-p-x-24 u-m-t-8"
          >
            <view class="u-flex-col u-row-center">
              <text class="u-font-bold u-font-32 u-line-h-48">{{
                unitMoney(detailObj.publish_amount, false, true)
              }}</text>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >累计发布收益</text
              >
            </view>
            <view class="u-flex-col u-row-center">
              <text class="u-font-bold u-font-32 u-line-h-48">{{
                unitMoney(detailObj.service_amount, false, true)
              }}</text>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >累计发布佣金</text
              >
            </view>
          </view>
        </view>
      </template>
      <template v-else>
        <view
          class="color-text-less-grey u-font-24 u-line-h-40 u-m-t-24 u-m-b-8"
          >待入帐</view
        >
        <BaseSkeleton v-if="loading" height="120rpx" round="16rpx" />
        <view
          v-else
          class="un-posted--blogger u-border-radius u-p-x-24 u-p-y-16"
        >
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.pre_commission, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >充值金额</text
            >
          </view>
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.pre_commission, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >支付订单</text
            >
          </view>
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.pre_commission, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >预估收益</text
            >
          </view>
        </view>
        <view
          class="color-text-less-grey u-font-24 u-line-h-40 u-m-t-24 u-m-b-8 u-flex-row u-col-center u-row-between"
        >
          <text class="u-nowrap u-m-r-32">已结算</text>
          <BaseSkeleton v-if="loading" height="40rpx" round="8rpx" />
          <text v-else>{{ `最新结算日: ${detailObj.new_income_date}` }}</text>
        </view>
        <BaseSkeleton v-if="loading" height="120rpx" round="16rpx" />
        <view
          v-else
          class="price-container--grid u-border-radius u-p-y-16 u-p-x-24 u-m-t-8"
        >
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.new_income_publish_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >新增收益</text
            >
          </view>
          <view class="u-flex-col u-row-center">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.total_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >累计收益</text
            >
          </view>
        </view>
      </template>
    </view>
  </view>
</template>

<script>
import BaseSkeleton from "@/components/base-skeleton/index.vue";
import DatePicker from "@/components/base-datepicker/index.vue";
import { unitMoney } from "@/utils/tools.js";
import { mapGetters } from "vuex";
export default {
  props: {
    detailObj: {
      type: Object,
      default: () => ({}),
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    DatePicker,
    BaseSkeleton,
  },
  data() {
    return {};
  },
  computed: {
    ...mapGetters(["account_type"]),
  },
  watch: {},
  methods: {
    unitMoney,
    getCardDatePicker(date) {
      this.$emit("date", date);
    },
  },
};
</script>

<style lang="scss" scoped>
.un-posted--blogger {
  background: #f6f6f6;
  display: grid;
  grid-auto-flow: column;
  align-items: center;
}
.price-container {
  background: #f6f6f6;
}
.price-container--grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  align-items: center;
  grid-gap: 32rpx;
  background: #f6f6f6;
}
</style>
