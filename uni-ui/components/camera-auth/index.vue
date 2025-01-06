<template>
  <u-modal :show="show" :showConfirmButton="false" width="520rpx">
    <view class="u-flex-col">
      <view class="camera-auth--top u-flex-col u-row-center u-col-center">
        <u-icon :name="`${static_path}camera_icon.png`" size="96rpx"></u-icon>
        <text class="color-text-black u-font-bold u-font-32 u-line-h-48">相机权限未开启</text>
      </view>
      <view class="camera-auth--content u-m-y-32 color-text-less-grey u-font-28 u-line-h-44">
        无法启动相机，请前往「设置-欢乐创」打开相机权限。
      </view>
      <view class="camera-auth--bottom u-flex-row u-row-center u-col-center">
        <u-button color="#F6F6F6" class="u-m-r-28" @click="handleClose" :customStyle="{ color: '#3C3C3C', 'border-radius': '16rpx' }">我知道了</u-button>
        <u-button type="primary" @click="handleSetting" :customStyle="{ 'border-radius': '16rpx' }">前往设置</u-button>
      </view>
    </view>
  </u-modal>
</template>

<script>
import permision from "@/js_sdk/wa-permission/permission.js";
import { mapGetters } from "vuex";  
export default {
  props: {
    value: {
      type: Boolean,
      default: false
    }
  },
  components: {},
  data() {
    return {};
  },
  computed: {
    ...mapGetters(['static_path']),
    show: {
      get() {
        return this.value;
      },
      set(val) {
        this.$emit("input", val);
      }
    }
  },
  watch: {},
  methods: {
    handleSetting() {
      permision.gotoAppPermissionSetting()
      this.show = false;
    },

    handleClose() {
      this.show = false;
    }
  },
};
</script>

<style lang="scss" scoped></style>
