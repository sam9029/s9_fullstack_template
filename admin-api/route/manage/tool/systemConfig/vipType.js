var express = require('express');
var router = express.Router();
const controller = require('../../../../controller/manage/tool/systemConfig/vipType');

router.get('/list', controller.list);  // 列表
router.post('/add', controller.add);  // 新增
router.post('/del', controller.del); // 删除
router.get('/def', controller.def); // 详情

exports.router = router;