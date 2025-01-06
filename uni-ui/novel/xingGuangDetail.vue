<template>
  <view class="detail-page">
    <view class="top-area">
      <view class="navbar u-p-x-28 u-p-y-16 u-flex-row u-col-center">
        <u--image
          :src="`${static_path}circular_back.png`"
          width="48rpx"
          height="48rpx"
          @click="goBack"
        ></u--image>
        <text class="u-font-32 u-line-h-48 color-text-black u-m-l-16">{{
          detailObj.advertiser_name || "--"
        }}</text>
      </view>
    </view>
    <view class="u-p-x-28">
      <view
        class="u-m-t-32 u-bg-f u-border-radius u-p-24 u-flex-row u-col-center"
      >
        <u--image
          :src="detailObj.advertiser_icon"
          width="156rpx"
          height="156rpx"
          radius="28rpx"
        ></u--image>
        <view class="u-flex-col u-row-center u-m-l-24">
          <text class="color-text-black u-font-28 u-line-h-44 u-m-b-16">{{
            detailObj.task_name || "--"
          }}</text>
          <view
            class="color-text-less-grey u-font-24 u-line-h-40 u-flex-row u-col-center u-m-b-16"
          >
            <text class="u-m-r-8">任务ID</text>
            <view class="gap-line u-m-r-8"></view>
            <text class="u-font-bold u-m-r-8">{{ detailObj.id || "--" }}</text>
            <u--image
              :src="`${static_path}copy_icon.png`"
              width="28rpx"
              height="28rpx"
              @click="onCopy(detailObj.id)"
            ></u--image>
          </view>
          <text class="color-text-less-grey u-font-24 u-line-h-40">{{
            `任务周期: ${detailObj.start_date} - ${detailObj.end_date}`
          }}</text>
        </view>
      </view>
      <view
        class="u-m-t-32 u-flex-row u-col-center scroll-x u-border-radius"
        style="max-width: 722rpx"
      >
        <view class="u-bg-f u-p-x-24 u-p-y-16 u-m-r-20 u-border-radius">
          <text
            class="u-font-32 u-line-h-48 color-text-black u-font-bold u-nowrap"
            >{{ policys_1.show_value || "--" }}</text
          >
          <view class="u-flex-row u-col-center">
            <text
              class="color-text-less-grey u-m-r-8 u-font-24 u-line-h-40 u-nowrap"
              >{{ policys_1.show_name || "--" }}</text
            >
            <u-icon
              name="question-circle"
              size="14"
              color="#989898"
              @click="openModal(1)"
            ></u-icon>
          </view>
        </view>
        <view
          class="u-flex-row u-col-center u-bg-f u-p-x-24 u-p-y-16 u-border-radius widthAll"
        >
          <view class="color-text-less-grey u-flex-col u-row-center u-m-r-16">
            <text class="u-font-32 u-line-h-48 color-text-black u-font-bold">{{
              policys_2.show_value || "--"
            }}</text>
            <text class="u-font-24 u-line-h-40 u-nowrap">{{
              policys_2.show_name || "--"
            }}</text>
          </view>
          <view class="color-text-less-grey u-flex-col u-row-center u-m-r-16">
            <text class="u-font-32 u-line-h-48 color-text-black u-font-bold">{{
              policys_3.show_value || "--"
            }}</text>
            <text class="u-font-24 u-line-h-40 u-nowrap">{{
              policys_3.show_name || "--"
            }}</text>
          </view>
          <view class="color-text-less-grey u-flex-col u-row-center">
            <text class="u-font-32 u-line-h-48 color-text-black u-font-bold">{{
              policys_4.show_value || "--"
            }}</text>
            <view class="u-font-24 u-line-h-40 u-flex-row u-col-center">
              <text class="u-m-r-8 u-nowrap">{{
                policys_4.show_name || "--"
              }}</text>
              <u-icon
                name="question-circle"
                size="14"
                color="#989898"
                @click="openModal(2)"
              ></u-icon>
            </view>
          </view>
        </view>
      </view>
      <view
        class="u-m-t-16 total-budget u-border-radius u-p-24 u-flex-row u-row-between u-col-center"
      >
        <text class="u-font-28 u-line-h-44 color-text-black u-font-bold"
          >任务总预算</text
        >
        <text class="color-text-primary u-font-bold u-line-h-48 u-font-40"
          >{{ (detailObj.budget_amount / 100).toFixed(2) }}元</text
        >
      </view>
      <view class="u-border-radius u-m-t-28 u-bg-f">
        <u-collapse :border="false">
          <u-collapse-item>
            <view slot="title" class="u-flex-row u-col-center">
              <u-icon :name="`${static_path}task_icon.png`" size="24" style="position: relative;top: 2rpx;"></u-icon>
              <text class="u-font-bold u-font-28 u-line-h-44 u-m-l-8">任务详情</text>
            </view>
            <u-parse :content="detailObj.describe"></u-parse>
          </u-collapse-item>
        </u-collapse>
      </view>
      <view class="u-m-t-48">
        <text class="u-font-32 u-line-h-48 color-text-black u-font-bold"
          >我的报名</text
        >
        <view
          v-if="
            detailObj.join_platform_accounts &&
            detailObj.join_platform_accounts.length
          "
          class="sing-list u-m-t-28"
        >
          <view
            v-for="item in detailObj.join_platform_accounts"
            :key="item.id"
            class="list-item u-flex-row u-row-between u-col-center u-bg-f u-border-radius u-p-24 u-m-b-28"
          >
            <view class="u-flex-row u-col-centr">
              <u-avatar
                class="u-m-r-16"
                size="46"
                :src="item.platform_icon"
              ></u-avatar>
              <view class="u-flex-col u-row-center">
                <view class="u-flex-row u-col-center">
                  <text class="color-text-black u-font-28 u-line-h-44 u-line-1">{{
                    item.platform_account_name
                  }}</text>
                  <text class="color-text-less-grey u-font-24 u-line-h-44 u-nowrap">{{
                    `(粉丝量: ${item.fan_counts})`
                  }}</text>
                </view>
                <text
                  class="color-text-less-grey u-font-24 u-line-h-40 u-line-1"
                  >{{ `星图ID: ${item.xingtu_id}` }}</text
                >
              </view>
            </view>
            <view class="item-status">
              <view
                v-if="item.verify_status != 3 && item.verify_status != 4"
                class="orange u-font-22 u-line-h-40"
                >审核中</view
              >
              <view
                v-if="item.verify_status == 3"
                class="primary u-font-22 u-line-h-40 u-nowrap"
                @click="setVerifySuggest(item)"
              >审核成功 查看后续操作</view>
              <view
                v-if="item.verify_status == 4"
                class="danger u-font-22 u-line-h-40 u-nowrap"
                @click="setVerifySuggest(item)"
                >审核失败 点击查看原因</view
              >
            </view>
          </view>
          <view :style="{ height: btnHeight }" class="u-flex-row u-row-center">
            <text class="u-font-24 color-text-less-grey">-到底了-</text>
          </view>
        </view>
        <view v-else class="u-m-t-60">
          <u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
        </view>
      </view>
    </view>
    <BottomBtn
      :data="button_list"
      :buttonIndex="0"
      @account="onAccount"
      @singUp="onSingUp"
      @height="getBtnHeight"
    />
    <u-modal
      :show="showModal"
      :showCancelButton="false"
      :showConfirmButton="false"
      confirmText="我知道了"
      width="520rpx"
      :closeOnClickOverlay="false"
    >
      <view class="u-flex-col u-col-center">
        <view
          class="u-font-bold widthAll u-font-32 u-line-h-48 u-m-b-32 u-text-left"
          >{{ modalTitle }}</view
        >
        <text class="u-font-28 u-line-h-44 u-m-b-32" style="color: #3c3c3c">{{
          modalContent
        }}</text>
        <view
          class="modal-btn widthAll u-border-radius u-p-x-28 u-p-y-20 color-text-white u-text-center"
          style="background: #408cff"
          @click="showModal = false"
          >我知道了</view
        >
      </view>
    </u-modal>
    <u-modal
      :show="showRefuse"
      :showCancelButton="false"
      :showConfirmButton="false"
      confirmText="我知道了"
      width="520rpx"
      :closeOnClickOverlay="false"
    >
      <view class="u-flex-col u-col-center">
        <view
          class="u-font-bold widthAll u-font-32 u-line-h-48 u-m-b-32 u-text-left"
          >{{ verify_status == 3 ? "审核成功" : "审核失败" }}</view
        >
        <text class="u-font-28 u-line-h-44 u-m-b-32" style="color: #3c3c3c">{{
          verify_suggest
        }}</text>
        <view
          class="modal-btn widthAll u-border-radius u-p-x-28 u-p-y-20 color-text-white u-text-center"
          style="background: #408cff"
          @click="showRefuse = false"
          >我知道了</view
        >
      </view>
    </u-modal>
    <AccountPopup ref="accountPopupRef" @next="closeAccPopup"></AccountPopup>
    <SingupPopup
      ref="singupPopupRef"
      @next="openAccPopup"
      @refresh="queryDetail"
    ></SingupPopup>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { copy } from "@/utils/tools.js";
import { getXGDetail } from "./api/detail.js";
import BottomBtn from "@/components/bottom-button/index.vue";
import AccountPopup from "./components/accountPopup.vue";
import SingupPopup from "./components/singupPopup.vue";
import { mapGetters } from "vuex";
export default {
  components: {
    BottomBtn,
    AccountPopup,
    SingupPopup
  },
  data() {
    return {
      id: null,
      showModal: false,
      showRefuse: false,
      modalTitle: "",
      modalContent: "",
      detailObj: {},
      verify_status: null,
      verify_suggest: "",
      btnHeight: "",
      task_status: "ONLINE",
      policys_1: {},
      policys_2: {},
      policys_3: {},
      policys_4: {},
      status: "loadmore",
      loadingText: "努力加载中",
      loadmoreText: "下拉加载更多",
      nomoreText: "没有更多了～",
    };
  },
  computed: {
    button_list() {
      return [
        [
          {
            text: "我的抖音账号",
            shape: "square",
            onClick: "account",
            btnType: "button",
            color: "#f1f1f1",
            customStyle: { color: "#1a1a1a" },
          },
          {
            text: this.task_status == "ONLINE" ? "立即报名" : "任务已结束",
            disabled: this.task_status == "ENDED",
            shape: "square",
            type: "primary",
            onClick: "singUp",
            btnType: "button",
          },
        ],
      ];
    },
    ...mapGetters(['static_path', 'image']),
  },
  methods: {
    getBtnHeight(height) {
      this.btnHeight = height * 2 + 30 + "rpx";
    },

    onCopy(str) {
      copy({ content: str }, this);
    },

    goBack() {
      uni.navigateBack();
    },

    queryDetail() {
      this.toastMsg("加载中", "loading", -1);
      getXGDetail({ id: this.id })
        .then((res) => {
          if (res.code == 0) {
            this.detailObj = res.data;
            if (this.detailObj.policys?.length) {
              this.detailObj.policys.forEach((item) => {
                this[`policys_${item.id}`] = item;
              });
            }
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        })
        .finally(() => {
          this.$refs.toastRef?.close();
          uni.stopPullDownRefresh();
        });
    },

    onAccount() {
      uni.navigateTo({
        url: "/pagesUser/account/index?platform_id=1",
      });
    },

    openAccPopup() {
      this.$refs.accountPopupRef.open(this.id);
    },

    closeAccPopup(target) {
      this.$refs.singupPopupRef.open(this.id, { label: target.label, value: target.id, list: target.list })
    },

    onSingUp() {  
      this.$refs.singupPopupRef.open(this.id)
    },

    openModal(type) {
      this.showModal = true;
      if (type == 1) {
        this.modalTitle = "保底收益";
        this.modalContent = "保底收益和效果收益2种收益取最大值结算";
      } else {
        this.modalTitle = "广告消耗分成";
        this.modalContent =
          "星广联投官方根据达人投放视频优质程度，给予额外广告投流分成的3%";
      }
    },

    setVerifySuggest(item) {
      this.showRefuse = true;
      this.verify_status = item.verify_status;
      this.verify_suggest = item.verify_suggest;
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
    },
  },
  onLoad({ task_status, id }) {
    this.id = id;
    this.task_status = task_status || "ONLINE";
    if (task_status == "ENDED") {
      this.toastMsg("任务已结束", "error");
    }
    this.queryDetail();
  },

  onPullDownRefresh() {
    this.queryDetail();
  },
};
</script>

<style lang="scss" scoped>
.top-area {
  /* #ifdef APP || MP */
  padding-top: 88rpx;
  /* #endif */
}
.detail-page {
  min-height: 100vh;
  .total-budget {
    border: 2rpx solid #fff;
    background: linear-gradient(
      92.3deg,
      #e2eeff 0%,
      #f4f8ff 47.09%,
      #f7faff 96.14%
    );
  }
  .item-status {
    .orange {
      border-radius: 8rpx;
      padding: 0 8rpx;
      color: #ff7736;
      background: #fff5ee;
    }

    .primary {
      border-radius: 8rpx;
      padding: 0 8rpx;
      color: $u-primary;
      background: #ecf4ff;
    }

    .danger {
      border-radius: 8rpx;
      padding: 0 8rpx;
      color: #ff325b;
      background: #ffebef;
    }
  }
}
::v-deep .u-collapse-item__content {
  padding: 0 24rpx;
  .u-collapse-item__content__text {
    padding: 24rpx 0;
    border-top: 2rpx solid #eee;
    color: initial;
  }
}
</style>
