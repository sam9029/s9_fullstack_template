<template>
  <view class="page-box u-vh-100 u-bg-default">
    <view id="top-navbar-box " class="top-navbar-box">
      <view class="top-navbar-bg top-bg"></view>
      <view
        class="top-navbar-header widthAll u-flex-row u-row-center u-col-center"
      >
        <u-icon
          class="u-m-l-28"
          name="arrow-left"
          color="#1a1a1a"
          size="48rpx"
          @click="back"
        ></u-icon>
        <text
          class="top-navbar-header-center color-text-black u-font-32 u-font-weight"
          >邀请记录</text
        >
        <view class="top-navbar-header-right u-m-r-28"></view>
      </view>
      <view
        class="record-count-data u-p-32 u-m-l-28 u-m-r-28 u-border-radius u-bg-f"
      >
        <text class="u-m-y-28 u-font-32 color-text-black">我邀请的好友</text>
        <view class="u-flex-row u-row-between u-m-t-32">
          <view class="record-count-data-item u-flex-col u-m-r-32">
            <text class="u-font-48 u-font-weight-600 color-text-black">{{
              totalInvite
            }}</text>
            <text class="u-font-24 color-text-less-grey">共计邀请（人）</text>
          </view>
          <view class="record-count-data-item u-flex-col">
            <text class="u-font-48 u-font-weight-600 color-text-black">{{
              todayInvite
            }}</text>
            <text class="u-font-24 color-text-less-grey">今日邀请（人）</text>
          </view>
        </view>
      </view>

      <view
        class="search-box u-flex-row u-m-t-28 u-m-l-28 u-m-r-28 u-p-t-32 u-p-l-28 u-p-r-28 u-p-b-32 u-bg-f"
      >
        <u-search
          class="search-box-left"
          shape="square"
          :showAction="false"
          height="72rpx"
          bgColor="#f6f6f6"
          placeholder="请输入用户昵称或ID查找"
          placeholderColor="#989898"
          v-model="keyword"
          @search="searchInviteRecord"
          @clear="searchInviteRecord"
        ></u-search>
        <view
          class="search-box-right u-m-l-32 u-p-16 u-flex-row u-col-center u-border-radius"
          @click="clickSortBtn"
        >
          <image
            class="search-box-right-img"
            lazy-load
            :src="recordImgSrc"
          ></image>

          <text
            class="u-font-24 u-font-weight"
            :class="{
              'search-box-right-title-active': recordTimeSort,
              'search-box-right-title': !recordTimeSort,
            }"
            >邀请时间</text
          >
        </view>
      </view>
    </view>
    <view class="record-box u-bg-f u-m-l-28 u-m-r-28" :style="{'min-height': list_height}">
      <view v-if="listData.length">
        <view v-for="(item, index) in listData" :key="item.invite_id">
          <view
            class="record-list-item u-p-l-32 u-p-r-32 u-p-t-32 u-p-b-64 u-flex-row"
          >
            <u-image
              v-if="item.avatar"
              class="record-list-item-img"
              lazy-load
              shape="circle"
              :src="item.avatar"
              width="92rpx"
              height="92rpx"
            ></u-image>
            <u-image
              class="record-list-item-img"
              v-else
              shape="circle"
              :src="default_avatar_icon"
              width="92rpx"
              height="92rpx"
            ></u-image>
            <view class="u-m-l-16 u-flex-col u-row-between">
              <view class="u-flex-row u-col-center">
                <view class="u-font-28 u-font-weight color-text-black">
                  {{ item.account_name }}
                </view>
                <view class="color-text-less-grey">
                  {{ `(ID:${item.account_id})` }}
                </view>
              </view>
              <view class="color-text-less-grey u-font-24">
                {{ `邀请加入时间：${item.invite_time}` }}
              </view>
            </view>
          </view>
        </view>
      </view>

      <view class="u-p-t-100" v-if="!listData.length">
        <u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
      </view>
    </view>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { getInviteTotal, getInviteRecordList } from "../api/invite.js";

import { throttle } from "@/utils/tools.js";
import { mapGetters } from "vuex";

export default {
  data() {
    return {


      showGate: false,
      /* 共计邀请 */
      totalInvite: 0,
      /* 今日邀请 */
      todayInvite: 0,
      /* 搜索关键词 */
      keyword: "",
      /* 邀请时间排序 */
      recordTimeSort: false,
      listData: [],
      pagesize: 20,
      loading: false,
      next_page_site: "",
      list_height: "0rpx"
    };
  },
  computed: {
    ...mapGetters(["static_path", "image"]),
    default_avatar_icon() {
      return `${this.static_path}no_avatar.png`;
    },
    recordImgSrc() {
      let iconSrc = this.static_path;
      if (this.recordTimeSort) {
        iconSrc += "record_sort_positive.png";
      } else {
        iconSrc += "record_sort_default.png";
      }
      return iconSrc;
    },
  },
  methods: {
    clickSortBtn: throttle(function func() {
      this.recordTimeSort = !this.recordTimeSort;
      this.getListData(true);
    }, 500),
    // clickSortBtn() {
    // 	this.recordTimeSort = !this.recordTimeSort;
    // 	this.getListData(true);
    // },
    // 提示
    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration
      });
    },
    back() {
      uni.navigateBack();
    },
    goLogin() {
      uni.navigateTo({
        url: "/pages/login/login",
      });
      this.showGate = false;
    },
    stopLoad() {
      uni.stopPullDownRefresh();
      this.loading = false;
    },

    searchInviteRecord: throttle(function func() {
      this.getListData(true);
    }, 500),

    getTotalData() {
      getInviteTotal()
        .then((res) => {
          this.totalInvite = res.data.invite_total;
          this.todayInvite = res.data.today_invite_total;
        })
        .catch((error) => {
          this.toastMsg(error.message || error, "error");
        });
    },

		init() {
			this.isEnd = false;
			this.getTotalData();
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
				keyword: this.keyword || undefined,
        pagesize: this.pagesize,
				time_sort: this.recordTimeSort ? "asc" : "desc",
      };
      if (this.next_page_site) {
        params["next_page_site"] = this.next_page_site;
      }
      this.toastMsg("加载中", "loading", -1);
      getInviteRecordList(params)
        .then((res) => {
          const list = res.data.list;
          if (reset) this.listData = list;
          else this.listData.push(...list);

          
          this.site = res.data.site;

          this.isEnd = res.data.list.length < this.pagesize;
          this.$refs.toastRef?.close();
        })
        .catch((err) => {
          let message = String(err.message || err);
          this.toastMsg(message, "error");
        })
        .finally(() => {
          this.stopLoad();
        });
    },
    async computedHeight() {

      const containBoxRect = await this.$u.getRect(`.page-box`);

				const topBoxRect = await this.$u.getRect(`.top-navbar-box`);

				this.list_height = (containBoxRect.height - topBoxRect.height - 8) + "px";


    },
  },
  onReady() {
    this.init();
    this.$nextTick(() => {
      this.computedHeight();
    });
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
.page-box {
  .top-navbar-box {
    width: 750rpx;
    top: 0;
    left: 0;
    z-index: 9999;
    /* #ifdef APP */
    padding-top: 88rpx;
    /* #endif */
    background: linear-gradient(to bottom, #d3edff, #f6f7fb);
    position: sticky;

    .top-navbar-bg {
      position: absolute;
      z-index: -1;
    }

    .top-navbar-header {
      height: 44px;

      .top-navbar-header-center {
        flex: 1;
        text-align: center;
      }

      .top-navbar-header-right {
        width: 24px;
        height: 24px;
      }
    }

    .record-count-data {
      margin-top: 28rpx;

      .record-count-data-item {
        flex: 1;
      }
    }

    .search-box {
      border-top-left-radius: 16rpx;
      border-top-right-radius: 16rpx;

      .search-box-left {
        flex: 1;
      }

      .search-box-right {
        background-color: #f6f6f6;

        .search-box-right-img {
          width: 32rpx;
          height: 32rpx;
        }

        .search-box-right-title {
          color: #3c3c3c;
        }

        .search-box-right-title-active {
          color: #408cff;
        }
      }
    }
  }

  .record-box {
    border-bottom-left-radius: 16rpx;
    border-bottom-right-radius: 16rpx;
    .record-list-item {
      .record-list-item-img {
        width: 92rpx;
        height: 92rpx;
        border-radius: 92rpx;
      }
    }
  }

  ::v-deep .u-search .u-search__content {
    border-radius: 16rpx !important;
  }
}
</style>
