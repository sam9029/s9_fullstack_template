<template>
  <el-form ref="form" :model="user" :rules="rules" label-width="80px" class="rese-pwd-form">
    <el-form-item label="旧密码" prop="oldPassword">
      <el-input
        v-model="user.oldPassword"
        placeholder="请输入旧密码"
        type="password"
        show-password
      />
    </el-form-item>
    <el-form-item label="新密码" prop="newPassword">
      <el-input
        v-model="user.newPassword"
        placeholder="请输入新密码"
        type="password"
        show-password
      />
    </el-form-item>
    <el-form-item label="确认密码" prop="confirmPassword">
      <el-input
        v-model="user.confirmPassword"
        placeholder="请确认密码"
        type="password"
        show-password
      />
    </el-form-item>
    <el-form-item label="验证码" prop="captcha_code">
      <!-- <div class="captcha_code_wrapper">
        <div>
          <el-input
            class="captcha-input"
            type="text"
            clearable
            v-model="user.captcha_code"
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
      </div> -->
      <div class="captcha_code_wrapper">
        <div style="width: 100%">
          <el-input
            class="captcha-input"
            type="text"
            clearable
            v-model="user.captcha_code"
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
    <el-form-item>
      <el-button type="primary" size="small" @click="submit">保存</el-button>
      <el-button type="danger" size="small" @click="close">关闭</el-button>
    </el-form-item>
  </el-form>
</template>

<script>
  import { updateUserPwd } from '@/api/account/personnel/user.js';
  import { getCodeImg } from '@/api/login';

  export default {
    props: {
      activeTab: {
        type: String,
        default: 'userinfo',
      },
    },
    data() {
      const equalToPassword = (rule, value, callback) => {
        if (this.user.newPassword !== value) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      };
      return {
        test: '1test',
        user: {
          oldPassword: undefined,
          newPassword: undefined,
          confirmPassword: undefined,
          captcha_code: '',
        },
        // 表单校验
        rules: {
          oldPassword: [{ required: true, message: '旧密码不能为空', trigger: 'blur' }],
          newPassword: [
            { required: true, message: '新密码不能为空', trigger: 'blur' },
            { min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur' },
          ],
          confirmPassword: [
            { required: true, message: '确认密码不能为空', trigger: 'blur' },
            { required: true, validator: equalToPassword, trigger: 'blur' },
          ],
          captcha_code: [{ required: true, message: '请输入验证码', trigger: 'blur' }],
        },

        tool_loading: false,
        codeUrl: '',
      };
    },
    watch: {
      activeTab: {
        handler(val) {
          if (val == 'resetPwd') {
            this.getCode();
          }
        },
        immediate: true,
      },
    },
    methods: {
      submit() {
        this.$refs['form'].validate((valid) => {
          if (valid) {
            let params = {
              old_password: this.user.oldPassword,
              password: this.user.newPassword,
              captcha_code: this.user.captcha_code,
            };
            updateUserPwd(params)
              .then((data) => {
                if (data.code == 0) {
                  this.$notify.success('修改成功');
                  this.getCode();
                  this.user = {
                    oldPassword: undefined,
                    newPassword: undefined,
                    confirmPassword: undefined,
                    captcha_code: '',
                  };
                }
              })
              .catch((err) => {
                this.user.captcha_code = ''
                this.getCode();
                this.$notify.error(err.message || err);
              });
          }
        });
      },
      close() {
        this.$store.dispatch('tagsView/delView', this.$route);
        this.$router.push({ path: '/' });
      },

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
    },
  };
</script>

<style lang="scss" scoped>
  .login-captcha {
    margin-left: 10px;
    width: 120px;
    height: 42px;
    border-radius: 5px;
    overflow: hidden;
    float: right;
    cursor: pointer;
  }
  .rese-pwd-form {
    .captcha_code_wrapper {
      display: flex;
      justify-content: space-between;
    }
    ::v-deep .el-input {
      width: 100%;
      input {
        height: 42px;
      }
    }
  }
  .captcha-input {
    width: 100%;
  }
</style>
