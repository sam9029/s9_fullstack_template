<template>
	<view class="invite-top u-bg-f">
		<u--image :src="`${static_path}pagesUser_guide_bg.png`" width="100%" height="492rpx"></u--image>
		<u-text size="48rpx" align="center" :text="topNotice" bold lineHeight="64rpx"></u-text>
		<view class="u-p-t-80 u-p-b-32 u-p-l-80 u-p-r-80">
			<u-button type="primary" shape="circle" :plain="false" :text="button" @click="joinNow">
			</u-button>
		</view>
		<view class="bottom-text" v-if="has_url" @click="downloadClick">
			<view class="u-flex-row u-row-center" v-show="!isLogin">
				<text class="u-font-24 color-text-primary u-m-r-8">点击下载</text>
				<text class="u-font-24 color-text-less-grey">欢乐创APP</text>
			</view>
			<view class="u-flex-row u-row-center" v-show="isLogin">
				<text class="u-font-24 color-text-less-grey u-m-r-8">如未自动开始下载请</text>
				<text class="u-font-24 color-text-primary">点此下载</text>
			</view>
		</view>
		<view v-if="has_url && showTip" class="color-text-less-grey u-font-24 u-line-h-40 u-m-t-8">
			<view class="u-m-b-8">请进入系统 设置>已下载描述文件 安装!</view>
			<view>或者进入系统 设置>通用>VPN与设备管理 安装!</view>
		</view>
		<base-toast ref="toastRef"></base-toast>
		<openCover ref="openRef"></openCover>
	</view>
</template>

<script>
	import {
		appInfo
	} from "@/api/app_info.js";
	import {
		mapGetters
	} from "vuex";
	import {
		isMiniProgramBrowser
	} from "@/utils/tools.js";
	import openCover from "../components/openCover.vue";
	export default {
		components: {
			openCover
		},
		data() {
			return {
				isLogin: false,
				topNotice: "好友邀请你加入欢乐创",
				button: "立即加入",
				share_code: null,
				download_url: null,
				has_url: false,
			};
		},
		computed: {
			...mapGetters(["static_path", "user_info",]),
		},
		methods: {
			joinNow() {
				if (this.isLogin) {
					if (!this.has_url) {
						this.toastMsg("敬请期待");
					} else {
						//跳转下载app
						this.downloadClick()
					}
				} else {
					// 跳转注册页面
					const url = `/pages/login/register?share_code=${this.share_code}&type=FROM_INVITE`;
					uni.navigateTo({
						url, // 执行页面跳转
					});
				}
			},
			async downLoadNow() {
				let type = uni.getSystemInfoSync()?.platform != "ios" ? 1 : 2;
				this.toastMsg("加载中", "loading", -1);
				await appInfo({
						type
					})
					.then((res) => {
						if (res.data?.url) {
							this.has_url = true;
							this.download_url = res.data?.url;
						}
						// console.log(res);
					})
					.catch((err) => {});
				this.$refs.toastRef?.close();
			},
			downloadClick() {
				if (isMiniProgramBrowser()) return this.$refs.openRef?.open();
				const {
					platform,
					uniPlatform
				} = uni.getSystemInfoSync();
				if (uniPlatform == 'web' && platform == 'ios') {
					this.showTip = true;
				}
				window.open(this.download_url, "_self");
			},
			toastMsg(message, type = "default") {
				this.$refs.toastRef?.show({
					type,
					message,
				});
			},
		},
		onLoad(query) {
			this.downLoadNow();
			this.isLogin = query.is_login;
			if (this.isLogin) {
				this.topNotice = "注册成功，欢迎加入欢乐创";
				this.button = "立即下载欢乐创APP";
			}
			if (query.share_code) {
				this.share_code = query.share_code;
			}
		},
	};
</script>

<style lang="scss" scoped>
	.invite-top {
		min-height: 100vh;
	}
</style>