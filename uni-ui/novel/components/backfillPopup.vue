<template>
  <view class="keyword-popup">
    <u-popup :show="show" mode="bottom" round="24rpx">
      <view class="u-p-28">
        <view class="popup-top u-flex-row u-row-between u-col-center u-m-b-32">
          <text class="u-font-32 u-line-h-48 color-text-black u-font-bold"
            >回填提交失败</text
          >
          <u-icon
            @click="close"
            :name="`${static_path}close_circle.png`"
            size="24"
          ></u-icon>
        </view>
        <view class="popup-content scroll-y">
          <view
            v-for="item in list"
            :key="item"
            class="popup-content--item u-p-y-24 u-p-x-40 color-text-black u-font-28 u-line-h-48 u-border-radius"
          >{{ item }}</view>
        </view>
      </view>
    </u-popup>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      show: false,
      list: []
    };
  },
  computed: {
    ...mapGetters(['static_path']),
  },
  methods: {
    open(list) {
      this.show = true;
      this.list = list;
    },

    close() {
      this.show = false;
      this.list = [];
      this.$emit('close')
    },
  },
};
</script>

<style lang="scss" scoped>
.popup-content {
  height: 624rpx;
  display: flex;
  flex-direction: column;
  .popup-content--item {
    background: #F6F6F6;
    height: fit-content;
    margin-bottom: 32rpx;
  }
}
</style>
