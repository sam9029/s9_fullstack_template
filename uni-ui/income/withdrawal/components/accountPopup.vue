<template>
	<view>
		<u-popup :show="show" mode="bottom">
			<view class="u-p-28">
				<view class="popup-top u-flex-row u-row-between u-col-center u-m-b-32">
					<text
						class="u-font-32 u-line-h-48 color-text-black u-font-bold">{{`请选择到账${accountType=='BANK'?'银行卡':'支付宝'}`}}</text>
					<u-icon @click="onClose" :name="`${static_path}close_circle.png`" size="24"></u-icon>
				</view>
				<view class="u-bg-f u-flex-row u-row-between u-col-center u-p-24 u-m-b-28 u-border-radius"
					style="border: 2rpx solid #eeeeee" @click="jumpAddAcc">
					<view class="u-flex-row u-col-center">
						<u-icon :name="`${static_path}cash_out_add_icon.png`" size="24"></u-icon>
						<text class="u-font-28 u-line-h-48 u-m-l-16">{{`添加${accountType=='BANK'?'银行卡':'支付宝'}`}}</text>
					</view>
					<u-icon name="arrow-right" size="16" color="#2C2C2C"></u-icon>
				</view>
				<view v-if="accountList.length" class="account-list scroll-y" style="height: 472rpx">
					<view v-for="(item, index) in accountList" :key="index"
						class="account-list--item u-p-24 u-flex-row u-row-between u-col-center u-border-radius u-m-b-16"
						style="background: #f6f6f6" @click="chooseAccount(item)">
						<text class="u-font-28 u-line-h-44" :class="{
                'color-text-black': !item.selected,
                'color-text-primary': item.selected,
              }">{{ item.pay_account }}</text>
						<u-icon v-if="item.selected" :name="`${static_path}radio_seleted.png`" size="16"></u-icon>
					</view>
					<view :style="{ height: popupBtnHeight }" class="u-flex-row u-row-center">
						<text class="u-font-24 color-text-less-grey">-到底了-</text>
					</view>
				</view>
				<view v-else style="height: 472rpx" class="u-p-t-30">
					<u-empty text="暂无已添加的账号" :icon="image.no_data_list"></u-empty>
				</view>
			</view>

			<BottomBtn :data="popup_button_list" :buttonIndex="0" @submitSingUp="submitSingUp"
				@height="getPopupBtnHeight" />
		</u-popup>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import {
		getBankList
	} from "@/api/public.js";
	import { mapGetters } from "vuex";
	import BottomBtn from "@/components/bottom-button/index.vue";

	export default {
		props: {
			accountType: {
				type: String,
				default: 'BANK',
			},
		},
		components: {
			BottomBtn,
		},
		data() {
			return {
				id: 0,
				submitLoading: false,
				accountList: [],
				popupBtnHeight: "",
				selected: null,
				show: false,
			};
		},
		computed: {
			...mapGetters(['static_path', 'image']),
			popup_button_list() {
				return [
					[{
						text: "确认",
						shape: "square",
						onClick: "submitSingUp",
						btnType: "button",
						type: "primary",
						loading: this.submitLoading,
					}, ],
				];
			},
		},
		methods: {
			getPopupBtnHeight(height) {
				this.popupBtnHeight = height * 2 + 30 + "rpx";
			},

			open(account_id) {
				this.id = account_id || "";
				this.show = true;
				this.queryAcc();
			},

			onClose() {
				this.show = false;
				this.id = null;
				this.selected = null;
			},

			submitSingUp() {
				if (!this.selected) {
					return this.toastMsg(`请选择${this.accountType=='BANK'?'银行卡':'支付宝'}账号`, 'error')
				}
				this.$emit("next", {
					...this.selected
				});
				this.onClose();
			},

			jumpAddAcc() {
				uni.navigateTo({
					url: `/pagesUser/cashOut/addCashOut?type=${this.accountType}`,
				});
				this.onClose();
			},

			chooseAccount(item) {
				this.accountList.forEach((acc) => {
					if (acc.id !== item.id) {
						acc.selected = false;
					}
				});
				item.selected = !item.selected;
				this.selected = {
					id: item.id,
					pay_account: item.pay_account,
					name:item.people_name,
				};
			},

			queryAcc() {
				this.toastMsg("加载中", "loading", -1);
				getBankList({
						pay_platform: this.accountType,
						verify_status: 2
					})
					.then((res) => {
						if (res.code == 0) {
							this.accountList = res.data.list.map((el) => {
								return {
									...el,
									selected: this.id == el.id,
								};
							});
						}
					})
					.catch((error) => {
						this.toastMsg(error, "error");
					})
					.finally(() => {
						this.$refs.toastRef.close();
					});
			},

			toastMsg(message, type = "default", duration = 2000) {
				this.$refs.toastRef?.show({
					type,
					message,
					duration,
				});
			},
		},
	};
</script>

<style lang="scss" scoped>
	::v-deep .u-popup__content {
		border-top-left-radius: 24rpx;
		border-top-right-radius: 24rpx;
	}

	::v-deep .u-empty__text {
		position: relative;
		top: -100rpx;
	}
</style>