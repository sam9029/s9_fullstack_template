<template>
  <view class="setting-page u-p-28">
    <view class="u-bg-f u-border-radius u-m-b-28 u-p-28">
      <text class="u-font-24" style="color: #3c3c3c">账号</text>
      <view class="menu-item u-m-b-48 u-m-t-48" @click="jumpPage(0)">
        <text class="u-font-28 color-text-black">个人资料</text>
        <u-icon name="arrow-right" color="#1a1a1a"></u-icon>
      </view>
      <view class="menu-item u-m-b-48" @click="jumpPage(1)">
        <text class="u-font-28 color-text-black">注销账号</text>
        <u-icon name="arrow-right" color="#1a1a1a"></u-icon>
      </view>
      <view class="menu-item" @click="jumpPage(2)">
        <text class="u-font-28 color-text-black">修改密码</text>
        <u-icon name="arrow-right" color="#1a1a1a"></u-icon>
      </view>
    </view>
    <view class="u-bg-f u-border-radius u-m-b-28 u-p-28">
      <text class="u-font-24" style="color: #3c3c3c">关于</text>
      <view class="menu-item u-m-b-48 u-m-t-48" @click="jumpPage(3)">
        <text class="u-font-28 color-text-black">用户协议</text>
        <u-icon name="arrow-right" color="#1a1a1a"></u-icon>
      </view>
      <view class="menu-item" @click="jumpPage(4)">
        <text class="u-font-28 color-text-black">隐私政策</text>
        <u-icon name="arrow-right" color="#1a1a1a"></u-icon>
      </view>
    </view>
    <view
      class="logout u-bg-f u-border-radius u-flex-row u-col-center u-row-center u-p-28"
      @click="logout"
    >
      <text class="u-font-28 u-text-error">退出登录</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {};
  },
  methods: {
    async logout() {
      uni.clearStorageSync();
      this.$store.dispatch("LogOut");
    },

    jumpPage(index) {
      switch (index) {
        case 0:
          uni.redirectTo({
            url: "/pagesUser/setting/userInfo",
          });
          break;
        case 1:
          uni.redirectTo({
            url: "/pagesUser/setting/cancelAcc",
          });
          break;
        case 2:
          uni.navigateTo({
            url: "/pages/login/forget?type=reset",
          });
          break;
        case 3:
          uni.navigateTo({
            url: "/pagesUser/service/agreement/user",
          });
          break;
        case 4:
          uni.navigateTo({
            url: "/pagesUser/service/agreement/privacy",
          });
          break;
      }
    },
  },
};
</script>

<style lang="scss" scoped>
.menu-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.logout {
  &:hover {
    background-color: #eeeeee;
  }
}
</style>
