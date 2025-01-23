<template>
  <view class="novel-detail-page" :class="{ 'no-scroll': no_scroll }">
    <view class="top-area">
      <MyNavbar
        :leftIcon="`${static_path}circular_back.png`"
        :rightIcon="`${static_path}nav_btn_icon.png`"
        rightBtn
        rightBtnText="推广说明"
        :rightClick="goPromoteDetail"
      >
        <template #navbarData>
          <text
            class="u-font-32 color-text-black u-font-bold"
            style="margin-left: 16rpx"
            >{{ advertiser_name }}</text
          >
        </template>
      </MyNavbar>
    </view>
    <view class="u-m-t-28 u-p-x-28">
      <view
        class="u-border-radius u-bg-f u-p-32"
        style="min-height: calc(100vh - 88rpx)"
      >
        <u-tabs :list="tabList" @click="clickTab"></u-tabs>
        <view class="u-flex-row u-col-center u-m-y-32">
          <u-search
            v-model.trim="keyword"
            placeholder="请输入关键词查找"
            shape="square"
            :showAction="false"
            searchIconColor="#3C3C3C"
            :inputStyle="{
              height: '72rpx',
              'background-color': '#f6f6f6',
            }"
            @search="init"
            @clear="init"
          ></u-search>
          <view
            class="u-m-l-32 u-flex-row u-row-center u-col-center u-border-radius"
            style="width: 164rpx; height: 72rpx; background: #f6f6f6"
            @click="changeSort"
          >
            <u-icon
              :name="
                this.sort == 'desc'
                  ? `${static_path}record_sort_positive.png`
                  : `${static_path}record_sort_default.png`
              "
              size="32rpx"
            ></u-icon>
            <text class="u-m-l-8 u-font-24 u-line-h-40 color-text-less-black"
              >创建时间</text
            >
          </view>
        </view>
        <view v-if="loading" class="skeleton-box">
          <BaseSkeleton height="160rpx" round="16rpx" class="u-m-b-32" />
          <BaseSkeleton height="160rpx" round="16rpx" class="u-m-b-32" />
          <BaseSkeleton height="160rpx" round="16rpx" class="u-m-b-32" />
          <BaseSkeleton height="160rpx" round="16rpx" class="u-m-b-32" />
          <BaseSkeleton height="160rpx" round="16rpx" class="u-m-b-32" />
          <BaseSkeleton height="160rpx" round="16rpx" />
        </view>
        <view v-if="!loading && listData.length" class="list-box">
          <view
            v-for="item in listData"
            :key="item.id"
            class="list-item u-flex-row u-row-between u-col-center u-p-y-32 u-border-custom-bottom"
          >
            <view class="u-flex-col u-row-center">
              <view class="u-flex-row u-col-center">
                <text
                  class="u-font-bold u-font-28 u-line-h-40 color-text-black u-line-1"
                  >{{ item.keyword || "--" }}</text
                >
                <u-icon
                  v-if="item.verify_status == 2"
                  class="u-m-l-8"
                  :name="`${static_path}copy_icon.png`"
                  size="28rpx"
                  @click="onCopy(item.keyword)"
                ></u-icon>
                <view
                  class="u-flex-row u-row-center u-col-center u-m-l-8 u-p-x-8"
                  :class="{
                    'tag--primary': item.verify_status == 2,
                    'tag--warning':
                      item.verify_status == 1 || item.verify_status == 4,
                    'tag--danger': item.verify_status == 3,
                  }"
                >
                  <text class="u-font-22 u-line-h-40 u-nowrap">{{
                    LIBRARY_VERIFY_STATUS[item.verify_status]
                  }}</text>
                  <u-icon
                    v-if="item.verify_status == 3"
                    class="u-m-l-8"
                    name="question-circle"
                    size="24rpx"
                    color="#FF325B"
                    style="position: relative; top: 2rpx"
                    @click="openModal(item)"
                  ></u-icon>
                </view>
              </view>
              <text class="color-text-less-grey u-font-24 u-line-h-40">{{
                `提词时间: ${item.create_time}`
              }}</text>
            </view>
            <view
              v-if="item.verify_status != 1 && buttonIndex == 0"
              class="u-flex-row u-col-center"
            >
              <view
                class="u-p-y-4 u-p-x-24 u-font-24 u-line-h-40"
                style="background: #f6f6f6; border-radius: 100px"
                @click="goDetail(item)"
                >详情</view
              >
              <view
                v-if="item.verify_status == 2"
                class="u-p-y-4 u-p-x-24 u-font-24 u-line-h-40 u-m-l-16 color-text-white"
                style="background: #408cff; border-radius: 100px"
                @click="goBackfill(item)"
                >回填</view
              >
            </view>

            <u-checkbox-group
              v-if="buttonIndex == 1"
              v-model="item.selected"
              placement="column"
              @change="checkboxChange($event, item)"
              shape="circle"
              :disabled="item.verify_status == 1 || item.verify_status == 2"
            >
              <u-checkbox @handle="handleCheckbox(item)" :name="true"> </u-checkbox>
            </u-checkbox-group>
          </view>
        </view>
        <view v-if="!loading && !listData.length" style="margin-top: 100rpx">
          <u-empty text="暂无内容" :icon="image.no_data_list"></u-empty>
        </view>
      </view>
    </view>
    <BottomBtn
      :data="button_list"
      :buttonIndex="buttonIndex"
      :layout="188"
      @manage="hanleManage"
      @create="handleCreate"
      @cancel="handleCancel"
      @delete="showDelModal = true"
      @height="getBtnHeight"
    />
    <u-modal
      :show="showModal"
      :showCancelButton="false"
      :showConfirmButton="true"
      confirmText="我知道了"
      title="审核失败"
      :content="verify_suggest"
      :buttonFill="false"
      :closeOnClickOverlay="false"
      @confirm="showModal = false"
    >
    </u-modal>
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
    <PromotePopup
      @open="no_scroll = true"
      @close="no_scroll = false"
      :id="advertiser_type"
      ref="promoteRef"
    />
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { LIBRARY_VERIFY_STATUS } from "@/utils/mappers/novel.js";
import { copy, sleep } from "@/utils/tools.js";
import MyNavbar from "@/components/my-navbar/index.vue";
import BottomBtn from "@/components/bottom-button/index.vue";
import PromotePopup from "../components/promotePopup.vue";
import BaseSkeleton from "@/components/base-skeleton/index.vue";
import { getLibraryList, postLibraryDel } from "../api/keyword.js";
import { mapGetters } from "vuex";
export default {
  components: {
    MyNavbar,
    BottomBtn,
    PromotePopup,
    BaseSkeleton
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

      no_scroll: false,
      showModal: false,
      showDelModal: false,
      buttonIndex: 0,
      LIBRARY_VERIFY_STATUS,
      keyword: "",
      advertiser_name: null,
      advertiser_type: null,
      btnHeight: "0",
      currentTab: 1,
      verify_suggest: "",
      sort: "asc",
      tabList: [
        {
          name: "我的词库",
          value: 1,
        },
        {
          name: "待审核",
          value: 2,
        },
        {
          name: "未回填",
          value: 3,
        },
        {
          name: "已回填",
          value: 4,
        },
      ],
      listData: [],
      selected: [],
    };
  },
  computed: {
    button_list() {
      return [
        [
          {
            text: "管理",
            shape: "square",
            onClick: "manage",
            btnType: "button",
            color: "#f1f1f1",
            disabled: this.listData.length == 0 ? true : false,
            customStyle: { color: "#1a1a1a" },
          },
          {
            text: "新建关键词",
            shape: "square",
            type: "primary",
            onClick: "create",
            btnType: "button",
          },
        ],
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
    ...mapGetters(["static_path", "image"]),
  },
  methods: {
    clickTab(tab) {
      this.currentTab = tab.value;
      this.init();
    },

    changeSort() {
      if (this.sort == "desc") {
        this.sort = "asc";
      } else {
        this.sort = "desc";
      }
      this.init();
    },

    openModal(item) {
      this.showModal = true;
      this.verify_suggest = item.verify_suggest;
    },

    checkboxChange(val, item) {
      if (val.length) {
        this.selected.push(item.id);
      } else {
        this.selected.splice(this.selected.indexOf(item.id), 1);
      }
    },

    handleDel() {
      postLibraryDel({
        ids: this.selected,
      })
        .then(async (res) => {
          if (res.code == 0) {
            this.selected = [];
            this.showDelModal = false;
            this.toastMsg(res.data.message, "success");
            this.init();
          }
        })
        .catch((error) => {
          this.toastMsg(error.message || error, "error");
        });
    },

    handleCreate() {
      uni.navigateTo({
        url: `/novel/detail/promptDetail`,
      });
    },

    goDetail(item) {
      uni.navigateTo({
        url: `/novel/detail/promptDetail?id=${item.id}`,
      });
    },

    goBackfill(item) {
      uni.navigateTo({
        url: `/novel/detail/backfill?keyword_id=${item.id}`,
      });
    },

    handleCheckbox({ verify_status }) {
      switch(verify_status) {
        case 1:
          return this.toastMsg("审核中的关键词不可删除", "error");
        case 2:
          return this.toastMsg("审核成功的关键词不可删除", "error");
      }
    },

    onCopy(str) {
      copy({ content: str }, this);
    },

    hanleManage() {
      this.buttonIndex = 1;
    },

    handleCancel() {
      this.buttonIndex = 0;
      const newList = this.listData.map((el) => {
        return {
          ...el,
          selected: [],
        };
      });
      this.listData = newList;
      this.selected = [];
    },

    getBtnHeight(height) {
      this.btnHeight = height * 2 + "rpx";
    },

    goPromoteDetail() {
      this.$refs.promoteRef.open();
    },

    init() {
      this.isEnd = false;
      this.queryList();
    },

    queryList(reset = true) {
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
        page_type: this.currentTab,
        keyword: this.keyword || undefined,
        sort: this.sort,
      };
      params.page = this.page;
      getLibraryList(params)
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
          this.toastMsg(error.message || error, "error");
        })
        .finally(async () => {
          uni.stopPullDownRefresh();
          await sleep(300);
          this.loading = false;
        });
    },

    handleCheckboxClick(item) {
      console.log(item);
      switch (item.verify_status) {
        case 1:
          return this.toastMsg("审核中的关键词不可删除", "error");
        case 2:
          return this.toastMsg("审核成功的关键词不可删除", "error");
      }
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
    },
  },
  onReady() {
    const { advertiser_name, advertiser_id } = JSON.parse(
      uni.getStorageSync("SET_JUMP_QUERY")
    );
    this.advertiser_name = advertiser_name || null;
    this.advertiser_type = advertiser_id || null;
    this.init();
  },
  onPullDownRefresh() {
    this.init();
  },
  onReachBottom() {
    uni.$u.throttle(this.queryList(false), 500);
  },
};
</script>

<style lang="scss" scoped>
.novel-detail-page {
  min-height: 100vh;
  .top-area {
    z-index: 999;
    width: 750rpx;
    position: sticky;
    top: 0;
    background: #F6F7FB;
    /* #ifdef APP */
    padding-top: 88rpx;
    /* #endif */
  }
}
.tag--primary {
  border-radius: 8rpx;
  background: #ecf4ff;
  color: $u-primary;
}
.tag--warning {
  border-radius: 8rpx;
  background: #fff5ee;
  color: $u-orange-6;
}
.tag--danger {
  border-radius: 8rpx;
  background: #ffebef;
  color: $u-red-6;
}
::v-deep .u-search {
  height: 72rpx;
  .u-search__content {
    border-radius: 16rpx !important;
    background-color: #f6f6f6 !important;
  }
}
::v-deep .u-checkbox__icon-wrap--disabled {
  background-color: #d1e3ff !important;
  border-color: #d1e3ff !important;
}
::v-deep .u-tabs__wrapper__nav {
  display: grid !important;
  grid-auto-flow: column !important;
}
</style>
