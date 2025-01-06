const express = require('express');
const router = express.Router();

const controller = require("../../../../controller/applet/realization/drama/applet_plan.js")

const middle = require("../../../middle")
router.get("/list", middle.mergeOption, controller.list);
router.use('/', middle.router);
router.get("/task_list", controller.task_list);
router.post("/task_list", controller.task_list_post);
router.get("/task_def", controller.content_def)
router.get("/bind_log", controller.bind_log)
router.get("/bind_result", controller.bind_result)
router.get("/recommend", controller.recommend)

exports.router = router;