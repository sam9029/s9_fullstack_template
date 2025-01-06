var express = require("express");
var router = express.Router();
const controller = require("../../../../controller/manage/tool/message/index");

router.get("/list", controller.list); // 列表
router.post("/add", controller.add); // 新增
router.get("/def", controller.def); // 详情
router.post("/del", controller.del); //
router.post("/update", controller.update); //

exports.router = router;
