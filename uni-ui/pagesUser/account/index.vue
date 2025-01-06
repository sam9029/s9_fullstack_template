<template>
	<view class="account u-vh-100 u-flex-col">
		<view v-if="accountList.length" class="account-list-box u-p-l-24 u-p-r-24">
			<u-list @scrolltolower="scrolltolower">
				<u-list-item v-for="(item, index) in accountList" :key="index">
					<view class="u-bg-f u-border-radius u-m-t-28">
						<view
							class="account-top-card u-bg-primary u-flex u-row-between u-p-l-28 u-p-r-28 u-p-t-16 u-p-b-16">
							<view class="u-flex">
								<view class="u-line-1 u-font-md color-text-white u-font-bold" style="max-width: 260rpx">
									<text>{{ item.platform_account_name }}</text>
								</view>
								<view class="u-font-xs color-text-white u-m-l-5">
									<text>(粉丝数：{{ item.fan_counts }})</text>
								</view>
							</view>
							<view class="edit-btn" style="width: 96rpx; height: 42rpx">
								<u-button type="default"
									class="color-text-primary u-bg-f u-p-l-24 u-p-r-24 u-font-24 u-font-weight"
									text="修改" @click="toEdit(item.id)"></u-button>
							</view>
						</view>
						<view class="account-card u-m-t-24 u-m-l-28 u-m-r-24 u-p-24 u-border u-border-radius u-flex-row"
							:class="{
                'u-col-top': item.xingtu_id,
                'u-col-center': !item.xingtu_id,
              }">
							<view class="u-border-radius scroll-none" style="width: 78rpx; height: 78rpx">
								<u--image :src="item.platform_icon" mode="widthFix" width="78rpx"
									height="78rpx"></u--image>
							</view>
							<view class="u-m-l-16 u-flex-1">
								<view class="widthAll heightAll u-flex-col u-row-between">
									<view class="u-flex">
										<view class="tag u-font-20 u-flex u-row-center">
											<text>{{ item.category_name }}</text>
										</view>
										<view class="u-flex-1 u-m-l-10 u-font-24 u-flex u-row-left u-text-main">
											<view>
												{{
                          item.platform_name == "不限"
                            ? "账号"
                            : item.platform_name == "其他"
                            ? "账号"
                            : item.platform_name + "号"
                        }}：
											</view>
											<view class="u-line-1" style="max-width: 280rpx">
												{{ item.platform_account_id }}
											</view>
										</view>
									</view>
									<view v-if="item.xingtu_id" class="color-text-less-grey u-font-22 u-line-h-40">
										{{ `星图ID: ${item.xingtu_id}` }}
									</view>
									<view class="u-line-1 u-font-xs color-text-less-grey">
										<text>主页：{{ item.home_page_url }}</text>
									</view>
								</view>
							</view>
						</view>
						<view class="u-m-l-28 u-m-r-28 u-m-b-16 u-m-t-16 u-flex u-row-between">
							<view class="color-text-less-grey u-font-xs">
								<text>添加时间：2024-06-12 13:32:32</text>
							</view>
							<view class="u-flex u-row-center" @click="
                  showDeleteModal = true;
                  delId = item.id;
                ">
								<u-icon name="trash" color="#92959A" size="32rpx"></u-icon>
							</view>
						</view>
					</view>
				</u-list-item>
				<u-loadmore v-if="accountList.length > 0" :status="status" :loading-text="loadingText"
					:loadmore-text="loadmoreText" :nomore-text="nomoreText"></u-loadmore>
				<view class="bottom-button widthAll" style="height: 200rpx"></view>
			</u-list>
		</view>
		<view v-else class="account-list-box u-flex u-row-center">
			<u-empty text="暂无账号,请前往添加!" :icon="'https://cdn.uviewui.com/uview/empty/history.png'"></u-empty>
		</view>
		<u-loadmore v-if="!listLoading && accountList.length > 0" :status="status" :loading-text="loadingText"
			:loadmore-text="loadmoreText" :nomore-text="nomoreText"></u-loadmore>
		<BottomBtn :data="button_list" :buttonIndex="0" @submit="toEdit"></BottomBtn>
		<u-modal :show="showDeleteModal" :title="title" :content="content" :showConfirmButton="true"
			:showCancelButton="true" :closeOnClickOverlay="true" @close="showDeleteModal = false"
			@cancel="showDeleteModal = false" @confirm="deleteAccount"></u-modal>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import {
		mediaAccountList,
		deleteMediaAccount
	} from "../api/mediaAccount.js";
	import BottomBtn from "@/components/bottom-button/index.vue";
	export default {
		components: {
			BottomBtn,
		},
		data() {
			return {
				platform_id: "",
				accountList: [],
				showDeleteModal: false,
				title: "温馨提示",
				content: "删除后无法恢复，确认删除吗？",
				listLoading: false,
				isEnd: false,
				status: "loadmore",
				loadingText: "努力加载中",
				loadmoreText: "下拉加载更多",
				nomoreText: "没有更多了～",
				pagination: {
					pagesize: 10,
					next_page_site: "",
					page: 1,
				},
				delId: null,
			};
		},
		computed: {
			button_list() {
				return [
					[{
						text: "添加账号",
						shape: "square",
						type: "primary",
						onClick: "submit",
						btnType: "button",
					}, ],
				];
			},
		},
		methods: {
			scrolltolower() {
				this.getAccountList();
			},
			getAccountList(reset = false) {
				if (this.listLoading) return;
				if (!reset && this.isEnd) return;

				if (reset) {
					this.pagination.page = 1;
				} else {
					this.pagination.page += 1;
				}

				let params = {
					pagesize: this.pagination.pagesize,
					page: this.pagination.page,
				};

				if (this.platform_id) {
					params["platform_id"] = this.platform_id;
				}

				this.loadmoreText = `努力加载中`;
				this.status = "loading";
				this.toastMsg('加载中', 'loading', -1)
				mediaAccountList(params)
					.then((res) => {
						console.log(res);
						if (res && res.code === 0) {
							let list = res.data.list || [];
							if (reset) this.accountList = list;
							else this.accountList.push(...list);

							this.isEnd = list.length < this.pagination.pagesize;

							if (this.isEnd) {
								this.nomoreText = `没有更多了~`;
								this.status = "nomore";
							} else {
								this.loadmoreText = `加载更多`;
								this.status = "loadmore";
							}
							this.listLoading = false;
						}
					})
					.catch((err) => {
						this.toastMsg(err, 'error')
						this.accountList = [];
						this.listLoading = false;
					})
					.finally(() => {
						this.$refs.toastRef?.close();
						uni.stopPullDownRefresh();
					})
			},

			deleteAccount() {
				deleteMediaAccount({
						ids: [this.delId],
					})
					.then((res) => {
						if (res && res.code === 0) {
							this.toastMsg("删除成功", 'success');
							this.getAccountList(true);
						}
					})
					.catch((err) => {
						this.toastMsg(err, 'error')
					});
				this.showDeleteModal = false;
			},
			toEdit(id) {
				let params = {};
				if (this.platform_id) {
					params["platform_id"] = this.platform_id;
				}
				if (typeof(id) == "number") {
					params['id'] = id;
				}
				uni.$u.route({
					url: "/pagesUser/account/addAccount",
					params: params,
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
		onLoad(options) {
			this.platform_id = options.platform_id || null;
		},
		onPullDownRefresh() {
			this.getAccountList(true)
		},
		onShow() {
			this.getAccountList(true);
		},
	};
</script>

<style lang="scss">
	.account {
		font-family: PingFang SC;

		.account-list-box {
			flex: 1;
		}

		.account-top-card {
			border-top-left-radius: 16rpx;
			border-top-right-radius: 16rpx;
		}

		.account-card {
			background-color: $u-bg-color;

			.tag {
				padding: 0rpx 8rpx;

				border-radius: 8rpx;
				border: 1rpx solid $u-primary;
				color: $u-primary;
				background-color: $u-primary-light;
			}
		}
	}

	::v-deep .edit-btn {
		.u-button {
			width: 100% !important;
			height: 100% !important;
			border-radius: 42rpx;
		}

		.u-button__text {
			font-size: 22rpx !important;
		}
	}
</style>