<template>
	<view class="novel-page-box u-vh-100">
		<saveQrCode :title="qrItem.title" :qrUrl="qrItem.qrUrl" ref="qrCodeRef"></saveQrCode>
		<view class="top-navbar-box" :class="{ 'top-navbar-box-bg': bg_active }" id="top-navbar-box">
			<view class="top_status widthAll"></view>
			<view class="top-navbar-header widthAll u-flex-row u-flex-start u-p-t-16 u-p-b-16 u-p-l-28 u-p-r-28">
				<view class="top-navbar-icon u-flex-col u-row-center u-col-center u-bg-f u-m-r-16">
					<u-icon name="arrow-left" color="#1A1A1A" size="24rpx" @click="goBack" bold></u-icon>
				</view>

				<text class="top-navbar-text u-font-32 color-text-black">{{
          pageTitle
        }}</text>
			</view>
		</view>

		<view class="top-box" id="top-box">
			<view class="top-bg u-flex-col u-row-right u-p-l-28 u-p-r-28"
				:style="{ backgroundImage: 'url(' + pageBg + ')' }">
				<text class="top-bg-title">千粉推广</text>
				<text class="top-bg-title u-m-t-28 u-m-b-16">官方任务不限流</text>
				<text class="u-m-b-16 u-font-24 color-text-less-grey">{{
          pageDes
        }}</text>
			</view>
			<view class="task-title-num u-m-t-40 u-p-l-28 u-m-b-28 u-p-r-28 widthAll">
				<text class="u-font-32 color-text-black">{{ taskCountTitle }}</text>
			</view>
		</view>

		<view v-if="listData.length > 0" class="task-list u-flex-col u-gap-16">
			<view v-for="item in listData" :key="item.advertiser_id"
				class="novel-list-item u-flex-col u-p-24 u-bg-f u-border-radius u-p-24">
				<view class="novel-list-item-top u-flex">
					<view class="novel-list-item-top-left u-flex-col  heightAll">
						<text
							class="novel-list-item-top-left-title u-font-28 u-font-weight color-text-black">{{ item.qr_name || item.task_name}}</text>
						<text class="u-font-22 color-text-grey">{{
              `投稿时间： ${item.start_date} - ${item.start_date}`
            }}</text>
					</view>
					<view class="novel-list-item-top-space u-m-l-16 u-m-r-16"> </view>
					<view class="novel-list-item-top-right">
						<image class="widthAll heightAll" :src="item.cover_url"></image>
					</view>
				</view>
				<view class="novel-list-item-bottom u-flex-row u-col-bottom">
					<text class="novel-list-item-bottom-title u-font-24 color-text-orange">{{ item.price_title }}</text>
					<text class="novel-list-item-bottom-price u-font-48 color-text-orange">{{ item.price }}</text>
					<button
						class="novel-list-item-bottom-savebtn u-m-l-16 u-m-r-16 u-font-24 u-p-t-4 u-p-b-4 u-p-l-24 u-p-r-24"
						@click="saveQrCode(item)">
						保存二维码
					</button>
					<button
						class="novel-list-item-bottom-addbtn u-p-t-4 u-p-b-4 u-p-l-24 u-p-r-24 u-font-24 color-text-white u-bg-primary"
						@click="addTask(item)">
						立即参与
					</button>
				</view>
			</view>
		</view>
		<view v-else class="u-m-t-100">
			<u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
		</view>
		<u-loadmore v-if="listData.length > 0" :status="status" :loading-text="loadingText"
			:loadmore-text="loadmoreText" :nomore-text="nomoreText" />

		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import {
		getJuXingTaskList,
		getXingTuTaskList
	} from "./api/index.js";
	import saveQrCode from "@/components/save-qr-with-canvas/index.vue";
	import { mapGetters } from "vuex";
	export default {
		components: {
			saveQrCode,
		},
		data() {
			return {
				pageType: "1",
				/* 页面类型，1：巨量星图 2：磁力聚星  3：星广联投 */
				pageTitle: "巨量星图",
				/* 页面名称*/
				pageBg: "",
				pageDes: "",
				taskCount: 0,
				/* 任务数量 */

				status: "loadmore",
				loadingText: "努力加载中",
				loadmoreText: "下拉加载更多",
				nomoreText: "没有更多了～",
				isEnd: false,
				page: 1,
				pagesize: 10,
				loading: false,
				site: null,
				bg_active: false,

				listData: [],
				qrItem: {
					title: "",
					qrUrl: "",
				},
			};
		},
		computed: {
			...mapGetters(['static_path', 'image']),
			taskCountTitle() {
				return this.taskCount > 0 ?
					"任务列表（" + this.taskCount + "）" :
					"任务列表";
			},
		},
		onLoad(options) {
			this.pageType = options["pagetype"] || "1";
			if (this.pageType == "2") {
				this.pageTitle = "磁力聚星";
				this.pageBg = `${this.static_path}novel_task_dy_bg.png`;
				this.pageDes = "快手首页扫码参与或直接参与任务投稿";
			} else if (this.pageType == "3") {
				this.pageTitle = "星光联投";
				this.pageBg = `${this.static_path}novel_task_ks_bg.png`;
				this.pageDes = "快手首页扫码参与或直接参与任务投稿";
			} else {
				this.pageTitle = "巨量星图";
				this.pageBg = `${this.static_path}novel_task_dy_bg.png`;
				this.pageDes = "抖音首页扫码参与或直接参与任务投稿";
			}
			this.toastMsg("加载中", "loading", -1);

			this.getListData(true);
		},
		onPageScroll(e) {
			this.bg_active = e.scrollTop >= 80;
		},
		onPullDownRefresh() {
			uni.$u.throttle(this.getListData(true), 500);
		},
		onReachBottom() {
			uni.$u.throttle(this.getListData(false), 500);
		},
		methods: {
			toastMsg(message, type = "default") {
				this.$refs.toastRef?.show({
					type,
					message,
				});
			},
			goBack() {
				uni.navigateBack();
			},
			stopLoad() {
				uni.stopPullDownRefresh();
				this.$refs.toastRef?.close();
				this.loading = false;
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
					page: this.page,
				};
				let func = this.pageType == "1" ? getXingTuTaskList : getJuXingTaskList;
				this.toastMsg("加载中", "loading", -1);
				func(params)
					.then((res) => {

						if (res.code == 0) {

							const list = res.data.list.map((el) => {
								return {
									...el,
									price_title: el.policys[0]?.value_desc ?? "--",
									price: el.policys[0]?.value_format ?? 0,
								};
							});


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
						}

					})
					.catch((error) => {
						let message = String(error.message || error || "获取任务列表失败");
						this.toastMsg(message, "error");
					})
					.finally(() => {
						this.stopLoad();
					});
			},

			saveQrCode(item) {
				this.qrItem.qrUrl = item.cover_url;
				this.qrItem.title = item.qr_name || item.task_name;

				this.$nextTick(() => {
					this.$refs.qrCodeRef.saveQRCode();
				});
			},
			addTask(item) {


				// #ifdef APP-PLUS
				plus.runtime.openURL(item.schema_url, function(error) {
					console.error("跳转失败：", error.message);
				});
				// #endif
				// #ifdef H5
				window.open(item.schema_url);
				// #endif
				// #ifdef MP
				uni.setClipboardData({
					data: item.schema_url,
					success: () => {
						uni.hideToast();
						this.$nextTick(() => {
							uni.$u.toast("链接已复制，请在浏览器打开");
						});
					},
				});
				// #endif
			},

			toastMsg(message, type = "default") {
				this.$refs.toastRef?.show({
					type,
					message,
				});
			},
		},
	};
</script>

<style lang="scss" scoped>
	.novel-page-box {
		.top-navbar-box {
			width: 750rpx;
			background-color: transparent;
			z-index: 9999;
			position: fixed;

			.top_status {
				height: var(--status-bar-height);
			}

			.top-navbar-header {
				height: 80rpx;

				.top-navbar-icon {
					border-radius: 24rpx;
					width: 48rpx;
					height: 48rpx;
				}

				.top-navbar-text {
					font-weight: 600;
				}
			}
		}

		.top-navbar-box-bg {
			background-color: white;
		}

		.top-box {
			// position: fixed;

			.top-bg {
				width: 750rpx;
				height: 520rpx;

				/* 让图片铺满整个区域 */
				background-size: cover;
				/* 居中显示背景图片 */
				background-position: center;
				/* 防止图片重复 */
				background-repeat: no-repeat;

				.top-bg-title {
					background: linear-gradient(90deg, #106cff 0%, #00bfff 100%);
					background-clip: text;
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					font-weight: 700;
					font-size: 80rpx;
					line-height: 80rpx;
				}
			}

			.task-title-num {
				height: 48rpx;
			}
		}

		.task-list {
			background-color: #f6f8fb;
			padding: 0 28rpx;

			.novel-list-item {
				row-gap: 16rpx;

				.novel-list-item-top {
					height: 144rpx;

					.novel-list-item-top-left {
						flex: 1;

						.novel-list-item-top-left-title {
							display: -webkit-box;
							-webkit-box-orient: vertical;
							-webkit-line-clamp: 2;
							overflow: hidden;
							text-overflow: ellipsis;
							line-height: 48rpx;
						}
					}

					.novel-list-item-top-space {
						width: 2rpx;
						height: 80rpx;
						background-color: #eee;
						border-radius: 2rpx;
					}

					.novel-list-item-top-right {
						width: 144rpx;
						height: 144rpx;
					}
				}

				.novel-list-item-bottom {
					.novel-list-item-bottom-title {
						line-height: 40rpx;
					}

					.novel-list-item-bottom-price {
						font-weight: 600;
						line-height: 56rpx;
						flex: 1;
					}

					.novel-list-item-bottom-savebtn {
						border-radius: 100rpx;
						border: 2rpx solid #adceff;
						background-color: #ecf4ff;
						color: #408cff;
						line-height: 40rpx;
					}

					.novel-list-item-bottom-addbtn {
						border-radius: 100rpx;
						line-height: 40rpx;
					}
				}
			}
		}
	}
</style>