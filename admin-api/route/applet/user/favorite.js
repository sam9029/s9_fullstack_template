var express = require("express");
var router = express.Router();
const controller = require("../../../controller/applet/user/favorite");

router.get('/list', controller.list); 
router.get('/new_list', controller.newList); 

exports.router = router;