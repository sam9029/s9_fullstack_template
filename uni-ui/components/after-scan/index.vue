<template>
  <view>
    <u-modal
      :show="show"
      :showCancelButton="true"
      title="阅读并同意以下协议"
      confirmText="同意并登录"
      confirmColor="#408CFF"
      cancelText="不同意"
      :closeOnClickOverlay="true"
      @cancel="handleClose"
      @close="handleClose"
      @confirm="agreement"
    >
      <view>
        为了保证您的个人信息安全，使用登录功能需要先阅读并同意
        <text class="u-primary" @click="jumpPath('user')">《用户协议》</text>
        和
        <text class="u-primary" @click="jumpPath('privacy')">《隐私政策》</text>
      </view>
    </u-modal>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { postScanLogin } from '@/api/login.js';
import { sleep } from '@/utils/tools.js';
import { mapGetters, mapMutations } from "vuex";
export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {};
  },
  computed: {
    ...mapGetters(['scan_data']),
    show: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit('input', val)
      }
    }
  },
  methods: {
    ...mapMutations(['SET_SCAN_DATA']),
    jumpPath(type) {
      let url = "";
      switch (type) {
        case "user":
          url = "/pagesUser/service/agreement/user";
          break;
        case "privacy":
          url = "/pagesUser/service/agreement/privacy";
          break;
      }
      uni.navigateTo({
        url,
      });
    },

    agreement() {
      postScanLogin({ time: this.scan_data.time, uuid: this.scan_data.uuid, type: "CONFIRM" })
        .then(async (res) => {
          if (res.code == 0) {
            this.toastMsg(res.data.message || "扫码登陆成功", "success");
            await sleep(300);
            this.show = false;
            uni.switchTab({
              url: '/pages/mine/mine'
            })
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        })
        .finally(() => {
          this.SET_SCAN_DATA({ uuid: null, time: null })
        })
    },

    handleClose() {
      this.SET_SCAN_DATA({ uuid: null, time: null })
      this.show = false;
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
};
</script>

<style lang="scss" scoped></style>
