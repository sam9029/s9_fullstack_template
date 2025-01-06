<template>
  <view class="realname-page">
    <MyNavbar>
      <template #navbarData>
        <view class="u-flex-row u-row-center u-col-center">
          <text class="u-text-center u-font-32 color-text-black u-font-bold"
            >实名认证</text
          >
        </view>
      </template>
    </MyNavbar>
    <view class="card-bg u-m-x-28 u-m-y-28">
      <view class="u-text-main u-font-48 u-line-h-64">请进行人脸识别认证</view>
      <view class="color-text-less-grey u-font-24 u-line-h-40 u-m-t-16"
        >我们需要人脸识别来验证您的本人身份。您的个人信息将得到绝对保护，仅限用于身份核验。
      </view>
      <view class="centered-flex" style="margin-top: 64rpx">
        <u--image
          :src="`${static_path}icon_realname.png`"
          width="320rpx"
          height="320rpx"
          class="u-m-t-28"
        ></u--image>
      </view>
      <u--form
        labelPosition="top"
        labelWidth="400rpx"
        :model="model"
        ref="formRef"
        :rules="rules"
        style="margin-top: 64rpx"
      >
        <u-form-item label="真实姓名" prop="name" required>
          <u-input placeholder="请输入您的真实姓名" v-model.trim="model.name">
          </u-input>
        </u-form-item>
        <u-form-item label="身份证号" prop="id_card" required>
          <u-input
            placeholder="请输入您的真实身份证号码"
            v-model.trim="model.id_card"
            required
          >
          </u-input>
        </u-form-item>
      </u--form>
      <!-- <view>{{ resData || "--" }}</view> -->
      <u-button
        class="u-m-t-56"
        color="#408CFF"
        :loading="isLoading"
        @click="onSubmit"
        >开始人脸认证</u-button
      >
      <u-popup :show="showAuthResult" round="16rpx" mode="center">
        <view class="u-p-48" style="width: 520rpx">
          <view class="u-flex-row u-row-center">
            <u-icon
              :name="`${static_path}${
                isSuccess ? 'notice_success.png' : 'notice_error.png'
              }`"
              width="96rpx"
              height="96rpx"
            ></u-icon>
          </view>
          <view
            class="u-font-32 u-font-weight u-text-main u-m-t-16"
            style="text-align: center"
          >
            {{ `${isSuccess ? "认证成功" : "认证失败"}` }}
          </view>
          <view
            class="u-m-t-32 u-font-28 color-text-less-black"
            style="text-align: center"
          >
            {{
              `${
                isSuccess
                  ? "请复制链接后在PC端打开，使用“欢乐创”APP扫码登录创作者后台，进行原创剧集的上传与管理"
                  : "实名认证失败，请稍后重试"
              }`
            }}
          </view>
          <view class="u-flex-row u-m-t-32">
            <view
              v-if="isSuccess"
              class="u-font-28 u-text-main u-flex-1"
              style="
                background: #f6f6f6;
                border-radius: 16rpx;
                line-height: 44rpx;
                padding-top: 20rpx;
                padding-bottom: 20rpx;
                text-align: center;
              "
              @click="checkResult(false)"
              >我知道了</view
            >
            <view
              class="u-font-28 color-text-white u-m-l-28 u-flex-1"
              style="
                background: #408cff;
                border-radius: 16rpx;
                line-height: 44rpx;
                padding-top: 20rpx;
                padding-bottom: 20rpx;
                text-align: center;
              "
              @click="checkResult(true)"
              >{{ `${isSuccess ? "复制链接" : "我知道了"}` }}</view
            >
          </view>
        </view>
      </u-popup>
    </view>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import MyNavbar from "@/components/my-navbar/index.vue";
const aliyunVerify = uni.requireNativePlugin("AP-FaceDetectModule");
import { getAliyunCertifyId, checkAliCertifyResult } from "@/api/public.js";
import { copy } from "../../utils/tools";
export default {
  components: {
    MyNavbar,
  },
  data() {
    return {
      resData: null,
      model: {
        name: "",
        id_card: "",
      },
      isLoading: false,
      showAuthResult: false,
      creatorHost: "",
      isSuccess: false,
      metaInfo: null,
      outer_order_no: null,
    };
  },
  computed: {
    rules() {
      return {
        name: [
          {
            required: true,
            message: "请输入真实姓名",
            trigger: ["change", "blur"],
          },
          {
            pattern: /^[\u4e00-\u9fa5]*$/g,
            // 正则检验前先将值转为字符串
            transform(value) {
              return String(value);
            },
            message: "只能包含汉字",
            trigger: ["blur", "change"],
          },
          // 2-8个字符之间的判断
          {
            min: 2,
            max: 8,
            message: "姓名长度在2-8个字符之间",
            trigger: ["blur", "change"],
          },
        ],
        id_card: [
          {
            validator: (rule, value, callback) => {
              return uni.$u.test.idCard(value);
            },
            message: "身份证号不正确",
            trigger: ["change", "blur"],
          },
        ],
      };
    },
    static_path() {
      let str = "";
      // #ifdef APP
      str = "/static/images/";
      // #endif
      // #ifndef APP
      str = this.$store.getters.static_path;
      // #endif
      return str;
    },
  },
  methods: {
    checkResult(status) {
      this.showAuthResult = false;
      if (status && this.isSuccess) {
        copy(
          {
            content: this.creatorHost,
          },
          this
        );
        uni.redirectTo({
          url: '/pagesUser/auth/home'
        });
      }
    },
    onSubmit() {
      this.$refs.formRef
        .validate()
        .then(() => {
          this.gotoRealname();
        })
        .catch(() => {});
    },
    async gotoRealname() {
      // 调用getMetaInfo获取MetaInfo数据
      // #ifdef APP
      try {
        this.isLoading = true;
        this.metaInfo = aliyunVerify?.getMetaInfo();

        const platform = uni.getSystemInfoSync().platform;
        if (platform === "ios") {
          this.metaInfo = JSON.stringify(this.metaInfo);
        }

        const verify_data = await getAliyunCertifyId({
          meta_info: this.metaInfo,
          cert_no: this.model.id_card,
          cert_name: this.model.name,
        });

        // 测试
        this.resData = verify_data.data;

        const certify_id = verify_data.data?.certify_id;

        if (!certify_id) {
          this.isLoading = false;
          this.toastMsg(verify_data.message, "error");
          return;
        }

        aliyunVerify.verify({ certifyId: certify_id }, (res) => {
          this.isLoading = false;
          const code = res.code || res.retCode;
          if (code === 1003) {
            this.toastMsg("您已取消人脸认证");
            return;
          }
          
          this.aliAuthReq(certify_id);
        });
      } catch (err) {
        this.isLoading = false;
        this.toastMsg(err.message || "认证过程出现错误");
      }
      // 获取用户信息
      // #endif
      // #ifdef H5
      try {
        let meta_info = window.getMetaInfo();
        const res = await getAliyunCertifyId({
          meta_info: JSON.stringify(meta_info),
          cert_no: this.model.id_card,
          cert_name: this.model.name,
        });
        this.resData = res.data;
        if (res.code == 0) {
          this.isLoading = false;
          if (!res.data?.certify_url) {
            return this.toastMsg("实名认证初始化失败", "error");
          } else {
            window.location.href = res.data.certify_url;
          }
        }
      } catch (error) {
        this.isLoading = false;
        this.resData = error;
        this.toastMsg(error.message || "认证过程出现错误");
      }
      // #endif
    },

    aliAuthReq(certify_id) {
      // 认证成功
      checkAliCertifyResult({
        certify_id: certify_id || undefined,
        outer_order_no: this.outer_order_no || undefined,
      })
        .then((res) => {
          this.isSuccess = res?.code === 0 && res.data?.passed === "T";
          if (this.isSuccess) {
            this.creatorHost = res.data?.creator_host;
          }
        })
        .catch((error) => {
          this.isSuccess = false;
          this.toastMsg(error, 'error')
        })
        .finally(() => {
          this.showAuthResult = true;
        });
    },

    toastMsg(message, type = "default") {
      this.$refs.toastRef?.show({
        type,
        message,
      });
    },
  },
  onLoad(option) {
    if (option.outer_order_no) {
      this.outer_order_no = option.outer_order_no;
      this.aliAuthReq();
    }
  },
};
</script>

<style lang="scss">
.realname-page {
  /* #ifdef APP */
  padding-top: 88rpx;

  /* #endif */
  .centered-flex {
    display: flex;
    justify-content: center;
  }

  .card-bg {
    background: #ffffff;
    border-radius: 16rpx;
    padding: 48rpx;
  }

  .btn_bg {
    margin-top: 64rpx;
    text-align: center;
    background: #408cff;
    border-radius: 16rpx;
    padding-top: 24rpx;
    padding-bottom: 24rpx;
  }
}

::v-deep .u-input {
  border-radius: 16rpx;
  height: 88rpx;
  background-color: #f6f6f6;
  border: none;
  padding: 24rpx 32rpx !important;
}

::v-deep .u-form-item__body__left {
  position: relative;
  left: 10rpx;
  margin-bottom: 16rpx !important;
}

::v-deep .u-button {
  height: 88rpx;
  border-radius: 16rpx;
}
</style>
