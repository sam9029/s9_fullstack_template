<template>
  <view class="base-modal" v-if="show">
    <u-modal
      :width="width"
      :show="show"
      :showCancelButton="false"
      :showConfirmButton="false"
      :closeOnClickOverlay="closeOnClickOverlay"
      :overlayOpacity="overlayOpacity" 
      @confirm="onConfirm"
      @cancel="onCancel"
      @close="close"
    >
      <view class="u-flex-col u-row-center u-col-center widthAll">
        <view v-if="title" class="title u-flex-row u-row-center u-col-center">
          <text class="u-font-32 u-font-bold">{{ title }}</text>
        </view>
        <template v-if="customeContent">
          <view class="custom-content">
            <slot></slot>
            <view 
              v-if="customNeedDefaultBtn"
              class="modal-btns u-m-t-50"
              :class="{
                'modal-btns--double': showCancelBtn && showConfirmBtn,
                'modal-btns--single': !showCancelBtn || !showConfirmBtn
              }"
            >
              <view 
                v-if="showCancelBtn"
                class="cancel--btn" 
                @click="onCancel"
              >
                <text class="u-font-28" style="color: #2a2a2a">{{ cancelText }}</text>
              </view>
              <view 
                v-if="showConfirmBtn"
                class="confirm--btn" 
                @click="onConfirm"
              >
                <text class="u-font-28">{{ confirmText }}</text>
              </view>
            </view>
          </view>
        </template>
        <view v-else class="base-modal-body">
          <p class="content u-font-28 u-text-center">{{ content }}</p>
          <view 
            class="modal-btns u-m-t-50"
            :class="{
              'modal-btns--double': showCancelBtn && showConfirmBtn,
              'modal-btns--single': !showCancelBtn || !showConfirmBtn
            }"
          >
            <view 
              v-if="showCancelBtn"
              class="cancel--btn" 
              @click="onCancel"
            >
              <text class="u-font-28" style="color: #2a2a2a">{{ cancelText }}</text>
            </view>
            <view 
              v-if="showConfirmBtn"
              class="confirm--btn" 
              @click="onConfirm"
            >
              <text class="u-font-28">{{ confirmText }}</text>
            </view>
          </view>
        </view>
      </view>
    </u-modal>
  </view>
</template>

<script>
import eventBus from '@/utils/eventBus.js'
export default {
  props: {
    value: {
      type: Boolean,
      default: false,
    },
    width: {
      type: String,
      default: "500rpx",
    },
    title: {
      type: String,
      default: "",
    },
    content: {
      // 弹窗内容
      type: String,
      default: "",
    },
    btnText: {
      // 按钮文案
      type: String,
      default: "确认",
    },
    type: {
      type: String,
      default: "primary",
    },
    closeOnClickOverlay: {
      type: Boolean,
      default: false,
    },
    cancelBtnText: {
      type: String,
      defualt: "",
    },
    customeContent: {
      type: Boolean,
      default: false,
    },
    confirmText: {
      type: String,
      default: '确认'
    },
    cancelText: {
      type: String,
      default: '取消'
    },
    showCancelBtn: {
      type: Boolean,
      default: true,
    },
    showConfirmBtn: {
      type: Boolean,
      default: true,
    },
    customNeedDefaultBtn: {
      type: Boolean,  
      default: false
    },
    overlayOpacity: {
      type: String|Number,
      default: 0.5
    }
  },
  data() {
    return {
    };
  },
  computed: {
    show: {
      get() {
        return this.value;
      },
      set(value) {
        // 当 show 的值发生变化时，触发 update 事件通知父组件
        this.$emit('input', value);
      }
    },
  },
  methods: {
    onConfirm() {
      this.$emit("confirm");
      this.show = false;
    },

    close() {
      this.$emit('close')
      this.show = false;
    },

    onCancel() {
      this.$emit("cancel");
      this.show = false;
    },
  },
  mounted() {
    eventBus.$on('eventCloseModal', () => {
      this.close()
    })
  }
};
</script>

<style lang="scss" scoped>
.content {
  width: 100%;
  color: #323232;
  font-size: 24rpx;
  line-height: 40rpx;
  margin-bottom: 50rpx;
}
.title {
  width: 100%;
  color: #1a1a1a;
  font-weight: 550;
  font-size: 28rpx;
  margin-bottom: 50rpx;
}
::v-deep .u-modal {
  border-radius: 16rpx;
}
::v-deep .u-button {
  width: 420rpx;
}
</style>
