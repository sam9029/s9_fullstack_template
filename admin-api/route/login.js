const express = require('express');
const router = express.Router();
const controller = require('../controller/login');
const { mergeOption, merge, router: auth_router } = require("./middle")
router.post('/login', controller.login);
router.post('/scan_login', controller.scanLogin);
router.get('/captcha', controller.loginCaptcha);
router.get('/logout', auth_router, controller.loginOut);
router.post('/concat_info', controller.concatInfo);
router.post('/send_sms', controller.sendSmsByType);
router.post('/check_sms', controller.checkSmsByType);
// router.post('/register', controller.register);
router.get('/get_phone_number', controller.getPhoneNumber);
router.get('/wechat_access_token', controller.getWXToken);
router.get('/wechat_oa_token', controller.getWXOAToken);
router.get('/screenshot', controller.screenshot);
router.get('/concat', mergeOption, controller.getConcat);
router.get('/slide_code', controller.getSlideCode);
router.post('/unified_login', controller.unifiedLogin);
router.get('/douyin_token', controller.getDouYinToken);
router.post('/scan_auth', merge, controller.scanAuth);
router.post('/scan_location', merge, controller.scanLocation);
exports.router = router;