const express = require('express');
const router = express.Router();

const controller = require("../../../../controller/applet/realization/drama/douyin_story")

const middle = require("../../../middle.js")
router.use('/', middle.router);
router.get("/list", controller.list);
router.post("/avatar", controller.get_avatar);
router.post("/create_plan", controller.create_plan);
router.post("/change_bind", controller.change_bind);
router.get("/recommend", controller.recommend)
// router.get("/task_def", controller.content_def)
// router.get("/bind_log", controller.bind_log)
// router.get("/recommend", controller.recommend)

exports.router = router;