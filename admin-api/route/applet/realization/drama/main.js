const express = require('express');
const router = express.Router();

const controller = require("../../../../controller/applet/realization/drama/main.js")

const middle = require("../../../middle")
const { caches } = require("../../../../db/cackeMiddle")

router.get("/list", caches, middle.mergeOption, controller.list);
router.get("/def",  middle.router, controller.define);
router.post("/favorite", middle.router, controller.favorite)

exports.router = router;