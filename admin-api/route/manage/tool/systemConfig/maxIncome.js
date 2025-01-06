var express = require('express');
var router = express.Router();
const controller = require('../../../../controller/manage/tool/systemConfig/maxIncome');

router.get('/list', controller.list);  // 列表
router.post('/edit', controller.edit); // 编辑

exports.router = router;