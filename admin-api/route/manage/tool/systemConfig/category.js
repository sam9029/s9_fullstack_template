var express = require('express');
var router = express.Router();
const controller = require('../../../../controller/manage/tool/systemConfig/category');

router.get('/list', controller.list);  // 列表
router.post('/add', controller.add);  // 新增
router.post('/edit', controller.edit); // 编辑
router.post('/del', controller.del); // 删除
router.get('/def', controller.def); // 详情
router.post('/update_status', controller.updateStatus); // 详情

exports.router = router;