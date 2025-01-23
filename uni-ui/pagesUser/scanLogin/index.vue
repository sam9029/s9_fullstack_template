<template>
	<view>
		<view class="top-area">
			<MyNavbar routerMode="switch" targetUrl="/pages/mine/mine">
				<template #navbarData>
					<view class="u-flex-row u-row-center u-col-center">
						<text class="u-text-center u-font-32 color-text-black u-font-bold">登录确认</text>
					</view>
				</template>
			</MyNavbar>
		</view>
		<view class="centered-flex">
			<u--image :src="`${static_path}icon_computer.png`" width="320rpx" height="320rpx"
				class="u-m-t-28"></u--image>
		</view>
		<view class="u-text-main u-font-32 u-line-h-48" style="text-align: center">PC端登录确认</view>
		<view class="color-text-less-grey u-font-24 u-line-h-40" style="text-align: center">请核对登录设备信息，切勿在可疑设备登录</view>
		<view class="card-bg u-m-l-28 u-m-r-28" style="margin-top: 128rpx">
			<view class="u-flex-row u-row-between">
				<view class="u-line-h-40 u-font-24 color-text-grey">设备型号</view>
				<view class="u-line-h-40 u-font-24 color-text-less-black">{{
          unitType
        }}</view>
			</view>
			<view class="u-flex-row u-row-between u-m-t-32">
				<view class="u-line-h-40 u-font-24 color-text-grey">系统版本</view>
				<view class="u-line-h-40 u-font-24 color-text-less-black">{{
          sysVersion
        }}</view>
			</view>
			<view class="u-flex-row u-row-between u-m-t-32">
				<view class="u-line-h-40 u-font-24 color-text-grey">登录地址</view>
				<view class="u-line-h-40 u-font-24 color-text-less-black">{{
          loginAddress
        }}</view>
			</view>
		</view>
		<view class="u-flex-row u-m-x-28" style="margin-top: 128rpx">
			<view class="btn-bg-white" @click="handleCancel">取消登录</view>
			<view class="btn-bg-blue" @click="handleSubmit">确认登录</view>
		</view>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import MyNavbar from "@/components/my-navbar/index.vue";
	import { sleep } from '@/utils/tools.js';
	import {
		postScanLogin,
		postScanLocation
	} from "@/api/login.js";
	import {
		mapGetters
	} from "vuex";
	export default {
		components: {
			MyNavbar,
		},
		data() {
			return {
				unitType: "",
				sysVersion: "",
				loginAddress: "",
			};
		},
		computed: {
			...mapGetters(["static_path", "scan_data"]),
		},
		methods: {
			queryScanLocation() {
				postScanLocation({
						time: this.scan_data.time,
						uuid: this.scan_data.uuid
					})
					.then((res) => {
						if (res.code == 0) {
							this.unitType = res.data.device_model;
							this.sysVersion = res.data.system_version;
							this.loginAddress = `${res.data.location}(${res.data.ip})`;
						}
					})
					.catch((err) => {
						this.toastMsg(err?.message || err, "error");
					});
			},

			toastMsg(message, type = "default") {
				this.$refs.toastRef?.show({
					type,
					message,
				});
			},

			handleSubmit() {
				postScanLogin({
						time: this.scan_data.time,
						uuid: this.scan_data.uuid,
						type: "CONFIRM"
					})
					.then(async (res) => {
						if (res.code == 0) {
							this.toastMsg(res.data.message || "扫码登陆成功", "success");
							await sleep(300);
							this.show = false;
							uni.switchTab({
								url: '/pages/mine/mine'
							})
						}
					})
					.catch((error) => {
						this.toastMsg(error?.message || error, "error");
					})
					.finally(() => {
						this.SET_SCAN_DATA({
							uuid: null,
							time: null
						})
					})
			},

			handleCancel() {
				postScanLogin({
						time: this.scan_data.time,
						uuid: this.scan_data.uuid,
						type: "CANCEL"
					})
					.then((res) => {})
					.catch((error) => {
						this.toastMsg(error?.message || error, "error");
					})
					.finally(() => {
						uni.navigateBack();
						this.SET_SCAN_DATA({
							uuid: null,
							time: null
						})
					})
			}
		},
		onLoad() {
			this.queryScanLocation();
		},
	};
</script>

<style lang="scss" scoped>
	.top-area {
		/* #ifdef APP */
		padding-top: 88rpx;
		/* #endif */
	}

	.centered-flex {
		display: flex;
		justify-content: center;
	}

	.card-bg {
		background: #ffffff;
		border-radius: 16rpx;
		padding: 32rpx;
	}

	%btn-base {
		flex: 1;
		line-height: 44rpx;
		padding-top: 24rpx;
		padding-bottom: 24rpx;
		text-align: center;
		border-radius: 16rpx;
		font-size: 28rpx;
	}

	.btn-bg-white {
		@extend %btn-base;
		background: #ffffff;
		color: $u-main-color;
	}

	.btn-bg-blue {
		margin-left: 32rpx;
		@extend %btn-base;
		background: #408cff;
		color: $u-white;
	}
</style>