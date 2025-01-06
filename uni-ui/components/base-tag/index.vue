<template>
  <view class="base-tag u-flex-row u-col-center u-row-center" :class="{ 'income': type == 'income'}" :style="{ fontSize }">
    <slot name="front"></slot>
    <view v-if="showGap" class="gap-line"></view>
    <slot name="back"></slot>
  </view>
</template>

<script>
  export default {
    props: {
      showGap: {
        type: Boolean,
        default: false
      },
      type: {
        type: String,
        default: ''
      },
      fontSize: {
        type: String,
        default: '24rpx'
      }
    },
    data () {
      return {}
    },
 }
</script>

<style lang='scss' scoped>
.base-tag {
  display: grid;
  grid-auto-flow: column;
  grid-gap: 8rpx;
  border-radius: 8rpx;
	background-color: #f6f6f6;
	padding: 4rpx 16rpx;
  color: #1a1a1a;
  width: fit-content;
}
.gap-line {
  border-left: 1rpx solid #C6C6C6;
}
.income {
  border: 1rpx solid #FF7736;
  background-color: #FFF5EE;
  color: #FF7736;
}
</style>