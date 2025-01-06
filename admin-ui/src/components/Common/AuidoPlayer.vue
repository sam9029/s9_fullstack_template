<template>
  <div class="container size-layout">
    <audio
      :src="src"
      ref="elRef"
      preload="metadata"
      oncontextmenu="self.event.returnValue=false"
      @loadedmetadata="loadedmetadata"
    ></audio>
    <div class="controller size-layout">
      <div class="controller-top theme-color">
        <span class="play-icon">
          <i v-if="status == 1" @click.stop="playAudio" class="el-icon-video-play"></i>
          <i v-else @click.stop="pauseAudio" class="el-icon-video-pause"></i>
        </span>
        <span class="duration-span theme-color">
          {{ currentTimeStr }}/{{ durationStr }}
        </span>
      </div>
      <el-slider
        class="controller-bottom"
        v-model="currentTime"
        @change="setAudioCurrTime"
        :max="duration"
        :format-tooltip="formatSec"
      ></el-slider>
    </div>
  </div>
</template>

<script>
const PLAY_STATUS = {
  PAUSE: 1,
  PLAYING: 2,
};
export default {
  props: ['src'],
  data() {
    return {
      canplay: false,
      status: PLAY_STATUS.PAUSE,
      duration: 0,
      currentTime: 0,
      timer: null,
    };
  },
  computed: {
    durationStr() {
      return this.formatSec(this.duration);
    },
    currentTimeStr() {
      return this.formatSec(this.currentTime);
    },
  },
  watch: {
    src() {
      this.canplay = false;
      this.duration = 0;
      this.currentTime = 0;
      this.status = PLAY_STATUS.PAUSE;
      this.clearCurrTimeInterval();
    },
  },
  beforeDestroy() {
    this.clearCurrTimeInterval();
  },
  methods: {
    loadedmetadata() {
      const el = this.$refs.elRef;
      if (!el) return;
      if (isNaN(el.duration)) return;
      this.duration = el.duration;
      this.canplay = true;
    },
    clearCurrTimeInterval() {
      clearInterval(this.timer);
      this.timer = null;
    },
    setCurrTimeInterval() {
      this.clearCurrTimeInterval();
      this.timer = setInterval(this.updateCurrTime, 500);
    },
    updateCurrTime() {
      const el = this.$refs.elRef;
      if (!el) return;
      this.currentTime = el.currentTime;
    },
    playAudio() {
      if (!this.canplay) return;
      if (this.status == PLAY_STATUS.PLAYING) return;
      const el = this.$refs.elRef;
      if (!el) return;
      el.play();
      this.setCurrTimeInterval();
      this.status = PLAY_STATUS.PLAYING;
    },
    pauseAudio() {
      if (!this.canplay) return;
      if (this.status == PLAY_STATUS.PAUSE) return;
      const el = this.$refs.elRef;
      if (!el) return;
      el.pause();
      this.clearCurrTimeInterval();
      this.status = PLAY_STATUS.PAUSE;
    },
    setAudioCurrTime() {
      const el = this.$refs.elRef;
      if (!el) return;
      el.currentTime = this.currentTime;
      this.playAudio();
    },
    formatSec(secondFloat) {
      const second = Math.floor(secondFloat);
      const min = Math.floor(second / 60)
        .toString()
        .padStart(2, '0');
      const sec = (second % 60).toString().padStart(2, '0');
      return `${min}:${sec}`;
    },
  },
};
</script>


<style lang="scss" scoped>
.size-layout {
width: 160px;
  height: 90px;
}
.container {
  
}
.controller {
  position: absolute;
  left: 0;
  top: 0;
  padding: 10px;
}
.controller-top {
  display: flex;
  flex-direction: row;
  justify-content: center;
  line-height: 60px;
}
.play-icon {
  font-size: 36px;
  margin-right: 10px;
}
.duration-span {
  font-size: 16px;
}
.controller-bottom {
  margin: 5px 0 5px 5px;
}
::v-deep .el-slider__runway {
  background-color: var(--theme-light5);
  margin: 0;
}
</style>