<template>
  <view class="advertiser-price-card u-p-x-28 u-m-t-28">
    <view class="u-bg-f u-border-radius u-p-24 u-m-b-24">
      <view class="u-flex-row u-row-between u-rol-top">
        <view class="u-font-bold u-font-32 u-line-h-48">{{
          `总收益(元): ${unitMoney(detailObj.total_amount, false, true)}`
        }}</view>
        <DatePicker 
          :showBottomBtns="false" 
          :type="['list']" 
          btnHeight="56rpx"
          @submit="getCardDatePicker" 
        />
      </view>
      <view class="color-text-less-grey u-font-22 u-line-h-40 u-m-b-24">{{
        `最新结算日: ${detailObj.new_income_date || "--"}`
      }}</view>
      <view class="un-posted u-border-radius u-p-x-24 u-p-y-16 u-m-b-24">
        <view class="u-flex-col u-row-center">
          <template v-if="account_type == 1">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              detailObj.new_convert_num
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
            >新增转化量</text>
          </template>
          <template v-else>
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.new_income_publish_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >新增发布收益</text>
          </template>
        </view>
        <view class="u-flex-col u-row-center">
          <template v-if="account_type == 1">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.new_income_publish_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
            >新增发布收益</text>
          </template>
          <template v-else>
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.new_income_service_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >新增发布佣金</text
            >
          </template>
        </view>
      </view>
      <view class="un-posted u-border-radius u-p-x-24 u-p-y-16">
        <view class="u-flex-col u-row-center">
          <template v-if="account_type == 1">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              detailObj.total_convert_num
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >累计转化量</text
            >
          </template>
          <template v-else>
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.publish_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >累计发布收益</text
            >
          </template>
        </view>
        <view class="u-flex-col u-row-center">
          <template v-if="account_type == 1">
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.publish_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >累计发布收益</text
            >
          </template>
          <template v-else>
            <text class="u-font-bold u-font-32 u-line-h-48">{{
              unitMoney(detailObj.service_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
            >累计发布佣金</text>
          </template>
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
    detailObj: {
      type: Object,
      default: () => ({}),
    },
  },
  components: {
    DatePicker,
  },
  data() {
    return {};
  },
  computed: {
    ...mapGetters(['account_type'])
  },
  watch: {},
  methods: {
    unitMoney,
    getCardDatePicker(date) {
      this.$emit('date', date)
    },
  },
  mounted() {},
};
</script>

<style lang="scss" scoped>
.un-posted {
  background: #f6f6f6;
  display: grid;
  grid-auto-flow: column;
  align-items: center;
}
</style>
