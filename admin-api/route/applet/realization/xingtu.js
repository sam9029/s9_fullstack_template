const express = require('express');
const router = express.Router();

const controller = require("../../../controller/applet/realization/xingtu.js")
const { router: user_check } = require("../../middle.js");

router.get("/list", controller.list);
router.post("/list", controller.listPost);

router.post('/join_task', controller.join);
router.get("/my_task", controller.my_task);
router.post("/my_task", controller.myTask);

router.get("/pull_down_list", controller.pullDownList);
router.get('/task_details', controller.taskDetails);
exports.router =  router;