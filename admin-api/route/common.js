const express = require('express');
const router = express.Router();
const controller = require('../controller/common');
router.get('/task_hall', controller.taskHall); //小程序任务大厅
router.get('/task_detial', controller.taskDetial); //任务大厅详情
exports.router = router;