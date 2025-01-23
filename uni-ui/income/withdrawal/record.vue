<template>
  <view class="page-box">
    <view class="top-area">
      <MyNavbar :backDelta="backDelta" bgColor="transparent">
        <template #navbarData>
          <view class="u-flex-row u-row-center u-col-center">
            <text class="u-text-center u-font-32 color-text-black u-font-bold"
              >提现记录</text
            >
          </view>
        </template>
      </MyNavbar>

      <view
        class="top-card u-flex-col u-row-left u-p-32 u-m-l-28 u-m-r-28 u-m-t-28 color-text-white u-border-radius"
      >
        <image class="top-card-bg" :src="top_card_bg" mode="aspectFill"></image>
        <text class="u-font-24">提现总金额(元)</text>
        <text class="money-text u-p-t-16 u-font-60" style="font-weight: 700">{{
          withdraw_amount
        }}</text>
        <text class="u-font-28" style="color: #cfe2ff"
          >已打款：{{ paid_amount }}</text
        >
      </view>

      <view class="tab-box u-m-l-28 u-m-r-28 u-m-t-28 u-flex-row">
        <view
          class="tab-item u-flex-1 u-flex-col u-col-center"
          v-for="(item, index) in tabData"
          :key="index"
        >
          <view
            class="u-flex-row u-col-bottom color-text-less-grey"
            :class="{
              'color-text-black': currentIndex == index,
              'u-font-weight': currentIndex == index,
            }"
            @click="switchTab(index)"
          >
            <text class="u-font-32">{{ item["title"] }}</text>
            <text class="u-font-24" v-if="item['num'] > 0">{{
              `(${item["num"]})`
            }}</text>
          </view>
          <view
            class="tab-item-slide u-p-t-4 u-bg-primary"
            :class="{ select: currentIndex == index }"
          ></view>
        </view>
      </view>
    </view>

    <view class="u-m-t-32" v-if="listData.length">
      <view
        class="record-item u-flex-col u-m-l-28 u-m-r-28 u-p-24 u-bg-f u-border-radius u-m-b-16"
        v-for="item in listData"
        :key="item.id"
      >
        <view class="u-flex-row u-row-between">
          <text class="u-font-24 color-text-less-black u-m-r-8 u-flex-1"
            >提现</text
          >

          <text class="record-item-status success" v-if="item.pay_status == 6"
            >已打款</text
          >
          <text
            class="record-item-status rejected"
            v-else-if="item.pay_status == 7 || item.pay_status == 8"
            >已驳回</text
          >
          <text class="record-item-status review" v-else>审核中</text>
        </view>
        <text class="u-font-32 u-font-weight color-text-black u-m-t-8">{{
          item.ask_for_amount
        }}</text>
        <view
          class="u-m-t-16 u-m-b-16 u-p-l-0 u-p-r-0"
          style="height: 0.5px; background-color: #eee"
        >
        </view>
        <view class="u-flex-row u-row-between">
          <text class="color-text-less-grey u-font-24 u-flex-1 u-m-r-32">{{
            item.create_time
          }}</text>
          <view class="u-flex-row">
            <text
              class="u-p-l-24 u-p-r-24 u-p-t-4 u-p-b-4 u-bg-default color-text-black u-font-24 u-font-weight"
              style="border-radius: 100rpx; line-height: 40rpx"
              @click="gotoDetails(item)"
              >{{
                `${
                  item.pay_status == 7 || item.pay_status == 8
                    ? "查看原因"
                    : "查看详情"
                }`
              }}</text
            >

            <text
              class="u-m-l-16 u-p-l-24 u-p-r-24 u-p-t-4 u-p-b-4 u-bg-primary color-text-white u-font-24 u-font-weight"
              style="border-radius: 100rpx; line-height: 40rpx"
              v-if="item.pay_status == 7 || item.pay_status == 8"
              @click="resetSubmit(item)"
              >重新提交</text
            >
          </view>
        </view>
      </view>
    </view>
    <view v-else class="u-m-t-100">
      <u-empty text="暂无收益数据" :icon="image.no_data_list"></u-empty>
    </view>
    <view v-if="!loading && listData.length > 0" style="height: 40px;">
      <u-loadmore
      
      :status="status"
      :loading-text="loadingText"
      :loadmore-text="loadmoreText"
      :nomore-text="nomoreText"
    ></u-loadmore>
    </view>
    
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
import MyNavbar from "@/components/my-navbar/index.vue";
import { getWithdrawRecordData } from "../api/withdraw/withdraw.js";
import { unitMoney } from "../../utils/tools.js";
export default {
  components: {
    MyNavbar,
  },
  data() {
    return {
      withdrawalMoney: 0,
      backDelta: 1,
      currentIndex: 0,
      isEnd: false,
      next_page_site: null,
      pagesize: 20,
      loading: false,
      withdraw_amount: 0,
      paid_amount: 0,
      tabData: [
        {
          title: "全部",
          num: 0,
        },
        {
          title: "审核中",
          num: 0,
        },
        {
          title: "已打款",
          num: 0,
        },
        {
          title: "已驳回",
          num: 0,
        },
      ],
      listData: [],
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",
    };
  },
  computed: {
    ...mapGetters(["static_path", "image"]),
    top_card_bg() {
      return this.static_path + "withdrawal_record_bg.png";
    },
  },
  methods: {
    switchTab(index) {
      this.currentIndex = index;
      this.init();
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration
      });
    },
    gotoDetails(item) {
      uni.navigateTo({
        url: "/income/withdrawal/withdrawalDetails?id=" + item.id,
      });
    },
    resetSubmit(item) {
      uni.navigateTo({
        url: `/income/withdrawal/withdrawOperate?id=${item.id}&money=${item.withdrawalMoney}`,
      });
    },

    init() {
      this.isEnd = false;
      this.next_page_site = null;
      this.getListData(true);
    },

    getListData(reset = false) {
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
        tab_type: this.currentIndex + 1,
        next_page_site : this.next_page_site,
      };
      params.page = this.page;
      this.toastMsg("加载中", "loading", -1);
      getWithdrawRecordData(params)
        .then((res) => {
          let totalInfo = res.data.total;
          this.withdraw_amount = unitMoney(
            totalInfo["withdraw_amount"],
            false,
            true
          );

          this.paid_amount = unitMoney(totalInfo["paid_amount"], false, true);
          this.tabData = [
            {
              title: "全部",
              num: totalInfo["total_num"] || 0,
            },
            {
              title: "审核中",
              num: totalInfo["verify_num"] || 0,
            },
            {
              title: "已打款",
              num: totalInfo["paid_num"] || 0,
            },
            {
              title: "已驳回",
              num: totalInfo["reject_num"] || 0,
            },
          ];

          let list = res.data.list;
          for (let item of list) {
            let ask_for_amount = item["ask_for_amount"];
            item.withdrawalMoney = ask_for_amount;
            item["ask_for_amount"] = unitMoney(ask_for_amount, false, true);
          }
          if (reset) this.listData = list;
          else this.listData.push(...list);
          this.next_page_site = res.data.next_page_site;

          this.isEnd = res.data.next_page_site == null;
          if (this.isEnd) {
            this.nomoreText = `没有更多了～`;
            this.status = "nomore";
          } else {
            this.loadmoreText = `下拉加载更多`;
            this.status = "loadmore";
          }
          this.$refs.toastRef?.close();
        })
        .catch((err) => {
          let message = String(err.message || err || "提现记录获取失败");
          this.toastMsg(message, "error");
        })
        .finally(async () => {
          uni.stopPullDownRefresh();
          this.loading = false;
        });
    },
  },
  onLoad() {
    this.init();
  },
  onReady() {
    this.switchTab(0);
  },
  onShow() {
    const pages = getCurrentPages();
    if (pages.length >= 2) {
      const previousPage = pages[pages.length - 2];
      const route = previousPage.route;
      if (route === "income/withdrawal/withdrawOperate") {
        this.backDelta = 999;
      }
    }
  },
  onPullDownRefresh() {
    this.init();
  },
	onReachBottom(e) {
    uni.$u.throttle(this.getListData(), 500);
  },
};
</script>

<style lang="scss" scoped>
@font-face {
  font-family: "DINPro-Bold";
  src: url("@/static/fonts/DINPro-Bold.otf") format("truetype");
}

.page-box {
  min-height: 100vh;

  .top-area {
    /* #ifdef APP || MP */
    padding-top: 88rpx;
    /* #endif */
    z-index: 999;
    width: 750rpx;
    position: sticky;
    top: 0;

    .top-card {
      position: relative;
      overflow: hidden;

      .top-card-bg {
        position: absolute;
        top: 0rpx;
        left: 0rpx;
        width: 100%;
        height: 100%;
        z-index: -1;
      }

      .money-text {
        font-family: "DINPro-Bold";
      }
    }

    .tab-box {
      .tab-item {
        .tab-item-slide {
          width: 32rpx;
          height: 8rpx;
          border-radius: 4rpx;
          opacity: 0;
        }

        .tab-item-slide.select {
          opacity: 1;
        }
      }
    }
  }

  .top-area::before {
    content: "";
    /* 伪元素必须有 content 属性，即使为空 */
    position: absolute;
    /* 绝对定位，使其可以脱离文档流 */
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, #d3edff 0%, #f6f7fb 100%);
    /* 这里设置你想要的渐变颜色，从红色到黄色的线性渐变 */
    z-index: -1;
    /* 将伪元素置于父元素之下 */
  }

  .record-item {
    .record-item-status {
      padding: 0rpx 8rpx;
      line-height: 40rpx;
      font-size: 22rpx;
      border-radius: 8rpx;
    }

    .record-item-status.review {
      background-color: #fff5ee;
      color: #ff7736;
    }

    .record-item-status.success {
      background-color: #ecf4ff;
      color: #408cff;
    }

    .record-item-status.rejected {
      background-color: #ffebef;
      color: #ff325b;
    }
  }
}
</style>
