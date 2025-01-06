<template>
  <view class="edit-page">
    <MyNavbar bgColor="transparent" :routerMode="routerMode" :targetUrl="targetUrl">
      <template #navbarData>
        <view class="u-flex-row u-row-center u-col-center">
          <text class="u-text-center u-font-32 color-text-black">{{
            nav_title
          }}</text>
        </view>
      </template>
    </MyNavbar>
    <view
      v-show="step == 1"
      class="u-p-t-20 u-p-b-20 u-p-l-80 u-p-r-80 edit-step-1"
    >
      <view class="top-title u-m-b-40 u-flex-col u-row-center">
        <text class="u-font-48 color-text-black u-m-b-16">验证身份</text>
        <text class="u-font-24 color-text-less-grey">验证注册手机号</text>
      </view>
      <u-form :model="model" ref="form_1_ref" :rules="rules_1">
        <u-form-item prop="telephone" borderBottom>
          <u-input
            :placeholder="input_placeholder"
            clearable
            type="number"
            v-model="model.telephone"
            placeholderStyle="color: #989898;font-size: 24rpx;"
          >
          </u-input>
        </u-form-item>
        <u-form-item prop="code" borderBottom>
          <u-input
            placeholder="请输入短信验证码"
            clearable
            type="number"
            v-model="model.code"
            placeholderStyle="color: #989898;font-size: 24rpx;"
          >
            <template slot="suffix">
              <u-code
                ref="uCode"
                @change="codeChange"
                :seconds="model.seconds"
                changeText="X秒后重新获取"
              ></u-code>
              <u--text
                @click="getCode"
                class="u-pointer u-font-14"
                type="primary"
                :text="model.tips"
              ></u--text>
            </template>
          </u-input>
        </u-form-item>
        <view class="u-p-t-48 u-p-b-32"
          ><u-button
            type="primary"
            :text="type == 'logoff' ? '注销账号' : '下一步'"
            @click="jumpStep"
          />
        </view>
      </u-form>
    </view>
    <view
      v-show="step == 2"
      class="u-p-t-20 u-p-b-20 u-p-l-80 u-p-r-80 edit-step-2"
    >
      <view class="top-title u-m-b-40 u-flex-col u-row-center">
        <text class="u-font-48 color-text-black u-m-b-16">{{
          setp_2_title
        }}</text>
        <text class="u-font-24 color-text-less-grey">请设置新密码</text>
      </view>
      <u-form :model="model" ref="form_2_ref" :rules="rules_2">
        <u-form-item prop="password" borderBottom>
          <u-input
            :placeholder="type == 'reset' ? '请输入原密码' : '请输入密码'"
            v-model.trim="model.password"
            :password="eyeShow"
          >
            <template slot="suffix">
              <i
                class="uniicons u-font-36"
                :style="{ color: '#929292' }"
                @click="eyeShow = !eyeShow"
              >
                {{ eyeShow ? "&#xe63a;" : "&#xe639;" }}
              </i>
            </template>
          </u-input>
        </u-form-item>
        <u-form-item prop="check_psd" borderBottom>
          <u-input
            placeholder="请输入新密码"
            v-model.trim="model.check_psd"
            :password="eyeShow"
          >
            <template slot="suffix">
              <i
                class="uniicons u-font-36"
                :style="{ color: '#929292' }"
                @click="eyeShow = !eyeShow"
              >
                {{ eyeShow ? "&#xe63a;" : "&#xe639;" }}
              </i>
            </template>
          </u-input>
        </u-form-item>
        <view class="u-p-t-48 u-p-b-32"
          ><u-button type="primary" text="完成" @click="onSubmit" />
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

    <u-modal
      :show="showLogoffModal"
      title="注销提示"
      showCancelButton
      cancelText="确认注销"
      confirmText="我再想想"
      @confirm="showLogoffModal = false"
      @cancel="logOffFunc"
    >
      <text style="color: #3c3c3c"
        >请再次确认是否注销账号！
        账号注销后，将删除账号的全部数据，且无法找回，请谨慎操作</text
      >
    </u-modal>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import MyNavbar from "@/components/my-navbar/index.vue";
import SlideCode from "@/components/slide-code/index.vue";
import { mapMutations, mapActions, mapGetters } from "vuex";
import { sendSms, checkSms, kocLogoff, postChangePad } from "@/api/login.js";
import {
  saveSmsIdToLoacl,
  delSmsIdFromLocal,
  sleep,
  throttle,
} from "@/utils/tools.js";

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
        password: "",
        check_psd: "",
        code: "",
        tips: "获取验证码",
        seconds: 120,
        sms_id: null,
      },
      rules_1: {
        telephone: [
          {
            required: true,
            message: "请输入手机号",
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
        code: [
          {
            required: true,
            message: "请输入短信验证码",
            trigger: ["change", "blur"],
          },
        ],
      },
      rules_2: {
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
        check_psd: [
          {
            required: true,
            message: "请再次输入密码",
            trigger: ["change", "blur"],
          },
          {
            validator: (rule, value, callback) => {
              if (this.type !== "reset" && this.model.password != value) {
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
      },
      step: 1,
      showSlideCode: false,
      captcha_code: null,

      eyeShow: true,
      eyeNewShow: true,
      routerMode: "redirect",
      targetUrl: "/pages/login/login",

      type: "forget", // forget 忘记密码 reset 重置密码 logoff注销
      showLogoffModal: false,
      code_start_time: null
    };
  },
  computed: {
    ...mapGetters(["theme_color"]),
    nav_title() {
      switch (this.type) {
        case "forget":
          return "忘记密码";
        case "reset":
          return "修改密码";
        case "logoff":
          return "注销账号";
      }
    },
    input_placeholder() {
      switch (this.type) {
        case "forget":
        case "reset":
          return "请输入需修改的手机号";
        case "logoff":
          return "请输入需注销的手机号";
      }
    },
    sms_type() {
      switch (this.type) {
        case "forget":
        case "reset":
          return 3;
        case "logoff":
          return 7;
      }
    },
    setp_2_title() {
      if (this.type == "reset") {
        return "修改密码";
      }
      return "验证成功";
    },
  },
  methods: {
    ...mapMutations(["SET_CURRENT_USER", "SET_AUTHORITY"]),
    ...mapActions(["SetAvatar"]),

    jumpStep() {
      this.$refs.form_1_ref.validate().then(() => {
        if (this.type != "logoff") {
          this.step = 2;
        } else {
          this.showLogoffModal = true;
        }
      });
    },

    logOffFunc() {
      const params = {
        sms_id: this.model.sms_id,
        captcha_code: this.model.code,
      };
      kocLogoff(params)
        .then(async (res) => {
          this.toastMsg("注销成功！", "success");
          await sleep(1000);
          uni.redirectTo({
            url: "/pages/login/login",
          });
        })
        .catch((err) => {
          this.toastMsg(err.message || err, "error");
          if (err.message == "验证码错误或已失效！") {
            this.model.code = "";
            this.step = 1;
          }
        })
        .finally(() => {
          delSmsIdFromLocal();
        });
    },

    onSubmit: throttle(function func() {
      this.$refs.form_2_ref
        .validate()
        .then(() => {
          if (this.type == "reset") {
            this.showSlideCode = true;
            return;
          }
          let params = {
            sms_type: this.sms_type,
            sms_id: this.model.sms_id,
            code: this.model.code,
            password: this.model.password,
          };
          checkSms(params)
            .then(async (res) => {
              this.toastMsg("修改成功，请重新登录！", "success");
              await sleep(1000);
              uni.redirectTo({
                url: "/pages/login/login",
              });
            })
            .catch((err) => {
              this.toastMsg(err.message || err, "error");
              if (err.message == "验证码错误或已失效！") {
                this.model.code = "";
                this.step = 1;
              }
            })
            .finally(() => {
              delSmsIdFromLocal();
            });
        })
        .catch((err) => {});
    }, 500),

    codeChange(text) {
      this.model.tips = text;
    },

    getCode() {
      if (!this.model.telephone) {
        return this.toastMsg("请先填写手机号", "error");
      }
      if (this.$refs.uCode.canGetCode) {
        this.showSlideCode = true;
      } else {
        this.toastMsg("倒计时结束后再发送", "error");
      }
    },

    /**
     * @description: 获取验证码
     * @param {string} val - 拼图的值
     * @return {void}
     */
    getSms(val) {
      // 验证拼图是否完成
      if (!val) return this.toastMsg("请滑动拼图！", "error");

      this.captcha_code = val;

      if (this.type == "reset") {
        return this.setNewPad();
      }

      // 检查是否可以获取验证码
      if (this.$refs.uCode && this.$refs.uCode.canGetCode) {
        uni.showLoading({
          title: "正在获取验证码",
        });

        // 发送短信验证码的请求
        sendSms({
          captcha_code: this.captcha_code,
          sms_type: this.sms_type,
          phone: this.model.telephone+'',
        })
          .then((res) => {
            // 隐藏滑动拼图
            this.showSlideCode = false;
            this.code_start_time = new Date().getTime();

            // 显示成功通知
            this.showSuccessNotification(res.data.sms_id);

            // 更新状态
            this.model.seconds = res.data.limit_second;
            this.model.sms_id = res.data.sms_id;
            this.$refs.uCode.start();

            // 保存短信ID到本地
            saveSmsIdToLoacl(
              res.data.sms_id,
              `${this.sms_type}_${this.model.telephone}`
            );
          })
          .catch((err) => {
            // 处理错误信息
            this.handleError(err);
          })
          .finally(() => {
            uni.hideLoading();
          });
      } else {
        // 如果在冷却时间内，提示用户
        this.toastMsg("倒计时结束后再发送", "error");
      }
    },

    setNewPad() {
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
    },

    /**
     * @description: 显示成功通知
     * @param {string} sms_id - 短信ID
     * @return {void}
     */
    showSuccessNotification(sms_id) {
      this.toastMsg(`验证码已发送至${this.model.telephone}`, "success");
    },

    /**
     * @description: 处理错误信息
     * @param {Error} err - 错误对象
     * @return {void}
     */
    handleError(err) {
      const message = err.message || err;

      // 如果是验证码错误，重试
      if (message.includes("验证码错误")) {
        this.$refs.sider && this.$refs.sider.retry();
      } else {
        this.showSlideCode = false;
        this.$refs.sider && this.$refs.sider.retry();
      }

      // 显示错误通知
      this.toastMsg(message, "error");
    },

    // 提示
    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
  onLoad({ type }) {
    this.type = type || "forget";
    switch (type) {
      case "reset":
        this.routerMode = "redirect";
        this.targetUrl = "/pagesUser/setting/index";
        this.step = 2;
        break;
      case "logoff":
        this.routerMode = "redirect";
        this.targetUrl = "/pagesUser/setting/index";
        break;
    }
  },
};
</script>

<style lang="scss" scoped>
.edit-page {
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
  backdrop-filter: blur(20px);
}
</style>
