<template>
  <view>
    <u-modal
      :show="showAddAccountNotcie"
      @confirm="confirmNotice"
      @cancel="cancelNotice"
      ref="uModal"
      title="温馨提示"
      width="404rpx"
      content="您在当前选择平台下还未添加账号，请前往 个人中心 -> 我的账户 页面新增账号后再试!"
      confirmText="立即前往"
      confirmColor="#408CFF"
      cancelColor="#6A6A6A"
      :showCancelButton="true"
    >
    </u-modal>
    <!-- 弹框 A -->
    <u-popup :show="showPromotionPopup" round="24rpx">
      <view class="popup-content">
        <view class="title-box u-flex-row">
          <text class="color-text-black u-font-32 u-font-weight">新建推广</text>
          <u-icon
            :name="`${static_path}close_circle_grey.png`"
            width="24"
            height="24"
            @click="closePromotionPopup"
          ></u-icon>
        </view>

        <view class="name-box u-flex-row">
          <text class="name-box-title u-font-28">计划名称</text>
          <u-input
            class="name-box-input u-font-24 color-text-black u-p-l-36"
            v-model="planName"
            placeholder="请输入推广计划名称"
            placeholderStyle="color: #989898;font-size: 24rpx;"
          ></u-input>
        </view>

        <view class="name-box u-flex-row">
          <text class="name-box-title u-font-28">推广方式</text>
          <view
            class="name-box-input u-flex-row u-flex-between"
            @click="openTypePopup"
          >
            <text
              class="u-font-24 u-flex-1"
              :style="{
                color: selectedType == '请选择推广方式' ? '#989898' : '#1A1A1A',
              }"
              >{{ selectedType }}</text
            >
            <u-icon size="16rpx" name="arrow-down"></u-icon>
          </view>
        </view>
        <view class="name-box u-flex-row" v-show="showAccount">
          <text class="name-box-title u-font-28">推广账号</text>
          <view
            class="name-box-input u-flex-row u-flex-between"
            @click="openAccountPopup"
          >
            <text
              class="u-font-24 u-flex-1"
              :style="{
                color:
                  selectedAccount == '请选择平台账号' ? '#989898' : '#1A1A1A',
              }"
              >{{ selectedAccount }}</text
            >
            <u-icon size="16rpx" name="arrow-down"></u-icon>
          </view>
        </view>
        <view class="name-box u-flex-row" v-show="showWord">
          <text class="name-box-title u-font-28">文字口令</text>
          <u-input
            class="name-box-input u-font-24 color-text-black u-p-l-36"
            v-model="wordsCode"
            placeholder="请输入4-8位文字口令"
            placeholderStyle="color: #989898;font-size: 24rpx;"
          ></u-input>
        </view>
        <view class="u-m-t-8" style="margin-left: 140rpx" v-show="showWord">
          <text class="u-font-22" style="color: #fa4753"
            >注意：此项非必填项，若不填写，系统将自动生成口令；文字口令需审核通过才生效，系统口令则立即生效。</text
          >
        </view>
        <u-button
          class="u-m-t-32"
          type="primary"
          customStyle="border-radius: 16rpx;padding: 28rpx;height: 104rpx;font-size: 32rpx;line-height: 48rpx;"
          :loading="submitLoading"
          @click="handlePopupComplete"
          >提交</u-button
        >
      </view>
    </u-popup>

    <!-- 弹框 B -->
    <u-popup :show="showTypePopup" round="24rpx">
      <view class="popup-content">
        <view class="title-box u-flex-row">
          <text class="color-text-black u-font-32 u-font-weight"
            >请选择推广方式</text
          >
          <u-icon
            :name="`${static_path}close_circle_grey.png`"
            width="24"
            height="24"
            @click="closeTypePopup()"
          ></u-icon>
        </view>

        <picker-view
          class="picker-view-box"
          :style="{ height: pickerHeight + 'rpx' }"
          indicator-style="height: 96rpx;"
          :value="pickervalue"
          @change="onPickerChange"
        >
          <picker-view-column>
            <view
              class="picker-view-item u-font-32 color-text-black u-font-weight"
              v-for="(item, index) in typeList"
              :key="item['id'] || index"
            >
              {{ item["name"] }}
            </view>
          </picker-view-column>
        </picker-view>

        <view class="type-submit-box u-flex-row">
          <view
            class="type-submit-box-btn u-font-28 u-font-weight color-text-less-grey"
            @click="closeTypePopup"
            >取消</view
          >
          <view class="type-submit-box-space"></view>
          <view
            class="type-submit-box-btn u-font-28 u-font-weight color-text-primary"
            @click="selectTypeComplate"
            >确定</view
          >
        </view>
      </view>
    </u-popup>
    <!-- 弹框 C -->
    <u-popup :show="showAccountPopup" round="24rpx">
      <view class="popup-content">
        <view class="title-box u-flex-row">
          <text class="color-text-black u-font-32 u-font-weight"
            >请选择平台账号</text
          >
          <u-icon
            :name="`${static_path}close_circle_grey.png`"
            width="24"
            height="24"
            @click="closeAccountPopup()"
          ></u-icon>
        </view>

        <picker-view
          class="picker-view-box"
          :style="{ height: pickerHeight + 'rpx' }"
          indicator-style="height: 96rpx;"
          :value="pickerAccountvalue"
          @change="onAccountPickerChange"
        >
          <picker-view-column>
            <view
              class="picker-view-item u-font-32 color-text-black u-font-weight"
              v-for="(item, index) in accountList"
              :key="item['id'] || index"
            >
              {{ item["name"] }}
            </view>
          </picker-view-column>
        </picker-view>

        <view class="type-submit-box u-flex-row">
          <view
            class="type-submit-box-btn u-font-28 u-font-weight color-text-less-grey"
            @click="closeAccountPopup"
            >取消</view
          >
          <view class="type-submit-box-space"></view>
          <view
            class="type-submit-box-btn u-font-28 u-font-weight color-text-primary"
            @click="selectAccountComplate"
            >确定</view
          >
        </view>
      </view>
    </u-popup>
    <base-toast ref="toastRef"></base-toast>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  name: "promotion-popup",
  props: {
    showWordCode: {
      type: Boolean,
      require: true,
      default: false,
    },
    typeList: {
      /* 推广方式， object对象，包含 id 和 title两个字段 */
      type: Array,
      require: true,
      default: () => [],
    },
    accountList: {
      /* 平台账号， object对象 */
      type: Array,
      require: true,
      default: () => [],
    },
    submitLoading: {
      type: Boolean,
      default: false,
    },
		autoClose: {
			type: Boolean,
			default: true
		}
  },
  data() {
    return {
      showPromotionPopup: false, // 控制弹框 新建推广计划 的显示
      showTypePopup: false, // 控制弹框 推广类型 的显示
      showAccountPopup: false, // 控制弹框 推广账号 的显示
      planName: "", //推广计划名称
      wordsCode: "", //文字口令
      selectedIndex: -1, // 选择推广方式的索引
      selectedAccontIndex: -1, // 选择推广账号的索引
      selectedAccontId: -1, // 推广账号id
      selectedTypeId: -1, // 推广方式id
      selectedType: "请选择推广方式", // 选择的推广方式
      selectedAccount: "请选择平台账号", // 选择的平台账号
      showAccount: false,
      showWord: false,
      tempPickerIndex: 0, //临时存储选择推广方式滑动索引
      tempAccountPickerIndex: 0, //临时存储选择推广平台滑动索引
      showAddAccountNotcie: false,
    };
  },
  computed: {
    ...mapGetters(["static_path"]),
    pickervalue() {
      return [this.selectedIndex >= 0 ? this.selectedIndex : 0];
    },
    pickerAccountvalue() {
      return [this.selectedAccontIndex >= 0 ? this.selectedAccontIndex : 0];
    },
    pickerHeight() {
      let height = this.typeList.length * 96;
      return Math.max(200, Math.min(600, height));
    },
  },
  methods: {
    // 提示
    toastMsg(message, type = "default", duration = 2000) {
      this.$refs.toastRef?.show({
        type,
        message,
        duration,
      });
    },
    // 打开弹框 新建推广计划
    openPopup() {
      this.showPromotionPopup = true;
    },
    // 关闭弹框 新建推广计划
    closePromotionPopup() {
      this.resetData();
      this.showPromotionPopup = false;
    },
    //前往新增账号界面
    confirmNotice() {
      this.showAddAccountNotcie = false;
      const data = {
        name: "",
      };
      this.$emit("completed", data);
      this.closePromotionPopup();
    },
    cancelNotice() {
      this.showAddAccountNotcie = false;
    },
    // 打开弹框 选择推广方式
    openTypePopup() {
      this.showPromotionPopup = false;
      this.showTypePopup = true;
    },
    // 关闭弹框 选择推广方式
    closeTypePopup() {
      this.showTypePopup = false;
      this.showPromotionPopup = true;
    },
    // 打开弹框 选择推广账号
    openAccountPopup() {
      if (this.accountList.length > 0) {
        this.showPromotionPopup = false;
        this.showAccountPopup = true;
      } else {
        this.showAddAccountNotcie = true;
      }
    },
    // 关闭弹框 选择推广账号
    closeAccountPopup() {
      this.showAccountPopup = false;
      this.showPromotionPopup = true;
    },
    /* 推广方式滑动改变 */
    onPickerChange(e) {
      this.tempPickerIndex = e.detail.value[0];
    },
    /* 推广账号滑动改变 */
    onAccountPickerChange(e) {
      this.tempAccountPickerIndex = e.detail.value[0];
    },
    /* 选择推广方式完成 */
    selectTypeComplate() {
      this.selectedIndex = this.tempPickerIndex;
      this.selectedType = this.typeList[this.selectedIndex]["name"];
      this.selectedTypeId = this.typeList[this.selectedIndex]["id"];
      this.closeTypePopup();
      switch (this.selectedTypeId) {
        case 2:
          //显示账号选择
          this.showAccount = true;
          this.showWord = false;
          break;
        case 3:
          this.showAccount = false;
          if (this.showWordCode) {
            //显示文字口令
            this.showWord = true;
          }
          break;
        default:
          this.showAccount = false;
          this.showWord = false;
          break;
      }
    },
    /* 选择推广账号完成 */
    selectAccountComplate() {
      this.selectedAccontIndex = this.tempAccountPickerIndex;
      this.selectedAccount = this.accountList[this.selectedAccontIndex]["name"];
      this.selectedAccontId = this.accountList[this.selectedAccontIndex]["id"];
      this.closeAccountPopup();
    },
    // 弹框 新建推广计划 处理完成
    handlePopupComplete() {
      if (!this.planName) {
        this.toastMsg("请输入计划名称");
      } else if (this.selectedIndex < 0) {
        this.toastMsg("请选择推广方式");
      } else {
        let data = {
          name: this.planName,
          id: this.selectedTypeId,
        };

        if (this.selectedTypeId === 2) {
          if (this.selectedAccontId === -1) {
            this.toastMsg("请选择推广账号");
            return;
          }
          data.accountId = this.selectedAccontId;
        } else if (this.selectedTypeId === 3 && this.showWordCode) {
          data.keyword = this.wordsCode;
        } else {
          data.id = this.typeList[this.selectedIndex].id;
        }
        this.$emit("completed", data);
      }
			if(this.autoClose) this.closePromotionPopup();
    },

    /* 清除数据，并关闭弹框 */
    resetData() {
      this.planName = "";
      this.showWord = "";
      this.wordsCode = "";
      this.showAccount = false;
      this.selectedIndex = -1;
      this.selectedAccontId = -1;
      this.selectedType = "请选择推广方式";
      this.selectedAccount = "请选择平台账号";
    },
  },
};
</script>

<style lang="scss" scoped>
.popup-content {
  padding: 24rpx;

  .title-box {
    justify-content: space-between;
  }

  .name-box {
    margin-top: 32rpx;
    height: 88rpx;
    justify-content: space-between;
    // align-items: center;

    .name-box-title {
      color: #353535;
      margin-right: 32rpx;
      line-height: 88rpx;
    }

    .name-box-input {
      flex: 1;
      background-color: #f6f6f6;
      border-radius: 16rpx;
      padding: 24rpx 32rpx 24rpx 32rpx;
      border: none;
    }
  }

  .submit-btn {
    margin-top: 32rpx;
    border-radius: 16rpx;
    height: 104rpx;
    line-height: 104rpx;
  }

  .picker-view-box {
    width: 100%;

    .picker-view-item {
      line-height: 96rpx;
      text-align: center;
    }
  }

  .type-submit-box {
    margin-top: 20rpx;
    height: 108rpx;
    align-items: center;

    .type-submit-box-btn {
      flex: 1;
      text-align: center;
      line-height: 108rpx;
      border: none !important;
      background-color: white;
    }

    .type-submit-box-space {
      width: 2rpx;
      height: 32rpx;
      background-color: #eee;
    }
  }
}
</style>
