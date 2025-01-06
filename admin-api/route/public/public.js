const express = require('express');
const router = express.Router();
const controller = require('../../controller/public/public');
const { mergeOption } = require("../middle");
const { caches } = require('../../db/cackeMiddle');

router.get('/advertiser', controller.advertiser);// 广告主下拉
router.get('/promotion', controller.promotion);// 广告主推广类目下拉
router.get('/content_type', controller.contentType);// 视频内容类型下拉
router.get('/category', controller.category);// 账号品类
router.get('/platform', controller.platform);// 账号平台
router.get('/business_type', controller.businessType);// 账号品类
router.get('/banner', mergeOption, controller.banner);
router.get('/banner_url', controller.bannerUrl);
router.get('/common_problem', controller.commonProblem);//常见问题
router.get('/app_version', controller.appVersion);//应用版本
router.post('/authoring_tool', controller.authoringTool);//创作工具是否显示
router.get('/plan/share', controller.plan_share);//私域分享
router.get('/course', controller.course);//全局设置的课程数据
router.post('/sync_applet_plan', controller.sync_applet_plan) //外部接口，统一的不鉴权接口
router.use('/callback', require("./callback").router) //外部回调，统一的不鉴权接口
router.use('/share_bind', require("./shareBind").router) //外部回调，统一的不鉴权接口
router.get('/main_content_adv', controller.mainContentAdv);// 爆款项目类型
router.get('/withdrawal_method', controller.withdrawalMethod);// 提现方式

router.use('/', require('../middle').router)
router.get('/advertiser/menu', controller.advertiserMenu);// 菜单项目产品下拉
router.get('/mcn_list', controller.mcn_list);// 星图MCN
router.post('/platform_account_info', controller.platformAccountInfo);// 平台信息
router.post('/upload', controller.upload);// 上传文件
router.get('/upload_access', controller.uploadAccess);// 上传文件
router.post('/upload_url', controller.uploadUrl);// 上传文件url
router.post('/app_upload', controller.appUpload);// 小程序上传文件
router.use('/automatic_rule', require('./automaticRule').router);  //公共下拉
router.use("/template", require("./downloadTemplate").router); //模板下载
router.get('/bank_info', controller.bankInformation);// 账号平台
router.use("/bank", require("./bank").router); //银行信息
router.post('/update_publish', controller.updatePublish);// 批量更新发布日期
router.post('/update_abnormal_keyword', controller.updateAbnormalKeyword);// 批量更新异常关键词
router.post('/add_before_paylog', controller.addBeforePayLog);// 以前的结算数据付款归档
router.post('/add_split_data', controller.addBeforeSplitData);// 刷新以前的拆分表数据
// router.get('/task_info', controller.taskInfo);// 任务下拉
router.get('/platform_account', controller.platformAccount);// 平台账号下拉
router.post('/platform_account', controller.platformAccountPost);// 平台账号下拉
router.get('/settle_type', controller.settleType);// 结算方式
router.get('/platform_tag', controller.platformTag);// 标签下拉
router.get('/export_log', controller.exportLog);
router.get('/export_def', controller.exportLogDef);
router.get('/vip_level', controller.vipLevel);
router.get('/vip_type', controller.vipType);
router.get('/commission_policy', controller.commissionPolicy);
router.get('/commission_type', controller.commissionType);
router.get('/keyword_opts', controller.keywordOpts);
router.get('/user', caches, controller.userList); // 人员下拉
router.get('/content', controller.contentList); // 内容下拉
router.get('/vip_card', controller.vipCard);
router.get('/tag', controller.tag); // 标签
router.get('/reject_reason', controller.rejectReason);// 驳回原因下拉
router.get('/task_content', controller.taskContent);// 任务下拉
router.get('/message_url', controller.messageUrl);
router.get('/mount_type', controller.mountType);// 挂载方式下拉
router.get('/channel', controller.channel);// 渠道下拉
router.get('/video_type', controller.videoType); // 视频标签（作品类型)
router.get('/reward_activity', controller.rewardActivity); // 奖励活动
router.get('/xg_settle_type', controller.xgSettleType);// 星广结算方式
router.get('/xg_task', controller.xgTask);// 星广任务
router.get('/copyright', controller.copyright);// 版权
router.get('/video_collection', controller.videoCollection);// 剧集
router.get('/settlement_method', controller.settlementMethod);// 多来结算方式
router.get('/duolai_applet', controller.duolaiApplet); // 多来小程序下拉
router.get('/authorize_file', controller.authorizeFile);// 版权授权书
router.get('/vip_content', controller.vipContent);// vip提示文案
router.get('/duolai_upload_id', controller.duolaiUploadId);// vip提示文案
exports.router = router;
