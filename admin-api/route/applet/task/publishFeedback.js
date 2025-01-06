const express = require('express');
const router = express.Router();
const controller = require('../../../controller/applet/task/publishFeedback')

router.get('/list', controller.list);
router.post('/publish', controller.publish);
router.post('/update', controller.update);
router.get('/def', controller.def);

exports.router = router;