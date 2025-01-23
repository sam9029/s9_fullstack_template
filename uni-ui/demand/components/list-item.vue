<template>
	<view class="list-item" @click="cardClick(row)">
		<view v-if="tab === 1" class="u-flex-row u-row-between u-col-center u-p-16 u-bg-f u-border-radius">
			<view class="u-flex-row u-col-center">
				<u--image class="u-m-r-16" :src="row.cover_url" width="168rpx" height="232rpx"
					radius="16rpx"></u--image>
				<view class="item--info u-flex-col u-row-between">
					<view class="u-flex-row u-col-center">
						<u--image class="u-m-r-8" width="32rpx" height="32rpx" radius="8rpx"
							:src="row.advertiser_type_icon"></u--image>
						<text class="color-text-black u-font-28 u-font-bold u-ellipsis"
							style="width: 278rpx">{{ row.book_name }}</text>
					</view>
					<BaseTag showGap>
						<template #front> 连载状态 </template>
						<template #back>
							{{ SERIALIZED_STATUS_MAPPER[row.serialized_status] }}
						</template>
					</BaseTag>
					<BaseTag :showGap="row.join_people_num ? true : false">
						<template #front>
							<text v-if="row.join_people_num">推广人数</text>
							<text v-else>持续推广中</text>
						</template>
						<template #back> {{ row.join_people_num }} </template>
					</BaseTag>
					<BaseTag :showGap="row.max_income ? true : false" type="income">
						<template #front>
							<text v-if="row.max_income">历史最高收益</text>
							<text v-else>收益上涨中</text>
						</template>
						<template #back>
							<text v-if="row.max_income">{{
                unitMoney(row.max_income,false,false) + "元"
              }}</text>
						</template>
					</BaseTag>
				</view>
			</view>
			<view class="item--btn u-flex-row u-col-center u-row-center">
				<text class="color-text-white u-nowrap u-font-24 u-nowrap">推广</text>
			</view>
		</view>
		<view v-if="tab === 2" class="u-flex-row u-row-between u-col-center u-p-16 u-bg-f u-border-radius">
			<view class="u-flex-row u-col-center">
				<u--image class="u-m-r-16" :src="row.cover_url" width="168rpx" height="232rpx"
					radius="16rpx"></u--image>
				<view class="item--info u-flex-col u-row-between">
					<view class="u-flex-row u-col-center">
						<u--image class="u-m-r-8" width="32rpx" height="32rpx" radius="8rpx"
							:src="row.advertiser_type_icon"></u--image>
						<text class="color-text-black u-font-28 u-font-bold u-ellipsis"
							style="width: 278rpx">{{ row.book_name }}</text>
					</view>
					<view class="item--detail-tag u-flex-row u-col-center scroll-x" style="width: 324rpx">
						<BaseTag showGap>
							<template #front> 连载状态 </template>
							<template #back>
								{{ SERIALIZED_STATUS_MAPPER[row.serialized_status] }}
							</template>
						</BaseTag>
					</view>
					<BaseTag>
						<template #front>
							<view v-if="row.plan_num" class="u-flex-row u-col-center">
								<u--image width="32rpx" height="32rpx"
									:src="`${static_path}icon_plan_mark.png`"></u--image>
								<text class="u-m-l-8 u-line-h-40 u-font-24">{{ `推广计划: ${row.plan_num}` }}</text>
							</view>
							<text v-else>持续推广中</text>
						</template>
					</BaseTag>
					<BaseTag :showGap="row.income ? true : false" type="income">
						<template #front>
							<text v-if="row.income" class="u-line-h-40 u-font-24">我的收益</text>
							<text v-else class="u-line-h-40 u-font-24">收益上涨中</text>
						</template>
						<template #back>
							<text v-if="row.income"
								class="u-line-h-40 u-font-24">{{ unitMoney(row.income,false,false)+ "元" }}</text>
						</template>
					</BaseTag>
				</view>
			</view>
			<view class="item--btn u-flex-row u-col-center u-row-center">
				<text class="color-text-white u-nowrap u-font-24 u-nowrap">推广</text>
			</view>
		</view>
		<view v-if="tab == 3" class="u-p-16 u-bg-f u-border-radius u-relative">
			<view class="u-flex-row u-col-center">
				<u--image class="u-m-r-16" width="168rpx" height="232rpx" radius="16rpx"
					:src="row.cover_url"></u--image>
				<view class="item--info u-flex-col u-row-between">
					<view class="u-flex-row u-col-center u-m-b-16">
						<view class="u-flex-row u-col-center" style="
                background-color: #f6f6f6;
                border-radius: 8rpx;
                padding: 0 8rpx;
              ">
							<u--image class="u-m-r-8" width="28rpx" height="28rpx" radius="8rpx"
								:src="row.platform_icon"></u--image>
							<text class="u-font-20">{{ row.type_name }}</text>
						</view>
						<text class="color-text-black u-m-l-8 u-font-28 u-font-bold u-ellipsis"
							style="width: 338rpx">{{ row.name }}</text>
					</view>
					<view class="u-flex-row u-col-center u-m-b-16">
						<u--image class="u-m-r-8" width="32rpx" height="32rpx" radius="8rpx"
							:src="row.advertiser_type_icon"></u--image>
						<text class="color-text-black u-m-l-8 u-font-24 u-ellipsis"
							style="width: 438rpx">{{ row.book_name }}</text>
					</view>
					<view class="price-area">
						<view class="u-flex-1 u-flex-col u-col-center">
							<text class="u-font-28 u-font-bold">
								{{getResult1(row)}}
							</text>
							<text class="u-font-22">{{`${row.charge_data?'充值金额':'CPM收益'}`}}</text>
						</view>
						<view class="gap-line"></view>
						<view v-if="row.charge_data&&row.cpm_data" class="u-flex-1 u-flex-col u-col-center">
							<text class="u-font-28 u-font-bold">
								{{ unitMoney(row.charge_data.total_price,false,false)}}
							</text>
							<text class="u-font-22">CPS预估收益</text>
						</view>
						<view v-if="row.charge_data&&row.cpm_data" class="gap-line"></view>
						<view v-if="row.charge_data" class="u-flex-1 u-flex-col u-col-center">
							<text class="u-font-28 u-font-bold">
								{{getResult2(row)}}
							</text>
							<text class="u-font-22">{{`${row.cpm_data?'CPM收益':'CPS预估收益'}`}}</text>
						</view>
						<view v-if="!row.charge_data" class="u-flex-1 u-flex-col u-col-center">
							<text class="u-font-22">- -</text>
						</view>
					</view>
				</view>
			</view>
			<view class="u-flex-row u-row-between u-col-center u-m-t-16">
				<text class="color-text-less-grey u-font-24">{{
          row.create_time
        }}</text>
				<view class="item--btn u-flex-row u-col-center u-row-center" :class="{ 'item--btn-check': row.type == 3 && row.self_operated==1&&row.verify_status==4 }" :style="{opacity: row.type == 3 && row.self_operated==1&&(row.verify_status!=3&&row.verify_status!=4)?0.5:1,}">
					<text
						class="color-text-white u-nowrap u-font-24 u-nowrap u-p-l-24 u-p-r-24" :class="{ 'color-text-black': row.type == 3 && row.self_operated==1&&row.verify_status==4 }">{{row.type == 3 && row.self_operated==1&&row.verify_status==4?'查看原因':row.button_text }}</text>
				</view>
			</view>
			<u-icon v-if="row.type==3&&row.self_operated==1" :name="`${static_path}${getDisplayLabel(row)}.png`"
				width="80rpx" height="80rpx" class="u-absolute" style="top: 0rpx; right: 0rpx;"></u-icon>
		</view>
	</view>
</template>

<script>
	import BaseTag from "@/components/base-tag/index.vue";
	import PromotionTaskPropup from '@/components/promotion-popup/promotion-task-popup.vue'
	import {
		SERIALIZED_STATUS_MAPPER,
		PLAN_TYPE_MAPPER,
		BTN_TYPE_MAPPER,
	} from "@/utils/mappers/demand.js";
	import {
		postWxUrl
	} from "../api/index.js";
	import {
		copy,
		unitMoney
	} from "@/utils/tools.js";
	import {
		mapGetters
	} from "vuex";
	export default {
		options: {
			styleIsolation: "shared",
		},
		props: {
			row: {
				type: Object,
				default: () => ({}),
			},
			tab: {
				type: Number,
				default: 1,
			},
		},
		components: {
			BaseTag,
		},
		data() {
			return {
				SERIALIZED_STATUS_MAPPER,
				PLAN_TYPE_MAPPER,
				BTN_TYPE_MAPPER,
			};
		},
		computed: {
			...mapGetters(['static_path']),
		},
		methods: {
			unitMoney,
			//生成微信链接
			async generateWxUrl(drama_plan_id) {
				try {
					const res = await postWxUrl({
						drama_plan_id
					});
					if (res && res.code === 0) {
						this.$emit("refresh");
					}
				} catch (error) {
					this.$emit("toast", {
						message: error.message || error,
						type: "error"
					});
				}
			},
			getDisplayLabel(row) {
				const statusMap = {
					3: "icon_audit_status_success",
					4: "icon_audit_status_fail"
				};
				return statusMap[row.verify_status] || "icon_audit_status_ing";
			},
			getResult1(row) {
				return row.charge_data ? unitMoney(row.charge_data.charge_price, false, false) : unitMoney(row.cpm_data
					?.total_price, false, false);
			},
			getResult2(row) {
				return row.cpm_data ? unitMoney(row.cpm_data.total_price, false, false) : unitMoney(row.charge_data
					?.total_price, false, false);
			},
			cardClick(row) {
				if (this.tab == 3) {
					switch (row.button_type) {
						case 1: // 生成链接
							if (row.type === 5) {
								// 调用微信生成链接
								if (wx_share_info && wx_share_info.article_url) {
									copy({
										content: row.wx_share_info.article_url
									}, this);
								} else {
									this.generateWxUrl(row.id);
								}
							}
							break;

						case 2: // 复制链接
							if (row.type === 4) {
								// 复制私域链接
								copy(row.private_link);
							} else if (row.type === 5) {
								// 复制微信视频号链接
								copy({
									content: row.wx_share_info.article_url
								}, this);
							}
							break;

						case 3: // 复制口令
							
							if (row.type === 3) {
								if(row.self_operated==1){
									switch(row.verify_status){
										case 3 :
										copy({
											content: row.search_code
										}, this);
										break
										case 4:
										this.$emit("des", {
											message: row.verify_suggest,
										});
										break
										default:
										this.$emit("toast", {
											message: "口令审核中，待通过后可进行复制",
											type: "error"
										});
										break
									}
									
								}else{
									copy({
										content: row.search_code
									}, this);
								}
							}
							break;

						case 4: // 立即推广
							if (row.type === 1 || row.type === 2) {
								// 唤醒app
								const data = {
									scheme: row.publish_info?.schema_url ?? "",
									platformType: row.platform_id == 2 ? 2 : 1
								};
								if (row.publish_info?.show_qr) {
									data.qrcode = row.publish_info?.qr_url ?? ""
								}
								this.$emit("actionData", data)
							}
							break;

						case 5: // 保存二维码
							if (row.type === 6) {
								// 获取二维码链接进行展示保存等操作
								const data = {
									qrcode: row.qr_link ?? "",
								};
								this.$emit("actionData", data)
							}
							break;
					}
				} else {
					uni.navigateTo({
						url: `/demand/detail?platform_id=${row.platform_id}&content_id=${row.content_id}&relation_id=${row.relation_id}&advertiser_type=${row.advertiser_type}`,
					});
				}
			},
		},
	};
</script>

<style lang="scss" scoped>
	.list-item {
		.item--info {
			height: 232rpx;
		}

		.item--btn {
			min-width: 96rpx;
			height: 48rpx;
			background-color: #408cff;
			border-radius: 50rpx;
		}
		.item--btn-check {
			min-width: 96rpx;
			height: 48rpx;
			background-color: #F6F6F6;
			border-radius: 50rpx;
		}
		.price-area {
			display: flex;
			justify-items: center;
			align-items: center;
			border-radius: 12rpx;
			border: 1rpx solid #ff7736;
			background-color: $u-orange-1;
			padding: 16rpx 0;
			color: #ff7736;

			.gap-line {
				border-left: 1rpx solid #c6c6c6;
			}
		}
	}
</style>