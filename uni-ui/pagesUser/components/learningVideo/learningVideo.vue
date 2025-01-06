<template>
	<view>
		<!-- #ifndef APP -->
		<video class="widthAll heightAll u-border-radius" :src="videoUrl" :title="name" :poster="poster"
			object-fit="contain" controls></video>
		<!-- #endif -->
		<!-- #ifdef APP -->
		<text class="u-border-radius" v-html="videoSource" style="height: 400rpx;" />
		<!-- #endif -->
	</view>
</template>

<script>
	export default {
		name: "LearningVideo",
		data() {
			return {

			};
		},
		props: {
			videoUrl: {
				type: String,
			},
			poster: {
				type: String
			},
			name: {
				type: String
			}
		},
		computed: {
			videoSource() {
				return `<video src="${this.videoUrl}" poster="${this.poster}" name="${this.name}" object-fit="cover"  controls class="u-border-radius  widthAll heightAll"></video>`;
			},
		},
	}
</script>

<style lang="scss" scoped>

</style>