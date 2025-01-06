<template>
	<view>
		<MyNavbar>
			<template #navbarData>
				<view class="u-flex-row u-row-center u-col-center">
					<text class="u-text-center u-font-32 color-text-black u-font-bold">意见反馈</text>
				</view>
			</template>
		</MyNavbar>
		<view class="card-bg">
			<view class="u-flex-row u-row-between">
				<text class="u-text-main u-font-24">问题和意见</text>
				<text class="color-text-less-grey u-font-24">{{countNum}}</text>
			</view>
			<u-textarea class="u-m-t-16 u-m-b-32" v-model="feedbackWords" height="288rpx"
				placeholder-style="color:#989898;font-size: 24rpx;" border="none"
				placeholder="请填写问题描述，如功能故障、需求改进、产品吐槽等，我们会努力改进。" @input="countWords" maxlength="200"></u-textarea>
			<text class="u-text-main u-font-24 ">添加问题截图（选填）</text>
			<u-upload class="u-m-t-16 u-m-b-32" :fileList="fileList" :maxCount="3" @afterRead="afterRead"
				@delete="deleteImage" name="images" width="200rpx" height="200rpx" deletable multiple>
				<view class="upload-bg">
					<u-icon label="点击上传截图" space="16rpx" labelSize="24rpx" labelColor="#989898" labelPos="bottom"
						:name="`${static_path}upload_image_icon.png`" width="48rpx" height="48rpx"></u-icon>
				</view>
			</u-upload>
			<text class="u-text-main u-font-24">您的联系电话（选填）</text>
			<u-input type="number" class="u-m-t-16" placeholder="请填写您的联系电话，便于我们与您取得联系"
				placeholder-style="color:#989898;font-size: 24rpx;" border="none" v-model="phone"></u-input>
		</view>
		<BottomBtn :data="buttonList" :buttonIndex="0" @submit="submit" />
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import MyNavbar from "@/components/my-navbar/index.vue";
	import BottomBtn from "@/components/bottom-button/index.vue";
	import {
		upload_file
	} from "@/api/public";
	import {
		userFeedback
	} from "../api/feedback.js";
	import {
		compress
	} from "@/utils/tools.js";
	export default {
		components: {
			MyNavbar,
			BottomBtn
		},
		data() {
			return {
				buttonList: [
					[{
						text: "提交",
						shape: "square",
						type: "primary",
						onClick: "submit",
						btnType: "button",
					}, ],
				],
				feedbackWords: "",
				countNum: "0/200",
				phone: "",
				fileList: [],
				loading: false,
			}
		},
		computed: {
			static_path() {
				let str = "";
				// #ifdef APP
				str = "/static/images/";
				// #endif
				// #ifndef APP
				str = this.$store.getters.static_path;
				// #endif
				return str;
			},
		},
		methods: {
			countWords() {
				this.countNum = `${this.feedbackWords.length}/200`
			},
			async afterRead(event) {
				const lists = event.file.map((v) => {
					const file = Object.assign(v, {
						guid: uni.$u.guid(),
						status: 'uploading',
						message: '上传中'
					});
					this.fileList.push(file);
					return file;
				});
				for (let i = 0; i < lists.length; i++) {
					await this.uploadFilePromise(lists[i]);
				}
				this.fileList = this.fileList.slice();
			},
			async uploadFilePromise(file) {
				if (file.size / 1024 / 1024 > 2) {
					await compress(file)
						.then((res) => {
							file.url = res;
						})
						.catch((err) => {
							this.toastMsg(err.message || '压缩失败!', "error");
						});
				}
				return upload_file({
						path_type: 'feedback'
					}, file.url)
					.then((res) => {
						console.log("res:" + res)
						if (res.code !== 0) throw res;
						file.status = 'success';
						file.message = '';
						file.url = res.data.url;
						file.osskey = res.data.oss_key;
					})
					.catch((err) => {
						console.log(err)
						this.toastMsg(err.message || '文件上传失败!', "error");
						this.deleteImage({
							file
						});
					});
			},
			deleteImage(event) {
				this.fileList = this.fileList.filter((v) => v.guid != event.file.guid);
			},

			submit() {
				if(this.feedbackWords.length==0){
					this.toastMsg('请输入内容后提交');
					return
				}
				if (this.loading) return;
				this.loading = true;
				const params = {
					describe: this.feedbackWords,
					phone: this.phone,
					images: this.fileList.map((v) => v.url)
				};
				userFeedback(params)
					.then((res) => {
						if (res.code !== 0) throw res;
						this.toastMsg('提交成功', 'success');
					})
					.catch((err) => {
						this.toastMsg(err.message || '提交失败!', "error");
					})
					.finally(() => {
						this.loading = false;
					});
			},
			// 提示
			toastMsg(message, type = "default", duration = 2000) {
				this.$refs.toastRef?.show({
					type,
					message,
					duration,
				});
			},
		}
	}
</script>

<style lang="scss" scoped>
	.card-bg {
		/* #ifdef APP || MP */
		margin-top: 88rpx;
		/* #endif */
		/* #ifndef APP||MP */
		margin-top: 28rpx;
		/* #endif */
		margin-left: 28rpx;
		margin-right: 28rpx;
		background: #ffffff;
		border-radius: 16rpx;
		padding: 28rpx;

	}

	.upload-bg {
		width: 200rpx;
		height: 200rpx;
		background: #F6F6F6;
		border-radius: 16rpx;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	::v-deep .u-textarea {
		background: #F6F6F6 !important;
		border-radius: 16rpx;
		padding: 24rpx 32rpx 24rpx 32rpx !important;
	}

	::v-deep .u-input__content__field-wrapper {
		background: #F6F6F6 !important;
		border-radius: 16rpx;
		padding: 24rpx 32rpx 24rpx 32rpx !important;
	}
</style>