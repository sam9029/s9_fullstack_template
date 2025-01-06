const express = require('express');
const router = express.Router();
const controller = require("../../../../controller/applet/realization/public/index")
const middle = require("../../../middle")

router.get("/income", middle.router, controller.totalIncome);

exports.router = router;