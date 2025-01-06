const express = require("express");
const router = express.Router();

router.use(function (req, res, next) {
  res.set({ "Content-Type": "application/json; charset=utf-8" });
  next();
});

//除公共外，这里对应顶部菜单 一级菜单
router.use("/", require("./middle").router);
router.use("/marking", require("./marking/index").router);
router.use("/tool", require("./manage/tool").router);

//判断数据 添加header

exports.router = router;
