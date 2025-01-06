var express = require('express');
var router = express.Router();
const controller = require('../../controller/marking/router');


router.get('/tree', controller.tree);  //获取路由树形结构
router.get('/channel_tree', controller.channel_tree);  //获取渠道选择器的树形结构
router.get('/list', controller.list);
router.get('/def', controller.def); //获取单条路由详情
router.post('/add', controller.add);
router.post('/edit', controller.edit); //修改
router.post('/del', controller.del); //删除
// router.get('/data_tree', controller.dataTree); //获取数据权限树形结构


exports.router = router;