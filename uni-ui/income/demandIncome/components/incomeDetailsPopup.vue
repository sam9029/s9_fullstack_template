<template>
	<view class="income-details-popup u-bg-f" @touchmove.stop.prevent="">
		<u-popup :show="show" mode="bottom" closeOnClickOverlay @close="onClose" round="24rpx">
			<view class="u-p-28">
				<view class="popup-top u-flex-row u-row-between u-col-center u-m-b-32">
					<text class="u-font-32 u-line-h-48 color-text-black u-font-bold">{{ topTitle }}</text>
					<!-- 			<u-icon @click="onClose" name="close-circle" size="24"></u-icon> -->
					<u-icon :name="`${static_path}close_circle_grey.png`" size="48rpx" @click="onClose"></u-icon>
				</view>
				<view class="popup-contain u-border-radius u-border">
					<view class="popup-contain-header u-flex-row u-bg-default u-p-l-28 u-p-r-28 u-p-t-24 u-p-b-24">
						<text class="popup-contain-title u-flex-1 u-font-24 u-font-weight color-text-black u-text-left"
							:class="{'popup-contain-right-title' : index == headerTitles.length - 1}"
							v-for="(item, index) in headerTitles" :key="index">{{item}}</text>
					</view>
					<scroll-view scroll-y="true" style="max-height: 800rpx;">
						<view class="popup-contain-item u-flex-col" v-for="(item, index) in listData" :key="index">
							<view class="u-m-t-24 u-p-l-28 u-p-r-28 u-flex-row">
								<text
									class="popup-contain-title u-flex-1 u-font-24  color-text-black u-text-left u-line-1"
									:class="{'popup-contain-right-title' : titleIndex == item.length - 1}"
									v-for="(title, titleIndex) in item" :key="titleIndex">{{title}}</text>
							</view>
							<view class="u-m-t-24" :style="{'background-color': '#eee', 'height': index < listData.length - 1 ? '2rpx' : '0rpx' }"></view>
						</view>
					</scroll-view>

				</view>
			</view>
		</u-popup>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import {
		sleep,
		unitMoney
	} from "@/utils/tools.js";
	import { mapGetters } from "vuex";
	export default {
		name: "incomeDetailsPopup",
		data() {
			return {
				show: false,
				headerTitles:[], //弹框类型: 1、发布收益明细  2、佣金收益明细，默认发布收益明细 		
				topTitle: "",
				listData: [],

			};
		},
		computed: {
			...mapGetters(['static_path']),

			
		},
		methods: {
			openPopup(id = "", item = {}, popupType = 1, currentTab=0) {
				const statusMap = {
					1: "待结算",
					2: "结算中",
					3: "已结算",
					4: "已归档",
					5: "无流程"
				};
				let settleStatus = statusMap[item.settle_status] || "";
				let oneAmount = popupType == 2 ? `¥${item.blogger_amount}` : `¥${item.charge_amount}`;
				let publishRatio = popupType == 2 ? `${item.service_ratio / 100.0}%` : `${item.publish_ratio / 100.0}%`;
				this.listData = [];
				this.topTitle = currentTab == 0 ? "预估收益明细" : "我的收益明细";

				if (popupType == 2) {

					this.headerTitles = ["达人收益", "分成比例", "我的收益", "结算状态"];
					this.listData.push([
						oneAmount,
						publishRatio,
						`¥${item.total_amount}`,
						settleStatus,
					]);
				} else {
					 if (currentTab == 0) {
						this.headerTitles = ["充值金额", "是否退款", "分成比例", "预估收益"];
						this.listData.push([
							oneAmount,
							item.refund_status == 1 ? "是" : "否",
							publishRatio,
							`¥${item.total_amount}`,
						]);
					 } else {
						this.headerTitles = ["充值金额", "分成比例", "我的收益", "结算状态"];
						this.listData.push([
							oneAmount,
							publishRatio,
							`¥${item.total_amount}`,
							settleStatus,
						]);
					 }
				}
				
				



				

	

				this.show = true;
			},
			onClose() {
				this.show = false;
				this.$emit("close");
			},

			toastMsg(message, type = "default", duration = 2000) {
				this.$refs.toastRef?.show({
					type,
					message,
					duration,
				});
			},
		},
	}
</script>

<style lang="scss" scoped>
	.popup-contain {

		.popup-contain-header {
			border-top-left-radius: 16rpx;
			border-top-right-radius: 16rpx;


		}

		.popup-contain-title {
			margin-right: 32rpx;
		}

		.popup-contain-right-title {
			text-align: right;
			margin-right: 0rpx;
		}

		.income-item-text {
			flex: 1;
			overflow: hidden;
			white-space: nowrap;
			text-overflow: ellipsis;
		}

		
	}

	
</style>