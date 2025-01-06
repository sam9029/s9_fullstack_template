<template>
  <view class="list-content u-p-x-24">
    <view
      v-for="(item, index) in listData"
      :key="item.id"
      class="list-item u-p-y-32"
      :style="{
        'border-bottom':
          index != listData.length - 1 ? '2rpx solid #eee' : 'none',
      }"
      @click="goDetail(item)"
    >
      <view class="u-flex-col" v-if="type == 0">
        <view class="u-flex-row u-col-center u-m-b-16">
          <u--image
            :src="item.drama_cover_url || `${static_path}drama_empty_icon.png`"
            radius="16rpx"
            width="104rpx"
            height="104rpx"
          ></u--image>
          <view class="u-flex-col u-row-between u-m-l-16 widthAll">
            <view class="u-flex-row u-row-between u-col-center">
              <view class="u-flex-row u-col-center">
                <view
                  class="color-text-white u-flex-row u-row-center u-col-center u-m-r-8"
                  style="
                    width: 56rpx;
                    height: 36rpx;
                    border-radius: 8rpx;
                    background: #408cff;
                  "
                >
                  <text class="u-font-22 u-line-h-34">计划</text>
                </view>
                <text
                  class="color-text-black u-font-28 u-line-h-44 u-line-1 u-font-bold"
                  >{{ item.plan_name || "--" }}</text
                >
              </view>
              <u-icon name="arrow-right" size="32rpx"></u-icon>
            </view>
            <view class="u-flex-row u-col-center">
              <u--image
                :src="item.advertiser_icon"
                width="32rpx"
                height="32rpx"
                radius="8rpx"
              ></u--image>
              <text
                class="color-text-less-black u-font-28 u-line-h-44 u-m-l-8"
                >{{ item.drama_name || "--" }}</text
              >
            </view>
          </view>
        </view>
        <view class="list-item-price-card u-border-radius">
          <view class="u-flex-col u-col-center">
            <text class="color-text-black u-font-28 u-line-h-44 u-font-bold">{{
              item.order_num || "--"
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >支付订单</text
            >
          </view>
          <view class="u-flex-col u-col-center price-border">
            <text class="color-text-black u-font-28 u-line-h-44 u-font-bold">{{
              unitMoney(item.charge_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >充值金额</text
            >
          </view>
          <view class="u-flex-col u-col-center">
            <text class="color-text-black u-font-28 u-line-h-44 u-font-bold">{{
              unitMoney(item.total_amount, false, true)
            }}</text>
            <text class="color-text-less-grey u-font-22 u-line-h-40"
              >我的收益</text
            >
          </view>
        </view>
      </view>
      <view class="u-flex-row u-col-top" v-else>
        <view class="u-flex-col u-row-center u-col-center u-m-r-16">
          <u--image
            :src="`${static_path}public_commission_icon.png`"
            width="104rpx"
            height="104rpx"
          ></u--image>
          <text
            class="u-font-24 u-line-h-40 color-text-black u-m-t-8 u-font-bold"
            >发布佣金</text
          >
        </view>
        <view class="u-flex-col widthAll">
          <view class="u-flex-row u-row-between u-col-center u-m-b-8">
            <view class="u-flex-row u-col-bottom">
              <text
                class="color-text-black u-font-bold u-font-28 u-line-h-44"
                >{{ item.blogger_name }}</text
              >
              <text class="color-text-less-grey u-font-24 u-line-h-44">{{
                `(ID:${item.blogger_id})`
              }}</text>
            </view>
            <u-icon name="arrow-right" size="32rpx" color="#3c3c3c"></u-icon>
          </view>
          <view class="u-border-radius list-item-price-card">
            <view class="u-flex-col">
              <text
                class="color-text-black u-font-28 u-line-h-44 u-font-bold"
                >{{ item.order_num }}</text
              >
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >剧集</text
              >
            </view>
            <view class="u-flex-col u-col-center price-border">
              <text
                class="color-text-black u-font-28 u-line-h-44 u-font-bold"
                >{{ unitMoney(item.blogger_amount, false, true) }}</text
              >
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >达人收益</text
              >
            </view>
            <view class="u-flex-col u-col-bottom">
              <text
                class="color-text-black u-font-28 u-line-h-44 u-font-bold"
                >{{ unitMoney(item.total_amount, false, true) }}</text
              >
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >我的收益</text
              >
            </view>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script>
import { unitMoney } from "@/utils/tools.js";
import { mapGetters } from "vuex";
export default {
  props: {
    item: {
      type: Object,
      default: () => {},
    },
    index: {
      type: Number,
      default: 0,
    },
    static_path: {
      type: String,
      default: "",
    },
    listData: {
      type: Array,
      default: () => [],
    },
    type: {
      type: Number,
      default: 0,
    },
    advertiserType: {
      type: Number,
      default: 0,
    },
    date: {
      type: Array,
      default: ()=>[],
    }
  },
  components: {},
  data() {
    return {};
  },
  computed: {
    ...mapGetters(['account_type'])
  },
  methods: {
    unitMoney,
    goDetail(item) {
      let params = {
        advertiserType: this.advertiserType,
        incomeType: this.type == 0 ? 1 : 2,
        start_date: this.date[0],
        end_date: this.date[1],
      } 
      if (this.type == 0) {
        params['planId'] = item.plan_id;
      } else {
        params['bloggerId'] = item.blogger_id;
      }
      console.log(params);
      let queryUrl = uni.$u.queryParams(params);
      
      uni.navigateTo({
        url: "/income/demandIncome/incomeTable" + queryUrl,
      });
    },
  },
  mounted() {},
};
</script>

<style lang="scss" scoped>
.list-item-price-card {
  padding: 8rpx 16rpx;
  border: 1px solid #eeeeee;
  background: #f6f6f6;
  display: grid;
  grid-template-columns: repeat(3, 3fr);
}
.list-content {
  background: #fff;
}
.price-border {
  position: relative;
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 8rpx;
    width: 2rpx;
    height: 16rpx;
    background: #c6c6c6;
  }
  &::before {
    content: "";
    position: absolute;
    top: 50%;
    right: 8rpx;
    width: 2rpx;
    height: 16rpx;
    background: #c6c6c6;
  }
}
</style>
