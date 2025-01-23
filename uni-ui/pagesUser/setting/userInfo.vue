<template>
	<view class="account-page u-p-x-28">
		<view class="u-bg-f u-border-radius u-p-48 u-m-y-28">
			<u-upload :fileList="fileList" @afterRead="afterRead" @delete="deletePic" :maxCount="1" name="avatar"
				width="200rpx" height="200rpx">
				<view style="position: relative;">
					<u--image :src="model.avatar || `${static_path}avatar_upload_icon.png`" width="200rpx"
						height="200rpx" shape="circle"></u--image>
					<u-icon :name="`${static_path}avatar_upload_label.png`" width="68rpx" height="68rpx"
						style="position: absolute; right: 0; bottom: 0;">
					</u-icon>
				</view>
			</u-upload>
			<u--form labelPosition="top" labelWidth="400rpx" style="margin-top: 64rpx">
				<u-form-item label="账号昵称">
					<u-input v-model.trim="model.name" border="bottom" clearable @focus="onChange"></u-input>
				</u-form-item>
				<u-form-item label="我的账户ID">
					<view class="u-flex-row u-row-between u-col-center widthAll">
						<text class="u-font-bold u-font-28 u-line-h-44 color-text-black">{{
              model.id
            }}</text>
						<text class="color-text-primary u-font-24 u-line-h-44" @click="onCopy(model.id)">复制</text>
					</view>
				</u-form-item>
				<u-form-item label="联系导师（微信号）">
					<view class="u-flex-row u-row-between u-col-center widthAll">
						<text class="u-font-bold u-font-28 u-line-h-44 color-text-black">{{
              model.contact_teacher || "--"
            }}</text>
						<text class="color-text-primary u-font-24 u-line-h-44"
							@click="onCopy(model.contact_teacher)">复制</text>
					</view>
				</u-form-item>
			</u--form>
		</view>
		<u-button type="primary" :loading="loading" @click="onSave">保存修改</u-button>
		<u-modal :show="showGate" title="温馨提示" showCancelButton cancelText="不保存" confirmText="保存" @confirm="onSave"
			@cancel="onCancel">
			<text style="color: #3c3c3c">是否保存已修改的信息</text>
		</u-modal>
		<base-toast ref="toastRef"></base-toast>
	</view>
</template>

<script>
	import {
		upload_file,
		getUserInfo
	} from "@/api/public";
	import {
		getLeaderWechat
	} from '@/api/account.js'
	import {
		compress,
		throttle,
		copy
	} from "@/utils/tools.js";
	import {
		postEditInfo
	} from "../api/userInfo.js";
	import {
		mapGetters
	} from "vuex";
	export default {
		data() {
			return {
				fileList: [],
				loading: false,
				showGate: false,
				isModify: false,
				model: {
					avatar: "",
					name: "",
					id: "",
					contact_teacher: "",
				},
			};
		},
		computed: {
			...mapGetters(['static_path']),
		},
		methods: {
			init() {
				this.getTeacherWx();
				this.updateInfo();
			},

			async afterRead(event) {
				// 初始化前面文件的状态为正在上传
				this.frontList = [{
					...event.file,
					status: "uploading",
					message: "上传中",
				}, ];

				try {
					// 调用上传文件的Promise方法，并获取返回结果
					const res = await this.uploadFilePromise(event.file, event.name);
	
					// 如果上传成功，更新前面文件的状态为成功，并存储返回的文件URL
					if (res) {
						this.frontList = [{
							...event.file,
							status: "success",
							message: "",
							url: res,
						}, ];
					}
				} catch (error) {
					this.frontList = [
						{
							...event.file,
							status: "failed",
							message: "上传失败",
						}
					]
				}
			},

			deletePic() {
				this.model.avatar = "";
				this.fileList = [];
			},

			/**
			 * @description: 用于上传文件的异步函数，如果文件超过2MB则进行压缩，上传后返回文件的URL
			 * @param {*} file - 要上传的文件对象
			 * @param {*} name - 文件的类型名称（如：frontside或backside）
			 * @return {*}
			 */
			async uploadFilePromise(file, name) {
				// 检查文件大小，如果大于2MB，则进行压缩
				if (file.size / 1024 / 1024 > 2) {
					await compress(file) // 调用压缩函数
						.then((res) => {
							file.url = res;
						})
						.catch((err) => {
							this.toastMsg(err, 'error');
						});
				}

				// 返回一个Promise，用于处理文件上传
				return new Promise((resolve, reject) => {
					// 调用上传文件的API
					upload_file({
							path_type: "avatar",
							file_name: file.name
						}, file.url)
						.then((res) => {
							if (res.code !== 0) throw res.data;

							// 上传成功，更新文件状态和相关属性
							file.status = "success"; // 设置文件状态为成功
							file.message = ""; // 清空消息
							file.url = res.data.url; // 更新文件的URL
							file.osskey = res.data.oss_key; // 更新OSS密钥

							this.model.avatar = res.data.url; // 更新用户头像

							// 解析Promise并返回上传的文件URL
							resolve(res.data.url);
						})
						.catch((err) => {
							this.toastMsg(err.message || "上传失败！", "error");
							reject(err);
						});
				});
			},
			onChange() {
				this.model.name = "";
				this.isModify = true
			},
			onCancel() {
				this.showGate = false;
				this.isModify = false;
				uni.navigateBack({
					delta: 1
				})
			},
			onSave() {
				if(this.model.name.length==0){
					this.toastMsg("账号昵称不能为空",'error');
					return
				}
				this.loading = true;
				postEditInfo({
						name: this.model.name,
						avatar: this.model.avatar,
					})
					.then((res) => {
						if (res.code == 0) {
							this.toastMsg("保存成功", "success");
							this.updateInfo();
						}
					})
					.catch((error) => {
						this.toastMsg(error.message || error, "error");
					})
					.finally(() => {
						this.loading = false;
					});
			},

			async getTeacherWx() {
				try {
					this.toastMsg("加载中", "loading", -1);
					const res = await getLeaderWechat();
					if (res.code == 0) {
						this.model.contact_teacher = res.data.contact_teacher
						this.$refs.toastRef.close();
					}
				} catch (error) {
					this.toastMsg(error.message || error, "error");
				}
			},

			async updateInfo() {
				try {
					const res = await this.$store.dispatch("queryUserInfo");
					this.model.name = res.name;
					this.model.id = res.id;
					this.model.avatar = res.avatar;
				} catch (error) {
					this.toastMsg(error.message || error, "error");
				} finally {
					if (this.showGate) {
						this.showGate = false;
						this.isModify = false;
						uni.navigateBack({
							delta: 1
						})
					}
				}
			},

			onCopy(str) {
				copy({
					content: str
				}, this);
			},

			toastMsg(message, type = "default", duration = 2000) {
				this.$refs.toastRef?.show({
					type,
					message,
					duration
				});
			},
		},
		onBackPress() {
			if (this.isModify) {
				this.showGate = true
				return true
			} else {
				return false
			}
		},
		onReady() {
			this.init();
		},
	};
</script>

<style lang="scss" scoped>
	.account-page {
		min-height: 100vh;
		background: #f6f7fb;
	}

	::v-deep .u-form-item__body__right__content__slot .u-input--square {
		padding: 16rpx 0rpx 16rpx 0rpx !important;
	}

	::v-deep .u-button {
		border-radius: 16rpx;
		height: 88rpx;
	}
</style>