const express = require('express');
const router = express.Router();

router.use(function (req, res, next) {
    res.set({ "Content-Type": "application/json; charset=utf-8" });
    next();
});
router.use('/public', require('./applet/public').router);
router.use('/', require('./middle').router);
router.use('/marking', require('./marking/index').router);
router.use('/user', require('./applet/user/index').router);
//判断数据 添加header





exports.router = router;
