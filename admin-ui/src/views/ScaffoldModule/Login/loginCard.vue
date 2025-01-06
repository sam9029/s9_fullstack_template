<template>
  <div class="login-card-view">
    <div class="login-image"></div>
    <el-tabs class="no-tab-header" v-model="innerVisible" type="card">
      <el-tab-pane label="用户登录" name="first">
        <div class="login-form-view">
          <div
            class="change-login-type"
            :title="showCode ? '账号登录' : '扫码登录'"
            @click="changeLoginType"
          >
            <svg-icon iconClass="font40" :iconName="showCode ? 'chaoguan' : 'qrcode'"></svg-icon>
            <!-- <div class="cover-view"></div> -->
          </div>
          <el-form
            v-show="!showCode"
            ref="loginForm"
            :model="loginForm"
            :rules="loginRules"
            class="demo-ruleForm"
          >
            <el-form-item>
              <div class="sacn-lable">{{ systemTitle || '登录' }}</div>
            </el-form-item>
            <el-form-item prop="username">
              <el-input
                v-model="loginForm.username"
                type="text"
                clearable
                placeholder="账号"
              ></el-input>
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="loginForm.password"
                type="password"
                placeholder="密码"
                @keyup.enter.native="handleLogin"
                show-password
              ></el-input>
            </el-form-item>
            <el-form-item v-if="need_code" prop="captcha_code">
              <div class="captcha_code_wrapper">
                <div :style="{ width: '100%', marginRight: '10px' }">
                  <el-input
                    class="captcha-input"
                    type="text"
                    clearable
                    v-model="loginForm.captcha_code"
                    placeholder="请输入验证码"
                  ></el-input>
                </div>
                <div>
                  <div
                    class="login-captcha"
                    v-html="codeUrl"
                    :src="codeUrl"
                    title="看不清楚，点击更换"
                    @click="getCode"
                  ></div>
                </div>
              </div>
            </el-form-item>
            <div v-else class="fit-height"></div>
            <div style="margin: 10px 0px 10px 0px">
              <el-checkbox v-model="loginForm.rememberMe">记住密码</el-checkbox>
            </div>
            <el-form-item style="width: 100%">
              <el-button
                style="width: 100%"
                :loading="loading"
                type="primary"
                @click.native.prevent="handleLogin"
              >
                <span v-if="!loading">登 录</span>
                <span v-else>登 录 中...</span>
              </el-button>
            </el-form-item>
          </el-form>
          <!-- <div class="divider-view"></div> -->
          <div v-show="showCode" class="qr-view">
            <div class="sacn-lable">{{ systemTitle }}APP扫码登录</div>
            <vue-qr
              :text="qrcodeUrl"
              :margin="0"
              :callback="qrCodeCallback"
              :size="200"
              logoSrc="https://koc-img.lizhibj.cn/manage/xiaoguofanxin.png"
              :logoScale="0.2"
              :correctLevel="3"
              qid="loginQr"
              class="vue-qr-img"
            ></vue-qr>
            <CountDown v-show="qrloading && !qr_expired" ref="cotdw" @change="qrExpire"></CountDown>
            <div v-if="qr_expired" class="cover-qr-view">
              <span>二维码已失效</span>
              <el-button @click="timeInit" size="mini" round>点击刷新</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
      <el-tab-pane label="手机验证" name="second">
        <div class="login-form-view flex-cloum">
          <span style="margin-bottom: 20px; font-size: 14px"
            >您的手机号 {{ chechForm.phone }} 暂未认证，请认证后登录！</span
          >
          <el-form
            ref="checkForm"
            size="medium"
            style="width: 90%"
            :model="chechForm"
            :rules="loginRules"
            class="chech-form"
          >
            <el-form-item prop="captcha_code">
              <div class="captcha_code_wrapper">
                <div :style="{ width: '100%', marginRight: '10px' }">
                  <el-input
                    class="captcha-input"
                    type="text"
                    clearable
                    v-model="chechForm.captcha_code"
                    placeholder="请输入验证码"
                  ></el-input>
                </div>
                <div>
                  <div
                    class="login-captcha"
                    v-html="codeUrl"
                    :src="codeUrl"
                    title="看不清楚，点击更换"
                    @click="getCode"
                  ></div>
                </div>
              </div>
            </el-form-item>

            <el-form-item prop="code">
              <!-- <el-row :gutter="10">
              <el-col :span="18">-->
              <el-input
                v-model="chechForm.code"
                type="text"
                clearable
                placeholder="请填写手机验证码"
              >
                <el-button
                  :disabled="chechForm.loading"
                  slot="append"
                  @click.native.prevent="sendSmsByType"
                >
                  <span>{{ sendSmsTitle }}</span>
                </el-button>
              </el-input>
              <!-- </el-col>
                <el-col :span="6"> </el-col>
              </el-row>-->
            </el-form-item>
            <el-form-item style="width: 100%">
              <el-row :gutter="10">
                <el-col :span="12">
                  <el-button style="width: 100%" plain @click.native.prevent="cancelClick">
                    <span>取消认证</span>
                  </el-button>
                </el-col>
                <el-col :span="12">
                  <el-button
                    style="width: 100%"
                    :loading="chechForm.checkloading"
                    type="primary"
                    @click.native.prevent="handleCheck"
                  >
                    <span>认证账号</span>
                  </el-button>
                </el-col>
              </el-row>
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<script>
  import { getCodeImg, sendSms, checkSms } from '@/api/login';
  import Cookies from 'js-cookie';
  import { encrypt, decrypt } from '@/utils/jsencrypt';
  import { setUserData } from '@/utils/common/user';
  import { uuid as getUuid } from '@/utils/common/tools';
  let notify = null;

  export default {
    components: {
      // VueQr: () => import('vue-qr'),
      CountDown: () => import('@/components/CountDown'),
    },
    data() {
      return {
        systemTitle: process?.env?.VUE_APP_TITLE,
        codeUrl: '',
        need_code: true,
        cookiePassword: '',
        innerVisible: 'first',
        chechForm: {
          checkloading: false,
          timer: null,
          sms_id: null,
          code: '',
          limit_second: 0,
          phone: '',
          loading: false,
          account_id: null,
          captcha_code: '',
        },
        loginForm: {
          username: '',
          password: '',
          rememberMe: false,
          captcha_code: '',
        },
        loginRules: {
          username: [{ required: true, trigger: 'blur', message: '用户名不能为空' }],
          password: [{ required: true, trigger: 'blur', message: '密码不能为空' }],
          captcha_code: [{ required: true, trigger: 'blur', message: '验证码不能为空' }],
          code: [{ required: true, trigger: 'blur', message: '验证码不能为空' }],
        },
        loading: false,
        redirect: undefined,
        loginType: 'account',
        qrcodeUrl: '',
        qrTimer: null,
        qrCancel: null,
        qrloading: false,
        qr_expired: false,
        axios_lite: null,
        showCode: false,
      };
    },
    watch: {
      $route: {
        handler: function (route) {
          this.redirect = route.query && route.query.redirect;
        },
        immediate: true,
      },
    },
    created() {
      this.systemTitle = process.env.VUE_APP_TITLE;
      this.init();
    },
    computed: {
      sendSmsTitle() {
        if (this.chechForm.limit_second <= 0) return '发送验证码';
        return this.chechForm.limit_second + '秒';
      },
      firstRouter() {
        return this.$store.state?.permission?.firstRouter;
      },
    },
    methods: {
      init() {
        this.innerVisible = 'first';
        if (this.chechForm.timer) clearInterval(this.chechForm.timer);
        this.chechForm = {
          checkloading: false,
          timer: null,
          sms_id: null,
          code: '',
          limit_second: 0,
          phone: '',
          loading: false,
          account_id: null,
        };
        this.getCode();
        this.getCookie();
      },
      handleCheck() {
        this.$refs.checkForm.validate((valid) => {
          if (valid) {
            this.chechForm.checkloading = true;
            let { sms_id, code } = this.chechForm;
            checkSms({ sms_id, sms_type: 1, code })
              .then((res) => {
                this.chechForm.checkloading = false;
                if (res.code == 0) {
                  if (notify) notify.close();
                  notify = this.$notify.success({
                    title: '认证成功',
                    message: '认证成功，请重新登录！',
                  });
                  this.getCode();
                  this.innerVisible = 'first';
                } else return Promise.reject(res);
              })
              .catch((err) => {
                this.chechForm.checkloading = false;
                this.notifyError(err, '认证失败');
              });
          }
        });
      },
      cancelClick() {
        this.loginForm.captcha_code = '';
        this.chechForm.captcha_code = '';
        this.chechForm.code = '';
        this.getCode();
        this.innerVisible = 'first';
      },
      notifyError(err, title = '登录异常') {
        let message = String(err.message || err || '未知异常！');
        if (message.indexOf('110000') != -1) return;
        if (notify) notify.close();
        notify = this.$notify.error({
          title,
          message,
        });
      },
      sendSmsByType() {
        if (!this.chechForm.account_id) return his.notifyError('用户不存在，请联系技术人员');
        if (!this.chechForm.captcha_code) {
          this.notifyError('请先输入图形验证码!');
          return;
        }
        if (this.chechForm.loading) return;
        this.chechForm.loading = true;
        if (this.chechForm.timer) clearInterval(this.chechForm.timer);
        sendSms({
          sms_type: 1,
          account_id: this.chechForm.account_id,
          captcha_code: this.chechForm.captcha_code,
        })
          .then((res) => {
            if (res && res.code == 0) {
              this.chechForm.limit_second = res.data.limit_second;
              this.chechForm.sms_id = res.data.sms_id;
              this.chechForm.timer = setInterval(() => {
                this.chechForm.limit_second--;
                if (this.chechForm.limit_second <= 0) {
                  this.chechForm.loading = false;
                  clearInterval(this.chechForm.timer);
                }
              }, 1000);
            } else {
              return Promise.reject(res);
            }
          })
          .catch((err) => {
            this.notifyError(err);
            this.chechForm.loading = false;
          });
      },
      qrExpire() {
        this.qrloading = false;
        this.qr_expired = true;
      },
      changeLoginType() {
        this.showCode = !this.showCode;
        if (this.showCode) this.timeInit();
        else this.getCode();
      },
      timeInit() {
        if (this.qrloading) return;
        this.qrloading = true;
        this.qr_expired = false;
        let time = parseInt(new Date().getTime() / 1000);
        let uuid = getUuid();
        this.qrcodeUrl = `xiaoguofanxing://scan_auth?uuid=${uuid}&time=${time}`;
        this.ScanCodeLogin({ time, uuid });
        if (this.$refs.cotdw) this.$refs.cotdw.init();
      },
      ScanCodeLogin(data) {
        this.axios_lite = this.$store
          .dispatch('ScanCodeLogin', data)
          .then((res) => {
            this.qrExpire();
            if (res.code == 0) {
              setUserData(res.data);
              //跳转第一个有权限路由
              !!this.firstRouter && (this.redirect = this.firstRouter);
              this.$router.push({ path: this.redirect || '/' }).catch(() => {});
            } else {
              return Promise.reject(res);
            }
          })
          .catch((err) => {
            let message = this.checkPhone(err.message || err || '未知异常！');
            if (message.indexOf('110000') != -1) return;
            if (message) this.notifyError(message);
            if (this.need_code) this.getCode();
            this.qrExpire();
          });
      },
      getCode() {
        getCodeImg().then((res) => {
          this.codeUrl = res.data;
        });
      },
      getCookie() {
        const username = Cookies.get('username');
        const password = Cookies.get('password');
        const rememberMe = Cookies.get('rememberMe');
        this.loginForm.username = username ?? this.loginForm.username;
        this.loginForm.password =
          password === undefined ? this.loginForm.password : decrypt(password);
        this.loginForm.rememberMe = rememberMe === undefined ? false : Boolean(rememberMe);
      },
      handleLogin() {
        this.$refs.loginForm.validate((valid) => {
          if (valid) {
            this.loading = true;
            if (this.loginForm.rememberMe) {
              Cookies.set('username', this.loginForm.username, { expires: 30 });
              Cookies.set('password', encrypt(this.loginForm.password), {
                expires: 30,
              });
              Cookies.set('rememberMe', this.loginForm.rememberMe, {
                expires: 30,
              });
            } else {
              Cookies.remove('username');
              Cookies.remove('password');
              Cookies.remove('rememberMe');
            }

            this.$store
              .dispatch('Login', this.loginForm)
              .then((res) => {
                this.need_code = res.need_code || false;
                this.loading = false;
                if (res.code == 0) {
                  setUserData(res.data);
                  //跳转第一个有权限路由
                  !!this.firstRouter && (this.redirect = this.firstRouter);
                  this.$router.push({ path: this.redirect || '/' }).catch(() => {});
                } else {
                  return Promise.reject(res);
                }
              })
              .catch((err) => {
                let message = this.checkPhone(err.message || err || '未知异常！');
                if (message) this.notifyError(message);
                this.loading = false;
                if (this.need_code) this.getCode();
              });
          }
        });
      },
      checkPhone(messages) {
        if (!messages) return;
        if (messages.indexOf('该账户手机号码未认证！') != -1) {
          let [message, check_phone, account_id] = messages.split('#');
          this.innerVisible = 'second';
          this.chechForm.phone = check_phone;
          this.chechForm.account_id = account_id;
          return null;
        }
        return messages;
      },
      qrCodeCallback(dataUrl, id) {},
    },
  };
</script>

<style lang="scss" scoped>
  .login-image {
    background-image: url('https://koc-img.lizhibj.cn/manage/login-img_zip.jpg');
    width: 300px;
    height: 350px;
    background-size: 100% 100%;
  }
  .login-card-view {
    display: flex;
    min-width: 500px;
    position: absolute;
    border-radius: 7px;
    overflow: hidden;
    height: 350px;
    top: 50%;
    left: 50%;
    transform: translateY(-50%) translateX(-50%);
  }
  .no-tab-header {
    ::v-deep.el-tabs__header {
      display: none;
    }
  }
  .flex-cloum {
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding-right: 20px;
  }
  .login-container {
    display: flex;
  }
  .login-form-view {
    padding: 20px;
    background-color: #ffffff;
    display: flex;
    height: 350px;
    position: relative;
  }
  .font60 {
    font-size: 60px;
  }
  .font40 {
    font-size: 40px;
  }
  .change-login-type {
    position: absolute;
    right: -0;
    top: -0;
    background-color: #99999964;
    color: #555555;
    width: 60px;
    height: 60px;
    cursor: pointer;
    text-align: right;
    > i {
      vertical-align: top;
    }
    clip-path: polygon(0% 0%, 100% 0%, 100% 100%);
  }
  .sacn-lable {
    font-size: 16px;
    margin-bottom: 5px;
    font-weight: bold;
    color: #555555;
    text-align: center;
  }
  .vue-qr-img {
    width: 200px;
    height: 200px;
    margin-bottom: 0px;
  }
  .demo-ruleForm {
    flex: 1;
    margin-top: 5px;
    width: 325px;
    ::v-deep.el-input__inner {
      height: 42px;
      line-height: 42px;
    }
  }
  .qr-view {
    text-align: center;
    width: 325px;
    // margin-left: 5px;
    font-size: 12px;
    color: #777777;
    position: relative;
    padding-top: 40px;
    .cover-qr-view {
      top: 67px;
      left: 62px;
      position: absolute;
      width: 202px;
      height: 202px;
      background-color: rgba($color: #ffffff, $alpha: 0.9);
      display: flex;
      flex-direction: column;
      justify-content: center;
      ::v-deep.el-button {
        width: 80px;
        margin: 5px auto 0 auto;
      }
    }
  }
  .fit-height {
    width: 100%;
    height: 60px;
  }
  .login-captcha {
    width: 120px;
    height: 42px;
    border-radius: 5px;
    overflow: hidden;
    float: right;
    cursor: pointer;
  }
  ::v-deep .el-dialog__header {
    border-bottom: 1px solid #c2c2c2;
  }
  ::v-deep .el-dialog {
    border-radius: 10px;
    .el-dialog__body {
      padding: 30px 10px 30px 30px;
    }
  }

  .demo-ruleForm,
  .chech-form {
    .captcha_code_wrapper {
      display: flex;
      justify-content: space-between;
      .login-captcha {
        ::v-deep .el-button {
          margin-left: 10px;
          height: 42px;
          width: 120px;
        }
      }
      .send-sms {
        ::v-deep .el-button {
          margin-left: 10px;
          height: 42px;
          width: 120px;
        }
      }
    }
    ::v-deep .el-input {
      width: 100%;
      input {
        height: 42px;
      }
    }
    ::v-deep .el-button {
      height: 42px;
      text-align: center;
    }
  }
</style>
