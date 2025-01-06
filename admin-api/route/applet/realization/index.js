const express = require('express');
const router = express.Router();

router.use('/drama/main', require('./drama/main').router);
router.use('/xing_guang', require("../../middle").mergeOption, require("./xing_guang").router);
router.use("/drama/workbench", require("../../middle").router, require('./drama/workbench').router)
router.use("/drama/applet_plan", require('./drama/applet_plan').router)
router.use("/drama/douyin_story", require('./drama/douyin_story').router)
router.use("/public", require("./public/index").router);
router.use('/original_video', require("./originalVideo").router);
router.use('/xingtu', require("../../middle").mergeOption, require("./xingtu").router);

exports.router = router;