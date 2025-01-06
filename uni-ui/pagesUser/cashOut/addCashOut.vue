<template>
  <view class="add-cash-out">
    <view class="top-area">
      <MyNavbar bgColor="transparent">
        <template #navbarData>
          <view class="u-flex-row u-row-center u-col-center">
            <text class="u-text-center u-font-32 color-text-black"
              >添加提现方式</text
            >
          </view>
        </template>
      </MyNavbar>
    </view>
    <view class="u-p-x-28 add-cash-out--center">
      <view class="u-border-radius u-bg-f u-p-32">
        <view class="tab-area u-border-radius u-m-b-48">
          <view
            class="tab-item u-p-24 u-border-radius"
            @click="changeTab('BANK')"
            :class="{ active: currentTab == 'BANK' }"
          >
            <u--image
              v-if="currentTab == 'BANK'"
              :src="`${static_path}bank_icon.png`"
              width="40rpx"
              height="40rpx"
            ></u--image>
            <u--image
              v-else
              :src="`${static_path}bank_icon_disable.png`"
              width="40rpx"
              height="40rpx"
            ></u--image>
            <text class="u-font-28 u-line-h-44 u-m-l-16">银行卡</text>
          </view>
          <view
            class="tab-item u-p-24 u-border-radius"
            @click="changeTab('ALIPAY')"
            :class="{ active: currentTab == 'ALIPAY' }"
          >
            <u--image
              v-if="currentTab == 'ALIPAY'"
              :src="`${static_path}alipay_icon.png`"
              width="40rpx"
              height="40rpx"
            ></u--image>
            <u--image
              v-else
              :src="`${static_path}alipay_icon_disable.png`"
              width="40rpx"
              height="40rpx"
            ></u--image>
            <text class="u-font-28 u-line-h-44 u-m-l-16">支付宝</text>
          </view>
        </view>
        <u--form
          labelPosition="top"
          labelWidth="400rpx"
          :model="model"
          ref="formRef"
          :rules="rules"
        >
          <u-form-item>
            <text
              v-if="currentTab == 'BANK'"
              class="color-text-black u-font-32 u-line-h-48 u-font-bold"
              >填写银行卡信息</text
            >
            <text
              v-else
              class="color-text-black u-font-32 u-line-h-48 u-font-bold"
              >填写支付宝信息</text
            >
          </u-form-item>
          <u-form-item
            :label="currentTab == 'BANK' ? '银行卡号' : '支付宝账号'"
            prop="pay_account"
            required
          >
            <u-input
              :placeholder="
                currentTab == 'BANK' ? '请输入银行卡号' : '请输入支付宝账号'
              "
              v-model.trim="model.pay_account"
            >
            </u-input>
          </u-form-item>
          <u-form-item label="手机号" prop="mobile" required>
            <u-input placeholder="请输入手机号" v-model.trim="model.mobile">
            </u-input>
          </u-form-item>
          <u-form-item>
            <text class="color-text-black u-font-32 u-line-h-48 u-font-bold"
              >填写个人信息</text
            >
          </u-form-item>
          <u-form-item label="真实姓名" prop="people_name" required>
            <u-input
              placeholder="请输入真实姓名"
              v-model.trim="model.people_name"
            >
            </u-input>
          </u-form-item>
          <u-form-item label="身份证号" prop="id_card" required>
            <u-input
              placeholder="请输入身份证号"
              v-model.trim="model.id_card"
              required
            >
            </u-input>
          </u-form-item>
          <u-form-item>
            <text class="color-text-black u-font-32 u-line-h-48 u-font-bold"
              >上传身份证照片</text
            >
          </u-form-item>

          <view class="u-flex-row u-col-center">
            <u-form-item prop="id_card_face_url">
              <u-upload
                :fileList="frontList"
                @afterRead="frontAfterRead"
                @delete="deleteFrontPic"
                name="frontside"
                uploadIcon="photo"
                uploadText="点击上传身份证正面"
                width="299rpx"
                height="196rpx"
                :maxCount="1"
                class="u-m-r-32"
              >
              </u-upload>
            </u-form-item>

            <u-form-item prop="id_card_back_url">
              <u-upload
                :fileList="backList"
                @afterRead="backAfterRead"
                @delete="deleteBackPic"
                uploadIcon="photo"
                uploadText="点击上传身份证反面"
                name="backside"
                width="299rpx"
                height="196rpx"
                :maxCount="1"
              >
              </u-upload>
            </u-form-item>
          </view>
          <u-form-item>
            <view class="u-flex-row u-col-center">
              <u-checkbox-group v-model="check_proxy" shape="circle">
                <u-checkbox :name="true"></u-checkbox>
              </u-checkbox-group>
              <view class="color-text-less-grey u-font-24">
                本人承诺以阅读并同意<text class="color-text-primary"
                  >《隐私政策协议》</text
                >和<text class="color-text-primary">《电签协议》</text
                >，本人按照协议内容向贵司提供相应服务
              </view>
            </view>
          </u-form-item>
        </u--form>
      </view>
    </view>
    <view :style="{ height: btnHeight * 2 + 32 + 'rpx' }"></view>
    <BottomBtn
      :data="button_list"
      :buttonIndex="0"
      @submit="beforeSubmit"
      @height="getBtnHeight"
    />
    <u-modal
      :show="showDangerModal"
      :showCancelButton="false"
      :showConfirmButton="false"
    >
      <view class="modal-title">
        <u--image
          :src="`${static_path}status_icon.png`"
          width="96rpx"
          height="96rpx"
        ></u--image>
        <text class="color-text-black u-font-32 u-line-h-48 u-m-t-16"
          >风险操作提醒</text
        >
      </view>
      <view class="modal-content u-m-b-32">
        {{
          `您在【${userInfo.name}(${userInfo.id})】的账户名下绑定了新的收款人，经您本人确认，无论您将账户内资金提现至任何账户，均视为已同【${userInfo.name}(${userInfo.id})】完成结算并无异议，请您在操作提现时注意风险，特此提醒`
        }}。
      </view>
      <view class="modal-btns">
        <u-button color="#F6F6F6" @click="showDangerModal = false"
          >取消绑定</u-button
        >
        <u-button color="#408CFF" @click="showDangerModal = true"
          >我已知晓</u-button
        >
      </view>
    </u-modal>
    <u-modal
      :show="showDangerModal"
      :showCancelButton="false"
      :showConfirmButton="false"
    >
      <view class="modal-title">
        <u--image
          :src="`${static_path}status_icon.png`"
          width="96rpx"
          height="96rpx"
        ></u--image>
        <text class="color-text-black u-font-32 u-line-h-48 u-m-t-16"
          >账户安全验证</text
        >
      </view>
      <view class="modal-content u-m-b-32 u-flex-col u-row-center u-m-b-32">
        <text class="u-font-28 u-line-h-48">{{
          `请使用您的${userInfo.mobile}手机号获取验证码短信，并进行验证`
        }}</text>
        <u-input
          placeholder="请输入短信验证码"
          clearable
          v-model.trim="model.captcha_code"
          placeholderStyle="color: #989898;font-size: 24rpx;"
        >
          <template slot="suffix">
            <u-code
              ref="uCodeRef"
              @change="codeChange"
              :seconds="seconds"
              changeText="X秒后重新获取"
            ></u-code>
            <u--text
              @click="getCode"
              class="u-pointer u-font-14"
              type="primary"
              :text="tips"
            ></u--text>
          </template>
        </u-input>
      </view>
      <view class="modal-btns">
        <u-button color="#F6F6F6" @click="closeSmsModal">取消绑定</u-button>
        <u-button color="#408CFF" @click="onSubmit">确认绑定</u-button>
      </view>
    </u-modal>
    <u-modal
      :show="showRead"
      :showCancelButton="true"
      title="用户协议&隐私政策"
      confirmText="同意"
      cancelText="不同意"
      :closeOnClickOverlay="true"
      @cancel="showRead = false"
      @close="showRead = false"
      @confirm="agreement"
    >
      <view>
        为保障与你相关的合法权益，请阅读并同意
        <text class="u-primary" @click="agreementuser">《用户协议》</text>
        和
        <text class="u-primary" @click="privacy">《隐私政策》</text>
      </view>
    </u-modal>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import BottomBtn from "@/components/bottom-button/index.vue";
import MyNavbar from "@/components/my-navbar/index.vue";
import { upload_file } from "@/api/public";
import { compress, throttle, removeObjectEmpty, sleep } from "@/utils/tools.js";
import { postBankSign, postBankCheck } from "../api/cashOut.js";
import { mapGetters } from "vuex";
export default {
  props: {},
  components: {
    MyNavbar,
    BottomBtn,
  },
  data() {
    return {
      tips: "获取验证码",
      seconds: 120,
      showSmsModal: false,
      showDangerModal: false,
      showRead: false,
      currentTab: "BANK",
      frontList: [],
      backList: [],
      check_proxy: [],
      model: {
        pay_platform: "",
        pay_account: "",
        mobile: "",
        id_card: "",
        id_card_face_url: "",
        id_card_back_url: "",
        people_name: "",
        sms_id: "",
        captcha_code: "",
      },
      loading: false,
      btnHeight: null,
    };
  },
  computed: {
    userInfo() {
      return this.$store.getters.userInfo;
    },
    ...mapGetters(['static_path', 'userInfo']),
    button_list() {
      return [
        [
          {
            text: "确认添加",
            shape: "square",
            type: "primary",
            onClick: "submit",
            btnType: "button",
            loading: this.loading,
          },
        ],
      ];
    },
    rules() {
      return {
        pay_account: [
          {
            required: true,
            message:
              this.currentTab == "BANK" ? "请输入银行卡号" : "请输入支付宝账号",
            trigger: ["change", "blur"],
          },
        ],
        mobile: [
          {
            validator: (rule, value, callback) => {
              return uni.$u.test.mobile(value);
            },
            message: "手机号码不正确",
            trigger: ["change", "blur"],
          },
        ],
        people_name: [
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
        id_card_face_url: [
          {
            required: true,
            message: "请上传身份证正面图片",
            trigger: ["change", "blur"],
          },
        ],
        id_card_back_url: [
          {
            required: true,
            message: "请上传身份证反面图片",
            trigger: ["change", "blur"],
          },
        ],
      };
    },
  },
  onLoad({type}) {
	  if(type){
		  console.log(type)
		  this.currentTab= type
	  }
  },
  methods: {
    /**
     * @description: 处理前面文件上传完成后的逻辑
     * @param {*} event - 上传事件对象，包含文件信息和文件名
     * @return {*}
     */
    async frontAfterRead(event) {
      // 初始化前面文件的状态为正在上传
      this.frontList = [
        {
          ...event.file,
          status: "uploading",
          message: "上传中",
        },
      ];

      // 调用上传文件的Promise方法，并获取返回结果
      const res = await this.uploadFilePromise(event.file, event.name);

      // 如果上传成功，更新前面文件的状态为成功，并存储返回的文件URL
      if (res) {
        this.frontList = [
          {
            ...event.file,
            status: "success",
            message: "",
            url: res,
          },
        ];
      }
    },

    /**
     * @description: 处理背面文件上传完成后的逻辑
     * @param {*} event - 上传事件对象，包含文件信息和文件名
     * @return {*}
     */
    async backAfterRead(event) {
      // 初始化背面文件的状态为正在上传
      this.backList = [
        {
          ...event.file,
          status: "uploading",
          message: "上传中",
        },
      ];

      // 调用上传文件的Promise方法，并获取返回结果
      const res = await this.uploadFilePromise(event.file, event.name);

      // 如果上传成功，更新背面文件的状态为成功，并存储返回的文件URL
      if (res) {
        this.backList = [
          {
            ...event.file,
            status: "success",
            message: "",
            url: res,
          },
        ];
      }
    },

    /**
     * @description: 删除前置图片，并清空相关模型中的图片链接
     * @return {*}
     */
    deleteFrontPic() {
      this.frontList = []; // 清空前置图片列表
      this.model.id_card_face_url = ""; // 清空前置图片的URL
    },

    /**
     * @description: 删除后置图片，并清空相关模型中的图片链接
     * @return {*}
     */
    deleteBackPic() {
      this.backList = []; // 清空后置图片列表
      this.model.id_card_back_url = ""; // 清空后置图片的URL
    },

    /**
     * @description: 用于上传文件的异步函数，如果文件超过2MB则进行压缩，上传后返回文件的URL
     * @param {*} file - 要上传的文件对象
     * @param {*} name - 文件的类型名称（如：frontside或backside）
     * @return {*}
     */
    async uploadFilePromise(file, name) {
      // 检查文件大小，如果大于2MB，则进行压缩
      if (file.size / 1024 / 1024 > 2) {
        await compress(file) // 调用压缩函数
          .then((res) => {
            file.url = res;
          })
          .catch((err) => {
            this.toastMsg(err, 'error');
          });
      }

      // 返回一个Promise，用于处理文件上传
      return new Promise((resolve, reject) => {
        // 调用上传文件的API
        upload_file({ path_type: "id_card", file_name: file.name }, file.url)
          .then((res) => {
            if (res.code !== 0) throw res.data;

            // 上传成功，更新文件状态和相关属性
            file.status = "success"; // 设置文件状态为成功
            file.message = ""; // 清空消息
            file.url = res.data.url; // 更新文件的URL
            file.osskey = res.data.oss_key; // 更新OSS密钥

            // 根据文件类型更新模型中的相应URL
            if (name == "frontside") {
              this.model.id_card_face_url = res.data.url; // 正面
            } else {
              this.model.id_card_back_url = res.data.url; // 背面
            }

            // 解析Promise并返回上传的文件URL
            resolve(res.data.url);
          })
          .catch((err) => {
            this.toastMsg(err.message || "上传失败！", "error");
            reject(err);
          });
      });
    },

    /**
     * 切换当前选项卡
     * @description: 根据传入的索引改变当前选项卡，并重置模型数据
     * @param {number} index - 选项卡的索引
     * @return {void} - 无返回值
     */
    changeTab(index) {
      // 设置当前选项卡为传入的索引
      this.currentTab = index;
      this.model = this.$options.data().model;
      this.$refs.formRef.clearValidate();
    },

    checkReq() {
      this.loading = true;
      this.toastMsg("加载中", "loading", -1);
      postBankCheck({ id_card: this.model.id_card })
        .then((res) => {
          // 如果验证通过
          if (res.code == 0) {
            // 检查是否需要显示短信验证码
            if (res.data.show_auth) {
              this.showDangerModal = true;
            } else {
              this.onSubmit(); // 直接提交表单
            }
          }
        })
        .catch((error) => {
          this.loading = false;
          this.$refs.toastRef.close();
          this.toastMsg(error.message || "验证失败！", "error");
        });
    },

    /**
     * @description: 提交前的验证方法，使用防抖机制避免频繁调用
     * @return {*}
     */
    beforeSubmit: throttle(function func() {
      this.$refs.formRef
        .validate()
        .then(() => {
          if (this.check_proxy.length == 0) {
            return (this.showRead = true);
          } else {
            this.checkReq();
          }
        })
        .catch((error) => {});
    }, 500), // 500毫秒的防抖时间

    onSubmit() {
      postBankSign(
        removeObjectEmpty({
          ...this.model,
          pay_platform: this.currentTab,
        })
      )
        .then(async (res) => {
          if (res.code == 0) {
            this.toastMsg("提交成功！", "success");
            await sleep(1000);
            uni.redirectTo({
              url: "/pagesUser/cashOut/index",
            });
          }
        })
        .catch((error) => {
          this.toastMsg(error.message || "提交失败！", "error");
        })
        .finally(() => {
          this.loading = false;
          this.$refs.toastRef.close();
        });
    },

    getBtnHeight(height) {
      this.btnHeight = height;
    },

    codeChange(text) {
      this.tips = text;
    },
    getCode() {
      if (!this.model.mobile) {
        return this.toastMsg("请先填写手机号", "error");
      }
      if (this.$refs.uCodeRef.canGetCode) {
        this.showSlideCode = true;
      } else {
        this.toastMsg("倒计时结束后再发送", "error");
      }
    },

    closeSmsModal() {
      this.seconds = 120;
      this.tips = "获取验证码";
      this.model.captcha_code = null;
      this.model.sms_id = null;
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

    agreement() {
      this.showRead = false;
      this.check_proxy = [true];
      this.checkReq();
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
::v-deep .my-navbar .app-grid {
  backdrop-filter: blur(20px);
}
.top-area {
  /* #ifdef APP || MP */
  padding-top: 88rpx;
  /* #endif */
  z-index: 999;
  width: 750rpx;
  position: fixed;
  top: 0;
  backdrop-filter: blur(20px);
}
.add-cash-out {
  background: linear-gradient(180deg, #d3edff 0%, #f6f7fb 60.27%);
  min-height: 100vh;
  .add-cash-out--center {
    /* #ifdef H5 */
    padding-top: 116rpx;
    /* #endif */
    /* #ifdef APP */
    padding-top: 204rpx;
    /* #endif */
  }
}
.tab-area {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  height: 92rpx;
  background: $u-grey-3;
  .tab-item {
    background: $u-grey-3;
    color: $u-grey-7;
    display: flex;

    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
  }
  .active {
    background: $u-primary-6;
    color: #fff !important;
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
::v-deep .u-upload__wrap .u-upload__button {
  border-radius: 24rpx;
}
</style>
