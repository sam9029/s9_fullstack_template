<template>
  <drag-button-follow
    :style.sync="style"
    className="drag-button"
    class="drag-button"
    drag
    follow="right"
  >
    <view class="wrapper u-bg-f">
      <view class="icon-wrapper">
        <!-- #ifdef MP-KUAISHOU -->
        <button
          id="ks-publish-btn"
          :plain="true"
          open-type="videoPublish"
          class="custom-style video-publish-style"
        >
          <u-icon
            name="https://koc-img.lizhibj.cn/applet/duolai/videoPublish.png"
            color="#685ff5"
            size="44"
          ></u-icon>
        </button>
        <!-- #endif -->
        <!-- #ifdef MP-TOUTIAO -->
        <button
          id="dy-publish-btn"
          :plain="true"
          open-type="share"
          data-channel="video"
          class="custom-style video-publish-style"
        >
          <u-icon
            name="/static/images/publishVideo-dy.png"
            color="#685ff5"
            size="44"
          ></u-icon>
        </button>
        <!-- #endif -->
      </view>
    </view>
  </drag-button-follow>
</template>

<script>
export default {
  data() {
    return {
      style: "",
    };
  },
  // #ifdef MP-TOUTIAO
  onUploadDouyinVideo: async function(uploadOptions) {
    console.log("触发");
    const videoPath = await this.chooseVideo();
    return {
      videoPath, 
      success: function (callback) {
        console.log("success:", callback);
      },
      fail: function (callback) {
        console.log("fail:", callback);
      },
      complete: function (callback) {
        console.log("complete:", callback);
      },
    };
  },
  // #endif
  methods: {
    chooseVideo() {
      return new Promise((resolve) => {
        tt.chooseVideo({
          sourceType: ["album", "camera"],
          compressed: true,
          success: (res) => {
            resolve(res.tempFilePath);
          },
          fail: (err) => {
            let errType = err.errMsg.includes("chooseVideo:fail cancel")
              ? "取消选择"
              : "选择失败";
            tt.showModal({
              title: errType,
              content: err.errMsg,
              showCancel: false,
            });
            resolve("");
          },
        });
      });
    },
  },
};
</script>

<style lang="scss" scoped>
$size: 44px;
$radius: 22px;
.drag-button {
  color: #000000;
  position: fixed;
  right: 10rpx;
  bottom: 188rpx;
  z-index: 100;
}
.wrapper {
  display: flex;
  flex-direction: row;
  border-radius: $radius;
}
.icon-wrapper {
  height: $size;
  width: $size;
  border-radius: $radius;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 2.5px 5px 0 rgba(0, 0, 0, 0);
  .custom-style {
    &::after {
      border: none;
    }
  }
}
.tip-text {
  display: flex;
  overflow: hidden;
  word-break: keep-all;
  font-size: 14px;
  line-height: $size;
  transition: width 0.5s;
}
.tip-offset {
  padding-left: 11px;
}
.tip-show {
  width: 80px;
}
.tip-hide {
  width: 0;
}

.video-publish-style {
  border: unset;
  height: unset;
  width: unset;
  flex-shrink: 0;
  background-color: transparent;
  padding: 0 0 0 0px;
  box-shadow: none;
  font-size: 14px;
  color: #685ff5;
  animation: s1 2s ease-in-out infinite;
}

@keyframes s1 {
  0%,
  100% {
    transform: scale(1, 1);
  }

  50% {
    transform: scale(1.06, 1.06);
  }
}
</style>
