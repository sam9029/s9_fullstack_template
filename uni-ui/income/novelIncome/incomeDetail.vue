<template>
  <view class="income-detail-page">
    <view class="u-p-28 top-card">
      <view class="u-bg-f u-border-radius u-p-24">
        <view class="u-flex-row u-col-top">
          <view
            v-if="currentObj.amount_type == 1"
            class="u-flex-col u-row-center u-m-r-16"
          >
            <u--image
              :src="`${static_path}public_income_icon.png`"
              width="104rpx"
              height="104rpx"
            ></u--image>
            <text
              class="u-font-24 u-font-bold u-line-h-40 color-text-black u-m-t-8"
              >发布收益</text
            >
          </view>
          <view
            v-if="currentObj.amount_type == 2"
            class="u-flex-col u-row-center u-m-r-16"
          >
            <u--image
              :src="`${static_path}public_commission_icon.png`"
              width="104rpx"
              height="104rpx"
            ></u--image>
            <text
              class="u-font-24 u-font-bold u-line-h-40 color-text-black u-m-t-8"
              >发布佣金</text
            >
          </view>
          <view class="u-flex-col widthAll">
            <view class="u-flex-row u-row-between u-col-center u-m-b-8">
              <view class="u-flex-row u-col-bottom">
                <text
                  class="color-text-black u-font-bold u-font-28 u-line-h-44"
                  >{{ currentObj.blogger_name }}</text
                >
                <text class="color-text-less-grey u-font-24 u-line-h-44">{{
                  `(ID:${currentObj.blogger_id})`
                }}</text>
              </view>
            </view>
            <view class="u-border-radius list-item-price-card">
              <view class="u-flex-col">
                <text
                  class="color-text-black u-font-28 u-line-h-44 u-font-bold"
                  >{{ currentObj.keyword_count }}</text
                >
                <text class="color-text-less-grey u-font-22 u-line-h-40"
                  >关键词数量</text
                >
              </view>
              <view class="u-flex-col u-col-center price-border">
                <text
                  class="color-text-black u-font-28 u-line-h-44 u-font-bold"
                  >{{ currentObj.settle_count }}</text
                >
                <text class="color-text-less-grey u-font-22 u-line-h-40"
                  >结算总量</text
                >
              </view>
              <view class="u-flex-col u-col-bottom">
                <text
                  class="color-text-black u-font-28 u-line-h-44 u-font-bold"
                  >{{ unitMoney(currentObj.amount, false, true) }}</text
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
    <view class="u-bg-f heightAll" style="border-top-left-radius: 16rpx; border-top-right-radius: 16rpx;overflow: hidden;">
      <ZbTable
        :columns="columns"
        highlight
        :data="tableData"
        :stripe="false"
        fit
        :isLoading="tableLoading"
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
    </view>
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
            class="table-grid"
            style="
              background: #f6f6f6;
              border-top-left-radius: 16rpx;
              border-top-right-radius: 16rpx;
            "
          >
            <text class="color-text-black u-font-24 u-line-h-40 u-font-bold"
              >结算类型</text
            >
            <text class="color-text-black u-font-24 u-line-h-40 u-font-bold"
              >结算量</text
            >
            <text class="color-text-black u-font-24 u-line-h-40 u-font-bold"
              >结算单价</text
            >
            <text class="color-text-black u-font-24 u-line-h-40 u-font-bold"
              >我的收益</text
            >
          </view>
          
          <view 
            v-for="(item, index) in popupData" 
            :key="index" 
            class="table-grid" 
            style="border-bottom: 2rpx solid #eee"
          >
            <text class="color-text-black u-font-24 u-line-h-40">{{ item.name }}</text>
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
import { getConsultantDef } from "../api/novel/index.js";
import ZbTable from "../components/zb-table/components/zb-table/zb-table.vue";
import { mapGetters } from "vuex";
export default {
  props: {},
  components: {
    ZbTable,
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

      myIncomePopup: false,
      columns: [
        {
          name: "date",
          label: "日期",
          align: "center",
          fixed: true,
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
          type: 'needFetch'
        },
        {
          name: "edit_lahuo",
          label: "拉失活量",
          align: "center",
          sorter: true,
          type: 'needFetch'
        },
        {
          name: "amount",
          label: "我的收益",
          align: "center",
          type: "custom",
          slots: { customRender: "amount" },
          sorter: true,
        },
      ],
      currentObj: {},
      tableData: [],
      tableLoading: false,
      blogger_id: null,
      amount_type: null,
      advertiser_type: null,
      popupData: [],
    };
  },
  computed: {
    ...mapGetters(["account_type", "static_path", "image"]),
  },
  watch: {},
  methods: {
    unitMoney,
    unitRate,
    openIncomePopup(row) {
      this.popupData = row.settle_list;
      this.myIncomePopup = true;
    },

    init() {
      this.isEnd = false;
      this.getTable();
    },

    getTable(reset = true) {
      if (this.tableLoading) return;
      reset && (this.tableLoading = true);
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
        pagesize: this.pagesize,
        advertiser_type: this.advertiser_type,
        blogger_id: this.blogger_id,
        amount_type: this.amount_type,
      };
      params.page = this.page;
      this.toastMsg("加载中", "loading", -1);
      getConsultantDef(params)
        .then((res) => {
          const list = res.data;
          if (reset) this.tableData = list;
          else this.tableData.push(...list);
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
        .catch((error) => {
          this.toastMsg(error.message || error, "error");
        })
        .finally(() => {
          uni.stopPullDownRefresh();
          this.tableLoading = false;
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
  onLoad({ blogger_id, amount_type }) {
    const { advertiser_type } = JSON.parse(
      uni.getStorageSync("SET_JUMP_QUERY")
    );
    this.currentObj = JSON.parse(
      uni.getStorageSync("NOVEL_AD_DETAIL_TO_INCOME_DETAIL")
    );
    this.advertiser_type = advertiser_type;
    this.blogger_id = blogger_id;
    this.amount_type = amount_type;
    this.init();
  },

  onPullDownRefresh() {
    this.init();
  },
  onReachBottom() {
    uni.$u.throttle(this.getTable(false), 500);
  },
};
</script>

<style lang="scss" scoped>
.income-detail-page {
  height: 100vh;
}
.table-grid {
  height: 88rpx;
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  padding: 0 28rpx;
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
.list-item-price-card {
  padding: 8rpx 16rpx;
  border: 1px solid #eeeeee;
  background: #f6f6f6;
  display: grid;
  grid-template-columns: repeat(3, 3fr);
}
::v-deep .zb-table-applet .zb-table-header .item-th {
  background: #fff;
}
</style>
