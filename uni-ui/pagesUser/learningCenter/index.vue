<template>
	<view class="page-box u-vh-100 u-p-l-28 u-p-r-28 u-p-b-28">
		<view v-if="listData.length">
			<view class="list-item u-m-t-28 u-p-28 u-border u-border-radius u-bg-f u-flex-col" v-for="item in listData"
				:key="item.id">
				<text class="color-text-black u-font-32 u-font-weight u-m-b-16">{{
          item.name
        }}</text>
				<LearningVideo class="list-item-video" :videoUrl="item.url" :poster="item.cover_url" :name="item.name">
				</LearningVideo>
			</view>
			<u-loadmore :status="loadMoreStatus" @loadmore="loadMoreData" />
		</view>
		<view class="u-flex-col u-h-100 u-col-center u-row-center" v-else>
			<u-empty text="暂无数据" :icon="image.no_data_list"></u-empty>
		</view>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import {
		mapGetters
	} from 'vuex';
	import LearningVideo from "@/pagesUser/components/learningVideo/learningVideo.vue";
	import {
		getCourseList
	} from "../api/learningCenter.js"

	export default {
		components: {
			LearningVideo,
		},
		data() {
			return {
				page: 1,
				pagesize: 10,
				stie: null,
				loadMoreStatus: "more",
				isEnd: false,
				loading: false,
				listData: [],
			};
		},
		computed: {
			...mapGetters(['image'])
		},
		methods: {
			toastMsg(message, type = "default") {
				this.$refs.toastRef?.show({
					type,
					message,
				});
			},
			loadMoreData() {
				uni.$u.throttle(this.getListData(false), 500);
			},
			stopLoad() {
				uni.stopPullDownRefresh();
				this.$refs.toastRef?.close();
				this.loading = false;
			},
			getListData(reset = false) {
				if (this.loading) return; /* 正在加载 */

				if (!reset && this.isEnd) {
					this.stopLoad();
					return;
				}
				if (reset) this.page = 1;
				else this.page += 1;

				this.loading = true;
				this.loadMoreStatus = !reset ? "loading" : "more";

				let params = {
					pagesize: this.pagesize,
					page: this.page,
					catalog_id: 2,
					site: this.stie,
				};
				getCourseList(params)
					.then((res) => {

						let list = res.data.list;
						this.listData = reset ? list : [...this.listData, ...list];
						this.isEnd = list?.length < this.pagesize;
						this.loadMoreStatus = this.isEnd ? "noMore" : "more";
						this.site = res.data.site || null;
						this.stopLoad();
					}).catch((err) => {
						this.stopLoad();
						let message = String(err.message || err || "学习课程获取失败");
						this.toastMsg(message, "error");
					});


			},
		},
		onPullDownRefresh() {
			this.getListData(true);
		},

		onReachBottom(e) {
			this.loadMoreData();
		},
		onLoad() {
			this.safe_bottom = uni.$u.sys().safeAreaInsets?.bottom || 0;
			this.getListData(true);
		},
	};
</script>

<style lang="scss" scoped>
	.page-box {
		.list-item {
			.list-item-video {
				width: 638rpx;
				height: 418rpx;
			}
		}
	}
</style>