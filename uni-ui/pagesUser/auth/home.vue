<template>
  <view class="auth-home-page" :style="header_bg_style">
    <GuideToWebsite v-if="showGuide"></GuideToWebsite>
    <template v-else>
      <!-- 导航栏 -->
      <view class="navbar-box">
        <view
          class="navbar u-p-x-28 u-p-y-16 widthAll u-relative"
          style="background: transparent"
        >
          <u-icon name="arrow-left" size="48rpx" @click="goBack"></u-icon>
          <view
            class="color-text-white u-font-32 u-line-h-48 u-position-center u-font-bold"
            >创作者入驻</view
          >
        </view>
      </view>
  
      <!-- 页面主体 -->
      <view class="auth-home-page__main-wrapper u-p-x-28">
        <!-- 00 -->
        <view
          class="common-card__wrapper entry-status-card__wrapper scroll-target"
        >
          <view class="common-card__wrapper-header widthAll u-flex u-row-center">
            <u-icon
              :name="`${static_path}${ENTRY_STATUS_TEXT_MAPPER_FOR_HEADER[entry_status].icon}`"
              width="24"
              height="24"
            ></u-icon>
            <text class="common-card-header-title header-01-title">{{
              ENTRY_STATUS_TEXT_MAPPER_FOR_HEADER[entry_status].title
            }}</text>
          </view>
          <view class="common-card__wrapper-content">
            <view class="common-card-content u-text-center">{{
              ENTRY_STATUS_TEXT_MAPPER_FOR_HEADER[entry_status].content
            }}</view>
  
            <!-- 特殊 -->
            <view
              v-if="entry_status === 'REJECT'"
              class="u-flex u-gap-28 u-row-center"
            >
              <u-button
                text="查看原因"
                @click="handleOpenRejectReasonModal"
              ></u-button>
              <u-button
                type="primary"
                text="重新申请"
                loadingText="正在获取用户入驻状态"
                :loading="submitBtnLoading"
                @click="handleSubmitClick('topBtn')"
              ></u-button>
            </view>
  
            <u-button
              v-else
              type="primary"
              :loading="submitBtnLoading"
              loadingText="正在获取用户入驻状态"
              :text="entry_status_text"
              @click="handleSubmitClick"
            ></u-button>
          </view>
        </view>
  
        <!-- 01 -->
        <view class="common-card__wrapper" :style="common_card_header_bg_style">
          <view class="common-card__wrapper-header widthAll u-flex u-row-left">
            <u-icon
              :name="`${static_path}c_i_nav_01.png`"
              width="24"
              height="24"
            ></u-icon>
            <text class="common-card-header-title">{{ TEXT_DOCS.p1.title }}</text>
          </view>
          <view class="common-card__wrapper-content">
            <view class="common-card-content">{{ TEXT_DOCS.p1.t1.content }}</view>
          </view>
        </view>
  
        <!-- 02 -->
        <view class="common-card__wrapper" :style="common_card_header_bg_style">
          <view class="common-card__wrapper-header widthAll u-flex u-row-left">
            <u-icon
              :name="`${static_path}c_i_nav_02.png`"
              width="24"
              height="24"
            ></u-icon>
            <text class="common-card-header-title">{{ TEXT_DOCS.p2.title }}</text>
          </view>
          <view class="common-card__wrapper-content">
            <view class="common-card-content u-p-l-10">
              <view class="u-flex u-gap-20">
                <u-badge :isDot="true" type="info" />
                <text>{{ TEXT_DOCS.p2.t1.content1 }}</text>
              </view>
              <view class="u-flex u-gap-20">
                <u-badge :isDot="true" type="info" />
                <text>{{ TEXT_DOCS.p2.t1.content2 }}</text>
              </view>
              <view class="u-flex u-gap-20">
                <u-badge :isDot="true" type="info" />
                <text>{{ TEXT_DOCS.p2.t1.content3 }}</text>
              </view>
              <view class="u-flex u-gap-20">
                <u-badge :isDot="true" type="info" />
                <text>{{ TEXT_DOCS.p2.t1.content4 }}</text>
              </view>
            </view>
          </view>
        </view>
  
        <!-- 03 -->
        <view class="common-card__wrapper" :style="common_card_header_bg_style">
          <view class="common-card__wrapper-header widthAll u-flex u-row-left">
            <u-icon
              :name="`${static_path}c_i_nav_03.png`"
              width="24"
              height="24"
            ></u-icon>
            <text class="common-card-header-title">{{ TEXT_DOCS.p3.title }}</text>
          </view>
          <view class="common-card__wrapper-content">
            <view class="common-card-content u-flex-col u-gap-28">
              <view
                class="common-card-content__inner-card u-flex u-row-center u-gap-20"
              >
                <view>
                  <view
                    class="common-card-content-title u-font-bold u-font-md u-m-b-10"
                    >{{ TEXT_DOCS.p3.t1.title }}</view
                  >
                  <view>{{ TEXT_DOCS.p3.t1.content }}</view>
                </view>
                <view>
                  <u-icon
                    :name="`${static_path}c_i_copyright.png`"
                    width="60"
                    height="60"
                  ></u-icon>
                </view>
              </view>
              <view
                class="common-card-content__inner-card u-flex u-row-center u-gap-20"
              >
                <view>
                  <view
                    class="common-card-content-title u-font-bold u-font-md u-m-b-10"
                    >{{ TEXT_DOCS.p3.t2.title }}</view
                  >
                  <view>{{ TEXT_DOCS.p3.t2.content }}</view>
                </view>
                <view>
                  <u-icon
                    :name="`${static_path}c_i_authority.png`"
                    width="60"
                    height="60"
                  ></u-icon>
                </view>
              </view>
              <view
                class="common-card-content__inner-card u-flex u-row-center u-gap-20"
              >
                <view>
                  <view
                    class="common-card-content-title u-font-bold u-font-md u-m-b-10"
                    >{{ TEXT_DOCS.p3.t3.title }}</view
                  >
                  <view>{{ TEXT_DOCS.p3.t3.content }}</view>
                </view>
                <view>
                  <u-icon
                    :name="`${static_path}c_i_account.png`"
                    width="60"
                    height="60"
                  ></u-icon>
                </view>
              </view>
            </view>
          </view>
        </view>
  
        <!-- 04 -->
        <view class="common-card__wrapper" :style="common_card_header_bg_style">
          <view class="common-card__wrapper-header widthAll u-flex u-row-left">
            <u-icon
              :name="`${static_path}c_i_nav_04.png`"
              width="24"
              height="24"
            ></u-icon>
            <text class="common-card-header-title">{{ TEXT_DOCS.p4.title }}</text>
          </view>
          <view class="common-card__wrapper-content">
            <view class="common-card-content u-flex-col u-gap-28">
              <view class="common-card-content__inner-card u-flex-col u-gap-20">
                <view class="u-flex u-gap-10 u-col-center">
                  <u-icon
                    :name="`${static_path}c_i_star.png`"
                    width="24"
                    height="24"
                  ></u-icon>
                  <view class="common-card-content-title u-font-bold u-font-md">{{
                    TEXT_DOCS.p4.t1.title
                  }}</view>
                </view>
                <view>
                  {{ TEXT_DOCS.p4.t1.content }}
                </view>
              </view>
              <view class="common-card-content__inner-card u-flex-col u-gap-20">
                <view class="u-flex u-gap-10 u-col-center">
                  <u-icon
                    :name="`${static_path}c_i_right_share.png`"
                    width="24"
                    height="24"
                  ></u-icon>
                  <view class="common-card-content-title u-font-bold u-font-md">{{
                    TEXT_DOCS.p4.t2.title
                  }}</view>
                </view>
                <view>
                  {{ TEXT_DOCS.p4.t2.content }}
                </view>
              </view>
              <view class="common-card-content__inner-card u-flex-col u-gap-20">
                <view class="vertical-stripe__wrapper">
                  <svg
                    class="vertical-stripe"
                    width="4"
                    height="24"
                    viewBox="0 0 4 24"
                    fill="none"
                  >
                    <path
                      d="M2 2L2 22"
                      stroke="#408CFF"
                      stroke-width="4"
                      stroke-linecap="round"
                    />
                  </svg>
                  <svg
                    class="vertical-stripe"
                    width="4"
                    height="24"
                    viewBox="0 0 4 24"
                    fill="none"
                  >
                    <path
                      d="M2 2L2 22"
                      stroke="#408CFF"
                      stroke-width="4"
                      stroke-linecap="round"
                    />
                  </svg>
                </view>
  
                <view class="common-card__wrapper-header u-flex u-row-center">
                  <u-icon
                    :name="`${static_path}c_i_income.png`"
                    width="24"
                    height="24"
                  ></u-icon>
                  <text class="common-card-header-title header-01-title">
                    收益图示
                  </text>
                </view>
                <view
                  class="common-card-content__inner-card common-card-content__inner-card-income u-flex-col u-row-center u-gap-20"
                >
                  <view class="u-flex u-row-between">
                    <view class="u-flex u-col-center">
                      <u-icon
                        :name="`${static_path}c_i_package.png`"
                        width="24"
                        height="24"
                      ></u-icon>
                      <text
                        class="common-card-header-title header-01-title primary-content"
                      >
                        商务合作
                      </text>
                    </view>
                    <view class="u-flex u-col-center">
                      <u-icon
                        :name="`${static_path}c_i_red_hook.png`"
                        width="24"
                        height="24"
                      ></u-icon>
                      <text
                        class="common-card-header-title header-01-title warning-content"
                      >
                        赚取收益
                      </text>
                    </view>
                  </view>
                  <view class="u-flex u-row-between">
                    <view class="primary-circle"> 承制 </view>
                    <u-icon name="arrow-right" color="#408cff"></u-icon>
                    <view class="warning-circle"> 创作收益 </view>
                  </view>
                  <view class="u-flex u-row-between">
                    <view class="primary-circle"> 分发 </view>
                    <u-icon name="arrow-right" color="#408cff"></u-icon>
                    <view class="warning-circle"> 分发收益 </view>
                  </view>
                  <view class="u-flex u-row-between">
                    <view class="primary-circle"> 承制+分发 </view>
                    <u-icon name="arrow-right" color="#408cff"></u-icon>
                    <view class="warning-circle"> 创作+分发 </view>
                  </view>
                </view>
              </view>
            </view>
          </view>
        </view>
  
        <!-- 05 -->
        <view class="common-card__wrapper" :style="common_card_header_bg_style">
          <view class="common-card__wrapper-header widthAll u-flex u-row-left">
            <u-icon
              :name="`${static_path}c_i_nav_05.png`"
              width="24"
              height="24"
            ></u-icon>
            <text class="common-card-header-title">{{ TEXT_DOCS.p5.title }}</text>
          </view>
          <view class="common-card__wrapper-content">
            <view class="common-card-content u-flex-col u-gap-18">
              <view
                class="common-card-content__inner-card common-card-content__inner-card-process u-flex u-gap-10 u-col-center primary-content"
              >
                <u-icon
                  :name="`${static_path}c_i_panel.png`"
                  width="24"
                  height="24"
                ></u-icon>
                <view class="u-font-bold u-font-md">{{
                  TEXT_DOCS.p5.t1.title
                }}</view>
                <view>
                  {{ TEXT_DOCS.p5.t1.content }}
                </view>
              </view>
              <view class="horizontal-line__wrapper">
                <view class="horizontal-line-dash"></view>
                <u-icon
                  name="arrow-down"
                  width="24"
                  height="24"
                  color="#408cff"
                ></u-icon>
                <view class="horizontal-line-dash"></view>
              </view>
              <view
                class="common-card-content__inner-card common-card-content__inner-card-process u-flex u-gap-10 u-col-center primary-content"
              >
                <u-icon
                  :name="`${static_path}c_i_computer.png`"
                  width="24"
                  height="24"
                ></u-icon>
                <view class="u-font-bold u-font-md">{{
                  TEXT_DOCS.p5.t2.title
                }}</view>
                <view>
                  {{ TEXT_DOCS.p5.t2.content }}
                </view>
              </view>
              <view class="horizontal-line__wrapper">
                <view class="horizontal-line-dash"></view>
                <u-icon
                  name="arrow-down"
                  width="24"
                  height="24"
                  color="#408cff"
                ></u-icon>
                <view class="horizontal-line-dash"></view>
              </view>
              <view
                class="common-card-content__inner-card common-card-content__inner-card-process u-flex u-gap-10 u-col-center primary-content"
              >
                <u-icon
                  :name="`${static_path}c_i_guard.png`"
                  width="24"
                  height="24"
                ></u-icon>
                <view class="u-font-bold u-font-md">{{
                  TEXT_DOCS.p5.t3.title
                }}</view>
                <view>
                  {{ TEXT_DOCS.p5.t3.content }}
                </view>
              </view>
              <view class="horizontal-line__wrapper">
                <view class="horizontal-line-dash"></view>
                <u-icon
                  name="arrow-down"
                  width="24"
                  height="24"
                  color="#408cff"
                ></u-icon>
                <view class="horizontal-line-dash"></view>
              </view>
              <view
                class="common-card-content__inner-card common-card-content__inner-card-process u-flex u-gap-10 u-col-center primary-content"
              >
                <u-icon
                  :name="`${static_path}c_i_circle_check.png`"
                  width="24"
                  height="24"
                ></u-icon>
                <view class="u-font-bold u-font-md">{{
                  TEXT_DOCS.p5.t4.title
                }}</view>
                <view>
                  {{ TEXT_DOCS.p5.t4.content }}
                </view>
              </view>
            </view>
          </view>
        </view>
      </view>
  
      <!-- 按钮 -->
      <BottomBtn
        v-if="showBtn"
        :buttonIndex="buttonIndex"
        :data="button_list"
        bgColor="#161B1F"
        @height="getBtnHeight"
        @handel="handleSubmitClick('bottomBtn')"
      >
        <template #customButtonContent>
          <view class="u-flex u-gap-10 u-col-center">
            <u-icon
              v-if="entry_status_icon_for_bottom_btn"
              :name="entry_status_icon_for_bottom_btn"
              size="36rpx"
              
            ></u-icon>
            <text class="u-font-md">{{ entry_status_text }}</text>
          </view>
        </template>
      </BottomBtn>
  
      <BaseModal
        ref="rejectReasonModalRef"
        cancelText="我知道了"
        confirmText="重新申请"
        :value="rejectReasonModalShow"
        :title="rejectReasonTitle"
        :content="rejectReasonContent"
        @input="handleRejectReasonModalShowChange"
        @confirm="handleRejectReasonModalConfirm"
      ></BaseModal>
  
      <!-- 申请表单 -->
      <ApplyFormPopup
        ref="applyFormPopupRef"
        @queryUserEntryStatus="queryUserEntryStatus"
      ></ApplyFormPopup>
  
      <!-- 消息提示 -->
      <base-toast ref="toastRef"></base-toast>
    </template>
  </view>
</template>

<script>
/** 组件 */
import BottomBtn from "@/components/bottom-button/index.vue";
import BaseModal from "@/components/base-modal/index.vue";
import ApplyFormPopup from "./components/applyFormPopup.vue";
import GuideToWebsite from "@/components/guide-to-website/index.vue";

/** 工具 */
import {
  TEXT_DOCS,
  ENTRY_STATUS_TEXT_MAPPER_FOR_BTN,
  ENTRY_STATUS_TEXT_MAPPER_FOR_HEADER,
} from "./config";
import { copy, isMiniProgramBrowser } from "@/utils/tools.js";
import { mapGetters } from "vuex";

/** 接口 */
import { getUserEntryStatus, postApprovalSubmit } from "../api/auth";

export default {
  props: {},

  components: {
    BaseModal,
    BottomBtn,
    ApplyFormPopup,
    GuideToWebsite
  },

  data() {
    return {
      TEXT_DOCS,
      ENTRY_STATUS_TEXT_MAPPER_FOR_BTN,
      ENTRY_STATUS_TEXT_MAPPER_FOR_HEADER,

      /** 用户入驻状态 */
      submitBtnLoading: true,
      entry_status: "LOCAL_QUERY",

      /** 账户选取 */
      accountList: [],

      /** 拒绝modal */
      rejectReasonModalShow: false,
      rejectReasonTitle: "查看原因",
      rejectReasonContent: null,

      /** 底部按钮 */
      buttonIndex: 0,
      btnHeight: 0,

      /** 页面滚动 */
      targetTop: 0,
      targetHeight: 0,
      showBtn: false,

      showGuide: false,
    };
  },

  computed: {
    ...mapGetters(["static_path"]),

    entry_status_icon_for_bottom_btn() {
      const icon =
        this.ENTRY_STATUS_TEXT_MAPPER_FOR_BTN[this.entry_status].icon;
      if (icon) return `${this.static_path}${icon}`;
      return null;
    },

    entry_status_text() {
      return this.ENTRY_STATUS_TEXT_MAPPER_FOR_BTN[this.entry_status].content;
    },

    header_bg_style() {
      const creator_invite_bg_png = `${this.static_path}creator_invite_bg.png`;
      return {
        backgroundImage: `url(${creator_invite_bg_png})`,
        backgroundRepeat: "no-repeat",
        backgroundSize: "contain",
      };
    },

    common_card_header_bg_style() {
      const creator_invite_bg_png = `${this.static_path}c_i_gradient_bg.png`;
      return {
        backgroundImage: `url(${creator_invite_bg_png})`,
        backgroundPosition: "top right",
        backgroundRepeat: "no-repeat",
        backgroundSize: "110% 60px",
      };
    },

    button_list() {
      return [
        [
          {
            type: "primary",
            shape: "square",
            text: this.entry_status_text,
            loading: this.submitBtnLoading,
            loading_text: "正在获取用户入驻状态",
            onClick: "handel",
            btnType: "button",
          },
        ],
      ];
    },
  },

  methods: {
    goBack() {
      uni.switchTab({
        url: '/pages/mine/mine'
      });
    },

    goWaitRealnameCertify() {
      uni.navigateTo({
        url: "/pagesUser/aliRealname/aliRealname",
      });
    },

    // 按钮
    async handleSubmitClick(position) {
      switch (this.entry_status) {
        case "APPLY_JOIN":
          this.handleOpenApplyJoin();
          break;
        case "VERIFY":
          this.toastMsg("平台正在审核中", "error");
          break;
        case "REJECT":
          if (position === "topBtn") this.handleOpenApplyJoin();
          if (position === "bottomBtn") this.handleOpenRejectReasonModal();
          break;
        case "WAIT_REALNAME":
          this.goWaitRealnameCertify();
          break;
        case "ENTRIED":
          this.handleCopyBackEndManagementLoginUrl();
          break;
        case "LOCAL_QUERY":
        default:
          await this.queryUserEntryStatus();
          break;
      }
    },

    // 申请入驻
    handleOpenApplyJoin() {
      this.$refs.applyFormPopupRef.open();
    },

    // 复制后台登录链接
    handleCopyBackEndManagementLoginUrl() {
      /** 后台地址 */
      copy("https://joyful.tuixiaoguo.com/login");
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },

    //#region ===== 拒绝状态操作
    // 查看拒绝原因
    handleOpenRejectReasonModal() {
      this.rejectReasonModalShow = true;
    },

    // 监听拒绝原因modal的显示状态
    handleRejectReasonModalShowChange(val) {
      this.rejectReasonModalShow = val;
    },

    // 拒绝原因modal确认按钮点击事件
    handleRejectReasonModalConfirm() {
      this.handleSubmitClick();
    },
    //#endregion

    //#region ===== 接口
    async queryUserEntryStatus() {
      try {
        this.submitBtnLoading = true;
        const res = await getUserEntryStatus();
        if (res && res.code == 0) {
          this.entry_status = res.data.entry_status;
          this.rejectReasonContent = res.data?.verify_suggest;
        } else {
          this.entry_status = null;
          throw res;
        }
      } catch (error) {
        this.toastMsg(error?.message || "查询用户入驻状态失败", "error");
      } finally {
        this.submitBtnLoading = false;
      }
    },

    //#endregion

    getBtnHeight(height) {
      this.btnHeight = height * 2;
    },
  },

  created() {
    if(isMiniProgramBrowser()) {
      return this.showGuide = true
    }
    this.queryUserEntryStatus();
  },

  onReady() {
    const query = uni.createSelectorQuery().in(this);
    query
      .select(".scroll-target")
      .boundingClientRect((data) => {
        this.targetTop = data?.top || 0;
        this.targetHeight = data?.height || 0;
      })
      .exec();
  },

  onPageScroll(e) {
    const scrollTop = e.scrollTop;
    if (scrollTop > this.targetTop + this.targetHeight) {
      this.showBtn = true;
    } else {
      this.showBtn = false;
    }
  },
};
</script>

<style lang="scss" scoped>
$c-white: #ffffff;
$c-page-primary: rgb(22, 27, 31);
$c-page-primary-lucency: rgba(22, 27, 31, 0.8);
$c-card-bg: #f4f8ff;
$c-card-title: #1a1a1a;
$c-card-content-title: #3c3c3c;
$c-card-content: #6a6a6a;
$c-card-income-bg: #f7faff;
$c-card-process-bg: #e2eeff;

$c-primary-content: #408cff;
$c-warning-content: #ff7736;

::v-deep {
  .u-icon__icon.uicon-arrow-left {
    color: $c-white !important;
  }

  .u-button {
    border-radius: 16rpx;
    // height: 100rpx;
  }
}

.auth-home-page {
  min-height: 100vh;
  padding-bottom: 120rpx;
  background: $c-page-primary;

  // 导航栏
  .navbar-box {
    position: sticky;
    top: 0;
    z-index: 100;
    background: $c-page-primary-lucency;

    /* #ifdef APP || MP */
    padding-top: 88rpx;
    /* #endif */

    .navbar {
      display: flex;
      align-items: center;
      height: 88rpx;
      color: $c-white !important;
    }
  }

  // 页面主体
  .auth-home-page__main-wrapper {
    margin-top: 400rpx;

    // 页面主体通用卡片
    .common-card__wrapper {
      margin-bottom: 32rpx;
      padding: 32rpx;
      background: $c-card-bg;
      border-radius: 32rpx;

      display: flex;
      gap: 24rpx;
      flex-direction: column;
      align-items: flex-start;

      .common-card__wrapper-header {
        width: 100%;
      }
      .common-card-header-title {
        color: $c-card-title;
        font-size: 32rpx;
        font-style: normal;
        font-weight: bolder;
        line-height: 44rpx;
        padding: 0 20rpx;
      }

      .common-card__wrapper-content {
        width: 100%;
      }
      .common-card-content-title {
        color: $c-card-content-title;
      }
      .common-card-content {
        color: $c-card-content;
        font-size: 24rpx;
        font-style: normal;
        line-height: 40rpx;
        margin-bottom: 20rpx;
        letter-spacing: 2rpx; // 字体间距
      }

      .primary-content {
        color: $c-primary-content;
      }
      .warning-content {
        color: $c-warning-content;
      }

      .primary-circle {
        width: 180rpx;
        display: flex;
        justify-content: center;
        border-radius: 100px;
        padding: 8rpx 24rpx;
        border: 1px solid $c-primary-content;
        color: $c-primary-content;
      }
      .warning-circle {
        width: 180rpx;
        display: flex;
        justify-content: center;
        border-radius: 100px;
        padding: 8rpx 24rpx;
        border: 1px solid $c-warning-content;
        color: $c-warning-content;
      }

      .header-01-title {
        font-size: 28rpx;
      }

      .horizontal-line__wrapper {
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 30rpx;

        .horizontal-line-dash {
          width: 40%;
          height: 2rpx;
          border: 1px dashed $c-primary-content;
          opacity: 0.3;
        }
      }

      .common-card-content__inner-card {
        width: 100%;
        padding: 32rpx;
        border-radius: 32rpx;
        background-color: #fff;
        position: relative;

        .vertical-stripe__wrapper {
          width: 100%;
          position: absolute;
          top: -32rpx;
          left: 0;
          padding: 0 80rpx;
          display: flex;
          justify-content: space-between;
          align-items: center;

          .vertical-stripe {
            stroke-width: 8rpx;
            stroke: $c-primary-content;
          }
        }
      }

      .common-card-content__inner-card-income {
        padding: 48rpx;
        background-color: $c-card-income-bg;
        border-radius: 16rpx;
      }

      .common-card-content__inner-card-process {
        padding: 24rpx;
        background-color: $c-card-process-bg;
        border-radius: 16rpx;
      }
    }

    .entry-status-card__wrapper {
      ::v-deep {
        .u-button {
          height: 80rpx;
        }
      }
    }
  }

  .auth-home-bottom-btn {
    width: 100%;
    padding: 28rpx;
    position: fixed;
    bottom: 0;
  }
}
</style>
