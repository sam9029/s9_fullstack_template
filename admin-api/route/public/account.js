const express = require('express');
const router = express.Router();
const controller = require('../../controller/public/account');

router.use('/', require('../middle').router)
router.post('/change_telephone', controller.edit);// 菜单项目产品下拉
router.post('/bind_inviter', controller.bindInviter);// 绑定邀请人
router.post('/edit', controller.edit);// 用户修改个人资料
router.post('/change_password', controller.changePassword);// 修改密码
router.get('/info', controller.info);// 获取账号详情
exports.router = router;
