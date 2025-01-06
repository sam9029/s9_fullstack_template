<template>
  <view class="xingguang-page">
    <view class="top-area">
      <MyNavbar
        bgColor="transparent"
        :leftIcon="`${static_path}circular_back.png`"
        :rightIcon="`${static_path}nav_btn_icon.png`"
        rightBtn
        rightBtnText="问题解答"
        :rightClick="goQS"
      >
        <template #navbarData>
          <text
            class="u-font-32 color-text-black u-font-bold"
            style="margin-left: 16rpx"
            >星广联投</text
          >
        </template>
      </MyNavbar>
      <view class="header-tab u-p-l-28 u-p-r-28 u-m-t-28">
        <view
          class="tab-item"
          :class="{ 'tab-item--active': tabIndex === 1 }"
          style="margin-right: 32rpx"
          @click="changeTab(1)"
          >任务列表</view
        >
        <view
          class="tab-item"
          :class="{ 'tab-item--active': tabIndex === 2 }"
          @click="changeTab(2)"
          >我的任务</view
        >
      </view>
      <view
        class="u-flex-row u-m-t-44 u-m-l-28 u-m-r-28 u-row-between u-col-center"
        v-show="tabIndex === 2"
      >
        <text class="u-text-main u-font-32">任务列表</text>
        <view class="switch-bg">
          <text
            class="switch-item"
            :class="{ 'switch-item-active': switchIndex === 1 }"
            @click="changeStatus(1)"
            >进行中</text
          >
          <text
            class="switch-item"
            :class="{ 'switch-item-active': switchIndex === 2 }"
            @click="changeStatus(2)"
            >已结束</text
          >
        </view>
      </view>
    </view>
    <view class="u-p-l-28 u-p-r-28 u-m-t-28">
      <view v-if="listData.length">
        <view
          v-for="(item, index) in listData"
          :key="item.id"
          class="card-bg u-m-b-16 u-flex-row u-row-between"
          @click="goDetail(item)"
        >
          <view class="u-flex-row">
            <u-image
              :src="item.advertiser_icon"
              mode="scaleToFill"
              shape="square"
              radius="32rpx"
              width="180rpx"
              height="180rpx"
              style="border: 2rpx solid #eeeeee; border-radius: 32rpx"
            ></u-image>
            <view class="u-m-l-24 u-flex-col u-row-between">
              <text class="u-font-28 u-text-main u-line-1">{{
                item.task_name
              }}</text>
              <text class="u-font-22 color-text-less-grey">{{
                `任务周期：${item.start_date} -${item.end_date}`
              }}</text>
              <view
                style="
                  border-radius: 8rpx;
                  background: #f6f6f6;
                  height: 40rpx;
                  width: fit-content;
                  max-width: 394rpx;
                  overflow-x: hidden;
                "
                class="u-flex-row"
              >
                <view
                  class="u-flex-row u-col-center"
                  v-for="(policy, index) in item.policys"
                  :key="policy.id"
                >
                  <view
                    class="u-p-r-8 u-p-l-8 u-nowrap u-font-24"
                    :style="{
                      color: policy.show_name == '保底' ? '#408CFF' : '#3C3C3C',
                    }"
                  >
                    {{ policy.show_name }}
                  </view>
                  <u-line
                    v-show="index != item.policys.length - 1"
                    direction="col"
                    length="16rpx"
                    color="#C6C6C6"
                  ></u-line>
                </view>
              </view>
              <view
                style="
                  border-radius: 8rpx;
                  background: #f6f6f6;
                  height: 40rpx;
                  width: fit-content;
                  max-width: 394rpx;
                  overflow-x: hidden;
                "
                class="u-flex-row u-col-center"
              >
                <view class="u-m-l-8 u-m-r-8 u-font-24" style="color: #3c3c3c">
                  {{ item.budget_level_name }}
                </view>
                <u-line direction="col" length="16rpx" color="#C6C6C6"></u-line>
                <view
                  class="u-m-l-8 u-m-r-8 u-font-24"
                  :style="{ color: tabIndex == 1 ? '#FF7736' : '#3C3C3C' }"
                >
                  {{
                    tabIndex == 1
                      ? `${item.join_num}人报名`
                      : `报名账号${item.join_num}`
                  }}
                </view>
              </view>
            </view>
          </view>
          <u-icon
            class="right-button"
            :name="`${static_path}blue_right_arrow.png`"
            width="32rpx"
            height="32rpx"
          ></u-icon>
        </view>
      </view>
      <view v-else="listData.length == 0" class="u-m-t-100">
        <u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
      </view>
      <u-loadmore
        v-if="!loading && listData.length > 0"
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
import MyNavbar from "@/components/my-navbar/index.vue";
import {
  getXingGuangTaskList as taskListReq,
  getXingGuangMyTaskList as myTaskReq,
} from "./api/index.js";
import { mapGetters } from "vuex";
import { sleep } from "@/utils/tools.js";
export default {
  options: {
    styleIsolation: "shared",
  },
  components: {
    MyNavbar,
  },
  props: {},
  data() {
    return {
      isEnd: false,
      page: 1,
      pagesize: 20,
      loading: false,
      site: null,
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",

      listData: [],
      tabIndex: 1,
      switchIndex: 1,
    };
  },
  computed: {
    ...mapGetters(["static_path", "image"]),
  },
  methods: {
    goQS() {
      console.log("问题解答");
    },
    init() {
      this.isEnd = false;
      this.getListData(true);
    },
    getListData(reset = true) {
      if (this.isEnd) return;
      let params = {
        pagesize: this.pagesize,
      };
      if (this.tabIndex == 2) {
        params.task_status = this.switchIndex == 1 ? "ONLINE" : "ENDED";
      }
      this.loading = true;
      this.toastMsg("加载中", "loading", -1);
      if (reset) this.page = 1;
      else this.page += 1;
      params.page = this.page;
      let func = null;
      switch (this.tabIndex) {
        case 1:
          func = taskListReq;
          break;
        case 2:
          func = myTaskReq;
          break;
      }
      func(params)
        .then((res) => {
          const list = res.data.list;
          if (reset) this.listData = list;
          else this.listData.push(...list);
          this.site = res.data.site;
          let bool = !(res.data.list.length < this.pagesize);
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
					uni.stopPullDownRefresh();
          this.$refs.toastRef?.close();
          await sleep(300);
          this.loading = false;
        });
    },
    goDetail(item) {
      if (this.tabIndex == 1) {
        uni.navigateTo({
          url: `/novel/xingGuangDetail?id=${item.id}`,
        });
      } else {
        uni.navigateTo({
          url: `/novel/xingGuangDetail?id=${item.id}&task_status=${
            this.switchIndex == 1 ? "ONLINE" : "ENDED"
          }`,
        });
      }
    },
    changeTab(index) {
      this.tabIndex = index;
      if (index == 1) {
        this.navbar_height -= uni.upx2px(70);
      } else {
        this.navbar_height += uni.upx2px(70);
      }
      this.init();
    },
    changeStatus(index) {
      this.switchIndex = index;
      this.init();
    },

    // 提示
    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
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
.xingguang-page {
  min-height: 100vh;

  .top-area {
    /* #ifdef APP || MP */
    padding-top: 88rpx;
    /* #endif */
    z-index: 999;
    width: 750rpx;
    position: sticky;
		top: 0;
    background: linear-gradient(180deg, #d3edff, #f6f7fb);

    .right-button {
      z-index: 1000;
      position: fixed;
      /* #ifdef APP || MP */
      top: 116rpx;
      /* #endif */
      /* #ifndef APP || MP */
      top: 28rpx;
      /* #endif */
    }

    .switch-bg {
      width: 240rpx;
      height: 56rpx;
      background: #ffffff;
      border-radius: 100rpx;
      display: flex;
      font-size: 24rpx;
      text-align: center;

      .switch-item {
        flex: 1;
        display: flex;
        height: 100%;
        justify-content: center;
        align-items: center;
        color: #989898;
        background: transparent;
      }

      .switch-item-active {
        flex: 1;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: #ffffff;
        background: #408cff;
        border-radius: 100rpx;
      }
    }
  }

  .header-tab {
    display: flex;
    align-items: center;
    justify-content: center;

    .tab-item {
      border-radius: 16rpx;
      flex: 1;
      text-align: center;
      padding-top: 28rpx;
      padding-bottom: 28rpx;
      font-size: 28rpx;
      color: #1a1a1a;
      background: linear-gradient(to bottom, #f4f8ff, #ffffff);
      border: 2rpx solid #ffffff;
      white-space: nowrap;
    }

    .tab-item--active {
      color: #ffffff;
      background: #579aff;
      position: relative;
      border: 2rpx solid #579aff;

      &::after {
        content: "";
        position: absolute;
        width: 32rpx;
        height: 8rpx;
        border-radius: 4rpx;
        bottom: -16rpx;
        left: 50%;
        transform: translateX(-50%);
        background: #579aff;
      }
    }
  }

  .card-bg {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 24rpx;
  }
}
</style>
