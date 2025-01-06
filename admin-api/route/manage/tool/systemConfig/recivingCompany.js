var express = require('express');
var router = express.Router();
const controller = require('../../../../controller/manage/tool/systemConfig/recivingCompany');

router.get('/list', controller.list); // 列表
router.post('/add', controller.add); // 收款主体新增
router.post('/update', controller.update); // 收款主体更新

exports.router = router;