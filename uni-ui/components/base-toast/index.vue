<template>
	<view class="base-toast u-relative">
		<u-overlay :show="isShow" :custom-style="overlayStyle">
			<view class="base-toast--content u-flex-row u-col-center u-row-center u-p-16">
				<u-loading-icon v-if="type === 'loading'" color="rgb(255, 255, 255)" vertical
					inactiveColor="rgb(120, 120, 120)" size="20"></u-loading-icon>
				<u-icon v-else-if="type !== 'defalut' && iconName" :name="iconName" size="20"></u-icon>
				<text class="base-toast--content--text color-text-white u-font-28 u-m-l-8 u-relative"
					:class="['base-toast--content--text--' + type]" style="max-width: 400rpx">{{ message }}</text>
			</view>
		</u-overlay>
	</view>
</template>

<script>
	import {
		sleep
	} from '@/utils/tools.js';
	import {
		mapGetters
	} from "vuex";
	export default {
		name: "base-toast",
		props: {},
		data() {
			return {
				isShow: false,
				timer: null, // 定时器
				type: "default",
				icon: "",
				message: "",
				duration: 2000,
			};
		},
		computed: {
			...mapGetters(['static_path']),
			overlayStyle() {
				const style = {
					justifyContent: "center",
					alignItems: "center",
					display: "flex",
				};
				// 将遮罩设置为100%透明度，避免出现灰色背景
				style.backgroundColor = "rgba(0, 0, 0, 0)";
				return style;
			},
			iconName() {
				if (this.type === "success") {
					return `${this.static_path}toast_success.png`;
				} else if (this.type === "error") {
					return `${this.static_path}toast_error.png`;
				} else {
					return "";
				}
			},
		},
		methods: {
			// 显示toast组件，由父组件通过this.$refs.xxx.show(options)形式调用
			show(options) {
				// 清除定时器
				this.clearTimer();
				this.isShow = true;
				this.type = options.type || "default";
				this.message = options.message || "";
				// 当 duration 为 -1 时，toast 将持续显示直到手动关闭
				if (options.duration !== -1) {
					this.timer = setTimeout(() => {
						// 倒计时结束，清除定时器，隐藏toast组件
						this.clearTimer();
					}, options.duration || this.duration);
				}
			},
			// 隐藏toast组件，由父组件通过this.$refs.xxx.hide()形式调用
			hide() {
				this.clearTimer();
			},
			clearTimer() {
				this.isShow = false;
				// 清除定时器
				clearTimeout(this.timer);
				this.timer = null;
			},
			// 关闭toast组件
			async close() {
				await sleep(500);
				this.isShow = false;
				this.clearTimer();
			},
		},
		beforeDestroy() {
			this.clearTimer();
		},
	};
</script>

<style lang="scss" scoped>
	.base-toast {
		z-index: 999999;

		&--content {
			background-color: rgba(0, 0, 0, 0.6);
			border-radius: 16rpx;
		}

		text {
			top: -2rpx;
		}
	}
</style>