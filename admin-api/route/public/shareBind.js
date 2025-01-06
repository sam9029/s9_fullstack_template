const express = require('express');
const router = express.Router();
const controller = require('../../controller/public/shareBind');
// router.get('/apple_pay', controller.sign);
// router.post('/douyin', controller.douyin);
router.get('/info', controller.shareInfo); //获取邀请码信息
router.post('/login', controller.login); //分享页短信登录
// router.get('/alipay', controller.getAlipay); //支付宝支付回调
// router.post('/wxpay', controller.wxpay); //微信支付回调
// router.post('/apple_pay', controller.apple); //苹果支付回调

exports.router = router;
