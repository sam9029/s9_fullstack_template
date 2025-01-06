const express = require('express');
const router = express.Router();

router.use('/account', require('./account').router); // 用户信息
router.use('/opinion', require('./opinion').router); // 意见反馈
// router.use('/invite', require('./invite').router); // 邀请记录
// router.use('/wallet', require('./wallet').router); // 
// router.use('/favorite', require('./favorite').router); // 收藏记录
// router.use('/watch', require('./watch').router); // 浏览记录
// router.use('/message', require('./message').router); // 消息记录
// router.use('/vip_rebate', require('./vipRebate').router); // 会员佣金
// router.use('/publish_rebate', require('./publishRebate').router); // 发布佣金
// router.use('/reward', require('./reward').router); // 奖励收益
router.use('/realname', require('./realname').router); // 实名认证

exports.router = router;
