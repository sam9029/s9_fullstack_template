<template>
	<view class="advertiser-detail-page">
		<view class="u-relative">
			<view class="navbar-box">
				<view class="navbar u-p-x-28 u-p-y-16 widthAll u-relative" style="background: transparent">
					<u-icon name="arrow-left" size="48rpx" @click="goBack"></u-icon>
					<view class="color-text-black u-font-32 u-line-h-48 u-position-center u-font-bold">
						{{ advertiser_name }}
					</view>
				</view>
			</view>
			<!-- Tab切换 -->
			<view class="tab-wrapper u-flex-row u-font-32" :style="{'top': tabWrapperTop}">
				<view v-for="(item, index) in tabs" :key="index" :class="['tab-item', currentTab === index ? 'active' : '']"
					@click="switchTab(index)">
					{{ item }}
				</view>
			</view>
			<PriceCard :currentTab="currentTab" :detailObj="detailObj" :loading="cardLoading" @date="getTopCardDate" />
			<view class="list-top  u-p-x-28 u-m-t-24" :style="{'top': listTop}">

				<view class="u-p-24 u-bg-f" style="border-top-left-radius: 16rpx; border-top-right-radius: 16rpx">
					<view v-show="showTabs" class="list-tab u-m-b-28">
						<view class="tab-item" :class="{ active: activeTab == 0 }" @click="changeTab(0)">
							<text class="u-font-28 u-line-h-44">发布收益</text>
						</view>
						<view class="tab-item" :class="{ active: activeTab == 1 }" @click="changeTab(1)">
							<text class="u-font-28 u-line-h-44">发布佣金</text>
						</view>
					</view>
					<view class="u-flex-row u-col-center">
						<u-search placeholder="请输入计划名或剧集名查询" v-model.trim="keyword" shape="square" :showAction="false" :inputStyle="{
                height: '72rpx',
                'background-color': '#f6f6f6',
              }" clearable @search="resetTable" @clear="resetTable"></u-search>
						<DateFilter class="u-m-l-32" v-if="currentTab == 1" title="请选择查询时间段" baseBtn @submit="getDate" />
					</view>
					<view v-if="currentTab == 1" class="u-flex-row u-row-between u-col-center u-font-24 u-line-h-40 u-m-t-28">
						<text class="color-text-less-grey">查询时间段</text>
						<text class="color-text-less-grey">{{
              this.date.map((el) => el.replace("-", ".")).join("—")
            }}</text>
					</view>
				</view>
			</view>
			<view class="u-p-x-28">
				<view class="u-bg-f" style="min-height: calc(100vh - 918rpx);">
					<listComps v-if="!loading && listData.length" :listData="listData" :type="activeTab"
						:advertiserType="advertiser_type" :static_path="static_path" :date="date" :currentTab="currentTab" />
					<view v-if="!loading && !listData.length" style="padding-top: 100rpx;">
						<u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
					</view>
					<view v-if="!loading && listData.length > 0" class="u-p-b-48">
						<u-loadmore :status="status" :loading-text="loadingText" :loadmore-text="loadmoreText"
							:nomore-text="nomoreText"></u-loadmore>
					</view>
				</view>
			</view>
		</view>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import {
		unitMoney
	} from "@/utils/tools.js";
	import DateFilter from "@/components/base-datepicker/index.vue";
	import PriceCard from "./components/advertiserPriceCard.vue";
	import listComps from "./components/advertiserList.vue";
	import {
		getIncomeList,
		getAdvertiserTotal,
	} from "../api/demand/advertiserDetail.js";
	import {
		sleep
	} from "@/utils/tools.js";
	import {
		mapGetters
	} from "vuex";
	export default {
		options: {
			styleIsolation: "shared",
		},
		components: {
			DateFilter,
			PriceCard,
			listComps,
		},
		data() {
			return {
				tabs: ['待入账', '已入账'],
				currentTab: 0,
				status: "loadmore",
				loadingText: "努力加载中",
				loadmoreText: "下拉加载更多",
				nomoreText: "没有更多了～",
				page: 1,
				pagesize: 20,
				site: null,
				loading: false,
				isEnd: false,

				activeTab: 0,
				keyword: "",
				date: [],
				cardDate: [],
				detailObj: {},
				cardLoading: false,
				listData: [],
				advertiser_type: null,
				advertiser_name: null,

				listTop: 0,
				tabWrapperTop: 0,
			};
		},
		computed: {
			...mapGetters(["static_path", "image"]),
			amount_type() {
				// 1-分发收益 2-分发佣金
				return this.activeTab == 0 ? 1 : 2;
			},
			showTabs() {
				return (
					this.detailObj.amount_types?.length &&
					this.detailObj.amount_types?.length == 2
				);
			},
		},
		methods: {
			unitMoney,
			goBack() {
				uni.navigateBack(-1);
			},
			async computedHeight() {

				const navBoxRect = await this.$u.getRect(`.navbar-box`);
				this.tabWrapperTop = navBoxRect.top + navBoxRect.height + "px";

				const tabBoxRect = await this.$u.getRect(`.tab-wrapper`);
				this.listTop = tabBoxRect.top + tabBoxRect.height + "px";
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
				this.activeTab = 0;
				this.detailObj = {};
				this.listData = [];
				this.init();
			},
			resetTable() {
				this.isEnd = false;
				this.getListData();
			},

			getTopCardDate(date) {
				this.toastMsg("加载中", "loading", -1);
				this.cardDate = date;
				uni.$u.throttle(this.getTopCard(true), 500);
			},

			getTopCard(flag = false) {
				this.cardLoading = true;
				let params = {
					type: 2,
					advertiser_type: this.advertiser_type,
					currentTab: this.currentTab
				};
				if (this.currentTab == 1) {
					params.start_date = this.cardDate[0];
					params.end_date = this.cardDate[1];
				}
				getAdvertiserTotal(params)
					.then((res) => {
						if (res.code == 0) {
							this.detailObj = res.data;
							if (flag) this.$refs.toastRef?.close();
						}
					})
					.catch((error) => {
						this.toastMsg(error.message || error, "error");
					})
					.finally(async () => {
						await sleep(300);
						this.cardLoading = false;
					});
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
					type: 2,
					keyword: this.keyword,
					start_date: this.date[0],
					end_date: this.date[1],
					advertiser_type: this.advertiser_type,
					amount_type: this.amount_type,
					pagesize: this.pagesize,
					currentTab: this.currentTab
				};
				params.page = this.page;
				getIncomeList(params)
					.then((res) => {
						let list = this.currentTab == 0 ? res.data.list : res.data;

						if (reset) this.listData = list;
						else this.listData.push(...list);
						this.site = res.data.site;
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

			getDate(date) {
				this.toastMsg("加载中", "loading", -1);
				this.date = date;
				this.isEnd = false;
				uni.$u.throttle(this.getListData(), 500);
			},

			changeTab(index) {
				this.activeTab = index;
				uni.$u.throttle(this.getListData(), 500);
			},

			toastMsg(message, type = "default", duration = 2000) {
				this.$refs.toastRef?.show({
					type,
					message,
					duration,
				});
			},
		},
		mounted() {
			this.computedHeight();
		},
		onLoad() {
			const {
				advertiser_name,
				advertiser_type
			} = JSON.parse(
				uni.getStorageSync("SET_JUMP_QUERY")
			);
			this.advertiser_name = advertiser_name || "项目名称";
			this.advertiser_type = advertiser_type || null;
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
	.advertiser-detail-page {
		background: linear-gradient(180deg, #d3edff 0%, #f6f7fb 60.27%);
		min-height: 100vh;

		.navbar-box {
			position: sticky;
			top: 0;
			z-index: 100;
			/* #ifdef APP || MP */
			padding-top: 88rpx;
			/* #endif */
			background: linear-gradient(180deg, #d3edff, #d8eefe);

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

		.list-tab {
			display: grid;
			grid-template-columns: repeat(2, 1fr);
			align-items: center;
			height: 92rpx;
			background: $u-grey-3;
			border-radius: 16rpx;

			.tab-item {
				display: flex;
				align-items: center;
				justify-content: center;
				height: inherit;
				color: $u-grey-7;
				background: $u-grey-3;
				transition: all 0.3s ease;
				border-radius: 16rpx;
			}

			.active {
				color: #fff !important;
				background: $u-primary !important;
			}
		}
	}

	::v-deep .u-search {
		height: 72rpx;

		.u-search__content {
			border-radius: 16rpx !important;
			background-color: #f6f6f6 !important;
		}
	}
</style>