<template>
  <VueDragResize
    :isActive="true"
    :w="350"
    :h="180"
    :x="clientX"
    :y="40"
    :parentW="screenW"
    :parentH="screenH"
    :isResizable="false"
    v-on:resizing="resize"
    v-on:dragging="resize"
    dragHandle=".click-drag"
    dragCancel=".video-player"
    :parentLimitation="true"
    v-if="opend"
  >
    <!-- @dragstart="dragstart"
    @dragend="dragend" -->
    <!-- :style="{ top: top + 'px', right: right + 'px' }" -->

    <!-- <el-tooltip class="item" effect="dark" content="" placement="top"> -->
    <div style="width: 350px">
      <div class="click-drag el-icon-rank" title="按住此按钮可拖动"></div>
      <div class="video-player">
        <video
          v-if="opend"
          oncontextmenu="self.event.returnValue=false"
          id="video_player"
          width="320"
          height="180"
          :src="video_src"
          controls
          autoplay
          controlsList="nodownload"
        ></video>
        <i class="el-icon-circle-close play-close" @click="close"></i>
      </div>
    </div>
  </VueDragResize>
</template>

<script>
import VueDragResize from 'vue-drag-resize';
// Vue.component('vue-drag-resize', VueDragResize)
export default {
  components: { VueDragResize },
  data() {
    return {
      top: 40,
      right: 40,
      width: 0,
      height: 0,
      opend: false,
      video_src: '',
      clientX: 0,
      clientY: 0,
      screenW: 0,
      screenH: 0,
    };
  },
  methods: {
    resize(newRect) {
      this.width = newRect.width;
      this.height = newRect.height;
      this.top = newRect.top;
      this.left = newRect.left;
    },
    dragstop(val) {
      //console.log(val);
    },
    dragstart(val) {
      // this.X = val.clientX;
      // this.Y = val.clientY;
      //console.log(val)
    },
    dragend(val) {
      //console.log(val)
      //
      // let offsetX = val.clientX - this.X;
      // let offsetY = val.clientY - this.Y;
      // //console.log(offsetX, offsetY);
      // this.right = this.right - offsetX;
      // this.top = this.top + offsetY;
    },
    getwindowInfo() {
      let { innerHeight, innerWidth } = window;
      this.screenW = innerWidth - 20;
      this.screenH = innerHeight - 20;
      this.clientX = innerWidth - 400 >= 0 ? innerWidth - 400 : 30;
      this.clientY = innerHeight - 200 >= 0 ? innerHeight - 200 : 30;
      // console.log(this.clientX, this.clientY);
    },
    open(url) {
      this.getwindowInfo();
      this.opend = true;
      this.video_src = url;
      this.$nextTick(() => {
        let video_player = document.getElementById('video_player');
        //console.log(video_player);
      });
    },
    close(url) {
      this.opend = false;
      this.video_src = '';
    },
  },
  created() {},
};
</script>

<style lang="scss" scoped>
::v-deep.vdr.active:before {
  outline: unset !important;
}
.click-drag {
  width: 30px;
  height: 30px;
  border-top-left-radius: 20px;
  border-bottom-left-radius: 20px;
  color: #fff;
  // position: absolute;
  display: inline-block;
  vertical-align: top;
  cursor: pointer;
  top: 0;
  left: -30px;
  text-align: center;
  line-height: 30px;
  font-size: 24px;
  // font-weight: bold;
  background-color: rgb(127, 125, 125);
  &:active {
    background-color: var(--theme-light4);
  }
}
.video-player {
  display: inline-block;
  > video {
    border-radius: 4px;
    border-top-left-radius: 0;
  }
  position: relative;
  z-index: 2005;
  width: 320px;
  height: 180px;
  overflow: hidden;
  background-color: #ddd;
  border-radius: 4px;
  border-top-left-radius: 0;
  transition: all 0.3s;
  .play-close {
    position: absolute;
    right: 10px;
    top: 10px;
    font-size: 25px;
    color: #fff;
    cursor: pointer;
    &:hover {
      color: #ff4a59;
    }
  }
}
</style>
