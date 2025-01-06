<template>
  <view class="service widthAll u-font-md">
    <MyNavbar>
      <view slot="navbarData" style="width: 100%; height: 100%" class="u-font-18 u-font-bold u-p-r-28 u-flex u-row-center">联系客服</view>
    </MyNavbar>
    <view class="u-m-t-100 u-m-l-30" style="height: 77rpx">
      <u--image :src="customerServiceAddWeChatIcon" mode="widthFix" width="379rpx" height="77rpx">
        <template v-slot:loading>
          <u-loading-icon color="gray"></u-loading-icon>
        </template>
      </u--image>
    </view>
    <text class="color-text-grey u-m-t-8 u-m-l-30" style="font-weight: 400">协助您高效解答疑惑</text>
    <view class="u-rela u-p-b-30">
      <view class="qr-card u-m-t-46 u-m-l-30 u-m-r-30 u-p-t-100 u-flex-col u-col-center u-rela">
        <view class="u-m-t-18 u-rela" style="width: 473rpx; height: 473rpx">
          <u--image class="" :src="customerServiceBorderIcon" mode="widthFix" width="473rpx" height="473rpx"></u--image>
          <view class="u-abso" style="top: 34rpx; left: 34rpx">
            <u--image :src="serviceQRUrl" mode="widthFix" width="406rpx" height="406rpx">
              <template v-slot:loading>
                <u-loading-icon color="gray"></u-loading-icon>
              </template>
            </u--image>
          </view>
        </view>

        <view class="tip-button u-m-t-100 u-m-b-100 u-text-center color-text-white">
          <text>长按识别二维码添加客服微信</text>
        </view>
      </view>
      <view class="u-abso" style="top: -246rpx; right: -30rpx; z-index: 1">
        <u--image :src="customerServiceCharacterIcon" mode="widthFix" width="325rpx" height="307rpx">
          <template v-slot:loading>
            <u-loading-icon color="gray"></u-loading-icon>
          </template>
        </u--image>
      </view>
    </view>
    <u-toast ref="uToast"></u-toast>

    <!-- <Connect ref="connect"></Connect> -->

    <!-- <BottomButton :data="buttonList" @oncontact="oncontact"></BottomButton> -->

    <!-- #ifdef H5 || APP -->
    <!-- <u-modal :show="show" title="提示" content='是否打开欢乐创小程序联系在线客服？' @confirm="toApplet" @cancel="show = false" showCancelButton></u-modal> -->
    <!-- #endif -->
  </view>
</template>

<script>
import MyNavbar from '@/components/my-navbar/my-navbar.vue';
import {
  customerServiceCharacterIcon,
  customerServiceAddWeChatIcon,
  // customerServiceQRIcon,
  customerServiceBorderIcon
} from '@/pagesUser/icon.js';
import { getConcatOnline } from '@/api/account.js';
export default {
  components: {
    MyNavbar
  },
  data() {
    return {
      customerServiceCharacterIcon,
      customerServiceAddWeChatIcon,
      // customerServiceQRIcon,
      customerServiceBorderIcon,
      menuButtonInfo: null,
      show: false,
      serviceQRUrl: null
    };
  },
  computed: {},
  created() {},
  onReady() {
    this.getService();
  },
  onPullDownRefresh() {},
  methods: {
    getService() {
      getConcatOnline({ type: 'QR' })
        .then((res) => {
          if (res && res.code === 0) {
            this.serviceQRUrl = res.data.content;
          }
        })
        .catch((err) => {
          this.$refs.uToast?.show({ message: err.message || '获取二维码失败', type: 'error' });
        });
    }
  }
};
</script>

<style scoped lang="scss">
.service {
  background: linear-gradient(180deg, #d6e3ff 0%, #f5f5f5 100%);
  font-family: PingFang SC, PingFang SC;
  font-weight: 500;
  min-height: 100vh;

  .qr-card {
    background: rgba(255, 255, 255, 0.4);
    box-shadow: 0px 12px 23px 0px rgba(8, 47, 104, 0.03);
    border-radius: 27rpx;
    opacity: 1;
    border: 2px solid rgba(255, 255, 255, 0.8);
    z-index: 2;
    backdrop-filter: saturate(50%) blur(4px);

    .tip-button {
      width: 404rpx;
      height: 69rpx;
      line-height: 69rpx;
      border-radius: 69rpx;
      background-color: $u-primary;
    }
  }
}
::v-deep {
  .my-navbar {
    .custom-area {
      display: flex !important;
      align-items: center;
    }
  }

  .navbarBgShow {
    // background-image: url('background.jpg');
    backdrop-filter: blur(5px);
  }
}
::v-deep {
  .navbarBgShow {
    align-items: center;
  }
}
</style>
