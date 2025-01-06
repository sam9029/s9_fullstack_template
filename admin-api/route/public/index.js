const express = require('express');
const router = express.Router();

// router.use('/', require('../middle').router);
router.use('/account', require('./account').router);  //个人中心公共接口
router.use('/', require('./public').router);  //公共下拉

exports.router = router;