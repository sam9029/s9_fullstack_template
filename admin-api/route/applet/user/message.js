var express = require("express");
var router = express.Router();
const controller = require("../../../controller/applet/user/message");

router.get('/list', controller.list); 
router.get('/def', controller.def); 
router.get('/type_list', controller.typeList); 

exports.router = router;