<template>
	<view class="income-page">
		<view class="income-page--container u-p-x-28">
			<view class="account-info base-radius u-m-b-28 u-p-32 color-text-white">
				<view class="u-flex-row u-row-between u-col-center u-m-b-32">
					<text class="u-font-24 u-line-h-40">账户总览</text>
					<view class="u-flex-row u-col-center">
						<text class="u-font-24 u-line-h-40 color-text-disabled-primary"
							@click="jumpPage('withdrawRecord')">提现记录</text>
						<u-icon :name="`${static_path}icon_light_blue_right_arrow.png`" width="24rpx" height="24rpx"
							class="u-m-l-8"></u-icon>
					</view>

				</view>
				<view class="u-flex-row u-row-between u-col-center u-p-b-32">
					<view class="u-flex-col">
						<text class="u-font-24 u-line-h-40 color-text-disabled-primary">可提现(元)</text>
						<text class="u-font-bold u-font-60 u-line-h-76 u-font-bold money-text">{{
              unitMoney(topCard.limit_amount, false, true)
            }}</text>
					</view>
					<view class="u-bg-f u-p-x-16 u-p-y-4 u-flex-row u-col-center u-row-center"
						style="border-radius: 100px; height: 48rpx;width: 98rpx;" @click="jumpWithdraw">
						<u-loading-icon v-if="withdrawLoading" size="12"></u-loading-icon>
						<text v-else class="color-text-primary u-font-22">去提现</text>
					</view>
				</view>
				<view class="widthAll" style="border-bottom: 2rpx solid #fff; opacity: 10%; height: 2rpx"></view>
				<view class="info--bottom--price u-m-t-32">
					<view class="u-flex-col color-text-white">
						<text class="u-font-24 u-line-h-40 color-text-disabled-primary">待入账</text>
						<text class="u-font-40 u-line-h-56 u-font-bold money-text">{{
              unitMoney(topCard.be_credited_amount, false, true)
            }}</text>
					</view>
					<view class="u-flex-col color-text-white">
						<view class="u-flex-row u-col-center" @click="openModal">
							<text class="u-font-24 u-line-h-40 color-text-disabled-primary u-m-r-8">入账总收益</text>
							<u-icon
								name="question-circle"
								width="24rpx" 
								height="24rpx"
								color="#CFE2FF"
							></u-icon>
						</view>
						<text class="u-font-40 u-line-h-56 u-font-bold money-text">{{
              unitMoney(topCard.total_amount, false, true)
            }}</text>
					</view>
				</view>
			</view>
			<view class="task-income u-bg-f base-radius u-m-b-28 u-p-32 u-flex-col">
				<text class="u-font-24 u-line-h-40 color-text-less-black">做任务变现收益</text>
				<view class="u-flex-row u-row-between u-m-t-48 u-col-top" @click="jumpPage('novel')">
					<view class="u-flex-row u-col-top">
						<u-icon :name="`${static_path}income_novel_icon.png`" width="48rpx" height="48rpx"></u-icon>
						<view class="u-flex-col u-m-l-16">
							<text class="u-font-28 u-line-h-48 u-font-bold">小说推文</text>
							<view class="u-flex-row u-col-center color-text-less-grey u-font-24 u-line-h-40">
								<text>{{
                  novelObj.total_amount ? "累计入账:" : "暂无收益"
                }}</text>
								<text v-if="novelObj.total_amount" class="u-m-l-16 u-font-bold">{{
                  unitMoney(novelObj.total_amount, false, true)
                }}</text>
							</view>
						</view>
					</view>
					<view class="u-flex-row u-col-center">
						<text class="color-text-less-grey u-font-24 u-line-h-40 u-m-r-8">{{novelObj.total_amount ?"查看明细":"关键词推文变现"}}</text>
						<u-icon :name="`${static_path}icon_gray_right_arrow.png`" width="28rpx" height="28rpx"></u-icon>
					</view>
				</view>
				<view class="u-flex-row u-row-between u-m-t-48 u-col-top" @click="jumpPage('demand')">
					<view class="u-flex-row u-col-top">
						<u-icon :name="`${static_path}income_demand_icon.png`" width="48rpx" height="48rpx"></u-icon>
						<view class="u-flex-col u-m-l-16">
							<text class="u-font-28 u-line-h-48 u-font-bold">看点推广</text>
							<view v-if="demandObj.be_credited_amount || demandObj.total_amount"
								class="u-flex-row u-col-center color-text-less-grey u-font-24 u-line-h-40">
								<view class="u-flex-row u-col-center">
									<text>待入帐：</text>
									<text class="color-text-orange u-font-bold">{{
                    unitMoney(demandObj.be_credited_amount, false, true)
                  }}</text>
								</view>
								<view class="gap-line u-m-x-16"></view>
								<view class="u-flex-row u-col-center">
									<text>已入账：</text>
									<text class="u-font-bold">{{
                    unitMoney(demandObj.total_amount, false, true)
                  }}</text>
								</view>
							</view>
							<text v-else class="color-text-less-grey u-font-24 u-line-h-40">暂无收益</text>
						</view>
					</view>
					<view class="u-flex-row u-col-center">
						<text class="color-text-less-grey u-font-24 u-line-h-40 u-m-r-8">{{(demandObj.be_credited_amount||demandObj.total_amount)?"查看明细":"分发看点变现"}}</text>
						<u-icon :name="`${static_path}icon_gray_right_arrow.png`" width="28rpx" height="28rpx"></u-icon>
					</view>
				</view>
			</view>
			<view class="activity-income u-bg-f base-radius u-m-b-28 u-p-32 u-flex-col">
				<text class="u-font-24 u-line-h-40 color-text-less-black">参与活动奖励收益</text>
				<view class="u-flex-row u-row-between u-m-t-48 u-col-top" @click="jumpPage('activity')">
					<view class="u-flex-row u-col-top">
						<u-icon :name="`${static_path}income_activity_icon.png`" width="48rpx" height="48rpx"></u-icon>
						<view class="u-flex-col u-m-l-16">
							<text class="u-font-28 u-line-h-48 u-font-bold">活动奖励</text>
							<view class="u-flex-row u-col-center color-text-less-grey u-font-24 u-line-h-40">
								<text>{{
                  activityObj.total_amount ? "累计入账：" : "暂无收益"
                }}</text>
								<text v-if="activityObj.total_amount" class="u-font-bold">{{
                  unitMoney(activityObj.total_amount, false, true)
                }}</text>
							</view>
						</view>
					</view>
					<view class="u-flex-row u-col-center">
						<text class="color-text-less-grey u-font-24 u-line-h-40 u-m-r-8">查看明细</text>
						<u-icon :name="`${static_path}icon_gray_right_arrow.png`" width="28rpx" height="28rpx"></u-icon>
					</view>
				</view>
			</view>
			<view class="create-income u-bg-f base-radius u-flex-col u-p-32">
				<text class="u-font-24 u-line-h-40 color-text-less-black">加入承制创作收益</text>
				<view class="u-flex-row u-row-between u-m-t-48 u-col-top" @click="jumpPage('create')">
					<view class="u-flex-row u-col-top">
						<u-icon :name="`${static_path}income_create_icon.png`" width="48rpx" height="48rpx"></u-icon>
						<view class="u-flex-col u-m-l-16">
							<text class="u-font-28 u-line-h-48 u-font-bold">承制收益</text>
							<view v-if="createObj.be_credited_amount || createObj.total_amount"
								class="u-flex-row u-col-center color-text-less-grey u-font-24 u-line-h-40">
								<view class="u-flex-row u-col-center">
									<text>待入帐：</text>
									<text class="color-text-orange u-font-bold">{{
                    unitMoney(createObj.be_credited_amount, false, true)
                  }}</text>
								</view>
								<view class="gap-line u-m-x-16"></view>
								<view class="u-flex-row u-col-center">
									<text>已入账：</text>
									<text class="u-font-bold">{{
                    unitMoney(createObj.total_amount, false, true)
                  }}</text>
								</view>
							</view>
							<text v-else class="color-text-less-grey u-font-24 u-line-h-40">暂无收益</text>
						</view>
					</view>
					<view class="u-flex-row u-col-center">
						<text class="color-text-less-grey u-font-24 u-line-h-40 u-m-r-8">{{(createObj.be_credited_amount||createObj.total_amount)?"查看明细":"申请成为创作者"}}</text>
						<u-icon :name="`${static_path}icon_gray_right_arrow.png`" width="28rpx" height="28rpx"
							class="u-m-l-8"></u-icon>
					</view>
				</view>
			</view>
		</view>
		<u-popup :show="showAddWithdraw" round="16rpx" mode="center">
			<view class="u-p-48" style="width: 520rpx">
				<view class="u-font-32 u-font-bold u-text-main">请添加提现账户</view>
				<view class="u-font-28 color-text-less-black u-m-t-32">为避免打款错误，需先实名绑定收款信息后方可提现</view>
				<view class="u-flex-row u-m-t-32">
					<view class="u-font-28 u-text-main u-flex-1" style="
              background: #f6f6f6;
              border-radius: 16rpx;
              line-height: 44rpx;
              padding-top: 20rpx;
              padding-bottom: 20rpx;
              text-align: center;
            " @click="dealWithdrawNotice(false)">
						暂不添加</view>
					<view class="u-font-28 color-text-white u-m-l-28 u-flex-1" style="
              background: #408cff;
              border-radius: 16rpx;
              line-height: 44rpx;
              padding-top: 20rpx;
              padding-bottom: 20rpx;
              text-align: center;
            " @click="dealWithdrawNotice(true)">
						去添加</view>
				</view>
			</view>
		</u-popup>
		<base-toast ref="toastRef"></base-toast>
		<u-modal
			:show="showModal"
			:showCancelButton="false"
			:showConfirmButton="true"
			title="入账总收益"
			content="入账总收益不包含待入账数据,仅作为各业务已结算即已入账的收益汇总(总收益=已提现金额+可提现余额)"
			confirmText="我知道了"
			:buttonFill="false"
			:closeOnClickOverlay="false"
			@confirm="showModal = false"
			>
    	</u-modal>
	</view>
</template>

<script>
	import {
		unitMoney
	} from "@/utils/tools.js";
	import {
		getWalletTotal
	} from "@/api/pages/income.js";
	import {
		getBankList
	} from "@/api/public.js";
	import {
		mapGetters
	} from "vuex";
	export default {
		props: {},
		data() {
			return {
				showModal:false,
				topCard: {},
				site_id: null,
				novelObj: {},
				demandObj: {},
				activityObj: {},
				createObj: {},
				showAddWithdraw: false,
				lengthFlag: false,
				withdrawLoading: false,
			};
		},
		computed: {
			...mapGetters(["image", "static_path", "has_login"]),
		},
		onShow() {
			if (!this.has_login) {
				return uni.showModal({
          title: "登录失效",
          content: "登录失效，请重新登录",
          showCancel: true,
          cancelText: "取消",
          confirmText: "登录",
          confirmColor: this.theme_color,
          success: (res) => {
            if (res.confirm) {
              uni.navigateTo({
								url: '/pages/login/login'
							})
            } else if(res.cancel) {
							uni.switchTab({
								url: '/pages/novel/novel'
							})
						}
          },
        });
			}
			this.getData();
		},
		methods: {
			unitMoney,
			jumpWithdraw() {
				let flag = false;
				this.withdrawLoading = true;
				getBankList({
						verify_status: 2,
					})
					.then((res) => {
						if (res.code == 0) {
							flag = res.data.list.length ? true : false;
							if (flag) {
								uni.navigateTo({
									url: '/income/withdrawal/withdrawOperate'
								})
							} else {
								this.showAddWithdraw = true;
							}
						}
					})
					.catch((err) => {
						let message = String(err.message || err || "获取用户账号失败");
						this.toastMsg(message, "error");
					})
					.finally(() => {
						this.withdrawLoading = false;
					})
			},

			jumpPage(target) {
				let url = "";
				switch (target) {
					case "novel":
						if (!this.novelObj.total_amount) {
							return uni.switchTab({
								url: '/pages/novel/novel'
							})
						} else {
							url = "/income/novelIncome/home";
							break;
						}
					case "demand":
						if (!(this.demandObj.be_credited_amount || this.demandObj.total_amount)) {
							return uni.switchTab({
								url: '/pages/demand/demand'
							})
						} else {
							url = "/income/demandIncome/home";
							break;
						}
					case "activity":
						url = "/income/activityIncome/home";
						break;
					case "create":
						if (!(this.createObj.be_credited_amount || this.createObj.total_amount)) {
							url = "/pagesUser/auth/home"
						} else {
							url = "/income/createIncome/home";
						}
						break;
					case "withdrawRecord":
						url = "/income/withdrawal/record";
						break;
				}
				uni.navigateTo({
					url,
				});
			},
			dealWithdrawNotice(isDeal) {
				this.showAddWithdraw = false;
				if (isDeal) {
					uni.navigateTo({
						url: "/pagesUser/cashOut/addCashOut",
					});
				}
			},
			getData() {
				getWalletTotal()
					.then((res) => {
						if (res.code == 0) {
							this.topCard = res.data.total;
							this.novelObj = res.data.list?.find((item) => item.type == 1) ?? {};
							this.demandObj =
								res.data.list?.find((item) => item.type == 2) ?? {};
							this.activityObj =
								res.data.list?.find((item) => item.type == 5) ?? {};
							this.createObj =
								res.data.list?.find((item) => item.type == 6) ?? {};
							this.site_id = res.data.site_id;
						}
					})
					.catch((error) => {
						this.toastMsg(error.message || error, "error");
					})
					.finally(() => {
						uni.stopPullDownRefresh();
					})
			},
			openModal(){
				this.showModal = true;
			},
			toastMsg(message, type = "default", duration = 2000) {
				this.$refs.toastRef?.show({
					type,
					message,
					duration
				});
			},
		},
		onPullDownRefresh() {
			this.getData();
		},
	};
</script>

<style lang="scss" scoped>
	@font-face {
		font-family: "DINPro-Bold";
		src: url("@/static/fonts/DINPro-Bold.otf") format("truetype");
	}
	.money-text {
		font-family: "DINPro-Bold";
	}
	.income-page {
		min-height: 100vh;
		background: linear-gradient(180deg, #d3edff 0%, #f6f7fb 60.27%);

		.income-page--container {
			/* #ifdef APP || MP */
			padding-top: 116rpx;
			/* #endif */
			/* #ifdef H5 */
			padding-top: 28rpx;

			/* #endif */
			.account-info {
				background: linear-gradient(109.59deg,
						#62a1ff 0%,
						#408cff 59.88%,
						#3677d9 100%),
					linear-gradient(0deg,
						rgba(255, 255, 255, 0.05),
						rgba(255, 255, 255, 0.05));

				.info--bottom--price {
					display: grid;
					grid-template-columns: repeat(2, 1fr);
				}
			}
		}
	}

	.base-radius {
		border-radius: 32rpx;
	}
</style>