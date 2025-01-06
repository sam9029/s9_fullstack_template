const express = require('express');
const router = express.Router();
const controller = require('../../../../controller/applet/realization/originalVideo')
const middle = require("../../../middle")

router.get("/list", middle.router, controller.list);
router.post("/receive", middle.router, controller.receiveVideo);
router.post("/delete", middle.router, controller.deleteVideo);
router.get("/video_config", middle.router, controller.getVideoConfig);
router.get("/list_new", middle.router, controller.newList);
router.get('/query_downlist', middle.router, controller.queryDownlist);
router.get('/platform_advertiser', middle.router, controller.platformCotent);
router.post('/batch_download', middle.router, controller.batchDownload);
router.get('/video_type', middle.router, controller.videoType);
router.post('/update_download_times', middle.router, controller.updateDownloadTimes);

exports.router = router;