<template>
  <view class="detail-popup">
    <u-popup v-show="display" :show="show" mode="bottom">
      <view class="u-p-28">
        <view class="popup-top u-flex-row u-row-between u-col-center u-m-b-32">
          <text class="u-font-32 u-line-h-48 color-text-black u-font-bold"
            >申请入驻创作者</text
          >
          <u-icon
            @click="onClose"
            :name="`${static_path}close_circle.png`"
            size="24"
          ></u-icon>
        </view>
        <view
          class="u-bg-f u-flex-row u-row-between u-col-center u-p-24 u-m-b-20 u-border-radius"
          style="border: 2rpx solid #eeeeee"
        >
          <text class="u-font-sm u-line-h-36 u-m-l-16"
            >欢迎加入创作者团队！请添加您的抖音或快手账号，平台会根据您提供账号的作品来判断是否符合入驻要求</text
          >
        </view>
        <view class="scroll-y" style="height: 650rpx">
          <u--form
            labelPosition="top"
            labelWidth="200rpx"
            labelAlign="left"
            :model="applyModel"
            :rules="rules"
            :labelStyle="{ fontSize: '27rpx' }"
            ref="uForm"
          >
            <u-form-item
              label="添加平台账号"
              prop="platform_primary_id"
              :required="true"
            >
              <view class="accout-selected-item">
                <view
                  v-if="!isSelectedAccount"
                  class="u-flex u-gap-28 u-row-between"
                  @click="onOpenSelectAccout"
                >
                  <u-icon
                    :name="`${static_path}account_selection.png`"
                    size="48"
                  ></u-icon>
                  <text class="u-flex-1"> 请选择平台账号 </text>
                  <u-icon
                    name="arrow-right"
                    size="24rpx"
                  ></u-icon>
                </view>

                <view v-if="isSelectedAccount">
                  <view
                    class="u-flex u-gap-28 u-row-between u-col-center u-m-b-20"
                  >
                    <u-icon :name="selectedAccountIcon" size="48"></u-icon>
                    <view
                      class="u-flex-1 u-flex-col u-gap-10 u-row-center u-col-left"
                    >
                      <view class="u-font-bold">{{
                        selectedAccountInfo[0].label
                      }}</view>
                      <view class="u-flex u-gap-10"
                        ><u-icon
                          :name="`${static_path}account_id.png`"
                          size="24"
                        ></u-icon>
                        <text class="u-font-xs id-text">
                          {{ selectedAccountInfo[0].id }}
                        </text>
                      </view>
                    </view>
                    <u-icon
                      name="arrow-right"
                      size="24rpx"
                    ></u-icon>
                  </view>
                  <view
                    class="fan-counts-input__wrapper u-flex u-gap-10 u-row-between u-col-center"
                  >
                    <text class="u-font-xs id-text"> 粉丝数量 </text>
                    <input
                      class="fan-counts-input u-flex-1"
                      type="number"
                      dir="rtl"
                      v-model="applyModel.fan_counts"
                      placeholder="请输入账户粉丝数量"
                    />
                    <u-icon
                      :name="`${static_path}c_i_edit.png`"
                      size="14"
                    ></u-icon>
                  </view>
                </view>
              </view>
            </u-form-item>
            <u-form-item
              label="联系方式"
              prop="phone_number"
              :required="true"
              class="phone_number-input-item"
            >
              <u--input
                type="number"
                v-model="applyModel.phone_number"
                placeholder="请输入您常用手机号便于联系"
              ></u--input>
            </u-form-item>
          </u--form>
        </view>
      </view>

      <BottomBtn
        :data="popup_button_list"
        :buttonIndex="0"
        @submitSingUp="beforeSubmitSingUp"
        @height="getPopupBtnHeight"
      />
    </u-popup>

    <!-- 账户选取 -->
    <AccountPopup
      ref="accountPopupRef"
      @close="onCloseSelectAccout"
      @next="onSelectAccoutCompleted"
    ></AccountPopup>

    <!-- 验证码 -->
    <!-- 滑动验证码 -->
    <SlideCode
      ref="sider"
      :style="{ zIndex: 99999 }"
      v-if="showSlideCode"
      @slide_end="onCaptchaCodeConfirm"
      @close="onCaptchaCodeCanel"
    ></SlideCode>

    <!-- 成功失败提示 -->
    <BaseModal
      ref="modalRef"
      confirmText="我知道了"
      :showCancelBtn="false"
      :value="modalShow"
      :title="modalTitle"
      :content="modalContent"
      @input="handleModalShowChange"
      @confirm="handleModalConfirm"
    ></BaseModal>

    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import BaseModal from "@/components/base-modal/index.vue";
import SlideCode from "@/components/slide-code/index.vue";
import BottomBtn from "@/components/bottom-button/index.vue";
import AccountPopup from "./accountPopup.vue";

import { mapGetters } from "vuex";
import { postApprovalSubmit } from "../../api/auth";

export default {
  components: {
    BaseModal,
    SlideCode,
    BottomBtn,
    AccountPopup,
  },
  data() {
    return {
      id: 40,
      submitLoading: false,
      popupBtnHeight: "",

      display: true,
      show: false,

      /** 验证码 */
      showSlideCode: false,
      selectedAccountInfo: [],
      modalShow: false,
      modalTitle: "提交成功",
      modalContent: "我们已收到您的申请，将尽快进行审核",

      applyModel: {
        platform_primary_id: null, //选中的博主平台账号
        captcha_code: null, //图形验证码
        phone_number: null, //联系方式
        fan_counts: null, //粉丝数
      },
      rules: {
        // 请选择平台账号
        platform_primary_id: [
          {
            required: true,
            message: "请选择平台账号",
            trigger: ["change", "blur"],
          },
        ],
        //粉丝数
        fan_counts: [
          {
            required: true,
            message: "请输入粉丝数",
            trigger: ["change", "blur"],
          },
        ],
        //联系方式
        phone_number: [
          {
            required: true,
            message: "请输入手机号",
            trigger: ["blur"],
          },
          {
            validator: (rule, value, callback) => {
              return uni.$u.test.mobile(value);
            },
            message: "手机号码不正确",
            trigger: ["change", "blur"],
          },
        ],
      },
    };
  },
  computed: {
    ...mapGetters(["static_path", "image"]),

    isSelectedAccount() {
      return this.selectedAccountInfo.length ? true : false;
    },

    selectedAccountIcon() {
      let icon = `account_selection.png`;

      if (this.selectedAccountInfo.length) {
        const platform_name = this.selectedAccountInfo[0].list[0].platform_name;

        switch (platform_name) {
          case "抖音":
            icon = "douyin_2x.png";
            break;
          case "快手":
            icon = "kuaishou_2x.png";
            break;
          default:
            break;
        }
      }

      return `${this.static_path}${icon}`;
    },

    popup_button_list() {
      return [
        [
          {
            text: "提交申请",
            shape: "square",
            onClick: "submitSingUp",
            btnType: "button",
            type: "primary",
            loading: this.submitLoading,
          },
        ],
      ];
    },
  },
  methods: {
    getPopupBtnHeight(height) {
      this.popupBtnHeight = height * 2 + 30 + "rpx";
    },

    open() {
      this.display = true;
      this.show = true;
    },

    onClose() {
      this.show = false;
      this.selectedAccountInfo = [];
      this.applyModel = this.$options.data().applyModel;
    },

    //#region ===== 账户选取
    onOpenSelectAccout() {
      this.display = false;
      this.$refs.accountPopupRef.open();
    },

    onSelectAccoutCompleted(selected) {
      const { id, list } = selected;
      this.selectedAccountInfo = [JSON.parse(JSON.stringify(selected))];
      this.applyModel.platform_primary_id = id;
      this.applyModel.fan_counts = list[0].fan_counts;
      this.display = true;
    },

    onCloseSelectAccout() {
      this.display = true;
    },
    //#endregion

    //#region ===== 验证码
    onOpenCaptcha() {
      this.showSlideCode = true;
    },

    onCaptchaCodeCanel() {
      this.showSlideCode = false;
    },

    onCaptchaCodeConfirm(val) {
      if (!val) return this.toastMsg("请滑动拼图！", "error"); // 验证滑动拼图是否成功
      this.showSlideCode = false;

      this.applyModel.captcha_code = val.toString();
      this.submitSingUp();
    },
    //#endregion

    //#region ===== 提交
    beforeSubmitSingUp() {
      /** 校验 */
      this.$refs.uForm.validate();
      if (!this.applyModel.platform_primary_id) {
        this.toastMsg("未选中的博主平台账号", "error");
        return;
      } else if (!this.applyModel.phone_number) {
        this.toastMsg("请输入联系方式", "error");
        return;
      } else if (!uni.$u.test.mobile(this.applyModel.phone_number)) {
        this.toastMsg("手机格式输入错误", "error");
        return;
      } else if (!this.applyModel.fan_counts) {
        this.toastMsg("请输入粉丝数", "error");
        return;
      }

      this.onOpenCaptcha();
    },

    async submitSingUp() {
      /** 接口调用 */
      await this.handleApply();
      this.onClose();
    },
    //#endregion

    //#region =====  打开成功弹窗
    handleModalShowChange(val) {
      this.modalShow = val;
    },

    handleModalConfirm() {
      this.handleModalShowChange(false);
    },
    //#endregion

    async handleApply() {
      try {
        const res = await postApprovalSubmit({
          ...this.applyModel,
        });
        if (res && res.code == 0) {
          this.handleModalShowChange(true);
        } else {
          throw res;
        }
      } catch (error) {
        this.toastMsg(error?.message || "申请入驻失败", "error");
      } finally {
        this.$emit("queryUserEntryStatus");
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

  mounted() {
    this.$nextTick(() => {
      //如果需要兼容微信小程序，并且校验规则中含有方法等，只能通过setRules方法设置规则。
      this.$refs.uForm?.setRules(this.rules);
    });
  },
};
</script>

<style lang="scss" scoped>
$c-bg-primary: #f6f6f6;
$c-text-primary: #989898;

::v-deep .u-popup__content {
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
}

::v-deep .u-empty__text {
  position: relative;
  top: -100rpx;
}

::v-deep {
  .u-form-item__body__left__content__required {
    padding-left: 20rpx;
  }
  .u-form-item__body__left__content__label {
    padding-left: 25rpx;
  }

  .phone_number-input-item {
    .u-input {
      background-color: $c-bg-primary;
      border-radius: 16rpx;
    }
  }
}

.accout-selected-item {
  width: 100%;
  padding: 32rpx;
  border-radius: 16rpx;
  background-color: $c-bg-primary;
}

.id-text {
  color: $c-text-primary;
}

.fan-counts-input__wrapper {
  background-color: #ffffff;
  padding: 20rpx;
  border-radius: 16rpx;

  .fan-counts-input {
    font-size: 12px;
  }
}
</style>
