const express = require('express');
const router = express.Router();
const controller = require('../../controller/public/bank');

router.get('/list', controller.list);
router.post('/unbind', controller.unbind);
router.post('/sign', controller.sign);
router.post('/check', controller.check);
// router.post('/sort', controller.sort);
// router.get('/def', controller.def);
// router.get('/verify_info', controller.verifyInfo);
// router.get('/record', controller.record);
// router.post('/payment_info', controller.getPaymentInfo);

exports.router = router;
