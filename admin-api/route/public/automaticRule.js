const express = require('express');
const router = express.Router();
const controller = require('../../controller/public/automaticRule');

router.get('/list', controller.list);// 自动规则列表
router.get('/def', controller.get);// 查询单条自动规则
router.post('/add', controller.add);// 增加自动规则
router.post('/save', controller.save);// 修改自动规则


exports.router = router;
