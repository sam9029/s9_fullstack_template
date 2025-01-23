<template>
	<view class="page-box u-vh-100">
		<!-- <view class="page-bg-box"></view> -->
		<view class="top-area">
			<MyNavbar :backDelta="backDelta" bgColor="transparent">
				<template #navbarData>
					<view class="u-flex-row u-row-center u-col-center">
						<text class="u-text-center u-font-32 color-text-black u-font-bold">提现详情</text>
					</view>
				</template>
			</MyNavbar>
		</view>
		<view v-if="loadStatus == 0" style="padding-top: 300rpx;">
			<u-empty text="数据加载中" :icon="image.no_data_list"></u-empty>
		</view>
		<view class="contain-box" v-else-if="loadStatus == 1" :style="{paddingTop : top_height}">
			<view class="u-bg-f u-m-l-28 u-m-r-28 u-m-b-28 u-p-32 u-border-radius u-flex-col ">
				<text class="u-font-32 color-text-black u-text-center">提现金额</text>
				<view class="money-text u-flex-row u-p-t-32 u-p-b-32 color-text-black u-row-center u-col-bottom"
					style="line-height: 80rpx; font-weight: 700;">
					<text class="u-font-36" style="position: relative;top: 8rpx;">¥</text>
					<text class="u-font-56">{{ask_for_amount || 0}}</text>
				</view>
				<view style="background-color: #eee;height: 2rpx;"></view>
				<view class="u-m-t-48 u-flex-row u-row-between">
					<text class="color-text-less-grey u-font-28">提现方式</text>
					<text class="color-text-black u-font-28">{{pay_platform}}</text>
				</view>
				<view class="u-m-t-40 u-flex-row u-row-between">
					<text class="color-text-less-grey u-font-28">{{pay_account_t}}</text>
					<text class="color-text-black u-font-28">{{pay_account || ""}}</text>
				</view>
				<view class="u-m-t-40 u-flex-row u-row-between">
					<text class="color-text-less-grey u-font-28">收款人</text>
					<text class="color-text-black u-font-28">{{people_name || ""}}</text>
				</view>
			</view>
			<view class="u-bg-f u-m-28 u-p-32 u-border-radius ">
				<text class="color-text-black u-font-28 u-font-weight">提现时间</text>
				<view class="u-m-t-28">
					<view class="u-flex-row" v-for="(item, index) in stepData" :key="index">
						<view class="step-left u-flex-col u-p-t-0 u-p-b-0  u-m-r-16 u-col-center">
							<view class="step-space" :class="{'hidden' : index == 0}" style="height: 6rpx;"></view>
							<u-image :src="`${static_path}${item.icon}`" width="28rpx" height="28rpx"></u-image>
							<view v-if="index < stepData.length - 1" class="step-space u-flex-1">
							</view>
						</view>
						<view class="u-flex-1 u-flex-col">
							<view class="u-flex-row">
								<text class=" u-font-28  u-m-r-16 "
									:class="{'u-font-weight' : item.isBold, 'color-text-black' : item.isBold, 'color-text-less-grey' : !item.isBold}"
									style="flex-shrink: 0;">{{item.label}}</text>
								<text class="u-flex-1 u-font-28" style="color: #FF325B;">{{item.message}}</text>
							</view>

							<view class=" u-flex-row  u-col-center" :class="{'u-p-b-48' : index < stepData.length - 1}">
								<text class="color-text-grey u-font-24">{{item.create_time}}</text>
								<view class="u-m-l-16 u-flex-row u-col-center"
									v-if="(item.pay_status == 7 || item.pay_status == 8) && (index == stepData.length - 1)"
									@click="resetSubmit">
									<text class="color-text-primary u-font-28">重新提交</text>
									<u-icon name="arrow-right" color="#408CFF" size="28rpx"></u-icon>
								</view>
							</view>
						</view>
					</view>
				</view>

			</view>
		</view>

		<view v-else style="padding-top: 300rpx;">
			<u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
		</view>
		<view style="height: 20rpx;"></view>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import { mapGetters } from "vuex";
	import MyNavbar from "@/components/my-navbar/index.vue";
	import {
		getWithdrawDetails
	} from "../api/withdraw/withdraw.js"
	import {
		unitMoney
	} from "../../utils/tools.js";
	export default {
		props: {},
		components: {
			MyNavbar
		},

		data() {
			return {
				withdrawalMoney: 0,
				backDelta: 1,
				loadStatus: 0, //加载状态， 0：未加载数据 1：加载完成  2：加载出错
				id: 0,
				navbar_height: 0,
				ask_for_amount: 0,
				pay_platform: null,
				people_name: null,
				pay_account: null,
				pay_account_t: "",
				stepData: [],
			};
		},
		computed: {
			...mapGetters(['static_path', 'image']),
			top_height() {
				return this.navbar_height + "px";
			},
		},
		watch: {},
		methods: {
			getDisplayWay(){
				switch (this.pay_platform) {
					case "ALIPAY":
						return "支付宝提现";
					case "AOMPANY":
						return "打款验证中";
					default:
						return "验证失败 点此查看原因";
				}
			},
			getDisplayDes(){
				
			},
			resetSubmit() {
				uni.navigateTo({
					url: `/income/withdrawal/withdrawOperate?id=${this.id}&money=${this.withdrawalMoney}`,

				})
			},
			getDetails() {
				this.toastMsg('加载中', 'loading', -1);
				getWithdrawDetails({
						id: this.id
					})
					.then((res) => {
						this.$refs.toastRef?.close();
						this.loadStatus = 1;
						this.ask_for_amount = unitMoney(res.data["ask_for_amount"], false, true);
						this.withdrawalMoney = res.data["ask_for_amount"];
						switch (res.data["pay_platform"]) {
							case "ALIPAY":
								this.pay_platform ="支付宝提现"
								this.pay_account_t ="到账支付宝"
								break;
							case "COMPANY":
								this.pay_platform ="对公银行提现"
								this.pay_account_t ="到账银行卡"
								break;
							default:
								this.pay_platform ="银行卡提现"
								this.pay_account_t ="到账银行卡"
								break;
						}
						this.people_name = res.data["people_name"];
						this.pay_account = res.data["pay_account"];
						this.stepData = [];
						for (let item of res.data["process"]) {
							let icon = "step-circle.png";
							if (item.pay_status == 7 || item.pay_status == 8) {
								icon = "step_fail-circle.png";
							} else if (item.pay_status == 6) {
								icon = "step-success-circle.png";
							}
							item.isBold = item.pay_status == 1 || item.pay_status == 6 || item.pay_status == 7 || item
								.pay_status == 8;
							item.icon = icon;
							this.stepData.push(item);

						}

						this.$nextTick(() => {
							this.computedHeight();
						});
					}).catch((err) => {
						this.loadStatus = 2;
						let message = String(err.message || err);
						this.toastMsg(message, "error");
					});
			},
			toastMsg(message, type = "default") {
				this.$refs.toastRef?.show({
					type,
					message,
				});
			},
			async computedHeight() {
				const topRect = await this.$u.getRect(`.top-area`);
				this.navbar_height = topRect.height + 14;

			},
		},
		mounted() {},
		onLoad({
			id
		}) {
			this.id = id;
		},
		onReady() {
			this.getDetails();
		},
		onShow() {
			const pages = getCurrentPages();
			if (pages.length >= 2) {

				const previousPage = pages[pages.length - 2];
				const route = previousPage.route;
				if (route === 'income/withdrawal/withdrawOperate') {
					this.backDelta = 999;
				}
			}
		}
	};
</script>

<style lang="scss" scoped>
	@font-face {
		font-family: 'DINPro-Bold';
		src: url('@/static/fonts/DINPro-Bold.otf') format('truetype');
	}

	.page-box {
		background: linear-gradient(to bottom, #D3EDFF 0%, #F6F7FB 40%, #F6F7FB 100%);

		// min-height: 100vh;

		.top-area {
			/* #ifdef APP || MP */
			padding-top: 88rpx;
			/* #endif */
			z-index: 999;
			width: 750rpx;
			left: 0;
			top: 0;
			position: fixed;
			overflow: hidden;

		}

		.top-area::before {
			content: "";
			/* 伪元素必须有 content 属性，即使为空 */
			position: absolute;
			/* 绝对定位，使其可以脱离文档流 */
			top: 0;
			left: 0;
			width: 750rpx;
			height: 660rpx;
			background: linear-gradient(to bottom, #D3EDFF 0%, #F6F7FB 100%);
			/* 这里设置你想要的渐变颜色，从红色到黄色的线性渐变 */
			z-index: -1;
			/* 将伪元素置于父元素之下 */

		}


		.contain-box {
			.money-text {
				font-family: "DINPro-Bold";
			}

			.step-left {


				.step-space {
					width: 2rpx;
					background-color: #408CFF;
					opacity: 0.2;


				}

				.step-space.hidden {
					opacity: 0;
				}
			}

		}

	}
</style>