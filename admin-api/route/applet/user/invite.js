var express = require("express");
var router = express.Router();
const controller = require("../../../controller/applet/user/invite");

// router.post("/update", controller.update); //更新基础信息
router.get('/info', controller.info); // 分享页详情
router.get('/total', controller.total); // 邀请记录汇总
router.get("/list", controller.list); //邀请记录列表
router.get("/activation_record", controller.activation_record); //会员开通记录

exports.router = router;