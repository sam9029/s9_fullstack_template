var express = require("express");
var router = express.Router();
const controller = require("../../../controller/applet/user/vipRebate");

router.get("/list", controller.list);
router.get("/basic_list", controller.basicList);
router.post("/basic_list", controller.andBasicList);
router.get("/month_list", controller.monthList);
router.get("/quarter_list", controller.quarterList);
router.get("/year_list", controller.yearList);
router.get("/test_def", controller.testDef);

exports.router = router;
