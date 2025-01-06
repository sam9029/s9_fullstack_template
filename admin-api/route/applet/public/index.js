const express = require("express");
const controller = require("../../../controller/applet/public/index");

const router = express.Router();
const share_plan_router = express.Router();
router.use('/', require('../../middle').router);
share_plan_router.get("/token", controller.sharePlanToken);
share_plan_router.get("/def", controller.sharePlanDef);
share_plan_router.post("/publish", controller.sharePlanPublish);

router.use('/share_plan', share_plan_router);





exports.router = router;
