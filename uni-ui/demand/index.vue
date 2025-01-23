<template>
	<view class="demand-page">
		<view class="top-area">
			<MyNavbar bgColor="transparent" :backShow="false" :rightIcon="`${static_path}close_circle.png`" closeShow>
				<template #navbarData>
					<view class="u-flex-row u-col-center u-p-l-28">
						<u--image class="u-m-r-8" :src="currentPlatform.platform_icon" width="40rpx"
							height="40rpx"></u--image>
						<text class="color-text-black u-font-bold">{{ currentPlatform.platform_name }}</text>
					</view>
				</template>
			</MyNavbar>
			<view class="header-tab u-p-l-28 u-p-r-28 u-m-t-28">
				<view class="tab-item u-font-bold" :class="{ 'tab-item--active': tabIndex === 1 }"
					@click="changeTab(1)">任务列表</view>
				<view class="tab-item u-font-bold" :class="{ 'tab-item--active': tabIndex === 2 }"
					@click="changeTab(2)">我的任务</view>
				<view class="tab-item u-font-bold" :class="{ 'tab-item--active': tabIndex === 3 }"
					@click="changeTab(3)">我的推广</view>
			</view>
			<view class="u-p-l-28 u-p-r-28 u-m-t-48 u-m-b-28">
				<u-search height="20rpx" placeholder="请输入短剧名称查找" v-model="keyword" shape="square" :showAction="false" bgColor="#ffffff"
					searchIconColor="#1a1a1a" placeholderColor="#989898" @search="init" @clear="init"></u-search>
			</view>
		</view>
		<view class="u-p-l-28 u-p-r-28">
			<view v-if="listData.length" class="demand-list u-flex-col">
				<listItem v-for="(item, index) in listData" :key="index"
					:class="{ 'u-m-b-28': index !== listData.length - 1 }" :tab="tabIndex" :row="item"
					@actionData="doPromotion" @refresh="init" @toast="getItemToast" @des="checkReason"></listItem>
			</view>
			<view v-if="!loading && !listData.length" class="u-m-t-100">
				<u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
			</view>
			<u-loadmore v-if="!loading && listData.length > 0" :status="status" :loading-text="loadingText"
				:loadmore-text="loadmoreText" :nomore-text="nomoreText"></u-loadmore>
		</view>
		<base-toast ref="toastRef"></base-toast>
		<PromotionTaskPropup ref="taskPropup" :qrcode="qrcode" :scheme="scheme" :platformType="platformType">
		</PromotionTaskPropup>
		<u-popup :show="showReason" round="16rpx" mode="center">
			<view class="u-p-48" style="width: 520rpx;">
				<view class="u-font-32 u-font-weight u-text-main">审核失败</view>
				<view class="u-m-t-32">
					<text class="u-font-28 color-text-less-black">{{failReason}}</text>
				</view>
				<view class="u-flex-row u-m-t-32">
					<view class="u-font-28 color-text-white u-flex-1"
						style="background: #408CFF; border-radius: 16rpx; line-height: 44rpx; padding-top: 20rpx; padding-bottom: 20rpx; text-align: center;"
						@click="showReason=false">我知道了</view>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	import MyNavbar from "@/components/my-navbar/index.vue";
	import listItem from "./components/list-item.vue";
	import PromotionTaskPropup from "@/components/promotion-popup/promotion-task-popup.vue";
	import {
		sleep
	} from "@/utils/tools.js";

	import {
		getTaskList as taskListReq,
		getMyTaskList as myTaskReq,
		getMyPlanList as myPlanReq,
	} from "./api/index.js";
	import {
		mapGetters
	} from "vuex";
	export default {
		options: {
			styleIsolation: "shared",
		},
		components: {
			listItem,
			MyNavbar,
			PromotionTaskPropup,
		},
		data() {
			return {
				showReason: false,
				failReason: "",
				currentPlatform: {
					advertiser_id: null,
					platform_name: null,
					platform_icon: "",
				},
				isEnd: false,
				page: 1,
				pagesize: 20,
				loading: false,
				site: null,
				status: "loadmore",
				loadingText: "努力加载中",
				loadmoreText: "下拉加载更多",
				nomoreText: "没有更多了～",

				listData: [],
				tabIndex: 1,
				keyword: null,
				qrcode: "",
				scheme: "",
				platformType: 1,
			};
		},
		computed: {
			...mapGetters(["static_path", "image"]),
		},
		methods: {
			init() {
				this.isEnd = false;
				this.getListData(true);
			},
			doPromotion(data) {
				if (data.scheme) {
					this.scheme = data.scheme;
					if (data.qrcode) {
						this.qrcode = data.qrcode;
					}
					this.platformType = data.platformType;
				} else {
					this.qrcode = data.qrcode;
				}
				this.$refs.taskPropup.openPopup();
			},

			getListData(reset = false) {
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
					advertiser_type: this.currentPlatform.advertiser_id,
					platform_id: this.currentPlatform.platform_id,
					pagesize: this.pagesize,
					keyword: this.keyword || undefined,
				};
				params.page = this.page;
				this.toastMsg("加载中", "loading", -1);
				let func = null;
				switch (this.tabIndex) {
					case 1:
						func = taskListReq;
						break;
					case 2:
						func = myTaskReq;
						break;
					case 3:
						func = myPlanReq;
						break;
				}
				func(params)
					.then((res) => {
						const list = res.data.list;
						if (reset) this.listData = list;
						else this.listData.push(...list);
						this.site = res.data.site;
						let bool = !(res.data.list.length < this.pagesize);
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
						uni.stopPullDownRefresh();
						await sleep(300);
						this.loading = false;
					});
			},

			changeTab(index) {
				this.tabIndex = index;
				this.init();
			},
			getItemToast(data) {
				this.toastMsg(data.message, data.type);
			},
			checkReason(data) {
				this.failReason = data.message;
				this.showReason = true;
			},

			// 提示
			toastMsg(message, type = "default", duration = 2000) {
				this.$refs.toastRef?.show({
					type,
					message,
					duration,
				});
			},
		},
		onLoad() {
			const data = JSON.parse(uni.getStorageSync("SET_JUMP_QUERY"));
			Object.assign(this.currentPlatform, data);
			this.init();
		},
		onPullDownRefresh() {
			this.init();
		},
		onReachBottom(e) {
			uni.$u.throttle(this.getListData(), 500);
		},
	};
</script>

<style lang="scss" scoped>
	.demand-page {
		min-height: 100vh;

		.top-area {
			/* #ifdef APP || MP */
			padding-top: 88rpx;
			/* #endif */
			z-index: 999;
			width: 750rpx;
			top: 0;
			position: sticky;
			background: linear-gradient(180deg, #cfe2ff 0%, #f6f7fb 60.27%);
		}

		.header-tab {
			display: flex;
			align-items: center;
			justify-content: space-between;

			.tab-item {
				border-radius: 16rpx;
				padding: 26rpx 52rpx;
				font-size: 28rpx;
				color: #1a1a1a;
				background: linear-gradient(to bottom, #f4f8ff, #ffffff);
				border: 2rpx solid #ffffff;
				white-space: nowrap;
			}

			.tab-item--active {
				color: #ffffff;
				background: #579aff;
				position: relative;
				border: 2rpx solid #579aff;

				&::after {
					content: "";
					position: absolute;
					width: 32rpx;
					height: 8rpx;
					border-radius: 4rpx;
					bottom: -16rpx;
					left: 50%;
					transform: translateX(-50%);
					background: #579aff;
				}
			}
		}

		::v-deep .u-search .u-search__content {
			padding: 16rpx 24rpx !important;
			border-radius: 16rpx !important;
		}
	}
</style>