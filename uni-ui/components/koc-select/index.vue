<template>
	<view class="koc-select-view">
		<view :class="wrapClass" @click="openPicker">
			<!-- #ifdef H5 -->
			<view class="u-abso" style="width:80%;height:100%;z-index:99"></view>
			<!-- #endif -->
			<u--input :placeholder="placeholder" border="none" :value="selectLabel" readonly clearable
				placeholderStyle="color:#ccc;font-size:15px" :customStyle="{ paddingTop: '3px', paddingBottom: '3px',zIndex:0 }">
				<view slot="suffix" class="append-icon u-flex">
					<view v-if="!selectLabel" class="right-arrow" :class="{ isRotate: show }">
						<u-icon name="arrow-down" color="#999" size="16"></u-icon>
					</view>
					<view v-else @click.stop="clearValue">
						<u-icon name="close-circle" color="#999" size="18" v-if="!disableds">{{modelValue}}</u-icon>
					</view>
				</view>
			</u--input>
		</view>
		<RemoteSelect v-if="filterable" closeOnClickOverlay @close="closePicker" :show="show" :columns="[list]"
			:remote="remote" @confirm="confirmValue" @cancel="cancelPicker" @remote="$emit('remote', $event)"
			keyName="label" :visibleItemCount="visibleItemCount"></RemoteSelect>
		<u-picker v-else closeOnClickOverlay @close="closePicker" :show="show" :columns="[list]" @confirm="confirmValue"
			@cancel="cancelPicker" keyName="label" :visibleItemCount="visibleItemCount"></u-picker>
	</view>
</template>

<script>
	import RemoteSelect from "./remote-select.vue";
	export default {
		components: {
			RemoteSelect
		},
		name: "koc-select",
		data() {
			return {
				show: false,
			};
		},
		props: {
			placeholder: {
				type: String,
				default: () => "请选择",
			},
			value: String | Number,
			list: {
				type: Array,
				default: () => [],
			},
			remote: {
				type: Boolean,
				default: false,
			},
			filterable: {
				type: Boolean,
				default: false,
			},
			visibleItemCount: {
				type: Number,
				default: 5,
			},
			border: {
				type: Boolean,
				default: true,
			},
			disableds: {
				type: Boolean,
				default: false,
			},
		},
		computed: {
			modelValue: {
				get() {
					return this.value;
				},
				set(val) {
					this.$emit("input", val);
				},
			},
			selectLabel() {
				if (!this.value) return null;
				let item = this.list.find((i) => i.value == this.value);
				return item?.label;
			},
			wrapClass() {
				const classNams = ["u-flex", "u-row-center", "like-uni-date-editor",'u-rela'];
				if (this.border) {
					classNams.push("u-border");
				}
				return classNams;
			},
		},
		methods: {
			closePicker() {
				this.show = false;
			},
			openPicker() {
				//   console.log("sjdskdjskdksj", this.list);
				//   this.$refs.uPicker.setColumns(this.list)
				if (!this.disableds) {
					this.show = !this.show;
				}
			},
			clearValue() {
				this.modelValue = null;
				this.$emit("change", null);
			},
			cancelPicker() {
				this.show = false;
			},
			confirmValue({
				index,
				value
			}) {
				this.$emit("bloggeraccountChange", value);
				const oldValue = this.modelValue;
				let item = value[0];
				this.show = false;
				if (!item) return;
				this.modelValue = item.value;
				if (this.modelValue !== item.value)
					this.$emit("change", item.value, item);
				//   console.log(value);
			},
		},
	};
</script>

<style lang="scss" scoped>
	.koc-select-view {
		display: flex;
		flex-direction: column;
		background-color: #ffffff;
	}

	.append-icon {
		height: 30px;
	}

	.right-arrow {
		&.isRotate {
			transform: rotate(180deg);
		}

		transition: transform 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
	}

	.like-uni-date-editor {
		box-sizing: border-box;
		border-radius: 4px;
		// border: 1px solid transparent;
		padding: 0 10px 0 18px;
		color: #666;
		font-size: 14px;
	}
</style>