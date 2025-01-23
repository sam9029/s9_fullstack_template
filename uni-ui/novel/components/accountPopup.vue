<template>
  <view class="detail-popup">
    <u-popup :show="show" mode="bottom">
      <view class="u-p-28">
        <view class="popup-top u-flex-row u-row-between u-col-center u-m-b-32">
          <text class="u-font-32 u-line-h-48 color-text-black u-font-bold"
            >{{ title }}</text
          >
          <u-icon
            @click="onClose"
            :name="`${static_path}close_circle.png`"
            size="24"
          ></u-icon>
        </view>
        <view
          class="u-bg-f u-flex-row u-row-between u-col-center u-p-24 u-m-b-28 u-border-radius"
          style="border: 1rpx solid #eeeeee"
          @click="jumpAddAcc"
        >
          <view class="u-flex-row u-col-center">
            <u-icon
              :name="`${static_path}cash_out_add_icon.png`"
              size="24"
            ></u-icon>
            <text class="u-font-28 u-line-h-48 u-m-l-16">添加抖音账号</text>
          </view>
          <u-icon name="arrow-right" size="16" color="#2C2C2C"></u-icon>
        </view>
        <view v-if="loading" class="skeleton-box" style="height: 472rpx">
          <BaseSkeleton height="92rpx" round="16rpx" class="u-m-b-16"/>
          <BaseSkeleton height="92rpx" round="16rpx" class="u-m-b-16"/>
          <BaseSkeleton height="92rpx" round="16rpx" class="u-m-b-16"/>
          <BaseSkeleton height="92rpx" round="16rpx"/>
        </view>
        <view
          v-if="!loading && accountList.length"
          class="account-list scroll-y"
          style="height: 472rpx"
        >
          <view
            v-for="(item, index) in accountList"
            :key="index"
            class="account-list--item u-p-24 u-flex-row u-row-between u-col-center u-border-radius u-m-b-16"
            style="background: #f6f6f6"
            @click="chooseAccount(item)"
          >
            <view class="u-flex-row u-col-center">
              <u--image :src="item.platform_icon" width="32rpx" height="32rpx"></u--image>
              <text
                class="u-font-28 u-line-h-44 u-m-l-8 u-font-bold"
                :class="{
                  'color-text-black': !item.selected,
                  'color-text-primary': item.selected,
                }"
                >{{ item.label }}</text
              >
            </view>
            <u-icon
              v-if="item.selected"
              :name="`${static_path}radio_seleted.png`"
              size="16"
            ></u-icon>
          </view>
          <view
            :style="{ height: popupBtnHeight }"
            class="u-flex-row u-row-center"
          >
            <text class="u-font-24 color-text-less-grey">-到底了-</text>
          </view>
        </view>
        <view v-if="!loading && !accountList.length" style="height: 472rpx" class="u-p-t-30">
          <u-empty text="暂无已添加的账号" :icon="image.no_data_list"></u-empty>
        </view>
      </view>

      <BottomBtn
        :data="popup_button_list"
        :buttonIndex="0"
        @submitSingUp="submitSingUp"
        @height="getPopupBtnHeight"
      />
    </u-popup>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
import { getPlatformAcc } from "@/api/public.js";
import BottomBtn from "@/components/bottom-button/index.vue";
import BaseSkeleton from '@/components/base-skeleton/index.vue';
import { sleep } from "@/utils/tools.js";
export default {
  props: {
    title: {
      type: String,
      default: "请选择抖音账号"
    },
    platform_id: {
      type: Number,
      default: 1
    },
    extra_params: {
      type: Object,
      default: () => ({})
    }
  },
  components: {
    BottomBtn,
    BaseSkeleton
  },
  data() {
    return {
      id: 40,
      submitLoading: false,
      accountList: [],
      popupBtnHeight: "",
      selected: null,
      loading: true,
      show: false,
    };
  },
  computed: {
    ...mapGetters(['static_path', 'image']),
    popup_button_list() {
      return [
        [
          {
            text: this.accountList.length ? "确认" : "去添加抖音账号",
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

    open(task_id, feedback) {
      this.id = task_id || "";
      this.show = true;
      this.queryAcc().then(() => {
        if (feedback) {
          this.accountList.forEach((el) => {
            if (el.id == feedback) {
              this.$set(el, "selected", true);
            }
          });
          this.selected = this.accountList.find((el) => el.id == feedback);
        }
      })
    },

    onClose() {
      this.show = false;
      this.id = null;
      this.selected = null;
      this.$emit("close");
    },

    submitSingUp() {
      if (this.accountList.length) {
        if(!this.selected) {
          return this.toastMsg('请选择抖音账号', 'error')
        }
        this.$emit("next", {
          ...this.selected,
          list: this.accountList.map((el) => {
            el["name"] = el.label;
            delete el.label;
            return el;
          }),
          extra_params: this.extra_params,
        });
        this.onClose();
      } else {
        this.jumpAddAcc();
      }
    },

    jumpAddAcc() {
      this.$emit('jump')
      uni.navigateTo({
        url: `/pagesUser/account/addAccount?platform_id=${this.platform_id}`,
      });
      this.onClose();
    },

    chooseAccount(item) {
      this.accountList.forEach((acc) => {
        if (acc.id !== item.id) {
          acc.selected = false;
        }
      });
      item.selected = !item.selected;
      this.selected = {
        id: item.id,
        platform_account_id: item.platform_account_id,
        label: item.label,
      };
    },

    queryAcc() {
      return new Promise((resolve, reject) => {
        this.loading = true;
        getPlatformAcc({ platform_id: this.platform_id })
          .then((res) => {
            if (res.code == 0) {
              this.accountList = res.data.map((el) => {
                return {
                  ...el,
                  selected: false,
                };
              });
            }
            resolve()
          })
          .catch((error) => {
            this.toastMsg(error.message || error, "error");
            reject(error)
          })
          .finally(async() => {
            await sleep(300);
            this.loading = false;
          })
      })
    },

    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
    },
  },
};
</script>

<style lang="scss" scoped>
::v-deep .u-popup__content {
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
}
::v-deep .u-empty__text {
  position: relative;
  top: -100rpx;
}
</style>
