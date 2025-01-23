<template>
  <view class="reset-password-page">
    <MyNavbar
      bgColor="transparent"
    >
      <template #navbarData>
        <view class="u-flex-row u-row-center u-col-center">
          <text class="u-text-center u-font-32 color-text-black">修改密码</text>
        </view>
      </template>
    </MyNavbar>
    <view class="u-p-t-20 u-p-b-20 u-p-l-80 u-p-r-80 edit-step-2">
      <view class="top-title u-m-b-40 u-flex-col u-row-center">
        <text class="u-font-48 color-text-black u-m-b-16">修改密码</text>
        <view class="u-font-24 u-line-h-40">
          <text class="color-text-less-grey">需填写旧密码验证后进行修改，</text>
          <text class="color-text-primary" @click="goForget">忘记旧密码?</text>
        </view>
      </view>
      <u-form :model="model" ref="formRef" :rules="rules">
        <u-form-item prop="old_password" borderBottom>
          <u-input
            placeholder="请输入原密码"
            v-model.trim="model.old_password"
            :password="eyeShow_1"
          >
            <template slot="suffix">
              <i
                class="uniicons u-font-36"
                :style="{ color: '#929292' }"
                @click="eyeShow_1 = !eyeShow_1"
              >
                {{ eyeShow_1 ? "&#xe63a;" : "&#xe639;" }}
              </i>
            </template>
          </u-input>
        </u-form-item>
        <u-form-item prop="password" borderBottom>
          <u-input
            placeholder="请输入新密码"
            v-model.trim="model.password"
            :password="eyeShow_2"
          >
            <template slot="suffix">
              <i
                class="uniicons u-font-36"
                :style="{ color: '#929292' }"
                @click="eyeShow_2 = !eyeShow_2"
              >
                {{ eyeShow_2 ? "&#xe63a;" : "&#xe639;" }}
              </i>
            </template>
          </u-input>
        </u-form-item>
        <u-form-item prop="double_check" borderBottom>
          <u-input
            placeholder="请再次输入您的新密码"
            v-model.trim="model.double_check"
            :password="eyeShow_3"
          >
            <template slot="suffix">
              <i
                class="uniicons u-font-36"
                :style="{ color: '#929292' }"
                @click="eyeShow_3 = !eyeShow_3"
              >
                {{ eyeShow_3 ? "&#xe63a;" : "&#xe639;" }}
              </i>
            </template>
          </u-input>
        </u-form-item>
        <view class="u-p-t-48 u-p-b-32"
          ><u-button type="primary" text="完成" @click="setNewPad" />
        </view>
      </u-form>
    </view>

    <!-- 滑动验证码 -->
    <SlideCode
      v-if="showSlideCode"
      ref="sider"
      @slide_end="getSms"
      @close="showSlideCode = false"
    ></SlideCode>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import MyNavbar from "@/components/my-navbar/index.vue";
import SlideCode from "@/components/slide-code/index.vue";
import { mapMutations, mapActions, mapGetters } from "vuex";
import { postChangePad } from "@/api/login.js";
import { sleep, throttle } from "@/utils/tools.js";

export default {
  options: {
    styleIsolation: "shared",
  },
  components: {
    SlideCode,
    MyNavbar,
  },
  data() {
    return {
      model: {
        telephone: "",
        old_password: "",
        password: "",
        double_check: "",
        code: "",
        tips: "获取验证码",
        seconds: 120,
        sms_id: null,
      },
      showSlideCode: false,
      captcha_code: null,

      eyeShow_1: true,
      eyeShow_2: true,
      eyeShow_3: true,
      eyeNewShow: true,
    };
  },
  computed: {
    ...mapGetters(["theme_color"]),
    rules() {
      return {
        old_password: [
          {
            required: true,
            message: "请输入密码",
            trigger: ["change", "blur"],
          },
          {
            pattern:
              /^(?:(?=.*[a-zA-Z])(?=.*\d)|(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9])|(?=.*\d)(?=.*[^a-zA-Z0-9])).{8,20}$/,
            message: "请输入8-20位数字、字母或符号组合密码",
          },
        ],
        password: [
          {
            required: true,
            message: "请输入密码",
            trigger: ["change", "blur"],
          },
          {
            pattern:
              /^(?:(?=.*[a-zA-Z])(?=.*\d)|(?=.*[a-zA-Z])(?=.*[^a-zA-Z0-9])|(?=.*\d)(?=.*[^a-zA-Z0-9])).{8,20}$/,
            message: "请输入8-20位数字、字母或符号组合密码",
          },
        ],
        double_check: [
          {
            required: true,
            message: "请再次输入密码",
            trigger: ["change", "blur"],
          },
          {
            validator: (rule, value, callback) => {
              console.log({password: this.model.password, value})
              if (value != this.model.password) {
                // 如果不一致，调用回调并传入false
                callback(false);
              } else {
                // 如果一致，调用回调
                callback();
              }
            },
            message: "两次输入的密码不一致",
            trigger: ["change", "blur"],
          },
        ],
      };
    },
  },
  methods: {
    ...mapMutations(["SET_CURRENT_USER", "SET_AUTHORITY"]),
    ...mapActions(["SetAvatar"]),

    goForget() {
      uni.navigateTo({
        url: "/pages/login/forget",
      });
    },

    setNewPad: throttle(function func() {
      this.$refs.formRef
        .validate()
        .then(() => {
          const params = {
            old_password: this.model.password,
            password: this.model.check_psd,
            captcha_code: this.captcha_code,
          };
          postChangePad(params)
            .then(async (res) => {
              if (res.code == 0) {
                this.showSlideCode = false;
                this.toastMsg("修改成功，请重新登录！", "success");
                await sleep(1000);
                uni.redirectTo({
                  url: "/pages/login/login",
                });
              }
            })
            .catch((err) => {
              this.toastMsg(err.message || err, "error");
              this.showSlideCode = false;
              this.captcha_code = null;
            });
        })
        .catch((error) => {});
    }, 500),

    // 提示
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
.reset-password-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #d3edff, #ffffff 20%);
  .edit-step-1,
  .edit-step-2 {
    margin-top: 112rpx;
  }
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
  backdrop-filter: blur(10px);
}
</style>
