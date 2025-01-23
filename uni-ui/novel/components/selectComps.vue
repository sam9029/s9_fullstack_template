<template>
  <view class="select-comps u-relative widthAll">
    <template v-if="view">
      <u-input
        v-model="modelValue"
        placeholder="暂无博主账号"
        disabled
      >
        <u-icon slot="suffix" name="arrow-down" size="32rpx" color="#989898"></u-icon>
      </u-input>
    </template>
    <template v-else>
      <u-input
        v-model="item.inputValue"
        :placeholder="`请选择${item.label}`"
        disabled
      >
        <u-icon slot="suffix" name="arrow-down" size="32rpx" color="#989898"></u-icon>
      </u-input>
      <u-picker
        v-if="needPicker"
        :show="show"
        ref="uPickerRef"
        round="16rpx"
        keyName="label"
        :showToolbar="false"
        :columns="columns"
        @change="changeHandler"
      >
        <template #header>
          <view class="u-p-28 u-flex-row u-col-center u-row-between u-m-b-32">
            <text class="color-text-black u-font-32 u-line-h-48">{{
              `请选择${item.label}`
            }}</text>
            <u-icon
              :name="`${static_path}close_circle_grey.png`"
              size="64rpx"
              @click="handleCancel"
            ></u-icon>
          </view>
        </template>
        <template #footer>
          <view class="bottom-btns u-m-t-64">
            <view
              class="u-flex-row u-row-center u-col-center cancel-btn"
              style="
                width: 346rpx;
                height: 108rpx;
              "
              @click="handleCancel"
            >
              <text class="u-font-28 color-text-less-grey" 
              >取消</text>
            </view>
            <view
              class="u-flex-row u-row-center u-col-center"
              style="height: 108rpx"
              @click="handleSubmit"
            >
              <text class="u-font-28 color-text-primary" 
              >确定</text>
            </view>
          </view>
        </template>
      </u-picker>
    </template>
    <view class="picker-overlay" @click="openSelect" />
  </view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  props: {
    value: {
      type: [String, Number],
      default: "",
    },
    item: {
      type: Object,
      default: () => ({}),
    },
    columns: {
      type: Array,
      default: () => [],
    },
    needPicker: {
      type: Boolean,
      default: true
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    view: {
      type: Boolean,
      default: false,
    }
  },
  data() {
    return {
      show: false,
      selected: null,
    };
  },
  computed: {
    ...mapGetters(["static_path"]),
    modelValue: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      }
    }
  },
  methods: {
    openSelect() {
      if(!this.disabled) {
        this.show = true;
        this.$emit('open')
      }
    },

    handleSubmit() {
      if(!this.selected) {
        this.$emit("submit", this.columns[0][0])
      } else {
        this.$emit("submit", this.selected[0])
      }
      this.show = false;
    },

    changeHandler(obj) {
      this.selected = obj.value
    },

    handleCancel() {
      this.show = false;
    },
  },
};
</script>

<style lang="scss" scoped>
.bottom-btns {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  justify-items: center;
  align-items: center;
}
.picker-overlay {
  position: absolute;
  width: 100%;
  height: 88rpx;
  background: transparent;
  top: 0;
  left: 0;
}
.cancel-btn {
  position: relative;
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: 0;
    width: 1rpx;
    height: 32rpx;
    background: #eee;
    transform: translateY(-50%);
  }
}
::v-deep .u-input {
  width: 100%;
  border-radius: 16rpx;
  height: 88rpx;
  background-color: #f6f6f6 !important;
  border: none;
  padding: 24rpx 32rpx !important;
}
</style>
