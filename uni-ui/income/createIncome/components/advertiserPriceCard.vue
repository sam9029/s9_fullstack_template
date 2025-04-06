<template>
  <view class="advertiser-price-card u-p-x-28">
    <view class="u-bg-f u-border-radius u-p-24">
      <view v-if="currentTab == 0">
				<view class="color-text-less-grey u-font-24 u-line-h-40 u-m-b-8">待入帐</view>
				<view class="price-container--grid u-border-radius u-p-x-24 u-p-y-16">
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.will_income.order_amount || 0, false, true)
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">充值金额</text>
					</view>
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              detailObj.will_income.order_num || 0
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">支付订单</text>
					</view>
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.will_income.account_amount || 0, false, true)
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">预估收益</text>
					</view>
				</view>
				<view
					class="u-flex-row u-row-between u-col-center color-text-less-grey u-font-24 u-line-h-40 u-m-t-24 u-m-b-8">
					<text>已入账</text>
					<text
						v-if="detailObj.settled_income && detailObj.settled_income.settle_date">{{ detailObj.settled_income.settle_date }}</text>
				</view>
				<view class="price-container--grid u-border-radius u-p-x-24 u-p-y-16">
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.settled_income.order_amount || 0, false, true)
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">充值金额</text>
					</view>
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              detailObj.settled_income.order_num || 0
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">支付订单</text>
					</view>
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.settled_income.account_amount || 0, false, true)
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">累计收益</text>
					</view>
				</view>
      </view>
      <view v-else>
        <view class="color-text-less-grey u-font-24 u-line-h-40 u-m-b-8">待入帐</view>
				<view class="price-container--grid u-border-radius u-p-x-24 u-p-y-16">
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              detailObj.will_income.integral_num || 0
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">支付看点</text>
					</view>
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.will_income.exchange_amount, false, true)
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">兑换金额</text>
					</view>
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.will_income.account_amount, false, true)
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">预估收益</text>
					</view>
				</view>
				<view
					class="u-flex-row u-row-between u-col-center color-text-less-grey u-font-24 u-line-h-40 u-m-t-24 u-m-b-8">
					<text>已入账</text>
					<text
						v-if="detailObj.settled_income && detailObj.settled_income.new_income_date">{{ detailObj.settled_income.new_income_date }}</text>
				</view>
				<view class="price-container--grid u-border-radius u-p-x-24 u-p-y-16">
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              detailObj.settled_income.integral_num || 0
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">支付看点</text>
					</view>
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.settled_income.exchange_amount, false, true)
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">兑换金额</text>
					</view>
					<view class="u-flex-col u-row-center">
						<text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.settled_income.account_amount, false, true)
            }}</text>
						<text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40">累计收益</text>
					</view>
				</view>
      </view>

      
    </view>
  </view>
</template>

<script>
import DatePicker from "@/components/base-datepicker/index.vue";
import { unitMoney } from "@/utils/tools.js";
import { mapGetters } from "vuex";
export default {
  props: {
    currentTab: {
      type: Number,
      default: 1,
    },
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
  },
  data() {
    return {};
  },
  computed: {
    ...mapGetters(["account_type"]),
    topTitle() {
      if (this.account_type == 2) {
        return `总收益(元): ${unitMoney(this.detailObj.total_amount, false, true)}`
      } else {
        return "总收益";
      }
    },
  },
  watch: {},
  methods: {
    unitMoney,
    getCardDatePicker(date) {
      console.log(date);
      
      this.$emit("date", date);
    },
  },
};
</script>

<style lang="scss" scoped>
.price-container--grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  align-items: center;
  grid-gap: 32rpx;
  background: #f6f6f6;
}

</style>
