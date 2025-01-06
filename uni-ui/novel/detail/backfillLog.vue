<template>
  <view class="backfill-log-page">
    <MyNavbar
      :leftIcon="`${static_path}circular_back.png`"
      rightBtn
      rightCustom
    >
      <template #navbarData>
        <text
          class="u-font-32 color-text-black u-font-bold"
          style="margin-left: 16rpx"
          >回填</text
        >
      </template>
      <template #rightBtn>
        <view
          class="u-flex-row u-col-center u-row-right u-m-r-28"
          @click="changeNav"
        >
          <text class="color-text-black u-font-28 u-line-h-48">{{
            navType == 1 ? "管理" : "取消"
          }}</text>
        </view>
      </template>
    </MyNavbar>
    <view class="u-p-x-28 u-m-t-28">
      <view
        class="u-bg-f u-border-radius u-p-24 u-flex-row u-col-center u-m-b-28"
      >
        <u--image
          :src="detailObj.advertiser_type_icon"
          radius="24rpx"
          width="140rpx"
          height="140rpx"
        ></u--image>
        <view class="u-m-l-24">
          <view
            class="u-font-bold u-font-28 u-line-h-44 color-text-black u-m-b-8"
            >{{ detailObj.advertiser_name || "--" }}</view
          >
          <view
            class="u-flex-row u-col-center color-text-less-black u-font-24 u-line-h-40 u-m-b-8"
          >
            <text>总回填</text>
            <view class="gap-line u-m-x-8"></view>
            <text>{{ `${detailObj.num || 0}条` }}</text>
          </view>
          <view class="color-text-less-grey u-font-24 u-line-h-40">{{
            `数据更新至${detailObj.date || "--"}`
          }}</view>
        </view>
      </view>
      <view v-if="!loading && listData.length" class="log-list">
        <view
          v-for="item in listData"
          :key="item.id"
          class="log-list--item u-bg-f u-border-radius u-p-24 u-m-b-16"
        >
          <view class="u-flex-row u-row-between u-col-center">
            <view class="u-flex-row u-col-center u-m-b-16 u-m-r-64">
              <u--image
                :src="item.platform_icon"
                radius="8rpx"
                width="28rpx"
                height="28rpx"
              ></u--image>
              <text
                class="u-font-bold u-line-1 color-text-black u-m-l-8 u-font-24 u-line-h-40"
                >{{ item.platform_name }}</text
              >
              <text
                class="u-font-bold color-text-black u-m-l-8 u-font-24 u-line-h-40"
                >({{ item.id }})</text
              >
            </view>
            <u-checkbox-group
              v-if="navType == 0"
              v-model="item.selected"
              placement="column"
              @change="checkboxChange($event, item)"
              shape="circle"
            >
              <u-checkbox :name="true"> </u-checkbox>
            </u-checkbox-group>
          </view>
          <view class="u-flex-row u-col-center u-m-b-16">
            <view class="tag">{{ item.tag }}</view>
            <view class="gap-line u-m-x-8"></view>
            <view class="color-text-less-grey u-flex-row u-col-center">
              <u-icon
                :name="`${static_path}url_icon.png`"
                size="28rpx"
              ></u-icon>
              <text class="u-m-l-8 u-line-1 u-font-24 u-line-h-40">{{
                item.book_link || "--"
              }}</text>
            </view>
          </view>
          <view class="u-flex-row u-row-between u-col-center">
            <text class="color-text-less-grey u-font-24 u-line-h-40">{{
              `回填时间${item.date || "--"}`
            }}</text>
            <text class="color-text-black u-font-24 u-line-h-40">已提交</text>
          </view>
        </view>
      </view>
      <view v-if="!loading && !listData.length" style="margin-top: 100rpx">
        <u-empty text="暂无内容" :icon="image.no_data_list"></u-empty>
      </view>
    </view>
    <u-modal
      :show="showDelModal"
      confirmText="确认删除"
      width="520rpx"
      content="删除后无法恢复，确认删除吗?"
      title="温馨提示"
      showCancelButton
      :closeOnClickOverlay="false"
      @confirm="handleDel"
      @cancel="showDelModal = false"
    ></u-modal>
    <BottomBtn
      v-if="showBtn"
      :data="button_list"
      :buttonIndex="0"
      @cancel="changeNav"
      @delete="showDelModal = true"
      @height="getBtnHeight"
    />
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import MyNavbar from "@/components/my-navbar/index.vue";
import { getBackfillList } from "../api/backfill.js";
import BottomBtn from "@/components/bottom-button/index.vue";
import { mapGetters } from "vuex";
export default {
  props: {},
  components: {
    MyNavbar,
    BottomBtn,
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

      showDelModal: false,
      navType: 1,
      detailObj: {},
      listData: [],
      showBtn: false,
      btnHeight: "0",
      selected: [],
    };
  },
  computed: {
    button_list() {
      return [
        [
          {
            text: "取消",
            onClick: "cancel",
            btnType: "icon",
            color: "#1a1a1a",
            name: "close-circle",
          },
          {
            text: this.selected.length
              ? `已选择${this.selected.length}项`
              : "请选择删除项",
            btnType: "text",
          },
          {
            text: "删除",
            onClick: "delete",
            btnType: "icon",
            name: "trash",
            color: "#1a1a1a",
            disabled: this.selected.length == 0 ? true : false,
          },
        ],
      ];
    },
    ...mapGetters(['static_path', 'image']),
  },
  methods: {
    handleDel() {},

    changeNav() {
      if (this.navType == 1) {
        this.showBtn = true;
        this.navType = 0;
      } else {
        this.selected = [];
        this.showBtn = false;
        this.navType = 1;
      }
    },

    getList(reset = true) {
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
      };
      params.page = this.page;
      this.toastMsg('加载中', 'loading', -1)
      getBackfillList()
        .then((res) => {
          if (res.code == 0) {
            const list = res.data.list.map((el) => {
              return {
                ...el,
                selected: [],
              };
            });
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
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        })
        .finally(() => {
          this.loading = false;
          uni.stopPullDownRefresh();
          this.$refs.toastRef?.close();
        });
    },

    checkboxChange(val, item) {
      if (val.length) {
        this.selected.push(item.id);
      } else {
        this.selected.splice(this.selected.indexOf(item.id), 1);
      }
    },

    getBtnHeight(height) {
      this.btnHeight = height * 2;
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
  onLoad() {
    this.getList();
  },
  onPullDownRefresh() {
    this.getList();
  },
  onReachBottom() {
    uni.$u.throttle(this.getList(false), 500);
  },
};
</script>

<style lang="scss" scoped>
.backfill-log-page {
  min-height: 100vh;
  .log-list {
    &--item {
      .tag {
        height: 38rpx;
        border: 2rpx solid $u-primary;
        background: #ecf4ff;
        color: $u-primary;
        padding: 8rpx 12rpx;
        font-size: 20rpx;
        line-height: 22rpx;
        border-radius: 8rpx;
      }
    }
  }
}
::v-deep .app-grid {
  background: #f6f6f6;
}
</style>
