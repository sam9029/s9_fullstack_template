<template>
	<view class="web-view">
		<web-view :web-view="webviewStyle" :src="link"></web-view>
	</view>
</template>

<script>
import { mapGetters } from "vuex";
export default {
  data() {
    return {
      link: '',
      webviewStyle: {
        progress: {
          color: '#4478FF'
        }
      }
    }
  },
  computed: {
    ...mapGetters(["theme_color"]),
  },
  onLoad(options) {
    this.webviewStyle.progress.color = this.theme_color;
    this.link = options?.url || 'https://joyful.tuixiaoguo.com/api'
  }
}
</script>