<template>
  <view class="detail-popup">
    <u-popup :show="show" mode="bottom">
      <view class="u-p-28">
        <view class="popup-top u-flex-row u-row-between u-col-center u-m-b-32">
          <text class="u-font-32 u-line-h-48 color-text-black u-font-bold"
            >请选择平台账号</text
          >
          <u-icon
            @click="onClose"
            :name="`${static_path}close_circle.png`"
            size="24"
          ></u-icon>
        </view>
        <view
          class="u-bg-f u-flex-row u-row-between u-col-center u-p-24 u-m-b-28 u-border-radius"
          style="border: 2rpx solid #eeeeee"
          @click="jumpAddAcc"
        >
          <view class="u-flex-row u-col-center">
            <u-icon
              :name="`${static_path}cash_out_add_icon.png`"
              size="24"
            ></u-icon>
            <text class="u-font-28 u-line-h-48 u-m-l-16">添加账号</text>
          </view>
          <u-icon name="arrow-right" size="16" color="#2C2C2C"></u-icon>
        </view>
        <view
          v-if="accountList.length"
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
          <view class="u-flex-row u-flex-1 u-col-center">
            <u-image :src="item.platform_icon" width="28rpx" height="28rpx"></u-image>
            <text
              class="u-m-l-8 u-font-28 u-line-h-44"
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
        <view v-else style="height: 472rpx" class="u-p-t-30">
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
import eventBus from '@/utils/eventBus.js'
export default {
  components: {
    BottomBtn,
  },
  data() {
    return {
      id: 40,
      submitLoading: false,
      accountList: [],
      popupBtnHeight: "",
      selected: null,
      show: false,
    };
  },
  mounted() {

    eventBus.$on('updatePlatformAccountInfo', () => {
      let feedback = this.selected?.id || null;
      this.queryAcc().then(() => {
        if (feedback) {
          this.accountList.forEach((el) => {
            if (el.id == feedback) {
              this.chooseAccount(el);
            }
          });
        }
      });
    })
  },
  beforeDestroy() {
    // 移除监听，避免内存泄漏
    eventBus.$off('updatePlatformAccountInfo');
  },
  computed: {
    ...mapGetters(["static_path", "image"]),
    popup_button_list() {
      return [
        [
          {
            text: this.accountList.length ? "确认" : "去添加账号",
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
              this.chooseAccount(el);
            }
          });
        }
      });
    },

    onClose() {
      this.$emit("onClose");
      this.show = false;
      this.id = null;
      this.selected = null;
    },

    submitSingUp() {
      if (this.accountList.length) {
        if (!this.selected) {
          return this.toastMsg("请选择平台账号", "error");
        }
        this.$emit("next", {
          ...this.selected,
          list: this.accountList.map((el) => {
            el["name"] = el.label;
            delete el.label;
            return el;
          }),
        });
        this.onClose();
      } else {
        this.jumpAddAcc();
      }
    },

    jumpAddAcc() {
      uni.navigateTo({
        url: "/pagesUser/account/addAccount",
      });
    },

    chooseAccount(item) {
      this.accountList.forEach((acc) => {
        if (acc.id !== item.id) {
          acc.selected = false;
        }
      });
      item.selected = true;
      this.selected = {
        id: item.id,
        platform_account_id: item.platform_account_id,
        label: item.label,
        platform_icon: item.platform_icon,
      };
    },

    queryAcc() {
      return new Promise((resolve, reject) => {
        this.toastMsg("加载中", "loading", -1);
        getPlatformAcc()
          .then((res) => {
            if (res.code == 0) {
              this.accountList = res.data.map((el) => {
                return {
                  ...el,
                  selected: false,
                };
              });
              this.$refs.toastRef.close();
            }
            resolve();
          })
          .catch((error) => {
            this.toastMsg(error.message || error, "error");
            reject(error);
          });
      });
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
