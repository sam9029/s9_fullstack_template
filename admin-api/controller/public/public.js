const publicModel = require('../../model/public/public');
const exportLogModel = require('../../model/public/export');
const { setCaches } = require('../../db/cackeMiddle');

exports.aptitude = async (req, res) => {
  publicModel.aptitude().then(aptitude => res.send(aptitude)).catch(err => res.send(res.errorFormat(err)));
};
exports.region = async (req, res) => {
  publicModel.region(req.query).then(region => res.send(region)).catch(err => res.send(res.errorFormat(err)));
};
exports.category = async (req, res) => {
  publicModel.category(req.query).then(category => res.send(category)).catch(err => res.send(res.errorFormat(err)));
};
exports.businessType = async (req, res) => {
  publicModel.businessType(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.platform = async (req, res) => {
  publicModel.platform(req.query).then(platform => res.send(platform)).catch(err => res.send(res.errorFormat(err)));
};
exports.categroyNew = async (req, res) => {
  publicModel.category(req.query).then(category => res.send({ code: 0, category })).catch(err => res.send(res.errorFormat(err)));
};
exports.bankInformation = async (req, res) => {
  publicModel.bankInformation(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.platformAccountInfo = async (req, res) => {
  publicModel.platformAccountInfo(req.body).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.upload = async (req, res) => {
  publicModel.upload(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.uploadUrl = async (req, res) => {
  publicModel.uploadUrl(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.uploadAccess = async (req, res) => {
  publicModel.uploadAccess(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.updatePublish = async (req, res) => {
  publicModel.updatePublish(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.updateAbnormalKeyword = async (req, res) => {
  publicModel.updateAbnormalKeyword(req, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.appUpload = async (req, res) => {
  publicModel.appUpload(req, res).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.addBeforePayLog = async (req, res) => {
  publicModel.addBeforePayLog(req, res).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.addBeforeSplitData = async (req, res) => {
  publicModel.addBeforeSplitData(req, res).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.advertiser = async (req, res) => {
  publicModel.advertiser(req.query, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.contentType = async (req, res) => {
  publicModel.contentType(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.promotion = async (req, res) => {
  publicModel.promotion(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
// exports.taskInfo = async (req, res) => {
//   publicModel.taskInfo(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
// };
exports.platformAccount = async (req, res) => {
  publicModel.platformAccount(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.platformAccountPost = async (req, res) => {
  publicModel.platformAccount(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.settleType = async (req, res) => {
  publicModel.settleType(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.platformTag = async (req, res) => {
  publicModel.platformTag(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.exportLog = async (req, res) => {
  exportLogModel.logList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.exportLogDef = async (req, res) => {
  exportLogModel.def(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
exports.vipLevel = async (req, res) => {
  publicModel.vipLevel(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.vipType = async (req, res) => {
  publicModel.vipType(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.vipCard = async (req, res) => {
  publicModel.vipCard(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
//菜单下拉
exports.advertiserMenu = async (req, res) => {
  publicModel.advertiserMenu(req.query, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.commissionPolicy = async (req, res) => {
  publicModel.commissionPolicy(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.commissionType = async (req, res) => {
  publicModel.commissionType(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.keywordOpts = async (req, res) => {
  publicModel.keywordOpts(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.userList = async (req, res) => {
  publicModel.userDownList(req.query, req.$user).then(data => setCaches(req, data)).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}
exports.contentList = async (req, res) => {
  publicModel.contentList(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
}

exports.banner = async (req, res) => {
  publicModel.banner(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.bannerUrl = async (req, res) => {
  publicModel.bannerUrl(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.tag = async (req, res) => {
  publicModel.tag(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.rejectReason = async (req, res) => {
  publicModel.rejectReason(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.commonProblem = async (req, res) => {
  publicModel.commonProblem(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.appVersion = async (req, res) => {
  publicModel.appVersion(req.$platform, req.$oem_type).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.taskContent = async (req, res) => {
  publicModel.taskContent(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.messageUrl = async (req, res) => {
  publicModel.messageUrl(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.mountType = async (req, res) => {
  publicModel.mountType(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.authoringTool = async (req, res) => {
  publicModel.authoringTool(req.body, req.$platform).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.plan_share = async (req, res) => {
  publicModel.plan_share(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.channel = async (req, res) => {
  publicModel.channel(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.course = async (req, res) => {
  publicModel.course(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.videoType = async (req, res) => {
  publicModel.videoType(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.rewardActivity = async (req, res) => {
  publicModel.rewardActivity(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.xgSettleType = async (req, res) => {
  publicModel.xgSettleType(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.xgTask = async (req, res) => {
  publicModel.xgTask(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.copyright = async (req, res) => {
  publicModel.copyright(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.videoCollection = async (req, res) => {
  publicModel.videoCollection(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
exports.settlementMethod = async (req, res) => {
  publicModel.settlementMethod(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.sync_applet_plan = async (req, res) => {
  publicModel.sync_applet_plan(req.body, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.mcn_list = async (req, res) => {
  publicModel.mcn_list(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.duolaiApplet = async (req, res) => {
  publicModel.duolaiApplet(req.query).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.authorizeFile = async (req, res) => {
  publicModel.authorizeFile(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.mainContentAdv = async (req, res) => {
  publicModel.mainContentAdv(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.withdrawalMethod = async (req, res) => {
  publicModel.withdrawalMethod(req.query, req.$user).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.vipContent = async (req, res) => {
  publicModel.vipContent(req.query, req.$user, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};

exports.duolaiUploadId = async (req, res) => {
  publicModel.duolaiUploadId(req.query, req.$user, req).then(data => res.send(data)).catch(err => res.send(res.errorFormat(err)));
};
