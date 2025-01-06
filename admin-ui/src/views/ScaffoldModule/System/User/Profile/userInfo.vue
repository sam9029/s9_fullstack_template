<template>
  <div>
    <el-form ref="form" :model="formData" :rules="rules" label-width="80px" class="user-info-form">
      <el-form-item label="用户姓名" prop="name">
        <el-input v-model="formData.name" />
      </el-form-item>
      <el-form-item label="手机号码" prop="telephone">
        <!-- <el-input v-model="formData.telephone" maxlength="11" :disabled="true" /> -->
        <!-- <span>{{formData.telephone}}</span> -->
        <div class="captcha_code_wrapper">
          <div style="width: 100%">
            <el-input v-model="formData.telephone" maxlength="11" :disabled="true" />
          </div>
          <div class="login-captcha" @click="openTelephone">
            <el-button type="primary" size="small">修改手机号</el-button>
          </div>
        </div>
      </el-form-item>
      <!-- <el-form-item label="邮箱" prop="email">
        <el-input v-model="formData.email" maxlength="50" />
      </el-form-item> -->
      <!-- <el-form-item label="生日" prop="birth">
        <el-date-picker
          v-model="formData.birth"
          type="datetime"
          placeholder="请选择生日"
          value-format="yyyy-MM-dd"
          format="yyyy-MM-dd"
        >
        </el-date-picker>
      </el-form-item> -->
      <el-form-item label="性别">
        <el-radio-group v-model="formData.gender">
          <el-radio :label="1">男</el-radio>
          <el-radio :label="2">女</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" size="small" @click="submit">保存</el-button>
        <el-button type="danger" size="small" @click="close">关闭</el-button>
      </el-form-item>
    </el-form>

    <el-dialog title="修改手机号需要进行短信验证！" :visible.sync="smsShow">
      <el-form
        ref="phoneForm"
        size="medium"
        style="width: 100%"
        :model="phoneChangeForm"
        :rules="phoneCodeRules"
        class="phone-form"
      >
        <el-input
          style="margin: 0px 0px 20px 0px"
          v-model="phoneChangeForm.phone"
          type="text"
          clearable
          placeholder="请填写手机号码"
        >
        </el-input>
        <el-form-item prop="captcha_code">
          <div class="captcha_code_wrapper">
            <div style="width: 100%">
              <el-input
                class="captcha-input"
                type="text"
                clearable
                v-model="phoneChangeForm.captcha_code"
                placeholder="请输入验证码"
              ></el-input>
            </div>
            <div v-loading="tool_loading">
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
          <div class="captcha_code_wrapper">
            <div style="width: 100%">
              <el-input
                v-model="phoneChangeForm.phoneCode"
                type="text"
                clearable
                placeholder="请填写手机验证码"
              >
                <!-- <el-button :disabled="loading" slot="append" @click.native.prevent="phoneCodeSendSms">
                  <span>{{ sendSmsTitle }}</span>
                </el-button> -->
              </el-input>
            </div>
            <div class="send-sms">
              <el-button :disabled="loading" @click.native.prevent="phoneCodeSendSms">
                <span>{{ sendSmsTitle }}</span>
              </el-button>
            </div>
          </div>
        </el-form-item>
        <el-form-item style="width: 100%" class="dialog">
          <el-row :gutter="10">
            <el-col :span="12">
              <el-button style="width: 100%" @click.native.prevent="phoneCodeBack">
                <span>返回</span>
              </el-button>
            </el-col>
            <el-col :span="12">
              <el-button
                style="width: 100%"
                :loading="loading"
                type="primary"
                @click.native.prevent="phoneCodeCheck"
              >
                <span>确定</span>
              </el-button>
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
    </el-dialog>
  </div>
</template>

<script>
  import { getCodeImg, sendSms, checkSms } from '@/api/login';
  import { updateSelfUser } from '@/api/account/personnel/user.js';

  export default {
    props: {
      user: {
        type: Object,
      },
      phone: {
        type: String,
        default: '',
      },
    },
    data() {
      return {
        formData: {},
        rules: {
          name: [{ required: true, trigger: 'blur' }],
        },

        phone: '',

        loading: false,
        smsShow: false,
        phoneChangeForm: {
          checkloading: false,
          timer: null,
          sms_id: null,
          code: '',
          limit_second: 0,
          phone: '',
          phoneCode: '',
          loading: false,
          account_id: null,
          captcha_code: '',
        },
        phoneCodeRules: {
          phone: [{ required: true, trigger: 'blur', message: '手机号不能为空' }],
          // captcha_code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
          phoneCode: [{ required: true, trigger: 'blur', message: '短信验证码不能为空' }],
        },
        tool_loading: false,
        codeUrl: '',
      };
    },
    computed: {
      sendSmsTitle() {
        if (this.phoneChangeForm.limit_second <= 0) return '发送验证码';
        return this.phoneChangeForm.limit_second + '秒';
      },
    },
    methods: {
      submit() {
        this.$refs['form'].validate((valid) => {
          if (valid) {
            this.update();
          }
        });
      },
      update() {
        // let { id, email, gender, name } = this.formData;
        // updateUser({ id, email, gender, name })
        // let { id, gender, name, birth } = this.formData;
        // updateUser({ id, gender, name, birth })
        let { id, gender, name } = this.formData;
        updateSelfUser({ id, gender, name })
          .then((response) => {
            if (response.code == 0) {
              this.$notify.success({
                title: '修改成功',
                message: '修改个人信息成功',
              });
            } else {
              this.$notify.error({
                title: '修改失败',
                message: res.message,
              });
            }
            this.$emit('change');
          })
          .catch((e) => {
            this.$notify.error({
              title: '修改失败',
              message: e.message || e,
            });
          });
      },
      close() {
        this.$store.dispatch('tagsView/delView', this.$route);
        this.$router.push({ path: '/' });
      },
      openTelephone() {
        this.phoneChangeForm.phone = '';
        this.phoneChangeForm.captcha_code = '';
        this.phoneChangeForm.phoneCode = '';
        this.phoneChangeForm.limit_second = 0;
        this.getCode();
        this.smsShow = true;
      },
      notifyError(err, title = '登录异常') {
        let message = String(err.message || err || '未知异常！');
        if (message.indexOf('110000') != -1) return;
        this.$notify.error({
          title,
          message,
        });
      },

      // 获取 图形 验证码
      getCode() {
        this.tool_loading = true;
        getCodeImg()
          .then((res) => {
            this.codeUrl = res.data;
          })
          .finally(() => {
            this.tool_loading = false;
          });
      },
      // 获取 短信 验证码
      phoneCodeSendSms() {
        if (this.phoneChangeForm.limit_second > 0) {
          // this.notifyError('请倒计时结束后重新发送!');
          return;
        }
        if (!this.phoneChangeForm.phone) {
          this.notifyError('请先输入手机号!');
          return;
        } else if (!/^1(3|4|5|6|7|8)\d{9}$/.test(this.phoneChangeForm.phone)) {
          this.notifyError('请输入正确手机号!');
          return;
        }

        if (!this.phoneChangeForm.captcha_code) {
          this.notifyError('请先输入图形验证码!');
          return;
        }

        sendSms({
          sms_type: 4,
          phone: this.phoneChangeForm.phone,
          captcha_code: this.phoneChangeForm.captcha_code,
        })
          .then((res) => {
            this.phoneChangeForm.limit_second = res.data.limit_second;
            this.phoneChangeForm.sms_id = res.data.sms_id;
            this.$notify.success({
              title: '手机验证码获取成功',
              message: `验证码已发送至${this.phoneChangeForm.phone}，请注意查收。`,
            });
            this.phoneChangeForm.timer = setInterval(() => {
              this.phoneChangeForm.limit_second--;
              if (this.phoneChangeForm.limit_second <= 0) {
                this.phoneChangeForm.loading = false;
                clearInterval(this.phoneChangeForm.timer);
              }
            }, 1000);
          })
          .catch((err) => {
            let message = err.message || err || '未知异常！';
            if (message) this.notifyError(message);
            this.getCode();
            this.loading = false;
          });
      },

      phoneCodeBack() {
        this.smsShow = false;
      },
      phoneCodeCheck() {
        if (
          this.phoneChangeForm.phone &&
          this.phoneChangeForm.phoneCode &&
          this.phoneChangeForm.sms_id
        ) {
          this.smsShow = false;
          this.loading = true;
          let params = {
            sms_id: this.phoneChangeForm.sms_id,
            sms_type: 4,
            code: this.phoneChangeForm.phoneCode,
          };

          checkSms(params)
            .then((res) => {
              this.phoneChangeForm.checkloading = false;
              if (res.code == 0) {
                this.$notify.success({
                  title: '修改成功',
                  message: '手机号修改成功！',
                });
                // this.dialogVisible = false;
                this.smsShow = false;
                // this.update();
                this.$emit('change');
              } else return Promise.reject(res);
            })
            .catch((err) => {
              this.phoneChangeForm.checkloading = false;
              this.notifyError(err, '操作失败');
            });
        } else if (!this.phoneChangeForm.sms_id) {
          this.notifyError('请重新获取短信验证码!');
          return;
        } else {
          this.notifyError('请检查列表是否填写完整!');
          return;
        }
      },
    },
    watch: {
      user: {
        handler(val) {
          this.formData = {
            id: val.accountId,
            // email: val.email,
            telephone: val.phone,
            // birth: val.birth,
            gender: val.gender,
            name: val.userName,
          };
          this.phone = val.phone;
        },
        immediate: true,
      },
    },
  };
</script>

<style lang="scss" scoped>
  .codeNum {
    height: 2rem;
    /* width: 73%; */
    margin: 32px auto;
    position: relative;
    text-align: left;
    display: flex;
    justify-content: center;
    align-items: center;
    font-size: 1.5rem;
    > span {
      border-bottom: 1px solid #ff566b;
      display: inline-block;
      width: 2rem;
      height: 2rem;
      margin-left: 1rem;
      text-align: center;
      vertical-align: middle;
      &:first-child {
        margin-left: 0;
      }
    }
    > input {
      position: absolute;
      width: 100%;
      letter-spacing: 1.3rem;
      padding-left: 0.3rem;
      color: #fff;
      opacity: 0;
      left: 0;
      height: 100%;
    }
  }
  .mb16 {
    margin-bottom: 16px;
  }

  .phone-form {
    .login-captcha {
      margin-left: 10px;
      height: 42px;
      border-radius: 5px;
      overflow: hidden;
      float: right;
      cursor: pointer;
    }
  }

  .user-info-form,
  .phone-form {
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
      .send-sms{
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
    // ::v-deep .el-button {
    //   height: 42px;
    // }
  }
  ::v-deep .el-dialog {
    width: 660px;
  }
</style>
