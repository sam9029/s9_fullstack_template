<template>
  <view class="list-content u-p-x-24">
    <view
      v-for="(item, index) in listData"
      :key="item.id"
      class="list-item"
      :class="{ 'u-p-y-32': needPadding }"
      :style="{
        'border-bottom':
          index != listData.length - 1 && !noBorderBottom
            ? '1rpx solid #eee'
            : 'none',
      }"
      @click="goDetail(item)"
    >
      <view class="u-flex-row u-col-top">
        <view
          v-if="item.amount_type == 1"
          class="u-flex-col u-row-center u-m-r-16"
        >
          <u--image
            :src="`${static_path}public_income_icon.png`"
            width="104rpx"
            height="104rpx"
          ></u--image>
          <text
            class="u-font-24 u-font-bold u-line-h-40 color-text-black u-m-t-8 u-text-center"
            >发布收益</text
          >
        </view>
        <view
          v-if="item.amount_type == 2"
          class="u-flex-col u-row-center u-m-r-16"
        >
          <u--image
            :src="`${static_path}public_commission_icon.png`"
            width="104rpx"
            height="104rpx"
          ></u--image>
          <text
            class="u-font-24 u-font-bold u-line-h-40 color-text-black u-m-t-8 u-text-center"
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
                `(ID:${item.blogger_id || account_id})`
              }}</text>
            </view>
            <u-icon
              v-if="showArrow"
              name="arrow-right"
              size="32rpx"
              color="#3c3c3c"
            ></u-icon>
          </view>
          <view class="u-border-radius list-item-price-card">
            <view class="u-flex-col">
              <text
                class="color-text-black u-font-28 u-line-h-44 u-font-bold"
                >{{ item.keyword_count }}</text
              >
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >关键词数量</text
              >
            </view>
            <view class="u-flex-col u-col-center price-border">
              <text
                class="color-text-black u-font-28 u-line-h-44 u-font-bold"
                >{{ item.settle_count }}</text
              >
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >结算总量</text
              >
            </view>
            <view class="u-flex-col u-col-bottom">
              <text
                class="color-text-black u-font-28 u-line-h-44 u-font-bold"
                >{{ unitMoney(item.amount, false, true) }}</text
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
    noBorderBottom: {
      type: Boolean,
      default: false,
    },
    needPadding: {
      type: Boolean,
      default: true,
    },
    showArrow: {
      type: Boolean,
      default: true,
    },
  },
  components: {},
  data() {
    return {};
  },
  computed: {
    ...mapGetters(['account_type', 'account_id'])
  },
  watch: {},
  methods: {
    unitMoney,
    goDetail(item) {
      uni.setStorageSync(
				"NOVEL_AD_DETAIL_TO_INCOME_DETAIL",
				JSON.stringify(item)
			);
      uni.navigateTo({
        url: `/income/novelIncome/incomeDetail?blogger_id=${item.blogger_id}&amount_type=${item.amount_type}`,
      });
    },
  },
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
</style>
