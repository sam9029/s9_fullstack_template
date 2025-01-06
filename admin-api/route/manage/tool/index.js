const express = require('express');
const router = express.Router();

router.use('/system_config', require('./systemConfig').router); // 系统配置
router.use('/approval_process', require('./approvalProcess').router); // 审批管理
router.use('/message', require('./message').router); // 消息管理
router.use('/approval_process_v2', require('./approvalProcessV2').router); // 审批管理

exports.router = router;