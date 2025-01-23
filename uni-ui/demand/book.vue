<template>
	<view class="book-page">
		<view class="top-area">
			<view class="top-area--navbar u-flex-row u-col-center u-p-x-28 u-p-y-16">
				<u--image :src="`${static_path}circular_back_loukong.png`" width="48rpx" height="48rpx"
					@click="goBack"></u--image>
				<text class="color-text-white u-font-32 u-line-h-48 u-m-l-16">版权书库</text>
			</view>
			<u--image :src="`${static_path}book_bg.png`" width="750rpx" height="360rpx"></u--image>
			<view class="top-area--tab u-p-t-28 u-p-x-28">
				<BaseSkeleton v-if="tabLoading" round="16rpx" />
				<u-tabs v-else :list="tabList" @click="onTabClick"></u-tabs>

				<u-search height="20rpx" class="u-m-t-32" v-model.trim="keyword" shape="square" :showAction="false"
					bgColor="#ffffff" searchIconColor="#1a1a1a" placeholderColor="#989898" placeholder="请输入书名查找，支持模糊搜索"
					@search="fetchData" @clear="fetchData"></u-search>
			</view>
		</view>
		<view class="book-page--content">
			<view v-if="listData.length" class="book-list u-p-x-28">
				<view v-for="(item, index) in listData" :key="index"
					class="book-list-item u-border-radius u-p-24 u-bg-f u-m-b-32 u-flex-row u-col-top">
					<u--image :src="item.cover_url" width="148rpx" height="204rpx" radius="8rpx"
						class="u-m-r-24"></u--image>
					<view class="item-info u-flex-col u-row-center">
						<text class="u-font-28 u-font-bold u-line-h-44 color-text-black u-m-b-16">{{ item.name }}</text>
						<view class="tag-area u-flex-row u-col-center scroll-x u-m-b-16">
							<view
								class="tag-item tag-primary u-p-y-4 u-p-x-16 color-text-primary u-font-22 u-line-h-40 u-m-r-16">
								{{ `作者·${item.author}` }}
							</view>
							<view v-if="item.category_name"
								class="tag-item tag-orange u-p-y-4 u-p-x-16 color-text-orange u-font-22 u-line-h-40">
								{{ item.category_name }}
							</view>
						</view>
						<u-read-more ref="uReadMore" showHeight="80rpx" toggle fontSize="20rpx"
							closeText="查看更多">{{ item.brief || "暂无简介" }}</u-read-more>
					</view>
				</view>
			</view>
			<view v-if="!loading && !listData.length" class="empty-box" style="padding-top: 284rpx">
				<u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
			</view>
			<u-loadmore v-if="!loading && listData.length > 0" :status="status" :loading-text="loadingText"
				:loadmore-text="loadmoreText" :nomore-text="nomoreText"></u-loadmore>
		</view>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import MyNavbar from "@/components/my-navbar/index.vue";
	import BaseSkeleton from "@/components/base-skeleton/index.vue";
	import {
		getBookList
	} from "./api/book.js";
	import {
		getLibrarySelect
	} from "@/api/public.js";
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
			MyNavbar,
			BaseSkeleton,
		},
		data() {
			return {
				isEnd: false,
				page: 1,
				pagesize: 20,
				loading: false,
				site: null,
				tabLoading: false,
				status: "loadmore",
				loadingText: "努力加载中",
				loadmoreText: "下拉加载更多",
				nomoreText: "没有更多了～",

				keyword: "",
				listData: [],
				tabList: [],
				type: 0,
			};
		},
		computed: {
			...mapGetters(["static_path", "image"]),
		},
		methods: {
			init() {
				this.isEnd = false;
				this.getTypeList();
				this.getListData(true);
			},
			fetchData() {
				this.isEnd = false;
				this.getListData(true);
			},
			onTabClick(obj) {
				this.type = obj.value;
				this.isEnd = false;
				this.getListData(true);
			},

			getTypeList() {
				this.tabLoading = true;
				getLibrarySelect({
						type: 1
					})
					.then((res) => {
						if (res.code == 0) {
							this.tabList = [{
								name: "全部",
								value: 0
							}, ...res.data];
						}
					})
					.catch((error) => {
						this.toastMsg(error.message || error, "error");
					})
					.finally(async () => {
						await sleep(300);
						this.tabLoading = false;
					});
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
					pagesize: this.pagesize,
					keyword: this.keyword || undefined,
					type: this.type || undefined,
				};
				params.page = this.page;
				this.toastMsg("加载中", "loading", -1);
				getBookList(params)
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

			goBack() {
				uni.navigateBack({
					delta: 1,
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
		onLoad() {
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
	.book-page {
		min-height: 100vh;

		.top-area {
			z-index: 999;
			width: 750rpx;
			position: sticky;
			top: 0;

			.top-area--navbar {
				position: absolute;
				/* #ifdef APP */
				top: 100rpx;
				/* #endif */
				/* #ifndef APP */
				top: 0;
				/* #endif */
				left: 0;
				width: 100%;
				z-index: 99;
			}

			.top-area--tab {
				border-top-left-radius: 24rpx;
				border-top-right-radius: 24rpx;
				position: relative;
				top: -34rpx;
				background: #f6f7fb;
			}
		}

		.bool-page--content {
			background: #f6f7fb;
		}
	}

	.tag-primary {
		background: #ecf4ff;
		border-radius: 100px;
	}

	.tag-orange {
		background: #fff5ee;
		border-radius: 100px;
	}

	.skeleton-box,
	.book-list,
	.empty-box {
		transition: all 0.3s ease;
	}

	::v-deep .u-search .u-search__content {
		border-radius: 16rpx !important;
		padding: 16rpx 24rpx;
	}

	::v-deep .u-tabs__wrapper__nav .u-tabs__wrapper__nav__item {
		height: 60rpx !important;
	}

	::v-deep .u-tabs__wrapper__nav__line {
		bottom: -2rpx !important;
	}

	::v-deep .u-read-more__toggle {
		padding-top: 45rpx !important;
		margin-top: -45rpx !important;
	}

	::v-deep .uicon-arrow-down {
		opacity: 0;
	}

	::v-deep .uicon-arrow-up {
		opacity: 0;
	}

	::v-deep .u-read-more__toggle__text {
		height: 8rpx !important;
	}
</style>