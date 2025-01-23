<template>
	<view class="mine-page">
		<view class="tab-area u-flex-row u-col-center u-row-right">
			<u-icon v-show="has_login" :name="`${static_path}mine_message_icon.png`" color="#2c2c2c" size="24"
				@click="goMessage"></u-icon>
			<!-- #ifdef APP -->
			<u-icon v-show="has_login" :name="`${static_path}mine_scan_icon.png`" class="u-m-l-32" size="24"
				@click="goScan"></u-icon>
			<!-- #endif -->
		</view>
		<view class="login-area u-m-t-44 u-m-b-48 u-flex-row u-row-between u-col-center">
			<view class="u-flex-row u-col-center u-m-r-32">
				<view class="avatar-box u-m-r-32" @click="goLogin">
					<u-avatar :src="userInfo.avatar || `${static_path}no_avatar.png`" shape="circle"
						size="60"></u-avatar>
				</view>
				<view @click="goLogin" v-show="!has_login" class="info-box u-flex-col u-row-center u-m-r-32">
					<text class="u-font-32 u-font-bold">登录/注册</text>
					<text class="u-font-24 color-text-less-grey">
						你还未登录，登录后查看更多内容
					</text>
				</view>
				<view v-show="has_login" class="info-box u-flex-col u-row-center">
					<view class="u-flex-row u-col-center u-m-b-16">
						<view class="u-font-32 u-line-h-48 u-font-bold">{{
              userInfo.name
            }}</view>
						<view v-if="account_type == 2" class="tag u-m-l-16">
							<u--image :src="`${static_path}tougu_icon.png`" width="12" height="12"></u--image>
							<text class="u-font-20 u-line-h-36 color-text-primary u-font-weight u-m-l-8">投顾</text>
						</view>
						<view v-if="account_type == 1" class="tag u-m-l-16">
							<u--image :src="`${static_path}daren_icon.png`" width="12" height="12"></u--image>
							<text class="u-font-20 u-line-h-36 color-text-primary u-font-weight u-m-l-8">达人</text>
						</view>
					</view>
					<view class="u-font-24 color-text-less-grey u-flex-row u-col-center">
						<u--image :src="`${static_path}id_icon.png`" width="16" height="16"></u--image>
						<text class="u-m-x-8 u-lin-h-40">{{ userInfo.id }}</text>
						<u--image :src="`${static_path}copy_icon.png`" width="14" height="14"
							@click="onCopy(userInfo.id)"></u--image>
					</view>
				</view>
			</view>
			<u-icon size="24" color="#2c2c2c" :name="has_login ? `${static_path}edit_icon.png` : `arrow-right`"
				@click="goLogin"></u-icon>
		</view>
		<view class="auth-area u-p-t-16 u-p-b-16 u-p-l-32 u-p-r-32 u-m-b-28 u-flex-row u-row-between u-col-center"
			:style="{
			background: `url(${static_path}creater_bg.png)`,
			backgroundSize: '100% 100%',
			backgroundPosition: 'center',
			backgroundRepeat: 'no-repeat'
      }">
			<view class="auth-area--left u-flex-col u-row-center">
				<u--image :src="`${static_path}creater_icon.png`" class="u-m-r-8" width="227" height="24"></u--image>
				<text class="u-font-20 u-line-h-32" style="color: #92a2b2">认证创作者享受专属权益</text>
			</view>
			<view class="auth-area--right u-p-l-24 u-p-r-24 u-p-t-8 u-p-b-8 u-flex-col u-row-center"
				style="background: #d1e3ff; border-radius: 100rpx" @click="gotoRealname">
				<text class="u-font-24 u-lin-h-40 u-font-bold" style="color: #161b1f;">{{entryStatusText}}</text>
			</view>
		</view>
		<view class="function-btns u-m-b-28">
			<view
				class="function-btns--income u-border-primary u-bg-f u-flex-col u-col-center u-row-center u-p-l-32 u-p-r-32 u-p-t-16 u-p-b-16"
				@click="jumpBtn('income')">
				<u--image class="u-m-b-8" :src="`${static_path}my_income_icon.png`" width="40" height="40"></u--image>
				<text class="u-font-24 u-line-h-40" style="color: #3c3c3c">我的收益</text>
			</view>
			<view
				class="function-btns--account u-border-primary u-bg-f u-flex-col u-col-center u-row-center u-p-l-32 u-p-r-32 u-p-t-16 u-p-b-16"
				@click="jumpBtn('account')">
				<u--image class="u-m-b-8" :src="`${static_path}my_account_icon.png`" width="40" height="40"></u--image>
				<text class="u-font-24 u-line-h-40" style="color: #3c3c3c">媒体账号</text>
			</view>
			<view
				class="function-btns--study u-border-primary u-bg-f u-flex-col u-col-center u-row-center u-p-l-32 u-p-r-32 u-p-t-16 u-p-b-16"
				@click="jumpBtn('study')">
				<u--image class="u-m-b-8" :src="`${static_path}learn_center_icon.png`" width="40"
					height="40"></u--image>
				<text class="u-font-24 u-line-h-40" style="color: #3c3c3c">学习中心</text>
			</view>
		</view>
		<view class="menu-area u-border-primary u-bg-f u-p-32">
			<view v-for="(item, index) in menuItems" :key="index"
				class="menu-area--item u-flex-row u-col-center u-row-between"
				:class="{ 'u-border-custom-bottom': index !== menuItems.length - 1 }" :style="{
          'padding-top': index === 0 ? '0' : '32rpx',
          'padding-bottom': index === menuItems.length - 1 ? '0' : '32rpx',
        }" @click="clickMenu(item)">
				<view class="u-flex-row u-col-center">
					<u--image class="u-m-r-16" :src="item.icon" width="20" height="20"></u--image>
					<text class="u-font-28 u-line-h-44" style="color: #2c2c2c">{{
            item.text
          }}</text>
				</view>
				<u-icon name="arrow-right" color="#2c2c2c"></u-icon>
			</view>
		</view>
		<CameraAuth v-model="showCameraAuth" />
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import {
		copy
	} from "@/utils/tools.js";
	import {
		mapGetters
	} from "vuex";
	import permision from "@/js_sdk/wa-permission/permission.js";
	import CameraAuth from "@/components/camera-auth/index.vue";
	import AfterScan from "@/components/after-scan/index.vue";
	/** 接口 */
	import { getUserEntryStatus } from "../../pagesUser/api/auth";
	export default {
		components: {
			CameraAuth,
			AfterScan,
		},
		data() {
			return {
				showCameraAuth: false,
				entryStatus: null
			};
		},
		computed: {
			...mapGetters([
				"account_type",
				"userInfo",
				"has_login",
				"static_path",
				"theme_color",
			]),
			entryStatusText(){
				if (this.entryStatus) {
					if (this.entryStatus === "VERIFY" ||
					this.entryStatus === "REJECT" ||
					this.entryStatus === "WAIT_REALNAME") {
						return "认证中"
					} else if (this.entryStatus === "ENTRIED") {
						return "已认证"
					}
				}
				return "去认证";
			},
			menuItems() {
				let back = [{
						id: 2,
						icon: `${this.static_path}cashout_icon.png`,
						text: "提现账户",
					},
					{
						id: 3,
						icon: `${this.static_path}connect_icon.png`,
						text: "联系客服",
					},
					{
						id: 4,
						icon: `${this.static_path}feedback_icon.png`,
						text: "意见反馈",
					},
					{
						id: 5,
						icon: `${this.static_path}setting_icon.png`,
						text: "更多设置",
					},
				];
				if (this.account_type != 1)
					back.unshift({
						id: 1,
						icon: `${this.static_path}invite_icon.png`,
						text: "邀请好友",
					});
				return back;
			},
		},
		methods: {
			onCopy(str) {
				copy({
						content: str,
					},
					this
				);
			},
			jumpBtn(type) {
				if (!this.has_login) {
					return this.goLogin();
				}
				let url = "";
				switch (type) {
					case "income":
						return uni.switchTab({
							url: "/pages/income/income",
						});
					case "account":
						url = "/pagesUser/account/index";
						break;
					case "study":
						url = "/pagesUser/learningCenter/index";
						break;
				}
				uni.navigateTo({
					url,
				});
			},

			goMessage() {
				uni.navigateTo({
					url: "/pagesUser/message/index",
				});
			},
			goIOSScan() {
				if (permision.judgeIosPermission("camera")) {
					uni.navigateTo({
						url: "/pagesUser/setting/scan",
					});
				} else {
					this.toastMsg("拒绝授权无法使用该功能，请开启权限后重试");
				}
			},
			async goAndScan() {
				const res = await permision.requestAndroidPermission(
					"android.permission.CAMERA"
				);
				if (res == 1) {
					uni.navigateTo({
						url: "/pagesUser/setting/scan",
					});
				} else {
					this.toastMsg("拒绝授权无法使用该功能，请开启权限后重试");
				}
			},
			goScan() {
				const {
					platform,
					uniPlatform
				} = uni.getSystemInfoSync();
				if (uniPlatform === "app") {
					if (platform === "ios") {
						this.goIOSScan();
					} else {
						this.goAndScan();
					}
				}
			},
			gotoRealname() {
				if (!this.has_login) {
					return this.goLogin();
				}
				uni.navigateTo({
					url: "/pagesUser/auth/home",
				});
			},

			goLogin() {
				if (this.has_login) {
					uni.navigateTo({
						url: "/pagesUser/setting/userInfo",
					});
				} else {
					uni.navigateTo({
						url: "/pages/login/login",
					});
				}
			},

			clickMenu(item) {
				if (!this.has_login) {
					this.goLogin();
				} else {
					switch (item.id) {
						case 1:
							uni.navigateTo({
								url: "/pagesUser/invite/index",
							});
							break;
						case 2:
							uni.navigateTo({
								url: "/pagesUser/cashOut/index",
							});
							break;
						case 4:
							uni.navigateTo({
								url: "/pagesUser/feedback/index",
							});
							break;
						case 5:
							uni.navigateTo({
								url: "/pagesUser/setting/index",
							});
							break;
					}
				}
			},

			async queryUserEntryStatus() {
				if (!this.has_login) {
					this.entryStatus = null;
					return;
				}

				try {
					const res = await getUserEntryStatus();
					if (res && res.code == 0) {
						this.entryStatus = res.data.entry_status;
					} else {
						this.entryStatus = null;
					}
				} catch (error) {
					this.entryStatus = null;
					const message = error?.message || error || "获取认证状态失败";
					this.toastMsg(message, 'error');
				}
			},


			toastMsg(message, type = "default", duration = 2000) {
				this.$refs.toastRef?.show({
					type,
					message,
					duration
				});
			},
		},
		onShow() {
			this.queryUserEntryStatus();
		}
	};
</script>

<style lang="scss" scoped>
	.mine-page {
		min-height: 100vh;
		background: linear-gradient(to bottom, #d3edff, #f6f7fb 25%);
		padding-top: 100rpx;
		padding: 0 28rpx;

		.tab-area {
			padding: 16rpx 0;
			/* #ifdef APP */
			padding-top: 88rpx;
			/* #endif */
		}

		.login-area {
			.avatar-box {
				border: 2rpx solid #ffffff;
				border-radius: 50%;
			}
		}

		.tag {
			display: flex;
			align-items: center;
			justify-content: center;
			border: 1rpx solid $u-primary;
			background: $u-primary-neutral-5;
			padding: 0 12rpx;
			border-radius: 100rpx;
		}

		.auth-area {
			height: 112rpx;
			border-radius: 24rpx;
		}

		.function-btns {
			display: grid;
			grid-template-columns: repeat(3, 1fr);
			grid-gap: 16rpx;

			&--income,
			&--account,
			&--study {
				border-radius: 32rpx;
			}
		}

		.menu-area {
			border-radius: 32rpx;
		}
	}
</style>