const express = require('express');
const router = express.Router();
const controller = require('../../controller/public/callback');
const xmlPaser = require("express-xml-bodyparser")
// 外部回调统一接口路径，不允许写到其他路径
router.get('/wechat', xmlPaser({ trim: false, explicitArray: false }), controller.wechat);// 微信的发布公众号回调
router.post('/wechat', xmlPaser({ trim: false, explicitArray: false }), controller.wechat);// 微信的发布公众号回调
// router.get('/apple_pay', controller.sign);
router.post('/douyin', controller.douyin);
router.get('/xunfei', controller.xunfei); //讯飞外部语音转文字回调
router.post('/alipay', controller.alipay); //支付宝支付回调
router.get('/xingtu', controller.xingtu); //星图授权回调
router.get('/xingtu/token', controller.xingtuToken); //获取线上星图token
router.post('/wxpay', controller.wxpay); //微信支付回调
router.post('/apple_pay', controller.apple); //苹果支付回调

router.post('/duolai_refound/:provider/:app_id', controller.duolai); //多来的支付退款回调
router.post('/duolai_refound/:provider', controller.duolai); //多来的支付退款回调

router.post('/duolai_pay/:provider/:app_id', controller.duolai); //多来的支付回调
router.post('/duolai_pay/:provider', controller.duolai); //多来的支付回调

router.get('/ali_real_name', controller.ali_auth); //阿里实名认证
router.post('/duolai_upload', controller.duolai_upload); //多来的上传回调

exports.router = router;
