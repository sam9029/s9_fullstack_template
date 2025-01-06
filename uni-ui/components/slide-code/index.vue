<template>
  <view class="yzm_body">
    <view class="zhuti">
      <!-- <view :class="['msg', msgColor]">{{ msg }}</view> -->
      <view class="title">拖动滑块完成拼图</view>
      <movable-area>
        <view id="msg" class="msg-view" v-if="zhutuPic === ''">{{
          msgText
        }}</view>
        <view
          id="pic"
          class="pic"
          v-else
          :style="{ 'background-image': 'url(' + zhutuPic + ')' }"
        ></view>
        <view id="line" class="line"></view>
        <movable-view
          :style="{ 'background-image': 'url(' + futuPic + ')', 'top': 0 + 'px', 'left': 0 + 'px', }"
          :x="x"
          :damping="100"
          direction="horizontal"
          @change="onChange"
          @touchend="touchEnd"
        >
          <view class="blue"></view>
        </movable-view>
      </movable-area>
      <view class="close iconfont icon-guanbi1" @click="$emit('close')"></view>
    </view>
  </view>
</template>
<script>
import { getSlideCode } from "@/api/account.js";
export default {
  data() {
    return {
      zhutuPic: "", //主图
      futuPic: "", //缺口图
      x: 5, //当前的位置
      msg: "安全验证", //提示信息
      msgColor: "",
      msgText: "加载中",
      new_x: 5,
      huadong: false, //是否已经滑动
      times: 0, //滑动测试次数
    };
  },
  mounted() {
    //该组件被挂载到实例上去之后调用
    this.shuaxin();
  },
  methods: {
    shuaxin() {
      this.new_x = 5;
      this.x = 5;
      this.times = 0;
      getSlideCode()
        .then(({ data }) => {
          this.zhutuPic = data.background;
          this.futuPic = data.front;
        })
        .catch((err) => {});
    },
    onChange(e) {
      //拖动过程中触发、
      if (e.detail.source === "touch") {
        //只有是手动触发的，才执行
        this.huadong = true;
        this.new_x = e.detail.x;
      }
    },
    retry() {
      if (this.times > 2) return this.shuaxin();
      this.new_x = 5;
      this.x = 5;
    },
    touchEnd() {
      //手指离开了
      if (this.huadong === true) {
        this.x = this.new_x;
        let slide = parseInt(this.new_x * (679 / uni.upx2px(550)));
        this.$emit("slide_end", slide);
        this.times++;
      }
    },
  },
};
</script>
<style lang="scss">
@font-face {
  font-family: "iconfont"; /* Project id 2455983 */
  src: url("data:application/x-font-woff2;charset=utf-8;base64,d09GMgABAAAAAALEAAsAAAAABngAAAJ5AAEAAAAAAAAAAAAAAAAAAAAAAAAAAAAAHFQGYACCcApweQE2AiQDCAsGAAQgBYRnBzEbtgUR1ZMhZH8r7lgI/uPREFlgoVBNm5PkuTjzBokvYm9bLZ7Q8ql1k55Aj4zHA0PJeeB/P9x9MjPtolU0rW5JQ58nSAudRqXRCFGs4ZnI+eCEm0caBUARHIiSJ0Je/uBN7D5M8JMncnEcb597Vhpwgr8zfqrALG7aKReheBK7c9X1PWkpfRCyJ+xa5EeKSpKryiT9ZEEApKX5fpaTvxt1KX8DeuAFkS/0PYVK65ROBxbA6AOlV0sohJmgx6MguyNQSw7DMwIqzVsWN3eXu6g9l5xFp8wZDuT14dw7KcrliCzTfLmgFN2bhZdKiE/xxIv48+FvAqKSxGnaPdsa8bZnd0ECRaUvXa6DPhZRgoRpZMJhf2ZbEtr4pNKTDdLWLPBD8aFbOLRD+Ouc2mrQTcVnknz5UWsjyOloL0YmjSXW1/YPW4yJ8wNQ0CBGoTk8cxF1ZFyBX8NkS3/87kgP5pT/K75uD9c2/dWjVVAsXYoFBF57v7LKf5TB1zsOFctgPsp36An8HfUEJGYzRszXKBEQVWlSKqLSjVPgBBp9m2o03UUhKNd0L74yXTmScoNU5iZRosoiSpVbQqUpW4erNLmWhFyBUTcEQb1XiGq9QVLvHZW59yjR6idK1fuPSsfBOK/KaBD0mlAyGlA/8Lpk6+kc272ie0VJTckn0uJpHNqqqeb3mJHm2LC8XcdswVJJsBMfwxgLTFRG1FwNzFNf17btLZUuSawJJaMB9QOvS7Yhmcvfd0X3ipJA6pmhxVP70FYNQO2VDPU8yCvL23XMFiyVBDt5FsZYYGqfNaLmapiQmvraJVlUqbbX0t8TBnDMuHKnJpJ7yax8KwQA")
    format("woff2");
}
.iconfont {
  font-family: "iconfont" !important;
  font-size: 16px;
  font-style: normal;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
.icon-guanbi1:before {
  content: "\e696";
}
.yzm_body {
  background: rgba(0, 0, 0, 0.3);
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 999;
  width: 750rpx;
  height: 100vh;
  overflow: hidden;
  .zhuti {
    background: #fff;
    width: 600rpx;
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    padding: 20rpx 25rpx 30rpx 25rpx;
    border-radius: 15rpx;
    .msg {
      color: #999;
      font-size: 24rpx;
      &.red {
        color: red;
      }
      &.green {
        color: green;
      }
    }
    .close {
      position: absolute;
      top: 15rpx;
      right: 15rpx;
      color: #a6a6a6;
      font-size: 32rpx;
      padding: 10rpx;
    }
    .title {
      font-size: 26rpx;
      line-height: 38rpx;
      color: #666666;
      margin: 0 0 7rpx 0;
      text-align: center;
    }
    movable-area {
      width: 100%;
      height: auto;
      .msg-view {
        width: 100%;
        line-height: 310rpx;
        text-align: center;
        font-size: 30rpx;
        color: #999;
        background: #f8f8f8;
      }
      .pic {
        width: 100%;
        height: 310rpx;
        background-color: #f8f8f8;
        background-size: 100% 310rpx;
      }
      .line {
        background: #e4e4e4;
        width: 100%;
        height: 20rpx;
        margin: 42rpx 0 15rpx 0;
        border-radius: 50rpx;
        display: inline-block;
      }
      movable-view {
        width: 72rpx;
        height: 310rpx;
        background-size: 100% 310rpx;
        .blue {
          box-shadow: rgba(26, 101, 255, 0.52) 0px 0px 10px 1px;
          width: 100rpx;
          height: 50rpx;
          border-radius: 50rpx;
          position: absolute;
          top: 100%;
          left: 0;
          background: rgb(26, 101, 255)
            url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACgAAAAcAgMAAABuexVFAAAACVBMVEUAAADCwsL9/f1P0DqbAAAAAXRSTlMAQObYZgAAAB1JREFUGNNjCGVgYGANABKhyMwoEHMBkIgaZWIwAdyJJQnaJRg5AAAAAElFTkSuQmCC)
            no-repeat;
          background-size: auto 20rpx;
          background-position: 50% 50%;
          margin: 25rpx 0 0 -14rpx;
        }
      }
    }
  }
}
</style>