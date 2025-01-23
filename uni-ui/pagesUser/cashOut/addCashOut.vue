<template>
	<view class="add-cash-out">
		<view class="top-area">
			<MyNavbar bgColor="transparent">
				<template #navbarData>
					<view class="u-flex-row u-row-center u-col-center">
						<text class="u-text-center u-font-32 color-text-black">添加提现方式</text>
					</view>
				</template>
			</MyNavbar>
		</view>
		<view class="u-p-x-28 add-cash-out--center">
			<view class="u-border-radius u-bg-f u-p-32">
				<view class="tab-area u-border-radius u-m-b-48">
					<view v-if="showBank" class="tab-item u-p-24 u-border-radius" @click="changeTab('BANK')"
						:class="{ active: currentTab == 'BANK' }">
						<u--image v-if="currentTab == 'BANK'" :src="`${static_path}bank_icon.png`" width="40rpx"
							height="40rpx"></u--image>
						<u--image v-else :src="`${static_path}bank_icon_disable.png`" width="40rpx"
							height="40rpx"></u--image>
						<text class="u-font-28 u-line-h-44 u-m-l-16">银行卡</text>
					</view>
					<view v-if="showAli" class="tab-item u-p-24 u-border-radius" @click="changeTab('ALIPAY')"
						:class="{ active: currentTab == 'ALIPAY' }">
						<u--image v-if="currentTab == 'ALIPAY'" :src="`${static_path}alipay_icon.png`" width="40rpx"
							height="40rpx"></u--image>
						<u--image v-else :src="`${static_path}alipay_icon_disable.png`" width="40rpx"
							height="40rpx"></u--image>
						<text class="u-font-28 u-line-h-44 u-m-l-16">支付宝</text>
					</view>
					<view v-if="showCom" class="tab-item u-p-24 u-border-radius" @click="changeTab('COMPANY')"
						:class="{ active: currentTab == 'COMPANY' }">
						<u--image v-if="currentTab == 'COMPANY'" :src="`${static_path}bank_icon.png`" width="40rpx"
							height="40rpx"></u--image>
						<u--image v-else :src="`${static_path}bank_icon_disable.png`" width="40rpx"
							height="40rpx"></u--image>
						<text class="u-font-28 u-line-h-44 u-m-l-16">对公银行账户</text>
					</view>
				</view>
				<u--form labelPosition="top" labelWidth="400rpx" :model="model" ref="formRef" :rules="rules">
					<u-form-item>
						<text v-if="currentTab == 'ALIPAY'"
							class="color-text-black u-font-32 u-line-h-48 u-font-bold">填写支付宝信息</text>
						<text v-else class="color-text-black u-font-32 u-line-h-48 u-font-bold">填写银行卡信息</text>
					</u-form-item>
					<u-form-item v-if="currentTab == 'COMPANY'" label="开户行" prop="bank_deposit" required>
						<u-input placeholder="请输入开户行" v-model.trim="model.bank_deposit">
						</u-input>
					</u-form-item>
					<u-form-item :label="currentTab == 'ALIPAY' ? '支付宝账号':'银行卡号'" prop="pay_account" required>
						<u-input :placeholder="currentTab == 'ALIPAY' ? '请输入支付宝账号':'请输入银行卡号'"
							v-model.trim="model.pay_account">
						</u-input>
					</u-form-item>
					<u-form-item v-if="currentTab != 'COMPANY'" label="手机号" prop="mobile" required>
						<u-input placeholder="请输入手机号" v-model.trim="model.mobile">
						</u-input>
					</u-form-item>
					<u-form-item>
						<text class="color-text-black u-font-32 u-line-h-48 u-font-bold">填写个人信息</text>
					</u-form-item>
					<u-form-item v-if="currentTab != 'COMPANY'" label="真实姓名" prop="people_name" required>
						<u-input placeholder="请输入真实姓名" v-model.trim="model.people_name">
						</u-input>
					</u-form-item>
					<u-form-item v-if="currentTab != 'COMPANY'" label="身份证号" prop="id_card" required>
						<u-input placeholder="请输入身份证号" v-model.trim="model.id_card" required>
						</u-input>
					</u-form-item>
					<u-form-item v-if="currentTab == 'COMPANY'" label="公司名称" prop="company_name" required>
						<u-input placeholder="请输入公司名称" v-model.trim="model.company_name">
						</u-input>
					</u-form-item>
					<u-form-item v-if="currentTab == 'COMPANY'" label="统一社会信用代码" prop="company_id" required>
						<u-input placeholder="请输入统一社会信用代码" v-model.trim="model.company_id" required>
						</u-input>
					</u-form-item>
					<u-form-item>
						<text
							class="color-text-black u-font-32 u-line-h-48 u-font-bold">{{currentTab == 'COMPANY'?"上传营业执照":"上传身份证照片"}}</text>
					</u-form-item>

					<view v-if="currentTab != 'COMPANY'" class="u-flex-row u-col-center">
						<u-form-item prop="id_card_face_url">
							<u-upload :fileList="frontList" @afterRead="frontAfterRead" @delete="deleteFrontPic"
								name="frontside" uploadIcon="photo" uploadText="点击上传身份证正面" width="299rpx"
								height="196rpx" :maxCount="1" class="u-m-r-32">
							</u-upload>
						</u-form-item>

						<u-form-item prop="id_card_back_url">
							<u-upload :fileList="backList" @afterRead="backAfterRead" @delete="deleteBackPic"
								uploadIcon="photo" uploadText="点击上传身份证反面" name="backside" width="299rpx" height="196rpx"
								:maxCount="1">
							</u-upload>
						</u-form-item>
					</view>
					<u-form-item v-else prop="id_card_face_url">
						<u-upload :fileList="licenseList" @afterRead="licenseAfterRead" @delete="deleteLicensePic"
							name="license" uploadIcon="photo" uploadText="点击上传营业执照" width="100%" height="400rpx"
							:maxCount="1">
						</u-upload>
					</u-form-item>
					<u-form-item>
						<view class="u-flex-row u-col-center">
							<u-checkbox-group v-model="check_proxy" shape="circle">
								<u-checkbox :name="true"></u-checkbox>
							</u-checkbox-group>
							<view class="color-text-less-grey u-font-24">
								本人承诺以阅读并同意<text
									class="color-text-primary">《隐私政策协议》</text>{{currentTab != 'COMPANY'?"和":""}}<text
									v-if="currentTab != 'COMPANY'"
									class="color-text-primary">《电签协议》</text>，本人按照协议内容向贵司提供相应服务
							</view>
						</view>
					</u-form-item>
				</u--form>
			</view>
		</view>
		<view :style="{ height: btnHeight * 2 + 32 + 'rpx' }"></view>
		<BottomBtn :data="button_list" :buttonIndex="0" @submit="beforeSubmit" @height="getBtnHeight" />
		<u-modal :show="showDangerModal" :icon="`${static_path}status_icon.png`" title="风险操作提醒" :showCancelButton="true"
			:showConfirmButton="true" cancelText="取消绑定" confirmText="我已知晓"
			:content="`您在【${userInfo.name}(${userInfo.id})】的账户名下绑定了新的收款人，经您本人确认，无论您将账户内资金提现至任何账户，均视为已同【${userInfo.name}(${userInfo.id})】完成结算并无异议，请您在操作提现时注意风险，特此提醒`"
			:buttonFill='false' @cancel='showDangerModal=false' @confirm='showDangerModal=false;showSmsModal=true'>

		</u-modal>
		<u-modal :show="showSmsModal" :showCancelButton="true" :showConfirmButton="true" :buttonFill='false'
			@cancel='closeSmsModal' :icon="`${static_path}status_icon.png`" title="账户安全验证" cancelText="取消绑定"
			confirmText="确认绑定" @confirm="sureBind">

			<view class="modal-content  u-flex-col u-row-center ">
				<text class="u-font-28 u-line-h-48 u-m-b-32">{{
          `请使用您的${userInfo.telephone}手机号获取验证码短信，并进行验证`
        }}</text>
				<u-input placeholder="请输入短信验证码" clearable v-model.trim="model.captcha_code"
					placeholderStyle="color: #989898;font-size: 24rpx;">
					<template slot="suffix">
						<u-code ref="uCodeRef" @change="codeChange" :seconds="seconds" changeText="X秒后重新获取"></u-code>
						<u--text @click="getCode" class="u-pointer u-font-24" type="primary" :text="tips"></u--text>
					</template>
				</u-input>
			</view>
		</u-modal>
		<u-modal :show="showRead" :showCancelButton="true" :title="`${currentTab != 'COMPANY'?'用户协议&隐私政策':'隐私政策'}`"
			confirmText="同意" cancelText="不同意" :closeOnClickOverlay="true" @cancel="showRead = false"
			@close="showRead = false" @confirm="agreement">
			<view>
				为保障与你相关的合法权益，请阅读并同意
				<text v-if="currentTab != 'COMPANY'" class="u-primary" @click="agreementuser">《用户协议》</text>
				{{currentTab != 'COMPANY'?'和':''}}
				<text class="u-primary" @click="privacy">《隐私政策》</text>
			</view>
		</u-modal>
		<base-toast ref="toastRef"></base-toast>


		<!-- 滑动验证码 -->
		<SlideCode :style="{ zIndex: 99999 }" v-if="showSlideCode" ref="sider" @slide_end="confirmReceive"
			@close="showSlideCode = false"></SlideCode>
	</view>
</template>

<script>
	import BottomBtn from "@/components/bottom-button/index.vue";
	import MyNavbar from "@/components/my-navbar/index.vue";
	import SlideCode from "@/components/slide-code/index.vue";
	import {
		decrypt
	} from "@/utils/auth.js";
	import {
		sendSms
	} from "@/api/login.js";
	import {
		upload_file,
		getBankConfig,
	} from "@/api/public.js";
	import {
		compress,
		throttle,
		removeObjectEmpty,
		sleep
	} from "@/utils/tools.js";
	import {
		postBankSign,
		postBankCheck,
		getBankDef
	} from "../api/cashOut.js";
	import {
		mapGetters
	} from "vuex";
	export default {
		props: {},
		components: {
			SlideCode,
			MyNavbar,
			BottomBtn,
		},
		data() {
			return {
				tips: "获取验证码",
				seconds: 120,
				showSmsModal: false,
				showDangerModal: false,
				showRead: false,
				showSlideCode: false,
				currentTab: "",
				frontList: [],
				backList: [],
				licenseList: [],
				check_proxy: [],
				model: {
					id: "",
					pay_platform: "",
					pay_account: "",
					mobile: "",
					bank_deposit: "",
					id_card: "",
					company_id: "",
					id_card_face_url: "",
					id_card_back_url: "",
					people_name: "",
					company_name: "",
					sms_id: null,
					captcha_code: "",
				},
				loading: false,
				btnHeight: null,
				showCom: false,
				showAli: false,
				showBank: false
			};
		},
		computed: {
			userInfo() {
				return this.$store.getters.userInfo;
			},
			...mapGetters(['static_path', 'userInfo']),
			button_list() {
				return [
					[{
						text: "确认添加",
						shape: "square",
						type: "primary",
						onClick: "submit",
						btnType: "button",
						loading: this.loading,
					}, ],
				];
			},
			rules() {
				return {
					pay_account: [{
						required: true,
						message: this.currentTab == "ALIPAY" ? "请输入支付宝账号" : "请输入银行卡号",
						trigger: ["change", "blur"],
					}, ],
					mobile: [{
						validator: (rule, value, callback) => {
							return uni.$u.test.mobile(value);
						},
						message: "手机号码不正确",
						trigger: ["change", "blur"],
					}, ],
					people_name: [{
							required: true,
							message: "请输入真实姓名",
							trigger: ["change", "blur"],
						},
						{
							pattern: /^[\u4e00-\u9fa5]*$/g,
							// 正则检验前先将值转为字符串
							transform(value) {
								return String(value);
							},
							message: "只能包含汉字",
							trigger: ["blur", "change"],
						},
						// 2-8个字符之间的判断
						{
							min: 2,
							max: 8,
							message: "姓名长度在2-8个字符之间",
							trigger: ["blur", "change"],
						},
					],
					company_name: [{
						required: true,
						message: "请输入公司名称",
						trigger: ["change", "blur"],
					}, ],
					company_id: [{
						required: true,
						message: "请输入统一社会信用代码",
						trigger: ["change", "blur"],
					}, ],
					bank_deposit: [{
						required: true,
						message: "请输入开户行",
						trigger: ["change", "blur"],
					}, ],
					id_card: [{
						validator: (rule, value, callback) => {
							return uni.$u.test.idCard(value);
						},
						message: "身份证号不正确",
						trigger: ["change", "blur"],
					}, ],
					id_card_face_url: [{
						required: true,
						message: this.currentTab != "COMPANY" ? "请上传身份证正面图片" : "请上传营业执照图片",
						trigger: ["change", "blur"],
					}, ],
					id_card_back_url: [{
						required: true,
						message: "请上传身份证反面图片",
						trigger: ["change", "blur"],
					}, ],
				};
			},
		},
		onLoad({
			type,
			id
		}) {
			if (type) {
				this.currentTab = type;
			}
			if (id) {
				this.currentTab = "COMPANY";
				this.changeTab(this.currentTab);
				this.showCom = true;
				getBankDef({
					id
				}).then((res) => {
					if (res.code == 0) {
						let data = decrypt({
							iv: res.data.iv,
							content: res.data.content
						});
						this.model.id = id;
						this.model.bank_deposit = data.mobile;
						this.model.pay_account = data.pay_account;
						this.model.company_name = data.people_name;
						this.model.company_id = data.id_card;
						this.model.id_card_face_url = data.id_card_face_url;
						this.licenseList = [{
							status: "success",
							message: "",
							url: data.id_card_face_url,
						}, ];
					}
				}).catch((err) => {
					this.toastMsg(err?.message || "获取数据失败", "error");
				})
			} else {
				getBankConfig().then((res) => {
					if (res.code == 0) {
						if (res.data.list.length > 0) {
							if (!type) {
								this.currentTab = res.data.list[0]
							}
							let tabs = ["BANK", "ALIPAY", "COMPANY"]
							res.data.list.forEach(tab => {
								if (tabs.includes(tab)) {
									switch (tab) {
										case "BANK":
											this.showBank = true
											break;
										case "ALIPAY":
											this.showAli = true
											break;
										case "COMPANY":
											this.showCom = true
											break;
										default:
											break;
									}
								}
							})
							this.changeTab(this.currentTab)
						}
					}
				}).catch((err) => {
					this.toastMsg(err?.message || "获取配置失败", "error");
				})
			}
		},
		methods: {
			/**
			 * @description: 处理前面文件上传完成后的逻辑
			 * @param {*} event - 上传事件对象，包含文件信息和文件名
			 * @return {*}
			 */
			async frontAfterRead(event) {
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
					this.frontList = [{
						...event.file,
						status: "failed",
						message: "上传失败",
					}]
				}

			},
			/**
			 * @description: 处理前面文件上传完成后的逻辑
			 * @param {*} event - 上传事件对象，包含文件信息和文件名
			 * @return {*}
			 */
			async licenseAfterRead(event) {
				// 初始化前面文件的状态为正在上传
				this.licenseList = [{
					...event.file,
					status: "uploading",
					message: "上传中",
				}, ];

				try {
					// 调用上传文件的Promise方法，并获取返回结果
					const res = await this.uploadFilePromise(event.file, event.name);

					// 如果上传成功，更新前面文件的状态为成功，并存储返回的文件URL
					if (res) {
						this.licenseList = [{
							...event.file,
							status: "success",
							message: "",
							url: res,
						}, ];
					}

				} catch (error) {
					this.licenseList = [{
						...event.file,
						status: "failed",
						message: "上传失败",
					}]
				}
			},

			/**
			 * @description: 处理背面文件上传完成后的逻辑
			 * @param {*} event - 上传事件对象，包含文件信息和文件名
			 * @return {*}
			 */
			async backAfterRead(event) {
				// 初始化背面文件的状态为正在上传
				this.backList = [{
					...event.file,
					status: "uploading",
					message: "上传中",
				}, ];

				try {

					// 调用上传文件的Promise方法，并获取返回结果
					const res = await this.uploadFilePromise(event.file, event.name);

					// 如果上传成功，更新背面文件的状态为成功，并存储返回的文件URL
					if (res) {
						this.backList = [{
							...event.file,
							status: "success",
							message: "",
							url: res,
						}, ];
					}
				} catch (error) {
					this.backList = [{
						...event.file,
						status: "failed",
						message: "上传失败",
					}];
				}
			},

			/**
			 * @description: 删除前置图片，并清空相关模型中的图片链接
			 * @return {*}
			 */
			deleteFrontPic() {
				this.frontList = []; // 清空前置图片列表
				this.model.id_card_face_url = ""; // 清空前置图片的URL
			},
			/**
			 * @description: 删除营业执照图片，并清空相关模型中的图片链接
			 * @return {*}
			 */
			deleteLicensePic() {
				this.licenseList = []; // 清空营业执照图片列表
				this.model.id_card_face_url = ""; // 清空营业执照图片的URL
			},

			/**
			 * @description: 删除后置图片，并清空相关模型中的图片链接
			 * @return {*}
			 */
			deleteBackPic() {
				this.backList = []; // 清空后置图片列表
				this.model.id_card_back_url = ""; // 清空后置图片的URL
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
							path_type: this.currentTab != 'COMPANY' ? "id_card" : "company",
							file_name: file.name
						}, file.url)
						.then((res) => {
							if (res.code !== 0) throw res.data;

							// 上传成功，更新文件状态和相关属性
							file.status = "success"; // 设置文件状态为成功
							file.message = ""; // 清空消息
							file.url = res.data.url; // 更新文件的URL
							file.osskey = res.data.oss_key; // 更新OSS密钥
							// 根据文件类型更新模型中的相应URL
							if (name == "backside") {
								this.model.id_card_back_url = res.data.url; // 背面
							} else {
								this.model.id_card_face_url = res.data.url; // 正面
							}
							// 解析Promise并返回上传的文件URL
							resolve(res.data.url);
						})
						.catch((err) => {
							this.toastMsg(err?.message || "上传失败！", "error");
							reject(err);
						});
				});
			},

			/**
			 * 切换当前选项卡
			 * @description: 根据传入的索引改变当前选项卡，并重置模型数据
			 * @param {number} index - 选项卡的索引
			 * @return {void} - 无返回值
			 */
			changeTab(index) {
				// 设置当前选项卡为传入的索引
				this.currentTab = index;
				this.model = this.$options.data().model;
				this.$refs.formRef?.clearValidate();
			},

			checkReq() {
				this.loading = true;
				this.toastMsg("加载中", "loading", -1);
				postBankCheck({
						id_card: this.model.id_card
					})
					.then((res) => {
						// 如果验证通过
						if (res.code == 0) {
							// 检查是否需要显示短信验证码
							if (res.data.show_auth) {
								this.showDangerModal = true;
								this.loading = false;
							} else {
								this.onSubmit(); // 直接提交表单
							}
						}
					})
					.catch((error) => {
						this.loading = false;
						this.$refs.toastRef.close();
						this.toastMsg(error.message || "验证失败！", "error");
					});
			},

			/**
			 * @description: 提交前的验证方法，使用防抖机制避免频繁调用
			 * @return {*}
			 */
			beforeSubmit: throttle(function func() {
				this.$refs.formRef
					.validate()
					.then(() => {
						if (this.check_proxy.length == 0) {
							return (this.showRead = true);
						} else {
							if (this.currentTab != "COMPANY") {
								this.checkReq();
							} else {
								this.onSubmit(); // 直接提交表单
							}
						}
					})
					.catch((error) => {});
			}, 500), // 500毫秒的防抖时间
			sureBind() { //确认绑定
				if (!this.model.sms_id) {
					this.toastMsg("请先获取验证码", 'error');
					return
				}
				if (this.model.captcha_code.length == 0) {
					this.toastMsg("请输入验证码", 'error');
					return
				}

				this.loading = true;
				this.toastMsg("加载中", "loading", -1);
				this.onSubmit();
			},
			onSubmit() {
				postBankSign(
						removeObjectEmpty({
							...this.model,
							people_name: this.currentTab == "COMPANY" ? this.model.company_name : this.model
								.people_name,
							mobile: this.currentTab == "COMPANY" ? this.model.bank_deposit : this.model.mobile,
							id_card: this.currentTab == "COMPANY" ? this.model.company_id : this.model.id_card,
							pay_platform: this.currentTab,
						})
					)
					.then(async (res) => {
						this.showSmsModal = false;
						if (res.code == 0) {
							this.toastMsg("提交成功！", "success");
							await sleep(1000);
							uni.redirectTo({
								url: "/pagesUser/cashOut/index",
							});
							this.$refs.toastRef.close()
						}
					})
					.catch((error) => {
						this.toastMsg(error.message || "提交失败！", "error");
					})
					.finally(() => {
						this.loading = false;
					});
			},

			getBtnHeight(height) {
				this.btnHeight = height;
			},

			codeChange(text) {
				this.tips = text;
			},
			getCode() {
				if (this.$refs.uCodeRef.canGetCode) {
					this.showSlideCode = true;
				} else {
					this.toastMsg("倒计时结束后再发送", "error");
				}
			},

			/**
			 * @description: 确认接收验证码
			 * @param {*} val - 验证码值
			 * @return {*}
			 */
			confirmReceive(val) {

				// 如果未提供验证码值，则显示错误信息
				if (!val) return this.toastMsg("请滑动拼图！", "error");

				// 将验证码值存储到变量中
				let captcha_code = val;

				// 检查是否可以获取验证码
				if (this.$refs.uCodeRef && this.$refs.uCodeRef.canGetCode) {

					this.toastMsg("正在获取验证码", 'loading', -1);

					// 发送短信验证码请求
					sendSms({
							captcha_code: captcha_code, // 提交的验证码
							sms_type: '8', // 短信类型


						})
						.then((res) => {
							// 请求成功后的处理
							this.showSlideCode = false; // 隐藏滑动验证码
							this.toastMsg("验证码已发送", "success");

							// 存储验证码相关信息
							this.model.seconds = res.data.limit_second; // 倒计时的秒数
							this.model.sms_id = res.data.sms_id + ''; // 存储短信ID
							this.$refs.uCodeRef.start(); // 开始倒计时
						})
						.catch((err) => {
							console.log(err)

							//请求失败后的处理
							if (err.message?.indexOf("验证码错误") != -1) {
								this.$refs.sider && this.$refs.sider.retry(); // 重试
								this.toastMsg(err.message || err, "error");

							} else {
								this.showSlideCode = false; // 隐藏滑动验证码
								this.$refs.sider && this.$refs.sider.retry(); // 重试
								this.toastMsg(err.message || err, "error");
							}
						})
						.finally(() => {
							// 请求结束后的处理
							uni.hideLoading(); // 隐藏加载提示
						});
				} else {
					console.log("不能发送验证码");
					// 如果不能获取验证码，提示信息
					this.toastMsg("倒计时结束后再发送", "error");
				}
			},
			closeSmsModal() {
				this.showSmsModal = false;
				this.seconds = 120;
				this.tips = "获取验证码";
				this.model.captcha_code = null;
				this.model.sms_id = null;
			},

			/**
			 * @description: 跳转到用户协议页面
			 * @return {*}
			 */
			agreementuser() {
				uni.navigateTo({
					url: "/pagesUser/service/agreement/user", // 用户协议页面的URL
				});
			},

			agreement() {
				this.showRead = false;
				this.check_proxy = [true];
				if (this.currentTab != "COMPANY") {
					this.checkReq();
				} else {
					this.onSubmit(); // 直接提交表单
				}
			},

			/**
			 * @description: 跳转到隐私政策页面
			 * @return {*}
			 */
			privacy() {
				uni.navigateTo({
					url: "/pagesUser/service/agreement/privacy", // 隐私政策页面的URL
				});
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
	::v-deep .my-navbar .app-grid {
		backdrop-filter: blur(20px);
	}

	.top-area {
		/* #ifdef APP || MP */
		padding-top: 88rpx;
		/* #endif */
		z-index: 999;
		width: 750rpx;
		position: fixed;
		top: 0;
		backdrop-filter: blur(20px);
	}

	.add-cash-out {
		background: linear-gradient(180deg, #d3edff 0%, #f6f7fb 60.27%);
		min-height: 100vh;

		.add-cash-out--center {
			/* #ifdef H5 */
			padding-top: 116rpx;
			/* #endif */
			/* #ifdef APP */
			padding-top: 204rpx;
			/* #endif */
		}
	}

	.tab-area {
		display: flex;
		height: 92rpx;
		background: $u-grey-3;

		.tab-item {
			background: $u-grey-3;
			color: $u-grey-7;
			display: flex;
			flex: 1;
			align-items: center;
			justify-content: center;
			transition: all 0.3s ease;
		}

		.active {
			background: $u-primary-6;
			color: #fff !important;
		}
	}

	::v-deep .u-input {
		border-radius: 16rpx;
		height: 88rpx;
		background-color: #f6f6f6;
		border: none;
		padding: 24rpx 32rpx !important;
	}

	::v-deep .u-form-item__body__left {
		position: relative;
		left: 10rpx;
		margin-bottom: 16rpx !important;
	}

	::v-deep .u-upload__wrap .u-upload__button {
		border-radius: 24rpx;
	}
</style>