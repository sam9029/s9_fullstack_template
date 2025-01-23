<template>
  <view class="cancel-acc-page">
    <view class="u-m-t-28 u-p-x-28">
      <view class="u-border-radius u-bg-f u-p-48">
        <view class="color-text-black u-font-48 u-line-h-64 u-m-b-16 u-font-weight"
          >账户注销</view
        >
        <view
          class="color-text-less-grey u-font-24 u-line-h-40"
          style="margin-bottom: 64rpx"
          >以下信息将被清空且无法找回</view
        >
        <ul style="padding-left: 48rpx">
          <li class="color-text-less-black u-font-28 u-line-h-44 u-m-b-24">
            注销账号后您在平台的所有数据都将会被清空，包含但不限于收益信息、待到账收益、个人信息、消费信息、邀请记录等。
          </li>
          <li class="color-text-less-black u-font-28 u-line-h-44 u-m-b-24">
            注销账号后用原手机号重新注册不会删除原推荐人与您账号的绑定关系。
          </li>
          <li class="color-text-less-black u-font-28 u-line-h-44">
            该账号的全部个人资料和历史信息将无法找回。
          </li>
        </ul>
      </view>
    </view>
    <view class="u-font-14 u-flex agreement-box u-row-center" :style="{ bottom: btnHeight + 'rpx' }">
      <u-checkbox-group v-model="checked">
        <u-checkbox shape="circle" activeColor="#408CFF" />
      </u-checkbox-group>
      <view class="u-font-24 u-line-h-40 color-text-less-grey">
        <text>我已阅读并完全理解账号注销说明</text>
      </view>
    </view>
    <BottomBtn
      bgColor="#F6F7FB"
      :data="button_list"
      :buttonIndex="0"
      @submit="handleSubmit"
      @height="getHeight"
    />
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import BottomBtn from "@/components/bottom-button/index.vue";
export default {
  props: {},
  components: {
    BottomBtn,
  },
  data() {
    return {
      checked: [],
      btnHeight: 0,
      button_list: [
        [
          {
            text: "注销账号",
            shape: "square",
            type: "primary",
            onClick: "submit",
            btnType: "button",
            customStyle: { "font-size": "28rpx" },
          },
        ],
      ],
    };
  },
  methods: {
    getHeight(height) {
      this.btnHeight = height * 2 + 32;
    },
    handleSubmit() {
      if(this.checked.length==0) {
        return this.toastMsg('请阅读并同意账号注销说明', 'error')
      }
      uni.redirectTo({
        url: "/pages/login/forget?type=logoff",
      });
    },
    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration
      });
    },
  },
};
</script>

<style lang="scss" scoped>
.agreement-box {
  position: fixed;
  width: 100%;
  left: 0;
}
::v-deep .u-button {
  height: 88rpx !important;
}
</style>
