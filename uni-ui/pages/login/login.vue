<template>
  <view class="login-page">
    <MyNavbar
      bgColor="transparent"
      :routerMode="routerMode"
      :targetUrl="targetUrl"
    >
    </MyNavbar>
    <view class="login-page-bg u-p-t-20 u-p-b-20 u-p-l-80 u-p-r-80">
      <view class="top-message">
        <text class="title color-text-black u-font-48">手机号密码登录</text>
      </view>

      <view class="main-buttons">
        <u-form :model="model" ref="formRef" :rules="rules">
          <u-form-item prop="email" borderBottom>
            <u-input 
              placeholder="请输入手机号" 
              type="number"
              v-model="model.email" 
            />
          </u-form-item>
          <u-form-item prop="password" borderBottom>
            <u-input
              placeholder="请输入密码"
              v-model.trim="model.password"
              :password="eyeShow"
            >
              <template slot="suffix">
                <text
                  v-if="eyeShow"
                  class="uniicons u-font-36"
                  :style="{ color: '#929292' }"
                  @click="eyeShow = !eyeShow"
                >
                &#xe63a
                </text>
                <text
                  v-else
                  class="uniicons u-font-36"
                  :style="{ color: '#929292' }"
                  @click="eyeShow = !eyeShow"
                >
                &#xe639
                </text>
              </template>
            </u-input>
          </u-form-item>
          <view class="u-p-t-48 u-p-b-32"
            ><u-button type="primary" text="登录" @click="beforeLogin" />
          </view>
          <view class="u-flex u-row-between">
            <u--text type="primary" @click="goRegister" text="注册账号" />
            <u--text
              type="info"
              align="right"
              @click="goForgetPassword"
              text="忘记密码"
            />
          </view>
        </u-form>
      </view>
      <view class="u-font-14 u-flex agreement-box u-row-center">
        <u-checkbox-group v-model="checked">
          <u-checkbox shape="circle" activeColor="#408CFF" />
        </u-checkbox-group>
        <view class="u-font-14 text-color">
          <text>请阅读并同意</text>
          <text class="color-text-primary" @click="agreementuser">《用户协议》</text>
          及
          <text class="color-text-primary" @click="privacy">《隐私政策》</text>
        </view>
      </view>

      <u-modal
        :show="goRegisterModalShow"
        content="您尚未完成注册，是否立即前往注册？"
        :showCancelButton="true"
        confirmText="立即前往"
        confirmColor="#408CFF"
        :closeOnClickOverlay="true"
        @cancel="goRegisterModalShow = false"
        @close="goRegisterModalShow = false"
        @confirm="goRegister(true)"
      ></u-modal>
      <u-modal
        :show="agreementModalShow"
        :showCancelButton="true"
        title="阅读并同意以下协议"
        confirmText="同意并登录"
        confirmColor="#408CFF"
        cancelText="不同意"
        :closeOnClickOverlay="true"
        @cancel="agreementModalShow = false"
        @close="agreementModalShow = false"
        @confirm="agreement()"
      >
        <view>
          为了保证您的个人信息安全，使用登录功能需要先阅读并同意
          <text class="u-primary" @click="agreementuser">《用户协议》</text>
          和
          <text class="u-primary" @click="privacy">《隐私政策》</text>
        </view>
      </u-modal>

      <base-toast ref="toastRef"></base-toast>

      <!-- 滑动验证码 -->
      <SlideCode
        :style="{ zIndex: 99991 }"
        v-if="showSlideCode"
        ref="sider"
        @slide_end="confirmReceive"
        @close="showSlideCode = false"
      ></SlideCode>
    </view>
  </view>
</template>

<script>
import MyNavbar from "@/components/my-navbar/index.vue";
import SlideCode from "@/components/slide-code/index.vue";
import { sleep } from "@/utils/tools.js";
import { kocLogin } from "@/api/login.js";
import { mapMutations, mapActions, mapGetters } from "vuex";

export default {
  components: {
    SlideCode,
    MyNavbar
  },
  data() {
    return {
      model: {
        email: "",
        password: "",
        captcha_code: "",
        operation_type: "",
      },
      rules: {
        email: [
          {
            required: true,
            message: "请输入账号",
            trigger: ["change", "blur"],
          },
          {
            validator: (rule, value, callback) => {
              return uni.$u.test.mobile(value);
            },
            message: "手机号码不正确",
            trigger: ["change", "blur"],
          },
        ],
        password: [
          {
            required: true,
            message: "请输入密码",
            trigger: ["change", "blur"],
          },
        ],
      },
      bind_code: "",
      eyeShow: true,

      showSlideCode: false,
      typeSlideCode: 1,

      loginType: "ACCOUNT_LOGIN",

      goRegisterModalShow: false,
      agreementModalShow: false,
      checked: [],

      routerMode: 'back',
      targetUrl: ''
    };
  },
  computed: {
    ...mapGetters(["theme_color", "has_login"]),
  },
  onLoad(options) {
    if(options?.from == 'INCOME' && !this.has_login) {
      this.routerMode = 'switch';
      this.targetUrl = '/pages/mine/mine';
    }
  },
  methods: {
    ...mapMutations([
      "SET_CURRENT_USER",
      "SET_AUTHORITY",
      "SET_AVATURL",
      "SET_SLIENT_INFO",
    ]),
    ...mapActions(["SetAvatar"]),

    /**
     * @description: 进行账号登录的方法
     * @return {*}
     */
    beforeLogin() {
      this.loginType = "ACCOUNT_LOGIN"; // 设置登录类型为账号登录
      this.$refs.formRef
        .validate()
        .then(() => {
          if (this.checked.length == 0) {
            // 检查用户是否同意协议
            return (this.agreementModalShow = true); // 显示协议弹窗
          }
          this.typeSlideCode = 1; // 设置滑动验证码类型
          this.showSlideCode = true; // 显示滑动验证码
        })
        .catch(error => {});
    },

    /**
     * @description: 封装登录的异步请求方法
     * @return {*}
     */
    async onSubmit() {
      this.toastMsg('登录中', 'loading', -1)
      const fg = await this.$store.dispatch("GetFingerPrint");
      await kocLogin({
        ...this.model,
        email: this.model.email+'',
        // #ifdef APP
        platform: 'applet',
        // #endif
        // #ifdef H5
        platform: 'h5',
        // #endif
        fingerprint: { fingerprint: fg, score: 1 },
      }) // 发送登录请求
        .then(async (res) => {
          this.showSlideCode = false; // 登录成功后隐藏滑动验证码
          if (res.code === 0) {
            this.$refs.toastRef.close();
            this.toastMsg("登录成功", 'success');
            // 设置当前用户信息及权限
            this.SET_SLIENT_INFO({ ...res.data, token: res.token });
            await sleep(300);
            uni.switchTab({
              url: `/pages/novel/novel`,
            });
          }
        })
        .catch((err) => {
          // 错误处理
          if (err.message?.indexOf("验证码错误") != -1) {
            // 判断是否是验证码错误
            this.$refs.sider && this.$refs.sider.retry(); // 重试获取验证码
            this.toastMsg(err.message || err, 'error');
          } else if (err?.data?.bind_code) {
            // 处理绑定用户的情况
            this.bind_code = err.data.bind_code;
            this.goRegisterModalShow = true; // 显示注册弹窗
          } else {
            let message = String(err.message || err || "未知错误！"); // 其他错误处理
            this.showSlideCode = false;
            this.toastMsg(message, "error");
          }
        })
    },

    /**
     * @description: 确认滑动拼图的结果并进行登录
     * @param {*} val 验证码值
     * @return {*}
     */
    confirmReceive(val) {
      if (!val) return this.toastMsg("请滑动拼图！", "error"); // 验证滑动拼图是否成功
      this.model.operation_type = "ACCOUNT_LOGIN";
      this.model.captcha_code = val;
      this.onSubmit(); // 调用登录方法
    },

    /**
     * @description: 跳转到注册页面
     * @param {*} flag - 可选参数，指示是否绑定代码
     * @return {*}
     */
    goRegister(flag = false) {
      this.goRegisterModalShow = false; // 关闭注册模态框
      let url = "/pages/login/register"; // 注册页面的URL
      url += flag ? `?bind_code=${this.bind_code}` : ""; // 如果flag为true，则添加绑定代码到URL
      uni.redirectTo({
        url, // 执行页面跳转
      });
    },

    /**
     * @description: 跳转到忘记密码页面
     * @return {*}
     */
    goForgetPassword() {
      uni.redirectTo({
        url: "/pages/login/forget", // 忘记密码页面的URL
      });
    },

    /**
     * @description: 跳转到用户协议页面
     * @return {*}
     */
    agreementuser() {
      uni.navigateTo({
        url: "/pagesUser/service/agreement/user", // 用户协议页面的URL
      });
    },

    /**
     * @description: 跳转到隐私政策页面
     * @return {*}
     */
    privacy() {
      uni.navigateTo({
        url: "/pagesUser/service/agreement/privacy", // 隐私政策页面的URL
      });
    },

    /**
     * @description: 用户同意协议处理函数
     * 在调用该函数时，会将 checked 状态重置并关闭协议模态框，然后执行账户登录。
     * @return {*}
     */
    agreement() {
      // 重置 checked 状态为默认值
      this.checked = [""];
      // 关闭协议模态框
      this.agreementModalShow = false;
      // 调用账户登录函数
      this.beforeLogin();
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
.login-page {
  min-height: 100vh;
  padding-top: 200rpx;
  overflow: scroll;
  background: linear-gradient(to bottom, #d3edff, #ffffff 20%);
}

.top-message {
  margin-top: 112rpx;
  margin-bottom: 70rpx;
}

.agreement-box {
  position: absolute;
  bottom: 0;
  width: 100%;
  left: 0;
  right: 0;
  height: 120rpx;
}

::v-deep .u-button {
  height: 92rpx !important;
}
::v-deep .u-form-item .u-line {
  display: none;
}
::v-deep .u-input {
  border-radius: 16rpx;
  height: 88rpx;
  background-color: #f6f6f6;
  border: none;
  padding: 24rpx 32rpx !important;
}
::v-deep .u-button {
  height: 88rpx;
  border-radius: 16rpx;
}
::v-deep .app-grid {
  backdrop-filter: blur(20px);
}
</style>
