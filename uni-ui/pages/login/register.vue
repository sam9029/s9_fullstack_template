<template>
  <view class="register-page">
    <MyNavbar
      bgColor="transparent"
      :routerMode="routerMode"
      :targetUrl="targetUrl"
      :backShow="backShow"
    >
      <template #navbarData>
        <view class="u-flex-row u-row-center u-col-center">
          <text class="u-text-center u-font-32 color-text-black">注册账号</text>
        </view>
      </template>
    </MyNavbar>
    <view class="u-p-t-20 u-p-b-20 u-p-l-80 u-p-r-80">
      <view class="top-area u-flex-row u-row-between u-col-bottom">
        <text class="title color-text-black u-font-48">填写信息</text>
        <view v-if="backShow" class="color-text-less-grey u-font-24">
          已有帐号？<text class="color-text-primary" @click="goLogin"
            >去登陆</text
          >
        </view>
      </view>
      <view class="form-container">
        <u-form :model="userForm" ref="formRef" :rules="rules" labelWidth="100">
          <u-form-item v-if="show_share_code" prop="share_code" borderBottom>
            <u-input
              v-model.trim="userForm.share_code"
              placeholder="请输入邀请码"
              clearable
              placeholderStyle="color: #989898;font-size: 24rpx;"
            >
            </u-input>
          </u-form-item>
          <u-form-item prop="telephone" borderBottom>
            <u-input
              placeholder="请输入需绑定的手机号"
              clearable
              type="number"
              v-model="userForm.telephone"
              placeholderStyle="color: #989898;font-size: 24rpx;"
            >
            </u-input>
          </u-form-item>

          <u-form-item prop="code" borderBottom>
            <u-input
              placeholder="请输入短信验证码"
              clearable
              type="number"
              v-model="userForm.code"
              placeholderStyle="color: #989898;font-size: 24rpx;"
            >
              <template slot="suffix">
                <u-code
                  ref="uCode"
                  @change="codeChange"
                  :seconds="userForm.seconds"
                  changeText="X秒后重新获取"
                ></u-code>
                <u--text
                  @click="getCode"
                  class="u-pointer u-font-14"
                  type="primary"
                  :text="userForm.tips"
                ></u--text>
              </template>
            </u-input>
          </u-form-item>

          <u-form-item prop="password" borderBottom>
            <u-input
              placeholder="请输入您的密码"
              clearable
              v-model.trim="userForm.password"
              :password="userForm.hidePassword"
              placeholderStyle="color: #989898;font-size: 24rpx;"
            >
              <template slot="suffix">
                <i
                  class="uniicons u-font-36"
                  :style="{ color: '#929292' }"
                  @click="changePasswordHide('password')"
                  >{{
                    userForm.passwordIcon == "eye" ? "&#xe63a;" : "&#xe639;"
                  }}</i
                >
              </template>
            </u-input>
          </u-form-item>
          <u-form-item prop="checkPassword" borderBottom>
            <u-input
              placeholder="请再次输入密码"
              clearable
              v-model.trim="userForm.checkPassword"
              :password="userForm.hideCheckPassword"
              placeholderStyle="color: #989898;font-size: 24rpx;"
            >
              <template slot="suffix">
                <i
                  class="uniicons u-font-36"
                  :style="{ color: '#929292' }"
                  @click="changePasswordHide('checkPassword')"
                  >{{
                    userForm.checkPasswordIcon == "eye"
                      ? "&#xe63a;"
                      : "&#xe639;"
                  }}</i
                >
              </template>
            </u-input>
          </u-form-item>
        </u-form>
      </view>
      <view class="u-p-28 u-font-12 u-text-tips"
        >请输入8-20位数字、字母或符号组合</view
      >
      <u-button
        class="register-btn"
        type="primary"
        text="注册"
        @click="beforeRegister"
      ></u-button>
    </view>

    <!-- 滑动验证码 -->
    <SlideCode
      v-if="showSlideCode"
      ref="sider"
      @slide_end="confirmReceive"
      @close="showSlideCode = false"
    ></SlideCode>
    <base-toast ref="toastRef"></base-toast>
  </view>  
</template>

<script>
import SlideCode from "@/components/slide-code/index.vue";
import MyNavbar from "@/components/my-navbar/index.vue";
import { sendSms, checkSms, getCodeImg, kocRegister } from "@/api/login.js";
import { mapMutations, mapActions, mapGetters } from "vuex";
import { wxLogin, sleep } from "@/utils/tools";
import {
  queryUrlParams,
  saveSmsIdToLoacl,
  getSmsIdFromLocal,
  delSmsIdFromLocal,
} from "@/utils/tools.js";
export default {
  components: {
    SlideCode,
    MyNavbar,
  },
  data() {
    return {
      userForm: {
        share_code: null,
        telephone: null,
        code: null,
        password: null,
        checkPassword: null,
        name: null,
        hidePassword: true,
        hideCheckPassword: true,
        passwordIcon: "eye",
        checkPasswordIcon: "eye",
        passwordConfirmIcon: "eye",
        tips: "获取验证码",
        seconds: 120,
        imageCodeUrl: "",
        imageCode: null,
        bind_code: null,
        oneKeyWechatCode: null,
      },
      sms_id: null,
      disabledObj: {
        telephone: false,
        code: false,
        password: false,
        checkPassword: false,
        share_code: false,
      },
      rules: {
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
        checkPassword: [
          {
            required: true,
            message: "请再次输入密码",
            trigger: ["change", "blur"],
          },
          {
            validator: this.checkPassword,
            message: "两次输入的密码不一致",
          },
        ],
        share_code: {
          required: true,
          message: "请输入邀请码",
          trigger: ["blur", "change"],
        },
      },
      showSlideCode: false,
      captcha_code: null,
      sms_type: 2,
      type: "DEFAULT",
      show_share_code: true,
      backShow: true,
      routerMode: "redirect",
      targetUrl: "/pages/login/login",
      code_start_time: null
    };
  },
  computed: {
    ...mapGetters(["theme_color"]),
  },
  onReady() {
    this.$refs.formRef.setRules(this.rules);
  },
  onLoad(options) {
    // 设置默认值
    this.type = "DEFAULT";
    // 邀请码input是否显示：query上携带则不显示，否则显示
    this.show_share_code = options?.show_share_code ? false : true;
    this.userForm.share_code = options?.share_code || "";

    if(options.type == 'FROM_INVITE') {
      this.backShow = false;
    }

    // 根据bind_code设置参数
    if (options.bind_code) {
      this.userForm.bind_code = options.bind_code;
      this.sms_type = 6;
      this.type = "ONE_KEY";
    } else {
      this.handleScanDisabled(options);
    }

    // 处理查询参数
    const data = options?.q
      ? queryUrlParams(decodeURIComponent(options.q))
      : {};
    if (data?.share_code) {
      this.userForm.share_code = data.share_code;
    }

    // 根据share_code禁用相关对象
    this.disabledObj.share_code = !!this.userForm.share_code;
  },

  methods: {
    ...mapMutations(["SET_CURRENT_USER", "SET_AUTHORITY", "SET_SLIENT_INFO"]),
    ...mapActions(["SetAvatar"]),

    /**
     * @description: 验证密码确认是否一致
     * @param {*} rule - 校验规则
     * @param {*} value - 校验的值
     * @param {*} callback - 回调函数，用于告知验证结果
     * @return {*}
     */
    checkPassword(rule, value, callback) {
      // 判断密码与确认密码是否一致
      if (this.userForm.password != this.userForm.checkPassword) {
        // 如果不一致，调用回调并传入false
        callback(false);
      } else {
        // 如果一致，调用回调
        callback();
      }
    },

    /**
     * @description: 处理扫描结果并禁用相关字段
     * @param {*} data - 传入的数据对象
     * @return {*}
     */
    handleScanDisabled(data) {
      // 检查data是否为对象且非空
      if (typeof data !== "object" || Object.keys(data).length === 0) return;
      // 遍历data对象
      for (let el in data) {
        // 将扫描结果赋值给表单
        this.userForm[el] = data[el];
        // 设置相应字段为禁用状态
        this.disabledObj[el] = true;
      }
    },

    /**
     * @description: 注册前的处理函数
     * @return {*}
     */
    async beforeRegister() {
      // 调用表单的验证函数
      this.$refs.formRef
        .validate()
        .then(async () => {
          // 构建注册参数
          const fg = await this.$store.dispatch("GetFingerPrint");
          let params = {
            share_code: this.userForm.share_code,
            telephone: this.userForm.telephone+'',
            password: this.userForm.password,
            phone_code: this.userForm.code,
            sms_id: this.sms_id,
            name: this.userForm.name,
            fingerprint: { fingerprint: fg, score: 1 },
          };
          // 如果类型为默认
          if (this.type == "DEFAULT") {
            // #ifdef MP
            // 调用微信登录获取微信代码
            await wxLogin()
              .then((res) => {
                params.wechat_code = res.code; // 将微信代码加入到参数中
              })
              .catch(
                (error) =>
                  console.error("wechat_code generation failed：", error) // 处理错误
              );
            // #endif
          } else {
            // 否则设置绑定代码
            params.bind_code = this.userForm.bind_code;
          }
          // 调用注册函数
          this.register(params);
        })
        .catch(); // 捕获验证错误但不处理
    },

    /**
     * @description: 用户注册方法
     * @param {*} params - 用户注册时传入的参数
     * @return {*}
     */
    async register(params) {
      // 显示加载提示框，提示用户正在注册中
      uni.showLoading({
        title: "注册中...",
      });

      // 选择相应的请求接口，默认情况下使用kocRegister
      let operation = this.type == "DEFAULT" ? kocRegister : checkSms;

      // 从本地存储中获取短信验证码的ID
      this.sms_id = getSmsIdFromLocal(
        `${this.sms_type}_${this.userForm.telephone}`
      );

      // 验证短信ID是否存在
      if (!this.sms_id) {
        // 如果不存在，提示用户先发送短信验证码
        this.toastMsg(`请先发送短信验证码`, "error");
        uni.hideLoading();
        return; // 结束注册流程
      }
      // 调用相应的注册接口
      operation(params)
        .then(async(res) => {
          if(res.code == 0) {
            // 注册成功的处理
            this.toastMsg("注册成功", "success");
            // 设置当前用户信息及权限
            this.SET_SLIENT_INFO({ ...res.data, token: res.token });
            await sleep(500);
            // 跳转到个人中心页面并隐藏标签栏
            uni.switchTab({
              url: `/pages/mine/mine`,
            });
          } else {
            this.toastMsg(res.message || res, "error");
          }
        })
        .catch((err) => {
          // 注册失败的处理
          this.toastMsg(err.message || err, "error");
          // 如果错误消息中包含“前往登录”，则进行重定向
          if (err.message?.indexOf("前往登录") == 1) {
            setTimeout(() => {
              this.onReset();
              uni.redirectTo({
                url: "/pages/login/login",
              });
            }, 1000);
          }
        })
        .finally(() => {
          // 清除本地存储中的短信ID，并隐藏加载提示框
          if(new Date().getTime() - this.code_start_time > 120000) {
            this.code_start_time = null;
            delSmsIdFromLocal()
          }
          uni.hideLoading();
        });
    },

    /**
     * @description: 处理输入框文本变化
     * @param {*} text - 输入的文本
     * @return {*}
     */
    codeChange(text) {
      this.userForm.tips = text; // 更新提示信息
    },

    /**
     * @description: 获取验证码的方法
     * @return {*}
     */
    getCode() {
      // 检查手机号是否已填写
      if (!this.userForm.telephone) {
        return this.toastMsg("请先填写手机号", "error");
      }

      // 检查是否可以获取验证码
      if (this.$refs.uCode.canGetCode) {
        this.showSlideCode = true; // 显示滑动验证码
      } else {
        // 如果不可获取，提示用户等待
        this.toastMsg("倒计时结束后再发送", "error");
      }
    },

    /**
     * @description: 确认接收验证码
     * @param {*} val - 验证码值
     * @return {*}
     */
    confirmReceive(val) {
      // 如果未提供验证码值，则显示错误信息
      if (!val) return this.notifyMsg("请滑动拼图！", "error");

      // 将验证码值存储到变量中
      this.captcha_code = val;

      // 检查是否可以获取验证码
      if (this.$refs.uCode && this.$refs.uCode.canGetCode) {
        uni.showLoading({
          title: "正在获取验证码", // 显示加载提示
        });

        // 发送短信验证码请求
        sendSms({
          captcha_code: this.captcha_code, // 提交的验证码
          sms_type: this.sms_type, // 短信类型
          phone: this.userForm.telephone+'', // 手机号码
          bind_code: this.userForm.bind_code, // 绑定码
        })
          .then((res) => {
            // 请求成功后的处理
            this.showSlideCode = false; // 隐藏滑动验证码
            this.toastMsg("验证码已发送", "success");

            // 存储验证码相关信息
            this.userForm.seconds = res.data.limit_second; // 倒计时的秒数
            this.sms_id = res.data.sms_id; // 存储短信ID
            this.$refs.uCode.start(); // 开始倒计时
            saveSmsIdToLoacl(
              // 将短信ID保存到本地
              res.data.sms_id,
              `${this.sms_type}_${this.userForm.telephone}` // 生成唯一标识
            );
            this.code_start_time = new Date().getTime(); // 记录开始时间
          })
          .catch((err) => {
            // 请求失败后的处理
            if (err.message?.indexOf("验证码错误") != -1) {
              this.$refs.sider && this.$refs.sider.retry(); // 重试
              this.toastMsg(err.message || err, "error");
            } else {
              this.showSlideCode = false; // 隐藏滑动验证码
              this.$refs.sider && this.$refs.sider.retry(); // 重试
              this.toastMsg(err.message || err, "error");
            }
          })
          .finally(() => {
            // 请求结束后的处理
            uni.hideLoading(); // 隐藏加载提示
          });
      } else {
        // 如果不能获取验证码，提示信息
        this.toastMsg("倒计时结束后再发送", "error");
      }

      this.imageCode = ""; // 清空图片验证码
    },

    /**
     * @description: 获取图片验证码
     * @return {*}
     */
    getImageCode() {
      // 请求验证码图片并设置到表单中
      getCodeImg().then((res) => {
        this.userForm.imageCodeUrl = res.data; // 设置验证码图片的URL
      });
    },

    /**
     * @description: 切换密码可见性
     * @param {*} type - 密码类型（"password"或"checkPassword"）
     * @return {*}
     */
    changePasswordHide(type = "password") {
      switch (type) {
        case "password":
          // 切换密码可见性
          this.userForm.hidePassword = !this.userForm.hidePassword;
          // 根据状态设置密码图标
          this.userForm.hidePassword === true
            ? (this.userForm.passwordIcon = "eye") // 显示眼睛图标
            : (this.userForm.passwordIcon = "eye-fill"); // 显示填充眼睛图标
          break;
        case "checkPassword":
          // 切换确认密码可见性
          this.userForm.hideCheckPassword = !this.userForm.hideCheckPassword;
          // 根据状态设置确认密码图标
          this.userForm.hideCheckPassword === true
            ? (this.userForm.checkPasswordIcon = "eye") // 显示眼睛图标
            : (this.userForm.checkPasswordIcon = "eye-fill"); // 显示填充眼睛图标
          break;
      }
    },

    /**
     * 重置用户表单及相关状态
     * @return {*}
     */
    onReset() {
      // 重置用户表单和禁用对象为初始状态
      if(this.userForm.seconds == 0) {
        this.sms_id = null
      }
      this.userForm = this.$options.data().userForm;
      this.disabledObj = this.$options.data().disabledObj;
      this.showSlideCode = false; // 隐藏滑动验证码
      this.captcha_code = null; // 将验证码设置为null
      this.sms_type = 2; // 重置短信类型
      this.type = "DEFAULT"; // 重置类型为默认
    },

    /**
     * 跳转到登录页面
     * @return {*}
     */
    goLogin() {
      // 导航到登录页面
      uni.redirectTo({
        url: "/pages/login/login",
      });
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

<style lang="scss" scoped>
.register-page {
  min-height: 100vh;
  background: linear-gradient(to bottom, #d3edff, #ffffff 20%);

  .top-area {
    margin-top: 112rpx;
  }
  .form-container {
    margin-top: 70rpx;
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
  }
}

::v-deep .u-button {
  height: 88rpx;
  border-radius: 16rpx;
}
::v-deep .app-grid {
  backdrop-filter: blur(20px);
}
</style>
