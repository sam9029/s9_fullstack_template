<template>
  <view class="advertiser-price-card u-p-x-28">
    <view class="u-bg-f u-border-radius u-p-24">
      <view v-show="currentTab == 0">
        <view class="u-font-bold u-font-32 u-line-h-48">收益总览</view>
        <view class="price-container u-p-y-16 u-p-x-24 u-border-radius u-flex-row u-m-t-24">
        <view class="u-flex-col u-row-center u-flex-1">
          <text class="u-font-bold u-font-32 u-line-h-48"> 
            {{unitMoney(detailObj.charge_amount, false, true)}}
          </text>
          <text class="color-text-less-grey u-font-22 u-line-h-40">
            充值金额
          </text>
        </view>
        <view class="u-flex-col u-row-center  u-flex-1">
          <text class="u-font-bold u-font-32 u-line-h-48"> 
            {{detailObj.order_num || 0}}
          </text>
          <text class="color-text-less-grey u-font-22 u-line-h-40">
            支付订单
          </text>
        </view>
        <view class="u-flex-col u-row-center  u-flex-1">
          <text class="u-font-bold u-font-32 u-line-h-48"> 
            {{unitMoney(detailObj.publish_amount, false, true)}}
          </text>
          <text class="color-text-less-grey u-font-22 u-line-h-40">
            预估收益
          </text>
        </view>
      </view>
      </view>
      <view v-show="currentTab == 1">
        <view class="u-flex-row u-row-between u-rol-top">
          
          <view class="u-font-bold u-font-32 u-line-h-48">{{topTitle}}</view>
          <DatePicker
            :showBottomBtns="false"
            :type="['list']"
            btnHeight="56rpx"
            class="u-m-l-32"
            @submit="getCardDatePicker"
          />
        </view>
        <template v-if="account_type == 2">
          <view class="u-flex-row u-col-center u-m-t-12">
            <view class="u-flex-col u-row-center widthAll">
              <view class="u-flex-row u-row-between u-font-24 u-line-h-40   u-m-b-8 color-text-less-grey">
                <text>新增入账</text>
                <text >{{`最新结算日：${detailObj.new_income_date || '--'}`}}</text>
              </view>
              <view
                class="price-container--grid u-p-y-16 u-p-x-24 u-border-radius"
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
              >累计入账</text
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

          <view class="u-flex-row u-row-between u-font-24 u-line-h-40 u-m-t-24   u-m-b-8 color-text-less-grey">
            <text>新增入账</text>
            <text >{{`最新结算日：${detailObj.new_income_date || '--'}`}}</text>
          </view>

          <view
            class="un-posted--blogger u-border-radius u-p-x-24 u-p-y-16"
          >
            <view class="u-flex-col u-row-center">
              <text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
                unitMoney(detailObj.new_date_charge_amount, false, true)
              }}</text>
              <text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40"
                >充值金额</text
              >
            </view>
            <view class="u-flex-col u-row-center">
              <text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
                      detailObj.new_date_charge_order_num || 0
                    }}</text>
              <text class="u-line-1  color-text-less-grey u-font-22 u-line-h-40"
                >支付订单</text
              >
            </view>
            <view class="u-flex-col u-row-center">
              <text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
                unitMoney(detailObj.new_income_publish_amount, false, true)
              }}</text>
              <text class="u-line-1  color-text-less-grey u-font-22 u-line-h-40"
                >新增发布收益</text
              >
            </view>
          </view>
          <view
            class="color-text-less-grey u-font-24 u-line-h-40 u-m-t-24 u-m-b-8 u-flex-row u-col-center u-row-between"
          >
          已结算
          </view>
          <view
            class="un-posted--blogger u-border-radius u-p-x-24 u-p-y-16"
          >
          <view class="u-flex-col u-row-center">
              <text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
                    unitMoney(detailObj.charge_amount, false, true)
                  }}
                </text>
              <text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40"
                >充值金额</text
              >
            </view>
            <view class="u-flex-col u-row-center">
              <text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
                      detailObj.charge_order_num || 0
                    }}
                  </text>
              <text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40"
                >支付订单</text
              >
            </view>
            <view class="u-flex-col u-row-center">
              <text class="u-line-1 u-font-bold u-font-32 u-line-h-48">{{
                  unitMoney(detailObj.publish_amount, false, true)
                }}
              </text>
              <text class="u-line-1 color-text-less-grey u-font-22 u-line-h-40"
                >累计发布收益</text
              >
            </view>
          </view>
        </template>
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
