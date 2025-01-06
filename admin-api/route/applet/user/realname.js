var express = require("express");
var router = express.Router();
const controller = require("../../../controller/applet/user/realname");
router.post("/make_certify_id", controller.makeCertifyId);
router.post("/certify_result", controller.getCertifyResult);

exports.router = router;
