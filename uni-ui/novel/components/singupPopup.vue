<template>
  <view class="singup-popup">
    <u-popup :show="show" mode="bottom">
      <view class="u-p-28">
        <view class="popup-top u-flex-row u-row-between u-col-center u-m-b-32">
          <text class="u-font-32 u-line-h-48 color-text-black u-font-bold"
            >立即报名</text
          >
          <u-icon
            @click="onClose"
            :name="`${static_path}close_circle.png`"
            size="24"
          ></u-icon>
        </view>
        <view class="u-border-radius u-p-24" style="border: 2rpx solid #eee">
          <view class="u-font-24 u-line-h-40">
            <text class="color-text-black">如何复制星图ID?：</text>
            <text style="color: #3c3c3c"
              >打开抖音—点击我的一打开抖音创作者中心一星图商单—我的—常用功能—账号管理—星图ID</text
            >
          </view>
        </view>
        <u--form
          :model="model"
          :rules="rules"
          style="height: 510rpx"
          labelWidth="160rpx"
          ref="formRef"
        >
          <u-form-item label="抖音账号" prop="platform_acc">
            <view class="platform-box widthAll u-relative">
              <u-input
                v-model="model.platform_acc"
                disabledColor="#f6f6f6"
                disabled
                placeholder="请选择抖音账号"
              ></u-input>
              <view class="picker-overlay" @click="openSelect" />
            </view>
          </u-form-item>
          <u-form-item label="星图ID" prop="xingtu_id">
            <u-input
              v-model.trim="model.xingtu_id"
              placeholder="请输入抖音星图ID"
            ></u-input>
          </u-form-item>
          <u-form-item label="粉丝量" prop="fan_counts">
            <u-input
              v-model.trim="model.fan_counts"
              placeholder="请输入账号粉丝数量"
            ></u-input>
          </u-form-item>
        </u--form>
      </view>
      <BottomBtn :data="button_list" :buttonIndex="0" @submit="onSubmit" />
    </u-popup>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { getPlatformAcc } from "@/api/public.js";
import { postXGRegister } from "../api/detail.js";
import BottomBtn from "@/components/bottom-button/index.vue";
import { mapGetters } from "vuex";
export default {
  components: {
    BottomBtn,
  },
  data() {
    return {
      model: {
        task_primary_id: "",
        platform_primary_id: "",
        xingtu_id: "",
        fan_counts: "",
        platform_acc: "",
      },
      rules: {
        platform_acc: [
          {
            required: true,
            message: "请选择抖音账号",
            trigger: "blur",
          },
        ],
        xingtu_id: [
          {
            required: true,
            message: "请输入星图ID",
            trigger: ["change", "blur"],
          },
        ],
      },
      submitLoading: false,
      showACCPicker: false,
      accountList: [],
      popupBtnHeight: "",
      show: false,
      reqFlag: true,
    };
  },
  computed: {
    ...mapGetters(['static_path', 'image']),
    button_list() {
      return [
        [
          {
            text: "提交",
            shape: "square",
            onClick: "submit",
            btnType: "button",
            type: "primary",
            loading: this.submitLoading,
          },
        ],
      ];
    },
  },
  methods: {
    getPopupBtnHeight(height) {
      this.popupBtnHeight = height * 2 + 30 + "rpx";
    },

    closePicker() {
      this.$refs.pickerRef.close();
    },

    open(task_id, obj) {
      if(obj?.label && obj?.value) {
        this.reqFlag = false;
        this.model.platform_acc = obj.label;
        this.model.platform_primary_id = obj.value;
        this.accountList = obj.list;
      }
      this.model.task_primary_id = task_id || "";
      this.show = true;
      this.queryAcc();
    },

    onClose() {
      this.show = false;
      this.reqFlag = true;
      this.model = this.$options.data().model;
    },

    queryAcc() {
      if(!this.reqFlag) return;
      this.toastMsg("加载中", "loading", -1);
      getPlatformAcc({ platform_id: 1 })
        .then((res) => {
          if (res.code == 0) {
            this.accountList = res.data.map((el) => {
              el["name"] = el.label;
              delete el.label;
              return el;
            });
          }
        })
        .catch((error) => {
          this.toastMsg(error, "error");
        })
        .finally(() => {
          this.$refs.toastRef.close();
        });
    },

    selectPlatform(list, item) {
      this.model.platform_primary_id = item.id;
      this.model.platform_acc = item.name;
    },

    openSelect() {
      this.$emit('next')
      this.show = false;
    },

    onSubmit() {
      this.$refs.formRef
        .validate()
        .then(() => {
          this.submitLoading = true;
          postXGRegister(this.model)
            .then((res) => {
              if (res.code == 0) {
                this.$emit('refresh')
                this.toastMsg("报名成功", "success");
                this.onClose();
              }
            })
            .catch((error) => {
              this.toastMsg(error, "error");
            })
            .finally(() => {
              this.submitLoading = false;
            });
        })
        .catch(() => {});
    },

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
.picker-overlay {
  position: absolute;
  width: 100%;
  height: 88rpx;
  background: transparent;
  top: 0;
  left: 0;
}
::v-deep #koc-main-bottom {
  border: none;
}
::v-deep .u-popup__content {
  border-top-left-radius: 24rpx;
  border-top-right-radius: 24rpx;
}
::v-deep .u-input {
  border-radius: 16rpx;
  height: 88rpx;
  background-color: #f6f6f6;
  border: none;
  padding: 24rpx 32rpx !important;
}
</style>
