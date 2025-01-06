<template>
  <view class="advertiser-detail-page">
    <view class="u-relative">
      <view class="navbar-box">
        <view
          class="navbar u-p-x-28 u-p-y-16 widthAll u-relative"
          style="background: transparent"
        >
          <u-icon name="arrow-left" size="48rpx" @click="goBack"></u-icon>
          <view
            class="color-text-black u-font-32 u-line-h-48 u-font-bold u-position-center"
            >{{ advertiser_name }}</view
          >
        </view>
      </view>
      <PriceCard :detailObj="detailObj" @date="getTotalDate"/>

      <view class="list-top" :class="{ 'u-p-x-28': account_type == 2 }">
        <view
          class="u-p-24 u-bg-f"
          style="border-top-left-radius: 16rpx; border-top-right-radius: 16rpx"
        >
          <view class="u-flex-row u-col-center">
            <u-search
              class="u-m-r-32"
              placeholder="请输入博主昵称或ID查询"
              v-model.trim="keyword"
              shape="square"
              :showAction="false"
              :inputStyle="{
                height: '72rpx',
                'background-color': '#f6f6f6',
              }"
            ></u-search>
            <DateFilter
              title="请选择查询时间段"
              :type="['list']"
              baseBtn
              :showBottomBtns="false"
              @submit="getDate"
            >
            </DateFilter>
          </view>
          <view
            class="u-flex-row u-row-between u-col-center u-font-24 u-line-h-40 u-m-t-28"
          >
            <text class="color-text-less-grey">查询时间段</text>
            <text class="color-text-less-grey">{{ this.date.join("—") }}</text>
          </view>
        </view>
      </view>
      <TableCard
        v-if="account_type == 1"
        :data="tableData"
        :loading="tableLoading"
      />
      <view v-if="account_type == 2" class="u-p-x-28">
        <listComps
          v-if="!loading && listData.length"
          :listData="listData"
          :static_path="static_path"
        />
        <view v-if="!loading && !listData.length" class="u-m-t-100">
          <u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
        </view>
        <view v-if="!loading && listData.length > 0" class="u-p-b-48">
          <u-loadmore
            :status="status"
            :loading-text="loadingText"
            :loadmore-text="loadmoreText"
            :nomore-text="nomoreText"
          ></u-loadmore>
        </view>
      </view>
    </view>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { unitMoney } from "@/utils/tools.js";
import DateFilter from "@/components/base-datepicker/index.vue";
import PriceCard from "./components/advertiserPriceCard.vue";
import TableCard from "./components/advertiserTable.vue";
import listComps from "./components/advertiserList.vue";
import { getConsultantList, getBloggerList } from '../api/novel/index.js';
import { getAdvertiserTotal } from "../api/demand/advertiserDetail.js";
import { sleep } from "@/utils/tools.js";
import { mapGetters } from "vuex";
export default {
  options: {
    styleIsolation: "shared",
  },
  components: {
    DateFilter,
    PriceCard,
    listComps,
    TableCard,
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

      keyword: "",
      date: [],
      totalDate: [],
      detailObj: {},
      listData: [],
      tableData: [],
      tableLoading: false,
      advertiser_type: null,
      advertiser_name: null,
    };
  },
  computed: {
    ...mapGetters(['account_type', 'image', 'static_path']),
    showTabs() {
      return (
        this.detailObj.amount_types?.length &&
        this.detailObj.amount_types?.length == 2
      );
    },
  },
  methods: {
    unitMoney,

    goBack() {
      uni.navigateBack(-1);
    },

    init() {
      this.toastMsg("加载中", "loading", -1);
      this.isEnd = false;
      this.getTopCard();
      this.getListData();
      this.$refs.toastRef?.close();
      uni.stopPullDownRefresh();
    },

    getTopCard() {
      getAdvertiserTotal({ 
        type: 1, 
        advertiser_type: this.advertiser_type,
        start_date: this.totalDate[0],
        end_date: this.totalDate[1],
      })
        .then((res) => {
          if (res.code == 0) {
            this.detailObj = res.data;
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        });
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
        pagesize: this.pagesize,
        advertiser_type: this.advertiser_type,
        start_date: this.date[0],
        end_date: this.date[1],
      };
      params.page = this.page;
      let func = this.account_type == 1 ? getBloggerList : getConsultantList;
      func(params)
        .then((res) => {
          const list = res.data;
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
        })
        .catch((err) => {
          let message = String(err.message || err || "项目详情获取失败");
          this.toastMsg(message, "error");
        })
        .finally(async () => {
          await sleep(300);
          this.loading = false;
        });
    },

    getDate(date) {
      this.date = date;
      uni.$u.throttle(this.getListData());
    },

    getTotalDate(date) {
      this.totalDate = date;
      uni.$u.throttle(this.getTopCard());
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
  onLoad() {
    const { advertiser_name, advertiser_type } = JSON.parse(
      uni.getStorageSync("SET_JUMP_QUERY")
    );
    this.advertiser_name = advertiser_name || "项目名称";
    this.advertiser_type = advertiser_type || null;
    this.init();
  },
  onPullDownRefresh() {
    this.init();
  },
  onReachBottom() {
    uni.$u.throttle(this.getListData(false), 500);
  },
};
</script>

<style lang="scss" scoped>
.advertiser-detail-page {
  background: linear-gradient(180deg, #d3edff 0%, #f6f7fb 25%);
  min-height: 100vh;
  .navbar-box {
    position: sticky;
    top: 0;
    z-index: 100;
    /* #ifdef APP || MP */
    padding-top: 88rpx;
    /* #endif */
    background: linear-gradient(180deg, #d3edff, #d8eefe);
    .navbar {
      display: flex;
      align-items: center;
      height: 88rpx;
    }
  }
  .list-top {
    position: sticky;
    z-index: 99;
    /* #ifdef APP || MP */
    top: 168rpx;
    /* #endif */
    /* #ifdef H5 */
    top: 86rpx;
    /* #endif */
  }
  .list-content {
    background: #fff;
  }
}
::v-deep .u-search {
  height: 72rpx;
  .u-search__content {
    border-radius: 16rpx !important;
    background-color: #f6f6f6 !important;
  }
}
</style>
