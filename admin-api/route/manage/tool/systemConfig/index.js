const express = require('express');
const router = express.Router();

router.use('/platform', require('./platform').router); // 平台管理
router.use('/category', require('./category').router); // 品类管理
router.use('/work_period', require('./workPeriod').router); // 作品周期
router.use('/keyword_content', require('./keywordContent').router); // 关键词内容
router.use('/max_income', require('./maxIncome').router); // 最高收益
router.use('/material', require('./material').router); // 系统配置
router.use('/platform_tag', require('./platformTag').router); // 账号标签
router.use('/vip_type', require('./vipType').router); // 会员卡类型
router.use('/vip_level', require('./vipLevel').router); // 会员卡等级
router.use('/commission_policy', require('./commissionPolicy').router); // 返利佣金政策
router.use('/catalog', require('./catalog').router); // 目录
router.use('/tag', require('./tag').router); // 目录
router.use('/reciving_company', require('./recivingCompany').router); // 收款主体
router.use('/version', require('./version').router); //app 版本
router.use('/video_type', require('./videoType').router); // 原创视频作品类型
exports.router = router;