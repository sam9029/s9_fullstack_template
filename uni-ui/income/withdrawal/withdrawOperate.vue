<template>
	<view class="page-content">
		<MyNavbar bgColor="transparent">
			<template #navbarData>
				<view class="u-flex-row u-row-center u-col-center">
					<text class="u-text-center u-font-32 color-text-black u-font-bold">提现</text>
				</view>
			</template>
		</MyNavbar>
		<view class="card-bg u-m-l-28 u-m-t-28 u-m-r-28">
			<view class="u-text-main u-font-weight u-font-28">提现金额</view>
			<view class="u-flex-row u-col-center u-m-t-32">
				<view class="u-font-36 u-text-main u-font-weight-700">¥</view>
				<u-input class="u-font-24 color-text-black u-m-l-8" v-model.trim="withdrawAmount" type="number"
					border="none" :disabled="resubmitId? true:false" disabledColor="transparent" :clearable="true"
					style="height: 80rpx;" :placeholder="`可提现金额${enableAmount}元`"
					placeholderStyle="color: #989898;font-size: 24rpx;" @change="editChange"></u-input>
			</view>
			<u-line color="#EEEEEE" v-if="!resubmitId"></u-line>
			<view class="u-flex-row u-row-between u-m-t-32" v-if="!resubmitId">
				<view class="color-text-less-grey u-font-24">每次最少可提现10元</view>
				<view class="color-text-primary u-font-24" @click="showWithDrawRule(true)">提现规则</view>
			</view>
			<view class="u-flex-row u-row-between u-m-t-32" v-if="!resubmitId">
				<view class="percent-btn-normal" :class="{'percent-btn-active':percentIndex===1}"
					@click="choosePercent(1)">20%</view>
				<view class="percent-btn-normal u-m-l-16" :class="{'percent-btn-active':percentIndex===2}"
					@click="choosePercent(2)">30%</view>
				<view class="percent-btn-normal u-m-l-16" :class="{'percent-btn-active':percentIndex===3}"
					@click="choosePercent(3)">50%</view>
				<view class="percent-btn-normal u-m-l-16" :class="{'percent-btn-active':percentIndex===4}"
					@click="choosePercent(4)">全部</view>
			</view>
		</view>
		<view class="card-bg u-m-t-24 u-m-l-28 u-m-r-28">
			<view class="tab-area u-border-radius u-m-b-48">
				<view class="tab-item u-p-24 u-border-radius" @click="changeTab('BANK')"
					:class="{ active: currentTab == 'BANK' }">
					<u--image v-if="currentTab == 'BANK'" :src="`${static_path}bank_icon.png`" width="40rpx"
						height="40rpx"></u--image>
					<u--image v-else :src="`${static_path}bank_icon_disable.png`" width="40rpx"
						height="40rpx"></u--image>
					<text class="u-font-28 u-line-h-44 u-m-l-16">银行卡</text>
				</view>
				<view class="tab-item u-p-24 u-border-radius" @click="changeTab('ALIPAY')"
					:class="{ active: currentTab == 'ALIPAY' }">
					<u--image v-if="currentTab == 'ALIPAY'" :src="`${static_path}alipay_icon.png`" width="40rpx"
						height="40rpx"></u--image>
					<u--image v-else :src="`${static_path}alipay_icon_disable.png`" width="40rpx"
						height="40rpx"></u--image>
					<text class="u-font-28 u-line-h-44 u-m-l-16">支付宝</text>
				</view>
			</view>
			<view class="u-text-main u-font-32 u-font-weight">填写提现信息</view>
			<view class="u-text-main u-font-24 u-m-t-48">{{selectNotice}}</view>
			<view class="box-input u-flex-row u-flex-between u-m-t-16" @click="doSelect">
				<text class="u-font-24 u-flex-1"
					:style="{'color':selectedAccount=='请选择到账银行卡'||'请选择到账支付宝'?'#989898':'#1A1A1A'}">{{selectedAccount}}</text>
				<u-icon size="16rpx" name="arrow-down" color="#989898"></u-icon>
			</view>
			<view class="u-text-main u-font-24 u-m-t-32">收款人</view>
			<view class="box-input u-m-t-32" style="display: flex; justify-content: start;">
				<text class="u-font-24 u-text-main">{{accountName}}</text>
			</view>
		</view>
		<BottomBtn :data="button_list" :buttonIndex="0" @submit="beforeSubmit" @height="getBtnHeight" />
		<u-popup :show="showWithdrawNotice" round="16rpx" mode="center">
			<view class="u-p-48" style="width: 520rpx;">
				<view class="u-font-32 u-font-weight u-text-main u-m-b-32">提现规则</view>
				<text
					class="u-font-28 color-text-less-black">{{`1.提现金额在发起提现后7个工作日内到账，若未到账可联系在线客服反馈\n 2.单人单月提现金额不可超过8w，若超出部分请于次月进行提现`}}</text>
				<view class="u-font-28 color-text-white u-m-t-32"
					style="background: #408CFF; border-radius: 16rpx; line-height: 44rpx; padding-top: 20rpx; padding-bottom: 20rpx; text-align: center;"
					@click="showWithDrawRule(false)"> 我知道了</view>
			</view>
		</u-popup>
		<u-popup :show="showWithdrawResult" round="16rpx" mode="center">
			<view class="u-p-48" style="width: 520rpx;">
				<view class="u-font-32 u-font-weight u-text-main">提交成功</view>
				<view class="u-m-t-32">
					<text class="u-font-28 color-text-less-black">{{`您本次共提现：${withdrawAmount}元\n ${arriveTime}`}}</text>
				</view>
				<view class="u-flex-row u-m-t-32">
					<view class="u-font-28 u-text-main u-flex-1"
						style="background: #F6F6F6; border-radius: 16rpx; line-height: 44rpx; padding-top: 20rpx; padding-bottom: 20rpx; text-align: center;"
						@click="checkResult(true)">查看详情</view>
					<view class="u-font-28 color-text-white u-m-l-28 u-flex-1"
						style="background: #408CFF; border-radius: 16rpx; line-height: 44rpx; padding-top: 20rpx; padding-bottom: 20rpx; text-align: center;"
						@click="checkResult(false)">我知道了</view>
				</view>
			</view>
		</u-popup>
		<AccountPopup ref="accountPopupRef" @next="closeAccPopup" :accountType="currentTab"></AccountPopup>
		<base-toast ref="toastRef"></base-toast>
		<!-- 滑动验证码 -->
		<SlideCode :style="{ zIndex: 99999 }" v-if="showSlideCode" ref="sider" @slide_end="confirmReceive"
			@close="showSlideCode = false"></SlideCode>
	</view>
</template>

<script>
	import MyNavbar from "@/components/my-navbar/index.vue";
	import BottomBtn from "@/components/bottom-button/index.vue";
	import AccountPopup from "./components/accountPopup.vue";
	import SlideCode from "@/components/slide-code/index.vue";
	import { mapGetters } from "vuex";
	import {
		throttle,
		abMul,
		unitMoney
	} from "@/utils/tools.js";
	import {
		getWalletTotal
	} from "@/api/pages/income.js";
	import {
		doWithdraw,
		doReWithdraw
	} from "../api/withdraw/withdraw.js";
	export default {
		components: {
			MyNavbar,
			BottomBtn,
			AccountPopup,
			SlideCode
		},
		data() {
			return {
				enableAmount: '',
				withdrawAmount: '',
				arriveTime: '',
				showSlideCode: false,
				accountName: '',
				percentIndex: null,
				selectNotice: '选择到账银行卡',
				selectedAccount: '请选择到账银行卡',
				currentTab: "BANK",
				btnHeight: null,
				loading: false,
				accountId: null,
				orderId: null,
				showWithdrawNotice: false,
				resubmitId: null,
				showWithdrawResult: false,
				showSelectPop: false,
			}
		},
		computed: {
			...mapGetters(['static_path']),
			button_list() {
				return [
					[{
						text: this.resubmitId ? "重新提交" : "提交申请",
						shape: "square",
						type: "primary",
						onClick: "submit",
						btnType: "button",
						loading: this.loading,
					}, ],
				];
			},
		},
		methods: {
			confirmReceive(val) {
				if (!val) return this.toastMsg("请滑动拼图！", "error"); // 验证滑动拼图是否成功
				this.showSlideCode = false;
				this.loading = true;
				if (this.resubmitId) {
					doReWithdraw({
						id: this.resubmitId,
						bank_info_id: this.accountId,
						captcha_code: val.toString()
					}).then((res) => {
						if (res.code == 0) {
							this.orderId = res.data.id;
							this.arriveTime = res.data.date;
							this.showWithdrawResult = true;
						}
					}).catch((err) => {
						let message = String(err.message || err);
						this.toastMsg(message, "error");
					}).finally(() => {
						this.loading = false;
					})
				} else {
					doWithdraw({
						ask_for_amount: parseFloat(this.withdrawAmount) * 100,
						bank_info_id: this.accountId,
						captcha_code: val.toString()
					}).then((res) => {
						if (res.code == 0) {
							this.orderId = res.data.id;
							this.arriveTime = res.data.date;
							this.showWithdrawResult = true;
						}
					}).catch((err) => {
						let message = String(err.message || err);
						this.toastMsg(message, "error");
					}).finally(() => {
						this.loading = false;
					})
				}
			},
			getData() {
				this.toastMsg('加载中', 'loading', -1);
				getWalletTotal()
					.then((res) => {
						if (res.code == 0) {
							this.enableAmount = unitMoney(res.data.total.limit_amount, false, false);
						}
					})
					.catch((error) => {
						let message = String(err.message || err);
						this.toastMsg(message, "error");
					})
					.finally(() => {
						this.$refs.toastRef?.close();
					})
			},

			editChange() {
				if (this.withdrawAmount.length == 0) {
					this.percentIndex = null
				}
			},
			openAccPopup() {
				this.$refs.accountPopupRef.open(this.accountId);
			},
			closeAccPopup(target) {
				this.accountId = target.id;
				this.selectedAccount = target.pay_account;
				this.accountName = target.name;
			},
			doSelect() {
				this.openAccPopup();
			},
			showWithDrawRule(status) {
				this.showWithdrawNotice = status
			},
			checkResult(isCheck) {
				this.showWithdrawResult = false
				if (isCheck) {
					//查看详情
					uni.navigateTo({
						url: '/income/withdrawal/withdrawalDetails?id=' + this.orderId,
					})
				} else {
					//我知道了
					uni.navigateTo({
						url: '/income/withdrawal/record',
					})
				}
			},
			changeTab(index) {
				this.currentTab = index;
				this.accountId = null;
				if (index === 'BANK') {
					this.selectedAccount = '请选择到账银行卡'
					this.selectNotice = '选择到账银行卡'
				} else {
					this.selectedAccount = '请选择到账支付宝'
					this.selectNotice = '选择到账支付宝'
				}
			},
			choosePercent(index) {
				if (index === this.percentIndex) {
					this.percentIndex = null
					this.withdrawAmount = ''
				} else {
					this.percentIndex = index
					switch (index) {
						case 1:
							//20%
							this.withdrawAmount = abMul(this.enableAmount, 0.2)
							break;
						case 2:
							//30%
							this.withdrawAmount = abMul(this.enableAmount, 0.3)
							break;
						case 3:
							//50%
							this.withdrawAmount = abMul(this.enableAmount, 0.5)
							break;
						case 4:
							this.withdrawAmount = this.enableAmount
							break;
					}
				}
			},
			/**
			 * @description: 提交前的验证方法，使用防抖机制避免频繁调用
			 * @return {*}
			 */
			beforeSubmit: throttle(function func() {
				if (this.withdrawAmount.length == 0) {
					this.toastMsg("请输入提现金额", 'error')
					return
				}
				if (this.accountId == null) {
					this.toastMsg("请选择提现账号", 'error')
					return
				}
				this.showSlideCode = true
			}, 500), // 500毫秒的防抖时间

			getBtnHeight(height) {
				this.btnHeight = height;
			},
			toastMsg(message, type = "default") {
				this.$refs.toastRef?.show({
					type,
					message,
				});
			},
		},
		onLoad({
			id,
			money
		}) {
			if (id) {
				this.resubmitId = id;
				this.withdrawAmount = unitMoney(money, false, false);
			}
			this.getData();
		}
	}
</script>

<style lang="scss" scoped>
	.page-content {
		min-height: 100vh;
		/* #ifdef APP || MP */
		padding-top: 88rpx;
		/* #endif */
		background: linear-gradient(180deg, #d3edff, #f6f7fb);
		background-size: 100% 20%;
		background-repeat: no-repeat;
		background-position: top;

		.card-bg {
			border-radius: 16rpx;
			background: #FFFFFF;
			padding: 32rpx;
		}

		%percent-btn {
			flex: 1;
			text-align: center;
			line-height: 40rpx;
			font-size: 24rpx;
			padding: 8rpx 0rpx 8rpx 0rpx;
			border-radius: 40rpx;
		}

		.percent-btn-normal {
			@extend %percent-btn;
			color: $u-grey-7;
			background: #F6F6F6;
		}

		.percent-btn-active {
			@extend %percent-btn;
			color: $u-primary;
			background: #ECF4FF;
		}

		.box-input {
			align-items: center;
			height: 88rpx;
			padding-left: 32rpx;
			padding-right: 32rpx;
			background: #F6F6F6;
			border-radius: 16rpx;
		}

		.tab-area {
			display: flex;
			height: 92rpx;
			background: $u-grey-3;

			.tab-item {
				flex: 1;
				background: $u-grey-3;
				color: $u-grey-7;
				display: flex;
				align-items: center;
				justify-content: center;
				transition: all 0.3s ease;
			}

			.active {
				background: $u-primary-6;
				color: #fff !important;
			}
		}
	}
</style>