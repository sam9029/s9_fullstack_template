const express = require('express');
const router = express.Router();

router.use('/user',require('./user').router); // 用户角色信息
router.use('/router',require('./router').router); // 菜单管理，路由控制
router.use('/company',require('./company').router); // 公司管理，路由控制
router.use('/role',require('./role').router); // 角色管理，路由控制
router.use('/dept',require('./dept').router); // 部门管理，路由控制

exports.router = router;

