const express = require("express");
const router = express.Router();
const controller = require("../../../controller/applet/user/opinion");

router.get("/list", controller.list);
router.post("/add", controller.add);
router.get("/def", controller.def);

exports.router = router;
