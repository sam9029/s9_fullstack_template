<template>
  <view class="advertiser-table">
    <ZbTable
      :columns="columns"
      :data="data"
      highlight
      :stripe="false"
      fit
      :isLoading="loading"
    >
      <template #amount="{ row }">
        <text
          class="color-text-primary"
          style="text-decoration: underline"
          @click="openIncomePopup(row)"
          >{{ unitMoney(row.amount, false, true) }}</text
        >
      </template>
    </ZbTable>
    <u-popup :show="myIncomePopup" round="16rpx">
      <view class="u-p-28" style="display: grid; grid-gap: 32rpx">
        <view class="select-top u-flex-row u-row-between u-col-center">
          <text class="u-font-bold u-font-32 u-line-h-48">我的收益明细</text>
          <u-icon
            :name="`${static_path}close_circle_grey.png`"
            size="48rpx"
            @click="myIncomePopup = false"
          ></u-icon>
        </view>
      </view>
      <view class="u-p-28">
        <view class="u-border-radius" style="border: 2rpx solid #eeeeee">
          <view
            v-for="(item, index) in currentIncome"
            :key="index"
            class="table-grid"
            style="border-bottom: 2rpx solid #eee"
          >
            <text class="color-text-black u-font-24 u-line-h-40">{{
              item.name
            }}</text>
            <text class="color-text-black u-font-24 u-line-h-40">{{
              item.count || 0
            }}</text>
            <text v-if="item.name == '总计'"></text>
            <text v-else class="color-text-black u-font-24 u-line-h-40">{{
              unitMoney(item.price, true)
            }}</text>
            <text class="color-text-black u-font-24 u-line-h-40">{{
              unitMoney(item.amount, true)
            }}</text>
          </view>
        </view>
      </view>
    </u-popup>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { unitMoney, unitRate, sleep } from "@/utils/tools.js";
import ZbTable from "../../components/zb-table/components/zb-table/zb-table.vue";
import { mapGetters } from "vuex";
export default {
  props: {
    data: {
      type: Array,
      default: () => [],
    },
    loading: {
      type: Boolean,
      default: false,
    },
  },
  components: {
    ZbTable,
  },
  data() {
    return {
      tableLoading: false,
      columns: [
        {
          name: "date",
          label: "日期",
          align: "center",
        },
        {
          name: "keyword_name",
          label: "关键词",
          align: "center",
        },
        {
          name: "edit_laxin",
          label: "拉新量",
          align: "center",
          sorter: true,
        },
        {
          name: "edit_lahuo",
          label: "拉失活量",
          align: "center",
          sorter: true,
        },
        {
          name: "amount",
          label: "我的收益",
          align: "center",
          type: "price",
          unit: false,
          thousand: true,
          sorter: true,
          type: "custom",
          slots: { customRender: "amount" },
        },
      ],
      currentIncome: [],
      myIncomePopup: false,
    };
  },
  computed: {
    ...mapGetters(["account_type", "static_path"]),
  },
  methods: {
    unitMoney,
    unitRate,
    openIncomePopup(row) {
      this.currentIncome = row.settle_list;
      this.myIncomePopup = true;
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.table-grid {
  height: 88rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  padding: 0 28rpx;
}
</style>
