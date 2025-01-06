<template>

	<view>
		<u-popup :show="showPopup" @close="close" mode="bottom" round="24rpx">
			<view class="popup-content u-flex-row" v-if="qrcode.length">
				<view class="popup-content-item">
					<view class="popup-content-item-box u-p-t-40">
						<view class="u-p-12" style="background:#FFFFFF; border-radius: 16rpx;">
							<QrCode :qrValue="qrcode" :size="176" sizeUnit="rpx" :options="qrOptions"
								@complete="qrcodeComplete"></QrCode>
						</view>
						<text class="popup-content-title u-font-26 color-text-black u-font-weight">扫码推广任务</text>
						<text class="popup-content-content u-font-24 color-text-black u-font-weight">保存二维码进行推广</text>
					</view>
					<view class="popup-content-item-qrbtn u-font-weight" @click="saveImage">保存推广码</view>
				</view>
				<!-- #ifdef APP||MP-->
				<view class="popup-content-item u-m-l-48" v-if="scheme.length">
					<view class="popup-content-item-box u-p-t-40">
						<u-image width="200rpx" height="200rpx" :src="platformImg"></u-image>
						<text
							class="popup-content-title u-font-26 color-text-black u-font-weight">{{platformTitle}}</text>
						<text
							class="popup-content-content u-font-24 color-text-black u-font-weight">{{platformContent}}</text>

					</view>
					<view class="popup-content-item-taskbtn u-font-weight" @click="openAppScheme">
						直接推广</view>
				</view>
				<!-- #endif -->
			</view>
		</u-popup>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import {
		mapGetters
	} from "vuex";
	import QrCode from "@/pagesUser/components/koc-qrcode/index.vue";
	import permision from "@/js_sdk/wa-permission/permission.js";
	export default {
		name: "promotion-task-popup",
		props: {
			qrcode: {
				/* 二维码地址 */
				type: String,
				require: true,
				default: ""
			},
			scheme: {
				/* 跳转抖音或快手scheme地址 */
				type: String,
				require: true,
				default: ""
			},
			platformType: {
				/* 推广平台类型， 1：抖音  其他：快手 */
				type: Number,
				require: true,
				default: 1,
			}
		},
		components: {
			QrCode,
		},
		data() {
			return {
				local_qr_link: '',
				showPopup: false,
				qrOptions: {
					errorCorrectLevel: 'L',
				},
			};
		},
		computed: {
			...mapGetters(['static_path']),

			showTaskItem() {
				return this.platform == 'app-plus' && this.scheme.length > 0
			},
			platformImg() {
				return this.platformType == 1 ? `${this.static_path}task_dy_promotion.png` :
					`${this.static_path}task_ks_promotion.png`
			},
			platformTitle() {
				return this.platformType == 1 ? "打开抖音推广" : "打开快手推广"
			},
			platformContent() {
				return this.platformType == 1 ? "本机抖音号直接推广任务" : "本机快手号直接推广任务"
			},
		},
		methods: {
			toastMsg(message, type = "default", duration = 2000) {
				this.$refs.toastRef?.show({
					type,
					message,
					duration,
				});
			},
			openPopup() {
				this.showPopup = true;
				console.log(this.qrcode)
				console.log(this.scheme)
			},
			close() {
				this.showPopup = false;
			},
			async saveImage() {
				const {
					platform,
					uniPlatform
				} = uni.getSystemInfoSync();
				if (uniPlatform === 'app') {
					if (platform === "ios") {
						permision.judgeIosPermission("photoLibrary")
					} else {
						const res = await permision.requestAndroidPermission(
							"android.permission.WRITE_EXTERNAL_STORAGE");
						if (res != 1) {
							this.toastMsg("拒绝授权无法使用该功能，请开启权限后重试")
							return
						}
					}
				}
				// #ifdef H5
				const link = document.createElement("a"); // 创建下载链接
				link.href = this.local_qr_link; // 设置链接地址为生成的图片路径
				link.download = "qrcode.png"; // 设置下载文件名
				document.body.appendChild(link); // 将链接加入到文档中
				link.click(); // 触发下载
				document.body.removeChild(link); // 下载后移除链接
				// #endif
				// #ifdef APP||MP
				uni.saveImageToPhotosAlbum({
					filePath: this.local_qr_link,
					success: () => {
						this.toastMsg("图片保存成功", "success")
					},
					fail: (err) => {
						console.error('保存失败', err);
						this.toastMsg("保存失败，请检查权限", "error")
						// 引导用户开启权限
						uni.openSetting();
					},
				});
				// #endif

			},

			qrcodeComplete(res) {
				this.local_qr_link = res;
			},

			openAppScheme() {


				// #ifdef APP-PLUS
				plus.runtime.openURL(this.scheme, function(error) {
					this.toastMsg("无法打开目标App", "error")
				});
				// #endif
				// #ifdef H5
				window.open(this.scheme);
				// #endif
				// #ifdef MP
				uni.setClipboardData({
					data: this.scheme,
					success: () => {
						uni.hideToast();
						this.$nextTick(() => {
							uni.$u.toast("链接已复制，请在浏览器打开");
						});
					},
				});
				// #endif
			}

		},
	}
</script>

<style lang="scss" scoped>
	.popup-content {

		padding: 56rpx 28rpx 28rpx 28rpx;

		.popup-content-item {
			flex: 1;
			display: flex;
			flex-direction: column;
			align-items: center;

			.popup-content-item-box {
				width: 300rpx;
				border-radius: 16rpx;
				background: linear-gradient(to bottom, #DCE9FF, #fff);
				display: flex;
				flex-direction: column;
				align-items: center;
				justify-content: center;

				.popup-content-title {
					margin-top: 24rpx;
					line-height: 42rpx;
				}

				.popup-content-content {
					font-size: 22rpx;
					color: #989898;
					line-height: 38rpx;
					margin-bottom: 24rpx;
				}

			}

			%popup-content-item-btn {
				border-radius: 12rpx;
				padding: 10rpx 20rpx;
				line-height: 28rpx;
				font-size: 22rpx;
			}

			.popup-content-item-qrbtn {
				@extend %popup-content-item-btn;
				background-color: #ECF4FF;
				border: 1rpx solid #ADCEFF;
				color: #408CFF;


			}

			.popup-content-item-taskbtn {
				@extend %popup-content-item-btn;
				background-color: #408CFF;
				color: white;

			}

		}
	}
</style>