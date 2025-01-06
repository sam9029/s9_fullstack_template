const express = require('express');
const router = express.Router();


const controller = require("../../../../controller/applet/realization/drama/workbench")

router.get("/task_list", controller.task_list);
router.post("/task_list", controller.task_list_post);
router.get("/task_def", controller.task_define);
router.get("/recommend", controller.recommend);
// kwd
router.get("/my_kwd_task", controller.my_kwd_task);
router.post("/my_kwd_task", controller.my_kwd_task_post);
router.get("/analysis_link", controller.analysis_link);
router.get("/book_list", controller.book_list);
// drama
router.get("/my_drama_task", controller.my_drama_task);
router.post("/my_drama_task", controller.my_drama_task_post);
router.get("/my_plan", controller.my_plan);
router.post("/my_plan", controller.my_plan_post);
router.post("/create_plan", controller.create_plan);
router.post("/wx_publish", controller.create_wx_publish);
router.post("/plan_status", controller.plan_status);
router.get("/content_platform", controller.get_content_platform);

exports.router = router;