<template>
	<view class="base-picker" v-if="show">
		<u-popup round="16" :show="show">
			<view class="u-p-28 u-flex-col" style="height: 500rpx">
				<view v-if="title.length" class="u-flex u-row-between u-col-center">
					<text class="u-font-32 u-font-weight color-text-black u-m-r-16" style="flex: 1;">{{title}}</text>
					<u-icon name="close-circle-fill" size="48rpx" color="#ffffff"></u-icon>
				</view>
				<!-- #ifndef MP-WEIXIN -->
				<picker-view style="flex: 1;" :value="select_index" @change="changePicker">
					<template v-if="customCols">
						<slot></slot>
					</template>
					<template v-else>
						<picker-view-column>
							<view v-for="item in items" :key="item.value" class="picker-item color-text-black">
								{{ item.name }}
							</view>
						</picker-view-column>
					</template>
				</picker-view>
				<!-- #endif -->
				<!-- #ifdef MP-WEIXIN -->
				<picker-view style="flex: 1;" :value="select_index" @change="changePicker" style="height: 480rpx">
					<picker-view-column>
						<view v-for="item in items" :key="item.value" class="picker-item color-text-black">
							<text class="u-font-28" style="color: #2a2a2a">{{
                item.name
              }}</text>
							<text v-if="needTip && item.value == site" class="u-font-28 u-m-l-16"
								style="color: #5ac725">推荐</text>
						</view>
					</picker-view-column>
				</picker-view>
				<!-- #endif -->
				<view class="u-flex-row u-col-center u-row-between u-m-b-32">
					<text class="u-font-28 u-font-weight color-text-less-grey" style="flex: 1;text-align: center;"
						@click="close">取消</text>
					<view style="width: 2rpx;height: 32rpx;background-color: #eee; border-radius: 2rpx;"></view>
					<text class="u-font-28 u-font-weight color-text-primary" style="flex: 1;;text-align: center;"
						@click="confirm">确认</text>
				</view>
			</view>
		</u-popup>
	</view>
</template>

<script>
	import eventBus from "@/utils/eventBus.js";

	export default {
		name: "base-picker",
		props: {
			items: {
				type: Array,
				default: () => [], // { name: '', value: '' }
			},
			customCols: {
				type: Boolean,
				default: false,
			},
			needTip: {
				type: Boolean,
				default: true,
			},
			site: {
				type: String,
				default: "",
			},
			value: {
				type: String | Number,
				default: "",
			},
			title: {
				type: String,
				default: "",
			}
		},
		computed: {
			select_index() {
				let index = this.items.findIndex((i) => i.value == this.value);
				let select_index = index == -1 ? 0 : index;
				this.currentItem = this.items[select_index];
				return [select_index];
			},
		},
		data() {
			return {
				show: false,
				currentItem: {
					name: "",
					value: ""
				},
				selectIndex: 0,
			};
		},
		methods: {
			open() {

				eventBus.$emit("openNoScroll");
				this.show = true;
			},

			close() {
				this.$emit("close");
				eventBus.$emit("closeNoScroll");
				this.show = false;
			},

			changePicker({
				detail
			}) {
				let index = detail.value?.[0];
				this.currentItem = this.items[index];
			},

			confirm() {
				this.close();
				if (!this.currentItem) return;
				this.$emit("input", this.currentItem?.value);
				this.$emit("change", this.select_index, this.currentItem);
			}
		},
	};
</script>

<style lang="scss" scoped>
	/* #ifdef MP-TOUTIAO */
	picker-view {
		min-height: 300rpx;
	}

	/* #endif */
	.picker-item {
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
	}
</style>