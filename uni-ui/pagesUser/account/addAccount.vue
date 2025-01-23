<template>
	<view class="u-vh-100 widthAll u-flex-col u-bg-default">
		<view class="top-form-box u-bg-f  u-m-28 u-p-l-32 u-p-r-32 u-p-t-32 u-border-radius">
			<u--form labelPosition="top" :model="accountInfo" :rules="rules" ref="uForm" labelWidth="150rpx" labelAlign="left"
				:labelStyle="{ fontSize: '27rpx' }">
				<view class="select-ipt">
					<u-form-item label="媒体平台" prop="platform_name" :required="true" @click="openPlatformPopup">
						<u--input v-model="accountInfo.platform_name" border="none" placeholder="请选择媒体平台"
							placeholderClass="u-font-27" :clearable="true"></u--input>
						<u-icon slot="right" name="arrow-down"></u-icon>
					</u-form-item>
				</view>
				<u-form-item label="账号昵称" prop="platform_account_name" :required="true">
					<u--input v-model.trim="accountInfo.platform_account_name" border="none" placeholder="请输入账号昵称"
						placeholderClass="u-font-27" :clearable="true" @change="onInputChange"></u--input>
				</u-form-item>
				<u-form-item label="账号ID" prop="platform_account_id" :required="true">
					<u--input v-model.trim="accountInfo.platform_account_id" border="none" placeholder="请输入账号ID"
						placeholderClass="u-font-27" :clearable="true"  @change="onInputChange"></u--input>
				</u-form-item>

				<u-form-item label="粉丝数量" prop="fan_counts" :required="true">
					<u--input v-model.trim="accountInfo.fan_counts" border="none" type="number" placeholder="请输入粉丝数量（纯数字）"
						placeholderClass="u-font-27" :clearable="true"  @change="onInputChange"></u--input>
				</u-form-item>
				<view class="select-ipt">
					<u-form-item label="账号类型" prop="category_name" :required="true" @click="openAccountTypePopup">
						<u--input v-model="accountInfo.category_name" border="none" placeholder="请选择账号类型"
							placeholderClass="u-font-27" :clearable="true"></u--input>
						<u-icon slot="right" name="arrow-down"></u-icon>
					</u-form-item>
				</view>
				<u-form-item label="主页链接" prop="home_page_url" :required="true">
					<u--textarea v-model.trim="accountInfo.home_page_url" border="none" autoHeight maxlength="-1"
						placeholder="请输入http://或https://开头网页链接，不可输入空格与中文" :clearable="true"  @change="onInputChange"  @blur="onUrlBlur"></u--textarea>
				</u-form-item>
				<view class="upload">
					<u-form-item label="主页截图" prop="screenshot_url" :required="true">
						<u-upload :fileList="fileList" @afterRead="afterRead" @delete="deletePic" name="Back" uploadIcon="photo"
							uploadText="点击上传图片附件" :maxCount="1" :previewImage="true" :deletable="true" width="240rpx" height="240rpx">

						</u-upload>
					</u-form-item>
				</view>
			</u--form>

		</view>
		<view style="height: 150rpx;"></view>
		<BasePicker ref="platformPickerRef" :items="platformList" title="请选择媒体平台" @change="selectPlatform">
		</BasePicker>
		<BasePicker ref="accountTypePickerRef" :items="accountTypeList" title="请选择账号类型" @change="selectAccountType">
		</BasePicker>
		<BottomBtn :data="button_list" :buttonIndex="0" @save="saveAccount"></BottomBtn>
		<base-toast ref="toastRef"></base-toast>
		
		<view>
			<u-modal :show="showExitModal" :showCancelButton="true" title="温馨提示" :content="modal_content" :confirmText="modal_confirm" cancelText="退出"
			:closeOnClickOverlay="true" @cancel="onExitCurrentPage" @close="showExitModal = false" @confirm="showExitModal = false">
		</u-modal>

		<u-modal :show="showHomeModal" :showCancelButton="false" title="温馨提示" :content="`已为您自动提取并填入主页链接：\n${homeUrl}`" confirmText="我知道了" cancelText="取消" :buttonFill="false"
			:closeOnClickOverlay="true" @cancel="showHomeModal = false" @close="showHomeModal = false" @confirm="onSureHomePageUrl">
		</u-modal>
		</view>
		
	</view>
</template>

<script>
	import BasePicker from '@/components/base-picker/index.vue';
	import BottomBtn from "@/components/bottom-button/index.vue";
	import eventBus from '@/utils/eventBus.js'
	import {
		upload_file,
		platform,
		category,
	} from "@/api/public";

	import {
		compress,
		sleep,
		validateUrl
	} from '@/utils/tools.js';

	import {
		addMediaAccount,
		mediaAccountDef,
		editMediaAccount
	} from '../api/mediaAccount.js';

	export default {
		computed: {
			btnText() {
				return this.accountInfo.id  ? "修改" : "保存";
			},
			button_list() {
				return [
					[{
						text: this.btnText,
						shape: "square",
						type: "primary",
						onClick: "save",
						btnType: "button",
						loading: this.submitLoading
					}]
				]
			},
			modal_content() {
				return this.accountInfo.id  ? "退出将清空已修改信息" : "退出将清空已填写信息";
			},
			modal_confirm() {
				return this.accountInfo.id  ? "继续修改" : "继续填写";
			},
		},
		components: {
			BasePicker,
			BottomBtn
		},
		data() {
			return {
				showHomeModal: false,
				homeUrl: '',
				showExitModal: false,
				hasEdit: false,
				platform_id: null,
				submitLoading: false,
				allowSelectPlatform: true,
				platformList: [],
				accountTypeList: [],
				accountInfo: {
					platform_name: '',
					platform_id: '',
					platform_account_name: '',
					platform_account_id: '',
					fan_counts: null,
					category_name: '',
					category_id: '',
					home_page_url: '',
					screenshot_url: ''
				},
				fileList: [],
				rules: {
					platform_name: {
						type: 'string',
						required: true,
						message: '媒体平台不能为空',
						trigger: ['change']
					},
					platform_account_name: {
						type: 'string',
						required: true,
						message: '账号昵称不能为空',
						trigger: ['blur', 'change']
					},
					platform_account_id: [{
							type: 'string',
							required: true,
							message: '账号ID不能为空',
							trigger: ['blur', 'change']
						},
						{
							type: 'string',
							min: 6,
							max: 20,
							message: 'ID长度在6~20位数之间',
							trigger: ['blur']
						}
					],
					fan_counts: [{
							type: 'number',
							required: true,
							message: '粉丝数量不能为空',
							trigger: ['blur', 'change']
						},
						{
							validator: (rule, value, callback) => {
								return uni.$u.test.digits(value);
							},
							message: '请输入整数',
							trigger: ['blur']
						},
						{
							type: 'number',
							required: true,
							max: 100000000,
							min: 0,
							message: '不可超过九位数',
							trigger: ['blur']
						}
					],
					category_name: {
						type: 'string',
						required: true,
						message: '账号类型不能为空',
						trigger: ['change']
					},
					home_page_url: [{
							type: 'string',
							required: true,
							message: '主页链接地址不能为空',
							trigger: ['blur']
						},
						{
							pattern: /^(https?:\/\/([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,6})(:\d+)?(\/[^?\s]*)?(\??[^#\s\u4e00-\u9fa5]*)(#[^ \t]*)?$/,

							// 正则检验前先将值转为字符串
							transform(value) {
								return String(value);
							},
							message: '请输入正确的主页链接!',
							trigger: ['blur', 'change']
						}
					],
					screenshot_url: {
						type: 'url',
						required: true,
						message: '请添加主页截图',
						trigger: ['blur', 'change']
					}
				},
			};
		},
		methods: {
			onUrlBlur() {
				// 使用更严格的正则表达式匹配网址
				let urlPattern = /(https?:\/\/([a-zA-Z0-9]+(?:-[a-zA-Z0-9]+)*\.)+[a-zA-Z]{2,6})(:\d+)?(\/[^?\s]*)?(\??[^#\s\u4e00-\u9fa5]*)(#[^ \t]*)?/;
				const url = this.accountInfo.home_page_url.match(urlPattern);
				let homeUrl = url ? url[0] : null;
				if (homeUrl && homeUrl !== this.accountInfo.home_page_url) {
					
					this.homeUrl = homeUrl;
					this.showHomeModal = true;
				}
			},
			onSureHomePageUrl() {
				this.accountInfo.home_page_url = this.homeUrl;
				this.showHomeModal = false;
				this.$refs.uForm.validateField('home_page_url');
			},

			onExitCurrentPage() {
				this.showExitModal = false;
				this.hasEdit = false;
				uni.navigateBack();
			},
			onInputChange(value) {
				this.hasEdit = true;
			},
			toastMsg(message, type = "default") {
				this.$refs.toastRef?.show({
					type,
					message,
				});
			},
			saveAccount() {
				if (this.accountInfo.platform_id.length == 0) {
					this.toastMsg("请选择媒体平台", 'error');
					return
				} else if (this.accountInfo.platform_account_name.length == 0) {
					this.toastMsg("请输入账号昵称", 'error');
					return
				} else if (this.accountInfo.platform_account_id.length == 0) {
					this.toastMsg("请输入账号ID", 'error');
					return
				} else if (this.accountInfo.fan_counts.length == 0) {
					this.toastMsg("请输入粉丝数量", 'error');
					return
				} else if (this.accountInfo.category_id.length == 0) {
					this.toastMsg("请选择账号类型", 'error');
					return
				} else if (this.accountInfo.home_page_url.length == 0) {
					this.toastMsg("请输入主页链接", 'error');
					return
				} else if (this.accountInfo.screenshot_url.length == 0) {
					this.toastMsg("请上传主页截图", 'error');
					return
				}

				this.$refs.uForm
					.validate()
					.then(() => {
						let data = {
							...this.accountInfo
						};

						let func = this.accountInfo.id  ? editMediaAccount : addMediaAccount;
						let message = this.accountInfo.id  ? "修改成功" : "添加成功";
						this.submitLoading = true;
						func(data)
							.then(async res => {
								if (res.code == 0) {
									this.toastMsg(message, "success");
									await sleep(2000);
									this.hasEdit = false;
									eventBus.$emit("updatePlatformAccountInfo");
									uni.navigateBack();
								}
							})
							.catch(error => {
								this.toastMsg(error.message || error, 'error')
							})
							.finally(() => {
								this.submitLoading = false;
							})
					})
					.catch((errors) => {});
			},
			// 删除图片
			deletePic(event) {
				this.fileList = [];
				this.accountInfo.screenshot_url = '';
				this.hasEdit = true;
			},
			// 新增图片
			async afterRead(event) {
				// 当设置 multiple 为 true 时, file 为数组格式，否则为对象格式
				let lists = [].concat(event.file);

				this.fileList = [{
					...event.file,
					status: 'uploading',
					message: '上传中'
				}]
				try {
					const result = await this.uploadFilePromise(event.file);
					if (result) {
						this.fileList = [{
							...event.file,
							status: "success",
							message: "",
							url: result,
						}]
						this.hasEdit = true;
					}
				} catch (error) {
					this.fileList = [
						{
							...event.file,
							status: "failed",
							message: "上传失败",
						}
					]
				}
			},
			async uploadFilePromise(file) {
				if (file.size / 1024 / 1024 > 2) {
					await compress(file)
						.then((res) => {
							file.url = res;
						})
						.catch((err) => {
							this.$refs.uToast?.show({
								message: err || '压缩失败!',
								type: 'error'
							});
						});
				}



				// 返回一个Promise，用于处理文件上传
				return new Promise((resolve, reject) => {
					// 调用上传文件的API
					upload_file({
							path_type: "account_screenshot",
							file_name: file.name 
						}, file.url)
						.then((res) => {
							if (res.code !== 0) throw res.data;

							// 上传成功，更新文件状态和相关属性
							file.status = "success"; // 设置文件状态为成功
							file.message = ""; // 清空消息
							file.url = res.data.url; // 更新文件的URL
							file.osskey = res.data.oss_key; // 更新OSS密钥

							this.accountInfo.screenshot_url = res.data.url;

							// 解析Promise并返回上传的文件URL
							resolve(res.data.url);
						})
						.catch((err) => {
							this.toastMsg(err?.message || err || "上传失败！", "error");
							this.fileList = [];
							reject(err);
						});
				});

			},
			openPlatformPopup() {
				if (!this.allowSelectPlatform) {
					this.toastMsg("不可修改", "error");
					return
				}
				if (this.platformList.length) {

					this.$refs.platformPickerRef.open();
				} else {
					this.toastMsg("正在加载平台数据...", "loading");
					this.getPlatform();
				}


			},
			openAccountTypePopup() {
				if (this.accountTypeList.length) {
					this.$refs.accountTypePickerRef.open();
				} else {
					this.toastMsg("正在加载账号类型数据...", "loading");
					this.getCategory();
				}


			},
			selectPlatform(index, item) {
				if (item.value == this.accountInfo.platform_id) {
					return;
				}
				this.accountInfo.platform_name = item.name;
				this.accountInfo.platform_id = item.value;
				// this.$refs.platformRef.close()
				// 解决微信小程序选择数据后校验报错
				this.$refs.uForm.validateField('platform_name');
				this.hasEdit = true;
			},
			selectAccountType(index, item) {
				this.accountInfo.category_name = item.name;
				this.accountInfo.category_id = item.value;
				// 解决微信小程序选择数据后校验报错
				this.$refs.uForm.validateField('category_name');
				this.hasEdit = true;
			},
			// 获取平台信息
			getPlatform(keyword = '') {
				let params = {
					icon: '2',
					status: '1'
				};
				if (keyword) params.keyword = keyword;
				platform(params)
					.then((res) => {
						if (res && res.code === 0) {
							this.platformList = res.data;
						}
						if (this.platform_id) {
							for (let item of res.data) {
								if (item.value === parseInt(this.platform_id)) {
									this.accountInfo.platform_name = item.name;
									this.accountInfo.platform_id = item.value;
									this.allowSelectPlatform = false;
									break
								}
							}
						}

						this.$refs.toastRef?.close();
					})
					.catch((err) => {
						this.toastMsg(err.message || '获取平台失败', 'error');
					});
			},
			// 获取账户类型
			getCategory() {
				category()
					.then((res) => {
						if (res && res.code === 0) {
							this.accountTypeList = res.data;
						}
						this.$refs.toastRef?.close();
					})
					.catch((err) => {
						this.toastMsg(err.message || '获取账户类型失败', 'error');
					});
			},
			hideKeyboard() {
				uni.hideKeyboard();
			},
			// 查询单个媒体账号
			getDef(id) {
				mediaAccountDef({
						id
					})
					.then((res) => {
						if (res && res.code === 0) {
							this.accountInfo = res.data;
							this.fileList.splice(
								0,
								1,
								Object.assign({}, {
									status: 'success',
									message: '',
									url: this.accountInfo.screenshot_url
								})
							);

							this.initialFormData = JSON.stringify(this.accountInfo);
						}
					})
					.catch((err) => {
						this.toast(err.message || '获取信息失败');
					});
			},
		},
		onLoad(options) {
			if (options.id && options.id.length) {
				this.accountInfo.id = parseInt(options.id);
				this.getDef(options.id);
			} else {

			}

			if (options.platform_id) {
				this.platform_id = options.platform_id;
			}
		},
		async onReady() {
			//如果需要兼容微信小程序，并且校验规则中含有方法等，只能通过setRules方法设置规则。
			this.$refs.uForm.setRules(this.rules);
			await this.getPlatform();
			await this.getCategory();
		},
		onBackPress({ from }) {
			if (this.hasEdit) {//不允许返回
				this.showExitModal = true;
				return true;
			} 
			//允许返回	
			return false;
		}
	}
</script>

<style lang="scss">
	.top-form-box {
		flex: 1;
		overflow-y: auto;

		::v-deep {
			.u-form-item__body__left__content__required {
				padding-left: 20rpx;
			}

			.u-form-item__body__left__content__label {
				padding-left: 25rpx;
			}

			.u-form-item__body__right {
				padding: 20rpx 28rpx;
				background-color: $u-bg-color;
				border-radius: 16rpx;
			}

			.upload .u-form-item__body__right {
				padding: 0;
				background-color: unset;
				border-radius: 0;
			}

			.upload .u-upload__wrap__preview__image {
				width: 240rpx !important;
				height: 240rpx !important;
			}

			.upload .u-upload__status {
				width: 240rpx !important;
				height: 240rpx !important;
			}

			.u-textarea {
				padding: 0 !important;
				background-color: unset !important;
			}

			.uni-input-input {
				font-size: 27rpx !important;
			}

			// 让input框无法选择，使之拥有select框的效果
			.select-ipt {
				.uni-input-input {
					pointer-events: none !important;
				}

				.u-input__content__field-wrapper__field {
					pointer-events: none !important;
				}
			}

			.u-textarea,
			.uni-textarea-compute,
			.u-textarea__field,
			.uni-textarea-placeholder,
			.input-placeholder,
			.uni-textarea-textarea {
				min-height: 90rpx !important;
				font-size: 27rpx !important;
				padding: 0 !important;
			}

			.bottom {
				background-color: #fff !important;
			}

			.u-upload__wrap__preview__image {
				width: 170rpx !important;
				height: 170rpx !important;
				border-radius: 16rpx;
				overflow: hidden;
			}

			.u-upload__status {
				width: 170rpx !important;
				height: 170rpx !important;
				border-radius: 16rpx;
				overflow: hidden;
			}
		}
	}

	::v-deep .bottom-box {
		height: calc(var(--window-bottom) + 32rpx + 108rpx);
		width: 100%;
		padding-bottom: calc(var(--window-bottom) + 16rpx);

		.u-button {
			width: 694rpx;
			height: 108rpx;
			border-radius: 16rpx;
			background-color: $u-primary-6;
			color: white;
		}

		.u-button__text {
			font-size: 32rpx !important;
		}
	}
</style>