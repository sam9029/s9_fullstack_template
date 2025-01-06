<template>
  <view class="cash-out-page u-p-28">
    <view
      class="top-btn u-bg-f u-p-32 u-flex-row u-row-between u-col-center u-m-b-28 base-border-r"
      @click="jumpAdd"
    >
      <view class="u-flex-row u-col-center">
        <u--image
          :src="`${static_path}cash_out_add_icon.png`"
          width="48rpx"
          height="48rpx"
        ></u--image>
        <text class="u-font-28 u-line-h-48 colot-text-black u-m-l-16"
          >添加新的提现方式</text
        >
      </view>
      <u-icon name="arrow-right" color="#2c2c2c" size="16"></u-icon>
    </view>
    <view v-if="cashOutList.length" class="account-list">
      <view
        v-for="item in cashOutList"
        :key="item.id"
        class="account-list--item u-p-32 base-border-r u-m-b-28"
        :class="{
          bank: item.pay_platform == 'BANK',
          alipay: item.pay_platform == 'ALIPAY',
          wxpay: item.pay_platform == 'WXPAY',
        }"
      >
        <view class="item--top u-m-b-48">
          <u--image
            v-if="item.pay_platform == 'BANK'"
            :src="`${static_path}bank_icon.png`"
            width="48rpx"
            height="48rpx"
          ></u--image>
          <u--image
            v-else
            :src="`${static_path}alipay_icon.png`"
            width="48rpx"
            height="48rpx"
          ></u--image>
          <text
            v-if="item.pay_platform == 'BANK'"
            class="color-text-white u-font-28 u-line-h-48"
            >银行卡</text
          >
          <text v-else class="color-text-white u-font-28 u-line-h-48"
            >支付宝</text
          >
          <text class="u-font-28 u-line-h-48 color-text-white u-text-right">{{
            item.pay_account
          }}</text>
        </view>
        <view class="item--bottom u-flex-row u-row-between u-col-center">
          <text class="u-font-24 u-line-h-40 color-text-white">{{ item.limit_desc }}</text>
          <view
            class="u-p-x-24 u-p-y-4 color-text-white"
            style="border-radius: 100px; background: #ffffff33"
            @click="onUnbind(item)"
          >解绑</view>
        </view>
      </view>
    </view>
    <view v-if="!cashOutList.length" class="u-m-t-100">
      <u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
    </view>

    <u-modal
      :show="showUnbind"
      title="温馨提示"
      showCancelButton
      confirmText="删除"
      @confirm="submitUnbind"
      @cancel="showUnbind = false"
    >
      <text style="color: #3c3c3c">解除后无法恢复，确认解除吗？</text>
    </u-modal>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { getBankList, postBankUnbind } from "../api/cashOut";
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      showUnbind: false,
      cashOutList: [],
      currentId: null,
    };
  },
  computed: {
    ...mapGetters(['static_path', 'image']),
  },
  methods: {
    queryList() {
      this.toastMsg("加载中", "loading", -1);
      getBankList()
        .then((res) => {
          if (res.code == 0) {
            this.cashOutList = res.data.list;
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        })
        .finally(() => {
          uni.stopPullDownRefresh();
          this.$refs.toastRef.close();
        });
    },

    onUnbind(row) {
      this.showUnbind = true;
      this.currentId = row.id;
    },

    submitUnbind() {
      this.toastMsg("加载中", "loading", -1);
      postBankUnbind({ id: this.currentId })
        .then((res) => {
          if (res.code == 0) {
            this.showUnbind = false;
            this.toastMsg("解绑成功", "success");
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        })
        .finally(() => {
          this.$refs.toastRef.close();
        });
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },

    jumpAdd() {
      uni.navigateTo({
        url: "/pagesUser/cashOut/addCashOut",
      });
    },
  },
  onReady() {
    this.queryList();
  },

  onPullDownRefresh() {
    this.queryList();
  },
};
</script>

<style lang="scss" scoped>
.base-border-r {
  border-radius: 32rpx;
}
.cash-out-page {
  min-height: 100vh;
  background-color: #f6f7fb;
  .account-list {
    .account-list--item {
      .item--top {
        display: grid;
        grid-template-columns: 64rpx 1fr 136rpx;
        align-items: center;
      }
    }
  }
}
.bank {
  background: linear-gradient(90deg, #fe6d65 0%, #fd5462 100%);
}
.alipay {
  background: linear-gradient(90deg, #65b2fe 0%, #5484fd 100%);
}
.wxpay {
  background: linear-gradient(90deg, #65fe6d 0%, #54fd54 100%);
}
</style>
