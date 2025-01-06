<template>
  <view 
    class="search-input"
    :class="{
      'search-input--dark': theme_mode === 'dark',
      'search-input--light': theme_mode === 'light'
    }"
  >
    <view class="input-area" :class="{ 'input-area--dark': theme_mode == 'dark' }">
      <u-icon name="search" :color="theme_mode == 'dark' ? '#d0d1d6' : '#3a3c3f'" size="40rpx"></u-icon>
      <input class="u-m-l-8 u-font-32 u-line-h-32" v-model="keyword" type="text" :placeholder="placeholder">
    </view>
    <view class="action-area">
      <view v-if="showClear" class="clear u-m-r-16">
        <u-icon name="close-circle" :color="theme_mode == 'dark' ? '#d0d1d6' : '#3a3c3f'" @tap="onClear"></u-icon>
      </view>
      <view class="search-btn" @tap="onSearch" @keydown.enter.prevent="onSearch">
        <text class="u-font-14">搜索</text>
      </view>
    </view>
  </view>
</template>

<script>
import { mapGetters } from "vuex";
  export default {
    props: {
      placeholder: {
        type: String,
        defualt: '请输入搜索内容'
      },
      clearable: {
        type: Boolean,
        default: false
      }
    },
    data () {
      return {
        keyword: '',
      }
    },
    methods: {
      onSearch() {
        console.log('触发');
        this.$emit('search', this.keyword);
      },

      onClear() {
        this.keyword = '';
        this.$emit('clear')
      },
    },
    mounted() {

    },
    watch: {
      keyword(newVal) {
        this.$emit('input', newVal);
      }
    },
    computed: {
      ...mapGetters(['theme_mode']),
      showClear() {
        if(this.clearable && this.keyword) return true;
        else return false;
      }
    },
 }
</script>

<style lang='scss' scoped>
.search-input {
  width: 100%;
  height: 72rpx;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24rpx;
}
.search-input--dark {
  border: 2rpx solid rgba(255,255,255,0.2);
}
.search-input--light {
  border: 2rpx solid rgb(234,234,234);
}
.search-btn {
  width: 104rpx;
  height: 48rpx;
  border-radius: 100px;
  background-color: #564CFF;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  &:hover {
    background-color: #554cffac;
  }
}
.input-area,.action-area {
  display: flex;
  align-items: center;
}
.input-area input{
  color: #6a6a6a;
}
.input-area--dark input{
  color: rgba(255,255,255,0.45)
}
</style>