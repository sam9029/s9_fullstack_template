<template>
  <view class="promote-popup">
    <u-popup :show="show" mode="bottom" round="24rpx">
      <view class="u-p-28">
        <view class="popup-top u-flex-row u-row-between u-col-center u-m-b-32">
          <text class="u-font-32 u-line-h-48 color-text-black u-font-bold"
            >推广说明</text
          >
          <u-icon
            @click="close"
            :name="`${static_path}close_circle_grey.png`"
            size="24"
          ></u-icon>
        </view>
        <view class="popup-content">
          <u-parse :content="describe" :selectable="true"></u-parse>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
import {  getAdverDesc } from "../api/keyword.js";
export default {
  props: {
    id: {
      type: [String, Number],
    }
  },
  data() {
    return {
      show: false,
      list: [],
      describe: ''
    };
  },
  computed: {
    ...mapGetters(['static_path']),
  },
  methods: {
    open() {
      this.$emit("open")
      this.show = true;
      getAdverDesc({ id: this.id })
        .then(res => {
          if(res.code == 0) {
            this.describe = res.data.describe
          }
        })
        .catch(error => {
          this.toastMsg(error.message || error, "error");
        })
    },

    close() {
      this.show = false;
      this.$emit("close")
    },
  },
};
</script>

<style lang="scss" scoped>
.popup-content {
  border: 2rpx solid #eee;
  border-radius: 16rpx;
  padding: 24rpx;
  height: 716rpx;
  overflow-y: auto;
}
</style>
