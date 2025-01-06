const express = require('express');
const router = express.Router();
const controller = require('../../../controller/applet/task/index')


router.get('/list', controller.list);
router.post('/add', controller.add);
router.get('/def', controller.def);
router.post('/save', controller.save);
router.get('/my_task', controller.myTask);
router.post('/giveup', controller.giveup); //用户主动放弃任务
router.post('/download', controller.download); //用户下载素材
// router.post('/check', controller.check);
// router.post('/batch_add', controller.batchAdd);
// router.get('/view_url', controller.getViewUrl);
// router.get('/search', controller.getSearch);
router.use("/publish_feedback", require("./publishFeedback").router);


exports.router = router;