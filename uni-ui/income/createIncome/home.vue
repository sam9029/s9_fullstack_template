<template>
	<view class="create-income-page">
		<view class="navbar-box">
			<view class="navbar u-p-x-28 u-p-y-16 widthAll u-relative" style="background: transparent">
				<u-icon name="arrow-left" size="48rpx" @click="goBack"></u-icon>
				<view class="color-text-black u-font-32 u-line-h-48 u-position-center">承制收益</view>
			</view>
		</view>
		<!-- Tab切换 -->
		<view class="tab-wrapper u-flex-row u-font-32" :style="{'top': tabWrapperTop}">
			<view v-for="(item, index) in tabs" :key="index" :class="['tab-item', currentTab === index ? 'active' : '']"
				@click="switchTab(index)">
				{{ item }}
			</view>
		</view>
		<PriceCard v-if="true" :currentTab="currentTab" :detailObj="detailObj" />
	
		<view class="list-top u-p-28 u-flex-row u-row-between u-col-center" style="background: #f6f7fb" :style="{'top': listTop}">
			<text class="u-font-bold u-font-32 u-line-h-48">收益明细</text>
			<DatePicker ref="datePickerRef" title="请选择查询时间段" :type="['list']" :baseBtn="false" @submit="getDate">
				<template #default="{ label, value }">
					<view class="date-tabs">
						<view class="date-tabs--item" :class="{
                'date-tabs--active': value == '3months',
                'date-tabs--default': value != '3months',
              }"@click="setDateValue('3months')">
							<text class="u-font-24 u-line-h-40">近三月</text>
						</view>
						<view class="date-tabs--item" :class="{
                'date-tabs--active': value == '12months',
                'date-tabs--default': value != '12months',
              }" @click="setDateValue('12months')">
							<text class="u-font-24 u-line-h-40">近一年</text>
						</view>
						<view class="date-tabs--item" :class="{
                'date-tabs--active': value == '6months',
                'date-tabs--default': value != '6months',
              }" @click="setDateValue('6months')">
							<text class="u-font-24 u-line-h-40">近半年</text>
						</view>
						<view class="date-tabs--item" :class="{
                'date-tabs--active': value == null,
                'date-tabs--default': value != null,
              }"@click="setDateValue(null)">
							<text class="u-font-24 u-line-h-40">全部</text>
						</view>
					</view>
				</template>
			</DatePicker>
		</view>
		<view class="u-p-x-28">
			<view v-if="listData.length" class="list-content">
				<view v-for="(item, index) in listData" :key="item.id"
					class="list-content--item u-p-24 u-border-radius u-m-b-28 u-flex-row u-col-center"
					@click="goDetail(item)">
					<u--image :src="item.collection_cover_url" width="124rpx" height="176rpx" radius="16rpx"></u--image>
					<view class="u-m-l-16 u-flex-col u-row-between widthAll" style="height: 176rpx">
						<view class="u-flex-row u-row-between u-col-center u-m-b-16">
							<text class="u-line-1 color-text-black u-font-28 u-line-h-44">{{
                item.collection_name || "--"
              }}</text>
							<u-icon name="arrow-right" color="#3c3c3c" size="32rpx"></u-icon>
						</view>
						<view class="list-item-price-card u-border-radius">
							<view class="u-flex-col u-col-center">
								<text class="color-text-black u-font-28 u-line-h-44">{{
				  (currentTab == 0 ? item.order_num : item.integral_num) || "--"
                }}</text>
								<text class="color-text-less-grey u-font-22 u-line-h-40">{{currentTab == 0 ? '支付订单' : '支付看点'}}</text>
							</view>
							<view class="u-flex-col u-col-center price-border">
								<text class="color-text-black u-font-28 u-line-h-44">{{
                  unitMoney(currentTab == 0 ? item.order_amount : item.exchange_amount, false, true)
                }}</text>
								<text class="color-text-less-grey u-font-22 u-line-h-40">{{currentTab == 0 ? '充值金额' : '兑换金额'}}</text>
							</view>
							<view class="u-flex-col u-col-center">
								<text class="color-text-black u-font-28 u-line-h-44">{{
                  unitMoney(item.account_amount, false, true)
                }}</text>
								<view class="u-flex-row u-col-center" @click.stop="openModal($event)">
									<text class="color-text-less-grey u-font-22 u-line-h-40 u-m-r-8">我的收益</text>
									<u-icon
										name="question-circle"
										width="24rpx" 
										height="24rpx"
										color="#989898"
									></u-icon>
								</view>
								
							</view>
						</view>
					</view>
				</view>
			</view>
			<view v-if="!loading && !listData.length" class="u-m-t-100">
				<u-empty text="暂无收益数据" :icon="image.no_data_list"></u-empty>
			</view>
			<view v-if="!loading && listData.length > 0" class="u-p-b-48">
				<u-loadmore :status="status" :loading-text="loadingText" :loadmore-text="loadmoreText"
					:nomore-text="nomoreText"></u-loadmore>
			</view>
		</view>
		<base-toast ref="toastRef"></base-toast>
		<u-modal
			:show="showModal"
			:showCancelButton="false"
			:showConfirmButton="true"
			title="我的收益"
			:content="modalContent"
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
		unitMoney,
		sleep
	} from "@/utils/tools.js";
	import {
		getCreateList,
		getCreateTotal,
		getkdCreateList,
		getkdCreateTotal,
	} from "../api/create/index.js";
	import DatePicker from "@/components/base-datepicker/index.vue";
	import PriceCard from "./components/advertiserPriceCard.vue";
	import {
		mapGetters
	} from "vuex";
	export default {
		props: {},
		components: {
			DatePicker,
			PriceCard,
		},
		data() {
			return {
				tabs: ['剧集充值收益', '看点支付收益'],
				currentTab: 0,
				listTop: 0,
				tabWrapperTop: 0,


				showModal:false,
				detailObj: {
					will_income: {

					},
					settled_income: {

					}
				},
				status: "loadmore",
				loadingText: "努力加载中",
				loadmoreText: "下拉加载更多",
				nomoreText: "没有更多了～",
				page: 1,
				pagesize: 20,
				loading: false,
				isEnd: false,
				listData: [],
				date: [],
			};
		},
		computed: {
			...mapGetters(['static_path', 'image']),
			modalContent() {
				let typeContent = this.currentTab == 0? '剧集充值' : '看点支付';
				return  '我的收益即' + typeContent + '分成收益，包含待入账预估收益和累计入账收益'
			},
		},
		methods: {
			unitMoney,
			async computedHeight() {

				const navBoxRect = await this.$u.getRect(`.navbar-box`);
				this.tabWrapperTop = navBoxRect.top + navBoxRect.height + "px";

				const tabBoxRect = await this.$u.getRect(`.tab-wrapper`);
				this.listTop = tabBoxRect.top + tabBoxRect.height  + "px";
			},
			setDateValue(value) {
				this.$refs.datePickerRef.setDate(value, true);
			},

			goBack() {
				uni.navigateBack(-1)
			},

			getDate(date) {
				this.date = date;
				this.isEnd = false;
				this.toastMsg("加载中", "loading", -1);
				uni.$u.throttle(this.getListData(), 500);
			},

			init() {
				this.toastMsg("加载中", "loading", -1);
				this.isEnd = false;
				this.getTopCard();
				this.getListData();
				uni.stopPullDownRefresh();
			},
			switchTab(index) {
				this.currentTab = index;
				this.detailObj = {
					will_income: {
					},
					settled_income: {
					}
				};
				this.listData = [];
				this.init();
			},
			getTopCard() {
				this.cardLoading = true;
				let totalFun = this.currentTab == 0 ? getCreateTotal : getkdCreateTotal;
				totalFun()
					.then(res => {
						if (res.code == 0) {
							this.detailObj = res.data;
						}
					})
					.catch(error => {
						this.toastMsg(error.message || error, "error")
					})
					.finally(async () => {
						await sleep(300);
						this.cardLoading = false;
					})
			},

			getListData(reset = true) {
				if (this.loading) return;
				reset && (this.loading = true);
				if (!reset && this.isEnd) return;

				if (reset) {
					this.page = 1;
					this.isEnd = false; // 重置时应该允许加载数据
				} else {
					this.page += 1;
				}

				this.loadmoreText = `努力加载中`;
				this.status = "loading";

				let params = {
					pagesize: this.pagesize,
					start_date: this.date[0],
					end_date: this.date[1],
				};
				params.page = this.page;
				let listFun = this.currentTab == 0 ? getCreateList : getkdCreateList;
				listFun(params)
					.then((res) => {
						
						const list = this.currentTab == 0 ? res.data.list : res.data;
						
						if (reset) this.listData = list;
						else this.listData.push(...list);
						let bool = !(list.length < this.pagesize);
						this.isEnd = !bool;
						if (!bool) {
							this.nomoreText = `没有更多了～`;
							this.status = "nomore";
						} else {
							this.loadmoreText = `下拉加载更多`;
							this.status = "loadmore";
						}
						this.$refs.toastRef?.close();
					})
					.catch((err) => {
						let message = String(err.message || err || "项目详情获取失败");
						this.toastMsg(message, "error");
					})
					.finally(async () => {
						await sleep(300);
						this.loading = false;
					});
			},

			goDetail(item) {
				if (this.currentTab == 0) {
					uni.navigateTo({
						url: `/income/createIncome/detail?collection_id=${item.collection_id}`
					})
				} else {
					uni.navigateTo({
						url: `/income/createIncome/kddetail?collection_id=${item.collection_id}`
					})
				}

			},
			openModal(event){
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
		mounted() {
			this.computedHeight();
		},
		onLoad() {
			this.init();
		},
		onPullDownRefresh() {
			this.init();
		},
		onReachBottom() {
			uni.$u.throttle(this.getListData(false), 500);
		},
	};
</script>

<style lang="scss" scoped>
	uni-page-body {
		background: transparent;
	}

	.create-income-page {
		min-height: 100vh;
		position: relative;
		background: linear-gradient(180deg, #d3edff 0%, #f6f7fb 35%);

		.navbar-box {
			background: #D3EDFF;
			position: sticky;
			top: 0;
			z-index: 100;
			/* #ifdef APP || MP */
			padding-top: 88rpx;

			/* #endif */
			.navbar {
				display: flex;
				align-items: center;
				height: 88rpx;
			}
		}

		
		.tab-wrapper {
			background: linear-gradient(180deg, #d8eefe, #d8eefe);
			position: sticky;
			z-index: 99;


			.tab-item {
				padding-bottom: 36rpx;
				line-height: 48rpx;
				flex: 1;
				text-align: center;
				color: #6a6a6a;

				&.active {
					color: #1a1a1a;
					position: relative;
					font-weight: 700;

					&::after {
						content: '';
						position: absolute;
						bottom: 24rpx;
						left: 50%;
						transform: translateX(-50%);
						width: 32rpx;
						height: 8rpx;
						background: #408cff;
						border-radius: 8rpx;
					}
				}
			}
		}

		.list-top {
			position: sticky;
			z-index: 98;
		}

		.list-content--item {
			background: #fff;
		}

		.list-item-price-card {
			padding: 8rpx 16rpx;
			border: 1rpx solid #eeeeee;
			background: #f6f6f6;
			display: grid;
			grid-template-columns: repeat(3, 3fr);
		}

		.price-border {
			position: relative;

			&::after {
				content: "";
				position: absolute;
				top: 50%;
				left: 8rpx;
				width: 1rpx;
				height: 16rpx;
				background: #c6c6c6;
			}

			&::before {
				content: "";
				position: absolute;
				top: 50%;
				right: 8rpx;
				width: 1rpx;
				height: 16rpx;
				background: #c6c6c6;
			}
		}

		.date-tabs {
			display: flex;
			background: #fff;
			border-radius: 100px;

			.date-tabs--item {
				display: flex;
				align-items: center;
				justify-content: center;
				padding-left: 24rpx;
				padding-right: 24rpx;
				height: 56rpx;
			}

			&--default {
				color: $u-grey-7;
				background: #fff;
				 border-radius: 100rpx;
			}

			&--active {
				color: #fff;
				background: $u-primary;
				 border-radius: 100rpx;
			}
		}

		.un-posted {
			background: #f6f6f6;
			display: grid;
			grid-auto-flow: column;
			align-items: center;
		}
	}
</style>