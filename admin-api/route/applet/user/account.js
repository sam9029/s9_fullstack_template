var express = require("express");
var router = express.Router();
const controller = require("../../../controller/applet/user/account");

router.post("/update", controller.update); //更新基础信息
router.get('/region_list', controller.getRegion); // 地域列表
// router.get('/share_info', controller.shareInfo); // 获取用户分享信息
router.post("/update_avatar", controller.updateAvatar); //更新上传头像
// router.get('/operation_num', controller.operationNum); // 获取用户收藏数量等
// router.post("/unsubscribe", controller.unsubscribe); //更新上传头像
// router.get("/check_bind", controller.checkBind); //检查用户是否在小果视界绑定
// router.post("/confirm_bind", controller.confirmBind); //确认绑定

exports.router = router;