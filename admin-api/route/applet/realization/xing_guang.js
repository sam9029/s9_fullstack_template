const express = require('express');
const router = express.Router();

const controller = require("../../../controller/applet/realization/xing_guang.js")
const { router: user_check } = require("../../middle.js");

router.get("/list", controller.list);
router.get("/define", controller.define);
router.get("/my_task", controller.my_task);
router.post("/register", user_check, controller.register);

exports.router =  router;