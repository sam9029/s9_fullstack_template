var express = require("express");
var router = express.Router();
const controller = require("../../../controller/applet/user/reward");

router.get("/list", controller.list);
router.get("/def", controller.def);

router.post("/list", controller.andList);
router.post("/def", controller.andDef);

exports.router = router;
