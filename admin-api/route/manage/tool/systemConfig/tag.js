var express = require('express');
var router = express.Router();
const controller = require('../../../../controller/manage/tool/systemConfig/tag.js');

router.get('/list', controller.list);  // 列表
router.post('/add', controller.add);  // 新增
router.post('/edit', controller.edit); // 编辑

exports.router = router;