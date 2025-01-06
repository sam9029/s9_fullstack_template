<template>
  <view class="message-page">
    <view class="top-area">
      <MyNavbar bgColor="transparent">
        <template #navbarData>
          <view class="u-flex-row u-row-center u-col-center">
            <text class="u-text-center u-font-32 color-text-black u-font-bold"
              >消息中心</text
            >
          </view>
        </template>
      </MyNavbar>
      <view class="red-dot" v-show="showRedDot"></view>
      <view class="tab-area u-flex-row u-col-center u-m-l-28 u-m-r-28 u-m-t-28">
        <view
          class="tab-item"
          :class="{ 'tab-item-active': tabIndex === 1 }"
          @click="changeTab(1)"
        >
          <u-icon
            :name="
              tabIndex === 1
                ? `${static_path}message_tab_bell_s.png`
                : `${static_path}message_tab_bell.png`
            "
            :bold="true"
            width="40rpx"
            height="40rpx"
            label="全部消息"
            :labelColor="tabIndex === 1 ? '#FFFFFF' : '#989898'"
            :color="tabIndex === 1 ? '#FFFFFF' : '#989898'"
            size="28rpx"
          ></u-icon>
        </view>
        <view
          class="tab-item"
          :class="{ 'tab-item-active': tabIndex === 2 }"
          @click="changeTab(2)"
        >
          <u-icon
            :name="
              tabIndex === 2
                ? `${static_path}message_tab_bill_s.png`
                : `${static_path}message_tab_bill.png`
            "
            :bold="true"
            width="40rpx"
            height="40rpx"
            label="财务消息"
            :labelColor="tabIndex === 2 ? '#FFFFFF' : '#989898'"
            :color="tabIndex === 2 ? '#FFFFFF' : '#989898'"
            size="28rpx"
          ></u-icon>
        </view>
        <view
          class="tab-item"
          :class="{ 'tab-item-active': tabIndex === 3 }"
          @click="changeTab(3)"
        >
          <u-icon
            :name="
              tabIndex === 3
                ? `${static_path}message_tab_system_s.png`
                : `${static_path}message_tab_system.png`
            "
            :bold="true"
            width="40rpx"
            height="40rpx"
            label="系统通知"
            :labelColor="tabIndex === 3 ? '#FFFFFF' : '#989898'"
            :color="tabIndex === 3 ? '#FFFFFF' : '#989898'"
            size="28rpx"
          ></u-icon>
        </view>
      </view>
    </view>
    <view class="u-p-l-28 u-p-r-28">
      <view
        v-show="listData.length"
        v-for="(item, index) in listData"
        :key="index"
        class="card-bg u-m-b-16"
      >
        <u-icon
          :name="`${static_path}message_label_system.png`"
          :label="item.name"
          labelColor="#1A1A1A"
          size="24rpx"
          width="40rpx"
          height="40rpx"
        ></u-icon>
        <u-line class="u-m-t-16" color="#EEEEEE"></u-line>
        <view class="u-flex-row u-col-center u-m-t-16">
          <view
            style="
              width: 12rpx;
              height: 12rpx;
              border-radius: 100rpx;
              background: #ff325b;
            "
          ></view>
          <text class="u-font-32 u-font-bold u-text-main u-m-l-8 u-line-1">{{
            item.name
          }}</text>
        </view>
        <view
          ><text class="u-font-24 color-text-less-grey u-line-h-40"
            >21:25</text
          ></view
        >
        <text class="u-font-28 u-m-t-16 u-line-3" style="color: #3c3c3c"
          >消息正文内容字段消息正文内容字段消息正文内容字段消息正文内容字段消息正文内容字段消息正文内容字段，消息正文内容字段，消息正文内容字段，消息正文内容字段，消息正文内容字段，消息正文内容字段，消息正文内容字段</text
        >
        <u-line class="u-m-t-16" color="#EEEEEE"></u-line>
        <view class="u-flex-row u-col-center u-m-t-16 u-row-between">
          <text class="u-font-28" style="color: #3c3c3c">查看详情</text>
          <u-icon name="arrow-right" size="32rpx"></u-icon>
        </view>
      </view>
      <view
        class="u-flex-col u-col-center"
        style="width: 100%; margin-top: 296rpx"
        v-if="!listData.length"
      >
        <u-image
          :src="`${static_path}message_no_data.png`"
          width="360rpx"
          height="360rpx"
        ></u-image>
        <text
          class="u-font-24 color-text-less-grey"
          style="position: relative; bottom: 45px"
          >暂无消息</text
        >
      </view>
    </view>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import MyNavbar from "@/components/my-navbar/index.vue";
import { mapGetters } from "vuex";
export default {
  options: {
    styleIsolation: "shared",
  },
  components: {
    MyNavbar,
  },
  data() {
    return {
      tabIndex: 1,
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",
      isEnd: false,
      page: 1,
      pagesize: 20,
      site: null,
      listData: [],

      showRedDot: false,
    };
  },
  computed: {
    ...mapGetters(["static_path"]),
  },
  methods: {
    init() {
      this.isEnd = false;
      this.getListData(true);
    },
    getListData(reset = false) {
      // if (this.listLoading) return;
      // reset && (this.listLoading = true);
      // if (!reset && this.isEnd) return;
      // if (reset) {
      //   this.page = 1;
      //   this.isEnd = false; // 重置时应该允许加载数据
      // } else {
      //   this.page += 1;
      // }
      // this.loadmoreText = `努力加载中`;
      // this.status = "loading";
      // let params = {
      //   pagesize: this.pagesize,
      // };
      // params.page = this.page;
      // this.toastMsg("加载中", "loading", -1);
      // getPreAppletList(params)
      //   .then((res) => {
      //     const list = res.data.list;
      //     if (reset) this.listData = list;
      //     else this.listData.push(...list);
      //     this.site = res.data.site;
      //     let bool = !(res.data.list.length < this.pagesize);
      //     this.isEnd = !bool;
      //     if (!bool) {
      //       this.nomoreText = `没有更多了～`;
      //       this.status = "nomore";
      //     } else {
      //       this.loadmoreText = `下拉加载更多`;
      //       this.status = "loadmore";
      //     }
      //   })
      //   .catch((err) => {
      //     let message = String(err.message || err || "项目详情获取失败");
      //     this.toastMsg(message, "error");
      //   })
      //   .finally(async () => {
      //     this.$refs.toastRef?.close();
      //     uni.stopPullDownRefresh();
      //     await sleep(300);
      //     this.listLoading = false;
      //   });
    },
    changeTab(index) {
      this.tabIndex = index;
    },
  },
  onLoad() {
    this.init();
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
.message-page {
  min-height: 100vh;

  .red-dot {
    margin-top: 46rpx;
    z-index: 99;
    margin-left: 448rpx;
    width: 12rpx;
    height: 12rpx;
    border-radius: 100rpx;
    position: fixed;
    background: #ff325b;
  }

  .top-area {
    /* #ifdef APP || MP */
    padding-top: 88rpx;
    /* #endif */
    z-index: 999;
    padding-bottom: 28rpx;
    width: 750rpx;
    top: 0;
    position: sticky;
    background: linear-gradient(180deg, #d3edff, #f6f7fb);
  }

  .tab-area {
    background: #f6f6f6;
    height: 92rpx;
    border-radius: 16rpx;

    %tab-base {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      border-radius: 16rpx;
    }
    .tab-item {
      @extend %tab-base;
      background: transparent;
    }

    .tab-item-active {
      @extend %tab-base;
      background: #408cff;
    }
  }

  .card-bg {
    background: #ffffff;
    flex: 1;
    border-radius: 16rpx;
    padding: 28rpx;
  }
}
</style>
