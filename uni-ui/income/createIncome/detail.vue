<template>
  <view class="create-income-detail">
    <view class="top-card u-m-b-28 u-p-x-28 u-m-t-28">
      <view class="u-bg-f u-flex-row u-col-center u-border-radius u-p-24">
        <u--image
          :src="detailObj.collection_cover_url"
          width="132rpx"
          height="188rpx"
          radius="16rpx"
        ></u--image>
        <view class="u-flex-col widthAll u-m-l-16">
          <view class="u-flex-row u-row-between u-col-center u-m-b-16">
            <text class="color-text-black u-line-1 u-font-bold">{{
              detailObj.collection_name || "--"
            }}</text>
            <DatePicker
              title="请选择查询时间段"
              btnHeight="56rpx"
              :type="['list']"
              :showBottomBtns="false"
              @submit="getTopDate"
            />
          </view>
          <BaseSkeleton v-if="cardLoading" height="116rpx" round="16rpx"/>
          <view v-else class="price-card u-border-radius">
            <view class="u-flex-col u-col-center">
              <text class="color-text-black u-font-28 u-line-h-44">{{
                detailObj.order_num || "--"
              }}</text>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >支付订单</text
              >
            </view>
            <view class="u-flex-col u-col-center price-border">
              <text class="color-text-black u-font-28 u-line-h-44">{{
                unitMoney(detailObj.order_amount, false, true)
              }}</text>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >充值金额</text
              >
            </view>
            <view class="u-flex-col u-col-center">
              <text class="color-text-black u-font-28 u-line-h-44">{{
                unitMoney(detailObj.account_amount, false, true)
              }}</text>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >我的收益</text
              >
            </view>
          </view>
        </view>
      </view>
    </view>
    <view class="tabel-navbar u-p-x-28 u-p-t-28 u-p-b-24 u-bg-f">
      <view class="u-flex-row u-col-center">
        <DatePicker
          title="请选择查询时间段"
          :type="tableDateType"
          :baseBtn="false"
          ref="tableDateRef"
          @submit="getTableDate"
        >
          <template #default="{ label, value }">
            <view class="table-date-picker u-flex-row u-col-center">
              <view
                class="u-flex-row u-row-center u-col-center heightAll"
                :class="{
                  'table-date-picker--active': currentTableDateVal == 'default',
                  'table-date-picker--default':
                    currentTableDateVal != 'default',
                }"
                style="width: 230rpx"
                @click="switchTableDate('default')"
              >
                <text class="u-font-24 u-line-h-40 u-m-r-8">{{
                  tableDataBtn.label
                }}</text>
                <u-icon
                  name="arrow-down"
                  size="32rpx"
                  :color="
                    currentTableDateVal == 'default' ? '#ffffff' : '#989898'
                  "
                ></u-icon>
              </view>
              <view
                class="u-flex-row u-row-center u-col-center heightAll"
                :class="{
                  'table-date-picker--active': currentTableDateVal == 'custom',
                  'table-date-picker--default': currentTableDateVal != 'custom',
                }"
                style="width: 230rpx"
                @click="switchTableDate('custom')"
              >
                <text class="u-font-24 u-line-h-40">自定义</text>
              </view>
            </view>
          </template>
        </DatePicker>
        <view class="gap-line u-m-x-32"></view>
        <view
          class="table-config-btn u-flex-row u-row-center u-col-center color-text-black u-font-24 u-line-h-40"
          @click="openSeletedCols"
        >
          <text class="u-m-r-8 u-nowrap">更多数据</text>
          <u-icon name="plus-circle" color="#1a1a1a" size="32rpx"></u-icon>
        </view>
      </view>
      <view class="u-flex-row u-row-between u-col-center u-m-t-16">
        <text class="color-text-less-grey u-font-24 u-line-h-40"
          >查询时间段</text
        >
        <text class="color-text-less-grey u-font-24 u-line-h-40">{{
          showTableDate
        }}</text>
      </view>
    </view>
    <ZbTable
      :columns="columns"
      :highlight="true"
      :data="tableData"
      border
      fit
      :isLoading="tableLoading"
    >
      <template #account_amount="{ row }">
        <text
          class="color-text-primary"
          style="text-decoration: underline"
          @click="openIncomePopup(row)"
          >{{ unitMoney(row.account_amount, false, true) }}</text
        >
      </template>
      <template #source_type="{ row }">
        <text>{{ SOURCE_TYPE_MAPPER[row.source_type] || '产品引流' }}</text>
      </template>
      <template #pay_platform="{ row }">
        <text>{{ PAY_PLATFORM_MAPPER[row.pay_platform] }}</text>
      </template>
      <template #settle_status="{ row }">
        <text>{{ SETTLE_STATUS_MAPPER[row.settle_status] }}</text>
      </template>
    </ZbTable>
    <u-popup :show="showCustomTableCols" round="24rpx">
      <view class="u-p-28" style="display: grid; grid-gap: 32rpx">
        <view class="select-top u-flex-row u-row-between u-col-center">
          <text class="u-font-bold u-font-32 u-line-h-48"
            >自定义查看更多数据</text
          >
          <u-icon
            :name="`${static_path}close_circle_grey.png`"
            size="48rpx"
            @click="closeSeletedCols"
          ></u-icon>
        </view>
        <view class="table-cols-list-btn">
          <view
            v-for="item in listBtns"
            :key="item.name"
            class="u-flex-row u-row-center u-col-center u-p-16 u-border-radius"
            :class="{
              'table-cols-list-btn--default': !selectedCols.includes(item.name),
              'table-cols-list-btn--active': selectedCols.includes(item.name),
            }"
            @click="chooseCol(item)"
          >
            <text class="u-font-24 u-line-h-40">{{ item.label }}</text>
          </view>
        </view>
        <view class="table-cols-bottom-btns u-m-t-64">
          <view
            class="u-flex-row u-row-center u-col-center u-p-y-32"
            @click="resetCols"
          >
            <text class="u-font-28 color-text-less-grey">重置</text>
          </view>
          <view
            class="u-flex-row u-row-center u-col-center u-p-y-32"
            @click="tableColsSubmit"
          >
            <text class="u-font-28 color-text-primary">确定</text>
          </view>
        </view>
      </view>
    </u-popup>
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
      <view class="u-p-x-28 u-m-t-32 u-p-b-28">
        <view class="u-border-radius u-p-28" style="border: 2rpx solid #eeeeee">
          <view class="u-flex-row u-row-between u-col-center u-m-b-16">
            <view class="u-flex-row u-col-center">
              <u--image
                :src="currentIncome.app_icon"
                radius="8rpx"
                width="32rpx"
                height="32rpx"
                class="u-m-r-8"
              ></u--image>
              <text class="color-text-black u-font-24 u-line-h-40">{{
                currentIncome.app_name || "--"
              }}</text>
            </view>
            <view
              class="settle-tag u-p-x-8"
              :class="{
                'settle-tag--primary': currentIncome.settle_status == 2,
                'settle-tag--warning': currentIncome.settle_status == 1,
                'settle-tag--danger': currentIncome.settle_status == 3,
              }"
            >
              <text class="u-font-22 u-line-h-40">{{ SETTLE_STATUS_MAPPER[currentIncome.settle_status] }}</text>
            </view>
          </view>
          <view class="u-flex-row u-row-between u-col-center u-m-b-16">
            <view class="u-flex-row u-col-center">
              <u--image
                :src="`${static_path}flow_type_icon.png`"
                width="32rpx"
                height="32rpx"
                class="u-m-r-8"
              ></u--image>
              <text class="color-text-less-grey u-font-24 u-line-h-40"
              >流量类型</text>
            </view>
            <text class="color-text-less-grey u-font-24 u-line-h-40">{{
              SOURCE_TYPE_MAPPER[currentIncome.source_type] || '产品引流'
            }}</text>
          </view>
          <view class="u-flex-row u-row-between u-col-center u-m-b-16">
            <view class="u-flex-row u-col-center">
              <u--image
                :src="`${static_path}pay_platform_icon.png`"
                width="32rpx"
                height="32rpx"
                class="u-m-r-8"
              ></u--image>
              <text class="color-text-less-grey u-font-24 u-line-h-40">支付平台</text>
            </view>
            <text class="color-text-less-grey u-font-24 u-line-h-40">{{
              PAY_PLATFORM_MAPPER[currentIncome.pay_platform]
            }}</text>
          </view>
          <view class="income-popup-grid u-p-y-16 widthAll u-border-radius">
            <view class="u-flex-col u-col-center">
              <text class="color-text-black u-font-28 u-line-h-44">{{
                unitMoney(currentIncome.order_amount, false, true)
              }}</text>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >充值金额</text
              >
            </view>
            <view class="u-flex-col u-col-center channel_rate">
              <view class="u-flex-row u-col-center">
                <u-icon
                  :name="pay_icon_mapper[currentIncome.pay_platform]"
                  size="28rpx"
                  color="#1A1A1A"
                ></u-icon>
                <text class="color-text-black u-m-l-8 u-font-28 u-line-h-44">{{
                  unitRate(currentIncome.platform_rate)
                }}</text>
              </view>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >通道费率</text
              >
            </view>
            <view class="u-flex-col u-col-center price-border">
              <text class="color-text-black u-font-28 u-line-h-44">{{
                unitRate(currentIncome.account_ratio)
              }}</text>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >分成比例</text
              >
            </view>
            <view class="u-flex-col u-col-center">
              <text class="color-text-black u-font-28 u-line-h-44">{{
                unitMoney(currentIncome.account_amount, false, true)
              }}</text>
              <text class="color-text-less-grey u-font-22 u-line-h-40"
                >我的收益</text
              >
            </view>
          </view>
        </view>
      </view>
    </u-popup>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { unitMoney, unitRate, sleep } from "@/utils/tools.js";
import BaseSkeleton from "@/components/base-skeleton/index.vue";
import DatePicker from "@/components/base-datepicker/index.vue";
import { getCreateDetailTotal, getCreateDetailList } from "../api/create/index.js";
import ZbTable from "../components/zb-table/components/zb-table/zb-table.vue";
import { mapGetters } from "vuex";
import { PAY_PLATFORM_MAPPER, SETTLE_STATUS_MAPPER, SOURCE_TYPE_MAPPER } from '@/utils/mappers/public.js';
export default {
  components: {
    BaseSkeleton,
    DatePicker,
    ZbTable,
  },
  data() {
    return {
      PAY_PLATFORM_MAPPER,
      SETTLE_STATUS_MAPPER,
      SOURCE_TYPE_MAPPER,
      columns: [
        {
          name: "date",
          label: "日期",
          align: "left",
          fixed: true,
        },
        {
          name: "order_num",
          label: "支付订单",
          align: "center",
          fixed: false,
        },
        {
          name: "order_amount",
          label: "充值金额",
          align: "center",
          fixed: false,
          type: "price",
          unit: false,
          thousand: true,
        },
        {
          name: "account_amount",
          label: "我的收益",
          align: "center",
          fixed: false,
          type: "custom",
          slots: { customRender: "account_amount" },
        },
      ],
      storeCols: [],
      tableData: [],
      topDate: [],
      currentTableDateVal: "default",
      tableDateType: ["quick"],
      tableDate: [],
      detailObj: {},
      tableLoading: false,
      tableDataBtn: {
        label: "近三月",
        value: "",
      },
      showCustomTableCols: false,
      listBtns: [
        {
          label: "小程序",
          name: "app_name",
          align: "center",
          fixed: false,
        },
        {
          label: "流量类型",
          name: "source_type",
          align: "center",
          fixed: false,
          type: "custom",
          slots: { customRender: 'source_type' }
        },
        {
          label: "支付平台",
          name: "pay_platform",
          align: "center",
          fixed: false,
          type: "custom",
          slots: { customRender: 'pay_platform' }
        },
        {
          label: "结算流程",
          name: "settle_status",
          align: "center",
          fixed: false,
          type: "custom",
          slots: { customRender: 'settle_status' }
        },
      ],
      selectedCols: [],
      myIncomePopup: false,
      currentIncome: {},
      collection_id: null,
      pay_icon_mapper: {
        'ALIPAY': 'zhifubao-circle-fill',
        'WXPAY': 'weixin-circle-fill',
        'BANK': 'coupon-fill',
      },

      cardLoading: false,
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",
      page: 1,
      pagesize: 20,
      site: null,
      loading: false,
      isEnd: false,
    };
  },
  computed: {
    ...mapGetters(['static_path', 'image']),
    showTableDate() {
      const newList = [...new Set(this.tableDate)]
      return newList.map(el => el.replace(/\-/g, ".")).join(" - ")
    }
  },
  watch: {},
  methods: {
    unitRate,
    unitMoney,
    getTopDate(date) {
      this.topDate = date;
      this.getDetail();
    },

    getTableDate(date, item) {
      if (item.value != "custom") {
        this.tableDataBtn = item;
      }
      this.tableDate = date;
      this.getCreateTable();
    },

    switchTableDate(type) {
      this.$refs.tableDateRef.switchComps();
      switch (type) {
        case "default":
          this.currentTableDateVal = "default";
          this.tableDateType = ["quick"];
          break;
        case "custom":
          this.currentTableDateVal = "custom";
          this.tableDateType = ["custom"];
          break;
      }
    },

    init() {
      this.isEnd = false;
      this.storeCols = this.columns;
      this.toastMsg("加载中", "loading", -1);
      this.getDetail();
      this.getCreateTable();
      this.$refs.toastRef?.close();
      uni.stopPullDownRefresh();
    },

    getCreateTable(reset = true) {
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
        date: this.date,
        pagesize: this.pagesize,
        collection_id: this.collection_id,
        start_date: this.tableDate[0],
        end_date: this.tableDate[1],
      };
      params.page = this.page;
      getCreateDetailList(params)
        .then((res) => {
          if (res.code == 0) {
            this.tableData = res.data.list;
            this.tableLoading = false;
          }
        })
        .catch((error) => {
          this.tableLoading = false;
          this.toastMsg(error, "error");
        });
    },

    getDetail() {
      this.cardLoading = true;
      getCreateDetailTotal({ 
        collection_id: this.collection_id,
        start_date: this.topDate[0],
        end_date: this.topDate[1]
      })
        .then((res) => {
          if (res.code == 0) {
            this.detailObj = res.data;
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        })
        .finally(async () => {
          await sleep(300);
          this.cardLoading = false;
        })
    },

    openSeletedCols() {
      this.showCustomTableCols = true;
    },

    closeSeletedCols() {
      this.showCustomTableCols = false;
    },

    tableColsSubmit() {
      if (!this.selectedCols.length) {
        return this.toastMsg("请选择数据项", "error");
      }
      this.tableLoading = true;
      const newSelected = this.listBtns.filter((el) =>
        this.selectedCols.includes(el.name)
      );
      this.columns = this.storeCols;
      this.columns = [...this.columns, ...newSelected];
      console.log(this.columns)
      this.tableLoading = false;
      this.closeSeletedCols();
    },

    resetCols() {
      this.tableLoading = true;
      this.columns = this.storeCols;
      this.selectedCols = []; // 清空已选中的列
      this.tableLoading = false;
      this.closeSeletedCols();
    },

    chooseCol(item) {
      const index = this.selectedCols.indexOf(item.name);
      if (index === -1) {
        // 如果不存在，则添加
        this.selectedCols.push(item.name);
      } else {
        // 如果已存在，则删除
        this.selectedCols.splice(index, 1);
      }
    },

    openIncomePopup(row) {
      this.currentIncome = row;
      this.myIncomePopup = true;
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
  onLoad({ collection_id }) {
    this.collection_id = collection_id;
    this.init();
  },
  onPullDownRefresh() {
    this.init();
  },
  onReachBottom() {
    uni.$u.throttle(this.getCreateTable(false), 500);
  },
};
</script>

<style lang="scss" scoped>
.create-income-detail {
  min-height: 100vh;
  .table-date-picker {
    width: 460rpx;
    height: 64rpx;
    background: #f6f6f6;
    border-radius: 100px;
    &--active {
      color: #fff;
      background: $u-primary;
      border-radius: 100px;
    }
    &--default {
      color: $u-grey-7;
      background: #f6f6f6;
      border-radius: 100px;
    }
  }
  .table-config-btn {
    width: 168rpx;
    height: 64rpx;
    background: #f6f6f6;
    border-radius: 100px;
  }
  .price-card {
    padding: 16rpx;
    border: 1px solid #eeeeee;
    background: #f6f6f6;
    display: grid;
    grid-template-columns: repeat(3, 3fr);
  }
  .price-border {
    position: relative;
    &::after {
      content: "";
      position: absolute;
      top: 50%;
      left: 8rpx;
      width: 1rpx;
      height: 16rpx;
      background: #c6c6c6;
    }
    &::before {
      content: "";
      position: absolute;
      top: 50%;
      right: 8rpx;
      width: 1rpx;
      height: 16rpx;
      background: #c6c6c6;
    }
  }
}
.channel_rate {
  position: relative;
  &::after {
    content: "";
    position: absolute;
    top: 50%;
    left: 8rpx;
    width: 1rpx;
    height: 16rpx;
    background: #c6c6c6;
  }
}
.table-cols-list-btn {
  display: grid;
  grid-gap: 16rpx;
  &--default {
    background: #f6f6f6;
    color: #3c3c3c;
  }
  &--active {
    background: #ecf4ff;
    color: $u-primary;
  }
}
.table-cols-bottom-btns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-items: center;
  align-items: center;
}
.income-popup-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  justify-self: center;
  align-items: center;
  background: #f6f6f6;
}
.settle-tag {
  &--primary {
    background: #ecf4ff;
    color: $u-primary;
  }
  &--warning {
    background: #fff5ee;
    color: $u-orange-6;
  }
  &--danger {
    background: #ffebef;
    color: $u-red-6;
  }
}
</style>
